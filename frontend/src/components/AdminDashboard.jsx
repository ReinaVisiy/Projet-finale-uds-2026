import React, { useState } from 'react';
import { Shield, ShieldCheck, CheckCircle, XCircle, Clock, Eye, FileText } from 'lucide-react';

const navItems = [
  { id: 'home', label: 'Accueil', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: 'products', label: 'Produits', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { id: 'orders', label: 'Commandes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { id: 'certifications', label: 'Certifications', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { id: 'signalements', label: 'Signalements', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
  { id: 'users', label: 'Utilisateurs', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id: 'sales', label: 'Ventes', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> },
];

export default function AdminDashboard({
  onNavigate,
  onApproveCertification,
  onRejectCertification,
  onNavigateToVendorVerification,
  onNavigateToModeration,
  pendingVerificationCount = 0,
  registeredUsers = [],
  adminOrders = [],
  vendorVerifications = [],
  signalements = [],
  onToggleUserBlocked,
  // Ajoutés pour brancher le badge de notifications sur les vraies
  // données (notification-service) plutôt qu'un compteur figé.
  notifications = [],
  currentUser = null,
}) {
  const [activeNav, setActiveNav] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Anciennement : const [notifCount, setNotifCount] = useState(3) — un
  // compteur figé, jamais connecté aux vraies notifications. Calculé
  // maintenant à partir des notifications réellement non lues de
  // l'utilisateur connecté (même logique que NavigationConsole.jsx).
  const notifCount = currentUser
    ? notifications.filter(n => n.utilisateurId === currentUser.id && !n.lu).length
    : 0;
  const [toast, setToast] = useState('');
  const [hoveredBar, setHoveredBar] = useState(null);

  // ===== STATISTIQUES =====
  const totalUsers = registeredUsers.length;
  const totalClients = registeredUsers.filter(u => u.role === 'client').length;
  const totalVendeurs = registeredUsers.filter(u => u.role === 'vendeur').length;
  const totalOrders = adminOrders.length;
  const totalRevenue = adminOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalSignalements = signalements.length;
  const pendingSignalements = signalements.filter(s => s.status === 'pending').length;
  const pendingCertifications = vendorVerifications.filter(v => v.status === 'pending').length;
  const approvedCertifications = vendorVerifications.filter(v => v.status === 'approved').length;
  const rejectedCertifications = vendorVerifications.filter(v => v.status === 'rejected').length;

  // ===== DERNIÈRES COMMANDES =====
  const lastOrders = adminOrders.slice(-3).reverse();

  // ===== DERNIERS SIGNALEMENTS =====
  const lastSignalements = signalements.slice(-3).reverse();

  // ===== MOIS POUR LE GRAPHIQUE (basé sur les commandes) =====
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlyOrders = months.map((_, idx) => {
    const count = adminOrders.filter(o => {
      if (!o.dateISO) return false;
      const d = new Date(o.dateISO);
      return d.getMonth() === idx && d.getFullYear() === new Date().getFullYear();
    }).length;
    return count;
  });
  const maxMonthly = Math.max(1, ...monthlyOrders);

  // ===== TOAST =====
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // certificationMapping.js (mapCertificationPourAdmin) renvoie prenom/nom,
  // pas farm/vendeurNom/vendeur (qui n'existaient pas sur l'objet réel et
  // laissaient l'affichage vide). Petit helper pour construire le nom
  // complet du producteur de façon sûre.
  const nomCompletProducteur = (cert) => {
    if (!cert) return '';
    const nom = `${cert.prenom || ''} ${cert.nom || ''}`.trim();
    return nom || `Producteur #${cert.producteurId ?? ''}`;
  };

  // ===== NAVIGATION =====
  const handleNavClick = (item) => {
    setActiveNav(item.id);
    if (item.id === 'orders') {
      onNavigate && onNavigate('order-management-admin');
    } else if (item.id === 'certifications') {
      onNavigateToVendorVerification && onNavigateToVendorVerification();
    } else if (item.id === 'signalements') {
      onNavigateToModeration && onNavigateToModeration();
    } else if (item.id === 'users' || item.id === 'sales') {
      // reste sur le dashboard : affiche l'onglet Utilisateurs/Ventes ci-dessous
    } else if (item.id !== 'home') {
      showToast(`Navigation → ${item.label}`);
    }
  };

  return (
    <div style={styles.wrapper}>
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* SIDEBAR (inchangé) */}
      <aside style={{ ...styles.sidebar, width: sidebarCollapsed ? '72px' : '220px' }}>
        <div style={styles.sidebarBrand}>
          <div style={styles.sidebarLogo}><span style={styles.sidebarLogoText}>AM</span></div>
          {!sidebarCollapsed && <span style={styles.sidebarBrandName}>Agriconnect</span>}
        </div>
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                }}
              >
                <span style={{ ...styles.navIcon, color: isActive ? '#ffffff' : '#a3c2b8' }}>{item.icon}</span>
                {!sidebarCollapsed && (
                  <span style={{ ...styles.navLabel, color: isActive ? '#ffffff' : '#a3c2b8' }}>{item.label}</span>
                )}
                {!sidebarCollapsed && item.id === 'certifications' && pendingCertifications > 0 && (
                  <span style={styles.navBadge}>{pendingCertifications}</span>
                )}
                {!sidebarCollapsed && item.id === 'orders' && totalOrders > 0 && (
                  <span style={styles.navBadge}>{totalOrders}</span>
                )}
              </button>
            );
          })}
        </nav>
        <button style={styles.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3c2b8" strokeWidth="2.5">
            {sidebarCollapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
          </svg>
          {!sidebarCollapsed && <span style={styles.collapseBtnText}>Réduire</span>}
        </button>
      </aside>

      {/* MAIN */}
      <div style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <p style={styles.greetingText}>Bonjour, Admin 👋</p>
            <p style={styles.dateText}>Tableau de bord — AgroMarket</p>
          </div>
          <div style={styles.topbarRight}>
            <button style={styles.topbarIconBtn} onClick={() => onNavigate && onNavigate('notifications')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifCount > 0 && <span style={styles.notifPip}>{notifCount}</span>}
            </button>
            <div style={styles.avatarSmall}>AD</div>
          </div>
        </header>

        <div style={styles.content}>

          {/* ===== VUE ACCUEIL ===== */}
          {activeNav === 'home' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>Tableau de bord</h2>
                <p style={styles.pageTitleSub}>Vue d'ensemble de votre activité</p>
              </div>

              {/* Alertes */}
              {pendingCertifications > 0 && (
                <div style={styles.certAlert} onClick={() => setActiveNav('certifications')}>
                  <Shield size={20} color="#f5b041" />
                  <span style={styles.certAlertText}>
                    <strong>{pendingCertifications} demande(s) de certification</strong> en attente de votre validation
                  </span>
                  <span style={styles.certAlertBtn}>Voir →</span>
                </div>
              )}

              {pendingVerificationCount > 0 && (
                <div
                  style={{ ...styles.certAlert, backgroundColor: '#e9f5ee', borderColor: '#b7e4c7' }}
                  onClick={() => onNavigateToVendorVerification && onNavigateToVendorVerification()}
                >
                  <ShieldCheck size={20} color="#2d6a4f" />
                  <span style={{ ...styles.certAlertText, color: '#1b4d3e' }}>
                    <strong>{pendingVerificationCount} nouveau(x) vendeur(s)</strong> en attente de vérification d'identité
                  </span>
                  <span style={{ ...styles.certAlertBtn, color: '#2d6a4f' }}>Voir →</span>
                </div>
              )}

              {/* KPI Cards */}
              <div style={styles.kpiGrid}>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}>👥</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>+{totalUsers}</span>
                  </div>
                  <p style={styles.kpiLabel}>Utilisateurs</p>
                  <p style={styles.kpiValue}>{totalUsers}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#fdf1ed' }}>🌾</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{totalVendeurs}</span>
                  </div>
                  <p style={styles.kpiLabel}>Vendeurs</p>
                  <p style={styles.kpiValue}>{totalVendeurs}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}>📦</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{totalOrders}</span>
                  </div>
                  <p style={styles.kpiLabel}>Commandes</p>
                  <p style={styles.kpiValue}>{totalOrders}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#fff3e0' }}>💰</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>Revenus</span>
                  </div>
                  <p style={styles.kpiLabel}>Revenu total</p>
                  <p style={styles.kpiValue}>{totalRevenue.toLocaleString()} FCFA</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#fdf1ed' }}>⚠️</div>
                    <span style={{ ...styles.kpiChange, color: pendingSignalements > 0 ? '#dc3545' : '#2d6a4f', backgroundColor: pendingSignalements > 0 ? '#fde8ea' : '#d8f3dc' }}>{pendingSignalements}</span>
                  </div>
                  <p style={styles.kpiLabel}>Signalements</p>
                  <p style={styles.kpiValue}>{totalSignalements}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}>🏅</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{approvedCertifications}</span>
                  </div>
                  <p style={styles.kpiLabel}>Certifications</p>
                  <p style={styles.kpiValue}>{pendingCertifications} en attente</p>
                </div>
              </div>

              {/* Graphique + Commandes récentes */}
              <div style={styles.midGrid}>
                <div style={styles.chartCard}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.cardTitle}>Commandes par mois</h3>
                      <p style={styles.cardSub}>Année en cours</p>
                    </div>
                  </div>
                  <div style={styles.chartArea}>
                    {monthlyOrders.map((val, i) => {
                      const h = (val / maxMonthly) * 100;
                      const isHov = hoveredBar === i;
                      return (
                        <div key={i} style={styles.barGroup} onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                          {isHov && <div style={styles.tooltip}>{val} commande{val > 1 ? 's' : ''}</div>}
                          <div style={{ ...styles.bar, height: `${h}%`, background: isHov ? 'linear-gradient(180deg, #1b4d3e 0%, #2d6a4f 100%)' : 'linear-gradient(180deg, #40916c 0%, #2d6a4f 100%)', opacity: isHov ? 1 : 0.75 }} />
                          <span style={styles.barLabel}>{months[i].slice(0,3)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.ordersCard}>
                  <div style={styles.cardHeader}>
                    <div><h3 style={styles.cardTitle}>Dernières commandes</h3><p style={styles.cardSub}>{lastOrders.length} récentes</p></div>
                    <button style={styles.viewAllBtn} onClick={() => onNavigate && onNavigate('order-management-admin')}>Tout voir →</button>
                  </div>
                  <div style={styles.ordersList}>
                    {lastOrders.length === 0 ? (
                      <p style={{ color: '#adb5bd', textAlign: 'center', padding: '20px 0' }}>Aucune commande</p>
                    ) : (
                      lastOrders.map((o) => (
                        <div key={o.id} style={styles.orderItem}>
                          <div style={styles.orderLeft}>
                            <div style={styles.orderAvatar}>{o.client?.split(' ').map(w => w[0]).join('').slice(0,2) || '??'}</div>
                            <div><p style={styles.orderClient}>{o.client}</p><p style={styles.orderId}>#{o.id}</p></div>
                          </div>
                          <div style={styles.orderRight}>
                            <p style={styles.orderAmount}>{o.amount?.toLocaleString('fr-FR') || 0} FCFA</p>
                            <span style={{ ...styles.orderStatus, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{o.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Signalements récents */}
              <div style={styles.salesTableCard}>
                <div style={styles.cardHeader}>
                  <div><h3 style={styles.cardTitle}>Signalements récents</h3><p style={styles.cardSub}>{lastSignalements.length} signalements</p></div>
                  <button style={styles.viewAllBtn} onClick={() => onNavigateToModeration && onNavigateToModeration()}>Tout voir →</button>
                </div>
                {lastSignalements.length === 0 ? (
                  <p style={{ color: '#adb5bd', padding: '20px', textAlign: 'center' }}>Aucun signalement</p>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>Cible</th><th style={styles.th}>Motif</th><th style={styles.th}>Auteur</th><th style={styles.th}>Statut</th></tr>
                    </thead>
                    <tbody>
                      {lastSignalements.map((s) => (
                        <tr key={s.id} style={styles.tr}>
                          <td style={styles.td}><strong>{s.cible}</strong></td>
                          <td style={styles.td}>{s.motif}</td>
                          <td style={styles.td}>{s.auteur}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, color: s.status === 'résolu' ? '#2d6a4f' : '#f5b041', backgroundColor: s.status === 'résolu' ? '#d8f3dc' : '#fffbea' }}>{s.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ===== VUE CERTIFICATIONS ===== */}
          {/* ===== VUE UTILISATEURS ===== */}
          {activeNav === 'users' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>Gestion des utilisateurs</h2>
                <p style={styles.pageTitleSub}>Comptes clients et vendeurs inscrits</p>
              </div>
              {registeredUsers.length === 0 ? (
                <div style={styles.emptyState}><ShieldCheck size={40} color="#adb5bd" /><p>Aucun utilisateur inscrit</p></div>
              ) : (
                <div style={styles.certList}>
                  {registeredUsers.map((u) => (
                    <div key={u.id} style={styles.certCard}>
                      <div style={styles.certLeft}>
                        <div style={styles.certAvatar}>{u.prenom?.[0]?.toUpperCase()}{u.nom?.[0]?.toUpperCase()}</div>
                        <div style={styles.certInfo}>
                          <h4 style={styles.certFarm}>{u.prenom} {u.nom}</h4>
                          <p style={styles.certVendeur}>✉️ {u.email} · 📞 {u.telephone || 'N/A'}</p>
                          <p style={styles.certMeta}>
                            {u.role === 'vendeur' ? '🌾 Vendeur' : '🛒 Client'}
                            {u.role === 'vendeur' && u.verificationStatus && (
                              <> · Vérification : {u.verificationStatus === 'approved' ? '✅ approuvée' : u.verificationStatus === 'rejected' ? '❌ rejetée' : '⏳ en attente'}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <div style={styles.certRight}>
                        <span style={{
                          ...styles.certStatus,
                          color: u.suspendu ? '#c0392b' : '#2d6a4f',
                          backgroundColor: u.suspendu ? '#fdecea' : '#e9f5ee',
                        }}>
                          {u.suspendu
                            ? `🚫 Suspendu jusqu'au ${new Date(u.suspenduJusquau).toLocaleDateString('fr-FR')}`
                            : '✅ Actif'}
                        </span>
                        <div style={styles.certActions}>
                          <button style={u.suspendu ? styles.certApproveBtn : styles.certRejectBtn} onClick={() => onToggleUserBlocked && onToggleUserBlocked(u.id)}>
                            {u.suspendu ? 'Lever la suspension' : 'Suspendre'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ===== VUE VENTES ===== */}
          {activeNav === 'sales' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>Ventes</h2>
                <p style={styles.pageTitleSub}>{totalOrders} vente(s) · {totalRevenue.toLocaleString('fr-FR')} FCFA de revenu total</p>
              </div>
              <div style={styles.salesTableCard}>
                {adminOrders.length === 0 ? (
                  <div style={styles.emptyState}><ShieldCheck size={40} color="#adb5bd" /><p>Aucune vente pour le moment</p></div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Commande</th>
                        <th style={styles.th}>Client</th>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Montant</th>
                        <th style={styles.th}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...adminOrders].reverse().map((o) => (
                        <tr key={o.id} style={styles.tr}>
                          <td style={styles.td}>#{o.id}</td>
                          <td style={styles.td}>{o.client}</td>
                          <td style={styles.td}>{o.dateISO ? new Date(o.dateISO).toLocaleDateString('fr-FR') : (o.date || '—')}</td>
                          <td style={styles.td}>{(o.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

// ============================================================
// ==================== STYLES =================================
// ============================================================
// (Les styles sont inchangés par rapport à la version précédente)
// Je les conserve pour ne pas alourdir, mais ils sont identiques à ceux que vous avez déjà.
const styles = {
  wrapper: { display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f4f6f8', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" },
  toast: { position: 'fixed', bottom: '24px', right: '24px', backgroundColor: '#1b4d3e', color: '#ffffff', padding: '13px 18px', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999, fontSize: '13px', fontWeight: '700' },
  sidebar: { backgroundColor: '#1b4d3e', display: 'flex', flexDirection: 'column', padding: '20px 0', transition: 'width 0.25s ease', flexShrink: 0, overflow: 'hidden', boxShadow: '4px 0 20px rgba(0,0,0,0.1)', zIndex: 100 },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' },
  sidebarLogo: { width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sidebarLogoText: { fontSize: '13px', fontWeight: '800', color: '#ffffff' },
  sidebarBrandName: { fontSize: '16px', fontWeight: '800', color: '#ffffff', whiteSpace: 'nowrap' },
  nav: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 10px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: 'transparent', width: '100%' },
  navItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  navIcon: { flexShrink: 0 },
  navLabel: { fontSize: '13.5px', fontWeight: '600', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' },
  navBadge: { fontSize: '10px', fontWeight: '800', color: '#ffffff', backgroundColor: '#e07a5f', padding: '2px 6px', borderRadius: '10px' },
  collapseBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' },
  collapseBtnText: { fontSize: '12px', fontWeight: '600', color: '#a3c2b8', whiteSpace: 'nowrap' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', backgroundColor: '#ffffff', borderBottom: '1px solid #e9ecef', flexShrink: 0 },
  greetingText: { fontSize: '14px', fontWeight: '700', color: '#212529', marginBottom: '2px' },
  dateText: { fontSize: '12px', color: '#adb5bd', fontWeight: '500' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '8px' },
  topbarIconBtn: { position: 'relative', width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#495057' },
  notifPip: { position: 'absolute', top: '5px', right: '5px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#e07a5f', fontSize: '9px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarSmall: { width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#1b4d3e', color: '#ffffff', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  content: { flex: 1, overflow: 'auto', padding: '24px 28px' },
  pageTitle: { marginBottom: '20px' },
  pageTitleText: { fontSize: '22px', fontWeight: '800', color: '#212529', letterSpacing: '-0.02em', marginBottom: '2px' },
  pageTitleSub: { fontSize: '12px', color: '#adb5bd', fontWeight: '500' },
  certAlert: { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', backgroundColor: '#fffbea', border: '1px solid #f5e4a0', borderRadius: '14px', marginBottom: '12px', cursor: 'pointer' },
  certAlertText: { flex: 1, fontSize: '14px', color: '#856404' },
  certAlertBtn: { fontSize: '13px', fontWeight: '800', color: '#f5b041' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', marginTop: '8px' },
  kpiCard: { backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e9ecef', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  kpiTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  kpiIcon: { width: '36px', height: '36px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
  kpiChange: { fontSize: '10px', fontWeight: '700', padding: '3px 7px', borderRadius: '20px' },
  kpiLabel: { fontSize: '11px', color: '#868e96', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' },
  kpiValue: { fontSize: '20px', fontWeight: '800', color: '#212529', marginBottom: '0' },
  midGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '16px' },
  chartCard: { backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e9ecef', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  cardTitle: { fontSize: '14px', fontWeight: '800', color: '#212529', marginBottom: '2px' },
  cardSub: { fontSize: '11px', color: '#adb5bd', fontWeight: '500' },
  chartArea: { display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', borderBottom: '2px solid #f1f3f5' },
  barGroup: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', position: 'relative', cursor: 'pointer' },
  tooltip: { position: 'absolute', top: '-32px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#212529', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '3px 7px', borderRadius: '5px', whiteSpace: 'nowrap', zIndex: 10 },
  bar: { width: '100%', borderRadius: '5px 5px 0 0', transition: 'all 0.2s', minHeight: '4px' },
  barLabel: { fontSize: '8px', color: '#adb5bd', fontWeight: '600' },
  ordersCard: { backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e9ecef', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  viewAllBtn: { fontSize: '12px', fontWeight: '700', color: '#1b4d3e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 },
  ordersList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f8f9fa' },
  orderLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  orderAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#e9f5ee', color: '#1b4d3e', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  orderClient: { fontSize: '13px', fontWeight: '700', color: '#212529', marginBottom: '1px' },
  orderId: { fontSize: '11px', color: '#adb5bd', fontFamily: 'monospace' },
  orderRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  orderAmount: { fontSize: '13px', fontWeight: '800', color: '#e07a5f' },
  orderStatus: { fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px' },
  salesTableCard: { backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e9ecef', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: '10px', fontWeight: '700', color: '#868e96', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1.5px solid #f1f3f5', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f8f9fa' },
  td: { padding: '12px 12px', color: '#495057', fontWeight: '500', verticalAlign: 'middle', whiteSpace: 'nowrap' },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700' },
  certStatsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' },
  certStat: { backgroundColor: '#ffffff', borderRadius: '14px', padding: '20px', border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: '14px' },
  certStatNum: { fontSize: '24px', fontWeight: '900', color: '#212529', margin: 0 },
  certStatLabel: { fontSize: '12px', color: '#6c757d', fontWeight: '600', margin: 0 },
  filterRow: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1.5px solid #dee2e6', backgroundColor: '#ffffff', color: '#6c757d', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  filterBtnActive: { backgroundColor: '#1b4d3e', borderColor: '#1b4d3e', color: '#ffffff' },
  filterBadge: { backgroundColor: '#e07a5f', color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '1px 6px', borderRadius: '10px' },
  certList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  certCard: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '20px 24px', border: '1px solid #e9ecef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', flexWrap: 'wrap' },
  certLeft: { display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '200px' },
  certAvatar: { width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#e9f5ee', color: '#1b4d3e', fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  certInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
  certFarm: { fontSize: '15px', fontWeight: '800', color: '#212529', margin: 0 },
  certVendeur: { fontSize: '13px', color: '#6c757d', margin: 0 },
  certMeta: { fontSize: '12px', color: '#adb5bd', margin: 0 },
  certDocs: { display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' },
  certDocBadge: { fontSize: '11px', fontWeight: '700', color: '#2d6a4f', backgroundColor: '#e9f5ee', padding: '2px 10px', borderRadius: '20px' },
  certRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 },
  certStatus: { fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px' },
  certActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  certViewBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', backgroundColor: '#f8f9fa', color: '#495057', border: '1px solid #dee2e6', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  certRejectBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', backgroundColor: '#fff5f2', color: '#e07a5f', border: '1px solid #f5d4c8', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  certApproveBtn: { display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '48px', color: '#adb5bd', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', fontSize: '14px' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', padding: '24px' },
  detailModal: { backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '560px', boxShadow: '0 32px 64px rgba(0,0,0,0.15)' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  detailHeaderLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
  detailAvatar: { width: '56px', height: '56px', borderRadius: '16px', backgroundColor: '#e9f5ee', color: '#1b4d3e', fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: '18px', fontWeight: '800', color: '#212529', margin: 0 },
  detailSub: { fontSize: '13px', color: '#6c757d', margin: '4px 0 0 0' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#6c757d', padding: '4px' },
  detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  detailItem: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '10px' },
  detailLabel: { fontSize: '11px', color: '#adb5bd', fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { fontSize: '13px', color: '#212529', fontWeight: '700' },
  detailActions: { display: 'flex', gap: '12px' },
  approveBtn: { flex: 2, padding: '12px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '800', cursor: 'pointer' },
  rejectBtnOutline: { flex: 1, padding: '12px', backgroundColor: '#fff5f2', color: '#e07a5f', border: '1px solid #f5d4c8', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  rejectReasonBox: { backgroundColor: '#fff5f2', borderRadius: '12px', padding: '14px', marginBottom: '20px', border: '1px solid #f5d4c8' },
  rejectReasonLabel: { fontSize: '12px', fontWeight: '700', color: '#e07a5f', margin: '0 0 4px 0' },
  rejectReasonText: { fontSize: '13px', color: '#495057', margin: 0 },
  rejectModal: { backgroundColor: '#ffffff', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '440px' },
  rejectTitle: { fontSize: '18px', fontWeight: '800', color: '#212529', margin: '0 0 8px 0' },
  rejectSubtitle: { fontSize: '14px', color: '#6c757d', margin: '0 0 20px 0' },
  field: { marginBottom: '16px' },
  label: { fontSize: '13px', fontWeight: '700', color: '#343a40', display: 'block', marginBottom: '6px' },
  textarea: { width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', backgroundColor: '#f8f9fa', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
  rejectActions: { display: 'flex', gap: '10px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#f1f3f5', color: '#495057', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  rejectBtn: { flex: 1, padding: '12px', backgroundColor: '#e07a5f', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
};