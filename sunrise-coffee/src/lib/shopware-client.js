import { createAPIClient } from '@shopware/api-client';
import Cookies from 'js-cookie';

const CONTEXT_TOKEN_COOKIE = 'sw-context-token';

const apiUrl = import.meta.env.VITE_SHOPWARE_API_URL || '';
const accessKey = import.meta.env.VITE_SHOPWARE_ACCESS_KEY || '';

const savedToken = Cookies.get(CONTEXT_TOKEN_COOKIE) || '';

// Track the latest token in-memory so getContextToken() is always accurate,
// even in the same microtask turn where Shopware issues a new token
// (e.g. after guest registration changes the session).
let _latestToken = savedToken;

export const apiClient = createAPIClient({
  baseURL: apiUrl,
  accessToken: accessKey,
  contextToken: savedToken,
});

// Keep in-memory token and cookie in sync on every token change
apiClient.hook('onContextChanged', (newToken) => {
  _latestToken = newToken;
  Cookies.set(CONTEXT_TOKEN_COOKIE, newToken, { expires: 365, sameSite: 'Lax' });
});

// Also track tokens from responses that change the session mid-flight
apiClient.hook('onSuccessResponse', (response) => {
  const newToken = typeof response?.headers?.get === 'function'
    ? response.headers.get('sw-context-token')
    : null;
  if (newToken && newToken !== _latestToken) {
    _latestToken = newToken;
    Cookies.set(CONTEXT_TOKEN_COOKIE, newToken, { expires: 365, sameSite: 'Lax' });
  }
});

/**
 * Generic helper for Store API POST requests with criteria.
 * Shopware Store API uses POST for most read endpoints.
 */
export async function storeApiPost(endpoint, body = {}) {
  const { data } = await apiClient.invoke(`custom POST ${endpoint}`, {
    body,
  });
  return data;
}

/**
 * Generic helper for Store API GET requests.
 */
export async function storeApiGet(endpoint, query = {}) {
  const { data } = await apiClient.invoke(`custom GET ${endpoint}`, {
    query,
  });
  return data;
}

/**
 * Generic helper for Store API PATCH requests.
 */
export async function storeApiPatch(endpoint, body = {}) {
  const { data } = await apiClient.invoke(`custom PATCH ${endpoint}`, {
    body,
  });
  return data;
}

/**
 * Generic helper for Store API DELETE requests.
 */
export async function storeApiDelete(endpoint, body = {}) {
  const { data } = await apiClient.invoke(`custom DELETE ${endpoint}`, {
    body,
  });
  return data;
}

/** Returns the current Shopware context token (always up-to-date, even after mid-session token changes). */
export function getContextToken() {
  return _latestToken;
}

/**
 * Force-adopt a context token issued elsewhere (e.g. returned by the payment
 * server after server-side guest registration migrated the cart to a new token).
 * Updates the api-client default header, the in-memory token and the cookie so
 * every subsequent client request operates on the correct cart/session.
 */
export function setContextToken(token) {
  if (!token || token === _latestToken) return;
  _latestToken = token;
  // Setting via the proxy triggers onContextChanged → cookie sync as well.
  apiClient.defaultHeaders['sw-context-token'] = token;
  Cookies.set(CONTEXT_TOKEN_COOKIE, token, { expires: 365, sameSite: 'Lax' });
}

/**
 * Check if the Shopware API is configured
 */
export function isShopwareConfigured() {
  return Boolean(apiUrl && accessKey);
}
