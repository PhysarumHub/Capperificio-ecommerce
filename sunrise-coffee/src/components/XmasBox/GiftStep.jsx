import Field from '../checkout/Field';
import { GIFT_MESSAGE_MAX, SHIP_STATUS_NOTE } from '../../data/natalBox';
import styles from './GiftStep.module.css';

/* Passo "È un regalo?": a chi spedirla, il lunedì di spedizione, il biglietto
   e l'indirizzo di chi la riceve. Tutto finisce nel payload della riga
   carrello (natalBox.ship / natalBox.gift). */

export const EMPTY_GIFT = {
  mode: 'recipient',
  week: '',
  message: '',
  to: '',
  sign: '',
  hidePrices: true,
  notify: false,
  recipient: { name: '', street: '', zip: '', city: '', phone: '', email: '' },
};

/* Errori del passo regalo; oggetto vuoto = si può aggiungere al carrello. */
export function validateGift(gift, weeks) {
  const e = {};
  const week = weeks.find((w) => w.id === gift.week);
  if (!week || week.status === 'full') e.week = 'Scegli quando spedirla';
  if (gift.mode !== 'recipient') return e;
  const r = gift.recipient;
  if (!r.name.trim()) e.name = 'Inserisci nome e cognome';
  if (!r.street.trim()) e.street = 'Inserisci via e numero civico';
  if (!/^\d{5}$/.test(r.zip.trim())) e.zip = 'CAP di 5 cifre';
  if (!r.city.trim()) e.city = 'Inserisci la città';
  if (gift.notify && !/^\S+@\S+\.\S+$/.test(r.email.trim())) e.email = 'Inserisci un’email valida';
  if (gift.message.length > GIFT_MESSAGE_MAX) e.message = `Massimo ${GIFT_MESSAGE_MAX} caratteri`;
  return e;
}

/* Il biglietto, mostrato sopra la scatola mentre lo si scrive. */
export function GiftNote({ gift }) {
  return (
    <figure className={styles.note} aria-label="Anteprima del biglietto">
      <span className={styles.noteTo}>Per {gift.to.trim() || 'chi la riceve'}</span>
      <p className={styles.noteText}>{gift.message.trim() || 'Il tuo messaggio…'}</p>
      <p className={styles.noteSign}>— {gift.sign.trim() || 'la tua firma'}</p>
    </figure>
  );
}

