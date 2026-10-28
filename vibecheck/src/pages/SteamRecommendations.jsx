import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import useSteamInsights from '../data/useSteamInsights';
import { formatHours } from '../data/steamInsights';
import { loadSteamRecommendations, selectSteamSeeds } from '../data/steamRecommendations';
import { SteamLibraryPanelView } from '../components/SteamLibraryPanel';
import './GameRecc.css';
import './SteamRecommendations.css';

function RecommendationResults({ steam, retry }) {
  const [state, setState] = useState({ loading: true, result: null, error: '' });
  useEffect(() => {
    const controller = new AbortController();
    let storage;
    try { storage = sessionStorage; } catch { /* Works without browser storage. */ }
    loadSteamRecommendations({ steam, key: import.meta.env.VITE_RAWG_KEY, signal: controller.signal, storage }).then(result => {
      if (!controller.signal.aborted) setState({ loading: false, result, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ loading: false, result: null, error: error.message || 'Recommendations couldn’t load. Try again.' });
    });
    return () => controller.abort();
  }, [steam]);

  if (state.loading) return <section className="sr-state" role="status"><span className="sr-eyebrow">READING YOUR PLAY STYLE</span><h2>Finding your next favourite…</h2><p>Matching up to 12 played games, then comparing genres and gameplay tags.</p><div className="sr-loading" aria-hidden="true" /></section>;
  if (state.error) return <section className="sr-state" role="alert"><h2>Your recommendations couldn’t load</h2><p>{state.error}</p><button className="gm-primary" onClick={retry}>Try again</button></section>;
  const { result } = state;
  return <>
    <section className="sr-evidence" aria-label="Recommendation coverage"><div><span className="sr-eyebrow">YOUR TASTE PROFILE</span><h2>{result.seeds.length} of {result.considered} played games identified</h2><p>{result.seeds.length < 3 ? 'Limited evidence: play more games or sync a larger library to improve these matches.' : 'Based on your most-played games, with a boost for recent activity.'}</p></div><div className="sr-pills">{Object.entries(result.taste.genres).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([slug]) => <span key={slug}>{result.seeds.flatMap(seed => seed.rawg.genres).find(genre => genre.slug === slug)?.name || slug}</span>)}</div></section>
    {result.failed > 0 && <p className="gm-notice" role="status">Some RAWG lookups failed. These results use the games and searches that loaded. <button onClick={retry}>Try again</button></p>}
    {result.seeds.length > 0 && <details className="sr-method"><summary>Games shaping your recommendations</summary><ul>{[...result.seeds].sort((a, b) => b.minutesTotal - a.minutesTotal).map(seed => <li key={seed.appId}><strong>{seed.name}</strong><span>{formatHours(seed.minutesTotal)} hrs lifetime · {formatHours(seed.minutesLast2Weeks)} hrs recently</span></li>)}</ul></details>}
    <div className="sr-section-heading"><div><span className="sr-eyebrow">A NEW WORLD TO TRY</span><h2>Recommended for your library</h2></div><span>Highest fit first</span></div>
    {!result.games.length ? <section className="sr-state"><h2>{result.seeds.length ? 'No new matches in this search' : 'We couldn’t identify your played games'}</h2><p>{result.seeds.length ? 'The matching titles may already be in your library. Sync Steam after playing something new, or explore personality matches.' : 'We only use exact title matches to avoid confusing sequels or editions. Your library is still available below.'}</p><Link className="gm-primary" to="/game-recommendations">Explore personality matches</Link></section> : <div className="sr-grid">{result.games.map(game => <article className="gm-card sr-card" key={game.id}>
      <div className="gm-cover">{game.background_image && <img src={game.background_image} alt="" loading="lazy" onError={event => { event.currentTarget.hidden = true; }} />}<span className="sr-score">{game.fit}% <small>library fit</small></span></div>
      <div className="gm-card-body"><h3>{game.name}</h3><div className="gm-fit" style={{ '--fit': `${game.fit}%` }}><i aria-hidden="true" /></div><p className="sr-reason">{game.because ? <>Shares features with <strong>{game.because}</strong>.</> : 'Matches features in your played games.'}</p><ul className="gm-tags">{[...game.sharedGenres, ...game.sharedTags].slice(0, 4).map(label => <li key={label}>{label}</li>)}</ul>
        <details className="sr-breakdown"><summary>Why {game.fit}%?</summary><p>Genre similarity: {game.genreFit}%<br />Gameplay tag similarity: {game.tagFit === null ? 'not available; genres only' : `${game.tagFit}%`}</p><p>Fit combines {game.tagFit === null ? 'genre similarity only' : '70% genres + 30% tags'} with your playtime-weighted taste profile.</p></details>
        <div className="gm-actions"><a className="gm-primary" href={`https://store.steampowered.com/search/?term=${encodeURIComponent(game.name)}`} target="_blank" rel="noopener noreferrer">Find on Steam ↗</a><a href={`https://rawg.io/games/${game.id}`} target="_blank" rel="noopener noreferrer">Details ↗</a></div>
      </div>
    </article>)}</div>}
  </>;
}

