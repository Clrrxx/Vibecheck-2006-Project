import { useId, useState } from "react";
import "./GamerTraits.css";

import { options, suggestions, readTraits } from "../data/gamerTraits";

export default function GamerTraits({ uid, title }) {
  const editorId = useId();
  const [saved, setSaved] = useState(() => readTraits(uid));
  const suggested = suggestions[title] ?? suggestions["Versatile Adventurer"];
  const selected = saved ?? suggested;
  const [draft, setDraft] = useState(selected);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  function save() {
    try {
      localStorage.setItem(`vibecheck.gamerTraits:${uid}`, JSON.stringify(draft));
      setSaved(draft);
      setEditing(false);
      setMessage("Your gamer traits are saved on this device.");
    } catch {
      setMessage("Your browser couldn’t save these traits. Please try again.");
    }
  }

  return <div className="gamer-traits">
    <div className="gamer-traits-heading">
      <h2>{saved === null ? "Suggested gamer traits" : "Your gamer traits"}</h2>
      <button type="button" className="gamer-traits-edit" aria-expanded={editing} aria-controls={editorId}
        onClick={() => { setDraft(selected); setEditing(!editing); setMessage(""); }}>{editing ? "Cancel" : "Choose traits"}</button>
    </div>
    <p className="gamer-traits-hint">Pick the play styles that feel like you.</p>
    {!editing && <ul className="gamer-traits-badges" aria-label={saved === null ? "Suggested gamer traits" : "Selected gamer traits"}>
      {selected.map((id) => {
        const option = options.find((item) => item.id === id);
        return <li key={id}><span aria-hidden="true">{option.icon}</span>{option.label}</li>;
      })}
    </ul>}
    {!editing && selected.length === 0 && <p className="gamer-traits-hint">No traits chosen yet. Make this space your own.</p>}
    {editing && <div id={editorId} className="gamer-traits-editor">
      <div className="gamer-traits-options" role="group" aria-label="Choose up to three gamer traits">
        {options.map((option) => <button type="button" key={option.id} aria-pressed={draft.includes(option.id)}
          disabled={draft.length === 3 && !draft.includes(option.id)}
          onClick={() => { setMessage(""); setDraft((current) => current.includes(option.id) ? current.filter((id) => id !== option.id) : [...current, option.id]); }}>
          <span aria-hidden="true">{option.icon}</span>{option.label}<span aria-hidden="true">{draft.includes(option.id) ? "✓" : "+"}</span>
        </button>)}
      </div>
      <div className="gamer-traits-controls"><small>{draft.length}/3 selected · Deselect one to swap</small><button type="button" onClick={save}>Save traits</button></div>
    </div>}
    <p className="gamer-traits-note">These describe your play style. Your Big Five results stay the same.</p>
    <p className="gamer-traits-message" role="status">{message}</p>
  </div>;
}