export default function GiftStep({ gift, onChange, errors, weeks }) {
  const set = (patch) => onChange({ ...gift, ...patch });
  const setR = (patch) => onChange({ ...gift, recipient: { ...gift.recipient, ...patch } });
  const isGift = gift.mode === 'recipient';
  const toName = gift.to.trim() || 'chi la riceve';

  return (
    <div className={styles.gift}>
      <fieldset className={styles.block}>
        <legend className={styles.legend}>A chi la spediamo</legend>
        <div className={styles.seg} role="radiogroup" aria-label="A chi la spediamo">
          {[
            ['recipient', 'A chi la riceve, con il biglietto'],
            ['self', 'A me'],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={gift.mode === mode}
              className={`${styles.segBtn} ${gift.mode === mode ? styles.on : ''}`}
              onClick={() => set({ mode })}
            >
              <span className={styles.dot} aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.block}>
        <legend className={styles.legend}>Quando la spediamo</legend>
        <p className={styles.hint}>Paghi oggi, parte il giorno che scegli. Consegna in 24–48 ore.</p>
        <div className={styles.weeks} role="radiogroup" aria-label="Quando la spediamo">
          {weeks.map((w) => (
            <button
              key={w.id}
              type="button"
              role="radio"
              aria-checked={gift.week === w.id}
              disabled={w.status === 'full'}
              className={`${styles.week} ${gift.week === w.id ? styles.on : ''}`}
              data-status={w.status}
              onClick={() => set({ week: w.id })}
            >
              <span className={styles.weekDay}>{w.day}</span>
              <span className={styles.weekDate}>{w.date}</span>
              <span className={styles.weekNote}>{w.note || SHIP_STATUS_NOTE[w.status]}</span>
            </button>
          ))}
        </div>
        {errors.week && <p className={styles.error} role="alert">{errors.week}</p>}
      </fieldset>

      {isGift && (
        <>
          <fieldset className={styles.block}>
            <legend className={styles.legend}>Il biglietto</legend>
            <Field
              as="custom"
              label="Messaggio"
              optional
              full
              error={errors.message}
            >
              {({ id, describedBy }) => (
                <textarea
                  id={id}
                  className={styles.textarea}
                  rows={4}
                  maxLength={GIFT_MESSAGE_MAX}
                  value={gift.message}
                  onChange={(e) => set({ message: e.target.value })}
                  aria-describedby={describedBy}
                  placeholder="Un po’ di Salento sotto l’albero. Buon Natale!"
                />
              )}
            </Field>
            <p className={styles.count} aria-live="polite">{gift.message.length}/{GIFT_MESSAGE_MAX}</p>
            <div className={styles.grid2}>
              <Field label="Per" optional value={gift.to} onChange={(e) => set({ to: e.target.value })} placeholder="Giulia" maxLength={40} />
              <Field label="Firma" optional value={gift.sign} onChange={(e) => set({ sign: e.target.value })} placeholder="Marco" maxLength={40} />
            </div>
          </fieldset>

          <fieldset className={styles.block}>
            <legend className={styles.legend}>Indirizzo di chi la riceve</legend>
            <div className={styles.grid6}>
              <Field className={styles.span3} label="Nome e cognome" autoComplete="shipping name" value={gift.recipient.name} onChange={(e) => setR({ name: e.target.value })} error={errors.name} />
              <Field className={styles.span3} label="Telefono, per il corriere" optional type="tel" autoComplete="shipping tel" value={gift.recipient.phone} onChange={(e) => setR({ phone: e.target.value })} />
              <Field className={styles.span6} label="Via e numero civico" autoComplete="shipping address-line1" value={gift.recipient.street} onChange={(e) => setR({ street: e.target.value })} error={errors.street} />
              <Field className={styles.span2} label="CAP" inputMode="numeric" maxLength={5} autoComplete="shipping postal-code" value={gift.recipient.zip} onChange={(e) => setR({ zip: e.target.value.replace(/\D/g, '') })} error={errors.zip} />
              <Field className={styles.span4} label="Città" autoComplete="shipping address-level2" value={gift.recipient.city} onChange={(e) => setR({ city: e.target.value })} error={errors.city} />
            </div>
          </fieldset>

          <div className={styles.checks}>
            <label className={styles.check}>
              <input type="checkbox" checked={gift.hidePrices} onChange={(e) => set({ hidePrices: e.target.checked })} />
              <span><strong>Nessun prezzo nel pacco.</strong> Ricevuta e fattura arrivano solo a te.</span>
            </label>
            <label className={styles.check}>
              <input type="checkbox" checked={gift.notify} onChange={(e) => set({ notify: e.target.checked })} />
              <span>Avvisa {toName} via email quando la box parte <span className={styles.muted}>(senza svelare il contenuto)</span></span>
            </label>
            {gift.notify && (
              <Field label={`Email di ${toName}`} type="email" autoComplete="off" value={gift.recipient.email} onChange={(e) => setR({ email: e.target.value })} error={errors.email} />
            )}
          </div>
        </>
      )}

      {!isGift && (
        <p className={styles.hint}>La spediamo all’indirizzo che inserirai al pagamento, chiusa con il nastro{' '}
          <button type="button" className={styles.inlineLink} onClick={() => set({ mode: 'recipient' })}>oppure aggiungi un biglietto</button>.
        </p>
      )}
    </div>
  );
}
