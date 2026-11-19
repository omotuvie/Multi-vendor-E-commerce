import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { FaRegStar } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa6";
import { IoIosArrowForward, IoIosSearch } from "react-icons/io";
import {
  useShop,
  formatMoney,
  discountPercent,
} from "../context/ShopContext";
import QuickAddModal from "../components/QuickAddModal";
import products from "../data/Products";
import "../styles/Category.css";

const categories = [
  "Fashion & Clothing",
  "Electronics",
  "Home & Living",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Jewelry & Accessories",
  "Food & Lifestyle",
  "Automotive",
  "Deals & Offers",
];

const RANGE_STEP = 500;

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const categoryFromSlug = (slug = "") =>
  categories.find((category) => slugify(category) === slug) ||
  "All Categories";

export default function Category() {
  const { categorySlug } = useParams();

  const { wishlistItems, moveToWishlist, removeFromWishlist } = useShop();

  const selectedCategory = categoryFromSlug(categorySlug);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);

  const sortDropdownRef = useRef(null);

  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minimumRating, setMinimumRating] = useState(0);
  const [saleOnly, setSaleOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target)
      ) {
        setSortOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  
  useEffect(() => {
    setSelectedBrands([]);
    setMinPrice("");
    setMaxPrice("");
  }, [selectedCategory]);

  const sortOptions = [
    { value: "featured", label: "Featured" },
    { value: "price-low", label: "Price: low to high" },
    { value: "price-high", label: "Price: high to low" },
    { value: "rating", label: "Top rated" },
    { value: "discount", label: "Biggest discount" },
  ];

  const selectedSort =
    sortOptions.find((option) => option.value === sortBy) || sortOptions[0];

  // Products in the current category, before any filters
  const categoryProducts = useMemo(() => {
    if (selectedCategory === "Deals & Offers") {
      return products.filter((product) => discountPercent(product) > 0);
    }

    if (selectedCategory !== "All Categories") {
      return products.filter(
        (product) => product.category === selectedCategory
      );
    }

    return products;
  }, [selectedCategory]);

  const priceBounds = useMemo(() => {
    const prices = categoryProducts.map((product) => Number(product.price));

    if (!prices.length) return { min: 0, max: 0 };

    return {
      min: Math.floor(Math.min(...prices) / 1000) * 1000,
      max: Math.ceil(Math.max(...prices) / 1000) * 1000,
    };
  }, [categoryProducts]);

  const brandList = useMemo(() => {
    const counts = new Map();

    categoryProducts.forEach((product) => {
      const brand = product.vendor || product.brand;
      if (brand) counts.set(brand, (counts.get(brand) || 0) + 1);
    });

    return [...counts].sort((a, b) => a[0].localeCompare(b[0]));
  }, [categoryProducts]);

  const rangeSpan = Math.max(priceBounds.max - priceBounds.min, 1);
  const lowValue = minPrice === "" ? priceBounds.min : Number(minPrice);
  const highValue = maxPrice === "" ? priceBounds.max : Number(maxPrice);
  const lowPercent = ((lowValue - priceBounds.min) / rangeSpan) * 100;
  const highPercent = ((highValue - priceBounds.min) / rangeSpan) * 100;

  const handleLowSlider = (event) => {
    const value = Math.min(Number(event.target.value), highValue - RANGE_STEP);
    setMinPrice(value <= priceBounds.min ? "" : String(value));
  };

  const handleHighSlider = (event) => {
    const value = Math.max(Number(event.target.value), lowValue + RANGE_STEP);
    setMaxPrice(value >= priceBounds.max ? "" : String(value));
  };

  const toggleBrand = (brand) =>
    setSelectedBrands((current) =>
      current.includes(brand)
        ? current.filter((item) => item !== brand)
        : [...current, brand]
    );

  const filteredProducts = useMemo(() => {
    let result = [...categoryProducts];

    if (selectedBrands.length > 0) {
      result = result.filter((product) =>
        selectedBrands.includes(product.vendor || product.brand)
      );
    }

    if (search.trim()) {
      const query = search.toLowerCase().trim();

      result = result.filter((product) =>
        [
          product.name,
          product.vendor || product.brand,
          product.category,
          product.subcategory,
          product.description,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        )
      );
    }

    if (minPrice !== "") {
      result = result.filter(
        (product) => Number(product.price) >= Number(minPrice)
      );
    }

    if (maxPrice !== "") {
      result = result.filter(
        (product) => Number(product.price) <= Number(maxPrice)
      );
    }

    if (minimumRating > 0) {
      result = result.filter(
        (product) => Number(product.rating || 0) >= minimumRating
      );
    }

    if (saleOnly) {
      result = result.filter((product) => discountPercent(product) > 0);
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "rating") {
      result.sort(
        (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
      );
    } else if (sortBy === "discount") {
      result.sort((a, b) => discountPercent(b) - discountPercent(a));
    }

    return result;
  }, [
    categoryProducts,
    selectedBrands,
    search,
    minPrice,
    maxPrice,
    minimumRating,
    saleOnly,
    sortBy,
  ]);

  const isWishlisted = (id) =>
    wishlistItems.some((item) => item.id === id);

  const toggleWishlist = (product) => {
    if (isWishlisted(product.id)) {
      removeFromWishlist(product.id);
    } else {
      moveToWishlist(product);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedBrands([]);
    setMinimumRating(0);
    setSaleOnly(false);
    setSortBy("featured");
  };

  return (
    <main className="nx-category-page">
      <div className="nx-category-breadcrumb">
        <Link to="/home">Home</Link>
        <span>/</span>
        <span>{selectedCategory}</span>
      </div>

      <div className="nx-category-layout">
        <aside
          className={`nx-category-sidebar ${
            filtersOpen ? "nx-filters-open" : ""
          }`}
        >
          <div className="nx-filter-heading">
            <h2>Refine</h2>

            <button type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <label className="nx-filter-label" htmlFor="category-search">
            Search products
          </label>

          <input
            id="category-search"
            className="nx-filter-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="What are you looking for?"
          />

          <div className="nx-filter-group">
            <h3>Categories</h3>

            {categories.map((category) => (
              <Link
                key={category}
                to={`/categories/${slugify(category)}`}
                className={`nx-category-filter-link ${
                  category === selectedCategory ? "active" : ""
                }`}
              >
                <span>{category}</span>
                <span>
                  <IoIosArrowForward />
                </span>
              </Link>
            ))}
          </div>

          <div className="nx-filter-group">
            <h3>Price range (&#8358;)</h3>

            <div className="nx-range">
              <div className="nx-range-track">
                <div
                  className="nx-range-fill"
                  style={{
                    left: `${lowPercent}%`,
                    right: `${100 - highPercent}%`,
                  }}
                />
              </div>

              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={RANGE_STEP}
                value={lowValue}
                onChange={handleLowSlider}
                aria-label="Minimum price"
              />

              <input
                type="range"
                min={priceBounds.min}
                max={priceBounds.max}
                step={RANGE_STEP}
                value={highValue}
                onChange={handleHighSlider}
                aria-label="Maximum price"
              />
            </div>

            <div className="nx-range-values">
              <span>{formatMoney(lowValue)}</span>
              <span>{formatMoney(highValue)}</span>
            </div>

            <div className="nx-price-inputs">
              <label>
                <span>Minimum</span>

                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder={`₦${priceBounds.min}`}
                />
              </label>

              <label>
                <span>Maximum</span>

                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="No limit"
                />
              </label>
            </div>
          </div>

          {brandList.length > 0 && (
            <div className="nx-filter-group">
              <div className="nx-filter-subheading">
                <h3>Brand</h3>

                {selectedBrands.length > 0 && (
                  <button
                    type="button"
                    className="nx-rating-reset"
                    onClick={() => setSelectedBrands([])}
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="nx-brand-list">
                {brandList.map(([brand, count]) => (
                  <label className="nx-filter-check" key={brand}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                    />

                    <span>{brand}</span>
                    <small>({count})</small>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="nx-filter-group">
            <h3>Customer rating</h3>

            {[4, 3, 2, 1].map((rating) => (
              <label className="nx-filter-check" key={rating}>
                <input
                  type="radio"
                  name="minimum-rating"
                  checked={minimumRating === rating}
                  onChange={() => setMinimumRating(rating)}
                />

                <span>
                  {"★".repeat(rating)}
                  {"☆".repeat(5 - rating)}
                </span>

                <small>& up</small>
              </label>
            ))}

            <button
              className="nx-rating-reset"
              type="button"
              onClick={() => setMinimumRating(0)}
            >
              Any rating
            </button>
          </div>

          <div className="nx-filter-group">
            <label className="nx-filter-check">
              <input
                type="checkbox"
                checked={saleOnly}
                onChange={(event) => setSaleOnly(event.target.checked)}
              />

              <span>On sale only</span>
            </label>
          </div>

          <button
            className="nx-filter-done"
            type="button"
            onClick={() => setFiltersOpen(false)}
          >
            Show {filteredProducts.length} products
          </button>
        </aside>

        <section className="nx-category-results">
          <div className="nx-category-toolbar">
            <div>
              <p className="nx-results-count">
                Showing <strong>{filteredProducts.length}</strong> products
              </p>
            </div>

            <div className="nx-category-toolbar-actions">
              <button
                type="button"
                className="nx-mobile-filter-button"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                Filters
              </button>

              <div className="nx-sort-control" ref={sortDropdownRef}>
                <div className="nx-sort-dropdown">
                  <button
                    type="button"
                    className={`nx-sort-trigger ${
                      sortOpen ? "is-open" : ""
                    }`}
                    aria-haspopup="listbox"
                    aria-expanded={sortOpen}
                    onClick={() => setSortOpen((open) => !open)}
                  >
                    <span className="nx-sort-label">Sort by</span>

                    <span>{selectedSort.label}</span>

                    <motion.span
                      className="nx-sort-chevron"
                      animate={{ rotate: sortOpen ? 180 : 0 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                    >
                      <ChevronDown size={17} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {sortOpen && (
                      <motion.div
                        className="nx-sort-menu"
                        role="listbox"
                        aria-label="Sort products"
                        initial={{ opacity: 0, y: -9, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {sortOptions.map((option, index) => (
                          <motion.button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={sortBy === option.value}
                            className={`nx-sort-option ${
                              sortBy === option.value ? "is-selected" : ""
                            }`}
                            initial={{ opacity: 0, x: -14 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                              duration: 0.2,
                              delay: index * 0.035,
                              ease: "easeOut",
                            }}
                            onClick={() => {
                              setSortBy(option.value);
                              setSortOpen(false);
                            }}
                          >
                            <span>{option.label}</span>

                            {sortBy === option.value && <Check size={16} />}
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="nx-category-product-grid">
              {filteredProducts.map((product) => {
                const discount = discountPercent(product);
                const wishlisted = isWishlisted(product.id);

                return (
                  <article
                    className="nx-category-product"
                    key={product.id}
                  >
                    <Link
                      to={`/product/${product.id}`}
                      state={{ product }}
                      className="nx-category-product-link"
                    >
                      <div className="nx-category-product-image">
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                        />

                        {discount > 0 && (
                          <span className="nx-category-discount">
                            {discount}% OFF
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="nx-category-product-details">
                      <h3 className="nx-category-product-name">
                        <Link
                          to={`/product/${product.id}`}
                          state={{ product }}
                        >
                          {product.name}
                        </Link>
                      </h3>

                      <p className="nx-category-product-description">
                        {product.description}
                      </p>

                      {product.vendor || product.brand ? (
                        <Link
                          to={`/vendor/${slugify(
                            product.vendor || product.brand
                          )}`}
                          className="nx-category-product-vendor"
                          aria-label={`Visit ${
                            product.vendor || product.brand
                          } store`}
                        >
                          {product.vendor || product.brand}
                        </Link>
                      ) : (
                        <span className="nx-category-product-vendor">
                          NEX-IV
                        </span>
                      )}

                      {product.rating != null && (
                        <div className="nx-category-product-rating">
                          <FaRegStar />
                          <span>{Number(product.rating).toFixed(1)}</span>
                        </div>
                      )}

                      <div className="nx-category-product-bottom">
                        <div className="nx-category-price-group">
                          <strong>{formatMoney(product.price)}</strong>

                          {discount > 0 && (
                            <del>{formatMoney(product.originalPrice)}</del>
                          )}
                        </div>

                        <div className="nx-category-product-actions">
                          <button
                            type="button"
                            className={`nx-category-wishlist ${
                              wishlisted ? "is-wishlisted" : ""
                            }`}
                            aria-label={
                              wishlisted
                                ? `Remove ${product.name} from wishlist`
                                : `Add ${product.name} to wishlist`
                            }
                            onClick={() => toggleWishlist(product)}
                          >
                            {wishlisted ? "♥" : "♡"}
                          </button>

                          <button
                            type="button"
                            className="nx-category-cart"
                            onClick={() => setQuickView(product)}
                            aria-label={`Choose options and add ${product.name} to cart`}
                          >
                            <FaCartPlus />
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="nx-category-empty">
              <span>
                <IoIosSearch />
              </span>

              <h2>No products found</h2>

              <button type="button" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>

      {quickView && (
        <QuickAddModal
          product={quickView}
          onClose={() => setQuickView(null)}
        />
      )}
    </main>
  );
}