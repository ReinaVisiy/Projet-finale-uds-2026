// src/components/ChangePassword.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ChangePassword({ onBack, onSave, currentUser }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = t('changePassword.errCurrentRequired');
    }
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = t('changePassword.errNewRequired');
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = t('changePassword.errMinLength');
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('changePassword.errMismatch');
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // La vérification de l'ancien mot de passe se fait désormais côté
    // serveur (utilisateur-service ne stocke pas de mot de passe en clair,
    // donc on ne peut pas le comparer ici).
    setLoading(true);
    try {
      if (onSave) {
        await onSave(formData.currentPassword, formData.newPassword);
      }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (err) {
      setLoading(false);
      setErrors({ currentPassword: err?.message || t('changePassword.errWrongCurrent') });
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* En-tête */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={styles.title}>{t('changePassword.title')}</h1>
          <p style={styles.subtitle}>{t('changePassword.subtitle')}</p>
        </div>

        {success && (
          <div style={styles.successBox}>
            <CheckCircle size={18} color="#2d6a4f" />
            <span style={styles.successText}>{t('changePassword.successMsg')}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          {/* Mot de passe actuel */}
          <div style={styles.field}>
            <label style={styles.label}>{t('changePassword.currentPassword')}</label>
            <div style={{ ...styles.inputWrap, borderColor: errors.currentPassword ? '#e07a5f' : '#dee2e6' }}>
              <Lock size={18} color="#6c757d" />
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                placeholder={t('changePassword.currentPasswordPlaceholder')}
                style={styles.input}
                value={formData.currentPassword}
                onChange={handleChange}
              />
              <button style={styles.eyeBtn} onClick={() => setShowCurrent(!showCurrent)}>
                {showCurrent ? <EyeOff size={18} color="#6c757d" /> : <Eye size={18} color="#6c757d" />}
              </button>
            </div>
            {errors.currentPassword && <span style={styles.error}>{errors.currentPassword}</span>}
          </div>

          {/* Nouveau mot de passe */}
          <div style={styles.field}>
            <label style={styles.label}>{t('changePassword.newPassword')}</label>
            <div style={{ ...styles.inputWrap, borderColor: errors.newPassword ? '#e07a5f' : '#dee2e6' }}>
              <Lock size={18} color="#6c757d" />
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                placeholder={t('changePassword.newPasswordPlaceholder')}
                style={styles.input}
                value={formData.newPassword}
                onChange={handleChange}
              />
              <button style={styles.eyeBtn} onClick={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff size={18} color="#6c757d" /> : <Eye size={18} color="#6c757d" />}
              </button>
            </div>
            {errors.newPassword && <span style={styles.error}>{errors.newPassword}</span>}
            {formData.newPassword.length > 0 && formData.newPassword.length < 6 && (
              <div style={styles.hint}>{t('changePassword.minLengthHint')}</div>
            )}
          </div>

          {/* Confirmer le nouveau mot de passe */}
          <div style={styles.field}>
            <label style={styles.label}>{t('changePassword.confirmPassword')}</label>
            <div style={{ ...styles.inputWrap, borderColor: errors.confirmPassword ? '#e07a5f' : '#dee2e6' }}>
              <Lock size={18} color="#6c757d" />
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder={t('changePassword.confirmPasswordPlaceholder')}
                style={styles.input}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={18} color="#6c757d" /> : <Eye size={18} color="#6c757d" />}
              </button>
            </div>
            {errors.confirmPassword && <span style={styles.error}>{errors.confirmPassword}</span>}
          </div>

          {/* Message de sécurité */}
          <div style={styles.securityBox}>
            <AlertCircle size={16} color="#f5b041" />
            <span style={styles.securityText}>
              {t('changePassword.securityMsg')}
            </span>
          </div>

          {/* Boutons */}
          <div style={styles.actionRow}>
            <button type="button" style={styles.cancelBtn} onClick={onBack}>
              {t('changePassword.cancel')}
            </button>
            <button type="submit" style={{ ...styles.saveBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? t('changePassword.saving') : t('changePassword.save')}
            </button>
          </div>
        </form>
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
    padding: '48px 40px',
    width: '100%',
    maxWidth: '520px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
    border: '1px solid #e9ecef',
  },
  header: {
    marginBottom: '28px',
  },
  backBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#f1f3f5',
    color: '#212529',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginBottom: '16px',
    transition: 'background 0.2s ease',
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#212529',
    margin: '0 0 4px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d',
    margin: 0,
  },

  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    backgroundColor: '#e9f5ee',
    borderRadius: '12px',
    border: '1px solid #b7e4c7',
    marginBottom: '20px',
  },
  successText: {
    fontSize: '13px',
    color: '#1b4d3e',
    fontWeight: '600',
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#212529',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 16px',
    border: '1.5px solid #dee2e6',
    borderRadius: '14px',
    backgroundColor: '#f8f9fa',
  },
  input: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    color: '#212529',
    outline: 'none',
    fontWeight: '500',
    padding: 0,
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  error: {
    fontSize: '12px',
    color: '#e07a5f',
    fontWeight: '600',
    marginTop: '4px',
  },
  hint: {
    fontSize: '12px',
    color: '#f5b041',
    fontWeight: '600',
    marginTop: '4px',
  },

  securityBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fffbea',
    borderRadius: '12px',
    border: '1px solid #f5e4a0',
  },
  securityText: {
    fontSize: '12px',
    color: '#856404',
    lineHeight: '1.5',
  },

  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '8px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#ffffff',
    color: '#495057',
    border: '1px solid #dee2e6',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  saveBtn: {
    flex: 2,
    padding: '14px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'opacity 0.2s ease',
    boxShadow: '0 8px 24px rgba(45,106,79,0.25)',
  },
};