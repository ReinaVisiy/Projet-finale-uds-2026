// src/components/NavigationConsole.jsx
import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, LogOut, ChevronDown, ShieldCheck, Home, Package, LayoutGrid, Bell, Users, ShoppingBag, Menu, X } from 'lucide-react';

export default function NavigationConsole({
  currentScreen,
  onNavigate,
  currentUser,
  onLogout,
  cartCount = 0,
  lang = 'fr',
  onToggleLang,
  notifications = [],
  isClientMode = false,
  onToggleClientMode,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hideOnScreens = [
    'admin-dashboard', 'order-management-admin', 'order-detail-admin', 'moderation-panel', 'vendor-verification',
  ];
  if (hideOnScreens.includes(currentScreen)) return null;

  const goHome = () => onNavigate('home');

  const handleLogoutClick = () => {
    setShowMenu(false);
    setMobileMenuOpen(false);
    onLogout();
  };

  const unreadNotifications = currentUser
    ? notifications.filter(n => n.utilisateurId === currentUser.id && !n.lu).length
    : 0;

  return (
    <header style={styles.wrapper}>
      <div style={styles.inner}>
        {/* Logo */}
        <button style={styles.brand} onClick={goHome}>
          <div style={styles.brandLogo}>🌿</div>
          <span style={styles.brandName}>Agriconnect</span>
        </button>

        {/* Menu mobile toggle */}
        <button style={styles.mobileToggle} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Liens centraux - Desktop */}
        <nav style={{ ...styles.navLinks, ...(mobileMenuOpen ? styles.navLinksMobile : {}) }}>
          <button
            style={{ ...styles.navLink, ...(currentScreen === 'home' ? styles.navLinkActive : {}) }}
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
          >
            <Home size={15} /> Accueil
          </button>
          <button
            style={{ ...styles.navLink, ...(currentScreen === 'catalogue' ? styles.navLinkActive : {}) }}
            onClick={() => { onNavigate('catalogue'); setMobileMenuOpen(false); }}
          >
            <LayoutGrid size={15} /> Catalogue
          </button>
          {currentUser?.role === 'vendeur' && !isClientMode && (
            <button
              style={{ ...styles.navLink, ...(currentScreen === 'my-products' ? styles.navLinkActive : {}) }}
              onClick={() => { onNavigate('my-products'); setMobileMenuOpen(false); }}
            >
              <Package size={15} /> Mes produits
            </button>
          )}

          {/* Zone droite intégrée dans le menu mobile */}
          {mobileMenuOpen && (
            <div style={styles.mobileRightZone}>
              {onToggleLang && (
                <button style={styles.langBtn} onClick={onToggleLang}>
                  🌐 {lang === 'fr' ? 'EN' : 'FR'}
                </button>
              )}
              {!currentUser ? (
                <div style={styles.authButtons}>
                  <button style={styles.loginBtn} onClick={() => { onNavigate('login-page'); setMobileMenuOpen(false); }}>Connexion</button>
                  <button style={styles.registerBtn} onClick={() => { onNavigate('register'); setMobileMenuOpen(false); }}>S'inscrire</button>
                </div>
              ) : (
                <>
                  {(currentUser.role === 'client' || isClientMode) && (
                    <button style={styles.cartBtn} onClick={() => { onNavigate('cart'); setMobileMenuOpen(false); }}>
                      <ShoppingCart size={19} />
                      {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                    </button>
                  )}
                  <button style={styles.notifBtn} onClick={() => { onNavigate('notifications'); setMobileMenuOpen(false); }}>
                    <Bell size={20} />
                    {unreadNotifications > 0 && <span style={styles.notifBadge}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
                  </button>
                </>
              )}
            </div>
          )}
        </nav>

        {/* Zone droite - Desktop */}
        <div style={styles.rightZone}>
          {onToggleLang && (
            <button style={styles.langBtn} onClick={onToggleLang}>
              🌐 {lang === 'fr' ? 'EN' : 'FR'}
            </button>
          )}
          {!currentUser ? (
            <div style={styles.authButtons}>
              <button style={styles.loginBtn} onClick={() => onNavigate('login-page')}>Connexion</button>
              <button style={styles.registerBtn} onClick={() => onNavigate('register')}>S'inscrire</button>
            </div>
          ) : (
            <>
              {(currentUser.role === 'client' || isClientMode) && (
                <button style={styles.cartBtn} onClick={() => onNavigate('cart')}>
                  <ShoppingCart size={19} />
                  {cartCount > 0 && <span style={styles.cartBadge}>{cartCount}</span>}
                </button>
              )}
              <button style={styles.notifBtn} onClick={() => onNavigate('notifications')}>
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span style={styles.notifBadge}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                )}
              </button>

              <div style={styles.userMenuWrap} ref={menuRef}>
                <button style={styles.userPill} onClick={() => setShowMenu(!showMenu)}>
                  <span style={styles.avatar}>
                    {currentUser.photo ? (
                      <img src={currentUser.photo} alt="Photo" style={styles.avatarImage} />
                    ) : (
                      currentUser.prenom?.[0]?.toUpperCase() || 'U'
                    )}
                  </span>
                  <span style={styles.userInfo}>
                    <span style={styles.userName}>{currentUser.prenom || currentUser.email}</span>
                    <span style={styles.roleBadge}>
                      {isClientMode ? '🛒 Client (mode)' :
                        currentUser.role === 'vendeur' ? '🌾 Vendeur' :
                        currentUser.role === 'admin' ? '🛡️ Admin' : '🛒 Client'}
                    </span>
                  </span>
                  <ChevronDown size={14} color="#6c757d" />
                </button>

                {showMenu && (
                  <div style={styles.dropdown}>
                    <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onNavigate('user-profile'); }}>
                      <User size={15} /> Mon profil
                    </button>
                    <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onNavigate('notifications'); }}>
                      <Bell size={15} /> Notifications
                      {unreadNotifications > 0 && <span style={styles.dropdownBadge}>{unreadNotifications}</span>}
                    </button>
                    {currentUser.role === 'client' && (
                      <>
                        <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onNavigate('orders'); }}>
                          <Package size={15} /> Mes commandes
                        </button>
                        <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onNavigate('purchases'); }}>
                          <ShoppingBag size={15} /> Mes achats
                        </button>
                      </>
                    )}
                    {currentUser.role === 'vendeur' && !isClientMode && (
                      <>
                        <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onNavigate('seller-dashboard'); }}>
                          <Package size={15} /> Tableau de bord
                        </button>
                        <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onNavigate('vendeur-orders'); }}>
                          <ShoppingBag size={15} /> Commandes reçues
                        </button>
                      </>
                    )}
                    {currentUser.role === 'vendeur' && (
                      <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onToggleClientMode(); }}>
                        <Users size={15} />
                        {isClientMode ? 'Revenir en mode vendeur' : 'Se connecter en tant que client'}
                      </button>
                    )}
                    {currentUser.role === 'admin' && (
                      <button style={styles.dropdownItem} onClick={() => { setShowMenu(false); onNavigate('admin-dashboard'); }}>
                        <Package size={15} /> Tableau de bord admin
                      </button>
                    )}
                    <div style={styles.dropdownDivider} />
                    <button style={styles.dropdownItemDanger} onClick={handleLogoutClick}>
                      <LogOut size={15} /> Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  wrapper: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e9ecef',
    position: 'sticky',
    top: 0,
    zIndex: 200,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  inner: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  brandLogo: { fontSize: '24px' },
  brandName: { fontSize: '18px', fontWeight: '900', color: '#1b4d3e', letterSpacing: '-0.02em' },

  mobileToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#212529',
    padding: '4px',
    '@media (max-width: 768px)': { display: 'flex' },
  },

  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flex: 1,
    '@media (max-width: 768px)': {
      display: 'none',
      flexDirection: 'column',
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: '#ffffff',
      padding: '16px',
      borderBottom: '1px solid #e9ecef',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      gap: '8px',
      zIndex: 300,
    },
  },
  navLinksMobile: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: '16px',
    borderBottom: '1px solid #e9ecef',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    gap: '8px',
    zIndex: 300,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: 'none',
    border: 'none',
    color: '#6c757d',
    fontSize: '13.5px',
    fontWeight: '700',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    '@media (max-width: 768px)': { width: '100%', justifyContent: 'center' },
  },
  navLinkActive: {
    backgroundColor: '#e9f5ee',
    color: '#1b4d3e',
  },

  rightZone: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    '@media (max-width: 768px)': { display: 'none' },
  },
  mobileRightZone: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #e9ecef',
    width: '100%',
  },

  langBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 10px',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    border: '1px solid #e9ecef',
    borderRadius: '10px',
    fontSize: '12.5px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  loginBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#1b4d3e',
    border: '1.5px solid #dee2e6',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  registerBtn: {
    padding: '8px 16px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },

  cartBtn: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#212529',
  },
  cartBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    backgroundColor: '#e07a5f',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },

  notifBtn: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#212529',
  },
  notifBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    backgroundColor: '#dc3545',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
  },

  userMenuWrap: { position: 'relative' },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px 4px 4px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '999px',
    cursor: 'pointer',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '800',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '@media (max-width: 480px)': { display: 'none' },
  },
  userName: { fontSize: '12.5px', fontWeight: '800', color: '#212529', lineHeight: '1.2' },
  roleBadge: { fontSize: '10.5px', fontWeight: '700', color: '#6c757d', display: 'flex', alignItems: 'center' },

  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e9ecef',
    borderRadius: '14px',
    boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
    padding: '8px',
    minWidth: '200px',
    zIndex: 300,
    '@media (max-width: 480px)': { right: '-10px', minWidth: '180px' },
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    color: '#212529',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '10px',
    textAlign: 'left',
  },
  dropdownBadge: {
    marginLeft: 'auto',
    backgroundColor: '#dc3545',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '800',
    borderRadius: '50%',
    padding: '2px 7px',
  },
  dropdownItemDanger: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '10px 12px',
    background: 'none',
    border: 'none',
    color: '#c0392b',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    borderRadius: '10px',
    textAlign: 'left',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#f1f3f5',
    margin: '6px 4px',
  },
};
