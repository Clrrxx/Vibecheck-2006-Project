import { useId } from 'react';
import characters from '../assets/gamer-characters-transparent.png';
import './GamerCharacter.css';
import { characterViews } from '../data/characterViews';

// Viewports follow the supplied artwork: left to right, top row then bottom row.

export default function GamerCharacter({ title }) {
  const clipId = useId();
  const viewBox = characterViews[title];
  if (!viewBox) return null;
  const [x, y, width, height] = viewBox.split(' ').map(Number);

  return (
    <svg className="gamer-character" viewBox={viewBox} role="img" aria-label={`${title} character`}>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <image href={characters} width="1671" height="941" clipPath={`url(#${clipId})`} />
    </svg>
  );
}
