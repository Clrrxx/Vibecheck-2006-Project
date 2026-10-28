import { BrowserRouter, Routes, Route } from "react-router-dom";

import Messages from "./pages/Messages";
import Friends from "./pages/Friends";
import GamerMatching from "./pages/GamerMatching";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Questionnaire from "./pages/Questionnaire";
import GameRecc from "./pages/GameRecc";
import ProtectedRoute from "./components/ProtectedRoute";
import UpdateProfile from "./pages/UpdateProfile";
import GamingInsights from "./pages/GamingInsights";
import SteamRecommendations from "./pages/SteamRecommendations";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Home />} />
          <Route path="/questionnaire" element={<Questionnaire />} />
          <Route path="/game-recommendations" element={<GameRecc />} />
          <Route path="/game-recommendations/steam" element={<SteamRecommendations />} />
          <Route path="/update-profile" element={<UpdateProfile />} />
          <Route path="/messages/:uid" element={<Messages />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/gamer-matches" element={<GamerMatching />} />
          <Route path="/gamematching" element={<GamerMatching />} />
          <Route path="/gaming-insights" element={<GamingInsights />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
