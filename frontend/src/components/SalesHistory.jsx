import React, { useState } from 'react';
import { useDict, useLanguage } from '../context/LanguageContext';

// Avant : toutes les données (mois, catégories, transactions, statuts,
// période) étaient des chaînes françaises codées en dur, utilisées à la
// fois pour l'affichage ET pour le filtrage (recherche/statut/période).
// Résultat : impossible à traduire sans casser les filtres. On sépare
// maintenant une clé stable (ex. 'livree', 'banane_fraiche') du libellé
// affiché (fr/en), pour que la recherche et les filtres donnent
// exactement les mêmes résultats quelle que soit la langue affichée —
// chercher "pastèque" ou "watermelon" doit remonter la même ligne.

const PRODUCT_LABELS = {
  banane: { fr: 'Banane fraîche', en: 'Fresh banana' },
  tomate: { fr: 'Tomate fraîche', en: 'Fresh tomato' },
  mais: { fr: 'Maïs grain', en: 'Corn grain' },
  lait: { fr: 'Lait frais', en: 'Fresh milk' },
  ananas: { fr: 'Ananas Bio', en: 'Organic pineapple' },
  gombo: { fr: 'Gombo séché', en: 'Dried okra' },
};

const STATUS_LABELS = {
  livree: { fr: 'Livrée', en: 'Delivered' },
  en_livraison: { fr: 'En livraison', en: 'Shipping' },
  annulee: { fr: 'Annulée', en: 'Cancelled' },
};

const CATEGORY_LABELS = {
  fruits_legumes: { fr: 'Fruits & Légumes', en: 'Fruits & Vegetables' },
  cereales: { fr: 'Céréales', en: 'Grains' },
  laitiers: { fr: 'Produits laitiers', en: 'Dairy products' },
  epices: { fr: 'Épices & Condiments', en: 'Spices & Condiments' },
};

const chartData = [
  { monthKey: 'jan', sales: 380000, orders: 18 },
  { monthKey: 'fev', sales: 420000, orders: 22 },
  { monthKey: 'mar', sales: 310000, orders: 15 },
  { monthKey: 'avr', sales: 550000, orders: 28 },
  { monthKey: 'mai', sales: 490000, orders: 24 },
  { monthKey: 'jun', sales: 680000, orders: 34 },
];

const MONTH_LABELS = {
  jan: { fr: 'Jan', en: 'Jan' },
  fev: { fr: 'Fév', en: 'Feb' },
  mar: { fr: 'Mar', en: 'Mar' },
  avr: { fr: 'Avr', en: 'Apr' },
  mai: { fr: 'Mai', en: 'May' },
  jun: { fr: 'Jun', en: 'Jun' },
};

const categories = [
  { key: 'fruits_legumes', pct: 42, amount: '523,000', color: '#2d6a4f', icon: '🥭' },
  { key: 'cereales', pct: 28, amount: '348,500', color: '#40916c', icon: '🌾' },
  { key: 'laitiers', pct: 18, amount: '224,000', color: '#95d5b2', icon: '🥛' },
  { key: 'epices', pct: 12, amount: '149,500', color: '#d8f3dc', icon: '🌶️' },
];

const transactions = [
  { date: '15/05', productKey: 'banane', qty: '10 kg', amount: 25000, client: 'Bakari Sow', statusKey: 'livree' },
  { date: '14/05', productKey: 'tomate', qty: '5 kg', amount: 7500, client: 'Aminata Fall', statusKey: 'livree' },
  { date: '13/05', productKey: 'mais', qty: '20 kg', amount: 60000, client: 'Kofi Mensah', statusKey: 'en_livraison' },
  { date: '12/05', productKey: 'lait', qty: '25 L', amount: 30000, client: 'Fatou Diallo', statusKey: 'livree' },
  { date: '11/05', productKey: 'ananas', qty: '8 pcs', amount: 22400, client: 'Ibrahim Sagna', statusKey: 'livree' },
  { date: '10/05', productKey: 'gombo', qty: '3 kg', amount: 9000, client: 'Mariama Bah', statusKey: 'annulee' },
];

const periodKeys = ['7j', '30j', '3m', '1a'];
const statusKeys = ['toutes', 'livree', 'en_livraison', 'annulee'];

