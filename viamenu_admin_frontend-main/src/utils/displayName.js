// How a person is shown when parts of their profile are empty:
// name, else username, else email (same rule as the User Management lists).
export const displayName = (u) => (u && (u.name?.trim() || u.username || u.email)) || "";
