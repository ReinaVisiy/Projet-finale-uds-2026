// PasswordRecovery.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Key, Send, Lock } from 'lucide-react';

export default function PasswordRecovery({ onBack, onSuccess, registeredUsers, updateUserPassword }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError(t('passwordRecovery.errEmailRequired'));
      return;
    }
    // Vérifier si l'email existe dans les utilisateurs enregistrés
    const userExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (!userExists) {
      setError(t('passwordRecovery.errNoAccount'));
      return;
    }
    // Générer un code aléatoire à 5 chiffres
    const newCode = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedCode(newCode);
    // Simuler l'envoi du code par email
    alert(t('passwordRecovery.codeSentAlert', { email, code: newCode }));
    setStep(2);
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim() || code.length < 5) {
      setError(t('passwordRecovery.errCodeInvalid'));
      return;
    }
    if (code !== generatedCode) {
      setError(t('passwordRecovery.errCodeWrong'));
      return;
    }
    setStep(3);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError(t('passwordRecovery.errPasswordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordRecovery.errPasswordMismatch'));
      return;
    }
    setLoading(true);
    // Mettre à jour le mot de passe
    const success = updateUserPassword(email, newPassword);
    if (success) {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } else {
      setError(t('passwordRecovery.errUpdateFailed'));
      setLoading(false);
    }
  };

  const goBackStep = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  // Étape 1 : Email
  if (step === 1) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={20} /> {t('passwordRecovery.back')}
          </button>
          <h1 style={styles.title}>{t('passwordRecovery.step1Title')}</h1>
          <p style={styles.subtitle}>{t('passwordRecovery.step1Subtitle')}</p>
          
          {error && <div style={styles.errorBox}><AlertCircle size={18} color="#e07a5f" /><span>{error}</span></div>}
          
          <form style={styles.form} onSubmit={handleEmailSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>{t('passwordRecovery.emailLabel')}</label>
              <div style={styles.inputWrap}>
                <Mail size={18} color="#6c757d" />
                <input
                  type="email"
                  placeholder={t('passwordRecovery.emailPlaceholder')}
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>
              <Send size={18} /> {t('passwordRecovery.validate')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Étape 2 : Code de vérification
  if (step === 2) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <button style={styles.backBtn} onClick={goBackStep}>
            <ArrowLeft size={20} /> {t('passwordRecovery.back')}
          </button>
          <h1 style={styles.title}>{t('passwordRecovery.step2Title')}</h1>
          <p style={styles.subtitle}>{t('passwordRecovery.step2Subtitle')}</p>
          
          {error && <div style={styles.errorBox}><AlertCircle size={18} color="#e07a5f" /><span>{error}</span></div>}
          
          <form style={styles.form} onSubmit={handleCodeSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>{t('passwordRecovery.codeLabel')}</label>
              <div style={styles.inputWrap}>
                <Key size={18} color="#6c757d" />
                <input
                  type="text"
                  placeholder={t('passwordRecovery.codePlaceholder')}
                  style={styles.input}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  required
                  maxLength={5}
                />
              </div>
            </div>
            <button type="submit" style={styles.submitBtn}>
              <CheckCircle size={18} /> {t('passwordRecovery.validate')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Étape 3 : Nouveau mot de passe
  if (step === 3) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <button style={styles.backBtn} onClick={goBackStep}>
            <ArrowLeft size={20} /> {t('passwordRecovery.back')}
          </button>
          <h1 style={styles.title}>{t('passwordRecovery.step3Title')}</h1>
          <p style={styles.subtitle}>{t('passwordRecovery.step3Subtitle')}</p>
          
          {error && <div style={styles.errorBox}><AlertCircle size={18} color="#e07a5f" /><span>{error}</span></div>}
          {success && (
            <div style={styles.successBox}>
              <CheckCircle size={18} color="#2d6a4f" />
              <span>{t('passwordRecovery.successMsg')}</span>
            </div>
          )}
          
          <form style={styles.form} onSubmit={handlePasswordSubmit}>
            <div style={styles.field}>
              <label style={styles.label}>{t('passwordRecovery.newPasswordLabel')}</label>
              <div style={styles.inputWrap}>
                <Lock size={18} color="#6c757d" />
                <input
                  type="password"
                  placeholder={t('passwordRecovery.newPasswordPlaceholder')}
                  style={styles.input}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t('passwordRecovery.confirmPasswordLabel')}</label>
              <div style={styles.inputWrap}>
                <Lock size={18} color="#6c757d" />
                <input
                  type="password"
                  placeholder={t('passwordRecovery.confirmPasswordPlaceholder')}
                  style={styles.input}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? t('passwordRecovery.inProgress') : t('passwordRecovery.resetPassword')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
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
};
