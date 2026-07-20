import React, { useState } from 'react';
import { useDict, useLanguage } from '../context/LanguageContext';

// Avant : toutes les données (mois, catégories, transactions, statuts,
// KPIs) étaient des tableaux fictifs codés en dur (mêmes 6 "ventes" pour
// tout le monde, montants inventés). Elles sont désormais calculées à
// partir des vraies commandes reçues (adminOrders) filtrées sur les
// produits de ce vendeur (vendeurProducts), comme le fait déjà
// SellerDashboard pour son propre graphique de ventes mensuelles.

// Les 6 statuts réels renvoyés par commande-service (voir
// STATUT_BACKEND_TO_FRANCAIS dans commandeMapping.js).
const STATUS_ORDER = ['En attente', 'Validée', 'En préparation', 'En livraison', 'Livrée', 'Annulée'];
const STATUS_EN = {
  'En attente': 'Pending',
  'Validée': 'Validated',
  'En préparation': 'Preparing',
  'En livraison': 'Shipping',
  'Livrée': 'Delivered',
  'Annulée': 'Cancelled',
};
const STATUS_COLORS = {
  'En attente': { color: '#f0a500', bg: '#fff9e6' },
  'Validée': { color: '#6c757d', bg: '#f1f3f5' },
  'En préparation': { color: '#6c757d', bg: '#f1f3f5' },
  'En livraison': { color: '#0066cc', bg: '#e0f0ff' },
  'Livrée': { color: '#2d6a4f', bg: '#d8f3dc' },
  'Annulée': { color: '#dc3545', bg: '#fde8ea' },
};

