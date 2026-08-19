import { useState } from "react";
import { Navigate, Route, Routes, Link } from "react-router-dom";
import Home from "./pages/Home";
import Game from "./pages/Game";
import Guessr from "./pages/Guessr";
import Moneyle from "./pages/Moneyle";
import Connections from "./pages/Connections";
import About from "./pages/About";
import Changelog from "./pages/Changelog";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import FeedbackModal from "./components/FeedbackModal";
import { FeedbackContext } from "./lib/feedback";

export default function App() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const openFeedback = () => setFeedbackOpen(true);

  return (
    <FeedbackContext.Provider value={{ open: openFeedback }}>
      <div className="app">
        <header className="site-header">
          <Link to="/" className="logo">
            <span className="logo-mark">$</span> MoneyGames
          </Link>
          <button type="button" className="header-feedback" onClick={openFeedback}>
            Feedback
          </button>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/moreless" element={<Game />} />
          <Route path="/moreless/:slug" element={<Navigate to="/moreless" replace />} />
          <Route path="/guessr" element={<Guessr />} />
          <Route path="/moneyle" element={<Moneyle />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/about" element={<About />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        {feedbackOpen ? <FeedbackModal onClose={() => setFeedbackOpen(false)} /> : null}
      </div>
    </FeedbackContext.Provider>
  );
}