/**
 * Gate library-based discovery on an available linked Steam library.
 * @returns {import('react').ReactElement} Library recommendations or setup guidance.
 */
export default function SteamRecommendations() {
  const user = useOutletContext();
  const library = useSteamInsights(user.uid);
  const { steam, loading, error, retry } = library;
  const [attempt, setAttempt] = useState(0);
  const ready = !loading && !error && steam?.gamesVisible && selectSteamSeeds(steam).length > 0;
  return <div className="gm-page sr-page">
    <header className="gm-topbar"><Link className="gm-brand" to="/"><span className="gm-logo" />vibecheck</Link><nav aria-label="Recommendation navigation"><Link to="/game-recommendations">Personality matches</Link><Link to="/game-recommendations/steam" aria-current="page">Steam matches</Link></nav></header>
    <main className="sr-main">
      <section className="sr-hero"><div><span className="sr-eyebrow">YOUR LIBRARY. YOUR NEXT ADVENTURE.</span><h1>More of what<br />you love<span>.</span></h1><p>Discover Steam games through the worlds you already spend time in. Every match comes with a reason.</p></div><div className="sr-hero-mark" aria-hidden="true">✦<span>PLAY → DISCOVER</span></div></section>
      <details className="sr-method"><summary>How library fit works</summary><p>We identify up to 12 played Steam games on RAWG. Each contributes genres and English gameplay tags, weighted by 80% log(1 + lifetime hours) + 20% log(1 + recent hours). Logarithms reduce the influence of a single game with thousands of hours. Store capabilities such as Steam achievements and controller support don’t count as gameplay tags.</p><p>Fit is 70% genre cosine similarity + 30% tag cosine similarity with that taste profile. If your profile has no tags, genres receive 100%. Missing candidate tags score zero. Scores describe feature similarity, not a measured probability that you’ll enjoy a game.</p><p>We search popular Steam PC titles in your three strongest genres. Known owned titles are excluded using identified RAWG IDs and normalized library names; differently named editions can still appear. Playtime can include idle time. These matches are separate from your personality assessment.</p></details>
      {ready ? <RecommendationResults key={`${JSON.stringify(steam)}:${attempt}`} steam={steam} retry={() => setAttempt(value => value + 1)} /> : !loading && !error && steam?.gamesVisible ? <section className="sr-state"><h2>Play something to build your taste profile</h2><p>We need recorded playtime in at least one game. Play a Steam game, then refresh Steam on your profile.</p><Link className="gm-primary" to="/update-profile">Sync Steam ↗</Link></section> : null}
      <section className="sr-library" aria-label="Your Steam library"><SteamLibraryPanelView {...library} /></section>
      {!loading && !error && steam && <Link className="sr-sync" to="/update-profile">Played something new? Refresh your Steam sync ↗</Link>}
      {error && <button className="gm-primary" onClick={retry}>Reload Steam data</button>}
      <p className="sr-credit">Game data and artwork by <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a> · Library and playtime from your latest Steam sync.</p>
    </main>
  </div>;
}
