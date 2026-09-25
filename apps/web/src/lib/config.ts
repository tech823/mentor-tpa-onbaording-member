/**
 * Base URL for the API. In dev it stays "/api" (Vite proxy). In production,
 * set VITE_API_URL at build time to the backend's full URL, e.g.
 *   VITE_API_URL=https://enrollapi.mentortpa.com/api
 */
export const API_BASE = import.meta.env.VITE_API_URL || "/api";
