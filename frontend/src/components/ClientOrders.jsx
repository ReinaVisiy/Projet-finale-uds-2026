 // src/components/ClientOrders.jsx
import { useState } from 'react';
import { ArrowLeft, Package, CheckCircle, Clock, Truck, XCircle, ChevronDown, ChevronUp, ThumbsUp, Ban, AlertTriangle, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from './ConfirmDialog';
import useIsMobile from '../hooks/useIsMobile';
import ProductLink from './common/ProductLink';

// Statuts pour lesquels le client peut encore annuler (avant EXPEDIEE,
// cf. section 2 du cahier des charges — le backend refait de toute façon
// cette vérification, ceci ne fait que masquer le bouton au bon moment).
const STATUTS_ANNULABLES = ['En attente', 'Validée', 'En préparation'];

export default function ClientOrders({ orders, onBackHome, onConfirmReception, onCancelOrder, onPayOrder, litiges = [], onOpenLitige, onContactVendor }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile(768);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState(null);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null); // order | null
  const [actionError, setActionError] = useState('');
  const [payingOrderId, setPayingOrderId] = useState(null);

  const handlePayOrder = async (order) => {
    setActionError('');
    setPayingOrderId(order.id);
    try {
      await onPayOrder(order);
      // En cas de succès, onPayOrder redirige vers NotchPay (window.location) :
      // on ne réinitialise payingOrderId que si on est encore là (échec silencieux).
    } catch (err) {
      setActionError(err?.message || t('clientOrders.payOrderError'));
    } finally {
      setPayingOrderId(null);
    }
  };

  const handleConfirmReception = async (order) => {
    setActionError('');
    setConfirmingOrderId(order.id);
    try {
      await onConfirmReception(order.id);
    } catch (err) {
      setActionError(err?.message || t('clientOrders.confirmReceptionError'));
    } finally {
      setConfirmingOrderId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setActionError('');
    setCancelingOrderId(orderToCancel.id);
    try {
      await onCancelOrder(orderToCancel.id);
    } catch (err) {
      setActionError(err?.message || t('clientOrders.cancelOrderError'));
    } finally {
      setCancelingOrderId(null);
      setOrderToCancel(null);
    }
  };

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

  const getLitigeForOrder = (orderId) => litiges.find((l) => l.commandeId === orderId);

  const getLitigeBadgeStyle = (statut) => {
    if (statut === 'RESOLU') return { label: t('clientOrders.litigeStatusResolu'), color: '#2d6a4f', bg: '#e9f5ee' };
    if (statut === 'REJETE') return { label: t('clientOrders.litigeStatusRejete'), color: '#b3261e', bg: '#fdecea' };
    return { label: t('clientOrders.litigeStatusOuvert'), color: '#f5b041', bg: '#fff3e0' };
  };

  return (
    <div style={styles.container}>
      <ConfirmDialog
        open={!!orderToCancel}
        title={t('clientOrders.cancelConfirmTitle')}
        message={orderToCancel
          ? `${t('clientOrders.cancelConfirmMsg')} #${orderToCancel.id} ?${orderToCancel.paye ? ' ' + t('clientOrders.cancelConfirmRefundNote') : ''}`
          : ''}
        confirmLabel={t('clientOrders.cancelConfirmBtn')}
        onCancel={() => setOrderToCancel(null)}
        onConfirm={handleCancelOrder}
      />
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBackHome}>
          <ArrowLeft size={20} /> {t('clientOrders.back')}
        </button>
        <h1 style={styles.title}>
          <Package size={28} color="#2d6a4f" /> {t('clientOrders.myOrders')}
        </h1>
        <p style={styles.subtitle}>{orders.length} {t('clientOrders.ordersPlaced')}</p>
        {actionError && <p style={styles.actionErrorBanner}>{actionError}</p>}
      </div>

      {orders.length === 0 ? (
        <div style={styles.emptyState}>
          <Package size={48} color="#adb5bd" />
          <p style={styles.emptyText}>{t('clientOrders.noOrdersYet')}</p>
          <button style={styles.emptyBtn} onClick={onBackHome}>{t('clientOrders.startShopping')}</button>
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
                    <div style={styles.orderId}>{t('clientOrders.order')} #{order.id}</div>
                    <div style={styles.orderDate}>{order.date}</div>
                  </div>
                  <div style={styles.orderRight}>
                    <div style={styles.orderTotal}>{order.amount.toLocaleString()} FCFA</div>
                    {order.paye ? (
                      <span style={styles.paidBadge}>{t('clientOrders.paid')}</span>
                    ) : (
                      <button
                        style={styles.payBtn}
                        disabled={payingOrderId === order.id}
                        onClick={(e) => { e.stopPropagation(); handlePayOrder(order); }}
                      >
                        {payingOrderId === order.id ? t('clientOrders.payOrderInProgress') : t('clientOrders.payOrder')}
                      </button>
                    )}
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
                    <div style={{ ...styles.detailsGrid, ...(isMobile && { gridTemplateColumns: '1fr' }) }}>
                      <div>
                        <p style={styles.detailLabel}>{t('clientOrders.client')}</p>
                        <p style={styles.detailValue}>{order.client}</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>{t('clientOrders.items')}</p>
                        <p style={styles.detailValue}>{totalItems} {t('clientOrders.itemsCount')}</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>{t('clientOrders.totalAmount')}</p>
                        <p style={styles.detailValue}>{order.amount.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <p style={styles.detailLabel}>{t('clientOrders.status')}</p>
                        <p style={styles.detailValue}>{order.status}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div style={styles.productsSection}>
                        <h4 style={styles.productsTitle}>{t('clientOrders.orderedProducts')}</h4>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>{t('clientOrders.product')}</th>
                              <th style={styles.th}>{t('clientOrders.qty')}</th>
                              <th style={styles.th}>{t('clientOrders.unitPrice')}</th>
                              <th style={styles.th}>{t('clientOrders.total')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} style={styles.tr}>
                                <td style={styles.td}><ProductLink id={item.produitId}>{item.nomProduit || item.name}</ProductLink></td>
                                <td style={styles.td}>{item.quantity}</td>
                                <td style={styles.td}>{item.prixUnitaire?.toLocaleString() || item.price?.toLocaleString()} FCFA</td>
                                <td style={styles.td}>{item.subtotal?.toLocaleString() || (item.quantity * item.price)?.toLocaleString()} FCFA</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div style={styles.orderActions}>
                      {order.producteurId && onContactVendor && (
                        <button style={styles.contactBtn} onClick={() => onContactVendor(order)}>
                          <MessageCircle size={16} /> {t('clientOrders.contactVendor')}
                        </button>
                      )}
                    </div>

                    {(order.status === 'En livraison' || order.status === 'Livrée' || STATUTS_ANNULABLES.includes(order.status)) && (
                      <div style={styles.orderActions}>
                        {order.status === 'En livraison' && (
                          <button
                            style={styles.confirmBtn}
                            disabled={confirmingOrderId === order.id}
                            onClick={() => handleConfirmReception(order)}
                          >
                            <ThumbsUp size={16} />
                            {confirmingOrderId === order.id
                              ? t('clientOrders.confirmReceptionInProgress')
                              : t('clientOrders.confirmReception')}
                          </button>
                        )}
                        {STATUTS_ANNULABLES.includes(order.status) && (
                          <button
                            style={styles.cancelBtn}
                            disabled={cancelingOrderId === order.id}
                            onClick={() => setOrderToCancel(order)}
                          >
                            <Ban size={16} />
                            {cancelingOrderId === order.id
                              ? t('clientOrders.cancelOrderInProgress')
                              : t('clientOrders.cancelOrder')}
                          </button>
                        )}
                        {(order.status === 'En livraison' || getLitigeForOrder(order.id)) && (() => {
                          const litige = getLitigeForOrder(order.id);
                          if (litige) {
                            const badge = getLitigeBadgeStyle(litige.statut);
                            return (
                              <span style={{ ...styles.statusBadge, backgroundColor: badge.bg, color: badge.color }}>
                                <AlertTriangle size={14} /> {badge.label}
                              </span>
                            );
                          }
                          return (
                            <button
                              style={styles.litigeBtn}
                              onClick={() => onOpenLitige && onOpenLitige(order)}
                            >
                              <AlertTriangle size={16} /> {t('clientOrders.openLitige')}
                            </button>
                          );
                        })()}
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
  paidBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    backgroundColor: '#e9f5ee',
    color: '#2d6a4f',
  },
  payBtn: {
    padding: '6px 14px',
    backgroundColor: '#e07a5f',
    color: '#ffffff',
    border: 'none',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
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
  actionErrorBanner: {
    marginTop: '12px',
    padding: '10px 14px',
    backgroundColor: '#fdecea',
    border: '1px solid #f5c2c7',
    borderRadius: '10px',
    color: '#b3261e',
    fontSize: '13px',
    fontWeight: '600',
  },
  orderActions: { display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' },
  contactBtn: { display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 14px', border: '1px solid #2d6a4f', borderRadius: '8px', backgroundColor: '#e9f5ee', color: '#1b4d3e', fontWeight: '700', cursor: 'pointer' },
  confirmBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: '#2d6a4f', color: '#ffffff',
    border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },
  cancelBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: '#fdecea', color: '#b3261e',
    border: '1px solid #f5c2c7', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },
  litigeBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: '#fff3e0', color: '#f5b041',
    border: '1px solid #ffe1b3', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
  },
};