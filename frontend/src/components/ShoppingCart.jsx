// src/components/ShoppingCart.jsx
import React, { useMemo, useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ShoppingCart({
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  onContinueShopping,
}) {
  const { t } = useTranslation();
  // Redirection Simiz directe : plus de choix de mode de paiement ni de
  // numéro à saisir sur AgriCam (cf. section 1 du cahier des charges).
  const [processingVendorId, setProcessingVendorId] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // Total global, purement informatif : le paiement se fait groupe par
  // groupe (un vendeur = une commande = un paiement Simiz indépendant).
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Le panier est scindé par vendeur, car une Commande ne peut plus
  // contenir des produits que d'un seul producteur côté backend.
  const groupesParVendeur = useMemo(() => {
    const groupes = new Map();
    cartItems.forEach((item) => {
      const key = item.producteurId ?? 'inconnu';
      if (!groupes.has(key)) {
        groupes.set(key, {
          producteurId: item.producteurId,
          farm: item.farm || t('shoppingCart.localProducer'),
          items: [],
        });
      }
      groupes.get(key).items.push(item);
    });
    return Array.from(groupes.values());
  }, [cartItems, t]);

  const handleQuantityChange = (id, newQty) => {
    if (newQty < 1) {
      onRemoveItem(id);
    } else {
      onUpdateQuantity(id, newQty);
    }
  };

  const handleGroupCheckout = async (vendeurId) => {
    setCheckoutError('');
    setProcessingVendorId(vendeurId);
    try {
      await onCheckout(vendeurId);
      // En cas de succès, onCheckout redirige vers Simiz ; ce composant
      // sera démonté avant même que le finally ne compte.
    } catch (err) {
      setCheckoutError(err?.message || t('shoppingCart.checkoutError'));
    } finally {
      setProcessingVendorId(null);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onContinueShopping}>
            <ArrowLeft size={20} /> {t('shoppingCart.continueShopping')}
          </button>
          <h1 style={styles.title}>{t('shoppingCart.myCart')}</h1>
          <p style={styles.subtitle}>{t('shoppingCart.emptyCount')}</p>
        </div>

        <div style={styles.emptyState}>
          <ShoppingBag size={64} color="#adb5bd" />
          <h3 style={styles.emptyTitle}>{t('shoppingCart.emptyTitle')}</h3>
          <p style={styles.emptyDesc}>{t('shoppingCart.emptyDesc')}</p>
          <button style={styles.emptyBtn} onClick={onContinueShopping}>
            {t('shoppingCart.discoverProducts')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onContinueShopping}>
          <ArrowLeft size={20} /> {t('shoppingCart.continueShopping')}
        </button>
        <h1 style={styles.title}>{t('shoppingCart.myCart')}</h1>
        <p style={styles.subtitle}>{t('shoppingCart.itemCount', { count: cartItems.length })}</p>
      </div>

      {checkoutError && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} color="#e07a5f" />
          <span style={styles.errorText}>{checkoutError}</span>
        </div>
      )}

      <div style={styles.grid}>
        {/* Colonne gauche : produits groupés par vendeur, un paiement chacun */}
        <div style={styles.productsSection}>
          {groupesParVendeur.map((groupe) => {
            const subtotalGroupe = groupe.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const isProcessing = processingVendorId === groupe.producteurId;

            return (
              <div key={groupe.producteurId ?? 'inconnu'} style={styles.vendorGroup}>
                <h4 style={styles.vendorGroupTitle}>
                  {t('shoppingCart.vendorGroupTitle', { name: groupe.farm })}
                </h4>

                {groupe.items.map((item) => (
                  <div key={item.id} style={styles.productCard}>
                    <div style={styles.productImage}>
                      <img src={item.image} alt={item.name} style={styles.image} />
                    </div>
                    <div style={styles.productInfo}>
                      <h4 style={styles.productName}>{item.name}</h4>
                      <p style={styles.productPrice}>{item.price.toLocaleString()} FCFA</p>
                      <div style={styles.quantityControl}>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={styles.qtyValue}>{item.quantity}</span>
                        <button
                          style={styles.qtyBtn}
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={styles.productActions}>
                      <div style={styles.productSubtotal}>
                        {(item.price * item.quantity).toLocaleString()} FCFA
                      </div>
                      <button
                        style={styles.removeBtn}
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={16} color="#e07a5f" />
                      </button>
                    </div>
                  </div>
                ))}

                <div style={styles.vendorGroupFooter}>
                  <span style={styles.vendorSubtotalLabel}>
                    {t('shoppingCart.vendorSubtotal')}: <strong>{subtotalGroupe.toLocaleString()} FCFA</strong>
                  </span>
                  <button
                    style={{ ...styles.checkoutBtn, opacity: isProcessing ? 0.7 : 1 }}
                    onClick={() => handleGroupCheckout(groupe.producteurId)}
                    disabled={isProcessing || processingVendorId !== null}
                  >
                    {isProcessing ? t('shoppingCart.processing') : t('shoppingCart.pay', { total: subtotalGroupe.toLocaleString() })}
                    {!isProcessing && <CreditCard size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Colonne droite : résumé global (informatif) */}
        <div style={styles.summarySection}>
          <h3 style={styles.summaryTitle}>{t('shoppingCart.orderSummary')}</h3>

          <div style={styles.summaryRow}>
            <span>{t('shoppingCart.subtotalLabel')}</span>
            <span>{total.toLocaleString()} FCFA</span>
          </div>
          <div style={styles.divider} />

          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>{t('shoppingCart.totalToPay')}</span>
            <span style={styles.totalValue}>{total.toLocaleString()} FCFA</span>
          </div>

          <div style={styles.divider} />

          {/* Sécurité */}
          <div style={styles.securityBadges}>
            <span style={styles.badge}>{t('shoppingCart.securePayment')}</span>
            <span style={styles.badge}>{t('shoppingCart.trackedDelivery')}</span>
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
    padding: '40px 24px 80px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    marginBottom: '32px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '900',
    color: '#212529',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d',
    margin: '4px 0 0 0',
  },

  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#6c757d',
  },
  emptyTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#212529',
    margin: '16px 0 8px 0',
  },
  emptyDesc: {
    fontSize: '16px',
    margin: '0 0 24px 0',
  },
  emptyBtn: {
    padding: '12px 32px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '32px',
    alignItems: 'start',
  },

  productsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },

  vendorGroup: {
    backgroundColor: '#f8f9fa',
    borderRadius: '18px',
    border: '1px solid #e9ecef',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  vendorGroupTitle: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#2d6a4f',
    margin: '0 0 4px 0',
  },
  vendorGroupFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #e9ecef',
    flexWrap: 'wrap',
  },
  vendorSubtotalLabel: {
    fontSize: '14px',
    color: '#495057',
  },

  productCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  productImage: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#212529',
    margin: '0 0 4px 0',
  },
  productPrice: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#e07a5f',
    margin: '0 0 8px 0',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: '700',
  },
  qtyValue: {
    fontSize: '16px',
    fontWeight: '700',
    minWidth: '24px',
    textAlign: 'center',
  },
  productActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  productSubtotal: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#212529',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
  },

  summarySection: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    position: 'sticky',
    top: '80px',
  },
  summaryTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#212529',
    margin: '0 0 20px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#495057',
    padding: '6px 0',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e9ecef',
    margin: '12px 0',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    marginTop: '4px',
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#212529',
  },
  totalValue: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#e07a5f',
  },

  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#fdf1ed',
    borderRadius: '10px',
    border: '1px solid #f5d4c8',
    marginBottom: '20px',
  },
  errorText: {
    fontSize: '13px',
    color: '#e07a5f',
    fontWeight: '600',
  },

  checkoutBtn: {
    padding: '10px 20px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'opacity 0.2s',
    boxShadow: '0 8px 24px rgba(45,106,79,0.25)',
    whiteSpace: 'nowrap',
  },
  securityBadges: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '16px',
  },
  badge: {
    fontSize: '12px',
    color: '#6c757d',
    fontWeight: '600',
  },
};
