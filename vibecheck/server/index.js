// VibeCheck backend: links a Steam account to a signed-in Firebase user.
// Keeps the Steam API key and Firebase admin credentials off the browser.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import express from "express";
import { registerMessageRoutes } from "./messages.js";
import { registerConnectionRoutes } from "./connections.js";
import { matchingProfilesFromUsers } from "./gamerMatching.js";
import { normalizeSteamGames } from "./steamGames.js";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase, ServerValue } from "firebase-admin/database";

const {
  STEAM_API_KEY,
  FIREBASE_DATABASE_URL,
  GOOGLE_SERVICE_ACCOUNT_FILE = "./serviceAccountKey.json",
  APP_URL = "http://localhost:5173",
  PORT = 3001,
} = process.env;

for (const [name, value] of Object.entries({ STEAM_API_KEY, FIREBASE_DATABASE_URL })) {
  if (!value || value.startsWith("your_") || value.includes("your-database")) {
    console.error(`Missing ${name} in server/.env`);
    process.exit(1);
  }
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(GOOGLE_SERVICE_ACCOUNT_FILE, "utf8"));
} catch {
  console.error(`Could not read the service account file at ${GOOGLE_SERVICE_ACCOUNT_FILE}. See STEAM_SETUP.md.`);
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount), databaseURL: FIREBASE_DATABASE_URL });
const adminAuth = getAuth();
const db = getDatabase();

const app = express();
app.use(express.json());

// ---------- helpers ----------

// Short-lived, single-use "state" values tie a Steam login back to the Firebase user who started it.
const pending = new Map(); // state -> { uid, expires }
/**
 * @param {string} uid Verified Firebase owner initiating a Steam link.
 * @returns {string} Random, process-local, single-use state valid for ten minutes.
 */
function createState(uid) {
  const state = randomBytes(24).toString("hex");
  pending.set(state, { uid, expires: Date.now() + 10 * 60 * 1000 });
  return state;
}
/**
 * @param {string} state Callback state; removed even if expired.
 * @returns {string|null} Initiating UID for an unused valid state, otherwise null.
 */
function consumeState(state) {
  const entry = pending.get(state);
  pending.delete(state);
  return entry && entry.expires > Date.now() ? entry.uid : null;
}
setInterval(() => {
  for (const [state, { expires }] of pending) if (expires < Date.now()) pending.delete(state);
}, 60 * 1000).unref();

// Reads "Authorization: Bearer <Firebase ID token>" and attaches req.uid.
/**
 * Express authorization middleware; derives req.uid from a verified Firebase token.
 * @param {object} req Request bearing Authorization: Bearer token.
 * @param {object} res Response used for an HTTP 401 rejection.
 * @param {Function} next Continuation called only after successful verification.
 * @returns {Promise<unknown>} Middleware completion or rejection response.
 */
async function requireUser(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token) return res.status(401).json({ error: "Not signed in." });
  try {
    req.uid = (await adminAuth.verifyIdToken(token)).uid;
    next();
  } catch {
    res.status(401).json({ error: "Your login has expired. Please log in again." });
  }
}

