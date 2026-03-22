import { storeApiPost, storeApiGet } from '../shopware-client';

/**
 * Login with email and password.
 */
export async function login(email, password) {
  return storeApiPost('/account/login', { email, password });
}

/**
 * Logout the current customer.
 */
export async function logout() {
  return storeApiPost('/account/logout');
}

/**
 * Register a new customer (or guest).
 * Pass { guest: true } for guest checkout.
 */
export async function register(data) {
  return storeApiPost('/account/register', data);
}

/**
 * Get the currently logged-in customer profile.
 */
export async function getCustomer() {
  return storeApiGet('/account/customer');
}

/**
 * Get customer order history.
 */
export async function getOrders({ page = 1, limit = 10 } = {}) {
  return storeApiPost('/order', {
    page,
    limit,
    sort: [{ field: 'createdAt', order: 'DESC' }],
    associations: {
      lineItems: { associations: { cover: {} } },
      deliveries: {
        associations: {
          stateMachineState: {},
          shippingMethod: {},
          shippingOrderAddress: {},
        },
      },
      transactions: {
        associations: { stateMachineState: {}, paymentMethod: {} },
      },
    },
  });
}

/**
 * Get list of active countries for address forms.
 * Paginates because Store API max limit is 100 per request.
 */
export async function getCountries() {
  const pageSize = 100;
  const pages = await Promise.all([1, 2, 3].map((page) =>
    storeApiPost('/country', {
      sort: [{ field: 'name', order: 'ASC' }],
      limit: pageSize,
      page,
    }).catch(() => null)
  ));
  return pages.flatMap((r) => r?.elements || []);
}

/**
 * Get available salutations (required for registration/address).
 */
export async function getSalutations() {
  const result = await storeApiGet('/salutation');
  return result?.elements || [];
}

/**
 * Submit a product review.
 */
export async function submitReview(productId, { title, content, points }) {
  return storeApiPost(`/product/${productId}/review`, { title, content, points });
}
