import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { chapters, encounters, scoreQuest } from "../data/quest";
import ChapterLandscape from "../components/ChapterLandscape";
import PixelTraveller from "../components/PixelTraveller";
import QuestResultSave from "../components/QuestResultSave";
import GamerCharacter from "../components/GamerCharacter";
import PersonalitySummary from "../components/PersonalitySummary";
import GamerCard from "../components/GamerCard";
import "./Questionnaire.css";

const SAVE_KEY = 'vibecheck-quest-v1';
function readSave(saveKey) {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey));
    if (saved && Array.isArray(saved.answers) && saved.answers.length === 15 && saved.answers.every((a, i) => a === null || (Number.isInteger(a) && encounters[i].choices[a])) && Number.isInteger(saved.step) && saved.step >= -1 && saved.step <= 15 && saved.answers.slice(0, saved.step).every(a => a !== null) && typeof saved.name === 'string' && ['✦', '☾', '◇', '❋'].includes(saved.avatar)) return saved;
  } catch { /* A blocked or outdated save starts a fresh local session. */ }
  return { step: -1, answers: Array(15).fill(null), name: '', avatar: '✦' };
}
function Landscape({ chapter, chapterIndex, scene }) {
  return <ChapterLandscape key={scene || chapterIndex} chapter={chapter} chapterIndex={chapterIndex} scene={scene}><PixelTraveller /></ChapterLandscape>;
}
/**
 * Coordinate the 15-encounter quest, owner-scoped draft and completed-result view.
 * @returns {import('react').ReactElement} Current introduction, encounter, reaction or results.
 */
