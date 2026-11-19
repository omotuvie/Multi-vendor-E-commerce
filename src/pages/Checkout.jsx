import { useMemo, useState, useEffect } from "react";
import { Link,  useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaCheck,
  FaCreditCard,
  FaUniversity,
  FaMoneyBillWave,
  FaTruck,
  FaTag,
  FaStar,
  FaLock,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaMinus,
  FaPlus,
  FaTrash,
  FaLeaf,
  FaHeadset,
  FaTimes,
} from "react-icons/fa";
import {
  useShop,
  formatMoney,
  FREE_SHIPPING_MINIMUM,
} from "../context/ShopContext";
import "../styles/Checkout.css";

const SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "3–7 business days",
    price: 2000,
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "1–3 business days",
    price: 5000,
  },
];

const PAYMENT_OPTIONS = [
  {
    id: "card",
    name: "Card Payment",
    description: "Credit/Debit Card",
    Icon: FaCreditCard,
  },
  {
    id: "transfer",
    name: "Bank Transfer",
    description: "Direct Bank Transfer",
    Icon: FaUniversity,
  },
  {
    id: "delivery",
    name: "Pay on Delivery",
    description: "Cash at Delivery",
    Icon: FaMoneyBillWave,
  },
];

const COUPONS = {
  NEXIV10: { type: "percent", value: 10, minimum: 10000 },
  WELCOME500: { type: "fixed", value: 500, minimum: 0 },
};

const DEMO_REWARD_BALANCE = 1250;
const POINTS_PER_REDEMPTION = 100;
const REWARD_VALUE = 1000;
const MAX_REWARD_DISCOUNT = 5000;

function money(value) {
  return formatMoney(Math.max(0, Math.round(value)));
}

