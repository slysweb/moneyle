import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import CategorySelect from "./pages/CategorySelect";
import Game from "./pages/Game";

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
        <Route path="/moreless" element={<CategorySelect />} />
        <Route path="/moreless/:slug" element={<Game />} />
      </Routes>
    </div>
  );
}
