import { storeApiPost, storeApiGet, storeApiDelete } from '../shopware-client';

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
 * Register a new customer.
 */
export async function register(data) {
  return storeApiPost('/account/register', data);
}

/**
 * Get the currently logged-in customer profile.
 */
export async function getCustomer() {
  return storeApiPost('/account/customer', {
    associations: {
      defaultBillingAddress: {},
      defaultShippingAddress: {},
    },
  });
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
      lineItems: {
        associations: {
          cover: {},
        },
      },
    },
  });
}