const translations = {
  fr: {
    pageTitle: 'Historique des ventes',
    pageSubtitle: 'Analyse détaillée de vos performances commerciales',
    exportBtn: 'Exporter CSV',
    exportToast: '📊 Export CSV en cours de génération...',
    periods: { '7j': '7 jours', '30j': '30 jours', '3m': '3 mois', '1a': '1 an' },
    statusLabels: { toutes: 'Toutes', ...Object.fromEntries(Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.fr])) },
    kpis: [
      { label: 'Total des ventes', value: '450,000', unit: 'FCFA', change: '+15%', up: true, icon: '💰' },
      { label: 'Commandes', value: '24', unit: '', change: '+8%', up: true, icon: '📦' },
      { label: 'Panier moyen', value: '18,750', unit: 'FCFA', change: '+5%', up: true, icon: '🛒' },
      { label: 'Produit top', value: 'Banane', unit: '45 ventes', change: '1er', up: true, icon: '🏆' },
    ],
    salesLabel: 'Ventes',
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
    statusLabels: { toutes: 'All', ...Object.fromEntries(Object.entries(STATUS_LABELS).map(([k, v]) => [k, v.en])) },
    kpis: [
      { label: 'Total sales', value: '450,000', unit: 'FCFA', change: '+15%', up: true, icon: '💰' },
      { label: 'Orders', value: '24', unit: '', change: '+8%', up: true, icon: '📦' },
      { label: 'Average basket', value: '18,750', unit: 'FCFA', change: '+5%', up: true, icon: '🛒' },
      { label: 'Top product', value: 'Banana', unit: '45 sales', change: '1st', up: true, icon: '🏆' },
    ],
    salesLabel: 'Sales',
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

export default function SalesHistory({ onBack }) {
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

  const maxSales = Math.max(...chartData.map(d => d.sales));

  // La recherche compare la requête aux libellés FR ET EN du produit, pas
  // seulement à celui actuellement affiché : taper "pastèque" ou son
  // équivalent anglais doit retrouver la même ligne, quelle que soit la
  // langue active de l'interface.
  const filtered = transactions.filter(row => {
    const q = searchQuery.toLowerCase();
    const productFr = PRODUCT_LABELS[row.productKey].fr.toLowerCase();
    const productEn = PRODUCT_LABELS[row.productKey].en.toLowerCase();
    const matchSearch = productFr.includes(q) || productEn.includes(q) || row.client.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'toutes' || row.statusKey === statusFilter;
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
        {t.kpis.map((k, i) => (
          <div key={i} style={styles.kpiCard}>
            <div style={styles.kpiRow}>
              <div style={styles.kpiIconWrap}>
                <span style={styles.kpiIcon}>{k.icon}</span>
              </div>
              <span style={{
                ...styles.kpiChange,
                color: k.up ? '#2d6a4f' : '#dc3545',
                backgroundColor: k.up ? '#d8f3dc' : '#fde8ea',
              }}>
                {k.up ? '▲' : '▼'} {k.change}
              </span>
            </div>
            <p style={styles.kpiLabel}>{k.label}</p>
            <p style={styles.kpiValue}>
              {k.value}
              <span style={styles.kpiUnit}> {k.unit}</span>
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
              <h3 style={styles.cardTitle}>{t.salesLabel} — {t.periods[selectedPeriod]}</h3>
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
                const ordH = (d.orders / 40) * 100;
                return (
                  <div key={d.monthKey} style={styles.barGroupDouble}
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
                    <span style={styles.barLabel}>{MONTH_LABELS[d.monthKey][lang]}</span>
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
              <text x="70" y="66" textAnchor="middle" fill="#212529" fontSize="14" fontWeight="800">450K</text>
              <text x="70" y="80" textAnchor="middle" fill="#adb5bd" fontSize="9" fontWeight="600">FCFA</text>
            </svg>
          </div>

          <div style={styles.categoryList}>
            {categories.map((cat, i) => (
              <div key={i} style={styles.categoryItem}>
                <div style={styles.catLeft}>
                  <div style={{ ...styles.catDot, backgroundColor: cat.color }} />
                  <span style={styles.catIcon}>{cat.icon}</span>
                  <span style={styles.catName}>{CATEGORY_LABELS[cat.key][lang]}</span>
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
                  const statusStyles = {
                    livree: { color: '#2d6a4f', bg: '#d8f3dc' },
                    en_livraison: { color: '#0066cc', bg: '#e0f0ff' },
                    annulee: { color: '#dc3545', bg: '#fde8ea' },
                  }[row.statusKey] || { color: '#6c757d', bg: '#f1f3f5' };
                  const productLabel = PRODUCT_LABELS[row.productKey][lang];

                  return (
                    <tr key={i} style={styles.tr}>
                      <td style={styles.td}><span style={styles.dateChip}>{row.date}</span></td>
                      <td style={styles.td}><strong style={{ color: '#212529' }}>{productLabel}</strong></td>
                      <td style={styles.td}>{row.qty}</td>
                      <td style={styles.td}><strong style={{ color: '#e07a5f' }}>{row.amount.toLocaleString(lang === 'en' ? 'en-US' : 'fr-FR')} FCFA</strong></td>
                      <td style={styles.td}>{row.client}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          color: statusStyles.color,
                          backgroundColor: statusStyles.bg,
                        }}>
                          {t.statusLabels[row.statusKey]}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          style={styles.actionLink}
                          onClick={() => showToast(t.detailToast(productLabel, row.client))}
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
