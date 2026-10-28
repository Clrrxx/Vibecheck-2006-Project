import { useEffect, useId, useRef, useState } from "react";
import characters from "../assets/gamer-characters-transparent.png";
import { characterViews } from "../data/characterViews";
import { options, suggestions, readTraits } from "../data/gamerTraits";
import "./GamerCard.css";

const themes = {
  "Curious Pathfinder": { color: "#69d8bf", ability: "Uncharted curiosity", description: "Every unfamiliar path holds a new possibility." },
  "Thoughtful Navigator": { color: "#b096ff", ability: "A plan for the journey", description: "A thoughtful route can turn a quest into an adventure." },
  "Campfire Connector": { color: "#ffbd7f", ability: "Gather the party", description: "The next great story begins with a conversation." },
  "Kindred Companion": { color: "#f19dcc", ability: "Better together", description: "A little kindness goes a long way on any quest." },
  "Reflective Voyager": { color: "#94bdff", ability: "An inward compass", description: "There is room for reflection on every journey." },
  "Versatile Adventurer": { color: "#efce80", ability: "Many paths, one you", description: "A little of every play style, a journey all your own." },
};

function drawCard(canvas, image, { title, name, scores, badges, chosen }) {
  const ctx = canvas.getContext("2d");
  canvas.width = 1500;
  canvas.height = 2100;
  ctx.scale(2, 2);
  const theme = themes[title] ?? themes["Versatile Adventurer"];
  function box(x, y, w, h, radius, fill, stroke) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function text(value, x, y, size = 18, color = "#f5efff", weight = 500, maxWidth) {
    ctx.font = `${weight} ${size}px Arial, sans-serif`;
    while (maxWidth && ctx.measureText(value).width > maxWidth && size > 10) {
      size -= 1; ctx.font = `${weight} ${size}px Arial, sans-serif`;
    }
    ctx.fillStyle = color; ctx.fillText(value, x, y);
  }
  const gold = ctx.createLinearGradient(0, 0, 750, 1050);
  gold.addColorStop(0, "#fff0b5"); gold.addColorStop(.35, "#b79452"); gold.addColorStop(.65, "#efdb9b"); gold.addColorStop(1, "#98733e");
  box(0, 0, 750, 1050, 35, gold);
  box(15, 15, 720, 1020, 25, "#151320", "#ffefba");
  box(28, 28, 694, 994, 19, "#1c192c", "#c5ab7855");
  text("VIBECHECK  /  THE LANTERN GUILD", 48, 62, 13, "#dfc792", 700);
  text("PERSONALITY CARD", 540, 62, 12, "#dfc792", 700, 160);
  text(title, 48, 111, 36, "#f5efff", 800, 650);
  text(`${name.trim() || "Adventurer"} · Quest complete`, 49, 143, 17, theme.color, 600, 650);

  const scene = ctx.createRadialGradient(375, 340, 5, 375, 340, 390);
  scene.addColorStop(0, theme.color); scene.addColorStop(.5, "#383054"); scene.addColorStop(1, "#111222");
  box(47, 163, 656, 366, 10, scene, "#c9ad76");
  ctx.save();
  ctx.beginPath(); ctx.roundRect(48, 164, 654, 364, 9); ctx.clip();
  ctx.globalAlpha = .18;
  for (let i = 0; i < 12; i++) {
    ctx.strokeStyle = "#f5e7ff";
    ctx.beginPath(); ctx.moveTo(375, 530); ctx.lineTo(i * 85 - 100, 165); ctx.stroke();
  }
  ctx.globalAlpha = .5;
  for (let i = 0; i < 32; i++) { ctx.fillStyle = "#fff0c5"; ctx.fillRect(65 + (i * 137) % 620, 180 + (i * 79) % 310, i % 3 + 1, i % 3 + 1); }
  ctx.globalAlpha = 1;
  const view = characterViews[title];
  if (view && image) {
    const [sx, sy, sw, sh] = view.split(" ").map(Number);
    const scale = Math.min(410 / sw, 350 / sh);
    ctx.drawImage(image, sx, sy, sw, sh, 375 - sw * scale / 2, 172, sw * scale, sh * scale);
  }
  ctx.restore();
  text("GAMER ARCHETYPE  ·  FIRST QUEST EDITION", 61, 555, 12, "#d7bd88", 700);
  text(theme.ability, 48, 599, 27, theme.color, 700, 650);
  text(theme.description, 48, 627, 17, "#d7cfdf", 400, 650);
  text("YOUR BIG FIVE", 48, 674, 13, "#dfc792", 700);
  text("OVERALL SCALE  0–5", 547, 674, 11, "#aca2bc", 500);
  scores.forEach((trait, index) => {
    const y = 704 + index * 37;
    text(trait.name, 48, y, 16, "#e5dfee", 500);
    box(267, y - 13, 352, 9, 4, "#353044");
    box(267, y - 13, Math.max(2, 352 * trait.average / 5), 9, 4, theme.color);
    text(trait.average.toFixed(1), 647, y, 18, "#f8eddb", 700);
  });
  text(chosen ? "YOUR PLAY STYLE" : "SUGGESTED PLAY STYLE", 48, 910, 12, "#dfc792", 700);
  let badgeX = 48;
  badges.forEach((badge) => {
    const label = options.find((option) => option.id === badge)?.label;
    if (!label) return;
    ctx.font = "600 13px Arial, sans-serif";
    const width = ctx.measureText(label).width + 24;
    box(badgeX, 923, width, 31, 15, "#30273f", "#a590bd66");
    text(label, badgeX + 12, 944, 13, "#e2d4f4", 600);
    badgeX += width + 8;
  });
  text("15 moments. One adventure. Your own way to play.", 48, 983, 13, "#bcb0c8", 400);
  text("Exploratory personality profile · Higher scores do not mean better.", 48, 1005, 10, "#95899f", 400);
}

