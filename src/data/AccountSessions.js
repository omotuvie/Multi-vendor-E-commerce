const ACCOUNTS_KEY = "nexivAccounts";
const SESSIONS_KEY = "nexivSessions";
const CURRENT_KEY = "nexivCurrentUser";
const LAST_KEY = "nexivLastEmail";

function read(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function getAccounts() {
  return read(ACCOUNTS_KEY, []);
}

export function getCurrentUser() {
  return read(CURRENT_KEY, null);
}

export function getSessions() {
  const accounts = getAccounts();
  return read(SESSIONS_KEY, [])
    .filter((s) => accounts.some((a) => a.email === s.email))
    .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
}

export function rememberSession(account) {
  const others = read(SESSIONS_KEY, []).filter((s) => s.email !== account.email);
  localStorage.setItem(
    SESSIONS_KEY,
    JSON.stringify([...others, { email: account.email, username: account.username, lastUsed: Date.now() }])
  );
}

export function removeSession(email) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(read(SESSIONS_KEY, []).filter((s) => s.email !== email)));
  if (localStorage.getItem(LAST_KEY) === email) localStorage.removeItem(LAST_KEY);
}

export function switchToAccount(email) {
  const account = getAccounts().find((a) => a.email === email);
  if (!account) return null;

  const user = { username: account.username, email: account.email };
  localStorage.setItem(CURRENT_KEY, JSON.stringify(user));
  localStorage.setItem(LAST_KEY, account.email);
  rememberSession(account);
  window.dispatchEvent(new Event("nexiv-auth-change"));
  return user;
}

export function signOutCurrent() {
  localStorage.removeItem(CURRENT_KEY);
  window.dispatchEvent(new Event("nexiv-auth-change"));
}