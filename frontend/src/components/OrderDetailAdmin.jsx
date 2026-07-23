import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useIsMobile from '../hooks/useIsMobile';
import UserLink from './common/UserLink';
import ProductLink from './common/ProductLink';

// Avant : tout l'affichage (client, produit, adresse, montant, numéro de
// suivi...) était codé en dur, donc identique et sans rapport avec la
// commande réellement sélectionnée depuis "Gestion commandes". On affiche
// maintenant les vraies données de la commande passée en prop (déjà
// enrichie côté App.jsx via mapCommandePourAffichage), et on ne montre que
// ce que commande-service sait réellement (pas d'adresse ou de
// transporteur fictifs : cette donnée n'existe pas dans le modèle).
//
// On sépare la clé de statut stable ('livree', ...) de son libellé fr/en,
// pour que la logique (comparaisons, désactivation du bouton) reste
// correcte quelle que soit la langue affichée.
const STEP_KEYS = ['confirmee', 'en_preparation', 'expediee', 'livree'];

const STATUT_FR_TO_STEP_KEY = {
  'Validée': 'confirmee',
  'En préparation': 'en_preparation',
  'En livraison': 'expediee',
  'Livrée': 'livree',
};

export default function OrderDetailAdmin({ order, onBack, onMarkAsDelivered }) {
  const { t } = useTranslation();
  const [notification, setNotification] = useState('');
  const [confirmationEnCours, setConfirmationEnCours] = useState(false);
  const isNarrow = useIsMobile(576);
  const isTablet = useIsMobile(768);

  if (!order) {
    return (
      <div style={styles.container} className="fade-in">
        <div style={styles.header}>
          <h2 style={styles.title}>{t('orderDetailAdmin.orderTitle', { id: '' })}</h2>
          <button onClick={onBack} style={styles.backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t('orderDetailAdmin.back')}
          </button>
        </div>
        <p>{t('orderDetailAdmin.notFound')}</p>
      </div>
    );
  }

  const estAnnulee = order.status === 'Annulée';
  const estLivree = order.status === 'Livrée';
  const statusKey = STATUT_FR_TO_STEP_KEY[order.status];
  const currentStepIdx = statusKey ? STEP_KEYS.indexOf(statusKey) : -1;

  const handleMarkAsDelivered = async () => {
    if (!onMarkAsDelivered) return;
    setConfirmationEnCours(true);
    try {
      await onMarkAsDelivered(order.id);
      setNotification(t('orderDetailAdmin.deliveredToast', { id: order.id }));
      setTimeout(() => setNotification(''), 4000);
    } finally {
      setConfirmationEnCours(false);
    }
  };

  const handleContactClient = () => {
    setNotification(t('orderDetailAdmin.contactToast', { client: order.client }));
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Toast Notification */}
      {notification && (
        <div style={styles.toast} className="fade-in">
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>{t('orderDetailAdmin.orderTitle', { id: order.id })}</h2>
        <button onClick={onBack} style={styles.backBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          {t('orderDetailAdmin.back')}
        </button>
      </div>

      {/* Progress Timeline Tracker (ou bandeau si la commande est annulée) */}
      {estAnnulee ? (
        <div style={{ ...styles.trackerCard, textAlign: 'center' }}>
          <strong style={{ color: '#b3261e', fontSize: '15px' }}>{t('orderDetailAdmin.cancelledStatus')}</strong>
        </div>
      ) : (
      <div style={styles.trackerCard}>
        <span style={styles.statusLabel}>{t('orderDetailAdmin.currentStatus')}<strong style={{ color: estLivree ? '#2d6a4f' : '#e07a5f' }}>{order.status}</strong></span>
        <div style={{ ...styles.timelineWrapper, ...(isNarrow ? styles.timelineWrapperNarrow : {}) }}>
          {STEP_KEYS.map((step, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isActive = idx === currentStepIdx;
            return (
              <React.Fragment key={step}>
                {/* Connecting Line */}
                {idx > 0 && !isNarrow && (
                  <div style={{
                    ...styles.timelineLine,
                    backgroundColor: idx <= currentStepIdx ? '#2d6a4f' : '#dee2e6'
                  }} />
                )}
                
                {/* Step Node */}
                <div style={{ ...styles.stepNodeContainer, ...(isNarrow ? styles.stepNodeContainerNarrow : {}) }}>
                  <div style={{
                    ...styles.stepDot,
                    backgroundColor: isCompleted ? '#2d6a4f' : '#ffffff',
                    borderColor: isCompleted ? '#2d6a4f' : '#adb5bd',
                    boxShadow: isActive ? '0 0 0 4px rgba(45, 106, 79, 0.2)' : 'none'
                  }}>
                    {isCompleted ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span style={styles.stepNumber}>{idx + 1}</span>
                    )}
                  </div>
                  <span style={{
                    ...styles.stepLabelText,
                    fontWeight: isCompleted ? '700' : '500',
                    color: isCompleted ? '#212529' : '#6c757d'
                  }}>
                    {t('orderDetailAdmin.stepLabels', { returnObjects: true })[step]}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      )}

      {/* Grid Layout (Left Content, Right Summary Card) */}
      <div style={{ ...styles.layoutGrid, ...(isTablet ? styles.layoutGridMobile : {}) }}>
        
        {/* Left Side: Order Information Card */}
        <div style={styles.leftCard}>
          {/* Section 1: Produits commandés */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('orderDetailAdmin.orderedProducts')}</h3>
            {(order.items || []).map((item, idx) => (
              <div key={idx} style={styles.productRow}>
                <div style={styles.productAvatar}>🌾</div>
                <div style={styles.productInfo}>
                  <h4 style={styles.productName}><ProductLink id={item.produitId}>{item.nomProduit}</ProductLink></h4>
                  <p style={styles.productMeta}>{item.quantity} × {item.prixUnitaire?.toLocaleString()} FCFA</p>
                </div>
                <div style={styles.productPrice}>{item.subtotal?.toLocaleString()} FCFA</div>
              </div>
            ))}
          </div>

          <div style={styles.divider}></div>

          {/* Section 2: Informations client */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('orderDetailAdmin.clientInfo')}</h3>
            <div style={styles.clientDetail}>
              <p style={styles.detailName}><UserLink id={order.id_client}>{order.client}</UserLink></p>
              <p style={styles.detailContact}>{order.clientEmail || t('orderDetailAdmin.noEmail')}</p>
            </div>
          </div>

          <div style={styles.divider}></div>

          {/* Section 3: Paiement (pas d'adresse de livraison : commande-service ne stocke pas cette donnée) */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('orderDetailAdmin.payment')}</h3>
            <div style={styles.paymentBadge}>
              <span style={styles.paymentMethod}>{t('orderDetailAdmin.paymentMethod')}</span>
              <span style={styles.paymentAmount}>{order.amount?.toLocaleString()} FCFA</span>
            </div>
            <span style={{
              ...styles.paymentStatusBadge,
              backgroundColor: order.paye ? '#e9f5ee' : '#fdecea',
              color: order.paye ? '#2d6a4f' : '#b3261e',
            }}>
              {order.paye ? t('orderDetailAdmin.paid') : t('orderDetailAdmin.unpaid')}
            </span>
          </div>

          <div style={styles.divider}></div>

          {/* Section 4: Date commande */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>{t('orderDetailAdmin.orderDate')}</h3>
            <p style={styles.detailText}>{order.date}</p>
          </div>

          {/* Action Buttons */}
          <div style={styles.buttonGroup}>
            {!estAnnulee && (
              <button
                onClick={handleMarkAsDelivered}
                style={{
                  ...styles.btnPrimary,
                  ...(estLivree || confirmationEnCours ? styles.btnDisabled : {})
                }}
                disabled={estLivree || confirmationEnCours}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {estLivree ? t('orderDetailAdmin.deliveryValidated') : t('orderDetailAdmin.markDelivered')}
              </button>
            )}

            <button onClick={handleContactClient} style={styles.btnSecondary}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              {t('orderDetailAdmin.contactClient')}
            </button>
          </div>
        </div>

        {/* Right Side: Résumé Card */}
        <div style={styles.rightCard}>
          <h3 style={styles.summaryTitle}>{t('orderDetailAdmin.summary')}</h3>
          
          <div style={styles.summaryRow}>
            <span style={styles.summaryLabel}>{t('orderDetailAdmin.subtotal')}</span>
            <span style={styles.summaryValue}>{order.amount?.toLocaleString()} FCFA</span>
          </div>

          <div style={styles.summaryDivider}></div>

          <div style={{ ...styles.summaryRow, marginBottom: '24px' }}>
            <span style={styles.totalLabel}>{t('orderDetailAdmin.total')}</span>
            <span style={styles.totalValue}>{order.amount?.toLocaleString()} FCFA</span>
          </div>

          {/* Métadonnées de commande (numéro + date, les seules données réellement disponibles) */}
          <div style={styles.logisticsBlock}>
            <div style={styles.logisticsItem}>
              <span style={styles.logisticsLabel}>{t('orderDetailAdmin.orderNumber')}</span>
              <span style={styles.carrierVal}>#{order.id}</span>
            </div>

            <div style={styles.logisticsItem}>
              <span style={styles.logisticsLabel}>{t('orderDetailAdmin.orderDate')}</span>
              <span style={styles.carrierVal}>{order.date}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '30px 20px 60px 20px',
    width: '100%',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    padding: '14px 20px',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    zIndex: 9999,
    fontSize: '13px',
    fontWeight: '700',
    animation: 'slideInRight 0.3s ease-out forwards',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1.5px solid #dee2e6',
    paddingBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#212529',
    letterSpacing: '-0.02em',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#1b4d3e',
    fontSize: '13px',
    fontWeight: '700',
    border: '1.5px solid #dee2e6',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    ':hover': {
      backgroundColor: '#f8f9fa',
      borderColor: '#1b4d3e',
    }
  },
  // Tracker
  trackerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    padding: '24px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6c757d',
    display: 'block',
    marginBottom: '20px',
  },
  timelineWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    padding: '0 20px',
  },
  timelineWrapperNarrow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
    padding: '0',
  },
  timelineLine: {
    flexGrow: 1,
    height: '4px',
    margin: '0 -15px',
    transform: 'translateY(-10px)',
    borderRadius: '2px',
    transition: 'background-color 0.4s ease',
  },
  stepNodeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    zIndex: 2,
    position: 'relative',
  },
  stepNodeContainerNarrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
  },
  stepDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '2.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  stepNumber: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#adb5bd',
  },
  stepLabelText: {
    fontSize: '12px',
    textAlign: 'center',
    letterSpacing: '-0.01em',
  },
  // Layout Grid
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '30px',
    alignItems: 'start',
  },
  layoutGridMobile: {
    gridTemplateColumns: '1fr',
  },
  leftCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#1b4d3e',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  divider: {
    height: '1px',
    backgroundColor: '#f1f3f5',
    margin: '20px 0',
  },
  // Product Row
  productRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  productAvatar: {
    width: '44px',
    height: '44px',
    backgroundColor: '#fcf8f2',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    border: '1px solid #f8e5d0',
  },
  productInfo: {
    flexGrow: 1,
  },
  productName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#212529',
  },
  productMeta: {
    fontSize: '12px',
    color: '#6c757d',
  },
  productPrice: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#e07a5f',
  },
  // Client & Addresses
  clientDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#212529',
  },
  detailContact: {
    fontSize: '13px',
    color: '#6c757d',
  },
  detailText: {
    fontSize: '14px',
    color: '#343a40',
    fontWeight: '500',
  },
  paymentBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  paymentMethod: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#2d6a4f',
    backgroundColor: '#d8f3dc',
    padding: '4px 10px',
    borderRadius: '6px',
  },
  paymentAmount: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#495057',
  },
  paymentStatusBadge: {
    display: 'inline-block',
    marginTop: '10px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  // Action Buttons
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '32px',
    flexWrap: 'wrap',
  },
  btnPrimary: {
    flex: 1.2,
    minWidth: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderRadius: '10px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    fontSize: '13.5px',
    fontWeight: '700',
    boxShadow: '0 4px 10px rgba(27,77,62,0.15)',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  btnDisabled: {
    backgroundColor: '#adb5bd',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  btnSecondary: {
    flex: 1,
    minWidth: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderRadius: '10px',
    backgroundColor: '#f8f9fa',
    color: '#343a40',
    fontSize: '13.5px',
    fontWeight: '700',
    border: '1.5px solid #dee2e6',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
  },
  // Right card: Summary Card
  rightCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
  },
  summaryTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#212529',
    marginBottom: '20px',
    borderBottom: '1px solid #f1f3f5',
    paddingBottom: '10px',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '14px',
    fontSize: '13.5px',
  },
  summaryLabel: {
    color: '#6c757d',
    fontWeight: '500',
  },
  summaryValue: {
    color: '#212529',
    fontWeight: '700',
  },
  summaryDivider: {
    height: '1px',
    backgroundColor: '#e9ecef',
    margin: '16px 0',
  },
  totalLabel: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#212529',
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#e07a5f',
  },
  logisticsBlock: {
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    border: '1px solid #e9ecef',
  },
  logisticsItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  logisticsLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#868e96',
    textTransform: 'uppercase',
  },
  trackingLink: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#1b4d3e',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  carrierVal: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#343a40',
  }
};
