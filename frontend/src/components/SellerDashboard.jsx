// src/components/SellerDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingBag, Bell, User,
  BarChart3, AlertTriangle, LogOut, Menu, X,
  ShoppingCart, DollarSign, Award, CheckCircle, XCircle,
  Shield, Clock, Plus, Edit, Trash2, Send, CreditCard,
  Upload
} from 'lucide-react';
import VendeurOrders from './VendeurOrders';
import { certificationApi } from '../services/api';

const menuItems = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
  { id: 'sales', label: 'Historique des ventes', icon: <BarChart3 size={18} /> },
  { id: 'products', label: 'Mes produits', icon: <Package size={18} /> },
  { id: 'stock', label: 'Alertes stock', icon: <AlertTriangle size={18} /> },
  { id: 'orders', label: 'Mes commandes', icon: <ShoppingBag size={18} /> },
  { id: 'subscriptions', label: 'Mon abonnement', icon: <Award size={18} /> },
  { id: 'certification', label: 'Ma certification', icon: <Shield size={18} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  { id: 'profile', label: 'Mon profil', icon: <User size={18} /> },
];

const plans = [
  { id: 'gratuit', name: 'Gratuit', price: 0, features: ['5 produits max', 'Position normale'] },
  { id: 'starter', name: 'Starter', price: 2000, features: ['20 produits', '2 produits sponsorisés'] },
  { id: 'premium', name: 'Premium', price: 5000, features: ['Produits illimités', '5 produits sponsorisés'] },
  { id: 'gold', name: 'Gold', price: 10000, features: ['Produits illimités', 'Tous sponsorisés'] },
];

const paymentMethods = [
  { id: 'orange-money', label: 'Orange Money', icon: '📱' },
  { id: 'mtn-money', label: 'MTN Mobile Money', icon: '📱' },
];

