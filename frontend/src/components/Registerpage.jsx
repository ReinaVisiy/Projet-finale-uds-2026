// src/components/Registerpage.jsx
import React, { useState, useRef } from 'react';
import { User, Mail, Lock, Phone, Eye, EyeOff, CheckCircle, ArrowRight, Camera } from 'lucide-react';

export default function RegisterPage({ onRegisterSuccess, onNavigateToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState('client');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    confirm: '',
    photo: null,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handlePhotoClick = () => fileInputRef.current.click();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target.result);
        setForm({ ...form, photo: ev.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.prenom.trim()) newErrors.prenom = 'Le prénom est requis';
    if (!form.nom.trim()) newErrors.nom = 'Le nom est requis';
    if (!form.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email invalide';
    if (!form.telephone.trim()) newErrors.telephone = 'Le téléphone est requis';
    if (!form.password) newErrors.password = 'Le mot de passe est requis';
    else if (form.password.length < 6) newErrors.password = 'Minimum 6 caractères';
    if (form.confirm !== form.password) newErrors.confirm = 'Les mots de passe ne correspondent pas';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await onRegisterSuccess({
        role: role,
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        password: form.password,
        photo: form.photo || null,
      });
    } catch (err) {
      const message = err.message && err.message.length < 200
        ? err.message
        : 'Une erreur est survenue lors de la création du compte. Cet email est peut-être déjà utilisé.';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = form.password;
    if (!p) return { label: '', color: '#dee2e6', width: '0%' };
    if (p.length < 4) return { label: 'Faible', color: '#e07a5f', width: '25%' };
    if (p.length < 6) return { label: 'Moyen', color: '#f5b041', width: '50%' };
    if (p.length < 10) return { label: 'Bon', color: '#2d6a4f', width: '75%' };
    return { label: 'Excellent', color: '#1b4d3e', width: '100%' };
  };
  const strength = getPasswordStrength();

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🌿</div>
          <h1 style={styles.title}>Créer un compte</h1>
          <p style={styles.subtitle}>Rejoignez des milliers d'agriculteurs et clients</p>
        </div>

        {/* Photo de profil */}
        <div style={styles.photoContainer}>
          <div style={styles.photoWrapper} onClick={handlePhotoClick}>
            {photoPreview ? (
              <img src={photoPreview} alt="Photo de profil" style={styles.photo} />
            ) : (
              <div style={styles.photoPlaceholder}>
                <Camera size={32} color="#adb5bd" />
                <span style={styles.photoPlaceholderText}>Ajouter une photo</span>
              </div>
            )}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handlePhotoChange} />
          </div>
        </div>

        {errors.general && <div style={{ color: '#e07a5f', marginBottom: '16px', textAlign: 'center' }}>{errors.general}</div>}

        {/* Choix du rôle */}
        <div style={styles.roleRow}>
          <button type="button" style={{ ...styles.roleBtn, ...(role === 'client' ? styles.roleBtnActive : {}) }} onClick={() => setRole('client')}>
            🛒 Je suis Client
          </button>
          <button type="button" style={{ ...styles.roleBtn, ...(role === 'vendeur' ? styles.roleBtnActiveGreen : {}) }} onClick={() => setRole('vendeur')}>
            🌾 Je suis Vendeur
          </button>
        </div>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.row2}>
            <div style={styles.field}>
              <label style={styles.label}>Prénom *</label>
              <div style={{ ...styles.inputWrap, borderColor: errors.prenom ? '#e07a5f' : '#dee2e6' }}>
                <User size={16} color="#6c757d" />
                <input name="prenom" type="text" placeholder="ex: Ravie" style={styles.input} value={form.prenom} onChange={handleChange} />
              </div>
              {errors.prenom && <span style={styles.error}>{errors.prenom}</span>}
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Nom *</label>
              <div style={{ ...styles.inputWrap, borderColor: errors.nom ? '#e07a5f' : '#dee2e6' }}>
                <User size={16} color="#6c757d" />
                <input name="nom" type="text" placeholder="ex: Dupont" style={styles.input} value={form.nom} onChange={handleChange} />
              </div>
              {errors.nom && <span style={styles.error}>{errors.nom}</span>}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Adresse email *</label>
            <div style={{ ...styles.inputWrap, borderColor: errors.email ? '#e07a5f' : '#dee2e6' }}>
              <Mail size={16} color="#6c757d" />
              <input name="email" type="email" placeholder="ex: ravie@email.com" style={styles.input} value={form.email} onChange={handleChange} />
            </div>
            {errors.email && <span style={styles.error}>{errors.email}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Téléphone *</label>
            <div style={{ ...styles.inputWrap, borderColor: errors.telephone ? '#e07a5f' : '#dee2e6' }}>
              <Phone size={16} color="#6c757d" />
              <input name="telephone" type="tel" placeholder="ex: 6XX XXX XXX" style={styles.input} value={form.telephone} onChange={handleChange} />
            </div>
            {errors.telephone && <span style={styles.error}>{errors.telephone}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe *</label>
            <div style={{ ...styles.inputWrap, borderColor: errors.password ? '#e07a5f' : '#dee2e6' }}>
              <Lock size={16} color="#6c757d" />
              <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Minimum 6 caractères" style={styles.input} value={form.password} onChange={handleChange} />
              <button style={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={16} color="#6c757d" /> : <Eye size={16} color="#6c757d" />}
              </button>
            </div>
            {errors.password && <span style={styles.error}>{errors.password}</span>}
            {form.password.length > 0 && (
              <div style={styles.strengthWrap}>
                <div style={styles.strengthBar}><div style={{ ...styles.strengthFill, width: strength.width, backgroundColor: strength.color }} /></div>
                <span style={{ ...styles.strengthLabel, color: strength.color }}>{strength.label}</span>
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirmer le mot de passe *</label>
            <div style={{ ...styles.inputWrap, borderColor: errors.confirm ? '#e07a5f' : '#dee2e6' }}>
              <Lock size={16} color="#6c757d" />
              <input name="confirm" type={showConfirm ? 'text' : 'password'} placeholder="Répétez le mot de passe" style={styles.input} value={form.confirm} onChange={handleChange} />
              <button style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={16} color="#6c757d" /> : <Eye size={16} color="#6c757d" />}
              </button>
            </div>
            {errors.confirm && <span style={styles.error}>{errors.confirm}</span>}
          </div>

          <button type="submit" style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Création en cours...' : 'Créer mon compte'} {!loading && <ArrowRight size={18} />}
          </button>

          <p style={styles.loginText}>
            Déjà un compte ?{' '}
            <button type="button" style={styles.loginLink} onClick={onNavigateToLogin}>
              Se connecter
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

// Styles (inchangés)
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
    maxWidth: '560px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
    border: '1px solid #e9ecef',
  },
  header: { textAlign: 'center', marginBottom: '24px' },
  logo: { fontSize: '48px', marginBottom: '16px', display: 'flex', justifyContent: 'center' },
  title: { fontSize: '28px', fontWeight: '900', color: '#1b4d3e', margin: '0 0 8px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '15px', color: '#6c757d', margin: '0 auto', fontWeight: '500', maxWidth: '520px' },
  photoContainer: { display: 'flex', justifyContent: 'center', marginBottom: '24px' },
  photoWrapper: {
    width: '120px', height: '120px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer',
    border: '3px solid #e9ecef', boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#adb5bd' },
  photoPlaceholderText: { fontSize: '12px', fontWeight: '600' },
  roleRow: { display: 'flex', gap: '12px', marginBottom: '16px' },
  roleBtn: { flex: 1, padding: '14px', border: '2px solid #dee2e6', borderRadius: '16px', backgroundColor: '#f8f9fa', color: '#495057', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  roleBtnActive: { border: '2px solid #2d6a4f', backgroundColor: '#e9f5ee', color: '#1b4d3e' },
  roleBtnActiveGreen: { border: '2px solid #2d6a4f', backgroundColor: '#e9f5ee', color: '#1b4d3e' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '14px', fontWeight: '700', color: '#212529' },
  inputWrap: { display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', border: '1.5px solid #dee2e6', borderRadius: '14px', backgroundColor: '#f8f9fa' },
  input: { flex: 1, border: 'none', backgroundColor: 'transparent', fontSize: '14px', color: '#212529', outline: 'none', fontWeight: '500', padding: 0 },
  eyeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  error: { fontSize: '12px', color: '#e07a5f', fontWeight: '600', marginTop: '4px' },
  strengthWrap: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' },
  strengthBar: { flex: 1, height: '4px', backgroundColor: '#dee2e6', borderRadius: '4px', overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' },
  strengthLabel: { fontSize: '12px', fontWeight: '700', minWidth: '60px' },
  submitBtn: { padding: '16px', backgroundColor: '#2d6a4f', color: '#ffffff', border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '8px', boxShadow: '0 8px 24px rgba(45,106,79,0.3)', transition: 'opacity 0.2s' },
  loginText: { textAlign: 'center', fontSize: '14px', color: '#6c757d', margin: 0 },
  loginLink: { background: 'none', border: 'none', color: '#2d6a4f', fontWeight: '800', fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' },
};