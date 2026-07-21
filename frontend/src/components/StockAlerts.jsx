import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';

const alertConfig = {
  CRITIQUE: { color: '#dc3545', bg: '#fde8ea' },
  FAIBLE: { color: '#e07a5f', bg: '#fdf1ed' },
};

const priorityConfig = {
  Urgent: { color: '#dc3545', bg: '#fde8ea' },
  Haute: { color: '#e07a5f', bg: '#fdf1ed' },
  Moyenne: { color: '#f0a500', bg: '#fff9e6' },
};

// Seuils d'alerte, cohérents avec ceux déjà utilisés dans SellerDashboard
// (lowStockItems = vendeurProducts.filter(p => p.stock <= 10)) :
// - stock <= 3  -> CRITIQUE (rupture imminente)
// - stock <= 10 -> FAIBLE
const CRITICAL_THRESHOLD = 3;
const LOW_THRESHOLD = 10;

export default function StockAlerts({ onBack, vendeurProducts = [] }) {
  const { t } = useTranslation();
  // Alertes construites à partir des vrais produits du vendeur (stock réel
  // renvoyé par produit-service), et non plus d'une liste de produits
  // fictifs (banane, tomate, maïs...) identique pour tout le monde.
  const items = vendeurProducts
    .filter(p => (p.stock ?? 0) <= LOW_THRESHOLD)
    .map(p => ({
      id: p.id,
      product: p.name,
      emoji: '🌾',
      stock: p.stock ?? 0,
      unit: t('stockAlerts.unit'),
      category: p.category || t('stockAlerts.categoryGeneral'),
      alert: (p.stock ?? 0) <= CRITICAL_THRESHOLD ? 'CRITIQUE' : 'FAIBLE',
      priority: (p.stock ?? 0) <= CRITICAL_THRESHOLD ? 'Urgent' : (p.stock ?? 0) <= 6 ? 'Haute' : 'Moyenne',
    }))
    .sort((a, b) => a.stock - b.stock);

  const [filter, setFilter] = useState('Toutes');
  const [toast, setToast] = useState('');
  const [orderedIds, setOrderedIds] = useState([]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const critiques = items.filter(i => i.alert === 'CRITIQUE');
  const faibles = items.filter(i => i.alert === 'FAIBLE');

  const filtered = items.filter(i =>
    filter === 'Toutes' ? true :
    filter === 'Critique' ? i.alert === 'CRITIQUE' :
    i.alert === 'FAIBLE'
  );

  const handleOrder = (id) => {
    setOrderedIds(prev => [...prev, id]);
    const item = items.find(i => i.id === id);
    showToast(t('stockAlerts.orderToast', { product: item.product }));
  };

  const handleOrderAll = () => {
    setOrderedIds(items.filter(i => i.alert === 'CRITIQUE').map(i => i.id));
    showToast(t('stockAlerts.orderAllToast', { count: critiques.length }));
  };

  if (items.length === 0) {
    return (
      <div style={styles.container} className="fade-in">
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          {t('stockAlerts.back', { defaultValue: 'Retour' })}
        </button>
        <div style={styles.emptyOk}>
          <span style={{ fontSize: '40px' }}>✅</span>
          <h2 style={styles.emptyOkTitle}>{t('stockAlerts.noAlertsTitle')}</h2>
          <p style={styles.emptyOkText}>{t('stockAlerts.noAlertsText', { threshold: LOW_THRESHOLD })}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container} className="fade-in">

      {toast && <div style={styles.toast} className="fade-in">{toast}</div>}

      <button onClick={onBack} style={styles.backBtn}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} />
        {t('stockAlerts.back', { defaultValue: 'Retour' })}
      </button>

      {/* ── Alert Banner ── */}
      <div style={styles.alertBanner}>
        <div style={styles.bannerLeft}>
          <div style={styles.bannerIconPulse}>
            <span style={styles.bannerIcon}>⚠️</span>
          </div>
          <div>
            <h2 style={styles.bannerTitle}>{t('stockAlerts.bannerTitle')}</h2>
            <p style={styles.bannerSubtitle}>
              {t('stockAlerts.bannerSubtitle', { count: critiques.length })}
            </p>
          </div>
        </div>
        <div style={styles.bannerRight}>
          <button style={styles.bannerBtn} onClick={handleOrderAll}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {t('stockAlerts.orderAllUrgent')}
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLeft}>
            <div style={{ ...styles.summaryIconWrap, backgroundColor: '#fde8ea' }}>
              <span style={styles.summaryIcon}>🔴</span>
            </div>
            <div>
              <p style={{ ...styles.summaryCount, color: '#dc3545' }}>{t('stockAlerts.criticalCount', { count: critiques.length })}</p>
              <p style={styles.summaryDesc}>{t('stockAlerts.criticalDesc')}</p>
            </div>
          </div>
          <div style={{ ...styles.summaryLine, backgroundColor: '#dc3545' }} />
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.summaryLeft}>
            <div style={{ ...styles.summaryIconWrap, backgroundColor: '#fdf1ed' }}>
              <span style={styles.summaryIcon}>🟡</span>
            </div>
            <div>
              <p style={{ ...styles.summaryCount, color: '#e07a5f' }}>{t('stockAlerts.lowCount', { count: faibles.length })}</p>
              <p style={styles.summaryDesc}>{t('stockAlerts.lowDesc')}</p>
            </div>
          </div>
          <div style={{ ...styles.summaryLine, backgroundColor: '#e07a5f' }} />
        </div>
      </div>

      {/* ── Filter Tabs + Table ── */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div style={styles.tableHeaderLeft}>
            <h3 style={styles.tableTitle}>{t('stockAlerts.detailTitle')}</h3>
            <p style={styles.tableSub}>{t('stockAlerts.productCount', { count: filtered.length })}</p>
          </div>
          <div style={styles.filterTabs}>
            {['Toutes', 'Critique', 'Faible'].map(f => (
              <button
                key={f}
                style={{
                  ...styles.filterTab,
                  ...(filter === f ? styles.filterTabActive : {}),
                }}
                onClick={() => setFilter(f)}
              >
                {f === 'Critique' && '🔴 '}{f === 'Faible' && '🟡 '}
                {f === 'Toutes' ? t('stockAlerts.filterAll') : f === 'Critique' ? t('stockAlerts.filterCritical') : t('stockAlerts.filterLow')}
                <span style={{
                  ...styles.filterCount,
                  backgroundColor: filter === f ? '#1b4d3e' : '#e9ecef',
                  color: filter === f ? '#fff' : '#6c757d',
                }}>
                  {f === 'Toutes' ? items.length : f === 'Critique' ? critiques.length : faibles.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeadRow}>
                {[
                  t('stockAlerts.colProduct'),
                  t('stockAlerts.colStock'),
                  t('stockAlerts.colAlert'),
                  t('stockAlerts.colPriority'),
                  t('stockAlerts.colAction'),
                ].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isOrdered = orderedIds.includes(item.id);
                const alertCfg = alertConfig[item.alert];
                const priCfg = priorityConfig[item.priority];

                return (
                  <tr key={item.id} style={{
                    ...styles.tr,
                    backgroundColor: item.alert === 'CRITIQUE' ? '#fff9f9' : '#fffdf8',
                  }}>
                    <td style={styles.td}>
                      <div style={styles.productCell}>
                        <div style={styles.productEmoji}>{item.emoji}</div>
                        <div>
                          <p style={styles.productName}>{item.product}</p>
                          <p style={styles.productCategory}>{item.category}</p>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <strong style={{ color: item.alert === 'CRITIQUE' ? '#dc3545' : '#e07a5f', fontSize: '14px' }}>
                        {item.stock} {item.unit}
                      </strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.alertBadge,
                        color: alertCfg.color,
                        backgroundColor: alertCfg.bg,
                      }}>
                        {item.alert === 'CRITIQUE' ? t('stockAlerts.alertCritical') : t('stockAlerts.alertLow')}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.priorityBadge,
                        color: priCfg.color,
                        backgroundColor: priCfg.bg,
                      }}>
                        {item.priority === 'Urgent' ? t('stockAlerts.priorityUrgent') : item.priority === 'Haute' ? t('stockAlerts.priorityHigh') : t('stockAlerts.priorityMedium')}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.orderBtn,
                          ...(isOrdered ? styles.orderBtnDone : {}),
                        }}
                        onClick={() => !isOrdered && handleOrder(item.id)}
                        disabled={isOrdered}
                      >
                        {isOrdered ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {t('stockAlerts.ordered')}
                          </>
                        ) : (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                            {t('stockAlerts.order')}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom CTA */}
        <div style={styles.bottomCTA}>
          <div style={styles.ctaInfo}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6c757d" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span style={styles.ctaInfoText}>
              {t('stockAlerts.ctaText')}
            </span>
          </div>
          <button
            style={styles.ctaBtn}
            onClick={handleOrderAll}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
            </svg>
            {t('stockAlerts.orderImmediately')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
    marginBottom: '16px',
  },
  emptyOk: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '80px 24px',
    textAlign: 'center',
  },
  emptyOkTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#212529',
    margin: 0,
  },
  emptyOkText: {
    fontSize: '13px',
    color: '#6c757d',
    margin: 0,
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 0 60px 0',
    width: '100%',
  },
  toast: {
    position: 'fixed',
    bottom: '24px',    right: '24px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    padding: '14px 20px',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    zIndex: 9999,
    fontSize: '13px',
    fontWeight: '700',
  },
  // Alert Banner
  alertBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    background: 'linear-gradient(135deg, #c0392b 0%, #dc3545 50%, #e74c3c 100%)',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  bannerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  bannerIconPulse: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 2s infinite',
    flexShrink: 0,
  },
  bannerIcon: {
    fontSize: '24px',
  },
  bannerTitle: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: '0.06em',
    marginBottom: '4px',
  },
  bannerSubtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '500',
  },
  bannerRight: {},
  bannerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 22px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    border: '1.5px solid rgba(255,255,255,0.35)',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    transition: 'all 0.2s',
  },
  // Summary Cards
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
    padding: '0 24px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e9ecef',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0,0,0,0.02)',
  },
  summaryLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
  },
  summaryIconWrap: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
  },
  summaryIcon: {},
  summaryCount: {
    fontSize: '16px',
    fontWeight: '800',
    marginBottom: '4px',
  },
  summaryDesc: {
    fontSize: '12px',
    color: '#6c757d',
    lineHeight: '1.4',
  },
  summaryLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
  },
  // Table Card
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    margin: '0 24px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tableHeaderLeft: {},
  tableTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#212529',
    marginBottom: '2px',
  },
  tableSub: {
    fontSize: '12px',
    color: '#adb5bd',
    fontWeight: '500',
  },
  filterTabs: {
    display: 'flex',
    gap: '6px',
  },
  filterTab: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e9ecef',
    backgroundColor: '#ffffff',
    color: '#6c757d',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterTabActive: {
    borderColor: '#1b4d3e',
    backgroundColor: '#e9f5ee',
    color: '#1b4d3e',
  },
  filterCount: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  // Table
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    marginBottom: '16px',
  },
  tableHeadRow: {
    backgroundColor: '#f8f9fa',
  },
  th: {
    textAlign: 'left',
    padding: '11px 14px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#868e96',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1.5px solid #e9ecef',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f3f5',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '14px 14px',
    verticalAlign: 'middle',
  },
  productCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  productEmoji: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    flexShrink: 0,
    border: '1px solid #e9ecef',
  },
  productName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#212529',
    marginBottom: '2px',
  },
  productCategory: {
    fontSize: '11px',
    color: '#adb5bd',
    fontWeight: '500',
  },
  thresholdText: {
    fontSize: '13px',
    color: '#6c757d',
    fontWeight: '500',
  },
  fillWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  fillBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    minWidth: '70px',
  },
  fillFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.4s ease',
  },
  fillPct: {
    fontSize: '11px',
    fontWeight: '800',
    minWidth: '32px',
    textAlign: 'right',
  },
  alertBadge: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.02em',
  },
  priorityBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },
  orderBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#dc3545',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  orderBtnDone: {
    backgroundColor: '#2d6a4f',
    cursor: 'not-allowed',
  },
  // Bottom CTA
  bottomCTA: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
    gap: '16px',
    flexWrap: 'wrap',
  },
  ctaInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  ctaInfoText: {
    fontSize: '12px',
    color: '#6c757d',
    lineHeight: '1.4',
    fontWeight: '500',
  },
  ctaBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 24px',
    borderRadius: '10px',
    backgroundColor: '#dc3545',
    border: 'none',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(220,53,69,0.25)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
};
