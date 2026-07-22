import { useState, useEffect, useRef } from 'react';
import { Shield, ShieldCheck, CheckCircle, XCircle, AlertOctagon, RotateCcw, LogOut, Home, Search, ChevronDown, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useIsMobile from '../hooks/useIsMobile';
import useProduits from '../hooks/useProduits';
import ConfirmActionModal from './ConfirmActionModal';
import { paiementApi } from '../services/api';


function getNavItems(t) {
  return [
    { id: 'home', label: t('adminDashboard.home'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: 'products', label: t('adminDashboard.products'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
    { id: 'orders', label: t('adminDashboard.orders'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
    { id: 'certifications', label: t('adminDashboard.certifications'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
    { id: 'signalements', label: t('adminDashboard.signalements'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg> },
    { id: 'disputes', label: t('adminDashboard.disputes'), icon: <AlertOctagon size={18} /> },
    { id: 'users', label: t('adminDashboard.users'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'sales', label: t('adminDashboard.sales'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> },
    { id: 'retrait', label: t('adminDashboard.retrait'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { id: 'admins', label: t('adminDashboard.admins'), icon: <ShieldCheck size={18} /> },
  ];
}

export default function AdminDashboard({
  onNavigate,
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
  // Transactions (paiement-service) et litiges (module Litige,
  // commande-service) : revenu plateforme + gestion des disputes
  // (section 3/4 du cahier des charges).
  transactions = [],
  litiges = [],
  onRembourserLitige,
  onResoudreLitige,
  onLogout,
  onCreateAdmin,
}) {
  const { t, i18n } = useTranslation();
  const navItems = getNavItems(t);
  const isMobile = useIsMobile(768);
  // ===== VUE PRODUITS (item 9) =====
  // Avant : l'onglet "Produits" changeait bien activeNav, mais aucun bloc
  // JSX ne correspondait a 'products' -> contenu vide. Reutilise le meme
  // hook que ProductCatalog/AgriconnectHome (liste publique de tous les
  // produits, tous vendeurs confondus) pour une vraie vue admin.
  const { produits: tousLesProduits, chargement: chargementProduits } = useProduits();
  const [activeNav, setActiveNav] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // La sidebar (220px fixes) ne laissait quasiment plus de place au
  // contenu sur mobile. Elle se replie desormais automatiquement sous
  // 768px ; l'utilisateur garde la main et peut la rouvrir manuellement.
  useEffect(() => {
    if (isMobile) setSidebarCollapsed(true);
  }, [isMobile]);
  // Anciennement : const [notifCount, setNotifCount] = useState(3) — un
  // compteur figé, jamais connecté aux vraies notifications. Calculé
  // maintenant à partir des notifications réellement non lues de
  // l'utilisateur connecté (même logique que NavigationConsole.jsx).
  const notifCount = currentUser
    ? notifications.filter(n => n.utilisateurId === currentUser.id && !n.lu).length
    : 0;
  const [toast, setToast] = useState('');
  // Utilisateur en attente de confirmation de suspension (fenêtre intégrée,
  // remplace l'ancien window.prompt() qui demandait le nombre de jours).
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [disputeFilter, setDisputeFilter] = useState('tous'); // 'tous' | 'non_livre' | 'autres'
  const [litigeActionEnCours, setLitigeActionEnCours] = useState(null); // litigeId en cours de traitement
  // Menu utilisateur de la topbar (avatar + nom + rôle), même comportement
  // que le menu déroulant de NavigationConsole (fermeture au clic extérieur).
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== INSCRIPTION D'UN ADMIN (point : onglet "Administrateurs") =====
  const [adminForm, setAdminForm] = useState({ nom: '', email: '', password: '', confirm: '' });
  const [adminFormErrors, setAdminFormErrors] = useState({});
  const [adminFormLoading, setAdminFormLoading] = useState(false);
  const [adminFormSuccess, setAdminFormSuccess] = useState('');

  // ===== RETRAIT PLATEFORME (onglet "Retrait", paiement-service) =====
  // Portefeuille de la plateforme (commissions + frais d'annulation) et
  // historique des retraits deja effectues par un admin.
  const [soldePlateforme, setSoldePlateforme] = useState(null);
  const [retraitsPlateforme, setRetraitsPlateforme] = useState([]);
  const [montantRetraitPlateforme, setMontantRetraitPlateforme] = useState('');
  const [methodeRetraitPlateforme, setMethodeRetraitPlateforme] = useState('MOMO');
  const [numeroRetraitPlateforme, setNumeroRetraitPlateforme] = useState('');
  const [retraitPlateformeEnCours, setRetraitPlateformeEnCours] = useState(false);
  const [retraitPlateformeError, setRetraitPlateformeError] = useState('');
  const [retraitPlateformeSuccess, setRetraitPlateformeSuccess] = useState('');

  const chargerSoldePlateforme = () => {
    paiementApi.getSoldePlateforme().then(setSoldePlateforme).catch(() => setSoldePlateforme(null));
    paiementApi.getRetraitsPlateforme().then(setRetraitsPlateforme).catch(() => setRetraitsPlateforme([]));
  };

  useEffect(() => {
    chargerSoldePlateforme();
  }, []);

  // Aucune coordonnee de paiement n'existait nulle part au prealable dans
  // le systeme : on les demande donc ici, juste avant le retrait, uniquement
  // a des fins de simulation d'un virement Mobile Money / Orange Money.
  const handleDemanderRetraitPlateforme = async () => {
    const montant = parseFloat(montantRetraitPlateforme);
    setRetraitPlateformeError('');
    setRetraitPlateformeSuccess('');
    if (!montant || montant <= 0) {
      setRetraitPlateformeError(t('adminDashboard.platformWithdrawInvalidAmount'));
      return;
    }
    if (soldePlateforme && montant > Number(soldePlateforme.soldeDisponible)) {
      setRetraitPlateformeError(t('adminDashboard.platformWithdrawInsufficientFunds'));
      return;
    }
    if (!/^6\d{8}$/.test(numeroRetraitPlateforme)) {
      setRetraitPlateformeError(t('adminDashboard.platformWithdrawInvalidNumber'));
      return;
    }
    setRetraitPlateformeEnCours(true);
    try {
      await paiementApi.demanderRetraitPlateforme({
        montant,
        methode: methodeRetraitPlateforme,
        numero: numeroRetraitPlateforme,
      });
      setRetraitPlateformeSuccess(t('adminDashboard.platformWithdrawSuccess'));
      setMontantRetraitPlateforme('');
      setNumeroRetraitPlateforme('');
      chargerSoldePlateforme();
    } catch (err) {
      setRetraitPlateformeError(err?.message || t('adminDashboard.platformWithdrawError'));
    } finally {
      setRetraitPlateformeEnCours(false);
    }
  };

  // ===== STATISTIQUES =====
  const totalUsers = registeredUsers.length;

  const totalVendeurs = registeredUsers.filter(u => u.role === 'vendeur').length;
  const totalOrders = adminOrders.length;
  // "Revenu total" (Accueil) : uniquement les commandes reellement payees
  // (avant, on sommait order.amount pour TOUTES les commandes, y compris
  // celles jamais payees ou annulees), plus les frais de certification
  // payes (integralement un revenu plateforme, cf. paiement-service
  // #confirmerPaiementInterne, aucun partage vendeur pour ce type).
  const revenuCertifications = vendorVerifications
    .filter(v => v.statutPaiement === 'PAYE')
    .reduce((sum, v) => sum + (v.montant || 0), 0);
  const totalRevenue = adminOrders
    .filter(o => o.paye)
    .reduce((sum, o) => sum + (o.amount || 0), 0) + revenuCertifications;
  // Onglet "Ventes" (section dediee) : une commande n'est une vente
  // effective que si elle est a la fois payee ET livree (pas simplement
  // "en attente" ou "en cours"). Cf. issue #12.
  const ventesPayeesLivrees = adminOrders.filter(o => o.paye && o.status === 'Livrée');
  const totalVentes = ventesPayeesLivrees.length;
  const revenuVentes = ventesPayeesLivrees.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalSignalements = signalements.length;
  const pendingSignalements = signalements.filter(s => s.status === 'pending').length;
  const pendingCertifications = vendorVerifications.filter(v => v.status === 'pending').length;
  const approvedCertifications = vendorVerifications.filter(v => v.status === 'approved').length;


  // ===== REVENU PLATEFORME (section 4) =====
  // Commission de 5% : prelevee des qu'une transaction est payee (et
  // conservee meme si la commande est ensuite annulee/remboursee, cf.
  // paiement-service). Frais d'annulation de 10% : retenus uniquement
  // sur les commandes annulees avant expedition. Detail affiche sous
  // la carte KPI uniquement (calcule cote frontend a partir des
  // transactions brutes).
  const commissionTotale = transactions
    .filter(tr => tr.statut === 'PAYE' || tr.statut === 'REMBOURSEE')
    .reduce((sum, tr) => sum + Number(tr.commission || 0), 0);
  const fraisAnnulationTotal = transactions
    .reduce((sum, tr) => sum + Number(tr.fraisAnnulation || 0), 0);
  // Le chiffre affiche sur la carte KPI vient directement du portefeuille
  // plateforme (paiement-service, soldePlateforme.totalGagne) plutot que
  // d'un recalcul cote frontend : cela garantit que la carte "Revenu
  // plateforme" de l'accueil et le montant "Fonds disponibles" de
  // l'onglet Retrait proviennent toujours de la meme source et
  // englobent toutes les sources de revenu (commissions commandes,
  // frais d'annulation, ET frais de certification - avant, seul ce
  // dernier apparaissait cote retrait car soldePlateforme n'etait pas
  // encore charge/utilise a l'accueil). Tant qu'aucun retrait
  // plateforme n'a ete effectue, les deux montants sont strictement
  // identiques ; totalGagne ne diminue jamais, contrairement a
  // soldeDisponible qui baisse a chaque retrait.
  const revenuPlateforme = soldePlateforme
    ? Number(soldePlateforme.totalGagne || 0)
    : commissionTotale + fraisAnnulationTotal;

  // ===== LITIGES (section 3) =====
  const litigesNonLivre = litiges.filter(l => l.type === 'PRODUIT_NON_LIVRE');
  const litigesAutres = litiges.filter(l => l.type !== 'PRODUIT_NON_LIVRE');
  const litigesOuverts = litiges.filter(l => l.statut === 'OUVERT');
  const litigesAffiches = litiges.filter(l => {
    if (disputeFilter === 'non_livre') return l.type === 'PRODUIT_NON_LIVRE';
    if (disputeFilter === 'autres') return l.type !== 'PRODUIT_NON_LIVRE';
    return true;
  });

  const libelleTypeLitige = (type) => {
    const cles = {
      PRODUIT_NON_LIVRE: 'disputeTypeNotDelivered',
      PRODUIT_ENDOMMAGE: 'disputeTypeDamaged',
      QUALITE_INSUFFISANTE: 'disputeTypeQuality',
      QUANTITE_INCORRECTE: 'disputeTypeQuantity',
      AUTRE: 'disputeTypeOther',
    };
    return t(`adminDashboard.${cles[type] || 'disputeTypeOther'}`);
  };

  const handleRembourser = async (litigeId) => {
    setLitigeActionEnCours(litigeId);
    try {
      await onRembourserLitige && await onRembourserLitige(litigeId);
    } finally {
      setLitigeActionEnCours(null);
    }
  };

  const handleResoudre = async (litigeId, statut) => {
    setLitigeActionEnCours(litigeId);
    try {
      await onResoudreLitige && await onResoudreLitige(litigeId, statut);
    } finally {
      setLitigeActionEnCours(null);
    }
  };

  const handleAdminFormChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
    setAdminFormErrors({ ...adminFormErrors, [e.target.name]: '' });
    setAdminFormSuccess('');
  };

  const validateAdminForm = () => {
    const errors = {};
    if (!adminForm.nom.trim()) errors.nom = t('adminDashboard.adminNameRequired');
    if (!adminForm.email.trim()) errors.email = t('adminDashboard.adminEmailRequired');
    else if (!/\S+@\S+\.\S+/.test(adminForm.email)) errors.email = t('adminDashboard.adminEmailInvalid');
    if (!adminForm.password) errors.password = t('adminDashboard.adminPasswordRequired');
    else if (adminForm.password.length < 6) errors.password = t('adminDashboard.adminPasswordMin');
    if (adminForm.confirm !== adminForm.password) errors.confirm = t('adminDashboard.adminPasswordMismatch');
    return errors;
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAdminForm();
    if (Object.keys(errors).length > 0) {
      setAdminFormErrors(errors);
      return;
    }
    setAdminFormLoading(true);
    setAdminFormErrors({});
    setAdminFormSuccess('');
    try {
      await onCreateAdmin && await onCreateAdmin({
        nom: adminForm.nom.trim(),
        email: adminForm.email.trim(),
        password: adminForm.password,
      });
      setAdminForm({ nom: '', email: '', password: '', confirm: '' });
      setAdminFormSuccess(t('adminDashboard.adminCreateSuccess'));
      showToast(t('adminDashboard.adminCreateSuccess'));
    } catch (err) {
      const message = err?.message && err.message.length < 200 ? err.message : t('adminDashboard.adminCreateError');
      setAdminFormErrors({ general: message });
    } finally {
      setAdminFormLoading(false);
    }
  };

  // ===== DERNIÈRES COMMANDES =====
  const lastOrders = adminOrders.slice(-3).reverse();

  // ===== DERNIERS SIGNALEMENTS =====
  const lastSignalements = signalements.slice(-3).reverse();

  // ===== MOIS POUR LE GRAPHIQUE (basé sur les commandes) =====
  // Toutes les commandes de la plateforme, tous mois/années confondus
  // (auparavant restreint a l'annee en cours, ce qui laissait le
  // graphique vide des que les commandes testees dataient d'une autre
  // annee).
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const monthlyOrders = months.map((_, idx) => {
    const count = adminOrders.filter(o => {
      if (!o.dateISO) return false;
      const d = new Date(o.dateISO);
      return d.getMonth() === idx;
    }).length;
    return count;
  });
  const maxMonthly = Math.max(1, ...monthlyOrders);

  // ===== TOAST =====
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
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
    } else if (item.id === 'users' || item.id === 'sales' || item.id === 'disputes' || item.id === 'products' || item.id === 'admins') {
      // reste sur le dashboard : affiche l'onglet Utilisateurs/Ventes/Litiges/Produits/Administrateurs ci-dessous
    } else if (item.id !== 'home') {
      showToast(`Navigation → ${item.label}`);
    }
  };

  return (
    <div style={styles.wrapper}>
      {toast && <div style={styles.toast}>{toast}</div>}
      {suspendTarget && (
        <ConfirmActionModal
          mode="suspend"
          title={t('adminDashboard.suspendConfirmTitle')}
          targetLabel={`${suspendTarget.prenom || ''} ${suspendTarget.nom || ''}`.trim()}
          confirmLabel={t('adminDashboard.suspend')}
          onConfirm={(jours) => {
            onToggleUserBlocked && onToggleUserBlocked(suspendTarget.id, jours);
            setSuspendTarget(null);
          }}
          onCancel={() => setSuspendTarget(null)}
        />
      )}

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
                {!sidebarCollapsed && item.id === 'disputes' && litigesOuverts.length > 0 && (
                  <span style={styles.navBadge}>{litigesOuverts.length}</span>
                )}
              </button>
            );
          })}
        </nav>
        <button style={styles.collapseBtn} onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3c2b8" strokeWidth="2.5">
            {sidebarCollapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
          </svg>
          {!sidebarCollapsed && <span style={styles.collapseBtnText}>{t('adminDashboard.reduce')}</span>}
        </button>
      </aside>

      {/* MAIN */}
      <div style={styles.main}>
        <header style={styles.topbar}>
          <div>
            <p style={styles.greetingText}>{t('adminDashboard.greeting')}</p>
            <p style={styles.dateText}>{t('adminDashboard.dashboardHeader')}</p>
          </div>
          <div style={styles.topbarRight}>
            <button style={styles.topbarIconBtn} onClick={() => onNavigate && onNavigate('home')} title={t('navigation.backToSite')}>
              <Home size={18} />
            </button>
            <button style={styles.topbarIconBtn} onClick={() => onNavigate && onNavigate('user-search')} title={t('navigation.searchTitle')}>
              <Search size={18} />
            </button>
            <button style={styles.langBtn} onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'en' : 'fr')}>
              🌐 {i18n.language === 'fr' ? 'EN' : 'FR'}
            </button>
            <button style={styles.topbarIconBtn} onClick={() => onNavigate && onNavigate('notifications')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifCount > 0 && <span style={styles.notifPip}>{notifCount}</span>}
            </button>
            {/* Avant : simple badge "AD" + bouton Déconnexion, seul moyen de
                quitter le tableau de bord admin (la navigation globale est
                volontairement masquee sur cet ecran, cf. NavigationConsole.jsx).
                Remplacé par les mêmes éléments que la navbar normale : icône
                accueil, recherche, langue, notifications, et un menu
                utilisateur (avatar + nom + rôle) avec la déconnexion dedans. */}
            <div style={styles.userMenuWrap} ref={userMenuRef}>
              <button style={styles.userPill} onClick={() => setShowUserMenu(!showUserMenu)}>
                <span style={styles.avatarSmall}>
                  {currentUser?.photo ? (
                    <img src={currentUser.photo} alt="Photo" style={styles.avatarImageSmall} />
                  ) : (
                    currentUser?.prenom?.[0]?.toUpperCase() || currentUser?.nom?.[0]?.toUpperCase() || 'A'
                  )}
                </span>
                {!isMobile && (
                  <span style={styles.userInfo}>
                    <span style={styles.userName}>{currentUser?.prenom || currentUser?.nom || currentUser?.email}</span>
                    <span style={styles.roleBadge}>{t('navigation.adminBadge')}</span>
                  </span>
                )}
                <ChevronDown size={14} color="#6c757d" />
              </button>
              {showUserMenu && (
                <div style={styles.userDropdown}>
                  <button style={styles.userDropdownItem} onClick={() => { setShowUserMenu(false); onNavigate && onNavigate('user-profile'); }}>
                    <User size={15} /> {t('navigation.myProfile')}
                  </button>
                  <button style={styles.userDropdownItemDanger} onClick={() => { setShowUserMenu(false); onLogout && onLogout(); }}>
                    <LogOut size={15} /> {t('navigation.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div style={styles.content}>

          {/* ===== VUE ACCUEIL ===== */}
          {activeNav === 'home' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>{t('adminDashboard.dashboard')}</h2>
                <p style={styles.pageTitleSub}>{t('adminDashboard.overview')}</p>
              </div>

              {/* Alertes */}
              {pendingCertifications > 0 && (
                // Anciennement : setActiveNav('certifications') pointait vers un
                // onglet interne jamais implémenté (aucun bloc de rendu pour
                // activeNav === 'certifications'), donc le "Voir →" n'aboutissait
                // nulle part. On réutilise la navigation déjà fonctionnelle de
                // l'item de la barre latérale (cf. handleNavClick ci-dessus).
                <div style={styles.certAlert} onClick={() => onNavigateToVendorVerification && onNavigateToVendorVerification()}>
                  <Shield size={20} color="#f5b041" />
                  <span style={styles.certAlertText}>
                    <strong>{pendingCertifications} {t('adminDashboard.pendingCertReq')}</strong> {t('adminDashboard.pendingCertRest')}
                  </span>
                  <span style={styles.certAlertBtn}>{t('adminDashboard.view')}</span>
                </div>
              )}

              {pendingVerificationCount > 0 && (
                <div
                  style={{ ...styles.certAlert, backgroundColor: '#e9f5ee', borderColor: '#b7e4c7' }}
                  onClick={() => onNavigateToVendorVerification && onNavigateToVendorVerification()}
                >
                  <ShieldCheck size={20} color="#2d6a4f" />
                  <span style={{ ...styles.certAlertText, color: '#1b4d3e' }}>
                    <strong>{pendingVerificationCount} {t('adminDashboard.newVendors')}</strong> {t('adminDashboard.pendingVerifRest')}
                  </span>
                  <span style={{ ...styles.certAlertBtn, color: '#2d6a4f' }}>{t('adminDashboard.view')}</span>
                </div>
              )}

              {/* KPI Cards */}
              <div style={styles.kpiGrid}>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}>👥</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>+{totalUsers}</span>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.usersLabel')}</p>
                  <p style={styles.kpiValue}>{totalUsers}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#fdf1ed' }}>🌾</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{totalVendeurs}</span>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.vendorsLabel')}</p>
                  <p style={styles.kpiValue}>{totalVendeurs}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}>📦</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{totalOrders}</span>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.ordersLabel')}</p>
                  <p style={styles.kpiValue}>{totalOrders}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#fff3e0' }}>💰</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{t('adminDashboard.revenueTag')}</span>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.totalRevenue')}</p>
                  <p style={styles.kpiValue}>{totalRevenue.toLocaleString()} FCFA</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e0f0ff' }}>🏦</div>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.platformRevenue')}</p>
                  <p style={styles.kpiValue}>{revenuPlateforme.toLocaleString()} FCFA</p>
                  <p style={styles.kpiBreakdown}>
                    {t('adminDashboard.platformRevenueCommission')} {commissionTotale.toLocaleString()} FCFA · {t('adminDashboard.platformRevenueFees')} {fraisAnnulationTotal.toLocaleString()} FCFA
                  </p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#fdf1ed' }}>⚠️</div>
                    <span style={{ ...styles.kpiChange, color: pendingSignalements > 0 ? '#dc3545' : '#2d6a4f', backgroundColor: pendingSignalements > 0 ? '#fde8ea' : '#d8f3dc' }}>{pendingSignalements}</span>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.signalementsLabel')}</p>
                  <p style={styles.kpiValue}>{totalSignalements}</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}>🏅</div>
                    <span style={{ ...styles.kpiChange, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{approvedCertifications}</span>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.certificationsLabel')}</p>
                  <p style={styles.kpiValue}>{pendingCertifications} {t('adminDashboard.pendingShort')}</p>
                </div>
              </div>

              {/* Graphique + Commandes récentes */}
              <div style={{ ...styles.midGrid, ...(isMobile && { gridTemplateColumns: '1fr' }) }}>
                <div style={styles.chartCard}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h3 style={styles.cardTitle}>{t('adminDashboard.ordersByMonth')}</h3>
                      <p style={styles.cardSub}>{t('adminDashboard.currentYear')}</p>
                    </div>
                  </div>
                  <div style={styles.chartArea}>
                    {monthlyOrders.map((val, i) => {
                      const h = (val / maxMonthly) * 100;
                      const isHov = hoveredBar === i;
                      return (
                        <div key={i} style={styles.barGroup} onMouseEnter={() => setHoveredBar(i)} onMouseLeave={() => setHoveredBar(null)}>
                          {isHov && <div style={styles.tooltip}>{val} {t('adminDashboard.orderWord')}{val > 1 ? 's' : ''}</div>}
                          <div style={{ ...styles.bar, height: `${h}%`, background: isHov ? 'linear-gradient(180deg, #1b4d3e 0%, #2d6a4f 100%)' : 'linear-gradient(180deg, #40916c 0%, #2d6a4f 100%)', opacity: isHov ? 1 : 0.75 }} />
                          <span style={styles.barLabel}>{months[i].slice(0,3)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={styles.ordersCard}>
                  <div style={styles.cardHeader}>
                    <div><h3 style={styles.cardTitle}>{t('adminDashboard.recentOrders')}</h3><p style={styles.cardSub}>{lastOrders.length} {t('adminDashboard.recentSuffix')}</p></div>
                    <button style={styles.viewAllBtn} onClick={() => onNavigate && onNavigate('order-management-admin')}>{t('adminDashboard.seeAll')}</button>
                  </div>
                  <div style={styles.ordersList}>
                    {lastOrders.length === 0 ? (
                      <p style={{ color: '#adb5bd', textAlign: 'center', padding: '20px 0' }}>{t('adminDashboard.noOrders')}</p>
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
                  <div><h3 style={styles.cardTitle}>{t('adminDashboard.recentSignalements')}</h3><p style={styles.cardSub}>{lastSignalements.length} {t('adminDashboard.signalementsWord')}</p></div>
                  <button style={styles.viewAllBtn} onClick={() => onNavigateToModeration && onNavigateToModeration()}>{t('adminDashboard.seeAll')}</button>
                </div>
                {lastSignalements.length === 0 ? (
                  <p style={{ color: '#adb5bd', padding: '20px', textAlign: 'center' }}>{t('adminDashboard.noSignalement')}</p>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr><th style={styles.th}>{t('adminDashboard.target')}</th><th style={styles.th}>{t('adminDashboard.reason')}</th><th style={styles.th}>{t('adminDashboard.author')}</th><th style={styles.th}>{t('adminDashboard.status')}</th></tr>
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

          {/* ===== VUE LITIGES (disputes) ===== */}
          {activeNav === 'disputes' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>{t('adminDashboard.disputes')}</h2>
                <p style={styles.pageTitleSub}>{litiges.length} {t('adminDashboard.disputesSub')}</p>
              </div>

              <div style={styles.filterRow}>
                <button
                  style={{ ...styles.filterBtn, ...(disputeFilter === 'tous' ? styles.filterBtnActive : {}) }}
                  onClick={() => setDisputeFilter('tous')}
                >
                  {t('adminDashboard.disputeFilterAll')}
                  <span style={styles.filterBadge}>{litiges.length}</span>
                </button>
                <button
                  style={{ ...styles.filterBtn, ...(disputeFilter === 'non_livre' ? styles.filterBtnActive : {}) }}
                  onClick={() => setDisputeFilter('non_livre')}
                >
                  {t('adminDashboard.disputeTypeNotDelivered')}
                  <span style={styles.filterBadge}>{litigesNonLivre.length}</span>
                </button>
                <button
                  style={{ ...styles.filterBtn, ...(disputeFilter === 'autres' ? styles.filterBtnActive : {}) }}
                  onClick={() => setDisputeFilter('autres')}
                >
                  {t('adminDashboard.disputeFilterOthers')}
                  <span style={styles.filterBadge}>{litigesAutres.length}</span>
                </button>
              </div>

              {litigesAffiches.length === 0 ? (
                <div style={styles.emptyState}><AlertOctagon size={40} color="#adb5bd" /><p>{t('adminDashboard.noDisputes')}</p></div>
              ) : (
                <div style={styles.certList}>
                  {[...litigesAffiches].reverse().map((l) => {
                    const enCours = litigeActionEnCours === l.id;
                    const estNonLivre = l.type === 'PRODUIT_NON_LIVRE';
                    const estOuvert = l.statut === 'OUVERT';
                    return (
                      <div key={l.id} style={styles.certCard}>
                        <div style={styles.certLeft}>
                          <div style={{ ...styles.certAvatar, backgroundColor: estNonLivre ? '#fdf1ed' : '#fff3e0', color: estNonLivre ? '#e07a5f' : '#f5b041' }}>
                            <AlertOctagon size={20} />
                          </div>
                          <div style={styles.certInfo}>
                            <h4 style={styles.certFarm}>{t('adminDashboard.order')} #{l.commandeId} · {libelleTypeLitige(l.type)}</h4>
                            <p style={styles.certVendeur}>{l.clientNom} · {l.dateCreation ? new Date(l.dateCreation).toLocaleDateString('fr-FR') : ''}</p>
                            {l.description && <p style={styles.certMeta}>{l.description}</p>}
                            {estNonLivre && l.fondsDejaRetires && (
                              <p style={{ ...styles.certMeta, color: '#c1502e', fontWeight: '700' }}>{t('adminDashboard.fundsAlreadyWithdrawn')}</p>
                            )}
                          </div>
                        </div>
                        <div style={styles.certRight}>
                          <span style={{
                            ...styles.certStatus,
                            color: l.statut === 'RESOLU' ? '#2d6a4f' : l.statut === 'REJETE' ? '#adb5bd' : '#f5b041',
                            backgroundColor: l.statut === 'RESOLU' ? '#e9f5ee' : l.statut === 'REJETE' ? '#f1f3f5' : '#fffbea',
                          }}>{l.statut}</span>
                          {estOuvert && (
                            <div style={styles.certActions}>
                              {estNonLivre ? (
                                <button
                                  style={{ ...styles.certApproveBtn, opacity: (enCours || l.fondsDejaRetires === true) ? 0.5 : 1, cursor: (enCours || l.fondsDejaRetires === true) ? 'not-allowed' : 'pointer' }}
                                  disabled={enCours || l.fondsDejaRetires === true}
                                  onClick={() => handleRembourser(l.id)}
                                  title={l.fondsDejaRetires ? t('adminDashboard.fundsAlreadyWithdrawn') : ''}
                                >
                                  <RotateCcw size={14} /> {t('adminDashboard.refundOrder')}
                                </button>
                              ) : null}
                              <button style={styles.certApproveBtn} disabled={enCours} onClick={() => handleResoudre(l.id, 'RESOLU')}>
                                <CheckCircle size={14} /> {t('adminDashboard.resolveDispute')}
                              </button>
                              <button style={styles.certRejectBtn} disabled={enCours} onClick={() => handleResoudre(l.id, 'REJETE')}>
                                <XCircle size={14} /> {t('adminDashboard.rejectDispute')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ===== VUE CERTIFICATIONS ===== */}
          {/* ===== VUE PRODUITS ===== */}
          {activeNav === 'products' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>{t('adminDashboard.productsTitle')}</h2>
                <p style={styles.pageTitleSub}>{tousLesProduits.length} {t('adminDashboard.productsSub')}</p>
              </div>
              <div style={styles.salesTableCard}>
                {chargementProduits ? (
                  <div style={styles.emptyState}><ShieldCheck size={40} color="#adb5bd" /><p>{t('productCatalog.loading')}</p></div>
                ) : tousLesProduits.length === 0 ? (
                  <div style={styles.emptyState}><ShieldCheck size={40} color="#adb5bd" /><p>{t('adminDashboard.noProductsYet')}</p></div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{t('adminDashboard.colProduct')}</th>
                        <th style={styles.th}>{t('adminDashboard.colVendor')}</th>
                        <th style={styles.th}>{t('adminDashboard.colCategory')}</th>
                        <th style={styles.th}>{t('adminDashboard.colPrice')}</th>
                        <th style={styles.th}>{t('adminDashboard.colStock')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tousLesProduits.map((p) => (
                        <tr key={p.id} style={styles.tr}>
                          <td style={styles.td}>{p.name}</td>
                          <td style={styles.td}>{p.farm}</td>
                          <td style={styles.td}>{p.category}</td>
                          <td style={styles.td}>{p.price.toLocaleString('fr-FR')} FCFA</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.statusBadge,
                              color: p.stock > 0 ? '#2d6a4f' : '#c0392b',
                              backgroundColor: p.stock > 0 ? '#d8f3dc' : '#fdecea',
                            }}>
                              {p.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ===== VUE UTILISATEURS ===== */}
          {activeNav === 'users' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>{t('adminDashboard.userManagement')}</h2>
                <p style={styles.pageTitleSub}>{t('adminDashboard.userManagementSub')}</p>
              </div>
              {registeredUsers.length === 0 ? (
                <div style={styles.emptyState}><ShieldCheck size={40} color="#adb5bd" /><p>{t('adminDashboard.noUsers')}</p></div>
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
                            {u.role === 'vendeur' ? t('adminDashboard.vendorTag') : t('adminDashboard.clientTag')}
                            {u.role === 'vendeur' && u.verificationStatus && (
                              <> · {t('adminDashboard.verification')} : {u.verificationStatus === 'approved' ? t('adminDashboard.approvedShort') : u.verificationStatus === 'rejected' ? t('adminDashboard.rejectedShort') : t('adminDashboard.pendingShortIcon')}</>
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
                            ? `${t('adminDashboard.suspendedUntil')} ${new Date(u.suspenduJusquau).toLocaleDateString('fr-FR')}`
                            : t('adminDashboard.active')}
                        </span>
                        <div style={styles.certActions}>
                          <button
                            style={u.suspendu ? styles.certApproveBtn : styles.certRejectBtn}
                            onClick={() => {
                              if (u.suspendu) {
                                onToggleUserBlocked && onToggleUserBlocked(u.id);
                              } else {
                                setSuspendTarget(u);
                              }
                            }}
                          >
                            {u.suspendu ? t('adminDashboard.liftSuspension') : t('adminDashboard.suspend')}
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
                <h2 style={styles.pageTitleText}>{t('adminDashboard.salesTitle')}</h2>
                <p style={styles.pageTitleSub}>{totalVentes} {t('adminDashboard.saleWord')} · {revenuVentes.toLocaleString('fr-FR')} FCFA {t('adminDashboard.totalRevenueOf')}</p>
              </div>
              <div style={styles.salesTableCard}>
                {ventesPayeesLivrees.length === 0 ? (
                  <div style={styles.emptyState}><ShieldCheck size={40} color="#adb5bd" /><p>{t('adminDashboard.noSalesYet')}</p></div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{t('adminDashboard.order')}</th>
                        <th style={styles.th}>{t('adminDashboard.client')}</th>
                        <th style={styles.th}>{t('adminDashboard.date')}</th>
                        <th style={styles.th}>{t('adminDashboard.amount')}</th>
                        <th style={styles.th}>{t('adminDashboard.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...ventesPayeesLivrees].reverse().map((o) => (
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

          {/* ===== VUE RETRAIT PLATEFORME ===== */}
          {activeNav === 'retrait' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>{t('adminDashboard.retrait')}</h2>
                <p style={styles.pageTitleSub}>{t('adminDashboard.platformWithdrawalsSub')}</p>
              </div>

              <div style={styles.kpiGrid}>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e0f0ff' }}>🏦</div>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.platformTotalEarned')}</p>
                  <p style={styles.kpiValue}>{Number(soldePlateforme?.totalGagne || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div style={styles.kpiCard}>
                  <div style={styles.kpiTop}>
                    <div style={{ ...styles.kpiIcon, backgroundColor: '#e9f5ee' }}>💵</div>
                  </div>
                  <p style={styles.kpiLabel}>{t('adminDashboard.platformAvailableBalance')}</p>
                  <p style={styles.kpiValue}>{Number(soldePlateforme?.soldeDisponible || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>

              <div style={styles.withdrawFormCard}>
                <h3 style={styles.cardTitle}>{t('adminDashboard.platformWithdrawFormTitle')}</h3>
                <p style={styles.cardSub}>{t('adminDashboard.platformWithdrawFormSub')}</p>

                <div style={styles.field}>
                  <label style={styles.label}>{t('adminDashboard.platformWithdrawMethodLabel')}</label>
                  <div style={styles.methodRow}>
                    <button
                      type="button"
                      style={methodeRetraitPlateforme === 'MOMO' ? styles.methodBtnActive : styles.methodBtn}
                      onClick={() => setMethodeRetraitPlateforme('MOMO')}
                      disabled={retraitPlateformeEnCours}
                    >
                      {t('adminDashboard.platformWithdrawMethodMomo')}
                    </button>
                    <button
                      type="button"
                      style={methodeRetraitPlateforme === 'ORANGE_MONEY' ? styles.methodBtnActive : styles.methodBtn}
                      onClick={() => setMethodeRetraitPlateforme('ORANGE_MONEY')}
                      disabled={retraitPlateformeEnCours}
                    >
                      {t('adminDashboard.platformWithdrawMethodOM')}
                    </button>
                  </div>
                </div>

                <div style={styles.withdrawFormRow}>
                  <div style={styles.withdrawInputWrap}>
                    <label style={styles.label}>{t('adminDashboard.platformWithdrawNumberLabel')}</label>
                    <input
                      type="tel"
                      placeholder={t('adminDashboard.platformWithdrawNumberPlaceholder')}
                      value={numeroRetraitPlateforme}
                      onChange={(e) => setNumeroRetraitPlateforme(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      style={styles.withdrawInput}
                      disabled={retraitPlateformeEnCours}
                    />
                  </div>
                  <div style={styles.withdrawInputWrap}>
                    <label style={styles.label}>{t('adminDashboard.platformWithdrawAmountLabel')}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder={t('adminDashboard.platformWithdrawAmountPlaceholder')}
                      value={montantRetraitPlateforme}
                      onChange={(e) => setMontantRetraitPlateforme(e.target.value)}
                      style={styles.withdrawInput}
                      disabled={retraitPlateformeEnCours}
                    />
                  </div>
                  <button
                    style={{ ...styles.adminFormSubmit, opacity: retraitPlateformeEnCours ? 0.7 : 1, alignSelf: 'flex-end' }}
                    onClick={handleDemanderRetraitPlateforme}
                    disabled={retraitPlateformeEnCours}
                  >
                    {retraitPlateformeEnCours ? t('adminDashboard.platformWithdrawInProgress') : t('adminDashboard.platformWithdrawSubmit')}
                  </button>
                </div>

                {retraitPlateformeError && (
                  <p style={styles.adminFormError}>{retraitPlateformeError}</p>
                )}
                {retraitPlateformeSuccess && (
                  <p style={{ ...styles.adminFormError, color: '#2d6a4f' }}>{retraitPlateformeSuccess}</p>
                )}
              </div>

              <div style={styles.salesTableCard}>
                <h3 style={styles.cardTitle}>{t('adminDashboard.platformWithdrawHistoryTitle')}</h3>
                {retraitsPlateforme.length === 0 ? (
                  <div style={styles.emptyState}>
                    <ShieldCheck size={40} color="#adb5bd" />
                    <p>{t('adminDashboard.platformWithdrawHistoryEmpty')}</p>
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{t('adminDashboard.platformWithdrawHistoryDate')}</th>
                        <th style={styles.th}>{t('adminDashboard.platformWithdrawHistoryAmount')}</th>
                        <th style={styles.th}>{t('adminDashboard.platformWithdrawHistoryMethod')}</th>
                        <th style={styles.th}>{t('adminDashboard.platformWithdrawHistoryNumber')}</th>
                        <th style={styles.th}>{t('adminDashboard.platformWithdrawHistoryReference')}</th>
                        <th style={styles.th}>{t('adminDashboard.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {retraitsPlateforme.map(r => (
                        <tr key={r.id} style={styles.tr}>
                          <td style={styles.td}>{r.dateDemande ? new Date(r.dateDemande).toLocaleDateString('fr-FR') : '—'}</td>
                          <td style={styles.td}>{Number(r.montant || 0).toLocaleString('fr-FR')} FCFA</td>
                          <td style={styles.td}>{r.methode === 'MOMO' ? t('adminDashboard.platformWithdrawMethodMomo') : t('adminDashboard.platformWithdrawMethodOM')}</td>
                          <td style={styles.td}>{r.numero || '—'}</td>
                          <td style={styles.td}>{r.referencePaiement || '—'}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, color: '#2d6a4f', backgroundColor: '#d8f3dc' }}>{r.statut}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ===== VUE ADMINISTRATEURS (inscription d'un nouvel admin) ===== */}
          {activeNav === 'admins' && (
            <>
              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>{t('adminDashboard.adminsTitle')}</h2>
                <p style={styles.pageTitleSub}>{t('adminDashboard.adminsSub')}</p>
              </div>

              <div style={styles.adminFormCard}>
                <h3 style={styles.adminFormTitle}>{t('adminDashboard.adminCreateTitle')}</h3>
                {adminFormErrors.general && (
                  <div style={styles.adminFormAlertError}>{adminFormErrors.general}</div>
                )}
                {adminFormSuccess && (
                  <div style={styles.adminFormAlertSuccess}>{adminFormSuccess}</div>
                )}
                <form onSubmit={handleCreateAdminSubmit} style={styles.adminForm}>
                  <div style={styles.adminFormField}>
                    <label style={styles.adminFormLabel}>{t('adminDashboard.adminNameLabel')}</label>
                    <input
                      name="nom"
                      type="text"
                      value={adminForm.nom}
                      onChange={handleAdminFormChange}
                      style={{ ...styles.adminFormInput, borderColor: adminFormErrors.nom ? '#e07a5f' : '#dee2e6' }}
                      placeholder={t('adminDashboard.adminNamePlaceholder')}
                    />
                    {adminFormErrors.nom && <span style={styles.adminFormError}>{adminFormErrors.nom}</span>}
                  </div>
                  <div style={styles.adminFormField}>
                    <label style={styles.adminFormLabel}>{t('adminDashboard.adminEmailLabel')}</label>
                    <input
                      name="email"
                      type="email"
                      value={adminForm.email}
                      onChange={handleAdminFormChange}
                      style={{ ...styles.adminFormInput, borderColor: adminFormErrors.email ? '#e07a5f' : '#dee2e6' }}
                      placeholder={t('adminDashboard.adminEmailPlaceholder')}
                    />
                    {adminFormErrors.email && <span style={styles.adminFormError}>{adminFormErrors.email}</span>}
                  </div>
                  <div style={{ ...styles.adminFormRow2, ...(isMobile && { gridTemplateColumns: '1fr' }) }}>
                    <div style={styles.adminFormField}>
                      <label style={styles.adminFormLabel}>{t('adminDashboard.adminPasswordLabel')}</label>
                      <input
                        name="password"
                        type="password"
                        value={adminForm.password}
                        onChange={handleAdminFormChange}
                        style={{ ...styles.adminFormInput, borderColor: adminFormErrors.password ? '#e07a5f' : '#dee2e6' }}
                        placeholder={t('adminDashboard.adminPasswordPlaceholder')}
                      />
                      {adminFormErrors.password && <span style={styles.adminFormError}>{adminFormErrors.password}</span>}
                    </div>
                    <div style={styles.adminFormField}>
                      <label style={styles.adminFormLabel}>{t('adminDashboard.adminConfirmLabel')}</label>
                      <input
                        name="confirm"
                        type="password"
                        value={adminForm.confirm}
                        onChange={handleAdminFormChange}
                        style={{ ...styles.adminFormInput, borderColor: adminFormErrors.confirm ? '#e07a5f' : '#dee2e6' }}
                        placeholder={t('adminDashboard.adminConfirmPlaceholder')}
                      />
                      {adminFormErrors.confirm && <span style={styles.adminFormError}>{adminFormErrors.confirm}</span>}
                    </div>
                  </div>
                  <button type="submit" style={{ ...styles.adminFormSubmit, opacity: adminFormLoading ? 0.7 : 1 }} disabled={adminFormLoading}>
                    {adminFormLoading ? t('adminDashboard.adminCreating') : t('adminDashboard.adminCreateSubmit')}
                  </button>
                </form>
              </div>

              <div style={styles.pageTitle}>
                <h2 style={styles.pageTitleText}>{t('adminDashboard.adminsListTitle')}</h2>
              </div>
              {registeredUsers.filter(u => u.role === 'admin').length === 0 ? (
                <div style={styles.emptyState}><ShieldCheck size={40} color="#adb5bd" /><p>{t('adminDashboard.noAdmins')}</p></div>
              ) : (
                <div style={styles.certList}>
                  {registeredUsers.filter(u => u.role === 'admin').map((u) => (
                    <div key={u.id} style={styles.certCard}>
                      <div style={styles.certLeft}>
                        <div style={styles.certAvatar}>{u.prenom?.[0]?.toUpperCase()}{u.nom?.[0]?.toUpperCase()}</div>
                        <div style={styles.certInfo}>
                          <h4 style={styles.certFarm}>{u.prenom} {u.nom}</h4>
                          <p style={styles.certVendeur}>✉️ {u.email}</p>
                        </div>
                      </div>
                      <div style={styles.certRight}>
                        <span style={{ ...styles.certStatus, color: '#1b4d3e', backgroundColor: '#e9f5ee' }}>
                          <Shield size={12} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> {t('adminDashboard.adminTag')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
  avatarSmall: { width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#1b4d3e', color: '#ffffff', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 },
  avatarImageSmall: { width: '100%', height: '100%', objectFit: 'cover' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1px solid #f5d4c8', backgroundColor: '#fff5f2', color: '#e07a5f', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  langBtn: { padding: '8px 12px', borderRadius: '10px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', fontSize: '13px', fontWeight: '700', color: '#495057', cursor: 'pointer', whiteSpace: 'nowrap' },
  userMenuWrap: { position: 'relative' },
  userPill: { display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px 4px 4px', borderRadius: '10px', border: '1px solid #e9ecef', backgroundColor: '#f8f9fa', cursor: 'pointer' },
  userInfo: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' },
  userName: { fontSize: '13px', fontWeight: '700', color: '#212529' },
  roleBadge: { fontSize: '10.5px', fontWeight: '700', color: '#6c757d' },
  userDropdown: { position: 'absolute', top: 'calc(100% + 8px)', right: 0, backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e9ecef', boxShadow: '0 12px 28px rgba(0,0,0,0.12)', minWidth: '180px', padding: '6px', zIndex: 100 },
  userDropdownItem: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#212529', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textAlign: 'left' },
  userDropdownItemDanger: { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#e07a5f', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'left' },
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
  kpiBreakdown: { fontSize: '10px', color: '#adb5bd', fontWeight: '600', marginTop: '4px' },
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
  // Onglet "Retrait" (portefeuille plateforme) : memes proportions que le
  // formulaire de retrait vendeur (SellerDashboard), adaptees aux styles
  // deja definis ici (cardTitle/cardSub, label, adminFormSubmit...).
  withdrawFormCard: { backgroundColor: '#ffffff', padding: '20px', borderRadius: '14px', border: '1px solid #e9ecef', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' },
  withdrawFormRow: { display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '12px' },
  withdrawInputWrap: { flex: 1, minWidth: '200px' },
  withdrawInput: { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #dee2e6', fontSize: '14px', fontWeight: '600', color: '#212529', backgroundColor: '#f8f9fa', boxSizing: 'border-box', outline: 'none' },
  methodRow: { display: 'flex', gap: '10px', marginTop: '4px' },
  methodBtn: { padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #dee2e6', backgroundColor: '#ffffff', color: '#6c757d', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  methodBtnActive: { padding: '10px 18px', borderRadius: '10px', border: '1.5px solid #1b4d3e', backgroundColor: '#1b4d3e', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  adminFormCard: { backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e9ecef', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '28px', maxWidth: '560px' },
  adminFormTitle: { fontSize: '15px', fontWeight: '800', color: '#1b4d3e', margin: '0 0 16px 0' },
  adminFormAlertError: { backgroundColor: '#fdecea', color: '#c0392b', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '14px' },
  adminFormAlertSuccess: { backgroundColor: '#e9f5ee', color: '#1b4d3e', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', marginBottom: '14px' },
  adminForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  adminFormRow2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  adminFormField: { display: 'flex', flexDirection: 'column', gap: '6px' },
  adminFormLabel: { fontSize: '13px', fontWeight: '700', color: '#212529' },
  adminFormInput: { padding: '12px 14px', border: '1.5px solid #dee2e6', borderRadius: '10px', fontSize: '14px', color: '#212529', outline: 'none', backgroundColor: '#f8f9fa' },
  adminFormError: { fontSize: '12px', color: '#e07a5f', fontWeight: '600' },
  adminFormSubmit: { padding: '13px', backgroundColor: '#1b4d3e', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', marginTop: '4px' },
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