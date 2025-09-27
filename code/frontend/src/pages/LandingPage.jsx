import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/LandingPage.css";

const SERVICES = [
  { id: "prefs", title: "Place recommendations based on preferences", short: "Place recommendations",
    desc: "Tell us dates and what you love (beaches, museums, food markets). We surface the best 5–6 places that match your taste." },
  { id: "schedule", title: "Schedule generation that adapts to weather", short: "Schedule generation",
    desc: "We build a balanced day-by-day plan. If it’s sunny, you’ll get outdoor spots at ideal times; if it rains, we switch to indoor picks." },
  { id: "alerts", title: "Capture your memories with journals and reviews", short: "3. Travel Journal & Reviews",
    desc: "You can save your travel memories by writing journals, uploading photos, and sharing reviews. Your reviews are public to inspire others, but only you can edit or delete your own. " },
];

function ServiceCard({ title, short, desc }) {
  return (
    <div className="svc-card">
      <div className="svc-face"><h3 className="svc-title">{short}</h3></div>
      <div className="svc-overlay">
        <h4 className="svc-overlay-title">{title}</h4>
        <p className="svc-overlay-desc">{desc}</p>
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="splash">
      <h1 className="splash-text">Schedulane</h1>
    </div>
  );
}


export default function LandingPage() {
  // Splash
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => {
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) setShowSplash(false);
  }, []);
  useEffect(() => {
    if (showSplash) {
      document.body.classList.add("no-scroll");
      const id = setTimeout(() => setShowSplash(false), 2500);
      return () => {
        clearTimeout(id);
        document.body.classList.remove("no-scroll");
      };
    } else {
      document.body.classList.remove("no-scroll");
    }
  }, [showSplash]);
  const skipSplash = () => setShowSplash(false);

  const aboutRef = useRef(null);
  const handleLearnMore = (e) => {
    e.preventDefault();
    if (window?.history?.pushState) window.history.pushState(null, "", "#learn-more");
    aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="lp">
      {/* Splash */}
      <div className={`splash ${showSplash ? "" : "is-hidden"}`} onClick={skipSplash}>
        <h1 className="splash-brand"><span className="splash-text">Schedulane</span></h1>
      </div>

      <video
        className="lp__video"
        src="/videos/bg_video.mp4"  
        autoPlay muted loop playsInline preload="auto"
      />
      <div className="lp__scrim" aria-hidden="true" />

      {/* Top-right nav */}
      <nav className="site-nav">
        <Link to="/signin" className="pill-btn">Login</Link>
        <Link to="/signup" className="pill-btn">SignUp</Link>
        <Link to="/reviews" className="pill-btn">Reviews</Link>
      </nav>

      {/* HERO */}
      <section className="lp__hero">
        <div className="hero-kicker">WELCOME TO</div>
        
        <h1 className="hero-brand">Schedulane</h1>
        
        <div className="hero-sub">Plan your trip with us.</div>
        <div className="hero-cta">
          <Link to="/trip-input" className="pill-btn">Get Started <span className="arrow">→</span></Link>
          <a href="#learn-more" onClick={handleLearnMore} className="pill-btn">Learn More <span className="arrow">→</span></a>
        </div>
      </section>

      {/* ABOUT (glass) — anchor target */}
      <section id="learn-more" className="lp__about" ref={aboutRef}>
        <article className="about-card glass">
          <h2 className="about-title">What is Schedulane?</h2>
          <p className="about-text">
            Welcome to your personal travel scheduler. Schedulane recommends the
            best places for your taste, generates a weather-aware trip schedule,
            and keeps you updated with smart alerts so your journey is stress-free.
          </p>
        </article>
      </section>

      {/* SERVICES (always rendered after About – user can scroll down) */}
      <div className="lp__rest">
        <section className="svc-section svc-reveal">
          <div className="svc-head">
            <h2>Three core services</h2>
          </div>
          <div className="svc-grid">
            {SERVICES.map((s) => <ServiceCard key={s.id} {...s} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
