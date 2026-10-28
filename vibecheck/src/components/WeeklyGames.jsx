import { useEffect, useState } from "react";
import { GameDetails } from "../pages/GameRecc";
import "./WeeklyGames.css";

const CACHE_KEY = "vibecheck.weeklyGames.v1";

function weeklyWindow() {
  // Use the same Singapore calendar week for every visitor.
  const today = new Date(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }) + "T00:00:00Z");
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - (today.getUTCDay() + 6) % 7);
  const from = new Date(monday);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  const iso = (date) => date.toISOString().slice(0, 10);
  return { week: iso(monday), dates: `${iso(from)},${iso(today)}` };
}

export default function WeeklyGames() {
  const [state, setState] = useState({ status: "loading", games: [] });
  const [attempt, setAttempt] = useState(0);
  const [detailsId, setDetailsId] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const { week, dates } = weeklyWindow();
    async function load() {
      try {
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
          if (cached?.week === week && Array.isArray(cached.games) && cached.games.length) {
            setState({ status: "ready", games: cached.games });
            return;
          }
        } catch { /* Fetch when storage is unavailable. */ }
        const key = import.meta.env.VITE_RAWG_KEY;
        if (!key) throw new Error("Missing API key");
        const url = new URL("https://api.rawg.io/api/games");
        url.search = new URLSearchParams({ key, dates, ordering: "-added", page_size: "6", exclude_additions: "true" });
        const response = await fetch(url, { signal: ctrl.signal });
        if (!response.ok) throw new Error("Games unavailable");
        const data = await response.json();
        if (!Array.isArray(data.results)) throw new Error("Invalid game data");
        if (ctrl.signal.aborted) return;
        const games = data.results.map((game) => ({
          id: game.id, title: game.name, image: game.background_image,
          genres: (game.genres ?? []).slice(0, 2).map((genre) => genre.name).join(" · "),
          rating: game.rating, ratingCount: game.ratings_count, metacritic: game.metacritic,
          platforms: [...new Set((game.parent_platforms ?? []).map(({ platform }) => platform.name))].slice(0, 3).join(" · "),
        }));
        setState({ status: "ready", games });
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ week, games })); } catch { /* Optional cache. */ }
      } catch {
        if (!ctrl.signal.aborted) setState({ status: "error", games: [] });
      }
    }
    load();
    return () => ctrl.abort();
  }, [attempt]);

  return (
    <section className="weekly-games card" aria-labelledby="weekly-games-heading">
      <div className="weekly-games-heading">
        <div><span className="eyebrow">Your weekly discovery</span><h2 id="weekly-games-heading">Top games this week <span aria-hidden="true">✦</span></h2></div>
        <span className="weekly-games-badge">Weekly picks</span>
      </div>
      <p className="weekly-games-intro">Popular releases from the past year, ranked by total RAWG library additions. Selection refreshes weekly; ratings are overall scores.</p>
      {state.status === "loading" && <p className="weekly-games-status" role="status">Finding this week’s picks…</p>}
      {state.status === "error" && <div className="weekly-games-status" role="status">We couldn’t load this week’s games. <button type="button" onClick={() => { setState({ status: "loading", games: [] }); setAttempt((value) => value + 1); }}>Try again</button></div>}
      {state.status === "ready" && !state.games.length && <p className="weekly-games-status">No games available right now. Check back soon.</p>}
      <div className="weekly-games-grid">
        {state.games.map((game, index) => <article className="weekly-game" key={game.id}>
          <div className="weekly-game-art">
            {game.image && <img src={game.image} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />}
            <span className="weekly-game-rank">#{index + 1}</span>
          </div>
          <div className="weekly-game-body">
            <p className="weekly-game-genres">{game.genres || "Game"}</p>
            <h3>{game.title}</h3>
            <p className="weekly-game-platforms">{game.platforms || "Platforms not listed"}</p>
            <div className="weekly-game-scores">
              <div><span className="weekly-game-rating">{game.ratingCount > 0 && game.rating > 0 ? `★ ${game.rating.toFixed(1)}` : "Unrated"}</span>{game.ratingCount > 0 && game.rating > 0 && <span className="weekly-game-scale"> / 5</span>}<small>{game.ratingCount > 0 ? `${game.ratingCount.toLocaleString()} ratings` : "No ratings yet"}</small></div>
              {game.metacritic != null && game.metacritic > 0 && <div className="weekly-game-metacritic"><b>{game.metacritic}</b><small>Metacritic</small></div>}
            </div>
            <button type="button" className="weekly-game-details" onClick={() => setDetailsId(String(game.id))} aria-label={`View details for ${game.title}`}>View details <span aria-hidden="true">↗</span></button>
          </div>
        </article>)}
      </div>
      <p className="weekly-games-attribution">Game data and images by <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a></p>
      {detailsId && <GameDetails key={detailsId} gameId={detailsId} onClose={() => setDetailsId(null)} />}
    </section>
  );
}
