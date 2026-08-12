import { useState } from 'react';
import { useCartContext } from '../../context/ShopwareContext';
import { formatPrice } from '../../lib/utils/price';
import { getAppliedPromotions, promotionResult } from '../../lib/utils/promotion';

/**
 * Campo "codice sconto" del checkout.
 *
 * Applica il codice sul carrello Shopware (line item di tipo `promotion`) e
 * mostra le promozioni attive con la possibilità di rimuoverle.
 * Ogni modifica ricalcola il totale lato Shopware: il checkout se ne accorge
 * perché il PaymentIntent viene invalidato dal chiamante (onChange).
 */
export default function PromoCode({ cart, onChange, isMobile, disabled }) {
  const { applyPromotionCode, removeItem } = useCartContext();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const applied = getAppliedPromotions(cart);

  const submit = async (e) => {
    e.preventDefault();
    const value = code.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await applyPromotionCode(value);
      const result = promotionResult(updated, value);
      if (result.ok) {
        setCode('');
        onChange?.();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err?.message || 'Impossibile applicare il codice. Riprova.');
    } finally {
      setBusy(false);
    }
  };

  // Una promozione può avere più line item (carrello + spedizione): si rimuovono tutti.
  const remove = async (ids) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      for (const id of ids) await removeItem(id);
      onChange?.();
    } catch (err) {
      setError(err?.message || 'Impossibile rimuovere il codice.');
    } finally {
      setBusy(false);
    }
  };

  // Le promozioni applicate restano sempre visibili; il campo si apre su richiesta
  const showField = open || applied.length === 0;

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, marginTop: 14 }}>
      {applied.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: showField ? 12 : 0 }}>
          {applied.map((promo) => (
            <div key={promo.code} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: 'var(--color-red)',
                border: '1px solid var(--color-red)', borderRadius: 'var(--radius-pill)',
                padding: '4px 10px', letterSpacing: '.04em', textTransform: 'uppercase',
                minWidth: 0,
              }}>
                🏷 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {promo.code}
                </span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {promo.discount !== 0 && (
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-red)' }}>
                    {formatPrice(promo.discount)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(promo.ids)}
                  disabled={busy || disabled}
                  aria-label={`Rimuovi il codice ${promo.code}`}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    color: 'var(--color-mid)', fontSize: 12, cursor: busy ? 'wait' : 'pointer',
                    textDecoration: 'underline', fontFamily: 'var(--font-sans)',
                  }}
                >
                  Rimuovi
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showField && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: 'none', border: 'none', padding: 0, marginTop: 10,
            color: 'var(--color-red)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-sans)',
          }}
        >
          Aggiungi un altro codice
        </button>
      )}

      {showField && (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{
              display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--color-mid)',
              marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.06em',
            }}>
              Codice sconto
            </label>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
              placeholder="ES. TEST100"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={busy || disabled}
              style={{
                width: '100%', padding: '9px 0', border: 'none',
                borderBottom: `1.5px solid ${error ? 'var(--color-red)' : 'var(--color-dark)'}`,
                borderRadius: 0, background: 'transparent',
                fontSize: isMobile ? 16 : 14, boxSizing: 'border-box',
                fontFamily: 'var(--font-sans)', color: 'var(--color-dark)',
                outline: 'none', letterSpacing: '.06em', WebkitAppearance: 'none',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={busy || disabled || !code.trim()}
            style={{
              padding: '9px 18px', minHeight: 40,
              background: 'transparent', color: 'var(--color-dark)',
              border: '1.5px solid var(--color-dark)', borderRadius: 'var(--radius-pill)',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
              cursor: busy || !code.trim() ? 'not-allowed' : 'pointer',
              opacity: busy || !code.trim() ? 0.5 : 1, flexShrink: 0,
            }}
          >
            {busy ? '…' : 'Applica'}
          </button>
        </form>
      )}

      {error && (
        <p style={{ fontSize: 12, color: 'var(--color-red)', marginTop: 6, marginBottom: 0 }}>⚠ {error}</p>
      )}
    </div>
  );
}
