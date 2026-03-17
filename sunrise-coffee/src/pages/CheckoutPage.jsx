import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartContext, useCustomerContext } from '../context/ShopwareContext';
import { getPaymentMethods, getShippingMethods, placeOrder } from '../lib/api/checkout';
import { formatPrice } from '../lib/utils/price';
import { isShopwareConfigured } from '../lib/shopware-client';

export default function CheckoutPage() {
  const { cart, itemCount, totalPrice } = useCartContext();
  const { isLoggedIn } = useCustomerContext();
  const navigate = useNavigate();

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [shippingMethods, setShippingMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState('');
  const [selectedShipping, setSelectedShipping] = useState('');
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const [address, setAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    zipcode: '',
    city: '',
    countryId: '',
    email: '',
  });

  useEffect(() => {
    if (!isShopwareConfigured()) return;

    Promise.all([getPaymentMethods(), getShippingMethods()])
      .then(([pm, sm]) => {
        const payments = pm?.elements || pm || [];
        const shippings = sm?.elements || sm || [];
        setPaymentMethods(payments);
        setShippingMethods(shippings);
        if (payments.length) setSelectedPayment(payments[0].id);
        if (shippings.length) setSelectedShipping(shippings[0].id);
      })
      .catch(() => {});
  }, []);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setOrderError(null);
    try {
      await placeOrder();
      setOrderSuccess(true);
    } catch (err) {
      setOrderError(err.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (orderSuccess) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', marginBottom: 16 }}>
          Order Confirmed!
        </h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Thank you for your purchase. You will receive a confirmation email shortly.</p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            background: 'var(--color-red)',
            color: '#fff',
            padding: '14px 32px',
            borderRadius: 'var(--radius-pill)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Back to Home
        </Link>
      </div>
    );
  }

  if (!itemCount) {
    return (
      <div style={{ padding: '80px 40px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', marginBottom: 16 }}>Checkout</h1>
        <p style={{ color: '#666', marginBottom: 24 }}>Your cart is empty.</p>
        <Link to="/collections/all" style={{ color: 'var(--color-red)', textDecoration: 'underline' }}>
          Shop Coffee
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-4xl)', marginBottom: 32 }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 40 }}>
        {/* Left column — Form */}
        <div>
          {!isLoggedIn && (
            <div style={{ marginBottom: 32 }}>
              <p style={{ marginBottom: 8 }}>
                Already have an account?{' '}
                <Link to="/account/login" style={{ color: 'var(--color-red)' }}>Log in</Link>
              </p>
            </div>
          )}

          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 16 }}>
            Shipping Address
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
            {[
              { key: 'firstName', label: 'First Name' },
              { key: 'lastName', label: 'Last Name' },
              { key: 'street', label: 'Street Address', full: true },
              { key: 'zipcode', label: 'ZIP Code' },
              { key: 'city', label: 'City' },
              { key: 'email', label: 'Email', full: true },
            ].map(({ key, label, full }) => (
              <div key={key} style={full ? { gridColumn: '1 / -1' } : {}}>
                <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 4 }}>{label}</label>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={address[key]}
                  onChange={(e) => setAddress((prev) => ({ ...prev, [key]: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    fontSize: 15,
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          {shippingMethods.length > 0 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 16 }}>
                Shipping Method
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
                {shippingMethods.map((m) => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
                    <input type="radio" name="shipping" value={m.id} checked={selectedShipping === m.id} onChange={() => setSelectedShipping(m.id)} />
                    <span>{m.translated?.name || m.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {paymentMethods.length > 0 && (
            <>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 16 }}>
                Payment Method
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
                {paymentMethods.map((m) => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer' }}>
                    <input type="radio" name="payment" value={m.id} checked={selectedPayment === m.id} onChange={() => setSelectedPayment(m.id)} />
                    <span>{m.translated?.name || m.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right column — Order summary */}
        <div style={{ background: '#f9f9f9', padding: 24, borderRadius: 12, alignSelf: 'flex-start' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', marginBottom: 16 }}>
            Order Summary
          </h2>
          {cart?.lineItems?.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span>{item.label} x{item.quantity}</span>
              <span>{formatPrice(item.price?.totalPrice)}</span>
            </div>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid #ddd', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          {orderError && (
            <p style={{ color: 'var(--color-red)', marginTop: 12, fontSize: 14 }}>{orderError}</p>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            style={{
              width: '100%',
              marginTop: 24,
              padding: '14px 0',
              background: placing ? '#999' : 'var(--color-red)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              fontSize: 16,
              fontWeight: 600,
              cursor: placing ? 'not-allowed' : 'pointer',
            }}
          >
            {placing ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
