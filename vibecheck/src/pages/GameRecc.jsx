import { useEffect, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { GAME_CACHE_KEY, recommendationKey, readRecommendations } from "../data/gameReccCache";
import { useMemo } from "react";
import useQuestResult from "../data/useQuestResult";
import useAccountProfile from "../data/useAccountProfile";
import { questToProfile } from "../data/questToProfile";
import "./GameRecc.css";
import "./SteamRecommendations.css";
import SteamLibraryPanel from "../components/SteamLibraryPanel";



const RAWG_BASE = "https://api.rawg.io/api";
const RAWG_KEY = import.meta.env.VITE_RAWG_KEY; // put VITE_RAWG_KEY=... in .env
const CACHE_KEY = GAME_CACHE_KEY;
const SAVED_KEY = "vibecheck.savedGames";
const LOG_KEY = "vibecheck.matchLog";



const TRAITS = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];

/* Entity data */

const GENRES = [
  { slug: "strategy", label: "Strategy", adjacent: ["simulation", "puzzle"], affinity: { openness: 0.4, conscientiousness: 1, extraversion: -0.1, agreeableness: 0, neuroticism: -0.2 } },
  { slug: "role-playing-games-rpg", label: "RPG", adjacent: ["adventure", "action"], affinity: { openness: 1, conscientiousness: 0.3, extraversion: 0, agreeableness: 0.4, neuroticism: 0.2 } },
  { slug: "action", label: "Action", adjacent: ["shooter", "adventure"], affinity: { openness: 0.2, conscientiousness: -0.2, extraversion: 0.7, agreeableness: -0.4, neuroticism: 0.1 } },
  { slug: "adventure", label: "Adventure", adjacent: ["role-playing-games-rpg", "puzzle"], affinity: { openness: 1, conscientiousness: 0, extraversion: 0, agreeableness: 0.3, neuroticism: 0.2 } },
  { slug: "puzzle", label: "Puzzle", adjacent: ["strategy", "casual"], affinity: { openness: 0.5, conscientiousness: 0.8, extraversion: -0.5, agreeableness: 0.1, neuroticism: -0.1 } },
  { slug: "simulation", label: "Simulation", adjacent: ["strategy", "casual"], affinity: { openness: 0.3, conscientiousness: 0.9, extraversion: -0.3, agreeableness: 0.3, neuroticism: -0.3 } },
  { slug: "shooter", label: "Shooter", adjacent: ["action", "massively-multiplayer"], affinity: { openness: 0, conscientiousness: -0.1, extraversion: 0.8, agreeableness: -0.6, neuroticism: 0.2 } },
  { slug: "massively-multiplayer", label: "MMO", adjacent: ["role-playing-games-rpg", "action"], affinity: { openness: 0.3, conscientiousness: 0.2, extraversion: 1, agreeableness: 0.5, neuroticism: 0 } },
  { slug: "casual", label: "Casual", adjacent: ["puzzle", "simulation"], affinity: { openness: -0.2, conscientiousness: -0.3, extraversion: 0.1, agreeableness: 0.6, neuroticism: 0.3 } },
  { slug: "indie", label: "Indie", adjacent: ["adventure", "puzzle"], affinity: { openness: 1, conscientiousness: -0.1, extraversion: -0.3, agreeableness: 0.2, neuroticism: 0.3 } },
];

const PLATFORMS = [
  { id: "4", label: "PC" },
  { id: "187", label: "PlayStation 5" },
  { id: "186", label: "Xbox Series X/S" },
  { id: "7", label: "Nintendo Switch" },
];

const ESRB_AGE = { Everyone: 0, "Everyone 10+": 10, Teen: 13, Mature: 17, "Adults Only": 18 };

/* Controller logic (GameRecommendationController) */
const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage blocked or full */ }
};



const WEIGHTS_KEY = "vibecheck.genreWeights";
const EVEN_WEIGHT = { save: 1, details: 0.25};

