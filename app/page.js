"use client";

import { useState } from "react";

const content = {
  en: {
    tagline: "LEARN · PRACTICE · SUCCEED",
    nav: ["Home", "Examinations", "Mock Tests", "PYQs", "Current Affairs"],
    login: "Login",
    eyebrow: "YOUR EXAM PREPARATION STARTS HERE",
    headline1: "Prepare smarter.",
    headline2: "Achieve greater.",
    intro: "A focused learning platform for Assam government exam preparation. Practise with mock tests, explore previous-year questions and stay updated.",
    explore: "Explore mock tests",
    announcement: "NEW MOCK TESTS",
    announcementTitle: "Your next practice test is waiting",
    announcementText: "Build confidence with structured practice and detailed explanations.",
    resources: "Explore learning resources",
    resourcesSub: "Everything you need to prepare in one place.",
    pyq: "Previous-year questions",
    pyqDesc: "Practise questions organised by exam, year and subject.",
    mock: "Mock tests",
    mockDesc: "Timed tests with scoring and performance review.",
    trial: "FREE PRACTICE",
    premium: "Premium plans",
    premiumDesc: "Explore additional practice resources when you are ready.",
    current: "Current affairs",
    currentDesc: "Read important updates and practise related MCQs.",
    exams: "Start with your examination",
    examsDesc: "We are starting with one examination and will expand the platform as the question bank grows.",
    selectExam: "Examination details coming soon",
    footer: "An independent learning platform for exam aspirants.",
    language: "অসমীয়া",
    notice: "This is the first frontend version. Student accounts, tests, payments and admin tools will be connected in later development stages."
  },
  as: {
    tagline: "শিকা · অনুশীলন কৰা · সফল হোৱা",
    nav: ["মুখ্য পৃষ্ঠা", "পৰীক্ষাসমূহ", "মক টেষ্ট", "পূৰ্বৰ প্ৰশ্ন", "সাম্প্ৰতিক পৰিঘটনা"],
    login: "লগইন",
    eyebrow: "আপোনাৰ পৰীক্ষাৰ প্ৰস্তুতি ইয়াৰ পৰাই আৰম্ভ",
    headline1: "স্মাৰ্টভাৱে প্ৰস্তুতি লওক।",
    headline2: "সফলতা অৰ্জন কৰক।",
    intro: "অসম চৰকাৰী পৰীক্ষাৰ প্ৰস্তুতিৰ বাবে এক কেন্দ্ৰীভূত শিক্ষণ মঞ্চ। মক টেষ্ট দিয়ক, পূৰ্বৰ বছৰৰ প্ৰশ্ন অনুশীলন কৰক আৰু শেহতীয়া খবৰ জানক।",
    explore: "মক টেষ্ট চাওক",
    announcement: "নতুন মক টেষ্ট",
    announcementTitle: "আপোনাৰ পৰৱৰ্তী অনুশীলনী পৰীক্ষা সাজু",
    announcementText: "পৰিকল্পিত অনুশীলন আৰু বিশদ ব্যাখ্যাৰ জৰিয়তে আত্মবিশ্বাস বৃদ্ধি কৰক।",
    resources: "শিক্ষণৰ সমলসমূহ",
    resourcesSub: "প্ৰস্তুতিৰ বাবে প্ৰয়োজনীয় সকলো সমল একে ঠাইতে।",
    pyq: "পূৰ্বৰ বছৰৰ প্ৰশ্ন",
    pyqDesc: "পৰীক্ষা, বছৰ আৰু বিষয় অনুসৰি প্ৰশ্ন অনুশীলন কৰক।",
    mock: "মক টেষ্ট",
    mockDesc: "সময় নিৰ্ধাৰিত পৰীক্ষা, নম্বৰ আৰু প্ৰদৰ্শনৰ পৰ্যালোচনা।",
    trial: "বিনামূলীয়া অনুশীলন",
    premium: "প্ৰিমিয়াম পৰিকল্পনা",
    premiumDesc: "অতিৰিক্ত অনুশীলনৰ সুবিধাসমূহ চাওক।",
    current: "সাম্প্ৰতিক পৰিঘটনা",
    currentDesc: "গুৰুত্বপূৰ্ণ খবৰ পঢ়ক আৰু MCQ অনুশীলন কৰক।",
    exams: "আপোনাৰ পৰীক্ষাৰ পৰা আৰম্ভ কৰক",
    examsDesc: "আমি প্ৰথমে এটা পৰীক্ষাৰে আৰম্ভ কৰিম আৰু প্ৰশ্ন বেংক বৃদ্ধি হোৱাৰ লগে লগে সম্প্ৰসাৰণ কৰিম।",
    selectExam: "পৰীক্ষাৰ বিৱৰণ অতি সোনকালে উপলব্ধ হ'ব",
    footer: "পৰীক্ষাৰ্থীসকলৰ বাবে এক স্বতন্ত্ৰ শিক্ষণ মঞ্চ।",
    language: "English",
    notice: "এইটো প্ৰথম ফ্ৰণ্টএণ্ড সংস্কৰণ। ছাত্ৰ একাউণ্ট, পৰীক্ষা, পেমেণ্ট আৰু এডমিন সুবিধা পৰৱৰ্তী পৰ্যায়ত সংযোগ কৰা হ'ব।"
  }
};

