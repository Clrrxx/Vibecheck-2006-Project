import { useId } from 'react';
import './ChapterLandscape.css';
import EncounterScene from './EncounterScene';
import StoryLandscape from './StoryLandscape';

function skyColor(colors, step) {
  const position = step / 26 * (colors.length - 1);
  const start = Math.min(Math.floor(position), colors.length - 2);
  const fraction = position - start;
  const channels = color => [1, 3, 5].map(offset => parseInt(color.slice(offset, offset + 2), 16));
  const a = channels(colors[start]);
  const b = channels(colors[start + 1]);
  return `rgb(${a.map((value, i) => Math.round(value + (b[i] - value) * fraction)).join(',')})`;
}

function Pine({ x, y, scale = 1, dark = false }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M-3-5H4V14H-3Z" fill="#433b3e" /><path d="M-1-4H2V13H-1Z" fill="#98715b" />
    <path d="M-3-66H3V-60H7V-53H11V-46H15V-38H19V-30H15V-27H23V-18H27V-8H18V-4H-19V-8H-27V-17H-23V-26H-16V-30H-20V-37H-15V-45H-11V-52H-7V-59H-3Z" fill={dark ? '#203f45' : '#284f4c'} />
    <path d="M-3-62H1V-52H-3V-43H-8V-34H-13V-31H-5V-36H2V-25H-4V-18H-14V-12H-21V-17H-17V-24H-12V-32H-16V-37H-11V-44H-7V-53H-3Z" fill={dark ? '#315a50' : '#4a7c5e'} />
    <path d="M3-48H7V-40H11V-35H5ZM4-24H9V-18H17V-14H7V-18H2ZM-9-12H-2V-8H-9Z" fill={dark ? '#416950' : '#6a9469'} />
    <path d="M-20-8H-9V-5H17V-8H24V-4H17V0H-17V-4H-20Z" fill="#193c42" />
  </g>;
}

function Flowers({ x, y, color = '#e6b477' }) {
  return <g transform={`translate(${x} ${y})`}><path d="M0 0V6M6 3V9" stroke="#639363" /><path d="M-2-2H2V2H-2ZM4 0H8V4H4Z" fill={color} /><path d="M0-1H1V1H0ZM6 1H7V3H6Z" fill="#fff0b5" /></g>;
}

function Fence({ x, y, count = 5 }) {
  return <g transform={`translate(${x} ${y})`}><path d={`M0 3H${count * 10}V6H0ZM0 10H${count * 10}V12H0Z`} fill="#8b6954" />{Array.from({ length: count + 1 }, (_, i) => <g key={i}><path d={`M${i * 10} 0h3v17h-3Z`} fill="#b28b64" /><path d={`M${i * 10} 0h3v3h-3Z`} fill="#e0b887" /></g>)}</g>;
}

