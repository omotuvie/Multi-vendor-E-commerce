import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "../styles/Auth.css";
import Logo from "../images/Logo.png";
import { IoIosArrowBack } from "react-icons/io";
import { FaTimes } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import {
  getAccounts,
  getCurrentUser,
  getSessions,
  removeSession,
  switchToAccount,
} from "../data/AccountSessions";

const COMMUNITY_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
];

function toHex(bytes) {
  return Array.from(bytes)
    .map((byteValue) => byteValue.toString(16).padStart(2, "0"))
    .join("");
}

function makeSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

async function hashSecret(secret, saltHex) {
  const encoder = new TextEncoder();
  const saltBytes = Uint8Array.from(saltHex.match(/.{2}/g), (pair) => parseInt(pair, 16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 150000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return toHex(new Uint8Array(bits));
}

function maskEmail(address) {
  const [name, domain] = address.split("@");
  if (name.length <= 4) return `${name.slice(0, 1)}***@${domain}`;
  return `${name.slice(0, 3)}***${name.slice(-2)}@${domain}`;
}


function AuthShell({ children }) {
  return (
    <main className="auth-page">
      <section className="auth-container">
        <img className="auth-logo" src={Logo} alt="Nex-IV Logo" />
        {children}
      </section>
    </main>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const switching = params.get("switch") === "1"; 

  const [mode, setMode] = useState("register");
  const [accounts, setAccounts] = useState(getAccounts);
  const [sessions, setSessions] = useState(getSessions);
  const [user, setUser] = useState(getCurrentUser);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [formDirection, setFormDirection] = useState("slide-in");

  
  const [view, setView] = useState(sessions.length > 0 ? "accounts" : "form");
  const [isWorking, setIsWorking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  const lockMessage = "Too many attempts. Wait 30 seconds and try again.";
  const errorMessage = "Something went wrong. Please try again.";

  useEffect(() => {
    const timer = setTimeout(() => setFormDirection(""), 350);
    return () => clearTimeout(timer);
  }, [formDirection]);

  useEffect(() => {
    if (switching) {
      setSessions(getSessions());
      setUser(getCurrentUser());
      setView(getSessions().length > 0 ? "accounts" : "form");
    }
  }, [switching]);

  function isLockedOut() {
    return Date.now() < lockedUntil;
  }

  function recordFailedAttempt() {
    const attempts = failedAttempts + 1;
    if (attempts >= 5) {
      setFailedAttempts(0);
      setLockedUntil(Date.now() + 30000);
    } else {
      setFailedAttempts(attempts);
    }
  }

  function saveAccounts(updatedAccounts) {
    setAccounts(updatedAccounts);
    localStorage.setItem("nexivAccounts", JSON.stringify(updatedAccounts));
  }

  function openAccount(account) {
    const signedInUser = switchToAccount(account.email);
    if (!signedInUser) {
      setMessage(errorMessage);
      return;
    }
    setUser(signedInUser);
    setSessions(getSessions());
    setMessage("");
    setPassword("");
    navigate("/home");
  }

  function pickSession(session) {
    if (user?.email === session.email) {
      navigate("/home");
      return;
    }
    const account = accounts.find((a) => a.email === session.email);
    if (account) openAccount(account);
  }

  function forgetSession(emailToRemove) {
    removeSession(emailToRemove);
    const remaining = getSessions();
    setSessions(remaining);
    if (remaining.length === 0) setView("form");
  }

  function useAnotherAccount(nextMode = "login") {
    changeMode(nextMode);
    setEmail("");
    setView("form");
  }

  async function handleRegister(event) {
    event.preventDefault();

    if (!username.trim() || !email.trim() || !password) {
      setMessage("Please complete all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    const existingAccount = accounts.some(
      (account) => account.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existingAccount) {
      setMessage("This email already has an account. Please sign in.");
      return;
    }

    setIsWorking(true);
    try {
      const passwordSalt = makeSalt();
      const newAccount = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        salt: passwordSalt,
        passwordHash: await hashSecret(password, passwordSalt),
      };
      saveAccounts([...accounts, newAccount]);
      openAccount(newAccount);
    } catch {
      setMessage(errorMessage);
    } finally {
      setIsWorking(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();

    if (isLockedOut()) {
      setMessage(lockMessage);
      return;
    }

    setIsWorking(true);
    try {
      const account = accounts.find((item) => item.email === email.trim().toLowerCase());
      const checkSalt = account && account.salt ? account.salt : makeSalt();
      const enteredHash = await hashSecret(password, checkSalt);

      if (!account || enteredHash !== account.passwordHash) {
        recordFailedAttempt();
        setMessage("Incorrect email or password.");
        return;
      }

      setFailedAttempts(0);
      openAccount(account);
    } catch {
      setMessage(errorMessage);
    } finally {
      setIsWorking(false);
    }
  }

  function handleSendResetCode(event) {
    event.preventDefault();

    if (isLockedOut()) {
      setMessage(lockMessage);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setMessage("Please enter a valid email address.");
      return;
    }
    setResetCode("");
    setMode("reset");
  }

  function handleResetPassword(event) {
    event.preventDefault();

    if (isLockedOut()) {
      setMessage(lockMessage);
      return;
    }
    if (!/^\d{6}$/.test(resetCode.trim())) {
      setMessage("Enter the 6-digit code we sent you.");
      return;
    }
    if (password.length < 8) {
      setMessage("Choose a new password with at least 8 characters.");
      return;
    }
  }

  function changeMode(nextMode) {
    if (nextMode === mode) return;
    setFormDirection(nextMode === "register" ? "slide-from-left" : "slide-from-right");
    setMode(nextMode);
    setMessage("");
    setPassword("");
    setResetCode("");
    setShowPassword(false);
  }


  if (view === "accounts" && sessions.length > 0) {
    return (
      <AuthShell>
        <div className="session-view">
          <h1>{switching ? "Switch account" : "Welcome back!"}</h1>
          <p className="session-sub">Choose an account to continue.</p>

          <ul className="session-list">
            {sessions.map((session) => {
              const isCurrent = user?.email === session.email;
              return (
                <li key={session.email} className={`session-row ${isCurrent ? "is-current" : ""}`}>
                  <button
                    type="button"
                    className="session-main"
                    onClick={() => pickSession(session)}
                    aria-label={`Continue as ${session.username}`}
                  >
                    <span className="session-avatar">{session.username.slice(0, 1).toUpperCase()}</span>
                    <span className="session-text">
                      <strong>{session.username}</strong>
                      <small>{maskEmail(session.email)}</small>
                    </span>
                    {isCurrent && <span className="session-badge">Signed in</span>}
                  </button>
                  <button
                    type="button"
                    className="session-remove"
                    onClick={() => forgetSession(session.email)}
                    aria-label={`Remove ${session.username} from this device`}
                    title="Remove from this device"
                  >
                    <FaTimes />
                  </button>
                </li>
              );
            })}
          </ul>

          <button type="button" className="continue-button" onClick={() => useAnotherAccount("login")}>
            Use another account
          </button>

          <button type="button" className="text-link" onClick={() => useAnotherAccount("register")}>
            Create a new account
          </button>

          {switching && (
            <button
              type="button"
              className="remove-link"
              onClick={() => {
                setParams({});
                navigate(-1);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </AuthShell>
    );
  }

  const isResetMode = mode === "forgot" || mode === "reset";

  return (
    <AuthShell>
      {sessions.length > 0 && (
        <button
          type="button"
          className="go-back"
          onClick={() => {
            setView("accounts");
            setMessage("");
          }}
        >
          <IoIosArrowBack /> Saved accounts
        </button>
      )}

      <header className="auth-heading">
        <h1>
          {mode === "register" && "Create your account"}
          {mode === "login" && "Welcome back"}
          {mode === "forgot" && "Reset your password"}
          {mode === "reset" && "Check your email"}
        </h1>
        <p>
          {mode === "register" && "Join Nex-IV and discover something you love."}
          {mode === "login" && "Sign in to continue to your account."}
          {mode === "forgot" && "Enter your email and we'll send you a code to reset it."}
          {mode === "reset" &&
            `Enter the 6-digit code we sent to ${email.trim()} and choose a new password.`}
        </p>
      </header>

      {!isResetMode && (
        <div className={`auth-tabs ${mode === "register" ? "register-active" : "login-active"}`}>
          <div className="auth-tab-indicator" />
          <button type="button" className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>
            Create account
          </button>
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>
            Sign in
          </button>
        </div>
      )}

      <form
        className={`auth-form ${formDirection}`}
        onSubmit={
          mode === "register"
            ? handleRegister
            : mode === "login"
            ? handleLogin
            : mode === "forgot"
            ? handleSendResetCode
            : handleResetPassword
        }
      >
        {mode === "register" && (
          <>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </>
        )}

        {mode !== "reset" && (
          <>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </>
        )}

        {mode === "reset" && (
          <>
            <label htmlFor="reset-code">Code</label>
            <input
              id="reset-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="6-digit code"
              value={resetCode}
              onChange={(event) => setResetCode(event.target.value.replace(/\D/g, ""))}
            />
          </>
        )}

        {mode !== "forgot" && (
          <>
            <label htmlFor="password">{mode === "reset" ? "New password" : "Password"}</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "reset" ? "Create a new password" : "Enter your password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </>
        )}

        {mode === "login" && (
          <button type="button" className="forgot-link" onClick={() => changeMode("forgot")}>
            Forgot password?
          </button>
        )}

        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}

        <hr className="auth-divider" />

        <button className="continue-button" type="submit" disabled={isWorking}>
          {mode === "register" && "Create account"}
          {mode === "login" && "Sign in"}
          {mode === "forgot" && "Send code"}
          {mode === "reset" && "Reset password"}
        </button>

        {!isResetMode && (
          <button
            type="button"
            className="google-button"
            onClick={() => setMessage("Google sign-in is coming soon.")}
          >
            <FcGoogle /> Continue with Google
          </button>
        )}
      </form>

      {mode === "reset" && (
        <button type="button" className="text-link" onClick={() => changeMode("forgot")}>
          Use a different email
        </button>
      )}

      {isResetMode && (
        <button type="button" className="text-link" onClick={() => changeMode("login")}>
          Back to sign in
        </button>
      )}

      {mode === "register" && (
        <p className="switch-copy">
          Already have an account? <button type="button" onClick={() => changeMode("login")}>Sign in</button>
        </p>
      )}

      {mode === "login" && (
        <p className="switch-copy">
          New to Nex-IV? <button type="button" onClick={() => changeMode("register")}>Create an account</button>
        </p>
      )}

      <p className="legal-copy">
        By continuing, you agree to our <span>Privacy Policy</span> and <span>Terms & Conditions</span>.
      </p>

      <footer className="auth-footer">
        <span>&copy; 2026 NEX-IV</span>
        <span>Your marketplace, your way.</span>
      </footer>
    </AuthShell>
  );
}