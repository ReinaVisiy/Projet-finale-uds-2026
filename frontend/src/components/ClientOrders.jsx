 // src/components/ClientOrders.jsx
import React, { useState } from 'react';
import { ArrowLeft, Package, CheckCircle, Clock, Truck, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function ClientOrders({ orders, onBackHome }) {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const getStatusStyle = (status) => {
    if (status === 'Livrée') return { color: '#2d6a4f', bg: '#e9f5ee', icon: <CheckCircle size={16} color="#2d6a4f" /> };
    if (status === 'En livraison') return { color: '#f5b041', bg: '#fff3e0', icon: <Truck size={16} color="#f5b041" /> };
    if (status === 'En préparation') return { color: '#0066cc', bg: '#e0f0ff', icon: <Clock size={16} color="#0066cc" /> };
    if (status === 'Validée') return { color: '#6f42c1', bg: '#f1eafc', icon: <Package size={16} color="#6f42c1" /> };
    if (status === 'Annulée') return { color: '#b3261e', bg: '#fdecea', icon: <XCircle size={16} color="#b3261e" /> };
    return { color: '#adb5bd', bg: '#f1f3f5', icon: <Clock size={16} color="#adb5bd" /> };
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBackHome}>
          <ArrowLeft size={20} /> Retour
        </button>
        <h1 style={styles.title}>
          <Package size={28} color="#2d6a4f" /> Mes commandes
        </h1>
        <p style={styles.subtitle}>{orders.length} commande(s) passée(s)</p>
      </div>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={48} color="#adb5bd" />
          <p style={styles.emptyText}>Vous n'avez pas encore passé de commande.</p>
          <button style={styles.emptyBtn} onClick={onBackHome}>Commencer vos achats</button>
        </div>
      ) : (
        <div style={styles.list}>
          {orders.map(order => {
            const statusStyle = getStatusStyle(order.status);
            const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

            return (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader} onClick={() => toggleExpand(order.id)}>
                  <div style={styles.orderLeft}>
                    <div style={styles.orderId}>Commande #{order.id}</div>
                    <div style={styles.orderDate}>{order.date}</div>
                  </div>
                  <div style={styles.orderRight}>
                    <div style={styles.orderTotal}>{order.amount.toLocaleString()} FCFA</div>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                    }}>
                      {statusStyle.icon} {order.status}
                    </span>
                    <button style={styles.expandBtn}>
                      {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div style={styles.orderDetails}>
                    <div style={styles.detailsGrid}>
                      <div>
                        <p style={styles.detailLabel}>Client</p>
                        <p style={styles.detailValue}>{order.client}</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>Articles</p>
                        <p style={styles.detailValue}>{totalItems} article(s)</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>Montant total</p>
                        <p style={styles.detailValue}>{order.amount.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>Statut</p>
                        <p style={styles.detailValue}>{order.status}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div style={styles.productsSection}>
                        <h4 style={styles.productsTitle}>Produits commandés</h4>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>Produit</th>
                              <th style={styles.th}>Qté</th>
                              <th style={styles.th}>Prix unit.</th>
                              <th style={styles.th}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} style={styles.tr}>
                                <td style={styles.td}>{item.nomProduit || item.name}</td>
                                <td style={styles.td}>{item.quantity}</td>
                                <td style={styles.td}>{item.prixUnitaire?.toLocaleString() || item.price?.toLocaleString()} FCFA</td>
                                <td style={styles.td}>{item.subtotal?.toLocaleString() || (item.quantity * item.price)?.toLocaleString()} FCFA</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '900px',
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
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e9ecef',
    boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    cursor: 'pointer',
  },
  orderLeft: { display: 'flex', flexDirection: 'column', gap: '4px' },
  orderId: { fontWeight: '800', color: '#212529', fontSize: '15px' },
  orderDate: { fontSize: '13px', color: '#6c757d' },
  orderRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  orderTotal: { fontWeight: '800', color: '#e07a5f', fontSize: '15px' },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  expandBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#6c757d', padding: '4px' },
  orderDetails: { padding: '0 20px 20px 20px', borderTop: '1px solid #f1f3f5' },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    paddingTop: '16px',
  },
  detailLabel: { fontSize: '12px', color: '#adb5bd', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 4px 0' },
  detailValue: { fontSize: '14px', fontWeight: '600', color: '#212529', margin: 0 },
  productsSection: { marginTop: '16px' },
  productsTitle: { fontSize: '15px', fontWeight: '700', color: '#212529', margin: '0 0 12px 0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: {
    textAlign: 'left',
    padding: '8px 8px',
    borderBottom: '1px solid #e9ecef',
    fontSize: '12px',
    fontWeight: '700',
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  td: { padding: '8px 8px', borderBottom: '1px solid #f8f9fa', color: '#495057' },
  tr: { ':last-child td': { borderBottom: 'none' } },
};