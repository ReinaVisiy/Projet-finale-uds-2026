// src/components/ShoppingCart.jsx
import React, { useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, ArrowLeft, CreditCard, Truck, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function ShoppingCart({
  cartItems,
  onRemoveItem,
  onUpdateQuantity,
  onCheckout,
  onContinueShopping,
}) {
  const { t } = useTranslation();
  const paymentMethods = [
    { id: 'orange-money', label: t('shoppingCart.orangeMoney'), icon: '📱', placeholder: t('shoppingCart.orangePlaceholder') },
    { id: 'mtn-money', label: t('shoppingCart.mtnMoney'), icon: '📱', placeholder: t('shoppingCart.mtnPlaceholder') },
  ];
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentData, setPaymentData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Calcul des totaux
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  const handleQuantityChange = (id, newQty) => {
    if (newQty < 1) {
      onRemoveItem(id);
    } else {
      onUpdateQuantity(id, newQty);
    }
  };

  const handlePaymentSubmit = () => {
    // Validation
    if (!paymentMethod) {
      setPaymentError(t('shoppingCart.chooseMethod'));
      return;
    }
    if (!paymentData.trim()) {
      setPaymentError(t('shoppingCart.enterDetails'));
      return;
    }

    // Validation du numéro de téléphone (Orange/MTN Money)
    const phoneRegex = /^[6][0-9]{8}$/; // 6X XX XX XX
    if (!phoneRegex.test(paymentData.replace(/\s/g, ''))) {
      setPaymentError(t('shoppingCart.invalidPhone'));
      return;
    }

    setPaymentError('');
    setIsProcessing(true);

    // Simulation de paiement
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      // Appeler onCheckout pour valider la commande après 2 secondes
      setTimeout(() => {
        onCheckout({ paymentMethod, paymentData });
      }, 1500);
    }, 2000);
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

      <div style={styles.grid}>
        {/* Colonne gauche : produits */}
        <div style={styles.productsSection}>
          {cartItems.map((item) => (
            <div key={item.id} style={styles.productCard}>
              <div style={styles.productImage}>
                <img src={item.image} alt={item.name} style={styles.image} />
              </div>
              <div style={styles.productInfo}>
                <h4 style={styles.productName}>{item.name}</h4>
                <p style={styles.productFarm}>{item.farm || t('shoppingCart.localProducer')}</p>
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
        </div>

        {/* Colonne droite : résumé + paiement */}
        <div style={styles.summarySection}>
          <h3 style={styles.summaryTitle}>{t('shoppingCart.orderSummary')}</h3>

          <div style={styles.summaryRow}>
            <span>{t('shoppingCart.subtotalLabel')}</span>
            <span>{subtotal.toLocaleString()} FCFA</span>
          </div>
          <div style={styles.divider} />

          {/* Total */}
          <div style={styles.totalRow}>
            <span style={styles.totalLabel}>{t('shoppingCart.totalToPay')}</span>
            <span style={styles.totalValue}>{total.toLocaleString()} FCFA</span>
          </div>

          <div style={styles.divider} />

          {/* CHOIX DU MODE DE PAIEMENT */}
          <div style={styles.paymentSection}>
            <h4 style={styles.paymentTitle}>{t('shoppingCart.paymentMethod')}</h4>
            <div style={styles.paymentOptions}>
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  style={{
                    ...styles.paymentOption,
                    borderColor: paymentMethod === method.id ? '#2d6a4f' : '#dee2e6',
                    backgroundColor: paymentMethod === method.id ? '#e9f5ee' : '#f8f9fa',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => {
                      setPaymentMethod(method.id);
                      setPaymentError('');
                    }}
                    style={{ display: 'none' }}
                  />
                  <span style={styles.paymentIcon}>{method.icon}</span>
                  <span style={styles.paymentLabel}>{method.label}</span>
                </label>
              ))}
            </div>

            {paymentMethod && (
              <div style={styles.paymentForm}>
                <label style={styles.paymentInputLabel}>
                  {paymentMethods.find(m => m.id === paymentMethod)?.placeholder}
                </label>
                <input
                  type="text"
                  placeholder={paymentMethods.find(m => m.id === paymentMethod)?.placeholder}
                  value={paymentData}
                  onChange={(e) => {
                    setPaymentData(e.target.value);
                    setPaymentError('');
                  }}
                  style={styles.paymentInput}
                />
              </div>
            )}

            {paymentError && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} color="#e07a5f" />
                <span style={styles.errorText}>{paymentError}</span>
              </div>
            )}

            {paymentSuccess && (
              <div style={styles.successBox}>
                <CheckCircle size={20} color="#2d6a4f" />
                <span style={styles.successText}>{t('shoppingCart.paymentConfirmed')}</span>
              </div>
            )}

            <button
              style={{
                ...styles.checkoutBtn,
                opacity: isProcessing ? 0.7 : 1,
                backgroundColor: paymentSuccess ? '#2d6a4f' : '#2d6a4f',
              }}
              onClick={handlePaymentSubmit}
              disabled={isProcessing || paymentSuccess}
            >
              {isProcessing ? t('shoppingCart.processing') : paymentSuccess ? t('shoppingCart.paid') : t('shoppingCart.pay', { total: total.toLocaleString() })}
              {!isProcessing && !paymentSuccess && <CreditCard size={16} />}
            </button>
          </div>

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
    gap: '16px',
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
  productFarm: {
    fontSize: '13px',
    color: '#6c757d',
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

  // Paiement
  paymentSection: {
    marginTop: '8px',
  },
  paymentTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#212529',
    margin: '0 0 12px 0',
  },
  paymentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1.5px solid #dee2e6',
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  paymentIcon: {
    fontSize: '18px',
  },
  paymentLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#212529',
  },
  paymentForm: {
    marginTop: '12px',
  },
  paymentInputLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#495057',
    marginBottom: '4px',
  },
  paymentInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #dee2e6',
    fontSize: '14px',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#fdf1ed',
    borderRadius: '10px',
    border: '1px solid #f5d4c8',
    marginTop: '12px',
  },
  errorText: {
    fontSize: '13px',
    color: '#e07a5f',
    fontWeight: '600',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    backgroundColor: '#e9f5ee',
    borderRadius: '10px',
    border: '1px solid #b7e4c7',
    marginTop: '12px',
  },
  successText: {
    fontSize: '13px',
    color: '#2d6a4f',
    fontWeight: '600',
  },
  checkoutBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '16px',
    transition: 'opacity 0.2s',
    boxShadow: '0 8px 24px rgba(45,106,79,0.25)',
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