// src/components/SellerDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Bell, User,
  BarChart3, AlertTriangle, LogOut, Menu, X,
  ShoppingCart, DollarSign, CheckCircle, XCircle,
  Shield, Clock, Plus, Edit, Trash2, Send, CreditCard,
  Upload, Wallet, Lock, AlertCircle
} from 'lucide-react';
import VendeurOrders from './VendeurOrders';
import ConfirmDialog from './ConfirmDialog';
import { certificationApi, paiementApi } from '../services/api';
import { useTranslation } from 'react-i18next';


function getMenuItems(t) {
  return [
    { id: 'dashboard', label: t('sellerDashboard.dashboard'), icon: <LayoutDashboard size={18} /> },
    { id: 'sales', label: t('sellerDashboard.salesHistory'), icon: <BarChart3 size={18} /> },
    { id: 'products', label: t('sellerDashboard.myProducts'), icon: <Package size={18} /> },
    { id: 'stock', label: t('sellerDashboard.stockAlerts'), icon: <AlertTriangle size={18} /> },
    { id: 'orders', label: t('sellerDashboard.myOrders'), icon: <ShoppingBag size={18} /> },
    { id: 'withdrawal', label: t('sellerDashboard.withdrawals'), icon: <Wallet size={18} /> },
    { id: 'certification', label: t('sellerDashboard.myCertification'), icon: <Shield size={18} /> },
    { id: 'notifications', label: t('sellerDashboard.notifications'), icon: <Bell size={18} /> },
    { id: 'profile', label: t('sellerDashboard.myProfile'), icon: <User size={18} /> },
  ];
}

