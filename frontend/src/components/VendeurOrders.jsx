// src/components/VendeurOrders.jsx
import { useState } from 'react';
import { ArrowLeft, Package, CheckCircle, Clock, Truck, XCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';


export default function VendeurOrders({ orders, onUpdateOrderStatus }) {
  const { t } = useTranslation();
  const [expandedOrder, setExpandedOrder] = useState(null);

  // orders est déjà scopé au vendeur connecté (App.jsx appelle
  // /api/commandes/vendeur/{id}) : une commande n'ayant qu'un seul
  // vendeur, plus besoin de rapprocher par nom de produit ici.
  const vendeurOrders = orders;

  const getStatusIcon = (status) => {
    if (status === 'Livrée') return <CheckCircle size={18} color="#2d6a4f" />;
    if (status === 'En livraison') return <Truck size={18} color="#f5b041" />;
    if (status === 'En préparation') return <Clock size={18} color="#0066cc" />;
    if (status === 'Validée') return <Package size={18} color="#6f42c1" />;
    if (status === 'Annulée') return <XCircle size={18} color="#b3261e" />;
    return <Clock size={18} color="#adb5bd" />;
  };

  const getStatusColor = (status) => {
    if (status === 'Livrée') return '#2d6a4f';
    if (status === 'En livraison') return '#f5b041';
    if (status === 'En préparation') return '#0066cc';
    if (status === 'Validée') return '#6f42c1';
    if (status === 'Annulée') return '#b3261e';
    return '#adb5bd';
  };

  const getStatusBg = (status) => {
    if (status === 'Livrée') return '#e9f5ee';
    if (status === 'En livraison') return '#fff3e0';
    if (status === 'En préparation') return '#e0f0ff';
    if (status === 'Validée') return '#f1eafc';
    if (status === 'Annulée') return '#fdecea';
    return '#f1f3f5';
  };

  const handleStatusChange = (orderId, newStatus) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, newStatus);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{t('vendeurOrders.receivedOrders')}</h2>
        <p style={styles.subtitle}>{t('vendeurOrders.manageOrders')}</p>
      </div>

      {vendeurOrders.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={48} color="#adb5bd" />
          <p style={styles.emptyText}>{t('vendeurOrders.noOrdersYet')}</p>
        </div>
      ) : (
        <div style={styles.list}>
          {vendeurOrders.map(order => {
            const vendeurItems = order.items || [];
            const totalAmount = order.amount;

            return (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader} onClick={() => toggleExpand(order.id)}>
                  <div style={styles.orderLeft}>
                    <div style={styles.orderId}>{t('vendeurOrders.order')} #{order.id}</div>
                    <div style={styles.orderDate}>{order.date}</div>
                  </div>
                  <div style={styles.orderRight}>
                    <div style={styles.orderTotal}>{totalAmount.toLocaleString()} FCFA</div>
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusBg(order.status),
                      color: getStatusColor(order.status),
                    }}>
                      {getStatusIcon(order.status)} {order.status}
                    </div>
                    <button style={styles.expandBtn}>
                      {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div style={styles.orderDetails}>
                    <div style={styles.detailsGrid}>
                      <div>
                        <p style={styles.detailLabel}>{t('vendeurOrders.client')}</p>
                        <p style={styles.detailValue}>{order.client}</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>{t('vendeurOrders.email')}</p>
                        <p style={styles.detailValue}>{order.clientEmail || t('vendeurOrders.notProvided')}</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>{t('vendeurOrders.date')}</p>
                        <p style={styles.detailValue}>{order.date}</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>{t('vendeurOrders.totalAmount')}</p>
                        <p style={styles.detailValue}>{totalAmount.toLocaleString()} FCFA</p>
                      </div>
                    </div>

                    <div style={styles.productsSection}>
                      <h4 style={styles.productsTitle}>{t('vendeurOrders.orderedProducts')}</h4>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>{t('vendeurOrders.product')}</th>
                            <th style={styles.th}>{t('vendeurOrders.quantity')}</th>
                            <th style={styles.th}>{t('vendeurOrders.unitPrice')}</th>
                            <th style={styles.th}>{t('vendeurOrders.total')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendeurItems?.map((item, idx) => (
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

                    <div style={styles.actionsSection}>
                      {order.status === 'En attente' && (
                        <button style={styles.primaryActionBtn} onClick={() => handleStatusChange(order.id, 'Validée')}>
                          <CheckCircle size={16} /> {t('vendeurOrders.acceptOrder')}
                        </button>
                      )}
                      {order.status === 'Validée' && (
                        <button style={styles.primaryActionBtn} onClick={() => handleStatusChange(order.id, 'En préparation')}>
                          <Package size={16} /> {t('vendeurOrders.startPreparing')}
                        </button>
                      )}
                      {order.status === 'En préparation' && (
                        <button style={styles.primaryActionBtn} onClick={() => handleStatusChange(order.id, 'En livraison')}>
                          <Truck size={16} /> {t('vendeurOrders.markShipped')}
                        </button>
                      )}
                      {order.status === 'En livraison' && (
                        <p style={styles.waitingNote}>{t('vendeurOrders.awaitingClientConfirmation')}</p>
                      )}
                      {(order.status === 'Livrée' || order.status === 'Annulée') && (
                        <p style={styles.waitingNote}>{t('vendeurOrders.orderClosed')}</p>
                      )}
                    </div>
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
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '30px 20px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    marginBottom: '32px',
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
    color: '#6c757d',
  },
  emptyText: {
    fontSize: '16px',
    marginTop: '12px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
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
    transition: 'background 0.2s',
  },
  orderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  orderId: {
    fontWeight: '800',
    color: '#212529',
    fontSize: '15px',
  },
  orderDate: {
    fontSize: '13px',
    color: '#6c757d',
  },
  orderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  orderTotal: {
    fontWeight: '800',
    color: '#e07a5f',
    fontSize: '15px',
  },
  statusBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  expandBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6c757d',
    padding: '4px',
  },
  orderDetails: {
    padding: '0 20px 20px 20px',
    borderTop: '1px solid #f1f3f5',
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    paddingTop: '16px',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#adb5bd',
    fontWeight: '700',
    textTransform: 'uppercase',
    margin: '0 0 4px 0',
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#212529',
    margin: 0,
  },
  productsSection: {
    marginTop: '16px',
  },
  productsTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#212529',
    margin: '0 0 12px 0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '8px 8px',
    borderBottom: '1px solid #e9ecef',
    fontSize: '12px',
    fontWeight: '700',
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  td: {
    padding: '8px 8px',
    borderBottom: '1px solid #f8f9fa',
    color: '#495057',
  },
  tr: {
    ':last-child td': { borderBottom: 'none' },
  },
  actionsSection: {
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  primaryActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  waitingNote: {
    fontSize: '13px',
    color: '#6c757d',
    fontStyle: 'italic',
    margin: 0,
  },
};