// The real access/refresh tokens live in httpOnly cookies the browser controls —
// JS can't read them, so this is just a non-sensitive UI hint for route guards.
// It grants no access on its own: every API call still requires the actual
// cookie, and a missing/expired one 401s and bounces back to login regardless.
export const isAuthenticated = () => localStorage.getItem("isLoggedIn") === "1";
