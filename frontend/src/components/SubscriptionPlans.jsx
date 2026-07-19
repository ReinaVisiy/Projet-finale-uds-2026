import React, { useState } from 'react';

export default function SubscriptionPlans() {
  const [activePlan, setActivePlan] = useState('BASIC');
  const [notification, setNotification] = useState('');

  const handleSubscribe = (planName) => {
    setActivePlan(planName);
    setNotification(`Félicitations ! Vous êtes maintenant abonné au plan ${planName}.`);
    setTimeout(() => setNotification(''), 3000);
  };

  const plans = [
    {
      id: 'BASIC',
      name: 'BASIC',
      price: 0,
      period: '/mois',
      features: [
        { text: 'Vendre sans limite', checked: true },
        { text: 'Support standard', checked: true },
        { text: 'Publicité premium', checked: false }
      ]
    },
    {
      id: 'PRO',
      name: 'PRO',
      price: 5000,
      period: '/mois',
      recommended: true,
      features: [
        { text: 'Tout de BASIC', checked: true },
        { text: 'Mise en avant produits', checked: true },
        { text: 'Analytics avancés', checked: true }
      ]
    },
    {
      id: 'PREMIUM',
      name: 'PREMIUM',
      price: 15000,
      period: '/mois',
      features: [
        { text: 'Tout de PRO', checked: true },
        { text: 'Support prioritaire', checked: true },
        { text: 'Personnalisation', checked: true }
      ]
    }
  ];

  return (
    <div style={styles.container} className="fade-in">
      {/* Toast Notification */}
      {notification && (
        <div style={styles.toast} className="fade-in">
          <span>🎉 {notification}</span>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>Plans d'abonnement</h2>
        <p style={styles.subtitle}>
          Choisissez le plan idéal pour booster vos ventes auprès des producteurs et clients locaux.
        </p>
      </div>

      {/* Grid of plans */}
      <div style={styles.plansGrid}>
        {plans.map((plan) => {
          const isActive = activePlan === plan.id;
          return (
            <div 
              key={plan.id} 
              style={{
                ...styles.planCard,
                ...(plan.recommended ? styles.recommendedCard : {}),
                ...(isActive ? styles.activeCard : {})
              }}
            >
              {/* Recommended Badge */}
              {plan.recommended && (
                <div style={styles.recommendedBadge}>
                  RECOMMANDÉ
                </div>
              )}

              {/* Card Header */}
              <div style={styles.cardHeader}>
                <h3 style={styles.planName}>{plan.name}</h3>
                <div style={styles.priceWrapper}>
                  <span style={{
                    ...styles.price,
                    ...(plan.recommended ? styles.recommendedPrice : {})
                  }}>
                    {plan.price.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span style={styles.period}>{plan.period}</span>
                </div>
              </div>

              {/* Divider */}
              <div style={styles.divider}></div>

              {/* Features List */}
              <ul style={styles.featuresList}>
                {plan.features.map((feat, idx) => (
                  <li key={idx} style={styles.featureItem}>
                    {feat.checked ? (
                      <span style={styles.checkIcon}>✓</span>
                    ) : (
                      <span style={styles.crossIcon}>✗</span>
                    )}
                    <span style={{
                      ...styles.featureText,
                      ...(!feat.checked ? styles.featureTextDisabled : {})
                    }}>
                      {feat.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Subscribe Button */}
              {isActive ? (
                <button 
                  disabled 
                  style={styles.currentBtn}
                >
                  Actuel
                </button>
              ) : (
                <button 
                  onClick={() => handleSubscribe(plan.id)}
                  style={{
                    ...styles.subscribeBtn,
                    ...(plan.recommended ? styles.recommendedBtn : {})
                  }}
                >
                  S'abonner
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px 80px 24px',
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
    zIndex: 999,
    fontSize: '13px',
    fontWeight: '700',
    animation: 'slideInRight 0.3s ease-out forwards',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#212529',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: '1.6',
  },
  // Plans Grid
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    alignItems: 'stretch',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1.5px solid #dee2e6',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(0,0,0,0.01)',
    ':hover': {
      transform: 'translateY(-6px)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
      borderColor: '#1b4d3e',
    }
  },
  recommendedCard: {
    borderColor: '#e07a5f',
    borderWidth: '2.5px',
    boxShadow: '0 8px 20px rgba(224, 122, 95, 0.15)',
    transform: 'scale(1.02)',
    ':hover': {
      transform: 'scale(1.04) translateY(-4px)',
      boxShadow: '0 16px 32px rgba(224, 122, 95, 0.2)',
      borderColor: '#e07a5f',
    }
  },
  activeCard: {
    borderColor: '#1b4d3e',
    boxShadow: '0 8px 24px rgba(27, 77, 62, 0.08)',
  },
  recommendedBadge: {
    position: 'absolute',
    top: '0',
    left: '0',
    right: '0',
    backgroundColor: '#e07a5f',
    color: '#ffffff',
    textAlign: 'center',
    fontSize: '11px',
    fontWeight: '800',
    padding: '8px 0',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    letterSpacing: '0.05em',
  },
  cardHeader: {
    textAlign: 'center',
    marginTop: '12px',
    marginBottom: '28px',
  },
  planName: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#212529',
    marginBottom: '16px',
    letterSpacing: '0.03em',
  },
  priceWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  price: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#495057',
    lineHeight: '1.2',
  },
  recommendedPrice: {
    color: '#e07a5f',
  },
  period: {
    fontSize: '12px',
    color: '#868e96',
    fontWeight: '600',
    marginTop: '4px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e9ecef',
    width: '100%',
    marginBottom: '28px',
  },
  // Features List
  featuresList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '40px',
    flexGrow: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: '#495057',
    fontWeight: '500',
  },
  checkIcon: {
    color: '#2d6a4f',
    fontSize: '14px',
    fontWeight: '800',
  },
  crossIcon: {
    color: '#dc3545',
    fontSize: '14px',
    fontWeight: '800',
  },
  featureText: {
    lineHeight: '1.4',
  },
  featureTextDisabled: {
    color: '#adb5bd',
    textDecoration: 'line-through',
  },
  // Buttons
  currentBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#adb5bd', // grey/disabled
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'not-allowed',
    border: 'none',
    boxShadow: 'none',
  },
  subscribeBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: '#f1f3f5', // standard button background
    color: '#495057',
    fontSize: '13px',
    fontWeight: '700',
    border: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#e2e5e9',
      transform: 'translateY(-1px)',
    }
  },
  recommendedBtn: {
    backgroundColor: '#e07a5f',
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(224, 122, 95, 0.2)',
    ':hover': {
      backgroundColor: '#d0664b',
      boxShadow: '0 6px 14px rgba(224, 122, 95, 0.3)',
    }
  }
};