export default function SellerDashboard({
  onNavigate,
  onLogout,
  currentUser,
  vendeurProducts = [],
  adminOrders = [],
  activePlan = 'gratuit',
  onSelectPlan,
  onUpdateOrderStatus,
}) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [certificationStatus, setCertificationStatus] = useState('none');

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

  
  const handleSelectPlanClick = (plan) => {
    if (plan.price === 0) {
      if (onSelectPlan) {
        onSelectPlan(plan);
        alert(`✅ Abonnement ${plan.name} activé avec succès !`);
      }
      return;
    }
    setSelectedPlan(plan);
    setPaymentMethod('');
    setPaymentSuccess(false);
    setShowPaymentModal(true);
    setShowPlanModal(false);
  };

  const handlePaymentSubmit = () => {
    if (!paymentMethod) {
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }
    setPaymentLoading(true);
    setTimeout(() => {
      setPaymentLoading(false);
      setPaymentSuccess(true);
      if (onSelectPlan && selectedPlan) {
        onSelectPlan(selectedPlan);
      }
      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedPlan(null);
        setPaymentMethod('');
        setPaymentSuccess(false);
      }, 2000);
    }, 1500);
  };

  // ===== RENDER FUNCTIONS =====
  const renderDashboard = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Tableau de bord</h2>
        <p style={styles.pageSubtitle}>Bienvenue sur votre espace vendeur</p>
      </div>

      {certificationStatus === 'pending' && (
        <div style={styles.alertBanner}>
          <Clock size={20} color="#f5b041" />
          <span><strong>Votre demande de certification</strong> est en cours d'examen</span>
        </div>
      )}
      {certificationStatus === 'approved' && (
        <div style={{ ...styles.alertBanner, backgroundColor: '#e9f5ee', borderColor: '#b7e4c7' }}>
          <CheckCircle size={20} color="#2d6a4f" />
          <span><strong>✅ Votre compte est certifié</strong></span>
        </div>
      )}
      {certificationStatus === 'none' && (
        <div style={{ ...styles.alertBanner, backgroundColor: '#fffbea', borderColor: '#f5e4a0', cursor: 'pointer' }}
          onClick={() => onNavigate && onNavigate('certification')}>
          <Shield size={20} color="#f5b041" />
          <span><strong>Obtenez votre certification</strong> pour gagner la confiance des clients</span>
          <span style={styles.alertLink}>Commencer →</span>
        </div>
      )}

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}><Package size={20} color="#2d6a4f" /></div>
          <div><p style={styles.kpiLabel}>Produits</p><p style={styles.kpiValue}>{totalProducts}</p></div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}><ShoppingBag size={20} color="#2d6a4f" /></div>
          <div><p style={styles.kpiLabel}>Commandes</p><p style={styles.kpiValue}>{totalOrders}</p></div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#fff3e0' }}><DollarSign size={20} color="#f5b041" /></div>
          <div><p style={styles.kpiLabel}>Revenu total</p><p style={styles.kpiValue}>{totalRevenue.toLocaleString()} FCFA</p></div>
        </div>
        <div style={styles.kpiCard}>
          <div style={{ ...styles.kpiIcon, backgroundColor: '#fdf1ed' }}><AlertTriangle size={20} color="#e07a5f" /></div>
          <div><p style={styles.kpiLabel}>Stock critique</p><p style={styles.kpiValue}>{lowStockItems.length}</p></div>
        </div>
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Ventes mensuelles</h3>
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
        <h3 style={styles.chartTitle}>Dernières commandes</h3>
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
        <h2 style={styles.pageTitle}>Historique des ventes</h2>
        <p style={styles.pageSubtitle}>Suivi détaillé de vos transactions</p>
      </div>
      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Commande</th>
              <th style={styles.th}>Client</th>
              <th style={styles.th}>Montant</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {adminOrders.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#adb5bd' }}>Aucune vente</td></tr>
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
        <h2 style={styles.pageTitle}>Mes produits</h2>
        <p style={styles.pageSubtitle}>{vendeurProducts.length} produit(s) en ligne</p>
        <button style={styles.actionBtn} onClick={() => onNavigate && onNavigate('add-product')}>
          <Plus size={16} /> Ajouter un produit
        </button>
      </div>
      <div style={styles.tableCard}>
        {vendeurProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#adb5bd' }}>
            <Package size={48} color="#adb5bd" />
            <p>Vous n'avez pas encore de produits</p>
            <button style={styles.actionBtn} onClick={() => onNavigate && onNavigate('add-product')}>
              Ajouter votre premier produit
            </button>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produit</th>
                <th style={styles.th}>Catégorie</th>
                <th style={styles.th}>Prix</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendeurProducts.map(p => (
                <tr key={p.id}>
                  <td style={styles.td}>{p.name}</td>
                  <td style={styles.td}>{p.category || 'Non catégorisé'}</td>
                  <td style={styles.td}>{p.price.toLocaleString()} FCFA</td>
                  <td style={styles.td}>{p.stock}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: p.stock > 10 ? '#e9f5ee' : '#fdf1ed',
                      color: p.stock > 10 ? '#2d6a4f' : '#e07a5f',
                    }}>
                      {p.stock > 10 ? '✅ Disponible' : '⚠️ Stock faible'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionGroup}>
                      <button style={styles.iconBtn} onClick={() => onNavigate && onNavigate('add-product')}>
                        <Edit size={14} color="#2d6a4f" />
                      </button>
                      <button style={styles.iconBtn} onClick={() => {
                        if (window.confirm(`Supprimer "${p.name}" ?`)) {
                          alert('Produit supprimé (simulation)');
                        }
                      }}>
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
        <h2 style={styles.pageTitle}>Alertes stock</h2>
        <p style={styles.pageSubtitle}>{lowStockItems.length} produit(s) en stock critique</p>
      </div>
      <div style={styles.tableCard}>
        {lowStockItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#2d6a4f' }}>
            <CheckCircle size={48} color="#2d6a4f" />
            <p>Tous vos produits ont un stock suffisant</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produit</th>
                <th style={styles.th}>Stock actuel</th>
                <th style={styles.th}>Seuil critique</th>
                <th style={styles.th}>Action</th>
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
                      Réapprovisionner
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
      vendeurProducts={vendeurProducts}
      onUpdateOrderStatus={onUpdateOrderStatus}
    />
  );

  const renderSubscriptions = () => {
    const currentPlan = plans.find(p => p.id === activePlan) || plans[0];
    return (
      <>
        <div style={styles.pageHeader}>
          <h2 style={styles.pageTitle}>Mon abonnement</h2>
          <p style={styles.pageSubtitle}>Gérez votre plan d'abonnement</p>
        </div>

        <div style={styles.currentPlanCard}>
          <div style={styles.currentPlanHeader}>
            <Award size={32} color="#2d6a4f" />
            <div>
              <h3 style={styles.currentPlanName}>{currentPlan.name}</h3>
              <p style={styles.currentPlanPrice}>
                {currentPlan.price === 0 ? 'Gratuit' : `${currentPlan.price.toLocaleString()} FCFA/mois`}
              </p>
            </div>
          </div>
          <ul style={styles.featureList}>
            {currentPlan.features.map((f, i) => (
              <li key={i} style={styles.featureItem}>✅ {f}</li>
            ))}
          </ul>
          <button style={styles.actionBtn} onClick={() => setShowPlanModal(true)}>
            Changer d'abonnement
          </button>
        </div>

        {showPlanModal && (
          <div style={styles.modalOverlay} onClick={() => setShowPlanModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Choisissez votre abonnement</h3>
                <button style={styles.closeBtn} onClick={() => setShowPlanModal(false)}>✕</button>
              </div>
              <div style={styles.plansGrid}>
                {plans.map(plan => {
                  const isActive = activePlan === plan.id;
                  return (
                    <div key={plan.id} style={{
                      ...styles.planCard,
                      border: isActive ? '2px solid #2d6a4f' : '1px solid #e9ecef',
                      backgroundColor: isActive ? '#e9f5ee' : '#ffffff',
                    }}>
                      <h4 style={styles.planName}>{plan.name}</h4>
                      <p style={styles.planPrice}>
                        {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString()} FCFA/mois`}
                      </p>
                      <ul style={styles.planFeatures}>
                        {plan.features.map((f, i) => (
                          <li key={i} style={styles.planFeature}>✅ {f}</li>
                        ))}
                      </ul>
                      <button
                        style={{
                          ...styles.selectPlanBtn,
                          backgroundColor: isActive ? '#e9ecef' : '#2d6a4f',
                          color: isActive ? '#6c757d' : '#ffffff',
                          cursor: isActive ? 'default' : 'pointer',
                        }}
                        onClick={() => {
                          if (!isActive) handleSelectPlanClick(plan);
                        }}
                        disabled={isActive}
                      >
                        {isActive ? '✅ Actif' : 'Sélectionner'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showPaymentModal && selectedPlan && (
          <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
            <div style={{ ...styles.modal, maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>💳 Paiement</h3>
                <button style={styles.closeBtn} onClick={() => setShowPaymentModal(false)}>✕</button>
              </div>
              <div style={styles.paymentInfo}>
                <p style={styles.paymentPlan}>Plan : <strong>{selectedPlan.name}</strong></p>
                <p style={styles.paymentAmount}>Montant : <strong>{selectedPlan.price.toLocaleString()} FCFA</strong></p>
              </div>
              <div style={styles.paymentMethods}>
                <p style={styles.paymentLabel}>Choisissez votre mode de paiement :</p>
                {paymentMethods.map(method => (
                  <label key={method.id} style={{
                    ...styles.paymentOption,
                    backgroundColor: paymentMethod === method.id ? '#e9f5ee' : '#ffffff',
                    borderColor: paymentMethod === method.id ? '#2d6a4f' : '#dee2e6',
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      style={{ display: 'none' }}
                    />
                    <span style={styles.paymentIcon}>{method.icon}</span>
                    <span style={styles.paymentLabelText}>{method.label}</span>
                  </label>
                ))}
              </div>
              {paymentSuccess && (
                <div style={styles.successBox}>
                  <CheckCircle size={20} color="#2d6a4f" />
                  <span>✅ Paiement effectué avec succès !</span>
                </div>
              )}
              <div style={styles.paymentActions}>
                <button style={styles.cancelBtn} onClick={() => setShowPaymentModal(false)}>Annuler</button>
                <button
                  style={{
                    ...styles.payBtn,
                    opacity: paymentLoading ? 0.7 : 1,
                  }}
                  onClick={handlePaymentSubmit}
                  disabled={paymentLoading || paymentSuccess}
                >
                  {paymentLoading ? 'Traitement...' : paymentSuccess ? '✅ Payé' : `Payer ${selectedPlan.price.toLocaleString()} FCFA`}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderNotifications = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Notifications</h2>
        <p style={styles.pageSubtitle}>Restez informé de toute l'activité</p>
      </div>
      <div style={styles.tableCard}>
        <p style={{ color: '#adb5bd', textAlign: 'center', padding: '20px' }}>Aucune notification récente</p>
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Mon profil</h2>
        <p style={styles.pageSubtitle}>Gérez vos informations personnelles</p>
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
              Modifier le profil
            </button>
            <button style={styles.actionBtnSmall} onClick={() => onNavigate && onNavigate('change-password')}>
              Changer le mot de passe
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
      case 'subscriptions': return renderSubscriptions();
      case 'notifications': return renderNotifications();
      case 'profile': return renderProfile();
      default: return renderDashboard();
    }
  };

  return (
    <div style={styles.wrapper}>
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? '250px' : '72px' }}>
        <div style={styles.sidebarHeader}>
          <button style={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {sidebarOpen && <span style={styles.brand}>🌿 Mon espace</span>}
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
            {sidebarOpen && <span>Déconnexion</span>}
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

  currentPlanCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e9ecef', marginBottom: '24px' },
  currentPlanHeader: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' },
  currentPlanName: { fontSize: '20px', fontWeight: '800', color: '#212529', margin: 0 },
  currentPlanPrice: { fontSize: '16px', fontWeight: '600', color: '#2d6a4f', margin: 0 },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 16px 0' },
  featureItem: { fontSize: '14px', color: '#495057', padding: '4px 0' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#ffffff', borderRadius: '20px', padding: '28px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  modalTitle: { fontSize: '20px', fontWeight: '900', color: '#212529', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '24px', color: '#6c757d', cursor: 'pointer' },
  plansGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  planCard: { padding: '16px', borderRadius: '14px', border: '1px solid #e9ecef', textAlign: 'center' },
  planName: { fontSize: '16px', fontWeight: '800', color: '#212529', margin: '0 0 4px 0' },
  planPrice: { fontSize: '14px', fontWeight: '700', color: '#e07a5f', margin: '0 0 12px 0' },
  planFeatures: { listStyle: 'none', padding: 0, margin: '0 0 12px 0', textAlign: 'left' },
  planFeature: { fontSize: '13px', color: '#495057', padding: '3px 0' },
  selectPlanBtn: { padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: '700', width: '100%' },

  paymentInfo: { backgroundColor: '#f8f9fa', padding: '14px 16px', borderRadius: '12px', marginBottom: '16px' },
  paymentPlan: { fontSize: '14px', color: '#495057', margin: '0 0 4px 0' },
  paymentAmount: { fontSize: '16px', fontWeight: '800', color: '#e07a5f', margin: 0 },
  paymentMethods: { marginBottom: '20px' },
  paymentLabel: { fontSize: '14px', fontWeight: '700', color: '#212529', marginBottom: '10px' },
  paymentOption: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #dee2e6', marginBottom: '8px', cursor: 'pointer' },
  paymentIcon: { fontSize: '20px' },
  paymentLabelText: { fontSize: '14px', fontWeight: '600', color: '#212529' },
  paymentActions: { display: 'flex', gap: '12px', marginTop: '16px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  payBtn: { flex: 2, padding: '12px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '800', cursor: 'pointer' },
  successBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#e9f5ee', borderRadius: '12px', border: '1px solid #b7e4c7', marginBottom: '16px' },

  profileCard: { display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e9ecef' },
  profilePhoto: { flexShrink: 0 },
  profileImg: { width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #e9ecef' },
  profileImgPlaceholder: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #e9ecef' },
  profileInfo: { flex: 1 },
  profileActions: { display: 'flex', gap: '10px', marginTop: '12px' },
};