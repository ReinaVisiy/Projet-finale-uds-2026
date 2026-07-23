 // src/components/NotificationsCenter.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const typeIconMap = {
  success: <CheckCircle size={20} color="#2d6a4f" />,
  warning: <AlertTriangle size={20} color="#f5b041" />,
  error: <AlertCircle size={20} color="#e07a5f" />,
  info: <Info size={20} color="#2d6a4f" />,
};

const typeColor = {
  success: { bg: '#e9f5ee', border: '#2d6a4f' },
  warning: { bg: '#fff3e0', border: '#f5b041' },
  error: { bg: '#fdf1ed', border: '#e07a5f' },
  info: { bg: '#e9f5ee', border: '#2d6a4f' },
};

// Cibles reellement gerees par App.jsx#onNavigateToLink (une seule source de
// verite cote navigation) : un lien absent de cette liste ne mene nulle part
// de valide, donc le bouton "voir plus" ne doit pas s'afficher pour lui.
const LIENS_VALIDES = [
  '/profil',
  '/orders',
  '/purchases',
  '/seller-dashboard',
  '/vendeur-orders',
  '/messages-inbox',
  '/certification',
  '/admin/dashboard',
  '/admin/order-management-admin',
  '/admin/moderation-panel',
  '/admin/vendor-verification',
];

const estLienValide = (lien) => typeof lien === 'string' && LIENS_VALIDES.includes(lien);

export default function NotificationsCenter({
  onBack,
  currentUser,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNavigateToLink,
}) {
  const { t, i18n } = useTranslation();
  const [filterType, setFilterType] = useState('all');

  // Sécurité : si notifications n'est pas un tableau, on le définit comme vide
  const notifs = Array.isArray(notifications) ? notifications : [];

  // Filtrer les notifications de l'utilisateur connecté
  const userNotifs = currentUser
    ? notifs.filter(n => n.utilisateurId === currentUser.id)
    : [];

  const filtered = filterType === 'all'
    ? userNotifs
    : userNotifs.filter(n => n.type === filterType);

  const unreadCount = userNotifs.filter(n => !n.lu).length;

  const handleMarkAsRead = (id) => {
    if (onMarkAsRead) onMarkAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  const handleDelete = (id) => {
    if (onDelete) onDelete(id);
  };

  const getIcon = (type) => typeIconMap[type] || <Info size={20} color="#2d6a4f" />;

  // Traduit la notification au moment de l'affichage, dans la langue
  // actuellement choisie par la personne qui consulte — jamais celle de
  // qui a déclenché l'événement. Repli sur un texte générique si la clé
  // est absente (anciennes notifications créées avant ce changement, ou
  // messageKey inconnue côté traductions).
  const getMessage = (notif) => {
    if (!notif.messageKey) return notif.message || '';
    return t(`notifications.${notif.messageKey}`, {
      ...notif.parametres,
      defaultValue: t('notifications.generic'),
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>{t('notificationsCenter.back')}</button>
        <h1 style={styles.title}>
          <Bell size={24} /> {t('notificationsCenter.title')}
          {unreadCount > 0 && (
            <span style={styles.unreadBadge}>{t('notificationsCenter.unreadBadge', { count: unreadCount })}</span>
          )}
        </h1>
        <div style={styles.actions}>
          {unreadCount > 0 && (
            <button style={styles.markAllBtn} onClick={handleMarkAllAsRead}>
              {t('notificationsCenter.markAllRead')}
            </button>
          )}
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(filterType === 'all' ? styles.activeTab : {}) }}
          onClick={() => setFilterType('all')}
        >
          {t('notificationsCenter.tabAll', { count: userNotifs.length })}
        </button>
        <button
          style={{ ...styles.tab, ...(filterType === 'info' ? styles.activeTab : {}) }}
          onClick={() => setFilterType('info')}
        >
          {t('notificationsCenter.tabInfo', { count: userNotifs.filter(n => n.type === 'info').length })}
        </button>
        <button
          style={{ ...styles.tab, ...(filterType === 'success' ? styles.activeTab : {}) }}
          onClick={() => setFilterType('success')}
        >
          {t('notificationsCenter.tabSuccess', { count: userNotifs.filter(n => n.type === 'success').length })}
        </button>
        <button
          style={{ ...styles.tab, ...(filterType === 'warning' ? styles.activeTab : {}) }}
          onClick={() => setFilterType('warning')}
        >
          {t('notificationsCenter.tabWarning', { count: userNotifs.filter(n => n.type === 'warning').length })}
        </button>
        <button
          style={{ ...styles.tab, ...(filterType === 'error' ? styles.activeTab : {}) }}
          onClick={() => setFilterType('error')}
        >
          {t('notificationsCenter.tabError', { count: userNotifs.filter(n => n.type === 'error').length })}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <Bell size={64} color="#dee2e6" />
          <p style={styles.emptyText}>{t('notificationsCenter.emptyText')}</p>
        </div>
      ) : (
        <div style={styles.list}>
          {filtered.map((notif) => {
            const color = typeColor[notif.type] || typeColor.info;
            return (
              <div
                key={notif.id}
                style={{
                  ...styles.notifItem,
                  backgroundColor: notif.lu ? '#f8f9fa' : '#ffffff',
                  borderLeftColor: notif.lu ? '#e9ecef' : color.border,
                }}
                onClick={() => !notif.lu && handleMarkAsRead(notif.id)}
              >
                <div style={{ ...styles.iconWrap, backgroundColor: color.bg }}>
                  {getIcon(notif.type)}
                </div>
                <div style={styles.content}>
                  <div style={styles.topRow}>
                    <span style={styles.message}>{getMessage(notif)}</span>
                    {!notif.lu && <span style={styles.unreadDot}>●</span>}
                  </div>
                  <div style={styles.bottomRow}>
                    <span style={styles.date}>
                      {new Date(notif.dateCreation).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {estLienValide(notif.lien) && (
                      <button
                        style={styles.linkBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onNavigateToLink) {
                            onNavigateToLink(notif.lien);
                          } else {
                            alert(t('notificationsCenter.navigateAlert', { link: notif.lien }));
                          }
                        }}
                      >
                        {t('notificationsCenter.seeMore')}
                      </button>
                    )}
                    <button
                      style={styles.deleteBtn}
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 24px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  backBtn: {
    padding: '10px 18px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '24px',
    fontWeight: '900',
    color: '#212529',
    margin: 0,
  },
  unreadBadge: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#e07a5f',
    padding: '4px 12px',
    borderRadius: '20px',
    marginLeft: '4px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
  },
  markAllBtn: {
    padding: '10px 18px',
    backgroundColor: '#e9f5ee',
    color: '#2d6a4f',
    border: 'none',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e9ecef',
    paddingBottom: '8px',
  },
  tab: {
    padding: '6px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6c757d',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  activeTab: {
    backgroundColor: '#e9f5ee',
    color: '#1b4d3e',
    fontWeight: '700',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 0',
    color: '#adb5bd',
  },
  emptyText: {
    fontSize: '16px',
    marginTop: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  notifItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 20px',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    borderLeftWidth: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  iconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
  },
  message: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#212529',
    lineHeight: '1.4',
  },
  unreadDot: {
    color: '#2d6a4f',
    fontSize: '12px',
    flexShrink: 0,
  },
  bottomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '12px',
    color: '#adb5bd',
  },
  date: {
    fontWeight: '500',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#2d6a4f',
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    padding: 0,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#adb5bd',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px',
    borderRadius: '6px',
    transition: 'all 0.2s',
    marginLeft: 'auto',
  },
};