function Cottage() {
  return <g>
    <path d="M238 153H333V158H238Z" fill="#1b363d" />
    <path d="M246 101H328V151H246Z" fill="#634b48" /><path d="M250 104H325V148H250Z" fill="#b08465" />
    {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M250 ${107 + i * 6}H325v2H250Z`} fill={i % 2 ? '#8f6956' : '#c19570'} />)}
    <path d="M310 79V61H320V89" fill="#78565a" /><path d="M308 60H322V64H308Z" fill="#bb8b79" />
    <g className="chapter-smoke" fill="#a893ab" opacity=".5"><path d="M312 54h6v-7h-6ZM307 41h9v-5h-9ZM312 29h11v-4h-11Z" /></g>
    <path d="M238 101V96H243V91H248V86H253V81H258V76H263V71H268V66H306V71H311V76H316V81H321V86H326V91H331V96H336V102Z" fill="#493c4f" />
    <path d="M243 96H331V100H243Z" fill="#dda177" />
    {Array.from({ length: 5 }, (_, row) => <g key={row}>{Array.from({ length: 12 - row * 2 }, (_, col) => <rect key={col} x={246 + row * 5 + col * 7} y={91 - row * 5} width="6" height="4" fill={(row + col) % 3 === 0 ? '#c07a67' : (row + col) % 3 === 1 ? '#a26361' : '#8b5460'} />)}</g>)}
    <path d="M248 102V149H252V102M323 102V149H327V102" stroke="#e2b083" strokeWidth="2" />
    <path d="M259 113H276V132H259ZM293 113H310V132H293Z" fill="#594750" /><path className="chapter-window" d="M261 115H274V129H261ZM295 115H308V129H295Z" fill="#f2b866" />
    <path d="M262 116h5v5h-5ZM296 116h5v5h-5Z" fill="#ffe7a3" /><path d="M267 115V130M261 122H274M301 115V130M295 122H308" stroke="#926855" strokeWidth="2" />
    <path d="M257 131H278V134H257ZM291 131H312V134H291Z" fill="#e0ac79" />
    <path d="M279 123H292V150H279Z" fill="#4f3f42" /><path className="chapter-window" d="M282 125H290V148H282Z" fill="#f7cb7d" /><path d="M284 126H286V146H284Z" fill="#ffe4a0" />
    <path d="M276 149H296V153H276ZM273 153H299V156H273Z" fill="#c3a080" />
    <path d="M277 108H294V117H277Z" fill="#493e42" /><path d="M279 110H292V115H279Z" fill="#dcad77" /><path d="M282 112H289V113H282Z" fill="#91604d" />
    <Flowers x={254} y={140} color="#e6a0a0" /><Flowers x={313} y={140} color="#bcb0dc" />
    <path d="M254 146h9v6h-9ZM312 146h9v6h-9Z" fill="#825a54" /><path d="M253 145h11v2h-11ZM311 145h11v2h-11Z" fill="#b37a65" />
    <Fence x={213} y={136} count={2} /><Fence x={332} y={134} count={4} />
  </g>;
}

function Camp() {
  return <g>
    <path d="M74 164V159H79V151H84V143H89V135H94V127H99V119H104V111H109V106H114V111H119V119H124V127H129V135H134V143H139V151H144V159H149V164Z" fill="#a17a81" />
    <path d="M112 110H117V119H122V127H127V135H132V143H137V151H142V159H147V164H120Z" fill="#755b71" /><path d="M104 133H116V140H120V164H92V153H96V144H100V138H104Z" fill="#423e53" />
    <path d="M179 168h30v5h-30ZM184 162h21v4h-21Z" fill="#95644d" /><path d="M182 168h24v2h-24Z" fill="#d79965" />
    <g className="chapter-flame"><path d="M185 163v-8h-3v-7h4v-8h4v-9h4v7h4v8h5v8h-3v9Z" fill="#e88c55" /><path d="M189 162v-10h3v-8h3v8h3v10Z" fill="#ffe39a" /><path d="M191 162v-6h4v6Z" fill="#fff2c8" /></g>
    {[0, 1, 2, 3].map(i => <rect className="chapter-ember" key={i} x={187 + i * 3} y={139 - i * 5} width="1" height="2" fill="#ffda8e" style={{ animationDelay: `${-i}s` }} />)}
  </g>;
}

function Observatory() {
  return <g><path d="M252 104H305V146H252Z" fill="#8a8297" /><path d="M257 108H300V143H257Z" fill="#b3a0ad" />
    <path d="M247 104V96H252V87H257V81H265V77H290V81H298V87H304V96H310V104Z" fill="#65758d" /><path d="M254 95V88H260V83H268V80H282V83H271V87H266V94Z" fill="#a5b4b8" />
    <path d="M270 144V126H275V121H283V126H288V144Z" fill="#f5ce8f" /><path d="M262 110h6v7h-6ZM291 110h6v7h-6Z" fill="#e7c393" /><path d="M246 146H312V151H246Z" fill="#d1b6ae" />
    <path d="M281 78V72H287V66H293V60H301V68H295V73H289V79Z" fill="#c2a9aa" /><path d="M296 59H304V67H296Z" fill="#e1c8b1" />
  </g>;
}

export default function ChapterLandscape({ chapter, chapterIndex, scene, children }) {
  const id = useId().replace(/:/g, '');
  if (scene) return <StoryLandscape chapter={chapter} chapterIndex={chapterIndex} scene={scene}>{children}</StoryLandscape>;
  const night = chapterIndex === 3;
  const dawn = chapterIndex === 4;
  const crossing = chapterIndex === 2;
  const forest = chapterIndex === 1;
  const sky = dawn ? ['#686386', '#b78caa', '#e4b99e', '#f1cfaa'] : night ? ['#262b4c', '#373953', '#55506d', '#78677e'] : ['#46405e', '#66516e', '#92677b', '#c48b88'];
  return <div className={`quest-landscape trail-scene chapter-scene chapter-scene-${chapterIndex}`} aria-hidden="true" style={{ '--scene-color': chapter.color }}>
    <svg className="trail-world chapter-pixel-world" viewBox="0 0 384 196" preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges">
      <defs><pattern id={`${id}-grass`} width="24" height="17" patternUnits="userSpaceOnUse"><path d="M3 7h3v1H3ZM15 13h2v1h-2ZM19 3h3v1h-3Z" fill="#628b67" opacity=".45" /><path d="M8 12h3v1H8ZM20 7h2v1h-2Z" fill="#203e44" opacity=".6" /></pattern></defs>
      {Array.from({ length: 27 }, (_, i) => <rect key={i} y={i * 4} width="384" height="4" fill={skyColor(sky, i)} />)}
      <g fill={dawn ? '#f4c6b0' : '#c99ca8'} opacity={night ? '.1' : '.3'}><path d="M53 44h17v-3h25v3h17v3H53ZM74 49h47v2H74ZM197 30h12v-3h22v3h19v3h-53ZM217 36h42v2h-42Z" /></g>
      {Array.from({ length: 35 }, (_, i) => <rect className="chapter-star" key={i} x={(i * 53 + 17) % 384} y={(i * 29 + 7) % 73} width={i % 7 === 0 ? 2 : 1} height="1" fill="#f5dfbd" style={{ animationDelay: `${-i * .6}s` }} />)}
      <path d="M310 24h15v3h4v4h3v14h-3v4h-4v3h-15v-3h-4v-4h-3V31h3v-4h4Z" fill={dawn ? '#ffdeb1' : '#f5d8a3'} /><path d="M309 30h4v4h-4ZM323 40h4v5h-4ZM314 45h5v3h-5Z" fill="#dcbf96" opacity=".65" />
      <path d="M0 94h12v-7h16v-8h17v-7h14v-7h14v-9h11v9h12v8h15v9h19v8h18v8h32v-7h20v-9h16v-8h13v-6h14v-9h13v9h14v7h16v8h20v8h20v7h28V120H0Z" fill={dawn ? '#8c7e99' : '#60536e'} />
      <path d="M0 111h17v-7h20v-9h19v-8h13v-7h10v7h13v8h18v8h23v8h40v-8h26v-7h25v-8h17v-7h13v-7h12v7h14v7h17v9h24v8h24v7h27V138H0Z" fill={dawn ? '#657187' : '#41475c'} />
      <path d="M0 124h33v-5h29v-5h41v3h34v7h44v-4h37v-7h43v3h40v7h44v-6h39V196H0Z" fill={dawn ? '#587367' : '#355650'} />
      {Array.from({ length: 18 }, (_, i) => <Pine key={i} x={i * 25 + 4} y={130 + (i * 7) % 13} scale={.48 + (i % 3) * .07} dark />)}
      <path d="M0 145h39v-6h52v4h46v6h52v-7h42v-4h48v3h53v-6h52V196H0Z" fill={dawn ? '#6c8a6c' : '#456c54'} />
      <rect y="142" width="384" height="54" fill={`url(#${id}-grass)`} />
      {night || crossing ? <><path d="M0 144h47v-6h52v-4h60v4h48v7h52v-4h60v-4h65v35h-49v6h-70v-7h-58v-4h-65v4H83v5H0Z" fill={night ? '#355b70' : '#587f91'} /><g className="chapter-water" fill="#8ea4aa" opacity=".6">{Array.from({ length: 18 }, (_, i) => <rect key={i} x={(i * 43) % 372} y={144 + (i * 7) % 23} width={4 + (i % 4) * 3} height="1" />)}</g></> : null}
      {!night && !crossing && scene !== 'fork' && <><path d="M157 196v-7h9v-8h11v-7h16v-7h20v-7h22v-6h24v-5h27v7h-19v6h-18v7h-16v7h-13v8h-10v12Z" fill="#aa8d70" /><path d="M162 196v-6h11v-8h11v-6h17v-7h19v-6h24v-6h20v-3h17v3h-13v6h-20v6h-17v7h-14v7h-10v7h-9v6Z" fill="#c3a17e" /><g fill="#e0bd91"><path d="M182 186h7v2h-7ZM208 173h5v2h-5ZM239 161h6v1h-6ZM167 193h5v1h-5Z" /></g></>}
      {chapterIndex === 0 && !scene && <Cottage />}
      {forest && !scene && <><Pine x={255} y={137} scale={1.25} /><Pine x={307} y={133} scale={1.4} /><path d="M248 139V103H252V98H256V94H260V91H278V94H282V98H286V103H290V139" fill="none" stroke="#afa28d" strokeWidth="4" /><path d="M253 139V105H257V100H261V97H277V100H281V105H285V139Z" fill="#b4c9a1" opacity=".25" /><path className="chapter-window" d="M267 105h3v-3h2v3h3v3h-3v3h-2v-3h-3Z" fill="#ffe1a0" /></>}
      {crossing && <><path d="M145 143H247V158H145Z" fill="#624c4b" /><path d="M146 143H246V153H146Z" fill="#bd9270" />{Array.from({ length: 17 }, (_, i) => <path key={i} d={`M${147 + i * 6} 143v10`} stroke="#8f6955" />)}<Fence x={146} y={132} count={10} /><path d="M166 196V159H212V196Z" fill="#ab9276" /><Pine x={300} y={142} scale={.9} /><path d="M292 139h15v5h-15Z" fill="#d1b18a" /></>}
      {night && <Camp />}{dawn && !scene && <Observatory />}
      {scene && <EncounterScene scene={scene} />}
      <Pine x={40} y={168} scale={1.3} /><Pine x={10} y={150} scale={1.08} dark /><Pine x={365} y={163} scale={1.1} /><Pine x={344} y={182} scale={.82} dark />
      {Array.from({ length: 34 }, (_, i) => {
        const x = (i * 47 + 22) % 384;
        const y = 157 + (i * 13) % 37;
        if ((x > 145 && x < 237) || (x > 245 && x < 330 && y < 157)) return null;
        return <g key={i}><path d={`M${x} ${y}v-3h1v4h3v-2h1v4h-6v-2Z`} fill={i % 3 ? '#73916a' : '#97a578'} />{i % 3 === 0 && <Flowers x={x} y={y - 4} color={i % 2 ? '#d6b1ca' : '#f2ca80'} />}</g>;
      })}
      <path d="M0 190h23v-3h29v4h29v5H0ZM302 196v-5h31v-3h24v3h27v5Z" fill="#244b44" />
      {Array.from({ length: 12 }, (_, i) => <rect className="chapter-firefly" key={i} x={70 + (i * 31) % 248} y={128 + (i * 17) % 54} width="1" height="1" fill="#ffe4a0" style={{ animationDelay: `${-i * .7}s` }} />)}
      {crossing && Array.from({ length: 34 }, (_, i) => <path className="chapter-rain" key={i} d={`M${(i * 47) % 384} ${(i * 31) % 190}v4`} stroke="#c1d4d3" opacity=".45" style={{ animationDelay: `${-i * .1}s` }} />)}
    </svg>
    {children}
    <span className="trail-location">{chapter.place}</span>
  </div>;
}