function recordGenreSignal(type, genreSlugs){
  const inc = EVEN_WEIGHT[type];
  if (!inc) return; 
  const weights = readJSON(WEIGHTS_KEY, {});
  for (const slug of genreSlugs) weights[slug] = (Number.isFinite(weights[slug]) ? weights[slug] : 0) + inc;
  writeJSON(WEIGHTS_KEY, weights);
}


function logInteraction(entry) {
  const log = readJSON(LOG_KEY, []);
  writeJSON(LOG_KEY, [...log, { ...entry, at: new Date().toISOString() }].slice(-200));
}

/**
 * Prototype RAWG adapter; the browser key is public. Server extraction is planned.
 * @param {string} path RAWG API path.
 * @param {object} [params] Query parameters.
 * @param {AbortSignal} [signal] Optional cancellation for an abandoned view.
 * @returns {Promise<object>} Parsed RAWG payload.
 * @throws {Error} Non-success HTTP response or failed request.
 */
async function rawgFetch(path, params = {}, signal) {
  const url = new URL(RAWG_BASE + path);
  url.searchParams.set("key", RAWG_KEY);
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== "" && url.searchParams.set(k, v));
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`RAWG responded ${res.status}`);
  return res.json();
}


function toGame(raw) {
  return {
    gameId: String(raw.id),
    title: raw.name,
    genre: raw.genres?.[0]?.name ?? "Unknown",
    genreSlugs: raw.genres?.map((g) => g.slug) ?? [],
    tags: (raw.tags ?? []).filter((t) => t.language === "eng").slice(0, 2).map((t) => t.name),
    ageRating: ESRB_AGE[raw.esrb_rating?.name] ?? null,
    esrb: raw.esrb_rating?.name ?? "Not rated",
    rating: raw.rating ?? 0,
    isTrending: false,
    cover: raw.background_image?.replace("/media/", "/media/crop/600/400/") ?? null, // RAWG-side resize
    description: raw.description_raw ?? "",
  };
}

/**
 * Prototype age filter; unknown ratings pass for adults. Full SRS policy is pending.
 * @param {object[]} games Normalized candidates.
 * @param {number} userAge Caller-supplied age (currently 18 in the page).
 * @returns {object[]} Candidates passing this provisional filter.
 */
function filterByAgeRating(games, userAge) {
  return games.filter((g) => (g.ageRating === null ? userAge >= 18 : g.ageRating <= userAge));
}

// how well one genre suits a trait profile (centred on the 50th percentile).
function genreFit(genre, traits) {
  let raw = 0;
  let span = 0;
  for (const t of TRAITS) {
    raw += genre.affinity[t] * (traits[t] / 100 - 0.5);
    span += Math.abs(genre.affinity[t]);
  }
  return 0.5 + raw / span;
}

function topGenreFor(traits) {
  return [...GENRES].sort((a, b) => genreFit(b, traits) - genreFit(a, traits))[0];
}

const BONUS_CAP = 0.15; //the most in which behavior may add
const HALF_POINT = 5;   //half cap of behaviour

