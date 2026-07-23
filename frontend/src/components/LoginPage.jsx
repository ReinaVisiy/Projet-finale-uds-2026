// src/components/LoginPage.jsx
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function LoginPage({
  onLoginSuccess,
  onValidateLogin,
  infoMessage,
  onNavigateToRecovery,
  onNavigateToRegister,
  onUnconfirmedEmail,
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('client'); // 'client' ou 'vendeur'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('');
  const [unconfirmedPassword, setUnconfirmedPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnconfirmedEmail('');
    setUnconfirmedPassword('');
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError(t('login.fillFields'));
      setLoading(false);
      return;
    }

    try {
      const user = await onValidateLogin(email, password, role);
      onLoginSuccess(user);
    } catch (err) {
      if (err.body?.code === 'EMAIL_NON_CONFIRME') {
        setError(t('login.emailNotVerified'));
        setUnconfirmedEmail(email.trim().toLowerCase());
        setUnconfirmedPassword(password);
        return;
      }
      setError(err.message || t('login.wrongCreds'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🌿</div>
          <h1 style={styles.title}>{t('login.login')}</h1>
          <p style={styles.subtitle}>{t('login.accessSpace')}</p>
        </div>

        {infoMessage && (
          <div style={styles.infoBox}>
            <AlertCircle size={18} color="#2d6a4f" />
            <span style={styles.infoText}>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={18} color="#e07a5f" />
            <span style={styles.errorText}>{error}</span>
          </div>
        )}
        {unconfirmedEmail && onUnconfirmedEmail && (
          <button
            type="button"
            style={styles.verifyEmailLink}
            onClick={() => onUnconfirmedEmail(unconfirmedEmail, unconfirmedPassword, role)}
          >
            {t('login.verifyMyEmail')}
          </button>
        )}

        {/* Choix du rôle */}
        <div style={styles.roleRow}>
          <button type="button" style={{ ...styles.roleBtn, ...(role === 'client' ? styles.roleBtnActive : {}) }} onClick={() => setRole('client')}>
            {t('login.client')}
          </button>
          <button type="button" style={{ ...styles.roleBtn, ...(role === 'vendeur' ? styles.roleBtnActiveGreen : {}) }} onClick={() => setRole('vendeur')}>
            {t('login.vendeur')}
          </button>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>{t('login.email')}</label>
            <div style={styles.inputWrap}>
              <Mail size={18} color="#6c757d" />
              <input type="email" placeholder={t('login.emailPlaceholder')} style={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{t('login.password')}</label>
            <div style={styles.inputWrap}>
              <Lock size={18} color="#6c757d" />
              <input type={showPassword ? 'text' : 'password'} placeholder={t('login.passwordPlaceholder')} style={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} color="#6c757d" /> : <Eye size={18} color="#6c757d" />}
              </button>
            </div>
          </div>

          <div style={styles.optionsRow}>
            <label style={styles.rememberLabel}>
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={styles.checkbox} />
              {t('login.rememberMe')}
            </label>
            <button type="button" style={styles.forgotLink} onClick={onNavigateToRecovery}>{t('login.forgotPassword')}</button>
          </div>

          <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? t('login.loggingIn') : t('login.logIn')} {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div style={styles.registerRow}>
          <p style={styles.registerText}>
            {t('login.notRegistered')}{' '}
            <button style={styles.registerLink} onClick={onNavigateToRegister}>
              {t('login.createAccount')}
            </button>
          </p>
        </div>

        <div style={styles.footer}>
          <span style={styles.footerBadge}>{t('login.secure')}</span>
          <span style={styles.footerBadge}>{t('login.gdpr')}</span>
          <span style={styles.footerBadge}>{t('login.certified')}</span>
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
    padding: '48px 40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
    border: '1px solid #e9ecef',
  },
  header: { textAlign: 'center', marginBottom: '32px' },
  logo: { fontSize: '48px', marginBottom: '16px', display: 'flex', justifyContent: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1b4d3e', margin: '0 0 8px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '15px', color: '#6c757d', margin: '0 auto', fontWeight: '500' },
  infoBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: '#e9f5ee', borderRadius: '12px', marginBottom: '20px', border: '1px solid #b7e4c7' },
  infoText: { fontSize: '13px', color: '#1b4d3e', fontWeight: '600' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', backgroundColor: '#fdf1ed', borderRadius: '12px', marginBottom: '20px', border: '1px solid #f5d4c8' },
  errorText: { fontSize: '13px', color: '#e07a5f', fontWeight: '600' },
  verifyEmailLink: { background: 'none', border: 'none', color: '#2d6a4f', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', marginTop: '-10px', marginBottom: '20px', display: 'block' },
  roleRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  roleBtn: { flex: 1, padding: '12px', border: '2px solid #dee2e6', borderRadius: '14px', backgroundColor: '#f8f9fa', color: '#495057', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  roleBtnActive: { border: '2px solid #2d6a4f', backgroundColor: '#e9f5ee', color: '#1b4d3e' },
  roleBtnActiveGreen: { border: '2px solid #2d6a4f', backgroundColor: '#e9f5ee', color: '#1b4d3e' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#212529' },
  inputWrap: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', border: '1.5px solid #dee2e6', borderRadius: '14px', backgroundColor: '#f8f9fa' },
  input: { flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#212529', outline: 'none', fontWeight: '500', padding: 0 },
  eyeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  optionsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' },
  rememberLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#495057', fontWeight: '600', cursor: 'pointer' },
  checkbox: { width: '16px', height: '16px', accentColor: '#2d6a4f', cursor: 'pointer' },
  forgotLink: { background: 'none', border: 'none', color: '#2d6a4f', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' },
  submitBtn: { padding: '16px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '8px', boxShadow: '0 8px 24px rgba(45,106,79,0.3)', transition: 'opacity 0.2s' },
  registerRow: { textAlign: 'center', marginTop: '16px' },
  registerText: { fontSize: '14px', color: '#6c757d', margin: 0 },
  registerLink: { background: 'none', border: 'none', color: '#2d6a4f', fontWeight: '800', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' },
  footer: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e9ecef', flexWrap: 'wrap' },
  footerBadge: { fontSize: '12px', fontWeight: '700', color: '#6c757d', display: 'flex', alignItems: 'center', gap: '4px' },
};