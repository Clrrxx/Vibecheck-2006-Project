import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import useSteamInsights from '../data/useSteamInsights';
import { buildSteamInsights, formatHours } from '../data/steamInsights';
import SteamGameArtwork from '../components/SteamGameArtwork';
import GamingBalance from '../components/GamingBalance';
import './GamingInsights.css';

const syncedAt = value => typeof value === 'number' && Number.isFinite(value)
  ? new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Singapore' }) + ' SGT'
  : 'Not available';

export function GamingInsightsView({ userId, steam, loading, error, retry, refreshing, refresh, message }) {
  const [period, setPeriod] = useState('recent');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(10);
  const insights = buildSteamInsights(steam, period);
  const visible = insights.ranked.filter(game => game.name.toLowerCase().includes(search.trim().toLowerCase()));
  const recent = period === 'recent';
  const periodLabel = recent ? 'Last 14 days' : 'Lifetime';
  const available = steam?.gamesVisible === true;

  return <div className="insights-page">
    <header className="insights-topbar">
      <Link className="insights-brand" to="/"><span aria-hidden="true" />vibecheck</Link>
      <nav aria-label="Insights navigation"><Link to="/">← Dashboard</Link><Link to="/update-profile">Update Profile ↗</Link></nav>
    </header>
    <main className="insights-main">
      <div className="insights-heading"><div><span className="insights-eyebrow">YOUR PLAY, IN PERSPECTIVE</span><h1>Gaming insights<span>.</span></h1><p>A little reflection on the worlds you spend time in.</p></div><span className="insights-source">◉ Powered by your Steam library</span></div>
      {loading ? <section className="insights-panel insights-empty" role="status"><span className="insights-orbit" aria-hidden="true">◌</span><h2>Gathering your adventures…</h2><p>Loading your saved Steam activity.</p></section>
        : error ? <section className="insights-panel insights-empty" role="alert"><h2>Your insights couldn’t load</h2><p>{error}</p><button className="insights-primary" onClick={retry}>Try again</button></section>
        : !steam ? <section className="insights-panel insights-empty"><span className="insights-orbit" aria-hidden="true">✦</span><span className="insights-eyebrow">YOUR NEXT CHAPTER</span><h2>Bring your Steam adventures here.</h2><p>Connect Steam to explore your playtime, favourite games and library. Your insights will appear after your first successful sync.</p><Link className="insights-primary" to="/update-profile">Connect Steam ↗</Link></section>
        : <>
          <section className="insights-account" aria-label="Connected Steam account"><div className="insights-account-person">{steam.avatar && <img src={steam.avatar} alt="" />}<div><strong>{steam.personaName || 'Steam player'}</strong><span><i aria-hidden="true" /> Steam connected</span></div></div><div className="insights-sync"><small>Last synced: {syncedAt(steam.lastSynced)}</small><button className="insights-primary" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : '↻ Refresh Steam'}</button></div></section>
          {message && <p className={`insights-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}
          {!available ? <section className="insights-panel insights-empty"><h2>Your game details aren’t available</h2><p>Steam hasn’t returned a game list. Check that your Steam profile and Game details are public, then refresh. An empty library may also have no game data.</p><Link className="insights-secondary" to="/update-profile">Manage Steam connection ↗</Link></section> : <>
            <section className="insights-stats" aria-label="Playtime summary">
              <article><span>LAST 14 DAYS</span><strong>{formatHours(insights.recentMinutes)}<small>hrs</small></strong><p>Across {insights.recentCount} {insights.recentCount === 1 ? 'game' : 'games'}</p></article>
              <article><span>DAILY AVERAGE</span><strong>{formatHours(insights.recentMinutes / 14)}<small>hrs</small></strong><p>Last 14 days, including days off</p></article>
              <article><span>LIFETIME PLAYTIME</span><strong>{formatHours(insights.totalMinutes)}<small>hrs</small></strong><p>Across your synced Steam library</p></article>
              <article><span>YOUR LIBRARY</span><strong>{insights.games.length}<small>games</small></strong><p>{insights.playedCount} played · {insights.games.length - insights.playedCount} with no recorded playtime</p></article>
            </section>
            <GamingBalance key={`${userId || "trial"}:${steam.steamId || "preview"}`} userId={userId} steamId={steam.steamId} recentMinutes={insights.recentMinutes} />
            <div className="insights-section-heading"><div><span className="insights-eyebrow">FOLLOW YOUR CURIOSITY</span><h2>Where your time goes</h2></div><div className="insights-period" role="group" aria-label="Playtime period">{[['recent', 'Last 14 days'], ['lifetime', 'Lifetime']].map(([value, label]) => <button key={value} aria-pressed={period === value} onClick={() => { setPeriod(value); setLimit(10); }}>{label}</button>)}</div></div>
            <div className="insights-grid">
              <section className="insights-panel insights-breakdown" aria-labelledby="insights-breakdown-heading"><div className="insights-panel-heading"><h3 id="insights-breakdown-heading">Your most-played worlds</h3><span>{periodLabel}</span></div>
                {insights.top.length ? <><ol className="insights-bars">{insights.top.map((game, index) => <li key={game.appId}><div><span className="insights-ranked-game"><b>{String(index + 1).padStart(2, '0')}</b><SteamGameArtwork game={game} /></span><strong>{formatHours(game[insights.field])} hrs</strong></div><div className="insights-track"><span style={{ width: `${game[insights.field] / insights.periodMinutes * 100}%`, '--bar-index': index }} /></div></li>)}</ol>{insights.otherMinutes > 0 && <p className="insights-other">Other games <strong>{formatHours(insights.otherMinutes)} hrs</strong></p>}<p className="insights-footnote">Each bar shows a game’s share of your {recent ? 'last 14 days of' : 'lifetime'} playtime.</p></> : <div className="insights-no-activity"><span aria-hidden="true">☾</span><h3>{recent ? 'A quiet fortnight.' : 'Your adventures are ahead.'}</h3><p>{recent ? 'No playtime was recorded in the last 14 days. Switch to Lifetime to explore your past favourites.' : 'No playtime has been recorded for your synced games yet.'}</p></div>}
              </section>
              <aside className="insights-panel insights-spotlight"><span className="insights-eyebrow">{recent ? 'YOUR RECENT FAVOURITE' : 'YOUR ALL-TIME FAVOURITE'}</span><div className="insights-spotlight-art">{insights.top[0] ? <SteamGameArtwork key={insights.top[0].appId} game={insights.top[0]} hero /> : <div className="insights-spotlight-symbol" aria-hidden="true">✧</div>}</div><h3>{insights.top[0]?.name || 'Room for a new favourite'}</h3>{insights.top.length > 0 ? <><strong>{insights.topShare}<small>%</small></strong><p>of your {recent ? 'recent' : 'lifetime'} Steam playtime was spent here.</p></> : <p>When you spend time in a game, your favourite will appear here.</p>}<div className="insights-reflection"><span>A MOMENT TO REFLECT</span><p>Did your time playing feel like time well spent?</p><small>Numbers offer perspective. You decide what a good balance looks like.</small></div></aside>
            </div>
            <section className="insights-panel insights-library" aria-labelledby="insights-library-heading"><div className="insights-library-heading"><div><span className="insights-eyebrow">THE WORLDS ON YOUR SHELF</span><h2 id="insights-library-heading">Your game library</h2><p>Sorted by {recent ? 'last 14 days' : 'lifetime'} playtime · {visible.length} {visible.length === 1 ? 'game' : 'games'}</p></div><label className="insights-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search your Steam library" placeholder="Find a game…" value={search} onChange={event => { setSearch(event.target.value); setLimit(10); }} /></label></div>
              {visible.length ? <><div className="insights-table-scroll"><table><thead><tr><th scope="col">Game</th><th scope="col">Last 14 days</th><th scope="col">Lifetime</th></tr></thead><tbody>{visible.slice(0, limit).map(game => <tr key={game.appId}><th scope="row"><SteamGameArtwork game={game} details /></th><td>{formatHours(game.minutesLast2Weeks)} hrs</td><td>{formatHours(game.minutesTotal)} hrs</td></tr>)}</tbody></table></div>{visible.length > limit && <button className="insights-secondary insights-more" onClick={() => setLimit(value => value + 10)}>Show more games ({visible.length - limit} remaining)</button>}</> : <p className="insights-library-empty">{search ? 'No games match your search.' : 'Your synced library is empty.'}</p>}
            </section>
            <p className="insights-art-credit">Game artwork and details by <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">RAWG</a> · Your playtime from Steam</p>
            <footer className="insights-data-note"><span aria-hidden="true">ⓘ</span><p>Based on your latest Steam sync. Recent playtime is a rolling 14-day total, not this calendar week. Steam totals don’t tell us individual sessions or daily activity. Only games returned by Steam are included.</p></footer>
          </>}
        </>}
    </main>
  </div>;
}

/**
 * Load the owner's imported Steam aggregates and expose authenticated refresh.
 * @returns {import('react').ReactElement} Insights view; automatic monitoring is planned.
 */
export default function GamingInsights() {
  const user = useOutletContext();
  const { steam, loading, error, retry } = useSteamInsights(user.uid);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState(null);
  async function refresh() {
    setRefreshing(true);
    setMessage(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/steam/sync', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Steam refresh failed. Check that the backend is running and try again.');
      setMessage({ type: 'success', text: 'Steam activity refreshed.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof TypeError ? 'Couldn’t reach the server. Check that the Steam backend is running and try again.' : error.message });
    } finally { setRefreshing(false); }
  }
  return <GamingInsightsView userId={user.uid} steam={steam} loading={loading} error={error} retry={retry} refreshing={refreshing} refresh={refresh} message={message} />;
}