const resourceCards = [
  { key: "pyq", icon: "▤", href: "#pyq", tone: "blue" },
  { key: "mock", icon: "◷", href: "#mock", tone: "orange", tag: true },
  { key: "premium", icon: "✦", href: "#premium", tone: "purple" },
  { key: "current", icon: "◉", href: "#current", tone: "green" }
];

export default function HomePage() {
  const [lang, setLang] = useState("en");
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const t = content[lang];

  return (
    <main className="site-shell">
      <header className="header">
        <a className="brand" href="#" aria-label="Assam Astra home">
          <span className="brand-mark">A</span>
          <span className="brand-copy">
            <strong>ASSAM <b>ASTRA</b></strong>
            <small>{t.tagline}</small>
          </span>
        </a>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">
          {menuOpen ? "✕" : "☰"}
        </button>

        <nav className={menuOpen ? "nav nav-open" : "nav"}>
          {t.nav.map((item, index) => (
            <a key={item} href={["#", "#exams", "#mock", "#pyq", "#current"][index]} onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <button className="language-button" onClick={() => setLang(lang === "en" ? "as" : "en")}>
            {t.language}
          </button>
          <a className="login-button" href="#login">{t.login}</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow"><span className="eyebrow-dot" />{t.eyebrow}</span>
          <h1>{t.headline1}<br /><span>{t.headline2}</span></h1>
          <p>{t.intro}</p>
          <a className="button button-primary" href="#mock">{t.explore} <span>↗</span></a>
          <div className="hero-trust">
            <span>✓ Exam-focused practice</span>
            <span>✓ Learn at your pace</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-glow" />
          <div className="book-stack">
            <div className="book book-back"><span>KNOWLEDGE</span></div>
            <div className="book book-front"><span>YOUR<br />FUTURE</span><i>✦</i></div>
          </div>
          <div className="floating-card floating-top"><span>✦</span> Keep learning</div>
          <div className="floating-card floating-bottom"><b>01</b> Start your journey</div>
        </div>
      </section>

      <section className="announcement">
        <div className="announcement-icon">↗</div>
        <div className="announcement-copy">
          <span className="pill">{t.announcement}</span>
          <h2>{t.announcementTitle}</h2>
          <p>{t.announcementText}</p>
        </div>
        <a href="#mock" className="arrow-link" aria-label="Explore mock tests">→</a>
      </section>

      <section className="section" id="resources">
        <div className="section-heading">
          <div><span className="section-kicker">YOUR LEARNING SPACE</span><h2>{t.resources}</h2><p>{t.resourcesSub}</p></div>
          <span className="heading-decoration">✳</span>
        </div>

        <div className="resource-grid">
          {resourceCards.map((card) => (
            <a className={`resource-card ${card.tone}`} href={card.href} key={card.key} id={card.key}>
              <div className="resource-top">
                <span className="resource-icon">{card.icon}</span>
                {card.tag && <span className="free-tag">{t.trial}</span>}
                {!card.tag && <span className="card-arrow">↗</span>}
              </div>
              <h3>{t[card.key]}</h3>
              <p>{t[`${card.key}Desc`]}</p>
              <span className="card-bottom">{lang === "en" ? "Explore resource" : "সমল চাওক"} <span>→</span></span>
            </a>
          ))}
        </div>
      </section>

      <section className="exam-section" id="exams">
        <div className="exam-symbol">⌑</div>
        <div className="exam-copy">
          <span className="section-kicker">ONE STEP AT A TIME</span>
          <h2>{t.exams}</h2>
          <p>{t.examsDesc}</p>
          <span className="coming-soon">{t.selectExam}</span>
        </div>
      </section>

      {noticeOpen && (
        <div className="development-note">
          <span>ⓘ</span>
          <p>{t.notice}</p>
          <button onClick={() => setNoticeOpen(false)} aria-label="Dismiss notice">×</button>
        </div>
      )}

      <footer className="footer">
        <a className="brand footer-brand" href="#"><span className="brand-mark">A</span><span className="brand-copy"><strong>ASSAM <b>ASTRA</b></strong><small>{t.tagline}</small></span></a>
        <p>{t.footer}</p>
        <span>© {new Date().getFullYear()} Assam Astra</span>
      </footer>
    </main>
  );
}