const MONTH_LABELS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Palette cyclique pour le donut des catégories (les vraies catégories du
// vendeur ne sont pas connues à l'avance, contrairement à l'ancienne
// liste fixe fruits/céréales/laitiers/épices).
const CATEGORY_COLORS = ['#2d6a4f', '#40916c', '#95d5b2', '#d8f3dc', '#74c69d', '#b7e4c7'];

const periodKeys = ['7j', '30j', '3m', '1a'];
const PERIOD_DAYS = { '7j': 7, '30j': 30, '3m': 90, '1a': 365 };
const statusKeys = ['toutes', ...STATUS_ORDER];

const translations = {
  fr: {
    pageTitle: 'Historique des ventes',
    pageSubtitle: 'Analyse détaillée de vos performances commerciales',
    exportBtn: 'Exporter CSV',
    exportToast: '📊 Export CSV en cours de génération...',
    periods: { '7j': '7 jours', '30j': '30 jours', '3m': '3 mois', '1a': '1 an' },
    statusLabels: { toutes: 'Toutes', ...Object.fromEntries(STATUS_ORDER.map(s => [s, s])) },
    kpiLabels: {
      totalSales: 'Total des ventes', orders: 'Commandes', avgBasket: 'Panier moyen', topProduct: 'Produit top',
      noSales: 'Aucune vente', sales: (n) => `${n} vente${n > 1 ? 's' : ''}`,
    },
    salesLabel: 'Ventes',
    last6Months: '6 derniers mois',
    ordersLabel: 'Commandes',
    revenueSub: "Chiffre d'affaires mensuel en FCFA",
    topCategoriesTitle: 'Top catégories',
    topCategoriesSub: 'Répartition par catégorie',
    recentSalesTitle: 'Ventes récentes',
    transactionCount: (n) => `${n} transaction(s)`,
    searchPlaceholder: 'Rechercher...',
    tableHeaders: ['Date', 'Produit', 'Quantité', 'Montant', 'Client', 'Statut', 'Actions'],
    noTransactions: 'Aucune transaction trouvée.',
    view: 'Voir',
    detailToast: (product, client) => `📄 Détail vente — ${product} pour ${client}`,
    totalsLabel: (n) => `${n} vente(s) · Total :`,
  },
  en: {
    pageTitle: 'Sales history',
    pageSubtitle: 'Detailed analysis of your commercial performance',
    exportBtn: 'Export CSV',
    exportToast: '📊 CSV export in progress...',
    periods: { '7j': '7 days', '30j': '30 days', '3m': '3 months', '1a': '1 year' },
    statusLabels: { toutes: 'All', ...Object.fromEntries(STATUS_ORDER.map(s => [s, STATUS_EN[s]])) },
    kpiLabels: {
      totalSales: 'Total sales', orders: 'Orders', avgBasket: 'Average basket', topProduct: 'Top product',
      noSales: 'No sales yet', sales: (n) => `${n} sale${n > 1 ? 's' : ''}`,
    },
    salesLabel: 'Sales',
    last6Months: 'Last 6 months',
    ordersLabel: 'Orders',
    revenueSub: 'Monthly revenue in FCFA',
    topCategoriesTitle: 'Top categories',
    topCategoriesSub: 'Breakdown by category',
    recentSalesTitle: 'Recent sales',
    transactionCount: (n) => `${n} transaction(s)`,
    searchPlaceholder: 'Search...',
    tableHeaders: ['Date', 'Product', 'Quantity', 'Amount', 'Client', 'Status', 'Actions'],
    noTransactions: 'No transaction found.',
    view: 'View',
    detailToast: (product, client) => `📄 Sale detail — ${product} for ${client}`,
    totalsLabel: (n) => `${n} sale(s) · Total:`,
  },
};

export default function SalesHistory({ onBack, adminOrders = [], vendeurProducts = [] }) {
  const t = useDict(translations);
  const { lang } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState('30j');
  const [hoveredBar, setHoveredBar] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const [statusFilter, setStatusFilter] = useState('toutes');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // ===== Transactions réelles =====
  // Une "transaction" = une ligne de commande dont le produit appartient
  // à ce vendeur (même filtrage que SellerDashboard pour ses revenus).
  const allTransactions = [];
  adminOrders.forEach(order => {
    (order.items || []).forEach(item => {
      const produit = vendeurProducts.find(p => p.name === item.nomProduit || p.name === item.name);
      if (!produit) return;
      allTransactions.push({
        date: order.date,
        dateISO: order.dateISO,
        product: item.nomProduit || item.name || produit.name,
        category: produit.category || 'Général',
        qty: `${item.quantity} unité(s)`,
        amount: item.subtotal || 0,
        client: order.client,
        status: order.status,
        orderId: order.id,
      });
    });
  });
  allTransactions.sort((a, b) => new Date(b.dateISO || 0) - new Date(a.dateISO || 0));

  // ===== Filtre période (7j/30j/3m/1a) =====
  // Auparavant purement décoratif : les boutons changeaient de style sans
  // jamais filtrer les données affichées.
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - PERIOD_DAYS[selectedPeriod]);
  const transactionsInPeriod = allTransactions.filter(txn => {
    if (!txn.dateISO) return true;
    const d = new Date(txn.dateISO);
    return d >= periodStart && d <= now;
  });

  // ===== KPIs =====
  const totalSales = transactionsInPeriod.reduce((s, t2) => s + t2.amount, 0);
  const ordersInPeriod = new Set(transactionsInPeriod.map(t2 => t2.orderId)).size;
  const avgBasket = ordersInPeriod > 0 ? Math.round(totalSales / ordersInPeriod) : 0;
  const salesByProduct = {};
  transactionsInPeriod.forEach(t2 => {
    salesByProduct[t2.product] = (salesByProduct[t2.product] || 0) + t2.amount;
  });
  const topProductEntry = Object.entries(salesByProduct).sort((a, b) => b[1] - a[1])[0];
  const fmt = (n) => n.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR');
  const kpis = [
    { label: t.kpiLabels.totalSales, value: fmt(totalSales), unit: 'FCFA', icon: '💰' },
    { label: t.kpiLabels.orders, value: String(ordersInPeriod), unit: '', icon: '📦' },
    { label: t.kpiLabels.avgBasket, value: fmt(avgBasket), unit: 'FCFA', icon: '🛒' },
    { label: t.kpiLabels.topProduct, value: topProductEntry ? topProductEntry[0] : t.kpiLabels.noSales, unit: '', icon: '🏆' },
  ];

  // ===== Graphique : 6 derniers mois (dynamique, pas Jan-Jun figé) =====
  const monthLabels = lang === 'en' ? MONTH_LABELS_EN : MONTH_LABELS_FR;
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthTxns = allTransactions.filter(t2 => {
      if (!t2.dateISO) return false;
      const td = new Date(t2.dateISO);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    return {
      label: monthLabels[d.getMonth()],
      sales: monthTxns.reduce((s, t2) => s + t2.amount, 0),
      orders: new Set(monthTxns.map(t2 => t2.orderId)).size,
    };
  });
  const maxSales = Math.max(1, ...chartData.map(d => d.sales));
  const maxOrders = Math.max(1, ...chartData.map(d => d.orders));

  // ===== Catégories =====
  const salesByCategory = {};
  transactionsInPeriod.forEach(t2 => {
    salesByCategory[t2.category] = (salesByCategory[t2.category] || 0) + t2.amount;
  });
  const categories = Object.entries(salesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount], i) => ({
      name,
      amount: fmt(amount),
      pct: totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  // La recherche compare la requête au nom du produit et au client.
  const filtered = transactionsInPeriod.filter(row => {
    const q = searchQuery.toLowerCase();
    const matchSearch = row.product.toLowerCase().includes(q) || row.client.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'toutes' || row.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={styles.container} className="fade-in">
      {toast && <div style={styles.toast} className="fade-in">{toast}</div>}

      {/* ── Header ── */}
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.pageTitle}>{t.pageTitle}</h2>
          <p style={styles.pageSubtitle}>{t.pageSubtitle}</p>
        </div>
        <div style={styles.headerRight}>
          {/* Period Selector */}
          <div style={styles.periodSelector}>
            {periodKeys.map(p => (
              <button
                key={p}
                style={{
                  ...styles.periodBtn,
                  ...(selectedPeriod === p ? styles.periodBtnActive : {}),
                }}
                onClick={() => setSelectedPeriod(p)}
              >
                {t.periods[p]}
              </button>
            ))}
          </div>
          <button
            style={styles.exportBtn}
            onClick={() => showToast(t.exportToast)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {t.exportBtn}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={styles.kpiGrid}>
        {kpis.map((k, i) => (
          <div key={i} style={styles.kpiCard}>
            <div style={styles.kpiRow}>
              <div style={styles.kpiIconWrap}>
                <span style={styles.kpiIcon}>{k.icon}</span>
              </div>
            </div>
            <p style={styles.kpiLabel}>{k.label}</p>
            <p style={styles.kpiValue}>
              {k.value}
              {k.unit && <span style={styles.kpiUnit}> {k.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={styles.chartsGrid}>

        {/* Bar Chart: Sales last 6 months */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>{t.salesLabel} — {t.last6Months}</h3>
              <p style={styles.cardSub}>{t.revenueSub}</p>
            </div>
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendDot, backgroundColor: '#2d6a4f' }} />
                <span style={styles.legendLabel}>{t.salesLabel}</span>
              </div>
              <div style={styles.legendItem}>
                <div style={{ ...styles.legendDot, backgroundColor: '#e07a5f' }} />
                <span style={styles.legendLabel}>{t.ordersLabel}</span>
              </div>
            </div>
          </div>

          <div style={styles.chartContainer}>
            <div style={styles.chartBars}>
              {chartData.map((d, i) => {
                const isHov = hoveredBar === i;
                const barH = (d.sales / maxSales) * 100;
                const ordH = (d.orders / maxOrders) * 100;
                return (
                  <div key={i} style={styles.barGroupDouble}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    {isHov && (
                      <div style={styles.chartTooltip}>
                        <div style={styles.tooltipRow}>
                          <span style={styles.tooltipLabel}>{t.salesLabel}</span>
                          <strong style={{ color: '#2d6a4f' }}>{d.sales.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} FCFA</strong>
                        </div>
                        <div style={styles.tooltipRow}>
                          <span style={styles.tooltipLabel}>{t.ordersLabel}</span>
                          <strong style={{ color: '#e07a5f' }}>{d.orders}</strong>
                        </div>
                      </div>
                    )}
                    <div style={styles.doubleBars}>
                      <div style={{
                        ...styles.barSingle,
                        height: `${barH}%`,
                        backgroundColor: isHov ? '#1b4d3e' : '#2d6a4f',
                      }} />
                      <div style={{
                        ...styles.barSingle,
                        height: `${ordH}%`,
                        backgroundColor: isHov ? '#c05a40' : '#e07a5f',
                      }} />
                    </div>
                    <span style={styles.barLabel}>{d.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Donut-style Categories */}
        <div style={styles.donutCard}>
          <div style={styles.cardHeader}>
            <div>
              <h3 style={styles.cardTitle}>{t.topCategoriesTitle}</h3>
              <p style={styles.cardSub}>{t.topCategoriesSub}</p>
            </div>
          </div>

          {/* Visual donut (SVG-based) */}
          <div style={styles.donutWrapper}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              {(() => {
                let angle = -90;
                return categories.map((cat, i) => {
                  const startAngle = angle;
                  const slice = (cat.pct / 100) * 360;
                  angle += slice;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (angle * Math.PI) / 180;
                  const cx = 70, cy = 70, r = 50, innerR = 32;
                  const x1 = cx + r * Math.cos(startRad);
                  const y1 = cy + r * Math.sin(startRad);
                  const x2 = cx + r * Math.cos(endRad);
                  const y2 = cy + r * Math.sin(endRad);
                  const xi1 = cx + innerR * Math.cos(startRad);
                  const yi1 = cy + innerR * Math.sin(startRad);
                  const xi2 = cx + innerR * Math.cos(endRad);
                  const yi2 = cy + innerR * Math.sin(endRad);
                  const large = slice > 180 ? 1 : 0;
                  return (
                    <path
                      key={i}
                      d={`M ${xi1} ${yi1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 ${large} 0 ${xi1} ${yi1} Z`}
                      fill={cat.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  );
                });
              })()}
              <text x="70" y="66" textAnchor="middle" fill="#212529" fontSize="14" fontWeight="800">
                {totalSales >= 1000 ? `${Math.round(totalSales / 1000)}K` : totalSales}
              </text>
              <text x="70" y="80" textAnchor="middle" fill="#adb5bd" fontSize="9" fontWeight="600">FCFA</text>
            </svg>
          </div>

          <div style={styles.categoryList}>
            {categories.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#adb5bd', textAlign: 'center', padding: '12px 0' }}>{t.kpiLabels.noSales}</p>
            ) : categories.map((cat, i) => (
              <div key={i} style={styles.categoryItem}>
                <div style={styles.catLeft}>
                  <div style={{ ...styles.catDot, backgroundColor: cat.color }} />
                  <span style={styles.catName}>{cat.name}</span>
                </div>
                <div style={styles.catRight}>
                  <span style={styles.catAmount}>{cat.amount} F</span>
                  <span style={{ ...styles.catPct, color: cat.color }}>{cat.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Transactions Table ── */}
      <div style={styles.tableCard}>
        <div style={styles.cardHeader}>
          <div>
            <h3 style={styles.cardTitle}>{t.recentSalesTitle}</h3>
            <p style={styles.cardSub}>{t.transactionCount(filtered.length)}</p>
          </div>
          <div style={styles.tableControls}>
            {/* Status filter */}
            <div style={styles.filterTabs}>
              {statusKeys.map(s => (
                <button
                  key={s}
                  style={{
                    ...styles.filterTab,
                    ...(statusFilter === s ? styles.filterTabActive : {}),
                  }}
                  onClick={() => setStatusFilter(s)}
                >
                  {t.statusLabels[s]}
                </button>
              ))}
            </div>
            {/* Search */}
            <div style={styles.searchWrapper}>
              <svg style={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {t.tableHeaders.map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: '#adb5bd' }}>
                    {t.noTransactions}
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const statusStyles = STATUS_COLORS[row.status] || { color: '#6c757d', bg: '#f1f3f5' };

                  return (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}><span style={styles.dateChip}>{row.date}</span></td>
                      <td style={styles.td}><strong style={{ color: '#212529' }}>{row.product}</strong></td>
                      <td style={styles.td}>{row.qty}</td>
                      <td style={styles.td}><strong style={{ color: '#e07a5f' }}>{row.amount.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} FCFA</strong></td>
                      <td style={styles.td}>{row.client}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          color: statusStyles.color,
                          backgroundColor: statusStyles.bg,
                        }}>
                          {t.statusLabels[row.status] || row.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionLink}
                          onClick={() => showToast(t.detailToast(row.product, row.client))}
                        >
                          {t.view}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Totals row */}
        <div style={styles.totalsRow}>
          <span style={styles.totalsLabel}>{t.totalsLabel(filtered.length)}</span>
          <span style={styles.totalsValue}>
            {filtered.reduce((acc, r) => acc + r.amount, 0).toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} FCFA
          </span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
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
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    borderBottom: '1.5px solid #dee2e6',
    paddingBottom: '18px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#212529',
    letterSpacing: '-0.02em',
    marginBottom: '4px',
  },
  pageSubtitle: {
    fontSize: '13px',
    color: '#6c757d',
    fontWeight: '500',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  periodSelector: {
    display: 'flex',
    gap: '2px',
    backgroundColor: '#f1f3f5',
    padding: '3px',
    borderRadius: '10px',
  },
  periodBtn: {
    padding: '7px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6c757d',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  periodBtnActive: {
    backgroundColor: '#ffffff',
    color: '#1b4d3e',
    fontWeight: '800',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  exportBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '10px 16px',
    borderRadius: '10px',
    border: '1.5px solid #dee2e6',
    backgroundColor: '#ffffff',
    color: '#343a40',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  // KPI
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e9ecef',
    padding: '20px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.02)',
  },
  kpiRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  kpiIconWrap: {
    width: '36px',
    height: '36px',
    borderRadius: '9px',
    backgroundColor: '#f0faf3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  kpiIcon: {},
  kpiChange: {
    fontSize: '10px',
    fontWeight: '800',
    padding: '3px 7px',
    borderRadius: '20px',
  },
  kpiLabel: {
    fontSize: '11px',
    color: '#868e96',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '4px',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#212529',
    letterSpacing: '-0.02em',
  },
  kpiUnit: {
    fontSize: '11px',
    color: '#adb5bd',
    fontWeight: '600',
  },
  // Charts
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e9ecef',
    padding: '22px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.02)',
  },
  donutCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e9ecef',
    padding: '22px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '18px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#212529',
    marginBottom: '2px',
  },
  cardSub: {
    fontSize: '12px',
    color: '#adb5bd',
    fontWeight: '500',
  },
  chartLegend: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  legendLabel: {
    fontSize: '11px',
    color: '#6c757d',
    fontWeight: '600',
  },
  chartContainer: {
    height: '140px',
  },
  chartBars: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '10px',
    height: '100%',
    borderBottom: '2px solid #f1f3f5',
  },
  barGroupDouble: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
    position: 'relative',
    cursor: 'pointer',
  },
  chartTooltip: {
    position: 'absolute',
    top: '-64px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#212529',
    borderRadius: '8px',
    padding: '8px 12px',
    zIndex: 10,
    minWidth: '160px',
  },
  tooltipRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    fontSize: '11px',
    marginBottom: '2px',
  },
  tooltipLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  doubleBars: {
    display: 'flex',
    gap: '3px',
    alignItems: 'flex-end',
    width: '100%',
    flex: 1,
  },
  barSingle: {
    flex: 1,
    borderRadius: '4px 4px 0 0',
    transition: 'all 0.2s ease',
  },
  barLabel: {
    fontSize: '9px',
    color: '#adb5bd',
    fontWeight: '600',
  },
  // Donut
  donutWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  categoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  categoryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  catDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  catIcon: {
    fontSize: '14px',
  },
  catName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#343a40',
  },
  catRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  catAmount: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#343a40',
  },
  catPct: {
    fontSize: '11px',
    fontWeight: '800',
    minWidth: '30px',
    textAlign: 'right',
  },
  // Table Card
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e9ecef',
    padding: '22px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.02)',
  },
  tableControls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterTabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f1f3f5',
    padding: '3px',
    borderRadius: '8px',
  },
  filterTab: {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    fontSize: '11px',
    fontWeight: '600',
    color: '#6c757d',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
    color: '#1b4d3e',
    fontWeight: '800',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    pointerEvents: 'none',
  },
  searchInput: {
    padding: '8px 12px 8px 30px',
    borderRadius: '8px',
    border: '1.5px solid #e9ecef',
    fontSize: '12px',
    color: '#343a40',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    width: '160px',
    fontFamily: 'inherit',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    fontSize: '10px',
    fontWeight: '800',
    color: '#868e96',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '2px solid #f1f3f5',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f8f9fa',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '13px 12px',
    color: '#495057',
    fontWeight: '500',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
  },
  dateChip: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#6c757d',
    backgroundColor: '#f1f3f5',
    padding: '3px 8px',
    borderRadius: '6px',
    fontFamily: 'monospace',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '700',
  },
  actionLink: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#1b4d3e',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
    marginTop: '16px',
    paddingTop: '14px',
    borderTop: '2px solid #f1f3f5',
  },
  totalsLabel: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#6c757d',
  },
  totalsValue: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#1b4d3e',
  },
};