export default function GamerCard({ uid, title, name = "Adventurer", scores }) {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const instructionsId = useId();
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      try {
        const saved = readTraits(uid);
        drawCard(canvasRef.current, image, { title, name, scores, chosen: saved !== null, badges: saved ?? suggestions[title] ?? [] });
        setState("ready");
      } catch { setState("error"); }
    };
    image.onerror = () => { if (!cancelled) setState("error"); };
    image.src = characters;
    return () => { cancelled = true; };
  }, [uid, title, name, scores, attempt]);

  function setTilt(x, y) {
    const tilt = { x: Math.max(-12, Math.min(12, x)), y: Math.max(-12, Math.min(12, y)) };
    tiltRef.current = tilt;
    const stage = stageRef.current;
    if (!stage) return;
    stage.style.setProperty('--card-rx', `${tilt.x}deg`);
    stage.style.setProperty('--card-ry', `${tilt.y}deg`);
    stage.style.setProperty('--foil-x', `${50 + tilt.y * 3}%`);
    stage.style.setProperty('--foil-y', `${50 - tilt.x * 3}%`);
    stage.style.setProperty('--foil-angle', `${120 + tilt.y * 3}deg`);
  }
  function pointerMove(event) {
    if (state !== "ready") return;
    const drag = dragRef.current;
    if (drag && drag.id === event.pointerId) {
      setTilt(drag.tilt.x - (event.clientY - drag.y) / 12, drag.tilt.y + (event.clientX - drag.x) / 12);
    } else if (event.pointerType === 'mouse') {
      const bounds = event.currentTarget.getBoundingClientRect();
      setTilt((.5 - (event.clientY - bounds.top) / bounds.height) * 20, ((event.clientX - bounds.left) / bounds.width - .5) * 20);
    }
  }
  function pointerDown(event) {
    if (state !== "ready" || event.button !== 0) return;
    dragRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, tilt: { ...tiltRef.current } };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = 'true';
  }
  function pointerUp(event) {
    if (dragRef.current?.id !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.dataset.dragging = 'false';
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (event.type === 'pointercancel') setTilt(0, 0);
  }
  function keyTilt(event) {
    const { x, y } = tiltRef.current;
    const actions = { ArrowLeft: () => setTilt(x, y - 3), ArrowRight: () => setTilt(x, y + 3), ArrowUp: () => setTilt(x + 3, y), ArrowDown: () => setTilt(x - 3, y), Home: () => setTilt(0, 0) };
    if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
  }

  function download() {
    setMessage("");
    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) { setMessage("Couldn’t create the image. Please try again."); return; }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `vibecheck-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        setMessage("Your card is ready. Check your browser’s downloads.");
      }, "image/png");
    } catch { setMessage("Couldn’t save the image. Please try again."); }
  }

  return <section className="gamer-card-section" aria-label="Your collectible gamer card">
    <div className="gamer-card-copy"><span className="gamer-card-eyebrow">QUEST COMPLETE · CARD UNLOCKED</span><h2>A card that’s yours.</h2><p>Your character, personality scores and play style in one keepsake.</p></div>
    <div className="gamer-card-preview" aria-busy={state === "loading"}>
      <div className={`gamer-card-stage ${state === "ready" ? "is-ready" : ""}`}
        ref={stageRef} role="group" aria-label="Interactive gamer card" aria-describedby={instructionsId}
        tabIndex={state === "ready" ? 0 : -1}
        onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
        onLostPointerCapture={() => { dragRef.current = null; if (stageRef.current) stageRef.current.dataset.dragging = 'false'; }}
        onPointerLeave={() => { if (!dragRef.current) setTilt(0, 0); }} onBlur={() => { if (!dragRef.current) setTilt(0, 0); }}
        onKeyDown={keyTilt}>
        <div className="gamer-card-surface">
      <canvas ref={canvasRef} className={state === "ready" ? "is-ready" : ""} role="img" aria-label={`${name.trim() || "Adventurer"}’s ${title} collectible card. ${scores.map((trait) => `${trait.name}: ${trait.average.toFixed(1)} out of 5`).join(". ")}`} />
          <span className="gamer-card-foil" aria-hidden="true" />
          <span className="gamer-card-glare" aria-hidden="true" />
        </div>
      </div>
      {state === "loading" && <p role="status">Creating your card…</p>}
      {state === "error" && <p role="alert">Your card couldn’t load. <button type="button" onClick={() => { setState("loading"); setAttempt((value) => value + 1); }}>Try again</button></p>}
    </div>
    <p className="gamer-card-interaction-hint" id={instructionsId}>Hover or drag to tilt · Arrow keys to rotate · Home to reset</p>
    <div className="gamer-card-controls">
      <button type="button" disabled={state !== "ready"} onClick={() => setTilt(0, 0)}>Reset tilt ↺</button>
      <button className="gamer-card-download" type="button" disabled={state !== "ready"} onClick={download}>↓ Save card as PNG</button>
    </div>
    <small className="gamer-card-save-hint">1500 × 2100 PNG · Original artwork with your name; interactive foil stays here</small>
    <p className="gamer-card-status" role="status">{message}</p>
  </section>;
}

export function GamerCardDialog({ onClose, ...props }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return <dialog className="gamer-card-dialog" ref={ref} aria-label="Your gamer card" onClose={onClose} onClick={(event) => { if (event.target === ref.current) ref.current.close(); }}>
    <button className="gamer-card-close" type="button" onClick={() => ref.current.close()} aria-label="Close gamer card">✕</button>
    <GamerCard {...props} />
  </dialog>;
}
