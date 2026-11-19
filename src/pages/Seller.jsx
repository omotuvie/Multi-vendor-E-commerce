import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowRight, FaStore, FaUsers, FaTruck, FaShieldAlt, FaStar, FaTag } from "react-icons/fa";
import "../styles/Landing.css";
import Logo from "../images/Logo.png"; // use the dark logo from your About page

const U = (id) => `url(https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=85)`;
const cards = [
  ["photo-1483985988355-763728e1935b", "Fashion"],
  ["photo-1608248543803-ba4f8c70ae0b", "Beauty"],
  ["photo-1584917865442-de89df76afd3", "Accessories"],
];
const ticker = ["Fashion", "Beauty", "Electronics", "Home & Living", "Sports", "Jewelry", "Food & Lifestyle", "Automotive"];
const perks = [
  [<FaStore />, "Your own storefront", "A branded store page with your products, offers and reviews in one place.", "wide dark"],
  [<FaUsers />, "Shoppers already here", "Reach people who come to discover trusted sellers.", ""],
  [<FaTruck />, "Simple fulfilment", "Manage orders seller by seller.", ""],
  [<FaShieldAlt />, "Secure payments", "Customers check out safely and you get paid for what you sell.", ""],
  [<FaStar />, "Reviews that sell", "Verified buyer reviews build trust in your store.", ""],
  [<FaTag />, "Promotions and deals", "Run sales and show up in Deals & Offers.", "wide tint"],
];
const steps = [
  ["Create your account", "Sign up and tell us about your business."],
  ["Set up your store", "Add your logo, details and first products."],
  ["Go live", "Publish your listings and start receiving orders."],
  ["Grow", "Run promotions, collect reviews and build a following."],
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

export default function SellOnNexIV() {
  useReveal();
  const title = "Turn your products into a store people love.".split(" ");

  return (
    <main className="nx-lp">
      <section className="nx-lp-hero">
        <div className="nx-lp-wrap">
          <div>
            <span className="nx-lp-eyebrow">Sell on Nex-IV</span>
            <h1>{title.map((w, i) => <span className="w" style={{ "--i": i }} key={i}>{w}</span>)}</h1>
            <p>Open your shop on Nex-IV and put your work in front of shoppers looking for trusted sellers and great finds.</p>
            <div className="nx-lp-actions">
              <Link to="/register" className="nx-lp-btn">Start selling <FaArrowRight /></Link>
              <a href="#how-it-works" className="nx-lp-btn is-ghost">See how it works</a>
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
            <span className="nx-lp-eyebrow">Why Nex-IV</span>
            <h2>Everything you need to sell, in one marketplace.</h2>
          </div>
          <div className="nx-lp-bento">
            {perks.map(([icon, t, d, cls], i) => (
              <article className={`b rv ${cls}`} style={{ "--d": i }} key={t}>
                <span className="nx-lp-ic">{icon}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nx-lp-section" id="how-it-works" style={{ paddingTop: 0 }}>
        <div className="nx-lp-wrap">
          <div className="nx-lp-head rv">
            <span className="nx-lp-eyebrow">How it works</span>
            <h2>From sign-up to first sale in four steps.</h2>
          </div>
          <div className="nx-lp-steps">
            {steps.map(([t, d], i) => (
              <article className="nx-lp-step rv" style={{ "--d": i }} key={t}>
                <b>0{i + 1}</b><h3>{t}</h3><p>{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="nx-lp-cta">
        <div className="nx-lp-wrap">
          <div className="rv">
            <span className="nx-lp-cta-eyebrow">Start selling</span>
            <h2>Ready to open your Nex-IV store?</h2>
            <p>Join the sellers building their brands on the marketplace.</p>
            <Link to="/register" className="nx-lp-cta-btn">Create seller account <span>↗</span></Link>
          </div>
          <div className="nx-lp-cta-logo rv" style={{ "--d": 2 }}>
            <img src={Logo} alt="Nex-IV: more choices, better living" />
          </div>
        </div>
      </section>
    </main>
  );
}