// filter and rank by Big 5 profile.
function matchGamesByTraits(games, traits) {
  const weights = readJSON(WEIGHTS_KEY, {});
  return games
    .map((game) => {
      const fits = game.genreSlugs
        .map((slug) => GENRES.find((g) => g.slug === slug))
        .filter(Boolean)
        .map((g) => genreFit(g, traits));
      const fit = fits.length ? Math.max(...fits) : 0.5;

      const w = Math.max(0, ...game.genreSlugs.map(s => Number.isFinite(weights[s]) ? weights[s] : 0));
      const behavior = w / (w + HALF_POINT);

      return { ...game, relevanceScore: 0.65 * fit + 0.2 * (game.rating / 5) + BONUS_CAP * behavior};
      /* relevance is influenced by 65% user profile, 20% by the fit of game and 15% of behavior so the added
      bonus only influences and nudges, not outright cause a significant shift
      */

    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Request and score trait-based games, broadening the genre when needed.
 * @param {object} options Profile, optional genre/platform and cancellation signal.
 * @returns {Promise<object>} Curated games, inferred genre and fallback notice.
 */
async function getPersonalizedGames({ profile, genre, platform, signal }) {
  const slug = genre || topGenreFor(profile.traitScores).slug;
  const query = (genres) =>
    rawgFetch("/games", { genres, platforms: platform, ordering: "-added", page_size: 24 }, signal);
  const prepare = (data) => filterByAgeRating(data.results.map(toGame), profile.age);

  let games = prepare(await query(slug));
  let broadened = false;

  if (games.length === 0) {
    broadened = true;
    const adjacent = GENRES.find((g) => g.slug === slug)?.adjacent.join(",");
    games = prepare(await query(adjacent));
    if (games.length === 0) games = prepare(await query(undefined)); // overall popularity
  }

  return {
    games: matchGamesByTraits(games, profile.traitScores).slice(0, 6),
    broadened,
    inferredGenre: genre ? null : slug,
  };
}

async function getTrendingGames({ profile, genre, platform, signal }) {
  const to = new Date();
  const from = new Date();
  from.setFullYear(to.getFullYear() - 1);
  const iso = (d) => d.toISOString().slice(0, 10);
  const data = await rawgFetch(
    "/games",
    { genres: genre, platforms: platform, dates: `${iso(from)},${iso(to)}`, ordering: "-added", page_size: 20 },
    signal
  );
  return filterByAgeRating(data.results.map(toGame), profile.age).map((g) => ({ ...g, isTrending: true }));
}

async function getGameDetails(gameId, signal) {
  const raw = await rawgFetch(`/games/${gameId}`, {}, signal);
  return { ...toGame(raw), cover: raw.background_image ?? null };
}

/* Data hook */
function useGameRecc(profile, genre, platform) {
  const cacheKey = recommendationKey(profile, genre, platform);
  const initialState = () => {
    const cached = readRecommendations(cacheKey);
    return cached
      ? { ...cached, cacheKey, status: 'ready', refreshing: !cached.fresh }
      : { cacheKey, status: 'loading', curated: [], trending: [], notice: null, inferredGenre: genre ? null : profile && topGenreFor(profile.traitScores).slug, refreshing: false };
  };
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!profile) return undefined;
    const ctrl = new AbortController();
    const cached = readRecommendations(cacheKey);
    if (cached?.fresh) return () => ctrl.abort();

    (async () => {
      try {
        const [personal, trending] = await Promise.all([
          getPersonalizedGames({ profile, genre, platform, signal: ctrl.signal }),
          getTrendingGames({ profile, genre, platform, signal: ctrl.signal }),
        ]);
        const next = {
          curated: personal.games,
          trending,
          inferredGenre: personal.inferredGenre,
          notice: personal.broadened ? "broadened" : null,
          fetchedAt: Date.now(),
        };
        if (ctrl.signal.aborted) return;
        writeJSON(CACHE_KEY, { ...readJSON(CACHE_KEY, {}), [cacheKey]: next });
        setState({ status: "ready", ...next, cacheKey, refreshing: false });
      } catch (err) {
        if (err.name === "AbortError" || ctrl.signal.aborted) return;
        // 1.1 EX.1: RAWG unavailable, so fall back to the cache and warn that it may be outdated.
        setState(
          cached
            ? { ...cached, cacheKey, status: "ready", notice: "stale", refreshing: false }
            : { cacheKey, status: "error", curated: [], trending: [], notice: null, inferredGenre: null, refreshing: false }
        );
      }
    })();

    return () => ctrl.abort();
  }, [profile, genre, platform, cacheKey]);

  return state.cacheKey === cacheKey ? state : initialState();
}

/* Boundary components */
function GameSkeletons({ compact = false }) {
  return Array.from({ length: 6 }, (_, index) => <div key={index} className={`gm-card gm-skeleton${compact ? ' gm-skeleton--compact' : ''}`} aria-hidden="true">
    <div className="gm-cover" /><div className="gm-card-body"><span /><span /><span /></div>
  </div>);
}

