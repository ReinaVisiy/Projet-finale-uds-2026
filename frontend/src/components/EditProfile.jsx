// src/components/EditProfile.jsx
import React, { useState, useRef } from 'react';
import { Camera, Save, X, User, Mail, Phone, ArrowLeft } from 'lucide-react';
import { useDict } from '../context/LanguageContext';

const translations = {
  fr: {
    back: 'Retour', addPhoto: 'Ajouter une photo', editMyProfile: 'Modifier mon profil',
    lastName: 'Nom', lastNamePlaceholder: 'Votre nom', firstName: 'Prénom', firstNamePlaceholder: 'Votre prénom',
    email: 'Email', emailPlaceholder: 'Votre email', phone: 'Téléphone', phonePlaceholder: 'Votre téléphone',
    cancel: 'Annuler', save: 'Enregistrer',
  },
  en: {
    back: 'Back', addPhoto: 'Add a photo', editMyProfile: 'Edit my profile',
    lastName: 'Last name', lastNamePlaceholder: 'Your last name', firstName: 'First name', firstNamePlaceholder: 'Your first name',
    email: 'Email', emailPlaceholder: 'Your email', phone: 'Phone', phonePlaceholder: 'Your phone number',
    cancel: 'Cancel', save: 'Save',
  },
};

export default function EditProfile({ onBack, onSave, currentUser }) {
  const t = useDict(translations);
  const [formData, setFormData] = useState({
    nom: currentUser?.nom || '',
    prenom: currentUser?.prenom || '',
    email: currentUser?.email || '',
    telephone: currentUser?.telephone || '',
    photo: currentUser?.photo || null,
  });

  const [photoPreview, setPhotoPreview] = useState(currentUser?.photo || null);
  const [isHoveringPhoto, setIsHoveringPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        setPhotoPreview(base64);
        setFormData(prev => ({ ...prev, photo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) onSave(formData);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Bouton Retour */}
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} /> {t.back}
        </button>

        {/* Photo de profil centrée */}
        <div style={styles.photoContainer}>
          <div
            style={{
              ...styles.photoWrapper,
              borderColor: isHoveringPhoto ? '#2d6a4f' : '#e9ecef',
            }}
            onMouseEnter={() => setIsHoveringPhoto(true)}
            onMouseLeave={() => setIsHoveringPhoto(false)}
            onClick={handlePhotoClick}
          >
            {photoPreview ? (
              <img src={photoPreview} alt="Photo de profil" style={styles.photo} />
            ) : (
              <div style={styles.photoPlaceholder}>
                <Camera size={32} color={isHoveringPhoto ? '#2d6a4f' : '#adb5bd'} />
                <span style={styles.photoPlaceholderText}>{t.addPhoto}</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <h1 style={styles.title}>{t.editMyProfile}</h1>

        <form style={styles.form} onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>{t.lastName}</label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              style={styles.input}
              placeholder={t.lastNamePlaceholder}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{t.firstName}</label>
            <input
              type="text"
              name="prenom"
              value={formData.prenom}
              onChange={handleChange}
              style={styles.input}
              placeholder={t.firstNamePlaceholder}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              <Mail size={14} /> {t.email}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              placeholder={t.emailPlaceholder}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              <Phone size={14} /> {t.phone}
            </label>
            <input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              style={styles.input}
              placeholder={t.phonePlaceholder}
            />
          </div>

          <div style={styles.actionRow}>
            <button type="button" style={styles.cancelBtn} onClick={onBack}>
              <X size={18} /> {t.cancel}
            </button>
            <button type="submit" style={styles.saveBtn}>
              <Save size={18} /> {t.save}
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
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.08)',
    border: '1px solid #e9ecef',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  backBtn: {
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
    marginBottom: '16px',
  },
  photoContainer: {
    marginBottom: '20px',
  },
  photoWrapper: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: 'pointer',
    border: '3px solid #e9ecef',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.2s ease',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#adb5bd',
    width: '100%',
    height: '100%',
  },
  photoPlaceholderText: {
    fontSize: '11px',
    fontWeight: '600',
  },
  title: {
    fontSize: '22px',
    fontWeight: '900',
    color: '#212529',
    margin: '0 0 24px 0',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
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
  input: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1.5px solid #dee2e6',
    backgroundColor: '#f8f9fa',
    fontSize: '15px',
    color: '#212529',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
    ':focus': {
      borderColor: '#2d6a4f',
      boxShadow: '0 0 0 3px rgba(45,106,79,0.08)',
    },
  },
  actionRow: {
    display: 'flex',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  saveBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    boxShadow: '0 8px 24px rgba(45,106,79,0.25)',
  },
};