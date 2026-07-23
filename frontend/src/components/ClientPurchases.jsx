// src/components/ClientPurchases.jsx
import { ArrowLeft, Package, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductLink from './common/ProductLink';


export default function ClientPurchases({ orders, onBackHome }) {
  const { t } = useTranslation();
  // Filtrer uniquement les commandes livrées
  const deliveredOrders = orders.filter(order => order.status === 'Livrée');

  // Aplatir les commandes livrées en une liste de produits
  const purchases = [];
  deliveredOrders.forEach(order => {
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        purchases.push({
          produit: item.nomProduit || item.name || t('clientPurchases.unknownProduct'),
          produitId: item.produitId,
          quantite: item.quantity || 1,
          prixTotal: item.subtotal || (item.quantity * item.price) || 0,
          date: order.date || new Date().toLocaleDateString('fr-FR'),
          // Date brute (ISO) utilisée pour le tri, distincte de "date"
          // ci-dessus qui est déjà formatée en français et n'est pas
          // fiable à repasser dans `new Date()`.
          dateISO: order.dateISO || null,
          orderId: order.id,
        });
      });
    } else {
      purchases.push({
        produit: `${t('clientPurchases.order')} #${order.id}`,
        quantite: 1,
        prixTotal: order.amount || 0,
        date: order.date || new Date().toLocaleDateString('fr-FR'),
        dateISO: order.dateISO || null,
        orderId: order.id,
      });
    }
  });

  // Trier par date décroissante
  purchases.sort((a, b) => new Date(b.dateISO || 0) - new Date(a.dateISO || 0));

  const totalItems = purchases.length;
  const totalSpent = purchases.reduce((sum, p) => sum + p.prixTotal, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBackHome}>
          <ArrowLeft size={20} /> {t('clientPurchases.back')}
        </button>
        <h1 style={styles.title}>
          <ShoppingBag size={28} color="#2d6a4f" /> {t('clientPurchases.myPurchases')}
        </h1>
        <p style={styles.subtitle}>
          {totalItems} {t('clientPurchases.itemsBought')} — {t('clientPurchases.total')} {totalSpent.toLocaleString()} FCFA
        </p>
      </div>

      {purchases.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={48} color="#adb5bd" />
          <p style={styles.emptyText}>{t('clientPurchases.noPurchases')}</p>
          <button style={styles.emptyBtn} onClick={onBackHome}>{t('clientPurchases.startShopping')}</button>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>{t('clientPurchases.product')}</th>
                <th style={styles.th}>{t('clientPurchases.quantity')}</th>
                <th style={styles.th}>{t('clientPurchases.purchasePrice')}</th>
                <th style={styles.th}>{t('clientPurchases.deliveryDate')}</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={styles.td}>
                    <ProductLink id={purchase.produitId} style={styles.productName}>{purchase.produit}</ProductLink>
                    <span style={styles.orderId}>#{purchase.orderId}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.quantityBadge}>{purchase.quantite}</span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.price}>{purchase.prixTotal.toLocaleString()} FCFA</span>
                  </td>
                  <td style={styles.td}>{purchase.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '40px 20px 80px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: { marginBottom: '32px' },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    marginBottom: '12px',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '28px',
    fontWeight: '900',
    color: '#212529',
    margin: '0 0 4px 0',
  },
  subtitle: { fontSize: '14px', color: '#6c757d', margin: 0 },
  emptyState: { textAlign: 'center', padding: '60px 20px', color: '#6c757d' },
  emptyText: { fontSize: '16px', margin: '16px 0' },
  emptyBtn: {
    padding: '12px 24px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  tableWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontWeight: '700',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    borderBottom: '1px solid #e9ecef',
  },
  tr: { borderBottom: '1px solid #f8f9fa', ':last-child': { borderBottom: 'none' } },
  td: { padding: '14px 16px', color: '#212529', fontWeight: '500', verticalAlign: 'middle' },
  productName: { display: 'block', fontWeight: '600', color: '#212529' },
  orderId: { display: 'block', fontSize: '12px', color: '#adb5bd', fontWeight: '500', marginTop: '2px' },
  quantityBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    backgroundColor: '#f1f3f5',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '700',
    color: '#495057',
  },
  price: { display: 'block', fontWeight: '700', color: '#e07a5f' },
};