function GameCard({ game, saved, onToggleSave, onDetails, compact = false, index = 0 }) {
  const [coverReady, setCoverReady] = useState(false);
  const fit = game.relevanceScore !== undefined ? Math.round(game.relevanceScore * 100) : null;
  return (
    <article className={`gm-card gm-card--reveal${compact ? " gm-card--compact" : ""}`} style={{ '--reveal-delay': `${Math.min(index, 5) * 35}ms` }}>
      <div className="gm-cover">{game.cover && <img className={coverReady ? 'is-ready' : ''} src={game.cover} alt="" loading={index < 3 ? 'eager' : 'lazy'} decoding="async" onLoad={() => setCoverReady(true)} />}</div>
      <div className="gm-card-body">
        <h3>{game.title}</h3>
        {!compact && fit !== null && (
          <div className="gm-fit" style={{ "--fit": `${fit}%` }}>
            <span>{fit}% fit</span>
            <i />
          </div>
        )}
        {!compact && game.tags.length > 0 && (
          <ul className="gm-tags">{game.tags.map((t) => <li key={t}>{t}</li>)}</ul>
        )}
        <div className="gm-actions">
          {!compact && (
            <button type="button" className="gm-save" aria-pressed={saved} onClick={() => onToggleSave(game)}>
              {saved ? "Saved" : "Save to favorites"}
            </button>
          )}
          <button type="button" onClick={() => onDetails(game.gameId)}>View details</button>
        </div>
      </div>
    </article>
  );
}

function GameGallery({ game }) {
  const [screenshots, setScreenshots] = useState([]);
  const [status, setStatus] = useState("loading");
  const [selectedImage, setSelectedImage] = useState(null);
  const [failedImages, setFailedImages] = useState([]);

  useEffect(() => {
    const ctrl = new AbortController();
    rawgFetch(`/games/${game.gameId}/screenshots`, { page_size: 8 }, ctrl.signal)
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setScreenshots((data.results ?? []).map((shot) => shot.image).filter(Boolean));
        setStatus("ready");
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setStatus("error");
      });
    return () => ctrl.abort();
  }, [game.gameId]);

  const images = [...new Set([game.cover, ...screenshots].filter(Boolean))]
    .filter((url) => !failedImages.includes(url));
  const activeImage = images.includes(selectedImage) ? selectedImage : images[0];
  const markFailed = (url) => setFailedImages((failed) => failed.includes(url) ? failed : [...failed, url]);

  return (
    <section className="gm-gallery" aria-label={`${game.title} image gallery`}>
      <div className="gm-gallery-stage">
        {activeImage ? <img
          key={activeImage}
          src={activeImage}
          alt={`${game.title} — ${activeImage === game.cover ? "game artwork" : `screenshot ${screenshots.indexOf(activeImage) + 1}`}`}
          decoding="async"
          onError={() => markFailed(activeImage)}
        /> : <p>{status === "loading" ? "Loading game images…" : "No images available for this game."}</p>}
      </div>
      {images.length > 1 && <div className="gm-gallery-thumbnails" role="group" aria-label="Choose an image">
        {images.map((url) => <button
          type="button"
          key={url}
          className="gm-gallery-thumbnail"
          aria-label={url === game.cover ? "Show game artwork" : `Show screenshot ${screenshots.indexOf(url) + 1}`}
          aria-pressed={url === activeImage}
          onClick={() => setSelectedImage(url)}
        ><img src={url} alt="" loading="lazy" decoding="async" onError={() => markFailed(url)} /></button>)}
      </div>}
      <p className="gm-gallery-status" role="status">
        {status === "loading" ? "Loading screenshots…" : status === "error" ? "Screenshots could not be loaded." : screenshots.length === 0 ? "No additional screenshots available." : "Select a thumbnail to explore."}
      </p>
    </section>
  );
}

