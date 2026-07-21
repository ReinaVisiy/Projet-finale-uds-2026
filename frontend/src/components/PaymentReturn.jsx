import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as paiementApi from '../services/api/paiementApi';

// Écran de retour après redirection NotchPay (successUrl / cancelUrl construits
// par paiement-service, cf. PaiementService#initierPaiement). Le paiement
// NotchPay étant asynchrone, on sonde plusieurs fois GET /verifier avant de
// considérer le statut comme définitif (EN_ATTENTE peut encore évoluer).
const INTERVALLE_SONDAGE_MS = 3000;
const TENTATIVES_MAX = 5;

export default function PaymentReturn({ transactionId, onTermine }) {
  const { t } = useTranslation();
  const [statut, setStatut] = useState('EN_ATTENTE');
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    let annule = false;
    let tentative = 0;

    const sonder = async () => {
      try {
        const transaction = await paiementApi.verifierPaiement(transactionId);
        if (annule) return;

        if (transaction.statut !== 'EN_ATTENTE' || tentative >= TENTATIVES_MAX) {
          setStatut(transaction.statut);
          return;
        }

        tentative += 1;
        setTimeout(sonder, INTERVALLE_SONDAGE_MS);
      } catch (err) {
        if (!annule) {
          setErreur(err?.message || t('paymentReturn.errorGeneric'));
        }
      }
    };

    if (transactionId) {
      sonder();
    } else {
      setErreur(t('paymentReturn.errorMissingId'));
    }

    return () => { annule = true; };
  }, [transactionId, t]);

  return (
    <div style={styles.wrapper} className="fade-in">
      <div style={styles.card}>
        {erreur ? (
          <>
            <XCircle size={56} color="#dc2626" />
            <h2 style={styles.title}>{t('paymentReturn.errorTitle')}</h2>
            <p style={styles.text}>{erreur}</p>
          </>
        ) : statut === 'PAYE' ? (
          <>
            <CheckCircle2 size={56} color="#16a34a" />
            <h2 style={styles.title}>{t('paymentReturn.successTitle')}</h2>
            <p style={styles.text}>{t('paymentReturn.successText')}</p>
          </>
        ) : statut === 'ECHOUE' || statut === 'EXPIRE' ? (
          <>
            <XCircle size={56} color="#dc2626" />
            <h2 style={styles.title}>{t('paymentReturn.failedTitle')}</h2>
            <p style={styles.text}>{t('paymentReturn.failedText')}</p>
          </>
        ) : (
          <>
            <Loader2 size={56} color="#2563eb" className="spin" />
            <h2 style={styles.title}>{t('paymentReturn.pendingTitle')}</h2>
            <p style={styles.text}>{t('paymentReturn.pendingText')}</p>
          </>
        )}

        <button style={styles.button} onClick={onTermine}>
          {t('paymentReturn.backToOrders')}
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '12px',
    background: '#fff',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    maxWidth: '420px',
  },
  title: { margin: 0, fontSize: '20px', fontWeight: 700 },
  text: { margin: 0, color: '#555', fontSize: '15px' },
  button: {
    marginTop: '12px',
    padding: '12px 28px',
    borderRadius: '10px',
    border: 'none',
    background: '#16a34a',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
