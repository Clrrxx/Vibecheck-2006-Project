import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import useSteamInsights from '../data/useSteamInsights';
import useRawgArtwork from '../data/useRawgArtwork';
import { buildSteamInsights, formatHours } from '../data/steamInsights';

function SteamLibraryGame({ game, onDetails }) {
  const artwork = useRawgArtwork(game);
  return <li className="gm-steam-game">
    <a className="gm-steam-art" href={`steam://store/${encodeURIComponent(String(game.appId))}`} aria-label={`Open ${game.name} in Steam`}><span>{game.name.slice(0, 1).toUpperCase()}</span>{artwork?.image && <img src={artwork.image} alt="" loading="lazy" decoding="async" onError={event => { event.currentTarget.hidden = true; }} />}</a>
    <div className="gm-steam-game-copy">
      <a href={`steam://store/${encodeURIComponent(String(game.appId))}`} aria-label={`Open ${game.name} in Steam`}>{game.name} ↗</a>
      <small>{formatHours(game.minutesTotal)} hrs total{game.minutesLast2Weeks > 0 && ` · ${formatHours(game.minutesLast2Weeks)} hrs recently`}</small>
      <small><a href={`https://store.steampowered.com/app/${encodeURIComponent(String(game.appId))}/`} target="_blank" rel="noopener noreferrer" aria-label={`${game.name} on the Steam website (opens in a new tab)`}>Steam website ↗</a></small>
      {artwork && onDetails && <button type="button" onClick={() => onDetails(String(artwork.id))} aria-label={`View details for ${game.name}`}>View details</button>}
    </div>
  </li>;
}

export function SteamLibraryPanelView({ steam, loading, error, retry, onDetails }) {
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(5);
  const { ranked } = buildSteamInsights(steam, 'lifetime');
  const filtered = ranked.filter(game => game.name.toLowerCase().includes(search.trim().toLowerCase()));
  return <details className="gm-steam-panel" open>
    <summary>Your Steam games{steam?.gamesVisible && !loading && !error ? ` (${ranked.length})` : ''}</summary>
    {loading ? <p className="gm-hint" role="status">Loading your Steam library…</p>
      : error ? <div className="gm-steam-state"><p className="gm-hint" role="alert">{error}</p><button type="button" className="gm-steam-more" onClick={retry}>Try again</button></div>
      : !steam ? <div className="gm-steam-state"><p className="gm-hint">Connect Steam to see your games and playtime here.</p><Link to="/update-profile">Connect Steam ↗</Link></div>
      : !steam.gamesVisible ? <div className="gm-steam-state"><p className="gm-hint">Steam hasn’t returned your game list. Check your Game details privacy settings, then refresh Steam.</p><Link to="/update-profile">Manage Steam connection ↗</Link></div>
      : <>
        <p className="gm-steam-caption">{steam.personaName || 'Your library'} · Most played first</p>
        {ranked.length > 0 && <label className="gm-steam-search"><span className="gm-visually-hidden">Search your Steam games</span><input type="search" placeholder="Find a Steam game…" value={search} onChange={event => { setSearch(event.target.value); setLimit(5); }} /></label>}
        {filtered.length ? <ul className="gm-steam-list">{filtered.slice(0, limit).map(game => <SteamLibraryGame key={game.appId} game={game} onDetails={onDetails} />)}</ul> : <p className="gm-hint">{search ? 'No Steam games match your search.' : 'Your synced Steam library is empty.'}</p>}
        {filtered.length > limit && <button type="button" className="gm-steam-more" onClick={() => setLimit(value => value + 5)}>Show more ({filtered.length - limit})</button>}
        <Link className="gm-steam-insights" to="/gaming-insights">View full library & insights ↗</Link>
        <small className="gm-steam-credit">Covers by <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a> · Playtime from your latest Steam sync</small>
      </>}
  </details>;
}

export default function SteamLibraryPanel({ onDetails }) {
  const user = useOutletContext();
  const state = useSteamInsights(user.uid);
  return <SteamLibraryPanelView {...state} onDetails={onDetails} />;
}
