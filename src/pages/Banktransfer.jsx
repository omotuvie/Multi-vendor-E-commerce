import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaChevronRight,
  FaClock,
  FaCopy,
  FaCheck,
  FaLandmark,
} from "react-icons/fa";
import { useShop, formatMoney } from "../context/ShopContext";
import "../styles/BankTransfer.css";


const BANK_DETAILS = {
  bankName: "Your Bank Name",
  accountName: "Nex-IV Marketplace Ltd",
  accountNumber: "0123456789",
};

const SESSION_KEY = "nexivBankTransfer";
const WINDOW_MINUTES = 30;

function makeReference() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `NXV-${code}`;
}

function loadSession(amount) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY));

    if (saved && saved.amount === amount && saved.expiresAt > Date.now()) {
      return saved;
    }
  } catch {
  }

  return createSession(amount);
}

function createSession(amount) {
  const fresh = {
    reference: makeReference(),
    amount,
    expiresAt: Date.now() + WINDOW_MINUTES * 60 * 1000,
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
  } catch {
  }

  return fresh;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function BankTransfer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { finalPrice = 0 } = useShop();

  const amount = Number(location.state?.amount ?? finalPrice) || 0;

  const [session, setSession] = useState(() => loadSession(amount));
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const remaining = session.expiresAt - now;
  const expired = remaining <= 0;

  useEffect(() => {
    if (confirmed) return undefined;

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [confirmed]);

  const copy = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      setCopied("");
    }
  };

  const newDetails = () => {
    setSession(createSession(amount));
    setNow(Date.now());
  };

  const handleConfirm = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setConfirmed(true);
  };

  if (amount <= 0 && !confirmed) {
    return (
      <main className="nx-bt-page">
        <div className="nx-bt-card nx-bt-empty">
          <p>Your cart is empty</p>
          <Link to="/home" className="nx-bt-primary">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  if (confirmed) {
    return (
      <main className="nx-bt-page">
        <div className="nx-bt-card nx-bt-success">
          <FaCheckCircle className="nx-bt-success-icon" />
          <h1>Thanks! We&apos;re waiting for your transfer</h1>
          <p>
            Once your payment of <strong>{formatMoney(amount)}</strong> reaches
            our account we&apos;ll confirm your order. This usually takes a few
            minutes but can take longer.
          </p>

          <div className="nx-bt-actions">
            <button
              type="button"
              className="nx-bt-primary"
              onClick={() => navigate("/account/orders")}
            >
              View my orders
            </button>

            <Link to="/home" className="nx-bt-secondary">
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const rows = [
    ["Bank", BANK_DETAILS.bankName, "bank"],
    ["Account name", BANK_DETAILS.accountName, "name"],
    ["Account number", BANK_DETAILS.accountNumber, "number"],
    ["Amount", formatMoney(amount), "amount", String(amount)],
    ["Payment reference", session.reference, "reference"],
  ];

  return (
    <main className="nx-bt-page">
      <nav className="nx-bt-breadcrumb" aria-label="Breadcrumb">
        <Link to="/cart">Cart</Link>
        <FaChevronRight />
        <Link to="/checkout">Checkout</Link>
        <FaChevronRight />
        <span>Bank transfer</span>
      </nav>

      <div className="nx-bt-card">
        <header className="nx-bt-head">
          <span className="nx-bt-icon">
            <FaLandmark />
          </span>

          <div>
            <h1>Pay by bank transfer</h1>
            <p>
              Transfer the exact amount below from your banking app or USSD.
            </p>
          </div>
        </header>

        <div className={`nx-bt-timer ${expired ? "is-expired" : ""}`}>
          <FaClock />

          {expired ? (
            <span>These details have expired.</span>
          ) : (
            <span>
              Complete your transfer within{" "}
              <strong>{formatCountdown(remaining)}</strong>
            </span>
          )}
        </div>

        <dl className="nx-bt-details">
          {rows.map(([label, value, key, copyValue]) => (
            <div className="nx-bt-row" key={key}>
              <dt>{label}</dt>

              <dd>
                <strong className={key === "amount" ? "is-amount" : ""}>
                  {value}
                </strong>

                {["number", "amount", "reference"].includes(key) && (
                  <button
                    type="button"
                    className={`nx-bt-copy ${copied === key ? "is-copied" : ""}`}
                    onClick={() => copy(key, copyValue ?? value)}
                    aria-label={`Copy ${label.toLowerCase()}`}
                  >
                    {copied === key ? <FaCheck /> : <FaCopy />}
                    {copied === key ? "Copied" : "Copy"}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <ul className="nx-bt-notes">
          <li>Send the exact amount shown, no more and no less.</li>
          <li>
            Put <strong>{session.reference}</strong> in the transfer narration /
            remark so we can match your payment.
          </li>
          <li>Only click the button below after you have sent the money.</li>
        </ul>

        <div className="nx-bt-actions">
          {expired ? (
            <button type="button" className="nx-bt-primary" onClick={newDetails}>
              Get new payment details
            </button>
          ) : (
            <button
              type="button"
              className="nx-bt-primary"
              onClick={handleConfirm}
            >
              I&apos;ve sent the money
            </button>
          )}

          <button
            type="button"
            className="nx-bt-secondary"
            onClick={() => navigate("/checkout")}
          >
            Choose another payment method
          </button>
        </div>
      </div>
    </main>
  );
}