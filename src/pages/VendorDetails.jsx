import promo from "../images/Video.mp4";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  FaCheck, FaChevronLeft, FaChevronRight, FaHeart, FaRegHeart, FaSearch,
  FaStar, FaPlus, FaTag, FaTimes,
} from "react-icons/fa";
import { BsArrowUpRight } from "react-icons/bs";
import { useShop } from "../context/ShopContext";
import vendorProducts from "../data/Products.js";
import "../styles/VendorDetails.css";
import "../styles/VendorDetails.css";

const money = (v) => `₦${Number(v || 0).toLocaleString("en-NG")}`;

const slugify = (value = "") =>
  value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const TABS = [
  ["home", "Home"],
  ["items", "Items"],
  ["new", "New In"],
  ["promo", "Promo"],
  ["review", "Review"],
];
const TAB_KEYS = TABS.map(([key]) => key);

const percentOff = (p) =>
  p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

const dateOf = (p) => p.addedAt || p.createdAt || p.date || null;

/* Placeholder products, used only when Products.js has nothing for this store. */
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=85`;
const demoStoreProducts = [
  { id: "demo-1", name: "Satin Mini Dress", price: 15000, originalPrice: 20000, image: U("photo-1496747611176-843222e1e57c"), rating: 4.8, stockLeft: 12 },
  { id: "demo-2", name: "Ribbed Two-Piece Set", price: 18500, originalPrice: 24000, image: U("photo-1483985988355-763728e1935b"), rating: 4.7, stockLeft: 8 },
  { id: "demo-3", name: "Soft Pink Co-ord", price: 12500, image: U("photo-1485230895905-ec40ba36b9bc"), rating: 4.9, stockLeft: 20 },
  { id: "demo-4", name: "Floral Summer Dress", price: 22000, originalPrice: 30000, image: U("photo-1490481651871-ab68de25d43d"), rating: 4.6, stockLeft: 5 },
  { id: "demo-5", name: "Everyday Handbag", price: 28800, image: U("photo-1584917865442-de89df76afd3"), rating: 4.8, stockLeft: 14 },
  { id: "demo-6", name: "Elegant Heels", price: 38000, originalPrice: 52000, category: "Shoes", image: U("photo-1543163521-1bf539c55dd2"), rating: 4.5, stockLeft: 9 },
  { id: "demo-7", name: "Statement Evening Dress", price: 31000, image: U("photo-1539008835657-9e8e9680c956"), rating: 4.9, stockLeft: 6 },
  { id: "demo-8", name: "Casual Wrap Dress", price: 16500, originalPrice: 21000, image: U("photo-1529139574466-a303027c1d8b"), rating: 4.7, stockLeft: 11 },
  { id: "demo-9", name: "Weekend Knit Set", price: 19800, image: U("photo-1524504388940-b1c1722653e1"), rating: 4.6, stockLeft: 7 },
  { id: "demo-10", name: "Classic Day Dress", price: 14200, originalPrice: 18000, image: U("photo-1534528741775-53994a69daeb"), rating: 4.8, stockLeft: 15 },
].map((p) => ({ category: "New In", ...p }));

const promoCampaigns = [
  {
    eyebrow: "THE BIG STYLE SALE", title: "Good style. Even better prices.",
    description: "Your favourite looks are now available at prices worth celebrating.",
    discount: "UP TO 50% OFF", button: "Shop the sale",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=90"
  },
  {
    eyebrow: "LIMITED TIME OFFER", title: "Your next favourite is on sale.",
    description: "Discover selected pieces and refresh your wardrobe for less.",
    discount: "SALE UP TO 40%", button: "Explore offers",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=90"
  },
  {
    eyebrow: "THE NEW SEASON EDIT", title: "More looks. Less spending.",
    description: "Shop selected styles before these special prices disappear.",
    discount: "SPECIAL PRICES", button: "Discover deals",
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1800&q=90"
  },
];

const customerReviews = [
  {
    id: 1, name: "Amara O.", location: "Lagos, Nigeria", rating: 5,
    text: "The outfit looks exactly like the pictures. I love the quality and how it fits!",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    productImage: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=500&q=85",
    product: "Summer outfit"
  },
  {
    id: 2, name: "Tomi A.", location: "Abuja, Nigeria", rating: 5,
    text: "Really beautiful pieces. The packaging was lovely and everything arrived in good condition.",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=85",
    productImage: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=500&q=85",
    product: "Everyday style"
  },
  {
    id: 3, name: "Zara E.", location: "Port Harcourt, Nigeria", rating: 5,
    text: "I love how easy it was to shop from this store. Definitely coming back for more.",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85",
    productImage: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=500&q=85",
    product: "Statement dress"
  },
  {
    id: 4, name: "Kemi B.", location: "Ibadan, Nigeria", rating: 4,
    text: "Lovely fabric and a great fit. Delivery took a little longer than expected but it was worth the wait.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=85",
    productImage: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=500&q=85",
    product: "Casual set"
  },
  {
    id: 5, name: "Chidinma U.", location: "Enugu, Nigeria", rating: 5,
    text: "Got so many compliments the first time I wore it. The colour is even better in person.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=85",
    productImage: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=500&q=85",
    product: "Weekend look"
  },
];


function ProductCard({ product, isWishlisted, onToggleWishlist, onAddToCart }) {
  const discount = percentOff(product);

  return (
    <article className="vd-product-card">
      <div className="vd-product-image-wrap">
        <Link to={`/product/${product.id}`} state={{ product }} className="vd-product-image-link" aria-label={`Explore ${product.name}`}>
          <img className="vd-product-image" src={product.image} alt={product.name} loading="lazy" />
          <span className="vd-explore-overlay">
            <span>Explore item</span>
            <span className="vd-explore-arrow">↗</span>
          </span>
        </Link>

        {product.category === "New In" && <span className="vd-product-tag">NEW IN</span>}
        {discount > 0 && <span className="vd-product-discount">-{discount}%</span>}

        <button type="button" className={`vd-wishlist ${isWishlisted ? "is-wishlisted" : ""}`}
          onClick={() => onToggleWishlist(product)}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}>
          {isWishlisted ? <FaHeart /> : <FaRegHeart />}
        </button>

        <button type="button" className="vd-quick-add" onClick={() => onAddToCart(product)} disabled={product.stockLeft <= 0}>
          {product.stockLeft <= 0 ? "Out of stock" : <><FaPlus /> Add to bag</>}
        </button>
      </div>

      <div className="vd-product-info">
        <span className="vd-product-category">{product.category}</span>
        <Link to={`/product/${product.id}`} state={{ product }} className="vd-product-name">{product.name}</Link>
        <div className="vd-product-prices">
          <strong>{money(product.price)}</strong>
          {discount > 0 && <del>{money(product.originalPrice)}</del>}
        </div>
        <div className="vd-product-rating"><FaStar /><span>{product.rating || "4.8"}</span></div>
      </div>
    </article>
  );
}

const CUT = 50;

function StaggerReviews({ reviews }) {
  const [active, setActive] = useState(0);
  const [size, setSize] = useState(365);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const [focusId, setFocusId] = useState(null);
  const [zoom, setZoom] = useState(null);
  const n = reviews.length;

  useEffect(() => {
    const update = () => setSize(window.matchMedia("(min-width: 640px)").matches ? 365 : 290);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);


  useEffect(() => {
    if (paused || open || zoom !== null || n < 2) return undefined;
    const t = window.setInterval(() => setActive((a) => (a + 1) % n), 6000);
    return () => window.clearInterval(t);
  }, [paused, open, zoom, n]);

  useEffect(() => {
    if (!open && zoom === null) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (zoom !== null) setZoom(null);
      else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open, zoom]);

  useEffect(() => {
    if (!open || focusId === null) return undefined;
    const t = window.setTimeout(() => {
      document.getElementById(`vd-rv-${focusId}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 150);
    return () => window.clearTimeout(t);
  }, [open, focusId]);

  const move = (steps) => setActive((a) => (((a + steps) % n) + n) % n);
  const openReviews = (id) => { setFocusId(id); setOpen(true); };
  const closeReviews = () => { setOpen(false); setFocusId(null); };

  const activate = (position, review) => (position === 0 ? openReviews(review.id) : move(position));

  return (
    <>
      <div className="vd-stagger" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        {reviews.map((review, index) => {
          let position = index - active;
          if (position > n - Math.floor(n / 2) - 1) position -= n;
          if (position < -Math.floor(n / 2)) position += n;
          const isCenter = position === 0;

          return (
            <article
              key={review.id}
              className={`vd-stagger-card ${isCenter ? "is-center" : ""}`}
              role="button"
              tabIndex={0}
              aria-label={isCenter ? `Open reviews, starting with ${review.name}` : `Show review by ${review.name}`}
              onClick={() => activate(position, review)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(position, review); } }}
              style={{
                width: size,
                height: size,
                clipPath: `polygon(${CUT}px 0%, calc(100% - ${CUT}px) 0%, 100% ${CUT}px, 100% 100%, calc(100% - ${CUT}px) 100%, ${CUT}px 100%, 0 100%, 0 0)`,
                transform: `translate(-50%, -50%) translateX(${(size / 1.5) * position}px) translateY(${isCenter ? -45 : position % 2 ? 15 : -15}px) rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)`,
              }}
            >
              <span className="vd-stagger-corner" style={{ top: CUT - 2, width: CUT * Math.SQRT2 }} />
              <img
                className="vd-stagger-avatar"
                src={review.productImage}
                alt={review.product}
                loading="lazy"
                onClick={(e) => { e.stopPropagation(); setZoom(index); }}
                title="Tap to zoom the reviewed item"
              />
              <span className="vd-stagger-stars">{"★".repeat(review.rating)}</span>
              <h3>“{review.text}”</h3>
              <p>
                - {review.name}, {review.location}
                <small><FaCheck /> Verified buyer · {review.product}</small>
              </p>
            </article>
          )
        })}

        <div className="vd-stagger-controls">
          <button type="button" onClick={() => move(-1)} aria-label="Previous review"><FaChevronLeft /></button>
          <button type="button" onClick={() => move(1)} aria-label="Next review"><FaChevronRight /></button>
        </div>
      </div>


      {open && (
        <div className="vd-rv-overlay" role="dialog" aria-modal="true" aria-label="All customer reviews" onClick={closeReviews}>
          <button type="button" className="vd-rv-close" onClick={closeReviews} aria-label="Close reviews"><FaTimes /></button>
          <section className="vd-rv-panel" onClick={(e) => e.stopPropagation()}>
            <header>
              <span className="vd-section-kicker">REAL STYLE. REAL STORIES.</span>
              <h2>All reviews</h2>
              <p>{n} reviews from the Nex-IV community</p>
            </header>
            <div className="vd-rv-columns">
              {reviews.map((r, i) => (
                <article key={r.id} id={`vd-rv-${r.id}`} className={`vd-rv-card ${focusId === r.id ? "is-focus" : ""}`}>
                  <button type="button" className="vd-rv-photo" onClick={() => setZoom(i)} aria-label={`Zoom ${r.product}`}>
                    <img src={r.productImage} alt={r.product} loading="lazy" />
                  </button>
                  <div className="vd-rv-body">
                    <span className="vd-testimonial-stars">{"★".repeat(r.rating)}</span>
                    <p>“{r.text}”</p>
                    <div className="vd-testimonial-bottom">
                      <div className="vd-testimonial-customer"><strong>{r.name}</strong><span>{r.location}</span></div>
                      <div className="vd-testimonial-verified"><FaCheck /><span>Verified buyer</span></div>
                    </div>
                    <div className="vd-rv-item"><span>REVIEWED ITEM</span><strong>{r.product}</strong></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}


      {zoom !== null && (
        <div className="vd-rv-zoom" role="dialog" aria-modal="true" aria-label="Review photo" onClick={() => setZoom(null)}>
          <button type="button" className="vd-rv-close" onClick={() => setZoom(null)} aria-label="Close photo"><FaTimes /></button>
          <img src={reviews[zoom].productImage.replace("w=500", "w=1100")} alt={reviews[zoom].product} onClick={(e) => e.stopPropagation()} />
          <div className="vd-rv-zoom-bar" onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Previous photo" onClick={() => setZoom((z) => (z - 1 + n) % n)}><FaChevronLeft /></button>
            <span>{reviews[zoom].product} · {zoom + 1} / {n}</span>
            <button type="button" aria-label="Next photo" onClick={() => setZoom((z) => (z + 1) % n)}><FaChevronRight /></button>
          </div>
        </div>
      )}
    </>
  );
}


const SHOWCASE_CSS = `
.nas { position: relative; width: 100%; height: clamp(440px, 50vw, 640px); overflow: hidden; background: #CFE1E2; isolation: isolate; }
.nas-slide { position: absolute; inset: 0; display: block; color: #FFF8E7; opacity: 0; pointer-events: none; transition: opacity .9s ease; }
.nas-slide.is-active { z-index: 1; opacity: 1; pointer-events: auto; }
.nas-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 20%; transform: scale(1.06); transition: transform 6s ease; }
.nas-slide.is-active .nas-img { transform: scale(1); }
.nas-shade { position: absolute; inset: 0; background: linear-gradient(0deg, rgba(25,18,16,.78), rgba(25,18,16,.05) 55%, rgba(25,18,16,.25)); }
.nas-info { position: absolute; left: clamp(22px, 5vw, 64px); bottom: clamp(26px, 5vw, 56px); max-width: min(560px, 80%); }
.nas-kicker { display: block; margin-bottom: 12px; color: #CFE1E2; font-size: 10px; font-weight: 800; letter-spacing: 2.2px; }
.nas-title { margin: 0; font-family: "Playfair Display", Georgia, serif; font-size: clamp(30px, 4.6vw, 58px); font-weight: 500; line-height: 1.08; letter-spacing: -1.5px; }
.nas-desc { margin: 14px 0 0; max-width: 420px; color: rgba(255,248,231,.88); font-size: 13px; line-height: 1.7; }
.nas-price { display: flex; align-items: baseline; gap: 10px; margin-top: 16px; }
.nas-price strong { font-size: 20px; font-weight: 800; }
.nas-price del { color: rgba(255,248,231,.65); font-size: 13px; }
.nas-explore { position: absolute; top: 50%; left: 50%; z-index: 2; display: inline-flex; align-items: center; gap: 12px; padding: 14px 22px; border-radius: 50px; background: #FFF8E7; color: #341F1A; font-size: 13px; font-weight: 800; opacity: 0; pointer-events: none; transform: translate(-50%, -38%) scale(.9); transition: opacity .3s ease, transform .3s cubic-bezier(.2,.8,.3,1); }
.nas-slide.is-active:hover .nas-explore, .nas-slide:focus-visible .nas-explore { opacity: 1; transform: translate(-50%, -50%) scale(1); }
.nas-slide.is-active:hover .nas-shade { background: linear-gradient(0deg, rgba(25,18,16,.82), rgba(25,18,16,.35) 60%, rgba(25,18,16,.4)); }
.nas-count { position: absolute; top: 22px; right: 26px; z-index: 3; color: #FFF8E7; font-size: 12px; font-weight: 700; letter-spacing: 2px; }
.nas-arrows { position: absolute; right: 26px; bottom: 26px; z-index: 3; display: flex; gap: 9px; }
.nas-arrows button { display: grid; place-items: center; width: 44px; height: 44px; border: 1px solid rgba(255,248,231,.5); border-radius: 50%; background: rgba(25,18,16,.35); color: #FFF8E7; cursor: pointer; transition: background .2s ease, color .2s ease; }
.nas-arrows button:hover { background: #FFF8E7; color: #341F1A; }
.nas-dots { position: absolute; left: 50%; bottom: 14px; z-index: 3; display: flex; gap: 8px; transform: translateX(-50%); }
.nas-dots button { width: 22px; height: 4px; padding: 0; border: 0; background: rgba(255,248,231,.5); cursor: pointer; transition: width .25s ease, background .25s ease; }
.nas-dots button.is-active { width: 42px; background: #FFF8E7; }
@media (max-width: 650px) { .nas-arrows { right: 14px; bottom: 34px; } .nas-arrows button { width: 38px; height: 38px; } .nas-info { max-width: 72%; } .nas-desc { display: none; } .nas-count { top: 14px; right: 16px; } }
`;

const bigImage = (url = "") => url.replace(/w=\d+/, "w=1800");

function NewArrivalsSlider({ items }) {
  const slides = useMemo(() => items.slice(0, 8), [items]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;

  useEffect(() => {
    if (paused || n < 2) return undefined;
    const t = window.setInterval(() => setCurrent((c) => (c + 1) % n), 4500);
    return () => window.clearInterval(t);
  }, [paused, n]);

  useEffect(() => { if (current >= n) setCurrent(0); }, [n, current]);

  if (!n) return null;

  return (
    <div className="nas" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <style>{SHOWCASE_CSS}</style>

      {slides.map((p, i) => {
        const off = percentOff(p);
        return (
          <Link key={p.id} to={`/product/${p.id}`} state={{ product: p }}
            className={`nas-slide ${i === current ? "is-active" : ""}`}
            aria-hidden={i !== current} tabIndex={i === current ? 0 : -1} aria-label={`Explore ${p.name}`}>
            <img className="nas-img" src={bigImage(p.image)} alt={p.name} />
            <span className="nas-shade" />
            <span className="nas-explore">Explore item <span aria-hidden="true">↗</span></span>
            <span className="nas-info">
              <span className="nas-kicker">NEW IN{off > 0 ? ` · ${off}% OFF` : ""}</span>
              <h3 className="nas-title">{p.name}</h3>
              {p.description && <p className="nas-desc">{p.description}</p>}
              <span className="nas-price">
                <strong>{money(p.price)}</strong>
                {off > 0 && <del>{money(p.originalPrice)}</del>}
              </span>
            </span>
          </Link>
        );
      })}

      <span className="nas-count">0{current + 1} / 0{n}</span>

      <div className="nas-arrows">
        <button type="button" aria-label="Previous arrival" onClick={() => setCurrent((c) => (c - 1 + n) % n)}><FaChevronLeft /></button>
        <button type="button" aria-label="Next arrival" onClick={() => setCurrent((c) => (c + 1) % n)}><FaChevronRight /></button>
      </div>

      <div className="nas-dots">
        {slides.map((p, i) => (
          <button key={p.id} type="button" aria-label={`Show arrival ${i + 1}`}
            className={i === current ? "is-active" : ""} onClick={() => setCurrent(i)} />
        ))}
      </div>
    </div>
  );
}


function StoreNav({
  vendorName, tab, onTab, search, searchOpen, onToggleSearch, onSearchChange, onSearchSubmit,
  following, onFollow, variant,
}) {
  return (
    <nav className="vd-store-nav" aria-label={`${vendorName} store`}>
      {variant === "bar" && (
        <div className="vd-bar-brand">
          <span className="vd-bar-avatar" aria-hidden="true">
            {vendorName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </span>
          <button type="button" className={`vd-bar-follow ${following ? "is-following" : ""}`} onClick={onFollow}>
            {following ? <FaCheck /> : <FaPlus />} {following ? "Following" : "Follow"}
          </button>
        </div>
      )}

      <div className="vd-store-tabs">
        {TABS.map(([key, label]) => (
          <button key={key} type="button"
            className={`vd-store-tab ${tab === key ? "is-active" : ""}`}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => onTab(key)}>
            {label}
          </button>
        ))}
      </div>

      <form className={`vd-search ${searchOpen ? "is-open" : ""}`} onSubmit={onSearchSubmit} role="search">
        {searchOpen && (
          <input
            type="search"
            className="vd-search-input"
            value={search}
            placeholder="Search in store"
            aria-label={`Search ${vendorName}`}
            autoFocus
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onToggleSearch(); }}
          />
        )}
        <button type="button" className="vd-search-toggle" onClick={onToggleSearch}
          aria-label={searchOpen ? "Close search" : "Open search"} aria-expanded={searchOpen}>
          {searchOpen ? <FaTimes /> : <FaSearch />}
        </button>
      </form>
    </nav>
  );
}

function EmptyState({ title, text, onClear }) {
  return (
    <div className="vd-empty-search">
      <h3>{title}</h3>
      <p>{text}</p>
      {onClear && <button type="button" onClick={onClear}>Clear search</button>}
    </div>
  );
}

export default function VendorDetails() {
  const { vendorId } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = TAB_KEYS.includes(params.get("tab")) ? params.get("tab") : "home";

  const { addToCart, wishlistItems = [], moveToWishlist, removeFromWishlist } = useShop();

  const vendorName = useMemo(() => {
    const getVendor = (product) => product.vendor || product.brand;

    const match = vendorProducts.find(
      (product) =>
        slugify(getVendor(product) || "") === vendorId
    );

    if (match) return getVendor(match);

    if (!vendorId) {
      return getVendor(vendorProducts[0] || {}) || "Eshe Glo";
    }

    return decodeURIComponent(vendorId)
      .replace(/-/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }, [vendorId]);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [following, setFollowing] = useState(false);
  const [toast, setToast] = useState("");
  const [addingId, setAddingId] = useState(null);
  const [promoSlide, setPromoSlide] = useState(0);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [activeGroup, setActiveGroup] = useState(0);

  const goTab = (key) => {
    setParams(key === "home" ? {} : { tab: key });
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [tab]);

  useEffect(() => {
    const t = window.setInterval(() => setPromoSlide((c) => (c + 1) % promoCampaigns.length), 5000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nexiv-followed-vendors") || "[]");
      setFollowing(saved.includes(slugify(vendorName)));
    } catch { setFollowing(false); }
  }, [vendorName]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(t);
  }, [toast]);


  const products = useMemo(() => {
    const own = vendorProducts.filter(
      (p) => slugify(p.vendor || p.brand || "") === slugify(vendorName)
    );
    if (own.length) return own;

    const source = vendorProducts.length ? vendorProducts : demoStoreProducts;
    return source.map((p) => ({
      ...p,
      vendor: vendorName,
      category: p.category || "New In",
      stockLeft: p.stockLeft ?? p.stock ?? 10,
    }));
  }, [vendorName]);

  const query = search.trim().toLowerCase();
  const matches = (p) =>
    !query || [p.name, p.category, p.vendor].some((v) => String(v || "").toLowerCase().includes(query));

  const newProducts = useMemo(() => {
    const tagged = products.filter((p) => p.category === "New In");
    return tagged.length ? tagged : products.slice(0, 10);
  }, [products]);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  );

  const itemsList = useMemo(() => {
    let list = products.filter(matches).filter((p) => category === "All" || p.category === category);
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating") list = [...list].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    return list;

  }, [products, query, category, sort]);

  const promoList = useMemo(
    () => products.filter((p) => p.originalPrice > p.price).filter(matches),
    [products, query]
  );


  const newGroups = useMemo(() => {
    const list = newProducts.filter(matches);
    if (!list.length) return [];
    if (list.some(dateOf)) {
      const map = new Map();
      [...list]
        .sort((a, b) => new Date(dateOf(b) || 0) - new Date(dateOf(a) || 0))
        .forEach((p) => {
          const d = dateOf(p);
          const label = d
            ? new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
            : "Earlier";
          map.set(label, [...(map.get(label) || []), p]);
        });
      return [...map].map(([label, items]) => ({ label, items }));
    }
    const labels = ["This week", "Last week", "Earlier"];
    const size = Math.max(1, Math.ceil(list.length / 3));
    return labels
      .map((label, i) => ({ label, items: list.slice(i * size, (i + 1) * size) }))
      .filter((g) => g.items.length);
  }, [newProducts, query]);

  const averageRating = (customerReviews.reduce((t, r) => t + r.rating, 0) / customerReviews.length).toFixed(1);
  const ratingCounts = [5, 4, 3, 2, 1].map((rating) => ({
    rating, count: customerReviews.filter((r) => r.rating === rating).length,
  }));


  const isWishlisted = (id) => wishlistItems.some((i) => i.id === id);

  const toggleWishlist = (product) => {
    if (isWishlisted(product.id)) { removeFromWishlist(product.id); setToast("Removed from your wishlist"); }
    else { moveToWishlist(product); setToast("Added to your wishlist"); }
  };

  const handleAddToCart = async (product) => {
    if (addingId === product.id) return;
    setAddingId(product.id);
    try {
      await addToCart({
        ...product, vendor: product.vendor, brand: product.vendor,
        stock: product.stockLeft, stockLeft: product.stockLeft, quantity: 1
      });
      window.dispatchEvent(new Event("nexiv-cart-open"));
      setToast(`${product.name} added to your cart`);
    } catch (error) {
      console.error("Unable to add product to cart:", error);
      setToast("Could not add this item. Please try again.");
    } finally { setAddingId(null); }
  };

  const toggleFollow = () => {
    const next = !following;
    setFollowing(next);
    try {
      const saved = JSON.parse(localStorage.getItem("nexiv-followed-vendors") || "[]");
      const updated = next
        ? [...new Set([...saved, slugify(vendorName)])]
        : saved.filter((s) => s !== slugify(vendorName));
      localStorage.setItem("nexiv-followed-vendors", JSON.stringify(updated));
    } catch { }
    setToast(next ? `You're now following ${vendorName}` : `You unfollowed ${vendorName}`);
  }

  const toggleSearch = () => {
    if (searchOpen) { setSearchOpen(false); setSearch(""); }
    else setSearchOpen(true);
  };
  const handleSearchChange = (value) => {
    setSearch(value);
    if (value && (tab === "home" || tab === "review")) goTab("items");
  }
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (tab === "home" || tab === "review") goTab("items");
  }

  const navProps = {
    vendorName, tab, onTab: goTab, search, searchOpen, onToggleSearch: toggleSearch,
    onSearchChange: handleSearchChange, onSearchSubmit: handleSearchSubmit,
    following, onFollow: toggleFollow,
  }
  const cardProps = (p) => ({
    product: p, isWishlisted: isWishlisted(p.id), onToggleWishlist: toggleWishlist, onAddToCart: handleAddToCart,
  })
  const clearSearch = () => { setSearch(""); setSearchOpen(false); };
  const searchEmptyText = query ? `Nothing matches “${search}”.` : "Check back soon for new pieces from this store.";


  const renderHome = () => (
    <>

      <section className="vd-promo-section" id="vd-promotions">
        <div className="vd-section-heading">
          <span className="vd-section-kicker">EXCLUSIVE STORE OFFERS</span>
        </div>

        <div className="vd-sale-slider">
          {promoCampaigns.map((item, index) => (
            <article key={item.title} className={`vd-sale-slide ${promoSlide === index ? "is-active" : ""}`}
              aria-hidden={promoSlide !== index}>
              <img className="vd-sale-image" src={item.image} alt={item.title} />
              <div className="vd-sale-overlay" />
              {promoSlide === index && (
                <div className="vd-sale-content">
                  <span className="vd-sale-eyebrow">{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <div>
                    <span className="vd-sale-discount"><FaTag /> {item.discount}</span>
                    <button className="vd-sale-discount-button" type="button" onClick={() => goTab("promo")}>{item.button}<BsArrowUpRight /></button>
                  </div>
                </div>
              )}
              <span className="vd-sale-number">0{index + 1} / 0{promoCampaigns.length}</span>
            </article>
          ))}
          <div className="vd-sale-controls">
            <button type="button" aria-label="Previous sale"
              onClick={() => setPromoSlide((c) => (c - 1 + promoCampaigns.length) % promoCampaigns.length)}><FaChevronLeft /></button>
            <button type="button" aria-label="Next sale"
              onClick={() => setPromoSlide((c) => (c + 1) % promoCampaigns.length)}><FaChevronRight /></button>
          </div>
          <div className="vd-sale-dots">
            {promoCampaigns.map((item, index) => (
              <button key={item.title} type="button" aria-label={`Show sale ${index + 1}`}
                className={promoSlide === index ? "is-active" : ""} onClick={() => setPromoSlide(index)} />
            ))}
          </div>
        </div>
      </section>

      <section className="vd-collection-section" id="vd-new">
        {newProducts.length > 0 ? (
          <NewArrivalsSlider items={newProducts} />
        ) : (
          <EmptyState title="New arrivals are on the way." text="Check back soon for the latest pieces from this store." />
        )}
      </section>

      <section className="vd-reviews-section" id="vd-reviews">
        <StaggerReviews reviews={customerReviews} />
      </section>
    </>
  )

  const renderItems = () => (
    <section className="vd-page-section">
      <header className="vd-page-head">
        <div>
          <span className="vd-section-kicker">ALL ITEMS</span>
          <h2>Shop {vendorName}</h2>
        </div>
        <span className="vd-count">{itemsList.length} item{itemsList.length === 1 ? "" : "s"}</span>
      </header>

      <div className="vd-items-toolbar vd-items-bar">
        <div className="vd-chips">
          {categories.map((c) => (
            <button key={c} type="button" className={category === c ? "is-active" : ""} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <label className="vd-sort">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </label>
      </div>

      {itemsList.length ? (
        <div className="vd-product-grid vd-grid-5">
          {itemsList.map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
        </div>
      ) : (
        <EmptyState title="No items found." text={searchEmptyText} onClear={query ? clearSearch : undefined} />
      )}
    </section>
  );

  const renderNew = () => (
    <section className="vd-page-section">
      <header className="vd-page-head">
        <div>
          <span className="vd-section-kicker">JUST ARRIVED</span>
          <h2>New in the store</h2>
        </div>
      </header>

      {newGroups.length ? (
        <div className="vd-new-layout">
          <aside className="vd-date-nav" aria-label="Arrival dates">
            {newGroups.map((g, i) => (
              <button key={g.label} type="button" className={activeGroup === i ? "is-active" : ""}
                onClick={() => {
                  setActiveGroup(i);
                  document.getElementById(`vd-new-group-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}>
                {g.label}
              </button>
            ))}
          </aside>

          <div className="vd-new-groups">
            {newGroups.map((g, i) => (
              <section key={g.label} id={`vd-new-group-${i}`} className="vd-new-group">
                <h3>{g.label}</h3>
                <div className="vd-product-grid vd-grid-4">
                  {g.items.map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="New arrivals are on the way." text={searchEmptyText} onClear={query ? clearSearch : undefined} />
      )}
    </section>
  )

  const renderPromo = () => (
    <section className="vd-page-section">
      <div className="vd-discount-panel">
        <header className="vd-discount-head">
          <h2><FaTag /> All Discount</h2>
          <span className="vd-count">{promoList.length} deal{promoList.length === 1 ? "" : "s"}</span>
        </header>

        {promoList.length ? (
          <div className="vd-product-grid vd-grid-5">
            {promoList.map((p) => <ProductCard key={p.id} {...cardProps(p)} />)}
          </div>
        ) : (
          <EmptyState title="No deals right now." text={query ? searchEmptyText : "There are no discounted items at the moment."}
            onClear={query ? clearSearch : undefined} />
        )}
      </div>
    </section>
  )

  const renderReview = () => (
    <section className="vd-page-section">
      <header className="vd-page-head">
        <div>
          <h2>Customer reviews</h2>
        </div>
      </header>

      <div className="vd-review-summary">
        <div className="vd-review-score">
          <strong>{averageRating}</strong>
          <span className="vd-testimonial-stars">{"★".repeat(Math.round(Number(averageRating)))}</span>
          <small>{customerReviews.length} reviews</small>
        </div>
        <div className="vd-review-bars">
          {ratingCounts.map(({ rating, count }) => (
            <div key={rating}>
              <span>{rating} <FaStar /></span>
              <i><b style={{ width: `${(count / customerReviews.length) * 100}%` }} /></i>
              <small>{count}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="vd-review-grid">
        {customerReviews.map((r) => (
          <article key={r.id} className="vd-review-card">
            <div className="vd-review-photo"><img src={r.productImage} alt={r.product} loading="lazy" /></div>
            <div className="vd-review-card-body">
              <span className="vd-testimonial-stars">{"★".repeat(r.rating)}</span>
              <p>“{r.text}”</p>
              <div className="vd-testimonial-bottom">
                <div className="vd-testimonial-customer"><strong>{r.name}</strong><span>{r.location}</span></div>
                <div className="vd-testimonial-verified"><FaCheck /><span>Verified buyer</span></div>
              </div>
              <div className="vd-rv-item"><span>REVIEWED ITEM</span><strong>{r.product}</strong></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )

  return (
    <main className="vd-page">
      {tab !== "home" && (
        <header className="vd-bar">
          <div className="vd-hero-navigation"><StoreNav {...navProps} variant="bar" /></div>
        </header>
      )}

      <div className="vd-shell">
        {tab === "home" && (
          <section id="vd-home" className="vd-hero">
            <video className="vd-hero-video" autoPlay muted loop playsInline src={promo} />
            <div className="vd-hero-noise" />
            <div className="vd-hero-shade" />

            <div className="vd-hero-navigation"><StoreNav {...navProps} variant="hero" /></div>

            <div className="vd-hero-content">
              <div className="vd-hero-main">
                <h1 className="vd-hero-vendor-name">{vendorName}</h1>
              </div>
              <div className="vd-hero-description">
                <button type="button" className={`vd-hero-follow ${following ? "is-following" : ""}`} onClick={toggleFollow}>
                  {following ? <FaCheck /> : ""}{following ? "Following store" : "Follow store"}
                </button>
              </div>
            </div>
          </section>
        )}

        {tab === "home" && renderHome()}
        {tab === "items" && renderItems()}
        {tab === "new" && renderNew()}
        {tab === "promo" && renderPromo()}
        {tab === "review" && renderReview()}

        <footer className="vd-footer">
          <strong>NEX-IV</strong>
          <Link to="/home">Back to marketplace <BsArrowUpRight /></Link>
        </footer>
      </div>

      {toast && (
        <div className="vd-toast" role="status">
          <span><FaCheck /></span>{toast}
        </div>
      )}
    </main>
  )
}