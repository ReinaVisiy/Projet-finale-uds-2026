
// src/components/AddProduct.jsx
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, X, MapPin } from 'lucide-react';
import { produitApi } from '../services/api';
import { mapCategorie, mapProduitPourVendeur, construireProduitRequest, traduireNomCategorie } from '../services/productMapping';
import { useTranslation } from 'react-i18next';
import useIsMobile from '../hooks/useIsMobile';


export default function AddProduct({ onProductAdded, onCancel }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile(768);
  const [name, setName] = useState('');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erreur, setErreur] = useState('');
  const fileInputRef = useRef(null);

  // Charger les catégories réelles depuis produit-service au montage.
  useEffect(() => {
    produitApi.getCategories()
      .then((data) => {
        const cats = (data || []).map(mapCategorie);
        setCategories(cats);
        if (cats.length > 0) setCategory(String(cats[0].id));
      })
      .catch(() => setErreur(t('addProduct.loadCategoriesFailed')));
  }, [t]);

  const handleImageChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('addProduct.selectImage'));
      return;
    }
        const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e) => handleImageChange(e.target.files[0]);

  const removeImage = () => {
        setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErreur('');
    if (!name.trim() || !price || !quantity || !imagePreview) {
      alert(t('addProduct.fillRequired'));
      return;
    }
    setIsSubmitting(true);
    try {
      const request = construireProduitRequest({
        nom: name.trim(),
        description: description.trim(),
        prix: price,
        stock: quantity,
        imageUrl: imagePreview,
        categorieId: category,
        localisation: localisation.trim(),
      });
      const produitCree = await produitApi.publierProduit(request);
      if (onProductAdded) onProductAdded(mapProduitPourVendeur(produitCree));
    } catch (err) {
      const message = err?.message || t('addProduct.publishFailed');
      setErreur(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onCancel} style={styles.backBtn}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>{t('addProduct.title')}</h2>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        {erreur && <div style={styles.errorBanner}>{erreur}</div>}
        <div style={{ ...styles.grid, ...(isMobile && { gridTemplateColumns: '1fr', gap: '20px' }) }}>
          {/* Colonne gauche : formulaire */}
          <div style={styles.formCard}>
            <div style={styles.field}>
              <label style={styles.label}>{t('addProduct.productName')}</label>
              <input
                type="text"
                placeholder={t('addProduct.productNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={{ ...styles.row2, ...(isMobile && { gridTemplateColumns: '1fr' }) }}>
              <div style={styles.field}>
                <label style={styles.label}>{t('addProduct.category')}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                  {categories.length === 0 && <option value="">{t('addProduct.loading')}</option>}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{traduireNomCategorie(cat.name, t)}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{t('addProduct.availableQty')}</label>
                <input
                  type="number"
                  placeholder={t('addProduct.qtyPlaceholder')}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={styles.input}
                  min="0"
                  required
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>{t('addProduct.priceLabel')}</label>
              <input
                type="number"
                placeholder={t('addProduct.pricePlaceholder')}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={styles.input}
                min="0"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>{t('addProduct.description')}</label>
              <textarea
                placeholder={t('addProduct.descPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
                rows="4"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                <MapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {t('addProduct.location')}
              </label>
              <input
                type="text"
                placeholder={t('addProduct.locationPlaceholder')}
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              style={{ ...styles.publishBtn, opacity: (isSubmitting || !category) ? 0.7 : 1 }}
              disabled={isSubmitting || !category}
            >
              {isSubmitting ? t('addProduct.publishing') : t('addProduct.publish')}
            </button>
          </div>

          {/* Colonne droite : photo */}
          <div style={styles.imageCard}>
            <h3 style={styles.imageTitle}>{t('addProduct.productPhoto')}</h3>

            {!imagePreview ? (
              <div style={styles.dropZone} onClick={() => fileInputRef.current.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileInput}
                />
                <Upload size={48} color="#2d6a4f" />
                <h4 style={styles.dropTitle}>{t('addProduct.clickToAdd')}</h4>
                <p style={styles.dropSubtitle}>{t('addProduct.fileHint')}</p>
              </div>
            ) : (
              <div style={styles.previewWrap}>
                <img src={imagePreview} alt={t('addProduct.preview')} style={styles.previewImage} />
                <div style={styles.previewActions}>
                  <button type="button" style={styles.changeBtn} onClick={() => fileInputRef.current.click()}>
                    <Upload size={16} /> {t('addProduct.change')}
                  </button>
                  <button type="button" style={styles.removeBtn} onClick={removeImage}>
                    <X size={16} /> {t('addProduct.remove')}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

const styles = {
  errorBanner: {
    background: '#fdecea',
    color: '#b91c1c',
    border: '1px solid #f5b5b0',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '40px 24px 80px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  backBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #dee2e6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  title: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#212529',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '32px',
    alignItems: 'start',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    padding: '32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  imageCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    padding: '32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  imageTitle: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#212529',
    margin: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#343a40',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #dee2e6',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #dee2e6',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #dee2e6',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  publishBtn: {
    padding: '14px',
    backgroundColor: '#e07a5f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    marginTop: '4px',
  },
  dropZone: {
    border: '2px dashed #dee2e6',
    borderRadius: '16px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8f9fa',
  },
  dropTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#212529',
    margin: 0,
  },
  dropSubtitle: {
    fontSize: '13px',
    color: '#6c757d',
    margin: 0,
  },
  previewWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  previewImage: {
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '1px solid #e9ecef',
  },
  previewActions: {
    display: 'flex',
    gap: '10px',
  },
  changeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#e9f5ee',
    color: '#2d6a4f',
    border: '1px solid #b7e4c7',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  removeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    backgroundColor: '#fff5f5',
    color: '#e07a5f',
    border: '1px solid #f5d4c8',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};