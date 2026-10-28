import { useId, useState } from 'react';
import PersonalityRadar from './PersonalityRadar';

export default function PersonalitySummary({ results }) {
  const [selectedKey, setSelectedKey] = useState(results[0].key);
  const id = useId();
  const selected = results.find(trait => trait.key === selectedKey) || results[0];
  const scores = Object.fromEntries(results.map(trait => [trait.key, trait]));

  return <section className="personality-summary" aria-label="Your personality results">
    <div className="results-chart">
      <span className="quest-eyebrow">YOUR BIG FIVE AT A GLANCE</span>
      <PersonalityRadar scores={scores} />
    </div>
    <div className="results-explorer">
      <p className="results-explorer-hint">Choose a trait to explore your results</p>
      <div className="results-trait-picker" role="group" aria-label="Personality traits">
        {results.map(trait => <button type="button" key={trait.key}
          aria-pressed={selected.key === trait.key} aria-controls={`${id}-detail`}
          onClick={() => setSelectedKey(trait.key)}>
          <span>{trait.name}</span><strong>{trait.average.toFixed(1)}</strong>
        </button>)}
      </div>
      <article className="results-trait-detail" id={`${id}-detail`} aria-labelledby={`${id}-heading`} aria-live="polite">
        <div className="results-trait-heading"><h2 id={`${id}-heading`}>{selected.name}</h2><strong>{selected.average.toFixed(1)} <small>/ 5</small></strong></div>
        <p className="results-trait-meaning">{selected.meaning}</p>
        <meter min="1" max="5" value={selected.average} aria-label={`${selected.name}: ${selected.average.toFixed(1)} out of 5`} />
        <div className="quest-poles"><span>{selected.low}</span><span>{selected.high}</span></div>
        <div className="results-trait-reading"><span className="quest-eyebrow">YOUR READING</span><p>{selected.description}</p><p className="results-game-angle"><b>In games:</b> {selected.gameAngle}</p></div>
      </article>
    </div>
  </section>;
}
