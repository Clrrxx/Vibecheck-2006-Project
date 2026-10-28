import EncounterScene from './EncounterScene';

function Tree({ x, y, scale = 1 }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}><path d="M-3-8h6v24h-6Z" fill="#826754" /><path d="M-2-7h2v29h-2Z" fill="#b08c66" /><path d="M-4-68h8v12h6v12h7v12h8v14h8v12H17v7h-34v-7h-16v-12h8v-14h8v-12h7v-12h6Z" fill="#264e4d" /><path d="M-4-60h4v16h-6v13h-7v13h-9v8h13v-8h9v-13h5v-13H1v-12h-5Z" fill="#47775e" /><path d="M6-27h5v13h10v7H8Z" fill="#709068" /></g>;
}
function Lantern({ x, y }) {
  return <g transform={`translate(${x} ${y})`}><path d="M0-10v10" stroke="#aa8869" /><path d="M-5 0H5v13H-5Z" fill="#5b4849" /><path className="chapter-window" d="M-3 2h6v9h-6Z" fill="#ffdba0" /><path d="M-1 3h2v7h-2Z" fill="#fff0bf" /></g>;
}
function Stall({ x, color }) {
  return <g transform={`translate(${x} 0)`}><path d="M0 106V75h65v31" fill="none" stroke="#a88162" strokeWidth="3" /><path d="M-6 74v-6h5v-6h5v-6h57v6h5v6h5v6Z" fill={color} />{[5, 25, 45].map(i => <path key={i} d={`M${i} 56h9v18h-9Z`} fill="#e5c59c" opacity=".65" />)}<path d="M-6 74h77v6H-6Z" fill={color} /><path d="M-2 107h69v21H-2Z" fill="#aa7d5b" /><path d="M-2 109h69v3H-2ZM4 128v10M60 128v10" stroke="#604e49" strokeWidth="3" />{[8, 22, 39, 51].map((i, n) => <g key={i}><rect x={i} y="99" width="9" height="8" fill={['#c7956e', '#d4b978', '#a4b37b', '#c49097'][n]} /><path d={`M${i + 2} 97h5v3h-5Z`} fill="#e8cea1" /></g>)}</g>;
}
function Guest({ x, y, color = '#9d8ab4' }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-5-30h10v10H-5Z" fill="#dfb58c" /><path d="M-6-32H5v5H-6Z" fill="#51465c" /><path d="M-6-19H6v17H-6Z" fill={color} /><path d="M-9-17h3v13h-3ZM6-17h3v13H6Z" fill="#cda280" /><path d="M-5-2h4V7h-5ZM1-2h4V7H1Z" fill="#584b55" /><path d="M-6 7h5v2h-5ZM1 7h6v2H1Z" fill="#b69779" /><path d="M-5-6H5v2H-5Z" fill="#d1b07e" /></g>;
}
function Market() {
  return <>
    <Stall x={45} color="#ae7f96" /><Stall x={137} color="#759d91" />
    <Guest x={252} y={137} /><Guest x={299} y={137} color="#7da89a" /><Guest x={343} y={152} color="#ba947d" />
    <path d="M233 138h93v7h-93ZM242 145h5v23h-5ZM313 145h5v23h-5Z" fill="#a97f5e" />
    <path d="M230 142h99v3h-99Z" fill="#74564a" /><path d="M238 135h85v3h-85Z" fill="#d0aa7c" />
    <path d="M252 128h8v7h-8ZM295 128h8v7h-8Z" fill="#efcf92" /><path d="M261 129h17v4h-17Z" fill="#e5c6a0" /><path d="M266 126h8v4h-8Z" fill="#b47d56" />
    <path d="M244 158h76v5h-76ZM249 163v12M314 163v12" stroke="#88654e" strokeWidth="3" />
    <Guest x={78} y={103} color="#c69e79" /><Guest x={172} y={103} color="#a894b2" />
    <path d="M20 40h344" stroke="#675b54" />{[35, 83, 131, 179, 227, 275, 323].map((x, i) => <path key={x} d={`M${x} 40h12v4h-3v4h-3v4h-3v-4h-3Z`} fill={i % 2 ? '#e5c38d' : '#b18ba7'} />)}
    <path d="M14 181h37v4H14ZM303 184h44v4h-44Z" fill="#63795c" />
  </>;
}
function Interior({ observatory, scene }) {
  return <>
    <rect width="384" height="196" fill={observatory ? '#454760' : '#57454c'} />
    <rect x="15" y="18" width="354" height="118" fill={observatory ? '#747389' : '#886553'} />
    {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M15 ${29 + i * 11}h354`} stroke={observatory ? '#858397' : '#9c765c'} />)}
    {[18, 120, 260, 359].map(x => <path key={x} d={`M${x} 18h7v121h-7Z`} fill={observatory ? '#b0a1aa' : '#4e4047'} />)}
    <path d="M0 136h384v60H0Z" fill={observatory ? '#7e798c' : '#9e7c62'} />
    {Array.from({ length: 6 }, (_, i) => <path key={i} d={`M0 ${139 + i * 11}h384`} stroke={observatory ? '#938a9c' : '#76594d'} />)}
    {[0, 1, 2, 3, 4, 5, 6].map(i => <path key={i} d={`M${i * 64} 138v11m32 0v11m-32 0v11m32 0v11m-32 0v14`} stroke={observatory ? '#938a9c' : '#76594d'} />)}
    <path d="M46 49h49v69H46Z" fill="#433e57" /><path d="M51 54h39v59H51Z" fill={observatory ? '#9697b4' : '#615f7f'} /><path d="M70 54v59M51 81h39" stroke="#c2a58c" strokeWidth="3" />
    <path d="M78 61h6v6h-6ZM57 70h2v2h-2Z" fill="#ffe0a8" />
    <path d="M37 117h67v5H37Z" fill="#c4a080" />
    <Lantern x={145} y={69} /><Lantern x={341} y={69} />
    <path d="M139 151h183v29H139Z" fill={observatory ? '#575b79' : '#78516a'} /><path d="M144 155h173v21H144Z" fill="none" stroke="#bf9b7c" strokeWidth="2" />
    {scene === 'packing' && <><path d="M29 135h78v22H29Z" fill="#72556a" /><path d="M33 129h70v14H33Z" fill="#c5a89e" /><path d="M33 128h20v13H33Z" fill="#ebd5b7" /><path d="M29 156v9M103 156v9" stroke="#503e49" strokeWidth="4" /></>}
    {observatory && <><path d="M167 26h52v47h-52Z" fill="#4b4d6c" /><circle cx="193" cy="49" r="16" fill="none" stroke="#c1b2ad" strokeWidth="2" /><path d="M193 30v38M174 49h38M180 36l26 26M180 62l26-26" stroke="#c1b2ad" /><circle cx="193" cy="49" r="5" fill="#edcfa1" /></>}
  </>;
}
export default function StoryLandscape({ chapter, chapterIndex, scene, children }) {
  const indoor = ['fireside', 'departure', 'packing', 'lenses', 'library', 'cradle'].includes(scene);
  const observatory = chapterIndex === 4;
  const camp = chapterIndex === 3;
  const river = ['supplies', 'journal'].includes(scene);
  const market = scene === 'market';
  const labels = { fireside: 'Guild · Fireside hall', departure: 'Guild · Planning room', packing: 'Guild · Guest room', market: 'Woodland travelling market', 'fading-star': 'Whispering Woods · Rest stop', fork: 'Whispering Woods · Two trails', supplies: 'Silver Crossing · Riverbank', journal: 'Silver Crossing · Journal stop', gate: 'Silver Crossing · Ancient gate', signal: 'Ember Camp · Signal practice', stories: 'Ember Camp · Fireside', chores: 'Ember Camp · Camp chores', lenses: 'Observatory · Lens chamber', library: 'Observatory · Library', cradle: 'Observatory · Star chamber' };
  return <div className={`quest-landscape trail-scene chapter-scene story-scene story-scene-${scene}`} aria-hidden="true" style={{ '--scene-color': chapter.color }}>
    <svg className="trail-world chapter-pixel-world" viewBox="0 0 384 196" shapeRendering="crispEdges">
      {indoor ? <Interior observatory={observatory} scene={scene} /> : <>
        <rect width="384" height="196" fill={camp ? '#2e344e' : market ? '#9598a6' : '#747992'} />
        <path d="M0 70h384v60H0Z" fill={camp ? '#424862' : '#b9aaa9'} />
        {Array.from({ length: 24 }, (_, i) => <rect key={i} x={(i * 53 + 16) % 380} y={15 + (i * 17) % 67} width="1" height="1" fill="#f4dfbb" />)}
        <path d="M300 23h17v4h5v16h-5v4h-17v-4h-5V27h5Z" fill={camp ? '#ffe0ad' : '#f3d7aa'} />
        <path d="M0 117V98h27V85h32v11h41V82h37v16h52V88h33v14h45V87h42v11h39V86h36v55H0Z" fill={camp ? '#394e5a' : '#607c77'} />
        <path d="M0 126h384v70H0Z" fill={camp ? '#3c5b54' : '#6d8766'} />
        {[8, 43, 83, 125, 164, 206, 249, 291, 336, 378].map((x, i) => <Tree key={x} x={x} y={126} scale={.55 + i % 3 * .13} />)}
        {river ? <><path d="M0 130h384v28H0Z" fill="#7095a2" /><path d="M0 156h384v40H0Z" fill="#8e9b79" />{Array.from({ length: 22 }, (_, i) => <path key={i} d={`M${i * 19} ${135 + i % 3 * 7}h10`} stroke="#b0c6bd" />)}<path d="M55 125h89v28H55Z" fill="#b38c69" />{Array.from({ length: 12 }, (_, i) => <path key={i} d={`M${58 + i * 7} 125v28`} stroke="#7d6755" />)}<path d="M52 121h95M52 134h95" stroke="#d1b38a" strokeWidth="3" />{[56, 83, 113, 141].map(x => <path key={x} d={`M${x} 117v25`} stroke="#b38c69" strokeWidth="3" />)}</> : scene !== 'fork' && <path d={market ? 'M16 128h352v68H16Z' : 'M62 136h267v60H62Z'} fill={camp ? '#6d7060' : '#b5a080'} />}
        {market && <Market />}
        {camp && <><path d="M27 143v-10h7v-13h7v-13h7V94h8v13h7v13h7v13h7v10Z" fill="#b29291" /><path d="M56 94l25 49H56Z" fill="#806d87" /><path d="M49 122h11v21H44v-12h5Z" fill="#47445c" /><path d="M98 142h24v13H98Z" fill="#997a5f" /><path d="M100 140h20v4h-20Z" fill="#c0a078" /></>}
        {!market && scene !== 'fork' && Array.from({ length: 18 }, (_, i) => <path key={i} d={`M${20 + i * 20} ${170 + i % 3 * 8}h3v1h-3Z`} fill="#d5bd92" opacity=".65" />)}
      </>}
      {!market && <g transform={scene === 'fork' ? undefined : 'translate(-100 -33) scale(1.35)'}><EncounterScene scene={scene} fullSetting /></g>}
      {!indoor && <><Tree x={8} y={179} scale={1.35} /><Tree x={378} y={182} scale={1.3} /></>}
    </svg>
    {children}<span className="trail-location">{labels[scene] || chapter.place}</span>
  </div>;
}