const steamApi = async (path, params) => {
  const url = new URL(`https://api.steampowered.com/${path}`);
  url.search = new URLSearchParams({ key: STEAM_API_KEY, format: "json", ...params });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Steam API ${path} returned ${response.status}`);
  return response.json();
};

// Fetches profile + owned games and writes them to users/<uid>/steam.
/**
 * Import and persist Steam data for an already verified account owner.
 * Steam record and snapshot writes are separate; callers must handle partial failures.
 * @param {string} uid Owner derived from a verified token or consumed link state.
 * @param {string} steamId Verified Steam identity, or the owner's previously linked ID.
 * @returns {Promise<object>} Imported Steam record after writes complete.
 * @throws {Error} External API, missing player or database write failure.
 */
async function syncSteam(uid, steamId) {
  const [summaryData, gamesData, recentData] = await Promise.all([
    steamApi("ISteamUser/GetPlayerSummaries/v0002/", { steamids: steamId }),
    steamApi("IPlayerService/GetOwnedGames/v0001/", {
      steamid: steamId,
      include_appinfo: 1,
      include_played_free_games: 1,
    }),
    steamApi("IPlayerService/GetRecentlyPlayedGames/v0001/", { steamid: steamId }),
  ]);

  const player = summaryData.response?.players?.[0];
  if (!player) throw new Error("Steam profile not found.");

  // If "Game details" is private, Steam returns no "games" field at all.
  const rawGames = gamesData.response?.games;
  const gamesVisible = Array.isArray(rawGames);
  const games = normalizeSteamGames(rawGames, recentData.response?.games ?? []);

  const totalMinutes = games.reduce((sum, g) => sum + g.minutesTotal, 0);
  const twoWeekMinutes = games.reduce((sum, g) => sum + g.minutesLast2Weeks, 0);

  const steam = {
    steamId,
    personaName: player.personaname ?? "",
    avatar: player.avatarfull ?? "",
    profileUrl: player.profileurl ?? "",
    gamesVisible,
    gameCount: games.length,
    totalMinutes,
    twoWeekMinutes,
    games,
    lastSynced: ServerValue.TIMESTAMP,
  };

  await db.ref(`users/${uid}/steam`).set(steam);

  // Steam only reports lifetime and last-2-weeks totals. Saving a snapshot on every sync lets
  // other features work out playtime between two dates (e.g. hours played this week).
  if (gamesVisible) {
    await db.ref(`users/${uid}/steamSnapshots`).push({
      at: ServerValue.TIMESTAMP,
      totalMinutes,
      twoWeekMinutes,
    });
  }
  return steam;
}

// ---------- routes ----------

registerConnectionRoutes(app, db, requireUser);
registerMessageRoutes(app, db, requireUser);

// Read existing assessments through the server so the users tree stays owner-only.
app.get("/api/gamer-matches", requireUser, async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const snapshot = await db.ref("users").get();
    res.json({ profiles: matchingProfilesFromUsers(snapshot.val(), req.uid) });
  } catch (error) {
    console.error("Gamer matching failed:", error);
    res.status(500).json({ error: "Couldn’t load gamers. Please try again shortly." });
  }
});

// 1) Browser asks for a Steam login URL.
app.post("/api/steam/start", requireUser, (req, res) => {
  const state = createState(req.uid);
  const returnTo = `${APP_URL}/api/steam/callback?state=${state}`;
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": APP_URL,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  res.json({ url: `https://steamcommunity.com/openid/login?${params}` });
});

// 2) Steam sends the user back here. We must verify the response really came from Steam.
app.get("/api/steam/callback", async (req, res) => {
  const fail = (reason) => res.redirect(`${APP_URL}/update-profile?steam=error&reason=${encodeURIComponent(reason)}`);

  try {
    const uid = consumeState(String(req.query.state || ""));
    if (!uid) return fail("expired");

    const expectedReturnTo = `${APP_URL}/api/steam/callback?state=${req.query.state}`;
    if (req.query["openid.return_to"] !== expectedReturnTo) return fail("invalid");

    // Ask Steam to confirm its own signature.
    const verify = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) if (key.startsWith("openid.")) verify.set(key, String(value));
    verify.set("openid.mode", "check_authentication");

    const steamReply = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: verify,
    });
    if (!(await steamReply.text()).includes("is_valid:true")) return fail("invalid");

    const match = /^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/.exec(String(req.query["openid.claimed_id"] || ""));
    if (!match) return fail("invalid");

    await syncSteam(uid, match[1]);
    res.redirect(`${APP_URL}/update-profile?steam=connected`);
  } catch (error) {
    console.error("Steam callback failed:", error);
    fail("server");
  }
});

// 3) Re-fetch games for an already linked account.
app.post("/api/steam/sync", requireUser, async (req, res) => {
  try {
    const snapshot = await db.ref(`users/${req.uid}/steam/steamId`).get();
    if (!snapshot.exists()) return res.status(400).json({ error: "No Steam account linked." });
    const { gamesVisible, gameCount } = await syncSteam(req.uid, snapshot.val());
    res.json({ gamesVisible, gameCount });
  } catch (error) {
    console.error("Steam sync failed:", error);
    res.status(502).json({ error: "Could not reach Steam. Try again shortly." });
  }
});

// 4) Unlink.
app.delete("/api/steam", requireUser, async (req, res) => {
  await db.ref(`users/${req.uid}/steam`).remove();
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`VibeCheck server listening on http://localhost:${PORT}`));