/**
 * Fetch and display a selected game's detail dialog, including load/error states.
 * @param {{gameId: string|number, onClose: Function}} props Selected ID and close handler.
 * @returns {import('react').ReactElement} Detail dialog.
 */
export function GameDetails({ gameId, onClose }) {
  const ref = useRef(null);
  const [game, setGame] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => { ref.current?.showModal(); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    getGameDetails(gameId, ctrl.signal)
      .then(setGame)
      .catch((err) => err.name !== "AbortError" && setFailed(true));
    return () => ctrl.abort();
  }, [gameId]);

  return (
    <dialog
      ref={ref}
      className="gm-dialog"
      aria-label="Game details"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
    >
      <div className="gm-dialog-body">
        {failed && <p>Details could not be loaded. Close this window and try again.</p>}
        {!game && !failed && <p>Loading details…</p>}
        {game && (
          <>
            <h2>{game.title}</h2>
            <p className="gm-meta">{game.genre} · {game.esrb}</p>
            <GameGallery key={game.gameId} game={game} />
            <p className="gm-desc">{game.description || "No description available."}</p>
            <small className="gm-attribution">Game data and images provided by <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a>.</small>
          </>
        )}
        <button type="button" onClick={() => ref.current.close()}>Close</button>
      </div>
    </dialog>
  );
}

