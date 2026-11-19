import { MdOutlineStorefront } from "react-icons/md";
import { IoChevronForward } from "react-icons/io5";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaChevronRight,
  FaArrowRight,
  FaSearch,
  FaShoppingBag,
  FaUser,
  FaClock,
  FaTrash,
  FaMinus,
  FaPlus,
  FaHeart,
  FaGlobe,
  FaUserCircle,
  FaExchangeAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import {
  useShop,
  formatMoney,
  groupByVendor,
  discountPercent,
} from "../context/ShopContext";
import { signOutCurrent } from "../data/AccountSessions";
import Logo from "../images/Logo2.png";
import "../styles/Header.css";
import products from "../data/Products";

const CART_ANIMATION_MS = 420;

const categories = [
  {
    name: "Fashion & Clothing",
    description: "Everyday style, footwear and accessories",
    items: [
      "Women's Clothing",
      "Men Clothing",
      "Kids",
      "Shoes",
      "Bags",
      "Jewelry & Accessories",
    ],
  },
  {
    name: "Electronics",
    description: "Devices, gadgets and accessories",
    items: [
      "Phones & Tablets",
      "Computers",
      "Audio",
      "Cameras",
      "Smart Devices",
    ],
  },
  {
    name: "Home & Living",
    description: "Make every space feel like yours",
    items: ["Furniture", "Kitchen", "Bedding", "Lighting", "Home Decor"],
  },
  {
    name: "Beauty & Personal Care",
    description: "Beauty, grooming and self-care",
    items: [
      "Skincare",
      "Makeup",
      "Hair Care",
      "Wigs & Extensions",
      "Fragrance",
    ],
  },
  {
    name: "Sports & Outdoors",
    description: "Gear for movement and adventure",
    items: ["Fitness", "Outdoor Gear", "Sportswear", "Travel Essentials"],
  },
  {
    name: "Jewelry & Accessories",
    description: "The finishing touches",
    items: ["Watches", "Necklaces", "Bags", "Sunglasses", "Hair Accessories"],
  },
  {
    name: "Food & Lifestyle",
    description: "Everyday essentials and more",
    items: [
      "Groceries",
      "Kitchen Essentials",
      "Books & Stationery",
      "Pet Supplies",
    ],
  },
  {
    name: "Automotive",
    description: "Deals for cars and more",
    items: [
      "Replacement Parts",
      "Car Audio & Video",
      "Tools & Equipment",
      "Car Exterior Care",
      "Car Interior Care",
      "Oils & Fluids",
      "Interior Accessories",
    ],
  },
  {
    name: "New Arrivals",
    description: "Discover what's new across the marketplace",
    items: [
      "Recently Added",
      "Trending Products",
      "New Vendors",
      "Best Sellers",
    ],
  },
  {
    name: "Deals & Offers",
    description: "Find something good for less",
    items: ["Today's Deals", "Clearance", "Under ₦10,000", "Special Offers"],
  },
];

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const normalize = (value = "") =>
  value.toLowerCase().replace(/['’]/g, "").replace(/&/g, "and").trim();

const getVendorName = (p) => p.vendor || p.brand;

const categoryHref = (name) => `/categories/${slugify(name)}`;
const subcategoryHref = (cat, sub) =>
  `/categories/${slugify(cat)}/${slugify(sub)}`;

// Every token in the query must match; better matches score higher
function scoreText(text, tokens) {
  const hay = normalize(text);
  let total = 0;

  for (const token of tokens) {
    if (hay === token) total += 6;
    else if (hay.startsWith(token)) total += 4;
    else if (hay.split(/\s+/).some((w) => w.startsWith(token))) total += 3;
    else if (hay.includes(token)) total += 1;
    else return 0;
  }

  return total;
}

// Built once, when the module loads
const searchIndex = (() => {
  const entries = [];

  categories.forEach((cat) => {
    entries.push({
      type: "Category",
      label: cat.name,
      meta: cat.description,
      href: categoryHref(cat.name),
      text: cat.name,
    });

    cat.items.forEach((sub) =>
      entries.push({
        type: "Subcategory",
        label: sub,
        meta: cat.name,
        href: subcategoryHref(cat.name, sub),
        text: `${sub} ${cat.name}`,
      })
    );
  });

  const seenVendors = new Set();
  products.forEach((p) => {
    const vendor = getVendorName(p);
    if (!vendor || seenVendors.has(vendor)) return;
    seenVendors.add(vendor);

    entries.push({
      type: "Vendor",
      label: vendor,
      meta: "Vendor store",
      href: `/vendor/${slugify(vendor)}`,
      text: vendor,
    });
  });

  products.forEach((p) =>
    entries.push({
      type: "Product",
      label: p.name,
      meta: `${getVendorName(p) || "NEX-IV"} · ${p.category}`,
      href: `/product/${p.id}`,
      image: p.image,
      product: p,
      text: `${p.name} ${getVendorName(p) || ""} ${p.category} ${
        p.subcategory || ""
      }`,
    })
  );

  return entries;
})();

const TYPE_BOOST = { Vendor: 1.5, Category: 1.4, Subcategory: 1.2, Product: 1 };

function getSuggestions(query, limit = 8) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return [];

  return searchIndex
    .map((entry) => ({
      ...entry,
      score: scoreText(entry.text, tokens) * (TYPE_BOOST[entry.type] || 1),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Exact name of a category, subcategory, vendor or product
function findExactMatch(query) {
  const q = normalize(query);
  return searchIndex.find((entry) => normalize(entry.label) === q) || null;
}

const RECENT_SEARCHES_KEY = "nexivRecentSearches";

function readRecentSearches() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(RECENT_SEARCHES_KEY) || "[]"
    );

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  const cleanQuery = query.trim();

  if (!cleanQuery) return;

  const updated = [
    cleanQuery,
    ...readRecentSearches().filter(
      (item) =>
        typeof item === "string" &&
        item.toLowerCase() !== cleanQuery.toLowerCase()
    ),
  ].slice(0, 6);

  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
}

function Header() {
  const navigate = useNavigate();

  const searchRef = useRef(null);
  const searchAreaRef = useRef(null);
  const menuPanelRef = useRef(null);

  const cartAreaRef = useRef(null);
  const cartDrawerRef = useRef(null);

  const userMenuRef = useRef(null);
  const userMenuTimer = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState(readRecentSearches);
  const [cartMounted, setCartMounted] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartClosing, setCartClosing] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("nexivCurrentUser"));
    } catch {
      return null;
    }
  });

  const {
    activeItems = [],
    cartCount = 0,
    selectedCount = 0,
    allSelected = false,
    isItemSelected,
    toggleItem,
    toggleGroup,
    toggleAll,
    changeQuantity,
    removeFromCart,
    retailPrice = 0,
    totalSaved = 0,
    couponAmount = 0,
    finalPrice = 0,
    freeShippingGap = 0,
  } = useShop();

  const suggestions = useMemo(
    () => getSuggestions(searchQuery, 8),
    [searchQuery]
  );

  const openCart = () => {
    setMenuOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(false);
    setCartClosing(false);
    setCartMounted(true);
  };

  const closeCart = () => {
    if (!cartMounted || cartClosing) return;
    setCartOpen(false);
    setCartClosing(true);
  };

  useEffect(() => {
    if (!cartMounted) return undefined;

    if (cartClosing) {
      const timer = window.setTimeout(() => {
        setCartMounted(false);
        setCartClosing(false);
      }, CART_ANIMATION_MS);

      return () => window.clearTimeout(timer);
    }

    setCartOpen(false);

    let secondFrame;

    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setCartOpen(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);

      if (secondFrame !== undefined) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [cartMounted, cartClosing]);

  useEffect(() => {
    const updateUser = () => {
      try {
        setCurrentUser(
          JSON.parse(localStorage.getItem("nexivCurrentUser"))
        );
      } catch {
        setCurrentUser(null);
      }
    };

    window.addEventListener("nexiv-auth-change", updateUser);
    window.addEventListener("storage", updateUser);

    return () => {
      window.removeEventListener("nexiv-auth-change", updateUser);
      window.removeEventListener("storage", updateUser);
    };
  }, []);

  useEffect(() => {
    if (searchOpen) {
      searchRef.current?.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(event.target)
      ) {
        setSearchOpen(false);
      }

      const clickedCartTrigger =
        cartAreaRef.current?.contains(event.target);

      const clickedCartDrawer =
        cartDrawerRef.current?.contains(event.target);

      if (
        cartMounted &&
        !clickedCartTrigger &&
        !clickedCartDrawer
      ) {
        closeCart();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [cartMounted, cartClosing]);

  // Locks page scroll while the category menu or cart drawer is open.
  // It always resets to "" on cleanup instead of restoring a saved value:
  // if another component (like the quick-add popup) had already locked the
  // page, restoring the saved "hidden" would leave scrolling stuck forever.
  useEffect(() => {
    if (!menuOpen && !cartMounted) return undefined;

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
        closeCart();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, cartMounted, cartClosing]);

  useEffect(() => {
    const handleOpenCart = () => {
      openCart();
    };

    window.addEventListener("nexiv-cart-open", handleOpenCart);

    return () => {
      window.removeEventListener("nexiv-cart-open", handleOpenCart);
    };
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const handleClick = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleKey = (event) => {
      if (event.key === "Escape") setUserMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    return () => window.clearTimeout(userMenuTimer.current);
  }, []);

  const finishSearch = (label) => {
    saveRecentSearch(label);
    setRecentSearches(readRecentSearches());
    setSearchQuery(label);
    setSearchOpen(false);
  };

  const submitSearch = (value = searchQuery) => {
    const query = value.trim();
    if (!query) return;

    finishSearch(query);

    const exact = findExactMatch(query);
    navigate(exact ? exact.href : `/search?q=${encodeURIComponent(query)}`);
  };

  const selectSuggestion = (suggestion) => {
    if (suggestion.href) {
      finishSearch(suggestion.label);
      navigate(suggestion.href);
    } else {
      submitSearch(suggestion.label); // recent-search items have no href
    }
  };

  const clearRecentSearches = () => {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecentSearches([]);
  };

  const userName =
    currentUser?.username ||
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.firstName ||
    currentUser?.email?.split("@")[0] ||
    "Nex-IV Shopper";

  const openUserMenu = () => {
    window.clearTimeout(userMenuTimer.current);
    setMenuOpen(false);
    setSearchOpen(false);
    setUserMenuOpen(true);
  };

  const closeUserMenu = () => {
    window.clearTimeout(userMenuTimer.current);
    userMenuTimer.current = window.setTimeout(
      () => setUserMenuOpen(false),
      150
    );
  };

  const goTo = (path) => {
    window.clearTimeout(userMenuTimer.current);
    setUserMenuOpen(false);
    navigate(path);
  };

  const handleSignOut = () => {
    window.clearTimeout(userMenuTimer.current);
    setUserMenuOpen(false);
    signOutCurrent();
    setCurrentUser(null);
    window.dispatchEvent(new Event("nexiv-auth-change"));
    navigate("/login");
  };

  const goToCategory = (categoryName, subcategoryName = "") => {
    setMenuOpen(false);
    navigate(
      subcategoryName
        ? subcategoryHref(categoryName, subcategoryName)
        : categoryHref(categoryName)
    );
  };

  return (
    <>
      <header className="nx-header">
        <div className="nx-header-inner">
          <button
            type="button"
            className={`nx-category-trigger ${menuOpen ? "is-active" : ""}`}
            onClick={() => {
              setMenuOpen((open) => !open);
              setSearchOpen(false);
              setUserMenuOpen(false);
              closeCart();
            }}
            aria-expanded={menuOpen}
            aria-label="Toggle categories"
          >
            <span className="nx-menu-icon">
              <FaBars />
            </span>

            <span className="nx-category-label">Categories</span>
          </button>

          <Link
            to="/home"
            className="nx-brand"
            aria-label="Nex-IV home"
            onClick={() => {
              setMenuOpen(false);
              setSearchOpen(false);
              setUserMenuOpen(false);
              closeCart();
            }}
          >
            <img src={Logo} alt="Nex-IV" />
          </Link>

          <div className="nx-header-actions">
            <div
              className={`nx-search-area ${searchOpen ? "is-open" : ""}`}
              ref={searchAreaRef}
            >
              <form
                className="nx-search-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
              >
                <input
                  ref={searchRef}
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search products, vendors and more"
                  aria-label="Search products, vendors and categories"
                  tabIndex={searchOpen ? 0 : -1}
                />

                {searchOpen && searchQuery && (
                  <button
                    type="button"
                    className="nx-search-clear"
                    onClick={() => {
                      setSearchQuery("");
                      searchRef.current?.focus();
                    }}
                    aria-label="Clear search"
                  >
                    <FaTimes />
                  </button>
                )}

                <button
                  type="submit"
                  className="nx-search-submit"
                  aria-label="Submit search"
                  tabIndex={searchOpen ? 0 : -1}
                >
                  <FaSearch />
                </button>
              </form>

              <button
                type="button"
                className="nx-icon-button nx-search-toggle"
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setMenuOpen(false);
                  setUserMenuOpen(false);
                  closeCart();
                }}
                aria-label={searchOpen ? "Close search" : "Open search"}
                aria-expanded={searchOpen}
              >
                {searchOpen ? (
                  <FaTimes style={{ color: "#341f1a" }} />
                ) : (
                  <FaSearch />
                )}
              </button>

              {searchOpen && (
                <div className="nx-search-panel">
                  {searchQuery.trim() ? (
                    <>
                      <div className="nx-panel-heading">
                        <span>Suggestions</span>
                      </div>

                      {suggestions.length > 0 && (
                        <div className="nx-suggestion-list">
                          {suggestions.map((suggestion) => (
                            <button
                              type="button"
                              key={`${suggestion.type}-${suggestion.label}`}
                              className="nx-suggestion"
                              onClick={() => selectSuggestion(suggestion)}
                            >
                              <span className="nx-suggestion-icon">
                                {suggestion.image ? (
                                  <img src={suggestion.image} alt="" />
                                ) : (
                                  <FaSearch />
                                )}
                              </span>

                              <span className="nx-suggestion-copy">
                                <strong>{suggestion.label}</strong>
                                <small>
                                  {suggestion.type} · {suggestion.meta}
                                </small>
                              </span>

                              <FaArrowUpRightFromSquare className="nx-suggestion-arrow" />
                            </button>
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        className="nx-search-all"
                        onClick={() => submitSearch()}
                      >
                        {suggestions.length > 0
                          ? `See all results for “${searchQuery.trim()}”`
                          : `Search all marketplace results for “${searchQuery.trim()}”`}
                        <FaArrowRight />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="nx-panel-heading">
                        <span>Recently searched</span>

                        {recentSearches.length > 0 && (
                          <button
                            type="button"
                            className="nx-clear-recent"
                            onClick={clearRecentSearches}
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {recentSearches.length > 0 ? (
                        <div className="nx-recent-list">
                          {recentSearches.map((item) => (
                            <button
                              type="button"
                              className="nx-recent-item"
                              key={item}
                              onClick={() =>
                                selectSuggestion({ label: item })
                              }
                            >
                              <FaClock />
                              <span>{item}</span>
                              <FaArrowUpRightFromSquare />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="nx-search-empty">
                          <span className="nx-search-empty-icon">
                            <FaSearch />
                          </span>

                          <strong>Your next find starts here.</strong>

                          <p>
                            Search products, discover sellers, or explore a
                            category.
                          </p>
                        </div>
                      )}

                      <div className="nx-search-footnote">
                        <span>Try searching</span>

                        {["Headphones", "Home decor", "Skincare"].map(
                          (term) => (
                            <button
                              type="button"
                              key={term}
                              onClick={() => {
                                setSearchQuery(term);
                                searchRef.current?.focus();
                              }}
                            >
                              {term}
                            </button>
                          )
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div
              className="nx-user-menu"
              ref={userMenuRef}
              onMouseEnter={openUserMenu}
              onMouseLeave={closeUserMenu}
            >
              <button
                type="button"
                className="nx-icon-button nx-account-button"
                onClick={(event) => {
                  if (event.nativeEvent.pointerType === "touch") {
                    setSearchOpen(false);
                    setMenuOpen(false);
                    closeCart();
                    setUserMenuOpen((open) => !open);
                  } else {
                    goTo("/account");
                  }
                }}
                onFocus={openUserMenu}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label={currentUser ? "Account menu" : "Sign in or sign up"}
                title={currentUser ? userName : "Sign in or sign up"}
              >
                <FaUser />
              </button>

              {userMenuOpen && (
                <div className="nx-user-panel" role="menu">
                  {currentUser ? (
                    <>
                      <div className="nx-user-profile">
                        <span className="nx-user-avatar">
                          {userName.charAt(0).toUpperCase()}
                        </span>

                        <div>
                          <strong>{userName}</strong>
                          {currentUser.email && (
                            <small>{currentUser.email}</small>
                          )}
                        </div>
                      </div>

                      <div className="nx-user-separator" />

                      <button
                        type="button"
                        role="menuitem"
                        className="nx-user-item"
                        onClick={() => goTo("/account/wishlist")}
                      >
                        <FaHeart /> Wishlist
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        className="nx-user-item"
                        onClick={() => goTo("/account/language")}
                      >
                        <FaGlobe /> Language &amp; currency
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        className="nx-user-item"
                        onClick={() => goTo("/account/management")}
                      >
                        <FaUserCircle /> My profile
                      </button>

                      <div className="nx-user-separator" />

                      <button
                        type="button"
                        role="menuitem"
                        className="nx-user-item"
                        onClick={() => goTo("/login?switch=1")}
                      >
                        <FaExchangeAlt /> Switch account
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        className="nx-user-item is-destructive"
                        onClick={handleSignOut}
                      >
                        <FaSignOutAlt /> Sign out
                      </button>
                    </>
                  ) : (
                    <div className="nx-user-guest">
                      <p>
                        <strong>Welcome to Nex-IV</strong>
                        <span>
                          Sign in to track orders and save your favourites.
                        </span>
                      </p>

                      <button
                        type="button"
                        role="menuitem"
                        className="nx-user-secondary"
                        onClick={() => goTo("/register")}
                      >
                        Sign in/Sign up
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              ref={cartAreaRef}
              className={`nx-cart-area ${
                cartOpen && !cartClosing ? "is-open" : ""
              }`}
            >
              <button
                type="button"
                className="nx-icon-button nx-cart-button"
                onClick={() => {
                  if (cartMounted && cartOpen && !cartClosing) {
                    closeCart();
                  } else {
                    openCart();
                  }

                  setSearchOpen(false);
                  setMenuOpen(false);
                  setUserMenuOpen(false);
                }}
                aria-label={`Shopping cart, ${cartCount} items`}
                aria-expanded={cartOpen && !cartClosing}
                aria-controls="nx-cart-drawer"
              >
                <FaShoppingBag />

                {cartCount > 0 && (
                  <span className="nx-cart-count">{cartCount}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {cartMounted && (
        <>
          <button
            type="button"
            className={`nx-cart-backdrop ${
              cartOpen && !cartClosing ? "is-open" : ""
            }`}
            aria-label="Close cart preview"
            onClick={closeCart}
          />

          <aside
            ref={cartDrawerRef}
            id="nx-cart-drawer"
            className={`nx-cart-drawer ${
              cartOpen && !cartClosing ? "nx-cart-open" : ""
            } ${cartClosing ? "nx-cart-closing" : ""}`}
            aria-label="Shopping cart preview"
            aria-hidden={!cartOpen || cartClosing}
          >
            <div className="nx-cart-drawer-head">
              <button
                type="button"
                className="nx-drawer-close"
                onClick={closeCart}
                aria-label="Close cart preview"
              >
                <FaTimes style={{ fontSize: "25px" }} />
              </button>
            </div>

            {activeItems.length === 0 ? (
              <div className="nx-cart-empty">
                <div className="nx-cart-empty-icon">
                  <FaShoppingBag style={{ fontSize: "50px" }} />
                </div>
                <span>Your cart is empty.</span>
              </div>
            ) : (
              <>
                {couponAmount > 0 && (
                  <div className="nx-cart-notice">
                    Your available savings:{" "}
                    <strong>{formatMoney(couponAmount)}</strong>
                  </div>
                )}

                <div className="nx-cart-items">
                  {groupByVendor(activeItems).map((group) => (
                    <section className="nx-cart-vendor" key={group.vendor}>
                      <label className="nx-vendor-heading">
                        <input
                          type="checkbox"
                          checked={group.items.every((item) =>
                            isItemSelected(item.id)
                          )}
                          onChange={() => toggleGroup(group.items)}
                        />
                        <MdOutlineStorefront />
                        <span>{group.vendor}</span>
                        <Link
                          to={`/vendor/${slugify(group.vendor)}`}
                          onClick={closeCart}
                          className="nx-vendor-arrow"
                        >
                          <IoChevronForward />
                        </Link>
                        <span className="nx-vendor-item-count">
                          {group.items.reduce(
                            (total, item) => total + item.quantity,
                            0
                          )}{" "}
                          items
                        </span>
                      </label>

                      {group.items.map((item) => (
                        <article className="nx-cart-item" key={item.id}>
                          <input
                            type="checkbox"
                            checked={isItemSelected(item.id)}
                            onChange={() => toggleItem(item.id)}
                            aria-label={`Select ${item.name}`}
                          />

                          <div className="nx-cart-product-image">
                            {item.image ? (
                              <img src={item.image} alt={item.name} />
                            ) : (
                              <FaShoppingBag />
                            )}
                          </div>

                          <div className="nx-cart-product-info">
                            <h3>{item.name}</h3>

                            {item.variant && <p>{item.variant}</p>}

                            {item.stockLeft > 0 && item.stockLeft <= 5 && (
                              <small className="nx-stock-note">
                                {item.stockLeft} left
                              </small>
                            )}

                            <div className="nx-cart-product-bottom">
                              <div>
                                <strong>{formatMoney(item.price)}</strong>

                                {discountPercent(item) > 0 && (
                                  <small>-{discountPercent(item)}%</small>
                                )}
                              </div>

                              <div className="nx-quantity-control">
                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      item.id,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  aria-label={`Decrease ${item.name} quantity`}
                                  disabled={item.quantity <= 1}
                                >
                                  <FaMinus />
                                </button>

                                <span>{item.quantity}</span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    changeQuantity(
                                      item.id,
                                      item.quantity + 1
                                    )
                                  }
                                  aria-label={`Increase ${item.name} quantity`}
                                  disabled={
                                    item.stockLeft > 0 &&
                                    item.quantity >= item.stockLeft
                                  }
                                >
                                  <FaPlus />
                                </button>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="nx-remove-item"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.name}`}
                          >
                            <FaTrash />
                          </button>
                        </article>
                      ))}
                    </section>
                  ))}
                </div>

                {freeShippingGap > 0 && (
                  <div className="nx-shipping-note">
                    Add <strong>{formatMoney(freeShippingGap)}</strong> more
                    to enjoy free shipping.
                    <div>
                      <span
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (1 -
                                freeShippingGap /
                                  Math.max(retailPrice + freeShippingGap, 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="nx-cart-summary">
                  <div>
                    <span>Retail price</span>
                    <span>{formatMoney(retailPrice)}</span>
                  </div>

                  {totalSaved > 0 && (
                    <div className="nx-savings-line">
                      <span>Your savings</span>
                      <strong>{formatMoney(totalSaved)}</strong>
                    </div>
                  )}

                  <label className="nx-select-all">
                    <span>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                      />
                      Select all
                    </span>

                    <span>{selectedCount} selected</span>
                  </label>

                  <div className="nx-cart-total">
                    <span>Estimated total</span>
                    <strong>{formatMoney(finalPrice)}</strong>
                  </div>

                  <Link
                    to="/cart"
                    className="nx-primary-button"
                    onClick={closeCart}
                  >
                    View cart <FaArrowRight />
                  </Link>

                  <p className="nx-cart-trust">
                    Secure checkout · Seller-by-seller shopping
                  </p>
                </div>
              </>
            )}
          </aside>
        </>
      )}

      <div
        className={`nx-menu-backdrop ${menuOpen ? "is-visible" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        ref={menuPanelRef}
        className={`nx-category-drawer ${menuOpen ? "is-open" : ""}`}
        aria-label="Marketplace categories"
        aria-hidden={!menuOpen}
      >
        <div className="nx-menu-head">
          <h2>All Categories</h2>
          <button
            type="button"
            className="nx-drawer-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close categories"
          >
            <FaTimes />
          </button>
        </div>

        <div className="nx-category-layout">
          <nav className="nx-category-list" aria-label="Main categories">
            {categories.map((category) => (
              <button
                type="button"
                key={category.name}
                className={`nx-category-item ${
                  activeCategory.name === category.name ? "is-active" : ""
                }`}
                onMouseEnter={() => setActiveCategory(category)}
                onFocus={() => setActiveCategory(category)}
                onClick={() => goToCategory(activeCategory.name)}
              >
                <span>{category.name}</span>
                <FaChevronRight />
              </button>
            ))}
          </nav>

          <div className="nx-category-details">
            <div className="nx-subcategory-heading">
              <button
                type="button"
                className="nx-category-heading-link"
                onClick={() => goToCategory(activeCategory.name)}
              >
                <h3>{activeCategory.name}</h3>
                <span>
                  Explore all <FaArrowRight />
                </span>
              </button>
            </div>

            <div className="nx-subcategory-grid">
              {activeCategory.items.map((item) => (
                <button
                  type="button"
                  key={item}
                  className="nx-subcategory-link"
                  onClick={() => goToCategory(activeCategory.name, item)}
                >
                  <span>{item}</span>
                  <FaArrowRight />
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Header;