import styles from '../../pages/LegalPage.module.css';
import { COMPANY } from '../../data/company';

/** Scheda con i dati identificativi e fiscali della società. */
export default function CompanyData({ withContacts = true }) {
  return (
    <div className={styles.infoBox}>
      <dl className={styles.dataList}>
        <dt>Ragione sociale</dt>
        <dd>{COMPANY.legalName}</dd>

        <dt>Marchio</dt>
        <dd>{COMPANY.brand}</dd>

        <dt>Sede legale</dt>
        <dd>{COMPANY.addressLine}</dd>

        <dt>Partita IVA</dt>
        <dd>{COMPANY.vat}</dd>

        <dt>Codice Fiscale</dt>
        <dd>{COMPANY.taxCode}</dd>

        <dt>Partita IVA UE</dt>
        <dd>{COMPANY.euVat}</dd>

        <dt>Iscrizione REA</dt>
        <dd>{COMPANY.rea} — {COMPANY.chamberOfCommerce}</dd>

        {withContacts && (
          <>
            <dt>Email</dt>
            <dd><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></dd>

            <dt>PEC</dt>
            <dd><a href={`mailto:${COMPANY.pec}`}>{COMPANY.pec}</a></dd>

            <dt>Sito web</dt>
            <dd>{COMPANY.domain}</dd>
          </>
        )}
      </dl>
    </div>
  );
}
