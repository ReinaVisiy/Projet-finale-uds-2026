import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import * as paiementApi from '../services/api/paiementApi';

// Écran de retour après redirection NotchPay (successUrl / cancelUrl construits
// par paiement-service, cf. PaiementService#initierPaiement). Le paiement
// NotchPay étant asynchrone, on sonde plusieurs fois GET /verifier avant de
// considérer le statut comme définitif (EN_ATTENTE peut encore évoluer).
const INTERVALLE_SONDAGE_MS = 3000;
const TENTATIVES_MAX = 5;

export default function PaymentReturn({ transactionId, onTermine, onPaiementConfirme, onPaiementEchoue }) {
  const { t } = useTranslation();
  const [statut, setStatut] = useState('EN_ATTENTE');
  const [erreur, setErreur] = useState(null);
  // Distingue "sondage actif en cours" de "abandonné après TENTATIVES_MAX
  // essais sans réponse définitive" : avant ce correctif, les deux cas
  // affichaient le même spinner "vérification en cours", ce qui donnait
  // l'illusion d'un blocage infini alors que le sondage s'était en réalité
  // arrêté au bout de TENTATIVES_MAX * INTERVALLE_SONDAGE_MS.
  const [abandonne, setAbandonne] = useState(false);
  const [verificationEnCours, setVerificationEnCours] = useState(false);

  // onPaiementConfirme est une fonction inline recréée à chaque rendu du
  // parent (App.jsx) : si elle figurait dans les dépendances de
  // lancerSondage/useEffect ci-dessous, TOUT re-rendu du parent (ex. le
  // polling des notifications/messages toutes les 30s, ou l'appel de
  // onPaiementConfirme lui-même qui déclenche un setNotifications côté
  // parent) relançait un nouveau sondage. Comme la transaction était déjà
  // PAYE, ce nouveau sondage rappelait immédiatement onPaiementConfirme,
  // qui re-render le parent, qui relançait un sondage... Une boucle
  // infinie créant des dizaines de notifications "paiement confirmé"
  // identiques. On stocke donc la callback dans une ref à jour, jamais
  // dans les dépendances, et on n'appelle plus onPaiementConfirme qu'une
  // seule fois par transaction (cf. dejaConfirmeRef plus bas).
  const onPaiementConfirmeRef = useRef(onPaiementConfirme);
  useEffect(() => {
    onPaiementConfirmeRef.current = onPaiementConfirme;
  }, [onPaiementConfirme]);

  // Même logique que onPaiementConfirmeRef ci-dessus, pour le cas
  // symétrique d'un paiement définitivement échoué/expiré : on notifie
  // le client une seule fois par transaction (cf. dejaEchoueRef).
  const onPaiementEchoueRef = useRef(onPaiementEchoue);
  useEffect(() => {
    onPaiementEchoueRef.current = onPaiementEchoue;
  }, [onPaiementEchoue]);

  const dejaConfirmeRef = useRef(false);
  const dejaEchoueRef = useRef(false);

  const lancerSondage = useCallback(() => {
    let annule = false;
    let tentative = 0;
    setAbandonne(false);
    setErreur(null);
    setVerificationEnCours(true);

    const sonder = async () => {
      try {
        const transaction = await paiementApi.verifierPaiement(transactionId);
        if (annule) return;

        if (transaction.statut !== 'EN_ATTENTE') {
          setStatut(transaction.statut);
          setVerificationEnCours(false);
          if (transaction.statut === 'PAYE' && !dejaConfirmeRef.current) {
            dejaConfirmeRef.current = true;
            onPaiementConfirmeRef.current?.(transaction);
          } else if ((transaction.statut === 'ECHOUE' || transaction.statut === 'EXPIRE') && !dejaEchoueRef.current) {
            dejaEchoueRef.current = true;
            onPaiementEchoueRef.current?.(transaction);
          }
          return;
        }

        if (tentative >= TENTATIVES_MAX) {
          // On abandonne le sondage automatique, mais on le dit clairement :
          // le paiement reste peut-être en cours côté NotchPay (mobile money
          // notamment), le client peut relancer une vérification manuelle.
          setAbandonne(true);
          setVerificationEnCours(false);
          return;
        }

        tentative += 1;
        setTimeout(sonder, INTERVALLE_SONDAGE_MS);
      } catch (err) {
        if (!annule) {
          setErreur(err?.message || t('paymentReturn.errorGeneric'));
          setVerificationEnCours(false);
        }
      }
    };

    sonder();
    return () => { annule = true; };
  }, [transactionId, t]);

  useEffect(() => {
    if (!transactionId) {
      setErreur(t('paymentReturn.errorMissingId'));
      return;
    }
    return lancerSondage();
  }, [transactionId, lancerSondage, t]);

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
        ) : abandonne ? (
          <>
            <Loader2 size={56} color="#f59e0b" />
            <h2 style={styles.title}>{t('paymentReturn.stillPendingTitle')}</h2>
            <p style={styles.text}>{t('paymentReturn.stillPendingText')}</p>
          </>
        ) : (
          <>
            <Loader2 size={56} color="#2563eb" className="spin" />
            <h2 style={styles.title}>{t('paymentReturn.pendingTitle')}</h2>
            <p style={styles.text}>{t('paymentReturn.pendingText')}</p>
          </>
        )}

        {abandonne && (
          <button style={styles.button} onClick={lancerSondage} disabled={verificationEnCours}>
            {t('paymentReturn.checkAgain')}
          </button>
        )}
        <button style={statut === 'PAYE' ? styles.button : styles.buttonSecondary} onClick={onTermine}>
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
  buttonSecondary: {
    marginTop: '4px',
    padding: '12px 28px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    background: '#fff',
    color: '#374151',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
