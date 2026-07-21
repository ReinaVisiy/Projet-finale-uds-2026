// src/components/EditProduct.jsx
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { produitApi } from '../services/api';
import { mapCategorie, mapProduitPourVendeur, construireProduitRequest } from '../services/productMapping';
import { useTranslation } from 'react-i18next';


export default function EditProduct({ 
  product, 
  onSave, 
  onCancel 
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(product?.name || '');
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(product?.categoryId != null ? String(product.categoryId) : '');
  const [quantity, setQuantity] = useState(product?.stock || '');
  const [price, setPrice] = useState(product?.price || '');
  const [description, setDescription] = useState(product?.description || '');
  const [imagePreview, setImagePreview] = useState(product?.imageUrl || product?.image || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Charger les vraies catégories depuis produit-service au montage.
  useEffect(() => {
    produitApi.getCategories()
      .then((data) => {
        const cats = (data || []).map(mapCategorie);
        setCategories(cats);
        if (!category && cats.length > 0) setCategory(String(cats[0].id));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert(t('editProduct.selectImage'));
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
    if (!name.trim() || !price || !quantity || !imagePreview) {
      alert(t('editProduct.fillRequired'));
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
      });
      const produitModifie = await produitApi.modifierProduit(product.id, request);
      if (onSave) onSave(mapProduitPourVendeur(produitModifie));
    } catch (err) {
      alert(err?.message || t('editProduct.updateFailed'));
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
        <h2 style={styles.title}>{t('editProduct.title')}</h2>
      </div>

      <form style={styles.form} onSubmit={handleSubmit}>
        <div style={styles.grid}>
          {/* Colonne gauche : formulaire */}
          <div style={styles.formCard}>
            <div style={styles.field}>
              <label style={styles.label}>{t('editProduct.productName')}</label>
              <input
                type="text"
                placeholder={t('editProduct.productNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.row2}>
              <div style={styles.field}>
                <label style={styles.label}>{t('editProduct.category')}</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={styles.select}>
                  {categories.length === 0 && <option value="">{t('editProduct.loading')}</option>}
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>{t('editProduct.availableQty')}</label>
                <input
                  type="number"
                  placeholder={t('editProduct.qtyPlaceholder')}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={styles.input}
                  min="0"
                  required
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>{t('editProduct.priceLabel')}</label>
              <input
                type="number"
                placeholder={t('editProduct.pricePlaceholder')}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={styles.input}
                min="0"
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>{t('editProduct.description')}</label>
              <textarea
                placeholder={t('editProduct.descPlaceholder')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={styles.textarea}
                rows="4"
              />
            </div>

            <button
              type="submit"
              style={{ ...styles.publishBtn, opacity: isSubmitting ? 0.7 : 1 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('editProduct.updating') : t('editProduct.update')}
            </button>
          </div>

          {/* Colonne droite : photo */}
          <div style={styles.imageCard}>
            <h3 style={styles.imageTitle}>{t('editProduct.productPhoto')}</h3>

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
                <h4 style={styles.dropTitle}>{t('editProduct.clickToAdd')}</h4>
                <p style={styles.dropSubtitle}>{t('editProduct.fileHint')}</p>
              </div>
            ) : (
              <div style={styles.previewWrap}>
                <img src={imagePreview} alt={t('editProduct.preview')} style={styles.previewImage} />
                <div style={styles.previewActions}>
                  <button type="button" style={styles.changeBtn} onClick={() => fileInputRef.current.click()}>
                    <Upload size={16} /> {t('editProduct.change')}
                  </button>
                  <button type="button" style={styles.removeBtn} onClick={removeImage}>
                    <X size={16} /> {t('editProduct.remove')}
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
    backgroundColor: '#2d6a4f',
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