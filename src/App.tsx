import { Navigate, Route, Routes, Link } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Guessr from "./pages/Guessr";
import Moneyle from "./pages/Moneyle";

export default function App() {
  return (
    <div className="app">
      <header className="site-header">
        <Link to="/" className="logo">
          <span className="logo-mark">$</span> MoneyGames
        </Link>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/moreless" element={<Game />} />
        <Route path="/moreless/:slug" element={<Navigate to="/moreless" replace />} />
        <Route path="/guessr" element={<Guessr />} />
        <Route path="/moneyle" element={<Moneyle />} />
      </Routes>
    </div>
  );
}
