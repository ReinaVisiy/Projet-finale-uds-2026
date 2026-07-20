// src/components/UserProfile.jsx
import React from 'react';
import { User, Mail, Phone, ArrowLeft, Settings, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function UserProfile({
  currentUser,
  onEditProfile,
  onChangePassword,
  onBack,
}) {
  const { t } = useTranslation();
  if (!currentUser) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <p style={{ textAlign: 'center', color: '#6c757d' }}>
            {t('userProfile.mustLogin')}
          </p>
          <button style={styles.backBtn} onClick={onBack}>
            {t('userProfile.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Bouton Retour en haut à gauche */}
        <button style={styles.backBtnSmall} onClick={onBack}>
          <ArrowLeft size={20} /> {t('userProfile.back')}
        </button>

        {/* Photo de profil centrée */}
        <div style={styles.photoContainer}>
          {currentUser.photo ? (
            <img src={currentUser.photo} alt="Photo de profil" style={styles.photo} />
          ) : (
            <div style={styles.photoPlaceholder}>
              <User size={48} color="#adb5bd" />
            </div>
          )}
        </div>

        {/* Nom et prénom */}
        <h1 style={styles.name}>{currentUser.prenom} {currentUser.nom}</h1>

        {/* Informations de contact */}
        <div style={styles.infoList}>
          <div style={styles.infoItem}>
            <Mail size={18} color="#6c757d" />
            <span>{currentUser.email}</span>
          </div>
          <div style={styles.infoItem}>
            <Phone size={18} color="#6c757d" />
            <span>{currentUser.telephone || t('userProfile.notProvided')}</span>
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={onEditProfile}>
            <Settings size={18} /> {t('userProfile.editProfile')}
          </button>
          <button style={styles.actionBtn} onClick={onChangePassword}>
            <Lock size={18} /> {t('userProfile.changePassword')}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    backgroundColor: '#f0f7f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
    border: '1px solid #e9ecef',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  backBtnSmall: {
    alignSelf: 'flex-start',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#6c757d',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  photoContainer: {
    marginBottom: '20px',
  },
  photo: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #e9ecef',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  },
  photoPlaceholder: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '4px solid #e9ecef',
  },
  name: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#212529',
    margin: '0 0 16px 0',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  infoList: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '32px',
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '15px',
    color: '#495057',
    padding: '10px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
  },
  actions: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '14px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#212529',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
};