export default function Questionnaire() {
  const navigate = useNavigate();
  const user = useOutletContext();
  const saveKey = `${SAVE_KEY}:${user.uid}`;
  const [quest, setQuestState] = useState(() => readSave(saveKey));
  const [reaction, setReaction] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const heading = useRef(null);
  const { step, answers, name, avatar } = quest;
  function setQuest(update) {
    const next = typeof update === 'function' ? update(quest) : update;
    setQuestState(next);
    try { localStorage.setItem(saveKey, JSON.stringify(next)); setSaveError(false); }
    catch { setSaveError(true); }
  }
  useEffect(() => { heading.current?.focus(); }, [step, reaction]);
  const chapterIndex = Math.min(4, Math.max(0, Math.floor(step / 3)));
  const chapter = chapters[chapterIndex];
  const question = encounters[step];
  const results = step === 15 ? scoreQuest(answers) : null;
  const strongest = results && results.reduce((best, trait) => trait.average > best.average ? trait : best);
  const title = results && (Math.max(...results.map(t => t.average)) - Math.min(...results.map(t => t.average)) < 1 ? 'Versatile Adventurer' : strongest.title);
  function move(next) { setReaction(false); setJustCompleted(step === 14 && next === 15); setQuest(q => ({ ...q, step: next })); }
  return <main className={`questionnaire-page ${results ? 'results-page' : ''}`}>
    <header className="questionnaire-topbar"><Link className="questionnaire-brand" to="/"><span />vibecheck</Link><Link className="quest-exit" to="/">{saveError ? 'Exit to home' : 'Save & exit'} ↗</Link></header>
    <div className="quest-shell">
      <div className="quest-heading"><span className="quest-eyebrow">A LITTLE ADVENTURE. A LITTLE SELF-DISCOVERY.</span><span>15 moments · about 5–8 min</span></div>
      <nav className="quest-map" aria-label="Journey chapters">{chapters.map((c, i) => <div key={c.name} className={i === chapterIndex ? 'current' : i < chapterIndex ? 'complete' : ''} aria-current={step < 15 && i === chapterIndex ? 'step' : undefined}><span>{i < chapterIndex || step === 15 ? '✓' : c.icon}</span><small>{c.name}</small></div>)}</nav>
      <section className="questionnaire-card">
        <Landscape chapter={step === -1 ? chapters[0] : chapter} chapterIndex={chapterIndex} scene={question?.scene} />
        <div className="quest-content">
          {step === -1 ? <>
            <span className="quest-eyebrow">YOUR FIRST QUEST</span><h1 ref={heading} tabIndex={-1}>A fallen star.<br />A journey that's yours.</h1>
            <p>Welcome to the Lantern Guild. Your team has one mission: return a fallen star to the sky. Along the way, discover how you explore, connect and respond to the unexpected.</p>
            <p>Choose what you would naturally do or feel, rather than playing a character. There are no right answers, timers or points to win.</p>
            <label className="quest-name">What should we call you? <span>(optional)</span><input maxLength={24} value={name} onChange={e => setQuest(q => ({ ...q, name: e.target.value }))} placeholder="Adventurer" autoComplete="off" /></label>
            <fieldset className="quest-avatars"><legend>Pick your guild emblem</legend>{['✦', '☾', '◇', '❋'].map((symbol, i) => <label className={avatar === symbol ? 'selected' : ''} key={symbol}><input type="radio" name="avatar" checked={avatar === symbol} onChange={() => setQuest(q => ({ ...q, avatar: symbol }))} aria-label={['Star', 'Moon', 'Crystal', 'Flower'][i]} /><span>{symbol}</span></label>)}</fieldset>
            <button className="quest-primary" onClick={() => move(0)}>Begin my adventure →</button><p className="quest-disclaimer">An exploratory Big Five profile, not a validated personality test. Progress stays in this browser. If you are signed in, your completed answers and results are also saved to your profile.</p>
          </> : results ? <>
            <div className="results-intro"><GamerCharacter title={title} /><div className="results-intro-copy"><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{name.trim() || 'Adventurer'}, the star is home. Here is how you approached your journey.</p></div></div>
            <QuestResultSave answers={answers} name={name} avatar={avatar} showConfirmation={justCompleted} />
            <div className="results-layout">
              <GamerCard uid={user.uid} title={title} name={name} scores={results} />
              <PersonalitySummary results={results} />
            </div>
            <p className="quest-disclaimer">These are averages of three custom story answers per trait, not percentiles or a diagnosis. Higher does not mean better. Your title is a playful summary, not a separate personality type. Timing and measurement accuracy still need testing with players.</p>
            <footer><button className="quest-secondary" onClick={() => navigate('/')}>← Back to home</button><button className="quest-primary" onClick={() => { setReaction(false); setJustCompleted(false); setQuest({ step: -1, answers: Array(15).fill(null), name, avatar }); }}>Play again ↻</button></footer>
          </> : <>
            <div className="quest-progress-label"><span>CHAPTER {chapterIndex + 1} · {chapter.name}</span><span>{step + 1} / 15</span></div><progress max={15} value={step} aria-label="Completed encounters" />
            <h1 ref={heading} tabIndex={-1}>{reaction ? 'The journey continues…' : question.title}</h1>
            {reaction ? <div className="quest-reaction"><span aria-hidden="true">✧</span><p>{question.reaction}</p><small>Your choice: {question.choices[answers[step]].text}</small></div> : <><p>{question.story}</p><fieldset className="quest-choices"><legend>{question.prompt}</legend>{question.choices.map((option, i) => <label key={`${step}-${i}`} className={answers[step] === i ? 'selected' : ''}><input type="radio" name={`encounter-${step}`} checked={answers[step] === i} onChange={() => setQuest(q => ({ ...q, answers: q.answers.map((a, index) => index === step ? i : a) }))} /><span className="quest-choice-letter">{'ABC'[i]}</span><span>{option.text}</span><span className="quest-check" aria-hidden="true">{answers[step] === i ? '●' : '○'}</span></label>)}</fieldset></>}
            <footer><button className="quest-secondary" onClick={() => reaction ? setReaction(false) : move(step - 1)}>← {reaction ? 'Change choice' : 'Back'}</button><button className="quest-primary" disabled={answers[step] === null} onClick={() => reaction ? move(step + 1) : setReaction(true)}>{reaction ? step === 14 ? 'Reveal my profile ✦' : 'Continue the story →' : 'Choose this path →'}</button></footer>
          </>}
        </div>
      </section><p className="quest-save-note" role="status">{saveError ? 'Browser storage is unavailable. You can keep playing, but progress will not survive leaving or refreshing.' : 'Progress saved on this browser · Take your time. Be yourself.'}</p>
    </div>
  </main>;
}
