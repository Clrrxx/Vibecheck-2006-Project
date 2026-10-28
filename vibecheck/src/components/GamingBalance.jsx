import { useState } from 'react';
import { activityBand, parseTarget, targetComparison } from '../data/gamingBalance';
import { formatHours } from '../data/steamInsights';
import './GamingBalance.css';

const questions = [
  ['sleep', 'Has gaming delayed your planned sleep?'],
  ['responsibilities', 'Has gaming interfered with studies, work or relationships?'],
  ['control', 'Have you found it difficult to stop when you intended?'],
  ['impact', 'Have you continued gaming despite problems it caused?'],
];
function readTarget(key) {
  if (!key) return null;
  try { return parseTarget(localStorage.getItem(key)); } catch { return null; }
}

export default function GamingBalance({ userId, steamId, recentMinutes }) {
  const storageKey = userId && steamId ? `vibecheck.gamingTarget.v1:${userId}:${steamId}` : null;
  const [target, setTarget] = useState(() => readTarget(storageKey));
  const [draft, setDraft] = useState(() => String(readTarget(storageKey) ?? ''));
  const [notice, setNotice] = useState('');
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const { label, average } = activityBand(recentMinutes);
  const comparison = targetComparison(average, target);
  const complete = questions.every(([key]) => answers[key] !== undefined);
  const concerns = submitted ? questions.filter(([key]) => submitted[key] !== 'never') : [];
  const frequent = submitted && questions.some(([key]) => submitted[key] === 'often');

  function saveTarget(event) {
    event.preventDefault();
    const value = parseTarget(draft);
    if (value === null) { setNotice('Enter 0–24 hours in steps of 0.25 (15 minutes).'); return; }
    try {
      if (storageKey) localStorage.setItem(storageKey, String(value));
      setTarget(value);
      setNotice(storageKey ? 'Your target is saved on this browser.' : 'Your trial target is set for this visit.');
    } catch {
      setTarget(value);
      setNotice('Your target is set for this visit. Browser storage is unavailable.');
    }
  }
  function clearTarget() {
    try { if (storageKey) localStorage.removeItem(storageKey); }
    catch { setNotice('Couldn’t remove the saved target. Please try again.'); return; }
    setTarget(null); setDraft(''); setNotice('Personal target removed.');
  }

  return <section className="balance-section" aria-labelledby="balance-heading">
    <div className="insights-section-heading"><div><span className="insights-eyebrow">MAKE ROOM FOR YOUR WHOLE LIFE</span><h2 id="balance-heading">Your gaming balance</h2></div><span className="balance-trial">Trial feature</span></div>
    <div className="balance-grid">
      <div className="insights-panel balance-activity">
        <span className="insights-eyebrow">YOUR STEAM ACTIVITY</span>
        <div className="balance-badge"><span aria-hidden="true">✦</span>{label}</div>
        <p className="balance-average"><strong>{formatHours(average)}</strong> hrs/day on average</p>
        <p className="balance-note">Across 14 days at your latest sync, including days off. Other gaming platforms aren’t included.</p>
        <div className="balance-target-result" aria-live="polite">{comparison ? <><span>YOUR PERSONAL TARGET · {target} HRS/DAY ON AVERAGE</span><p>{comparison.above ? `${formatHours(comparison.difference * 60)} hrs/day above your chosen average.` : 'Your Steam average is within your chosen target.'}</p><small>This compares a 14-day average, not today’s activity or total screen time.</small></> : <><span>YOUR TIME, YOUR INTENTIONS</span><p>Choose an average that fits around your sleep, responsibilities and other interests.</p></>}</div>
        <form className="balance-target-form" onSubmit={saveTarget}>
          <label htmlFor="balance-target">Your target (hours/day on average)</label>
          <div><input id="balance-target" type="number" min="0" max="24" step="0.25" inputMode="decimal" placeholder="Choose hours" value={draft} onChange={event => { setDraft(event.target.value); setNotice(''); }} required /><button className="insights-primary" type="submit">Set target</button></div>
          <small>Your choice, not a medical recommendation. Saved only on this browser.</small>
        </form>
        <div className="balance-target-actions">{target !== null && <button type="button" onClick={clearTarget}>Remove target</button>}<p role="status">{notice}</p></div>
      </div>
      <div className="insights-panel balance-checkin">
        <span className="insights-eyebrow">OPTIONAL · JUST FOR YOU</span><h3>A quick wellbeing check-in</h3>
        <p className="balance-note">Thinking about the last 14 days, how often have these happened? You can skip this. Answers stay in this page and clear when you leave or reload.</p>
        <form onSubmit={event => { event.preventDefault(); if (complete) setSubmitted({ ...answers }); }}>
          {questions.map(([key, question]) => <fieldset key={key}><legend>{question}</legend><div>{[['never', 'Never'], ['sometimes', 'Sometimes'], ['often', 'Often']].map(([value, text]) => <label key={value} className={answers[key] === value ? 'selected' : ''}><input type="radio" name={`balance-${key}`} value={value} checked={answers[key] === value} onChange={() => { setAnswers(previous => ({ ...previous, [key]: value })); setSubmitted(null); }} required />{text}</label>)}</div></fieldset>)}
          <div className="balance-checkin-actions"><button className="insights-secondary" type="submit" disabled={!complete}>Reflect on my answers</button>{Object.keys(answers).length > 0 && <button type="button" className="balance-reset" onClick={() => { setAnswers({}); setSubmitted(null); }}>Clear answers</button>}</div>
          {!complete && <p className="balance-note">Choose an answer for each prompt to see your reflection.</p>}
        </form>
        {submitted && <div className="balance-reflection" role="status"><strong>{concerns.length ? 'Make space for a small adjustment.' : 'Thanks for checking in.'}</strong><p>{concerns.length ? 'You reported some effects on your daily life. Consider a planned stopping time, protecting your sleep, or discussing your habits with someone you trust.' : 'You reported no difficulties in these four prompts. This check-in doesn’t assess or rule out gaming disorder.'}</p>{frequent && <p>If these difficulties persist or affect your daily life, consider talking with a healthcare professional. You don’t need to wait for things to get worse to ask for help.</p>}<a href="https://www.healthhub.sg/programmes/mindsg/caring-for-ourselves/understanding-addictions-youths" target="_blank" rel="noopener noreferrer">Explore gaming wellbeing support ↗</a></div>}
      </div>
    </div>
    <details className="balance-about"><summary>About these labels and wellbeing guidance</summary><div><p>Activity labels describe Steam playtime only: no recent activity = 0; occasional = under 1 hour/day; regular = 1–3 hours/day; avid = over 3 hours/day, averaged across 14 days. These are our trial product categories, not clinical thresholds, achievements or recommended limits.</p><p>WHO describes gaming disorder through impaired control, gaming taking priority over daily activities, and continuing despite negative consequences, with significant impairment, normally over at least 12 months. Hours alone don’t establish a diagnosis. These four reflection prompts are not a validated screening tool.</p><p>There is no universal adult gaming-hours limit supplied here. Your target is self-selected. Guidance for children is age-specific and relates to overall recreational screen use; it should not be applied to adults or treated as a Steam-only allowance.</p><p className="balance-sources"><a href="https://www.who.int/news-room/questions-and-answers/item/addictive-behaviours-gaming-disorder" target="_blank" rel="noopener noreferrer">WHO: Gaming disorder ↗</a><a href="https://www.healthhub.sg/programmes/mindsg/caring-for-ourselves/understanding-addictions-youths" target="_blank" rel="noopener noreferrer">HealthHub: Understanding addictions ↗</a><a href="https://www.moh.gov.sg/others/resources-and-statistics/guidance-on-screen-use/" target="_blank" rel="noopener noreferrer">MOH: Children’s screen-use guidance ↗</a></p></div></details>
  </section>;
}