/* Page */
export default function GameRecc() {
  const user = useOutletContext();
  const { report, loading } = useQuestResult(user.uid);
  const { profile: account } = useAccountProfile(user);
  
  const age = /* temporarily put 18 */ 18;

  
  const profile = useMemo(() => questToProfile(report, age), [report, age]);

  console.log(JSON.stringify(report?.traits, null, 2), Object.keys(report ?? {}));

  const profileStatus = profile ? "ready" : loading ? "loading" : "missing";
  const [genre, setGenre] = useState("");
  const [platform, setPlatform] = useState("");
  const [saved, setSaved] = useState(() => readJSON(SAVED_KEY, []));
  const [detailsId, setDetailsId] = useState(null);
  const railRef = useRef(null);

  const { status, curated, trending, notice, inferredGenre, refreshing } = useGameRecc(profile, genre, platform);


  if (profileStatus === "loading") {
    return <main className="gm-page gm-gate" aria-busy="true"><p>Loading your profile…</p></main>;
  }

  if (profileStatus === "missing") {
    return (
      <main className="gm-page gm-gate">
        <h1>Finish your gamer profile first</h1>
        <p>Game matches are built from your Big 5 results, so we need those before we can recommend anything.</p>
        <Link className="gm-primary" to="/questionnaire">Take the questionnaire</Link>
        <Link className="gm-primary" to="/game-recommendations/steam">Get matches from your Steam library</Link>
      </main>
    );
  }


  const isSaved = (id) => saved.some((g) => g.gameId === id);

  const toggleSave = (game) => {
    const next = isSaved(game.gameId)
      ? saved.filter((g) => g.gameId !== game.gameId)
      : [...saved, { gameId: game.gameId, title: game.title }];
    setSaved(next);
    writeJSON(SAVED_KEY, next);
    logInteraction({ type: "save", gameId: game.gameId });
  };

  const openDetails = (gameId) => {
    setDetailsId(gameId);
    logInteraction({ type: "details", gameId });
  };

  const changeFilter = (setter, name) => (e) => {
    setter(e.target.value);
    logInteraction({ type: "filter", [name]: e.target.value });
  };

  const scrollRail = (dir) => {
    const rail = railRef.current;
    if (!rail) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  const inferredLabel = GENRES.find((g) => g.slug === inferredGenre)?.label;

  return (
    <div className="gm-page">
      <header className="gm-topbar">
        <Link className="gm-brand" to="/"><span className="gm-logo" />vibecheck</Link>
        <nav aria-label="Primary">
          <Link to="/questionnaire">Quiz</Link>
          <Link to="/game-recommendations" aria-current="page">Archetypes</Link>
          <Link to="/game-recommendations/steam">Steam matches</Link>
        </nav>
      </header>

      <div className="gm-layout">
        <aside className="gm-sidebar" aria-label="Filters">
          <h2 className="gm-archetype">{profile.archetypeTitle}</h2>
          <SteamLibraryPanel onDetails={openDetails} />

          <details open>
            <summary>Genres</summary>
            <select value={genre} onChange={changeFilter(setGenre, "genre")} aria-label="Genre">
              <option value="">Auto (from your profile)</option>
              {GENRES.map((g) => <option key={g.slug} value={g.slug}>{g.label}</option>)}
            </select>
          </details>

          <details open>
            <summary>Platform</summary>
            <select value={platform} onChange={changeFilter(setPlatform, "platform")} aria-label="Platform">
              <option value="">All platforms</option>
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </details>

          <details open>
            <summary>Saved games ({saved.length})</summary>
            {saved.length ? (
              <ul className="gm-saved">
                {saved.map((g) => (
                  <li key={g.gameId}><button type="button" onClick={() => openDetails(g.gameId)}>{g.title}</button></li>
                ))}
              </ul>
            ) : (
              <p className="gm-hint">Save a game and it will appear here.</p>
            )}
          </details>
        </aside>

        <main className="gm-main" aria-busy={status === "loading"}>
          <div className="gm-notice">Discover games based on what you play on Steam. <Link className="gm-primary" to="/game-recommendations/steam">Explore Steam matches →</Link></div>
          {notice === "stale" && (
            <p className="gm-notice" role="status">RAWG is unreachable, so these are your last saved recommendations. They may be outdated.</p>
          )}
          {notice === "broadened" && (
            <p className="gm-notice" role="status">No games matched your profile exactly, so we widened the search to related genres and popular titles.</p>
          )}
          {inferredLabel && status !== "error" && (
            <p className="gm-notice" role="status">
              You haven't picked a genre, so we chose <strong>{inferredLabel}</strong> from your profile.
              <button type="button" onClick={() => setGenre(inferredGenre)}>Keep {inferredLabel}</button>
              <span> Or choose another under Genres.</span>
            </p>
          )}

          <section aria-labelledby="gm-curated">
            <h1 id="gm-curated">Signature games for {profile.archetypeTitle}</h1>
            <p className="gm-load-status" role="status">{status === 'loading' ? 'Finding your matches…' : refreshing ? 'Updating your recommendations…' : ''}</p>
            {status === "error" && (
              <p className="gm-notice" role="alert">
                We couldn't load games and have no saved list yet.
                <button type="button" onClick={() => window.location.reload()}>Refresh</button>
              </p>
            )}
            {status === "ready" && curated.length === 0 && (
              <p className="gm-hint">No games found for this platform. Try All platforms.</p>
            )}
            <div className="gm-rail">
              {status === 'loading' && <GameSkeletons />}
              {curated.map((g, index) => (
                <GameCard key={g.gameId} game={g} index={index} saved={isSaved(g.gameId)} onToggleSave={toggleSave} onDetails={openDetails} />
              ))}
            </div>
          </section>

          <section aria-labelledby="gm-trending">
            <div className="gm-section-head">
              <h2 id="gm-trending">Trending games</h2>
              <div className="gm-rail-controls">
                <button type="button" aria-label="Scroll trending games left" onClick={() => scrollRail(-1)}>‹</button>
                <button type="button" aria-label="Scroll trending games right" onClick={() => scrollRail(1)}>›</button>
              </div>
            </div>
            <div className="gm-rail" ref={railRef} role="region" aria-label="Trending games" tabIndex={0}>
              {status === 'loading' && <GameSkeletons compact />}
              {trending.map((g, index) => (
                <GameCard key={g.gameId} game={g} index={index} compact saved={isSaved(g.gameId)} onToggleSave={toggleSave} onDetails={openDetails} />
              ))}
            </div>
          </section>
        </main>
      </div>

      {detailsId && <GameDetails key={detailsId} gameId={detailsId} onClose={() => setDetailsId(null)} />}
    </div>
  );
}
