// ConfirmEmailPage.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react';
import { utilisateurApi } from '../services/api';

export default function ConfirmEmailPage({ email, onConfirmed, onBack }) {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!code.trim() || code.length < 6) {
      setError(t('confirmEmail.errCodeInvalid'));
      return;
    }
    setLoading(true);
    try {
      await utilisateurApi.confirmerEmail(email, code);
      if (onConfirmed) onConfirmed();
    } catch (err) {
      setError(err.message || t('confirmEmail.errCodeWrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    try {
      await utilisateurApi.renvoyerCodeConfirmation(email);
      setInfo(t('confirmEmail.resendSuccess'));
    } catch (err) {
      setError(err.message || t('confirmEmail.resendError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} /> {t('confirmEmail.back')}
        </button>
        <h1 style={styles.title}>{t('confirmEmail.title')}</h1>
        <p style={styles.subtitle}>{t('confirmEmail.subtitle', { email })}</p>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="#e07a5f" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div style={styles.successBox}>
            <CheckCircle size={18} color="#2d6a4f" />
            <span>{info}</span>
          </div>
        )}

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>{t('confirmEmail.codeLabel')}</label>
            <div style={styles.inputWrap}>
              <KeyRound size={18} color="#6c757d" />
              <input
                type="text"
                placeholder={t('confirmEmail.codePlaceholder')}
                style={styles.input}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
              />
            </div>
          </div>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? t('confirmEmail.inProgress') : t('confirmEmail.validate')}
          </button>
        </form>

        <button style={styles.resendBtn} onClick={handleResend} disabled={resending}>
          <Mail size={16} />
          {resending ? t('confirmEmail.inProgress') : t('confirmEmail.resendCode')}
        </button>
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
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#6c757d',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#212529',
    margin: '0 0 8px 0',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d',
    margin: '0 0 24px 0',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#fdf1ed',
    borderRadius: '12px',
    border: '1px solid #f5d4c8',
    marginBottom: '16px',
    color: '#e07a5f',
    fontSize: '13px',
    fontWeight: '600',
  },
  successBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 16px',
    backgroundColor: '#e9f5ee',
    borderRadius: '12px',
    border: '1px solid #b7e4c7',
    marginBottom: '16px',
    color: '#2d6a4f',
    fontSize: '13px',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
    letterSpacing: '2px',
  },
  submitBtn: {
    padding: '14px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(45,106,79,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'opacity 0.2s',
  },
  resendBtn: {
    marginTop: '16px',
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    color: '#2d6a4f',
    border: 'none',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },
};
