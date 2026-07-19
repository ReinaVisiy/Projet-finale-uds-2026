// src/components/OrderManagementAdmin.jsx
import React from 'react';
import { ArrowLeft, Eye } from 'lucide-react';

export default function OrderManagementAdmin({
  ordersData = [],   // ← Valeur par défaut pour éviter l'erreur
  onViewOrder,
  onBack,
}) {
  // Vérification de sécurité supplémentaire
  const orders = Array.isArray(ordersData) ? ordersData : [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} /> Retour
        </button>
        <h1 style={styles.title}>Gestion des commandes</h1>
        <p style={styles.subtitle}>{orders.length} commande(s) au total</p>
      </div>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <p>Aucune commande enregistrée.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Commande</th>
                <th style={styles.th}>Client</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={styles.tr}>
                  <td style={styles.td}>#{order.id}</td>
                  <td style={styles.td}>{order.client}</td>
                  <td style={styles.td}>{order.amount?.toLocaleString() || 0} FCFA</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: order.status === 'Livrée' ? '#e9f5ee' : order.status === 'En livraison' ? '#fff3e0' : '#f1f3f5',
                      color: order.status === 'Livrée' ? '#2d6a4f' : order.status === 'En livraison' ? '#f5b041' : '#6c757d',
                    }}>
                      {order.status || 'En attente'}
                    </span>
                  </td>
                  <td style={styles.td}>{order.date}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.viewBtn}
                      onClick={() => onViewOrder && onViewOrder(order.id)}
                    >
                      <Eye size={16} /> Voir
                    </button>
                  </td>
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
    padding: '40px 20px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    marginBottom: '32px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
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
    fontSize: '28px',
    fontWeight: '900',
    color: '#212529',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6c757d',
    margin: 0,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#adb5bd',
    fontSize: '16px',
  },
  tableWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    padding: '20px',
    overflowX: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '12px 8px',
    borderBottom: '2px solid #e9ecef',
    fontSize: '12px',
    fontWeight: '700',
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #f8f9fa',
    color: '#495057',
    fontWeight: '500',
  },
  tr: {
    ':last-child td': { borderBottom: 'none' },
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  viewBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    backgroundColor: '#f1f3f5',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    color: '#495057',
  },
};