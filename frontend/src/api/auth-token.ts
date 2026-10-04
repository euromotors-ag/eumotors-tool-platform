import axios from "axios";
import { API_BASE_URL } from "./api-base-url";

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter = async () => null;

/**
 * Registered once from inside ClerkProvider with Clerk's `getToken`
 */
export function setAuthTokenGetter(getter: TokenGetter): void {
  tokenGetter = getter;
}

/**
 * Current Clerk session token for backend requests (Clerk refreshes it when needed)
 */
export function getAuthToken(): Promise<string | null> {
  return tokenGetter();
}

function isBackendUrl(url: string): boolean {
  return API_BASE_URL ? url.startsWith(API_BASE_URL) : url.startsWith("/api/");
}

// Attach the session token to every axios request that goes to the backend
axios.interceptors.request.use(async (config) => {
  if (!isBackendUrl(config.url ?? "")) return config;

  const token = await getAuthToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