function readSavedCards() {
  try {
    const cards = JSON.parse(
      localStorage.getItem("nexivPaymentMethods") || "[]"
    );

    return Array.isArray(cards) ? cards : [];
  } catch {
    return [];
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const {
    cartItems = [],
    activeItems = [],
    selectedItems = [],
    changeQuantity,
    removeFromCart,
  } = useShop();

  const [savedCards, setSavedCards] = useState(readSavedCards);
  const [selectedCard, setSelectedCard] = useState("");
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    nameOnCard: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
  });

  const [cardError, setCardError] = useState("");

  useEffect(() => {
    setSavedCards(readSavedCards());
  }, []);

  const checkoutItems = useMemo(() => {
    if (selectedItems.length > 0) return selectedItems;
    if (activeItems.length > 0) return activeItems;

    return cartItems.filter(
      (item) => item && !item.isOutOfStock
    );
  }, [cartItems, activeItems, selectedItems]);

  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [shipping, setShipping] = useState("standard");
  const [payment, setPayment] = useState("card");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [rewardInput, setRewardInput] = useState("");
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [rewardMessage, setRewardMessage] = useState("");
  const [editingAddress, setEditingAddress] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const subtotal = checkoutItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const shippingOption = SHIPPING_OPTIONS.find(
    (option) => option.id === shipping
  );

  const shippingCost =
    shipping === "standard" && subtotal >= FREE_SHIPPING_MINIMUM
      ? 0
      : shippingOption?.price ?? 2000;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (subtotal < appliedCoupon.minimum) return 0;

    const amount =
      appliedCoupon.type === "percent"
        ? subtotal * (appliedCoupon.value / 100)
        : appliedCoupon.value;

    return Math.min(Math.round(amount), subtotal);
  }, [appliedCoupon, subtotal]);

  const rewardDiscount = Math.min(
    Math.floor(redeemedPoints / POINTS_PER_REDEMPTION) *
      REWARD_VALUE,
    MAX_REWARD_DISCOUNT,
    Math.max(0, subtotal - couponDiscount)
  );

  const total = Math.max(
    0,
    subtotal - couponDiscount - rewardDiscount + shippingCost
  );

  const totalSavings = couponDiscount + rewardDiscount;

  function updateCustomer(event) {
    const { name, value } = event.target;

    setCustomer((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    const coupon = COUPONS[code];

    if (!code) {
      setCouponMessage("Enter a coupon code first.");
      return;
    }

    if (!coupon) {
      setAppliedCoupon(null);
      setCouponMessage("That coupon code isn't valid.");
      return;
    }

    if (subtotal < coupon.minimum) {
      setAppliedCoupon(null);
      setCouponMessage(
        `Your order must be at least ${money(coupon.minimum)} to use this code.`
      );
      return;
    }

    setAppliedCoupon({ ...coupon, code });
    setCouponMessage(`${code} applied successfully!`);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage("");
  }

  function applyRewards() {
    const requested = Number(rewardInput);

    if (!Number.isFinite(requested) || requested < 0) {
      setRewardMessage("Enter a valid number of points.");
      return;
    }

    const wholePoints = Math.floor(requested);

    const usablePoints = Math.min(
      wholePoints,
      DEMO_REWARD_BALANCE,
      Math.floor(MAX_REWARD_DISCOUNT / REWARD_VALUE) *
        POINTS_PER_REDEMPTION
    );

    const roundedPoints =
      Math.floor(usablePoints / POINTS_PER_REDEMPTION) *
      POINTS_PER_REDEMPTION;

    if (roundedPoints === 0) {
      setRedeemedPoints(0);
      setRewardMessage("Redeem at least 100 points.");
      return;
    }

    setRedeemedPoints(roundedPoints);
    setRewardInput(String(roundedPoints));
    setRewardMessage(
      `${roundedPoints} points applied successfully.`
    );
  }

  function clearRewards() {
    setRedeemedPoints(0);
    setRewardInput("");
    setRewardMessage("");
  }

  function handleQuantity(item, amount) {
    if (typeof changeQuantity !== "function") return;

    const currentQuantity = Number(item.quantity || 1);
    const nextQuantity = currentQuantity + amount;

    if (nextQuantity < 1) return;

    changeQuantity(item.id, nextQuantity);
  }

  function handleRemove(item) {
    if (typeof removeFromCart === "function") {
      removeFromCart(item.id);
    }
  }

  function handlePlaceOrder(event) {
    event.preventDefault();

    if (!checkoutItems.length) {
      window.alert(
        "Your cart is empty. Add products before checking out."
      );
      return;
    }

    if (
      !customer.firstName.trim() ||
      !customer.lastName.trim() ||
      !customer.email.trim() ||
      !customer.phone.trim() ||
      !customer.address.trim()
    ) {
      window.alert(
        "Please complete all your customer and delivery details."
      );
      return;
    }

    if (payment === "card") {
      const cards = readSavedCards();

      setSavedCards(cards);
      setSelectedCard("");
      setCardError("");
      setShowPaymentScreen(true);
      return;
    }

    if (payment === "transfer") {
  navigate("/checkout/bank-transfer", {
    state: { amount: total, customer, shipping },
  });
  return;
}

    if (payment === "delivery") {
      window.alert(
        "Pay on Delivery selected. "
      );
      return;
    }
  }

  function updateCardDetails(event) {
    const { name, value } = event.target;

    setCardDetails((current) => ({
      ...current,
      [name]: value,
    }));

    setCardError("");
  }

  function handleContinueWithSavedCard() {
    const card = savedCards.find(
      (item) => item.id === selectedCard
    );

    if (!card) {
      setCardError("Please select a saved card.");
      return;
    }
    window.alert(
      `Card ending in ${card.lastFour} selected. `
    );
  }

  function handleNewCardSubmit(event) {
    event.preventDefault();

    const { nameOnCard, cardNumber, expiryDate, cvv } = cardDetails;

    const cleanNumber = cardNumber.replace(/\s/g, "");

    if (!nameOnCard.trim()) {
      setCardError("Enter the name on your card.");
      return;
    }

    if (!/^\d{16}$/.test(cleanNumber)) {
      setCardError("Enter a valid 16-digit card number.");
      return;
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
      setCardError("Enter a valid expiry date in MM/YY format.");
      return;
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      setCardError("Enter a valid CVV.");
      return;
    }
  }

  function renderPaymentScreen() {
    return (
      <section className="nx-payment-screen">
        <button
          type="button"
          className="nx-payment-back"
          onClick={() => setShowPaymentScreen(false)}
        >
          <FaArrowRight className="nx-payment-back-icon" />
          Back to checkout
        </button>

        <div className="nx-payment-screen-heading">
          <span className="nx-checkout-eyebrow">
            NEX-IV SECURE CHECKOUT
          </span>
          <h1>Card Payment</h1>
          <p>
            {savedCards.length > 0
              ? "Choose a saved card to continue with your payment."
              : "Enter your card details to continue with your payment."}
          </p>
        </div>

        <div className="nx-payment-screen-content">
          {savedCards.length > 0 ? (
            <>
              <div className="nx-payment-content-heading">
                <div>
                  <h2>Your saved cards</h2>
                  <p>Select the card you want to use.</p>
                </div>
                <FaShieldAlt />
              </div>

              <div className="nx-payment-card-list">
                {savedCards.map((card) => (
                  <label
                    key={card.id}
                    className={`nx-payment-saved-card ${
                      selectedCard === card.id
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="savedCard"
                      value={card.id}
                      checked={selectedCard === card.id}
                      onChange={() => {
                        setSelectedCard(card.id);
                        setCardError("");
                      }}
                    />

                    <span className="nx-payment-card-radio" />

                    <FaCreditCard className="nx-payment-card-icon" />

                    <span className="nx-payment-card-details">
                      <strong>
                        •••• •••• •••• {card.lastFour}
                      </strong>
                      <small>{card.nameOnCard}</small>
                      <small>Expires {card.expiryDate}</small>
                    </span>

                    {selectedCard === card.id && (
                      <FaCheck className="nx-payment-card-check" />
                    )}
                  </label>
                ))}
              </div>

              {cardError && (
                <p className="nx-payment-error">{cardError}</p>
              )}

              <button
                type="button"
                className="nx-payment-continue"
                disabled={!selectedCard}
                onClick={handleContinueWithSavedCard}
              >
                Continue to payment <FaArrowRight />
              </button>
            </>
          ) : (
            <form
              className="nx-payment-new-card"
              onSubmit={handleNewCardSubmit}
            >
              <div className="nx-payment-content-heading">
                <div>
                  <h2>Card details</h2>
                  <p>
                    No saved cards found. Enter your card details below.
                  </p>
                </div>
                <FaLock />
              </div>

              <label>
                Name on card
                <input
                  type="text"
                  name="nameOnCard"
                  value={cardDetails.nameOnCard}
                  onChange={updateCardDetails}
                  placeholder="Name as shown on card"
                  autoComplete="cc-name"
                  required
                />
              </label>

              <label>
                Card number
                <input
                  type="text"
                  name="cardNumber"
                  value={cardDetails.cardNumber}
                  onChange={(event) => {
                    const value = event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 16)
                      .replace(/(\d{4})(?=\d)/g, "$1 ");

                    setCardDetails((current) => ({
                      ...current,
                      cardNumber: value,
                    }));

                    setCardError("");
                  }}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  required
                />
              </label>

              <div className="nx-payment-card-fields">
                <label>
                  Expiry date
                  <input
                    type="text"
                    name="expiryDate"
                    value={cardDetails.expiryDate}
                    onChange={(event) => {
                      let value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);

                      if (value.length > 2) {
                        value =
                          value.slice(0, 2) +
                          "/" +
                          value.slice(2);
                      }

                      setCardDetails((current) => ({
                        ...current,
                        expiryDate: value,
                      }));

                      setCardError("");
                    }}
                    placeholder="MM/YY"
                    autoComplete="cc-exp"
                    maxLength={5}
                    required
                  />
                </label>

                <label>
                  CVV
                  <input
                    type="password"
                    name="cvv"
                    value={cardDetails.cvv}
                    onChange={(event) => {
                      setCardDetails((current) => ({
                        ...current,
                        cvv: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4),
                      }));

                      setCardError("");
                    }}
                    placeholder="123"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    required
                  />
                </label>
              </div>

              {cardError && (
                <p className="nx-payment-error">{cardError}</p>
              )}

              <button
                type="submit"
                className="nx-payment-continue"
              >
                Continue to payment <FaArrowRight />
              </button>

              <p className="nx-payment-security-note">
                <FaShieldAlt />
                Your card details should be processed securely by a
                payment gateway.
              </p>
            </form>
          )}
        </div>

        <div className="nx-payment-order-total">
          <span>Order total</span>
          <strong>{money(total)}</strong>
        </div>
      </section>
    );
  }

  return (
    <main className="nx-checkout">
      <div className="nx-checkout-container">
        {showPaymentScreen ? (
          renderPaymentScreen()
        ) : (
          <>
            <div className="nx-checkout-heading">
              <div>
                <p className="nx-checkout-eyebrow">
                  NEX-IV MARKETPLACE
                </p>
                <h1>Checkout</h1>
              </div>

              <div className="nx-checkout-secure">
                <FaLock />
                <span>Secure & Encrypted</span>
              </div>
            </div>

            {!checkoutItems.length ? (
              <section className="nx-checkout-empty">
                <div className="nx-checkout-empty-icon">
                  <FaTruck />
                </div>
                <h2>Your checkout is waiting</h2>
                <Link
                  to="/home"
                  className="nx-checkout-primary-link"
                >
                  Explore products <FaArrowRight />
                </Link>
              </section>
            ) : (
              <form
                className="nx-checkout-layout"
                onSubmit={handlePlaceOrder}
              >
                <div className="nx-checkout-main">
                  <section className="nx-checkout-section">
                    <div className="nx-checkout-section-heading">
                      <span className="nx-checkout-step">1</span>
                      <div>
                        <h2>Customer Information</h2>
                        <p>
                          We'll use this information to contact you
                          and deliver your order.
                        </p>
                      </div>
                    </div>

                    <div className="nx-checkout-fields">
                      <label className="nx-checkout-field">
                        <span>First Name <b>*</b></span>
                        <input
                          name="firstName"
                          value={customer.firstName}
                          onChange={updateCustomer}
                          placeholder="Enter first name"
                          autoComplete="given-name"
                          required
                        />
                      </label>

                      <label className="nx-checkout-field">
                        <span>Last Name <b>*</b></span>
                        <input
                          name="lastName"
                          value={customer.lastName}
                          onChange={updateCustomer}
                          placeholder="Enter last name"
                          autoComplete="family-name"
                          required
                        />
                      </label>

                      <label className="nx-checkout-field">
                        <span>Email Address <b>*</b></span>
                        <input
                          name="email"
                          type="email"
                          value={customer.email}
                          onChange={updateCustomer}
                          placeholder="you@example.com"
                          autoComplete="email"
                          required
                        />
                      </label>

                      <label className="nx-checkout-field">
                        <span>Phone Number <b>*</b></span>
                        <input
                          name="phone"
                          type="tel"
                          value={customer.phone}
                          onChange={updateCustomer}
                          placeholder="+234 801 234 5678"
                          autoComplete="tel"
                          required
                        />
                      </label>

                      <div className="nx-checkout-address">
                        <div className="nx-checkout-address-title">
                          <FaMapMarkerAlt />
                          <span>Delivery Address <b>*</b></span>

                          {!editingAddress && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingAddress(true)
                              }
                            >
                              Edit
                            </button>
                          )}
                        </div>

                        {editingAddress ? (
                          <>
                            <textarea
                              name="address"
                              value={customer.address}
                              onChange={updateCustomer}
                              placeholder="Street, area, city, state and postal code"
                              autoComplete="street-address"
                              required
                              rows={3}
                            />

                            <button
                              type="button"
                              className="nx-checkout-address-save"
                              onClick={() => {
                                if (customer.address.trim()) {
                                  setEditingAddress(false);
                                }
                              }}
                            >
                              Save address
                            </button>
                          </>
                        ) : (
                          <p>{customer.address}</p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="nx-checkout-section">
                    <div className="nx-checkout-section-heading">
                      <span className="nx-checkout-step">2</span>
                      <div>
                        <h2>Shipping Options</h2>
                      </div>
                    </div>

                    <div className="nx-checkout-shipping-options">
                      {SHIPPING_OPTIONS.map((option) => {
                        const isFree =
                          option.id === "standard" &&
                          subtotal >= FREE_SHIPPING_MINIMUM;

                        const selected = shipping === option.id;

                        return (
                          <label
                            key={option.id}
                            className={`nx-checkout-shipping-option ${
                              selected ? "is-selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="shipping"
                              value={option.id}
                              checked={selected}
                              onChange={() =>
                                setShipping(option.id)
                              }
                            />

                            <span className="nx-checkout-radio" />
                            <FaTruck className="nx-checkout-shipping-icon" />

                            <span className="nx-checkout-shipping-info">
                              <strong>{option.name}</strong>
                              <small>{option.description}</small>

                              {isFree && (
                                <small className="nx-checkout-free-note">
                                  Free for orders above{" "}
                                  {money(FREE_SHIPPING_MINIMUM)}
                                </small>
                              )}
                            </span>

                            <span className="nx-checkout-shipping-price">
                              <strong>
                                {isFree ? "FREE" : money(option.price)}
                              </strong>

                              {option.id === "express" && (
                                <small>Faster delivery</small>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <section className="nx-checkout-section">
                    <div className="nx-checkout-section-heading">
                      <span className="nx-checkout-step">3</span>
                      <div>
                        <h2>Payment Method</h2>
                        <p>Select your preferred payment method.</p>
                      </div>
                    </div>

                    <div className="nx-checkout-payment-options">
                      {PAYMENT_OPTIONS.map(
                        ({ id, name, description, Icon }) => (
                          <label
                            key={id}
                            className={`nx-checkout-payment-option ${
                              payment === id ? "is-selected" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={id}
                              checked={payment === id}
                              onChange={() => setPayment(id)}
                            />

                            <span className="nx-checkout-payment-radio" />
                            <Icon />

                            <span>
                              <strong>{name}</strong>
                              <small>{description}</small>
                            </span>
                          </label>
                        )
                      )}
                    </div>

                    <p className="nx-checkout-payment-note">
                      <FaShieldAlt />
                      Your payment details are protected.
                    </p>
                  </section>
                </div>

                <aside className="nx-checkout-summary">
                  <div className="nx-checkout-summary-heading">
                    <h2>Order Summary</h2>
                    <span>
                      {checkoutItems.reduce(
                        (sum, item) =>
                          sum + Number(item.quantity || 1),
                        0
                      )}{" "}
                      items
                    </span>
                  </div>

                  <div className="nx-checkout-products">
                    {checkoutItems.map((item) => (
                      <article
                        className="nx-checkout-product"
                        key={`${item.id}-${item.variant || ""}`}
                      >
                        <div className="nx-checkout-product-image">
                          {item.image ? (
                            <img src={item.image} alt={item.name} />
                          ) : (
                            <FaTruck />
                          )}
                        </div>

                        <div className="nx-checkout-product-details">
                          <h3>{item.name}</h3>
                          <p>
                            {item.category || "Marketplace"}{" "}
                            {item.vendor ? `· ${item.vendor}` : ""}
                          </p>

                          {item.variant && (
                            <small>{item.variant}</small>
                          )}

                          <div className="nx-checkout-product-bottom">
                            <div className="nx-checkout-quantity">
                              <button
                                type="button"
                                aria-label={`Decrease ${item.name} quantity`}
                                onClick={() =>
                                  handleQuantity(item, -1)
                                }
                                disabled={
                                  Number(item.quantity || 1) <= 1
                                }
                              >
                                <FaMinus />
                              </button>

                              <span>{item.quantity || 1}</span>

                              <button
                                type="button"
                                aria-label={`Increase ${item.name} quantity`}
                                onClick={() =>
                                  handleQuantity(item, 1)
                                }
                              >
                                <FaPlus />
                              </button>
                            </div>

                            <button
                              type="button"
                              className="nx-checkout-delete"
                              aria-label={`Remove ${item.name}`}
                              onClick={() => handleRemove(item)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        <strong className="nx-checkout-product-price">
                          {money(
                            Number(item.price || 0) *
                              Number(item.quantity || 1)
                          )}
                        </strong>
                      </article>
                    ))}
                  </div>

                  <div className="nx-checkout-totals">
                    <div>
                      <span>Subtotal</span>
                      <strong>{money(subtotal)}</strong>
                    </div>

                    {couponDiscount > 0 && (
                      <div className="nx-checkout-discount">
                        <span>
                          <FaTag /> Coupon Discount
                        </span>
                        <strong>−{money(couponDiscount)}</strong>
                      </div>
                    )}

                    {rewardDiscount > 0 && (
                      <div className="nx-checkout-discount">
                        <span>
                          <FaStar /> Rewards ({redeemedPoints} pts)
                        </span>
                        <strong>−{money(rewardDiscount)}</strong>
                      </div>
                    )}

                    <div>
                      <span>
                        Shipping ({shippingOption?.name})
                      </span>
                      <strong>
                        {shippingCost === 0
                          ? "FREE"
                          : money(shippingCost)}
                      </strong>
                    </div>

                    <div>
                      <span>VAT</span>
                      <strong>{money(0)}</strong>
                    </div>

                    <div className="nx-checkout-coupon">
                      <label htmlFor="nx-checkout-coupon">
                        Coupon code
                      </label>

                      <div className="nx-checkout-coupon-control">
                        <input
                          id="nx-checkout-coupon"
                          value={couponInput}
                          onChange={(event) => {
                            setCouponInput(event.target.value);

                            if (appliedCoupon) removeCoupon();
                            else setCouponMessage("");
                          }}
                          placeholder="Enter coupon code"
                          disabled={Boolean(appliedCoupon)}
                        />

                        {appliedCoupon ? (
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="nx-checkout-remove-coupon"
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={applyCoupon}
                          >
                            Apply
                          </button>
                        )}
                      </div>

                      {couponMessage && (
                        <p
                          className={`nx-checkout-feedback ${
                            appliedCoupon
                              ? "is-success"
                              : "is-error"
                          }`}
                        >
                          {appliedCoupon && <FaCheck />}
                          {couponMessage}
                        </p>
                      )}
                    </div>

                    <div className="nx-checkout-rewards">
                      <label htmlFor="nx-checkout-points">
                        Redeem points
                      </label>

                      <div className="nx-checkout-points-control">
                        <input
                          id="nx-checkout-points"
                          type="number"
                          min="0"
                          max={DEMO_REWARD_BALANCE}
                          step={POINTS_PER_REDEMPTION}
                          value={rewardInput}
                          onChange={(event) => {
                            setRewardInput(event.target.value);
                            setRewardMessage("");
                          }}
                          placeholder="Enter points"
                        />

                        {redeemedPoints > 0 ? (
                          <button
                            type="button"
                            onClick={clearRewards}
                          >
                            Remove
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={applyRewards}
                          >
                            Apply
                          </button>
                        )}
                      </div>

                      {rewardMessage && (
                        <p
                          className={`nx-checkout-feedback ${
                            redeemedPoints > 0
                              ? "is-success"
                              : "is-error"
                          }`}
                        >
                          {rewardMessage}
                        </p>
                      )}
                    </div>

                    <div className="nx-checkout-grand-total">
                      <span>Total</span>
                      <strong>{money(total)}</strong>
                    </div>
                  </div>

                  {totalSavings > 0 && (
                    <div className="nx-checkout-savings-banner">
                      <FaLeaf />
                      <div>
                        <strong>
                          You're saving {money(totalSavings)}
                        </strong>
                        <span>
                          With your coupon and reward points!
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    className="nx-checkout-place-order"
                    type="submit"
                    disabled={
                      placingOrder || !checkoutItems.length
                    }
                  >
                    {placingOrder
                      ? "Preparing order..."
                      : "Place Order"}
                    <FaArrowRight />
                  </button>

                  <p className="nx-checkout-terms">
                    By placing your order, you agree to our{" "}
                    <Link to="/terms">Terms & Conditions</Link> and{" "}
                    <Link to="/privacy">Privacy Policy</Link>.
                  </p>

                  <div className="nx-checkout-trust">
                    <div>
                      <FaShieldAlt />
                      <span>
                        <strong>Secure Payments</strong>
                        <small>Your data is safe</small>
                      </span>
                    </div>

                    <div>
                      <FaTruck />
                      <span>
                        <strong>Fast Delivery</strong>
                        <small>Across Nigeria</small>
                      </span>
                    </div>

                    <div>
                      <FaHeadset />
                      <span>
                        <strong>Support</strong>
                        <small>We're here to help</small>
                      </span>
                    </div>
                  </div>
                </aside>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}
