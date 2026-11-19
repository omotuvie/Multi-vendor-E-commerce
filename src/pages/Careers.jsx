import { useEffect } from "react";
import { FaArrowRight, FaHeart, FaRocket, FaHandshake } from "react-icons/fa";
import "../styles/Landing.css";
import Logo from "../images/Logo.png"; // use the dark logo from your About page

const EMAIL = "careers@nex-iv.com";
const U = (id) => `url(https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=85)`;
const cards = [
  ["photo-1490481651871-ab68de25d43d", "Design"],
  ["photo-1485230895905-ec40ba36b9bc", "Product"],
  ["photo-1539008835657-9e8e9680c956", "Growth"],
];
const ticker = ["Engineering", "Design", "Operations", "Growth", "Support", "Marketing", "Seller Success"];
const values = [
  [<FaHeart />, "Shoppers first", "Every decision starts with making buying and selling better for real people.", "wide dark"],
  [<FaRocket />, "Move with purpose", "We ship, learn and improve quickly.", ""],
  [<FaHandshake />, "Win together", "Sellers, customers and team grow together.", "tint"],
];
// Replace with your real openings
const roles = [
  ["Frontend Engineer", "Engineering · Lagos · Hybrid"],
  ["Seller Success Manager", "Operations · Lagos · On-site"],
  ["Marketing Associate", "Growth · Lagos · Hybrid"],
  ["Customer Support Specialist", "Support · Remote · Nigeria"],
];

function useReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { threshold: 0.15 }
    );
    document.querySelectorAll(".rv").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export default function Careers() {
  useReveal();
  const title = "Help us build the marketplace people love.".split(" ");

  return (
    <main className="nx-lp">
      <section className="nx-lp-hero">
        <div className="nx-lp-wrap">
          <div>
            <span className="nx-lp-eyebrow">Careers at Nex-IV</span>
            <h1>{title.map((w, i) => <span className="w" style={{ "--i": i }} key={i}>{w}</span>)}</h1>
            <p>We’re a Lagos team connecting trusted sellers with shoppers across Nigeria. Come build it with us.</p>
            <div className="nx-lp-actions">
              <a href="#open-roles" className="nx-lp-btn">View open roles <FaArrowRight /></a>
            </div>
          </div>
          <div className="nx-lp-collage">
            {cards.map(([id, label]) => (
              <div className="fc" style={{ backgroundImage: U(id) }} key={id}><span>{label}</span></div>
            ))}
          </div>
        </div>
      </section>

      <div className="nx-lp-mq" aria-hidden="true">
        <div>{[...ticker, ...ticker].map((t, i) => <span key={i}>{t}</span>)}</div>
      </div>

      <section className="nx-lp-section">
        <div className="nx-lp-wrap">
          <div className="nx-lp-head rv">
            <span className="nx-lp-eyebrow">What we care about</span>
            <h2>The values behind the work.</h2>
          </div>
          <div className="nx-lp-bento">
            {values.map(([icon, t, d, cls], i) => (
              <article className={`b rv ${cls}`} style={{ "--d": i }} key={t}>
                <span className="nx-lp-ic">{icon}</span><h3>{t}</h3><p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nx-lp-section" id="open-roles" style={{ paddingTop: 0 }}>
        <div className="nx-lp-wrap">
          <div className="nx-lp-head rv">
            <span className="nx-lp-eyebrow">Open roles</span>
            <h2>Find your place on the team.</h2>
          </div>
          <div className="nx-lp-roles">
            {roles.map(([t, meta], i) => (
              <a className="nx-lp-role rv" style={{ "--d": i }} key={t}
                href={`mailto:${EMAIL}?subject=${encodeURIComponent("Application: " + t)}`}>
                <div><h3>{t}</h3><small>{meta}</small></div>
                <i><FaArrowRight /></i>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="nx-lp-cta">
        <div className="nx-lp-wrap">
          <div className="rv">
            <span className="nx-lp-cta-eyebrow">Join the team</span>
            <h2>Don’t see your role?</h2>
            <p>Send us your CV and tell us how you’d help Nex-IV grow. We read every message.</p>
            <a href={`mailto:${EMAIL}`} className="nx-lp-cta-btn">Email {EMAIL} <span>↗</span></a>
          </div>
          <div className="nx-lp-cta-logo rv" style={{ "--d": 2 }}>
            <img src={Logo} alt="Nex-IV: more choices, better living" />
          </div>
        </div>
      </section>
    </main>
  );
}