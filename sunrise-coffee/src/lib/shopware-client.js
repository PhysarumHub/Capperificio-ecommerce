import { createAPIClient } from '@shopware/api-client';
import Cookies from 'js-cookie';

const CONTEXT_TOKEN_COOKIE = 'sw-context-token';

const apiUrl = import.meta.env.VITE_SHOPWARE_API_URL || '';
const accessKey = import.meta.env.VITE_SHOPWARE_ACCESS_KEY || '';

const savedToken = Cookies.get(CONTEXT_TOKEN_COOKIE) || '';

export const apiClient = createAPIClient({
  baseURL: apiUrl,
  accessToken: accessKey,
  contextToken: savedToken,
});

// Persist context token to cookie whenever it changes
apiClient.hook('onContextChanged', (newToken) => {
  Cookies.set(CONTEXT_TOKEN_COOKIE, newToken, { expires: 365, sameSite: 'Lax' });
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

/**
 * Check if the Shopware API is configured
 */
export function isShopwareConfigured() {
  return Boolean(apiUrl && accessKey);
}
