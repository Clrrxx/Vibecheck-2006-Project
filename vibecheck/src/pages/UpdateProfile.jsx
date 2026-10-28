import { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { ref, serverTimestamp, set } from "firebase/database";
import { signOut, updateProfile as updateAuthProfile } from "firebase/auth";
import { auth, database } from "../firebase";
import useAccountProfile from "../data/useAccountProfile";
import "./UpdateProfile.css";

const STEAM_ERRORS = {
  expired: "That Steam login took too long. Please try again.",
  invalid: "We couldn't verify your Steam login. Please try again.",
  server: "Something went wrong while talking to Steam. Please try again.",
};

const hours = (minutes) => Math.round((minutes || 0) / 6) / 10; // minutes -> hours, 1 decimal

// Calls our backend with the user's Firebase ID token.
async function callApi(user, path, method = "POST") {
  const token = await user.getIdToken();
  let response;
  try {
    response = await fetch(path, { method, headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error("Can't reach the VibeCheck server. Is it running? (cd server && npm start)");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

/**
 * Edit owner names and coordinate authenticated Steam-link lifecycle actions.
 * @returns {import('react').ReactElement} Account/Steam management page.
 */
function UpdateProfile() {
  const user = useOutletContext();
  const { profile, steam, loading } = useAccountProfile(user);
  const [searchParams, setSearchParams] = useSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [steamBusy, setSteamBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  // Fill the form once the saved profile arrives (without overwriting what the user is typing).
  useEffect(() => {
    if (loading || loaded) return;
    setFirstName(profile?.firstName ?? user.displayName?.split(" ")[0] ?? "");
    setLastName(profile?.lastName ?? user.displayName?.split(" ").slice(1).join(" ") ?? "");
    setLoaded(true);
  }, [loading, loaded, profile, user]);

  // Show the result when Steam sends the user back to this page, then clean the URL.
  useEffect(() => {
    const result = searchParams.get("steam");
    if (!result) return;
    setMessage(result === "connected"
      ? { type: "success", text: "Steam account connected." }
      : { type: "error", text: STEAM_ERRORS[searchParams.get("reason")] ?? STEAM_ERRORS.server });
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  /**
   * Save validated names and update the Firebase Auth display name.
   * @returns {Promise<unknown>} Completion or an early visible validation notice.
   */
  async function handleSave() {
    if (!database) return setMessage({ type: "error", text: "Database isn't configured (missing VITE_FIREBASE_DATABASE_URL)." });
    const first = firstName.trim();
    const last = lastName.trim();
    if (!first || !last) return setMessage({ type: "error", text: "Please enter your first and last name." });

    setSaving(true);
    setMessage(null);
    try {
      await set(ref(database, `users/${user.uid}/profile`), { firstName: first, lastName: last, updatedAt: serverTimestamp() });
      await updateAuthProfile(user, { displayName: `${first} ${last}` });
      setMessage({ type: "success", text: "Profile saved." });
    } catch (error) {
      console.error("Saving profile failed:", error);
      setMessage({ type: "error", text: "We couldn't save your profile. Check your connection and the database rules." });
    } finally {
      setSaving(false);
    }
  }

  /**
   * Request a verified Steam login URL and redirect to Steam.
   * @returns {Promise<void>} Redirect initiation or visible failure.
   */
  async function connectSteam() {
    setSteamBusy(true);
    setMessage(null);
    try {
      const { url } = await callApi(user, "/api/steam/start");
      window.location.href = url; // Steam's own login page
    } catch (error) {
      setMessage({ type: "error", text: error.message });
      setSteamBusy(false);
    }
  }

  /**
   * Refresh the current owner's linked Steam import using an ID token.
   * @returns {Promise<void>} Completion with a success/error notice.
   */
  async function syncSteam() {
    setSteamBusy(true);
    setMessage(null);
    try {
      await callApi(user, "/api/steam/sync");
      setMessage({ type: "success", text: "Steam data refreshed." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSteamBusy(false);
    }
  }

  /**
   * Confirm and remove the Steam link; server snapshot cleanup remains planned.
   * @returns {Promise<void>} Completion after confirmation, removal or visible failure.
   */
  async function disconnectSteam() {
    if (!window.confirm("Disconnect your Steam account? Your imported game data will be removed.")) return;
    setSteamBusy(true);
    setMessage(null);
    try {
      await callApi(user, "/api/steam", "DELETE");
      setMessage({ type: "success", text: "Steam account disconnected." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSteamBusy(false);
    }
  }

  const topGames = (steam?.games ?? []).slice(0, 5);

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <Link className="profile-brand" to="/">
          <span />
          vibecheck
        </Link>

        <div className="profile-topbar-actions">
          <Link to="/" className="profile-back">
            ← Back to dashboard
          </Link>
          <button type="button" className="profile-logout" onClick={() => signOut(auth)}>
            Log out
          </button>
        </div>
      </header>

      <section className="profile-container">
        <header className="profile-heading">
          <span>MY PROFILE</span>
          <h1>Update your gamer profile.</h1>
          <p>
            Keep your information up to date and connect your gaming accounts
            to improve your VibeCheck experience.
          </p>
        </header>

        {message && (
          <p className={`profile-message ${message.type}`} role={message.type === "error" ? "alert" : "status"}>
            {message.text}
          </p>
        )}

        <section className="profile-card">
          <div className="profile-section-heading">
            <div>
              <span>ACCOUNT</span>
              <h2>Basic information</h2>
            </div>
          </div>

          <div className="profile-fields">
            <label>
              <span>First name</span>
              <input type="text" placeholder="Alex" value={firstName} maxLength={40}
                autoComplete="given-name" disabled={!loaded}
                onChange={(e) => setFirstName(e.target.value)} />
            </label>

            <label>
              <span>Last name</span>
              <input type="text" placeholder="Tan" value={lastName} maxLength={40}
                autoComplete="family-name" disabled={!loaded}
                onChange={(e) => setLastName(e.target.value)} />
            </label>

            <label className="profile-field-wide">
              <span>Email</span>
              <input type="email" value={user.email ?? ""} disabled readOnly />
            </label>
          </div>
        </section>

        <section className="profile-card">
          <div className="profile-section-heading">
            <div>
              <span>GAMING ACCOUNT</span>
              <h2>Connect Steam</h2>
            </div>
          </div>

          <div className="steam-connect">
            {steam?.avatar ? <img className="steam-avatar" src={steam.avatar} alt="" /> : <div className="steam-icon">S</div>}

            <div className="steam-info">
              <h3>{steam ? steam.personaName || "Steam account" : "Steam"}</h3>
              <p>
                {steam
                  ? `Connected · ${steam.gameCount} games · ${hours(steam.totalMinutes)} hours total`
                  : "Connect your Steam account to import your gaming activity, games and playtime."}
              </p>
            </div>

            {steam ? (
              <div className="steam-buttons">
                <button type="button" className="steam-button" onClick={syncSteam} disabled={steamBusy}>
                  {steamBusy ? "Working…" : "Refresh"}
                </button>
                <button type="button" className="steam-button secondary" onClick={disconnectSteam} disabled={steamBusy}>
                  Disconnect
                </button>
              </div>
            ) : (
              <button type="button" className="steam-button" onClick={connectSteam} disabled={steamBusy}>
                {steamBusy ? "Opening Steam…" : "Connect Steam"}
              </button>
            )}
          </div>

          {steam && !steam.gamesVisible && (
            <p className="profile-message error">
              Your Steam game list is private. In Steam go to Profile → Edit Profile → Privacy Settings, set
              “Game details” to Public, then press Refresh.
            </p>
          )}

          {steam && steam.gamesVisible && (
            <div className="steam-summary">
              <div className="steam-stats">
                <div><b>{steam.gameCount}</b><span>games owned</span></div>
                <div><b>{hours(steam.totalMinutes)}</b><span>hours total</span></div>
                <div><b>{hours(steam.twoWeekMinutes)}</b><span>hours in last 2 weeks</span></div>
              </div>
              {topGames.length > 0 && (
                <ol className="steam-top-games">
                  {topGames.map((game) => (
                    <li key={game.appId}><span>{game.name}</span><small>{hours(game.minutesTotal)} h</small></li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        <div className="profile-actions">
          <Link to="/" className="cancel-button">
            Cancel
          </Link>

          <button type="button" className="save-button" onClick={handleSave} disabled={saving || !loaded}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>
    </main>
  );
}

export default UpdateProfile;
