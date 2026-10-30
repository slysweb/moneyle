import { useState } from "react";
import { Navigate, Route, Routes, Link, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import Archive from "./pages/Archive";
import Game from "./pages/Game";
import Guessr from "./pages/Guessr";
import Moneyle from "./pages/Moneyle";
import Connections from "./pages/Connections";
import About from "./pages/About";
import Scoring from "./pages/Scoring";
import Changelog from "./pages/Changelog";
import Articles from "./pages/Articles";
import ArticlePage from "./pages/ArticlePage";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import DeleteAccount from "./pages/DeleteAccount";
import Register from "./pages/Register";
import Me from "./pages/Me";
import FeedbackModal from "./components/FeedbackModal";
import HeaderAuth from "./components/HeaderAuth";
import GameGuideFromRoute from "./components/GameGuide";
import { FeedbackContext } from "./lib/feedback";
import { AuthProvider } from "./lib/auth";

export default function App() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const openFeedback = () => setFeedbackOpen(true);

  return (
    <AuthProvider>
      <FeedbackContext.Provider value={{ open: openFeedback }}>
        <div className="app">
          <header className="site-header">
            <Link to="/" className="logo">
              <span className="logo-mark">$</span> MoneyGames
            </Link>
            <div className="header-actions">
              <NavLink to="/archive" className="header-archive">
                Archive
              </NavLink>
              <NavLink to="/me" className="header-archive">
                Me
              </NavLink>
              <HeaderAuth />
            </div>
          </header>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/register" element={<Register />} />
            <Route path="/me" element={<Me />} />
            <Route path="/moreless" element={<Game />} />
            <Route path="/moreless/:slug" element={<Navigate to="/moreless" replace />} />
            <Route path="/guessr" element={<Guessr />} />
            <Route path="/moneyle" element={<Moneyle />} />
            <Route path="/connections" element={<Connections />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<ArticlePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/scoring" element={<Scoring />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/delete-account" element={<DeleteAccount />} />
          </Routes>
          <GameGuideFromRoute />
          {feedbackOpen ? <FeedbackModal onClose={() => setFeedbackOpen(false)} /> : null}
        </div>
      </FeedbackContext.Provider>
    </AuthProvider>
  );
}
