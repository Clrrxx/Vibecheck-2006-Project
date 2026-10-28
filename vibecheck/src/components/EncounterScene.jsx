/* Story set pieces share the landscape's integer pixel grid. */
function Person({ x, y, color = '#ad94c4' }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d="M-5 8H6v2H-5Z" fill="#453f48" opacity=".4" />
    <path d="M-3-17h6v7h-6Z" fill="#e3b58b" /><path d="M1-14h1v1H1Z" fill="#604954" />
    <path d="M-4-19h7v3h-7ZM-4-16h2v3h-2Z" fill="#51435e" /><path d="M-3-19h4v1h-4Z" fill="#89718e" />
    <path d="M-4-10h8v12h-8Z" fill={color} /><path d="M-6-9h2v9h-2ZM4-9h2v9H4Z" fill={color} />
    <path d="M-6 0h2v3h-2ZM4 0h2v3H4Z" fill="#dfb18b" /><path d="M-4-1h8v2h-8Z" fill="#c6a87d" />
    <path d="M-3 2h2v6h-2ZM1 2h2v6H1Z" fill="#685363" /><path d="M-4 7h3v2h-3ZM1 7h4v2H1Z" fill="#c3a17e" />
  </g>;
}
function Star({ x = 273, y = 126, dim = false }) {
  return <g transform={`translate(${x} ${y})`}><rect x="-10" y="-11" width="20" height="22" fill="#554b66" /><rect x="-8" y="-9" width="16" height="18" fill="#8e95ac" opacity=".5" /><path className="chapter-window" d="M-2-7h4v5h5v4H2v5h-4V2h-5v-4h5Z" fill={dim ? '#9c9ba8' : '#ffe0a0'} /></g>;
}
function Table() {
  return <g><path d="M230 137h82v6h-82ZM237 143h5v15h-5ZM300 143h5v15h-5Z" fill="#b58b68" /><path d="M230 143h82v3h-82Z" fill="#73544d" /></g>;
}
function Book({ x = 266, y = 130 }) {
  return <g transform={`translate(${x} ${y})`}><path d="M-12-5h11l2 2 2-2h11v15H3l-2 2-2-2h-11Z" fill="#e5cca0" /><path d="M1-3v13M-9-1h7M5-1h7M-9 3h7M5 3h7" stroke="#94765d" /></g>;
}
function Fire() {
  return <g><path d="M260 155h28v5h-28Z" fill="#775449" /><path className="chapter-flame" d="M264 154v-8h4v-9h4v-9h4v12h5v6h4v8Z" fill="#f3a16a" /><path d="M271 154v-9h6v9Z" fill="#ffe9a8" /></g>;
}
export default function EncounterScene({ scene, fullSetting = false }) {
  const room = ['fireside', 'departure', 'packing'].includes(scene);
  const observatory = ['lenses', 'library', 'cradle'].includes(scene);
  return <g className={`encounter-scene encounter-scene-${scene}`}>
    {!fullSetting && (room || observatory) && <g><path d="M207 66h132v99H207Z" fill={room ? '#674e52' : '#68667e'} /><path d="M213 72h120v81H213Z" fill={room ? '#95705e' : '#9290a6'} />{Array.from({ length: 8 }, (_, i) => <path key={i} d={`M213 ${78 + i * 9}h120`} stroke={room ? '#ab8267' : '#aaa4b7'} />)}<path d="M207 153h132v13H207Z" fill="#b59a80" /><path d="M221 83h24v32h-24Z" fill="#423f5c" /><path d="M232 83v32M221 99h24" stroke="#d1b391" strokeWidth="2" /></g>}
    {scene === 'fireside' && <><path d="M256 92h39v62h-39Z" fill="#55434c" /><path d="M262 112h27v42h-27Z" fill="#302f43" /><Fire /><Person x={238} y={144} /><Person x={310} y={141} color="#84b3a0" /></>}
    {scene === 'departure' && <><Table /><Book /><Person x={223} y={133} /><Person x={320} y={133} color="#84b3a0" /><path d="M287 117h14v10h-14Z" fill="#e4c997" /><path d="M290 120h8M290 124h5" stroke="#977662" /></>}
    {scene === 'packing' && <><Table /><path d="M268 115h19v22h-19ZM272 111h11v6h-11Z" fill="#776985" /><path d="M271 126h13v7h-13Z" fill="#c0a073" /><Book x={246} /><path d="M300 116v18" stroke="#d7c19a" strokeWidth="3" /></>}
    {scene === 'fork' && <>
      <g fill="#aa8d70">
        <path d="M157 196v-7h9v-8h11v-8h13v-8h13v-8h23v9h-10v9h-10v10h-8v11Z" />
        <path d="M204 167v-9h-10v-7h-10v-6h-10v-5h-9v-4h12v3h10v5h11v6h12v7h12v10Z" />
        <path d="M212 167v-10h12v-6h14v-6h16v-5h18v-4h17v5h-14v5h-17v6h-15v7h-13v8Z" />
      </g>
      <g fill="#c3a17e">
        <path d="M162 196v-6h11v-8h11v-7h13v-8h12v-6h12v4h-9v9h-10v10h-9v12Z" />
        <path d="M208 161v-6h-12v-6h-11v-6h-10v-4h-5v-1h6v3h10v5h11v6h12v6h8v3Z" />
        <path d="M217 163v-5h11v-6h14v-5h16v-5h17v-4h10v2h-12v5h-17v5h-16v6h-13v7Z" />
      </g>
      <path d="M169 193h5v1h-5ZM185 179h7v2h-7ZM207 165h5v1h-5ZM191 149h4v1h-4ZM248 147h5v1h-5Z" fill="#e0bd91" />
      <path d="M235 139h3v17h-3Z" fill="#88664f" /><path d="M234 139h1v17h-1Z" fill="#d5b48a" />
      <path d="M223 138v-2h4v-2h15v6h-15v-2ZM231 142h15v2h4v2h-4v2h-15Z" fill="#bf996f" />
      <path d="M228 136h9v1h-9ZM234 144h9v1h-9Z" fill="#81634f" />
      <path d="M254 96h30v5h-30ZM290 79h25v5h-25Z" fill="#8e9f92" />
      <path d="M261 91h16v5h-16ZM296 74h13v5h-13Z" fill="#b2c69c" /><Flowers />
    </>}
    {scene === 'fading-star' && <><Table /><Star dim /><Person x={312} y={133} color="#84b3a0" /></>}
    {scene === 'market' && <><path d="M221 105h108v9H221Z" fill="#cc9e83" /><path d="M221 105l12-19h84l12 19Z" fill="#b385a0" /><path d="M230 114v42M320 114v42" stroke="#b29375" strokeWidth="4" /><Table /><Person x={244} y={126} /><Person x={290} y={126} color="#84b3a0" /><path d="M259 131h8v5h-8ZM282 131h8v5h-8Z" fill="#edd4a2" /></>}
    {scene === 'supplies' && <><Person x={271} y={128} color="#84b3a0" /><path d="M262 146h13v8h-13Z" fill="#b58d69" /><path d="M281 150h5v4h-5ZM290 156h7v3h-7ZM251 157h4v4h-4Z" fill="#f3d09a" /></>}
    {scene === 'journal' && <><Table /><Book /><path d="M287 120l-5 13" stroke="#e9d6b4" strokeWidth="2" /></>}
    {scene === 'gate' && <><path d="M246 146V91h56v55" fill="#45485b" stroke="#a3a39b" strokeWidth="6" />{Array.from({ length: 9 }, (_, i) => <rect key={i} x={257 + i % 3 * 12} y={102 + Math.floor(i / 3) * 12} width="8" height="8" fill={i % 2 ? '#a6b4b5' : '#edc790'} />)}</>}
    {scene === 'signal' && <><Person x={245} y={141} /><Person x={294} y={141} color="#84b3a0" /><path d="M249 128l8-10m40 10 8-10" stroke="#e1b78c" strokeWidth="3" /><path d="M258 116v-10h12l-4 5 4 5Z" fill="#d6ad91" /></>}
    {scene === 'stories' && <><Fire /><Person x={242} y={145} /><Person x={310} y={143} color="#84b3a0" /><Person x={290} y={119} color="#c39b7b" /></>}
    {scene === 'chores' && <><Person x={246} y={140} /><Person x={302} y={140} color="#84b3a0" /><path d="M260 143h17v14h-17Z" fill="#9b9ca0" /><path d="M263 143v-5h11v5" fill="none" stroke="#c5b6a4" strokeWidth="2" /><path d="M314 125l-8 31" stroke="#c4a17c" strokeWidth="3" /><path d="M301 152h12v7h-12Z" fill="#d5bc8e" /></>}
    {scene === 'lenses' && <><Table />{[245, 272, 299].map(x => <g key={x}><path d={`M${x} 116v21`} stroke="#d6b992" strokeWidth="3" /><circle cx={x} cy="116" r="7" fill="#a4d0d3" stroke="#eed6a5" strokeWidth="2" /></g>)}</>}
    {scene === 'library' && <><path d="M253 78h69v67h-69Z" fill="#554c64" />{[0, 1, 2].map(row => <g key={row}>{Array.from({ length: 9 }, (_, i) => <rect key={i} x={257 + i * 7} y={83 + row * 20} width="5" height="14" fill={['#ba9ab7', '#d6b284', '#8fb6b2'][i % 3]} />)}<path d={`M253 ${99 + row * 20}h69`} stroke="#c2a282" strokeWidth="3" /></g>)}<Book x={235} y={141} /></>}
    {scene === 'cradle' && <><path d="M263 139h24v15h-24ZM258 153h34v6h-34Z" fill="#d2b6a3" /><path className="chapter-window" d="M268 75h10v46h-10Z" fill="#ffe4b1" opacity=".35" /><Star x={273} y={128} /></>}
  </g>;
}
function Flowers() { return <path d="M266 85h4v4h-4ZM301 68h4v4h-4Z" fill="#ecc2da" />; }
