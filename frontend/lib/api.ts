// Base URL of the backend API.
//
// Previously this constant was redeclared identically at the top of every
// single page file. Centralizing it here means the fallback value and the
// environment variable name only need to be correct in one place.
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
