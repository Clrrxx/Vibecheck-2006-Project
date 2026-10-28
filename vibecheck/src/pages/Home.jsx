import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import GamerCharacter from "../components/GamerCharacter";
import useQuestResult from "../data/useQuestResult";
import PersonalityRadar from "../components/PersonalityRadar";
import useAccountProfile from "../data/useAccountProfile";
import { GamerCardDialog } from "../components/GamerCard";
import GamerTraits from "../components/GamerTraits";
import useConnections from "../data/useConnections";
import ConnectionNotifications from "../components/ConnectionNotifications";
import WeeklyGames from "../components/WeeklyGames";
import { traits } from "../data/quest";
import "./Home.css";

const navigation = [
  ["⌂", "Home", "/"], ["▣", "Assessment", "/questionnaire"], ["○", "Update Profile", "/update-profile"],
  ["◇", "Game Recommendations", "/game-recommendations"], ["♙", "Gamer Matches", "/gamer-matches"],
  ["♧", "Friends", "/friends"], ["▥", "Gaming Insights", "/gaming-insights"], ["⚙", "Settings", "#settings"],
];

/**
 * Render the signed-in dashboard using the owner's saved assessment and account.
 * @returns {import('react').ReactElement} Dashboard and feature navigation.
 */
function Home() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const user = useOutletContext();
  const connections = useConnections(user);
  const { report, loading } = useQuestResult(user.uid);
  const { displayName, initial } = useAccountProfile(user);

  return (
    <div className="home-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand"><span className="brand-ring" /><div><b>vibecheck</b><small>Games. People. You.</small></div></div>
        <nav aria-label="Main navigation">
          {navigation.map(([icon, label, to], index) => (
            <Link className={index === 0 ? "active" : ""} to={to} aria-current={index === 0 ? "page" : undefined} key={label} onClick={() => setMenuOpen(false)}>
              <span className="nav-icon">{icon}</span>{label}
            </Link>
          ))}
        </nav>
      </aside>

      {menuOpen && <button className="menu-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}

      <main className="home-main">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">☰</button>
          <label className="search"><span>⌕</span><input type="search" placeholder="Search games..." /><kbd>⌘ K</kbd></label>
          <div className="user-actions"><ConnectionNotifications user={user} state={connections} /><Link className="user" to="/update-profile"><span className="avatar">{initial}</span><b>{displayName}</b><span>⌄</span></Link></div>
        </header>

        <div className="dashboard">
          {report ? <section className="home-stats card" aria-labelledby="home-gamer-type">
            <div className="home-stats-heading">
              <div><span className="eyebrow">Your gamer personality</span><h1 id="home-gamer-type">{report.title}</h1><p>Your Big Five at a glance</p></div>
              <button type="button" className="home-mascot" onClick={() => setCardOpen(true)} aria-label="Open your gamer card" aria-haspopup="dialog">
                <span className="home-mascot-greeting">Your card ↗</span>
                <span className="home-mascot-motion"><GamerCharacter title={report.title} /></span>
                <span className="home-mascot-sparkle" aria-hidden="true">✦</span>
              </button>
            </div>
            <div className="home-personality-overview">
              <PersonalityRadar scores={report.traits} />
              <GamerTraits key={`${user.uid}:${report.title}`} uid={user.uid} title={report.title} />
            </div>
            <div className="home-stats-footer"><button type="button" className="text-button" onClick={() => setCardOpen(true)}>View gamer card ↗</button><button className="text-button" onClick={() => navigate('/questionnaire')}>View full results →</button></div>
          </section> : loading ? <section className="hero card" aria-busy="true"><p role="status">Loading your personality stats…</p></section> : <section className="hero card">
            <div className="hero-copy"><span className="eyebrow">Find out your gamer personality here!</span><h1>Discover your<br /><em>personality.</em></h1><p>Your personality shapes the way you explore, compete and connect.</p><div className="actions"><button className="primary" onClick={() => navigate("/questionnaire")}>Start your quest <span>→</span></button><button className="text-button">Learn about Big Five</button></div></div>
            <div className="hero-art" aria-hidden="true"><i className="orbit one" /><i className="orbit two" /><div className="gamepad"><b>+</b><span>••<br />••</span></div></div>
          </section>}

          <WeeklyGames />
        </div>
      </main>
      {cardOpen && report && <GamerCardDialog
        uid={user.uid}
        title={report.title}
        name={report.name || displayName}
        scores={traits.map(({ key }) => report.traits[key])}
        onClose={() => setCardOpen(false)}
      />}
    </div>
  );
}

export default Home;
