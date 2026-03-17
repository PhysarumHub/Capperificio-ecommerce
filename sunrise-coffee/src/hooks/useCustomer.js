import { useState, useCallback } from 'react';
import * as customerApi from '../lib/api/customer';
import { isShopwareConfigured } from '../lib/shopware-client';

/**
 * Hook for customer authentication state.
 */
export function useCustomer() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const configured = isShopwareConfigured();
  const isLoggedIn = Boolean(customer);

  const fetchCustomer = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      const data = await customerApi.getCustomer();
      setCustomer(data);
    } catch {
      // Not logged in — not an error
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const login = useCallback(async (email, password) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      await customerApi.login(email, password);
      // Fetch full customer profile after login
      const data = await customerApi.getCustomer();
      setCustomer(data);
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const logout = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      await customerApi.logout();
      setCustomer(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  const register = useCallback(async (data) => {
    if (!configured) return;
    setLoading(true);
    setError(null);
    try {
      await customerApi.register(data);
      // Auto-login after registration
      const profile = await customerApi.getCustomer();
      setCustomer(profile);
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [configured]);

  return {
    customer,
    isLoggedIn,
    loading,
    error,
    fetchCustomer,
    login,
    logout,
    register,
  };
}