export default function SellerDashboard({
  onNavigate,
  onLogout,
  currentUser,
  vendeurProducts = [],
  adminOrders = [],
  onUpdateOrderStatus,
}) {
  const { t } = useTranslation();
  const menuItems = getMenuItems(t);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState(null); // { name } | null

  const [certificationStatus, setCertificationStatus] = useState('none');

  // Solde vendeur (paiement-service) : sequestre vs disponible, et
  // historique des retraits deja effectues.
  const [solde, setSolde] = useState(null);
  const [mesRetraits, setMesRetraits] = useState([]);
  const [montantRetrait, setMontantRetrait] = useState('');
  const [retraitEnCours, setRetraitEnCours] = useState(false);
  const [retraitError, setRetraitError] = useState('');
  const [retraitSuccess, setRetraitSuccess] = useState('');

  const chargerSoldeEtRetraits = () => {
    paiementApi.getMonSolde().then(setSolde).catch(() => setSolde(null));
    paiementApi.getMesRetraits().then(setMesRetraits).catch(() => setMesRetraits([]));
  };

  useEffect(() => {
    chargerSoldeEtRetraits();
  }, []);

  const handleDemanderRetrait = async () => {
    const montant = parseFloat(montantRetrait);
    setRetraitError('');
    setRetraitSuccess('');
    if (!montant || montant <= 0) {
      setRetraitError(t('sellerDashboard.withdrawInvalidAmount'));
      return;
    }
    if (solde && montant > Number(solde.soldeDisponible)) {
      setRetraitError(t('sellerDashboard.withdrawInsufficientFunds'));
      return;
    }
    setRetraitEnCours(true);
    try {
      await paiementApi.demanderRetrait(montant);
      setRetraitSuccess(t('sellerDashboard.withdrawSuccess'));
      setMontantRetrait('');
      chargerSoldeEtRetraits();
    } catch (err) {
      setRetraitError(err?.message || t('sellerDashboard.withdrawError'));
    } finally {
      setRetraitEnCours(false);
    }
  };

  useEffect(() => {
    certificationApi.getMesCertifications()
      .then((mesCertifications) => {
        const derniere = [...mesCertifications].sort(
          (a, b) => new Date(b.dateDemande) - new Date(a.dateDemande)
        )[0];
        if (!derniere) { setCertificationStatus('none'); return; }
        if (derniere.statut === 'APPROUVEE' && derniere.estActive) setCertificationStatus('approved');
        else if (derniere.statut === 'EN_ATTENTE') setCertificationStatus('pending');
        else if (derniere.statut === 'REJETEE') setCertificationStatus('rejected');
        else setCertificationStatus('none');
      })
      .catch(() => setCertificationStatus('none'));
  }, []);

  const totalProducts = vendeurProducts.length;
  const totalOrders = adminOrders.filter(o => {
    return o.items?.some(item =>
      vendeurProducts.some(p => p.name === item.nomProduit || p.name === item.name)
    );
  }).length;
  const totalRevenue = adminOrders.reduce((sum, order) => {
    const orderRevenue = order.items?.filter(item =>
      vendeurProducts.some(p => p.name === item.nomProduit || p.name === item.name)
    ).reduce((s, item) => s + (item.subtotal || 0), 0);
    return sum + (orderRevenue || 0);
  }, 0);
  const lowStockItems = vendeurProducts.filter(p => p.stock <= 10);

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlyRevenue = months.map((_, idx) => {
    return adminOrders
      .filter(o => {
        if (!o.dateISO) return false;
        const d = new Date(o.dateISO);
        return d.getMonth() === idx && d.getFullYear() === new Date().getFullYear();
      })
      .reduce((sum, order) => {
        const orderRevenue = order.items?.filter(item =>
          vendeurProducts.some(p => p.name === item.nomProduit || p.name === item.name)
        ).reduce((s, item) => s + (item.subtotal || 0), 0);
        return sum + (orderRevenue || 0);
      }, 0);
  });
  const maxRevenue = Math.max(1, ...monthlyRevenue);

  // ===== RENDER FUNCTIONS =====
  const renderDashboard = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{t('sellerDashboard.dashboard')}</h2>
        <p style={styles.pageSubtitle}>{t('sellerDashboard.welcomeMsg')}</p>
      </div>

      {certificationStatus === 'pending' && (
        <div style={styles.alertBanner}>
          <Clock size={20} color="#f5b041" />
          <span><strong>{t('sellerDashboard.certPendingBold')}</strong> {t('sellerDashboard.certPendingRest')}</span>
        </div>
      )}
      {certificationStatus === 'approved' && (
        <div style={{ ...styles.alertBanner, backgroundColor: '#e9f5ee', borderColor: '#b7e4c7' }}>
          <CheckCircle size={20} color="#2d6a4f" />
          <span><strong>{t('sellerDashboard.certApproved')}</strong></span>
        </div>
      )}
      {certificationStatus === 'none' && (
        <div style={{ ...styles.alertBanner, backgroundColor: '#fffbea', borderColor: '#f5e4a0', cursor: 'pointer' }}
          onClick={() => onNavigate && onNavigate('certification')}>
          <Shield size={20} color="#f5b041" />
          <span><strong>{t('sellerDashboard.certNoneBold')}</strong> {t('sellerDashboard.certNoneRest')}</span>
          <span style={styles.alertLink}>{t('sellerDashboard.start')}</span>
        </div>
      )}

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}><Package size={20} color="#2d6a4f" /></div>
          <div><p style={styles.kpiLabel}>{t('sellerDashboard.products')}</p><p style={styles.kpiValue}>{totalProducts}</p></div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}><ShoppingBag size={20} color="#2d6a4f" /></div>
          <div><p style={styles.kpiLabel}>{t('sellerDashboard.orders')}</p><p style={styles.kpiValue}>{totalOrders}</p></div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#fff3e0' }}><DollarSign size={20} color="#f5b041" /></div>
          <div><p style={styles.kpiLabel}>{t('sellerDashboard.totalRevenue')}</p><p style={styles.kpiValue}>{totalRevenue.toLocaleString()} FCFA</p></div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#fdf1ed' }}><AlertTriangle size={20} color="#e07a5f" /></div>
          <div><p style={styles.kpiLabel}>{t('sellerDashboard.criticalStock')}</p><p style={styles.kpiValue}>{lowStockItems.length}</p></div>
        </div>
      </div>

      {/* Solde sequestre vs disponible : separation visuelle claire
          demandee par le cahier des charges (section 4). */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#fff3e0' }}><Lock size={20} color="#f5b041" /></div>
          <div>
            <p style={styles.kpiLabel}>{t('sellerDashboard.escrowBalance')}</p>
            <p style={styles.kpiValue}>{Number(solde?.soldeSequestre || 0).toLocaleString()} FCFA</p>
          </div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}><Wallet size={20} color="#2d6a4f" /></div>
          <div>
            <p style={styles.kpiLabel}>{t('sellerDashboard.withdrawableBalance')}</p>
            <p style={styles.kpiValue}>{Number(solde?.soldeDisponible || 0).toLocaleString()} FCFA</p>
          </div>
        </div>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>{t('sellerDashboard.monthlySales')}</h3>
        <div style={styles.chartArea}>
          {monthlyRevenue.map((val, i) => {
            const h = (val / maxRevenue) * 100;
            return (
              <div key={i} style={styles.barGroup}>
                <div style={{ ...styles.bar, height: `${Math.max(h, 4)}%` }} />
                <span style={styles.barLabel}>{months[i].slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.tableCard}>
        <h3 style={styles.chartTitle}>{t('sellerDashboard.recentOrders')}</h3>
        {adminOrders.slice(-3).reverse().map(order => (
          <div key={order.id} style={styles.orderRow}>
            <span style={styles.orderId}>#{order.id}</span>
            <span style={styles.orderClient}>{order.client}</span>
            <span style={styles.orderAmount}>{order.amount.toLocaleString()} FCFA</span>
            <span style={{
              ...styles.orderStatus,
              backgroundColor: order.status === 'Livrée' ? '#e9f5ee' : '#fff3e0',
              color: order.status === 'Livrée' ? '#2d6a4f' : '#f5b041',
            }}>{order.status}</span>
          </div>
        ))}
      </div>
    </>
  );

  const renderSalesHistory = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{t('sellerDashboard.salesHistory')}</h2>
        <p style={styles.pageSubtitle}>{t('sellerDashboard.salesHistorySub')}</p>
      </div>
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>{t('sellerDashboard.order')}</th>
              <th style={styles.th}>{t('sellerDashboard.client')}</th>
              <th style={styles.th}>{t('sellerDashboard.amount')}</th>
              <th style={styles.th}>{t('sellerDashboard.date')}</th>
              <th style={styles.th}>{t('sellerDashboard.status')}</th>
            </tr>
          </thead>
          <tbody>
            {adminOrders.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#adb5bd' }}>{t('sellerDashboard.noSales')}</td></tr>
            ) : (
              adminOrders.map(order => (
                <tr key={order.id}>
                  <td style={styles.td}>#{order.id}</td>
                  <td style={styles.td}>{order.client}</td>
                  <td style={styles.td}>{order.amount.toLocaleString()} FCFA</td>
                  <td style={styles.td}>{order.date}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: order.status === 'Livrée' ? '#e9f5ee' : '#fff3e0',
                      color: order.status === 'Livrée' ? '#2d6a4f' : '#f5b041',
                    }}>{order.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderProducts = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{t('sellerDashboard.myProducts')}</h2>
        <p style={styles.pageSubtitle}>{vendeurProducts.length} {t('sellerDashboard.productsOnline')}</p>
        <button style={styles.actionBtn} onClick={() => onNavigate && onNavigate('add-product')}>
          <Plus size={16} /> {t('sellerDashboard.addProduct')}
        </button>
      </div>
      <div style={styles.tableCard}>
        {vendeurProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>
            <Package size={48} color="#adb5bd" />
            <p>{t('sellerDashboard.noProductsYet')}</p>
            <button style={styles.actionBtn} onClick={() => onNavigate && onNavigate('add-product')}>
              {t('sellerDashboard.addFirstProduct')}
            </button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('sellerDashboard.product')}</th>
                <th style={styles.th}>{t('sellerDashboard.category')}</th>
                <th style={styles.th}>{t('sellerDashboard.price')}</th>
                <th style={styles.th}>{t('sellerDashboard.stock')}</th>
                <th style={styles.th}>{t('sellerDashboard.status')}</th>
                <th style={styles.th}>{t('sellerDashboard.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {vendeurProducts.map(p => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.category || t('sellerDashboard.notCategorized')}</td>
                  <td style={styles.td}>{p.price.toLocaleString()} FCFA</td>
                  <td style={styles.td}>{p.stock}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: p.stock > 10 ? '#e9f5ee' : '#fdf1ed',
                      color: p.stock > 10 ? '#2d6a4f' : '#e07a5f',
                    }}>
                      {p.stock > 10 ? t('sellerDashboard.available') : t('sellerDashboard.lowStock')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionGroup}>
                      <button style={styles.iconBtn} onClick={() => onNavigate && onNavigate('add-product')}>
                        <Edit size={14} color="#2d6a4f" />
                      </button>
                      <button style={styles.iconBtn} onClick={() => setConfirmDeleteProduct({ name: p.name })}>
                        <Trash2 size={14} color="#e07a5f" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderStockAlerts = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{t('sellerDashboard.stockAlerts')}</h2>
        <p style={styles.pageSubtitle}>{lowStockItems.length} {t('sellerDashboard.stockAlertsSub')}</p>
      </div>
      <div style={styles.tableCard}>
        {lowStockItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#2d6a4f' }}>
            <CheckCircle size={48} color="#2d6a4f" />
            <p>{t('sellerDashboard.allStockOk')}</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('sellerDashboard.product')}</th>
                <th style={styles.th}>{t('sellerDashboard.currentStock')}</th>
                <th style={styles.th}>{t('sellerDashboard.criticalThreshold')}</th>
                <th style={styles.th}>{t('sellerDashboard.action')}</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map(p => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.stock}</td>
                  <td style={styles.td}>10</td>
                  <td style={styles.td}>
                    <button style={styles.actionBtnSmall} onClick={() => onNavigate && onNavigate('add-product')}>
                      {t('sellerDashboard.restock')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  const renderOrders = () => (
    <VendeurOrders
      orders={adminOrders}
      onUpdateOrderStatus={onUpdateOrderStatus}
    />
  );

  const renderNotifications = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{t('sellerDashboard.notifications')}</h2>
        <p style={styles.pageSubtitle}>{t('sellerDashboard.notifSub')}</p>
      </div>
      <div style={styles.tableCard}>
        <p style={{ color: '#adb5bd', textAlign: 'center', padding: '20px' }}>{t('sellerDashboard.noRecentNotif')}</p>
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>{t('sellerDashboard.myProfile')}</h2>
        <p style={styles.pageSubtitle}>{t('sellerDashboard.myProfileSub')}</p>
      </div>
      <div style={styles.profileCard}>
        <div style={styles.profilePhoto}>
          {currentUser?.photo ? (
            <img src={currentUser.photo} alt="Photo" style={styles.profileImg} />
          ) : (
            <div style={styles.profileImgPlaceholder}>
              <User size={48} color="#adb5bd" />
            </div>
          )}
        </div>
        <div style={styles.profileInfo}>
          <h3>{currentUser?.prenom} {currentUser?.nom}</h3>
          <p>{currentUser?.email}</p>
          <p>{currentUser?.telephone}</p>
          <div style={styles.profileActions}>
            <button style={styles.actionBtnSmall} onClick={() => onNavigate && onNavigate('edit-profile')}>
              {t('sellerDashboard.editProfile')}
            </button>
            <button style={styles.actionBtnSmall} onClick={() => onNavigate && onNavigate('change-password')}>
              {t('sellerDashboard.changePassword')}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return renderDashboard();
      case 'sales': return renderSalesHistory();
      case 'products': return renderProducts();
      case 'stock': return renderStockAlerts();
      case 'orders': return renderOrders();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  return (
    <div style={styles.wrapper}>
      <ConfirmDialog
        open={!!confirmDeleteProduct}
        title={t('sellerDashboard.myWorkspace')}
        message={confirmDeleteProduct ? `${t('sellerDashboard.deleteConfirm')} "${confirmDeleteProduct.name}" ?` : ''}
        onCancel={() => setConfirmDeleteProduct(null)}
        onConfirm={() => {
          setConfirmDeleteProduct(null);
          alert(t('sellerDashboard.deletedSim'));
        }}
      />
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '250px' : '72px' }}>
        <div style={styles.sidebarHeader}>
          <button style={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && <span style={styles.brand}>{t('sellerDashboard.myWorkspace')}</span>}
        </div>
        <nav style={styles.nav}>
          {menuItems.map(item => (
            <button
              key={item.id}
              style={{ ...styles.navItem, ...(activeMenu === item.id ? styles.navItemActive : {}) }}
              onClick={() => item.id === 'certification' ? (onNavigate && onNavigate('certification')) : setActiveMenu(item.id)}
            >
              {item.icon}
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <button style={styles.navItem} onClick={() => onLogout && onLogout()}>
            <LogOut size={18} />
            {sidebarOpen && <span>{t('sellerDashboard.logout')}</span>}
          </button>
        </div>
      </aside>

      <main style={{ ...styles.main, marginLeft: sidebarOpen ? '250px' : '72px' }}>
        <div style={styles.content}>{renderContent()}</div>
      </main>
    </div>
  );
}

// ============================================================
// ==================== STYLES =================================
// ============================================================
const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f8', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  sidebar: {
    position: 'fixed', top: 0, left: 0, height: '100vh', backgroundColor: '#1b4d3e',
    color: '#ffffff', padding: '16px 0', transition: 'width 0.3s ease', zIndex: 100,
    overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
  },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' },
  toggleBtn: { background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '4px' },
  brand: { fontSize: '16px', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 10px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
    borderRadius: '10px', border: 'none', backgroundColor: 'transparent',
    color: '#a3c2b8', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s ease', width: '100%', whiteSpace: 'nowrap',
  },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff' },
  sidebarFooter: { padding: '0 10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' },
  main: { flex: 1, padding: '24px', transition: 'margin-left 0.3s ease', minHeight: '100vh' },
  content: { maxWidth: '1200px', margin: '0 auto' },

  pageHeader: { marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  pageTitle: { fontSize: '24px', fontWeight: '900', color: '#212529', margin: '0 0 4px 0' },
  pageSubtitle: { fontSize: '14px', color: '#6c757d', margin: 0 },

  alertBanner: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', backgroundColor: '#fdf1ed', borderRadius: '14px', border: '1px solid #f5d4c8', marginBottom: '16px' },
  alertLink: { marginLeft: 'auto', fontWeight: '700', color: '#e07a5f', cursor: 'pointer' },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', border: '1px solid #e9ecef' },
  kpiIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: '12px', color: '#6c757d', fontWeight: '600', margin: 0, textTransform: 'uppercase' },
  kpiValue: { fontSize: '20px', fontWeight: '800', color: '#212529', margin: 0 },

  chartCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e9ecef', marginBottom: '24px' },
  chartTitle: { fontSize: '16px', fontWeight: '700', color: '#212529', margin: '0 0 16px 0' },
  chartArea: { display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', paddingBottom: '8px', borderBottom: '2px solid #f1f3f5' },
  barGroup: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: '6px 6px 0 0', backgroundColor: '#2d6a4f', minHeight: '4px' },
  barLabel: { fontSize: '10px', color: '#adb5bd', fontWeight: '600' },

  tableCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #e9ecef', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '12px 8px', borderBottom: '2px solid #e9ecef', fontSize: '12px', fontWeight: '700', color: '#6c757d', textTransform: 'uppercase' },
  td: { padding: '12px 8px', borderBottom: '1px solid #f8f9fa', color: '#495057', fontWeight: '500' },
  statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },

  orderRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0', borderBottom: '1px solid #f8f9fa' },
  orderId: { fontWeight: '700', color: '#212529', minWidth: '80px' },
  orderClient: { flex: 1, color: '#495057' },
  orderAmount: { fontWeight: '700', color: '#e07a5f' },
  orderStatus: { padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },

  actionBtn: { padding: '10px 20px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  actionBtnSmall: { padding: '8px 16px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  actionGroup: { display: 'flex', gap: '6px' },
  iconBtn: { padding: '4px 8px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '6px', cursor: 'pointer' },

  certStatusCard: { display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e9ecef', marginBottom: '24px' },
  certStatusIcon: { width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' },
  certStatusTitle: { fontSize: '18px', fontWeight: '700', color: '#212529', margin: 0 },
  certStatusDesc: { fontSize: '14px', color: '#6c757d', margin: 0 },
  certForm: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e9ecef' },
  certFormTitle: { fontSize: '18px', fontWeight: '700', color: '#212529', margin: '0 0 4px 0' },
  certFormSub: { fontSize: '14px', color: '#6c757d', margin: '0 0 20px 0' },
  certField: { marginBottom: '16px' },
  certLabel: { display: 'block', fontSize: '14px', fontWeight: '700', color: '#212529', marginBottom: '6px' },
  certHint: { fontSize: '12px', color: '#6c757d', margin: '0 0 6px 0' },
  certUpload: { display: 'flex', alignItems: 'center', gap: '10px' },
  uploadLabel: { padding: '10px 16px', backgroundColor: '#f8f9fa', border: '1px dashed #dee2e6', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#495057', display: 'flex', alignItems: 'center', gap: '8px' },
  submitBtn: { padding: '12px 24px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },

  profileCard: { display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e9ecef' },
  profilePhoto: { flexShrink: 0 },
  profileImg: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #e9ecef' },
  profileImgPlaceholder: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #e9ecef' },
  profileInfo: { flex: 1 },
  profileActions: { display: 'flex', gap: '10px', marginTop: '12px' },
};