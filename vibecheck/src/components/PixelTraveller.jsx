export default function PixelTraveller() {
  return <svg className="trail-traveller pixel-traveller" viewBox="0 0 32 48" shapeRendering="crispEdges" fill="none">
    <path d="M6 45H24V47H6Z" fill="#172c35" opacity=".65" />
    <g className="pixel-feet"><path d="M10 33H15V43H10ZM18 33H22V43H18Z" fill="#6f5761" /><path d="M9 42H15V45H8V43H9ZM18 42H24V45H18Z" fill="#d0b395" /><path d="M8 45H15V46H8ZM18 45H24V46H18Z" fill="#473f48" /></g>
    <g className="pixel-body"><path d="M9 18H22V21H25V30H23V36H8V31H5V23H9Z" fill="#74608f" /><path d="M20 20H23V32H25V35H20Z" fill="#a18ab4" /><path d="M6 25H9V33H6Z" fill="#997daa" /><path d="M7 32H10V36H7ZM25 24H28V28H25Z" fill="#e8b68f" />
      <path d="M10 22H19V24H21V33H19V35H10V33H8V24H10Z" fill="#403e58" /><path d="M11 23H18V24H20V31H10V24H11Z" fill="#68587d" /><path d="M10 30H20V32H10Z" fill="#bea181" /><path d="M14 29H17V33H14Z" fill="#f4cf82" />
      <path className="pixel-scarf" d="M9 17H21V20H11V22H5V20H2V17H5V18H9Z" fill="#e1a56f" /><path d="M4 18H9V20H4Z" fill="#f2c38a" />
      <path d="M9 10H22V17H19V19H12V17H9Z" fill="#dcaa87" /><path d="M10 13H21V17H10Z" fill="#edbf94" />
      <path d="M10 3H21V5H24V9H25V13H22V15H10V13H7V8H8V5H10Z" fill="#393a50" /><path d="M11 4H20V5H23V8H18V7H11V9H8V7H9V5H11Z" fill="#62516f" /><path d="M11 4H17V5H11Z" fill="#8f7192" />
      <path d="M23 22H26V25H23Z" fill="#ac8db8" />
      <g className="pixel-lantern"><path className="trail-glow" d="M24 25H30V27H32V38H30V40H24V38H22V27H24Z" fill="#ffd488" opacity=".2" /><path d="M26 26V24H29V26" stroke="#dfb576" /><path d="M24 27H31V29H24ZM25 37H31V39H25Z" fill="#a77a50" /><path d="M25 29H31V37H25Z" fill="#efbb69" /><path d="M26 30H29V36H26Z" fill="#fff0b3" /><path d="M27 30H28V35H27Z" fill="#fff9d5" /></g>
    </g>
  </svg>;
}
