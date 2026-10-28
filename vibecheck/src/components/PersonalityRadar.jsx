import { useId } from 'react';
import { traits } from '../data/quest';
import './PersonalityRadar.css';

const center = { x: 200, y: 148 };
const radius = 95;
function point(index, distance) {
  const angle = -Math.PI / 2 + index * 2 * Math.PI / 5;
  return { x: center.x + Math.cos(angle) * distance, y: center.y + Math.sin(angle) * distance };
}
const coordinates = points => points.map(({ x, y }) => `${x},${y}`).join(' ');

export default function PersonalityRadar({ scores }) {
  const id = useId();
  const values = traits.map(trait => ({ ...trait, average: scores[trait.key].average }));
  const points = values.map((trait, index) => point(index, radius * trait.average / 5));

  return <figure className="personality-radar">
    <svg viewBox="0 0 400 290" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>Your Big Five personality scores</title>
      <desc id={`${id}-description`}>{values.map(t => `${t.name}: ${t.average.toFixed(1)} out of 5`).join('. ')}. Scale: zero at the centre, five at the outer ring.</desc>
      <g className="personality-radar-grid">
        {[1, 2, 3, 4, 5].map(level => <polygon key={level} points={coordinates(traits.map((_, index) => point(index, radius * level / 5)))} />)}
        {traits.map((trait, index) => {
          const end = point(index, radius);
          return <line key={trait.key} x1={center.x} y1={center.y} x2={end.x} y2={end.y} />;
        })}
      </g>
      <g className="personality-radar-scores" style={{ transformOrigin: `${center.x}px ${center.y}px` }}>
        <polygon className="personality-radar-area" points={coordinates(points)} />
        {points.map((p, index) => <circle className="personality-radar-dot" key={traits[index].key} cx={p.x} cy={p.y} r="3.5" />)}
      </g>
      <g className="personality-radar-scale" aria-hidden="true">
        {[1, 2, 3, 4, 5].map(level => <text key={level} x={center.x + 8} y={center.y - radius * level / 5 + 3}>{level}</text>)}
      </g>
      {values.map((trait, index) => {
        const label = point(index, 130);
        return <text className="personality-radar-label" key={trait.key} x={label.x} y={label.y} textAnchor="middle">
          <tspan x={label.x}>{trait.name}</tspan>
          <tspan className="personality-radar-value" x={label.x} dy="18">{trait.average.toFixed(1)} / 5</tspan>
        </text>;
      })}
    </svg>
    <figcaption><span aria-hidden="true" />Your scores · Scale 0–5</figcaption>
  </figure>;
}
