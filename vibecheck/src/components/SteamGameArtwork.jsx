import { useState } from 'react';
import useRawgArtwork from '../data/useRawgArtwork';

export default function SteamGameArtwork({ game, hero = false, details = false }) {
  const data = useRawgArtwork(game);
  const [failedUrl, setFailedUrl] = useState(null);
  const hasImage = data?.image && failedUrl !== data.image;
  const image = <span className={`insights-game-art ${hero ? 'insights-game-art-hero' : ''}`} aria-hidden="true">
    {hasImage ? <img src={data.image} alt="" loading="lazy" decoding="async" onError={() => setFailedUrl(data.image)} /> : <span className="insights-game-art-fallback">{game.name.slice(0, 1).toUpperCase()}</span>}
  </span>;
  const appId = encodeURIComponent(String(game.appId));
  const steamUrl = `steam://store/${appId}`;
  const webUrl = `https://store.steampowered.com/app/${appId}/`;
  const linkedImage = <a className={hero ? 'insights-game-hero-link' : 'insights-game-art-link'} href={steamUrl} aria-label={`Open ${game.name} in Steam`} title="Open in Steam">{image}</a>;
  if (hero) return linkedImage;
  return <span className="insights-game-identity">
    {linkedImage}
    <span className="insights-game-copy">
      <a href={steamUrl} aria-label={`Open ${game.name} in Steam`} title="Open in Steam">{game.name}<span className="insights-game-external" aria-hidden="true"> ↗</span></a>
      {details && <><small>{[data?.genres, data?.year].filter(Boolean).join(' · ') || 'Steam library'}</small><a className="insights-game-web-link" href={webUrl} target="_blank" rel="noopener noreferrer" aria-label={`${game.name} on the Steam website (opens in a new tab)`}>Steam website ↗</a></>}
    </span>
  </span>;
}
