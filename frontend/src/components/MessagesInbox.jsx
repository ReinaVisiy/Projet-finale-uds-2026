import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { messageApi } from '../services/api';
import { useTranslation } from 'react-i18next';


/**
 * Regroupe les messages plats renvoyés par /api/messages/mes-messages en
 * une liste de conversations (une par interlocuteur), avec le dernier
 * message et le nombre de messages non lus reçus de cette personne.
 * mes-messages est déjà trié par date décroissante côté backend, donc le
 * premier message rencontré pour un interlocuteur donné est le plus récent.
 */
function regrouperParConversation(messages, currentUserId, t) {
  const parInterlocuteur = new Map();

  for (const m of messages) {
    const estExpediteur = m.expediteurId === currentUserId;
    const autreId = estExpediteur ? m.destinataireId : m.expediteurId;
    const autreNom = estExpediteur ? m.destinataireNom : m.expediteurNom;

    if (!parInterlocuteur.has(autreId)) {
      parInterlocuteur.set(autreId, {
        id: autreId,
        name: autreNom || t('messagesInbox.user'),
        dernierMessage: m.contenu,
        dernierDate: m.dateEnvoi,
        nonLus: 0,
      });
    }
    const conv = parInterlocuteur.get(autreId);
    if (!estExpediteur && !m.estLu) conv.nonLus += 1;
  }

  return Array.from(parInterlocuteur.values());
}

export default function MessagesInbox({ currentUser, onOpenConversation, onBack }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur(null);
    try {
      const data = await messageApi.getMesMessages();
      setConversations(regrouperParConversation(data || [], currentUser?.id, t));
    } catch (e) {
      setErreur(e?.message || t('messagesInbox.loadFailed'));
    } finally {
      setChargement(false);
    }
  }, [currentUser?.id, t]);

  useEffect(() => { charger(); }, [charger]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={styles.title}>{t('messagesInbox.myMessages')}</h2>
      </div>

      {chargement && <p style={styles.hint}>{t('messagesInbox.loadingConvs')}</p>}
      {erreur && <div style={styles.errorBanner}>{erreur}</div>}

      {!chargement && !erreur && conversations.length === 0 && (
        <div style={styles.empty}>
          <MessageCircle size={40} color="#adb5bd" />
          <p style={styles.hint}>{t('messagesInbox.noConvs')}</p>
        </div>
      )}

      <div style={styles.list}>
        {conversations.map((conv) => (
          <button
            key={conv.id}
            style={styles.convCard}
            onClick={() => onOpenConversation({ id: conv.id, name: conv.name })}
          >
            <div style={styles.avatar}>{conv.name ? conv.name[0].toUpperCase() : '?'}</div>
            <div style={styles.convInfo}>
              <div style={styles.convTop}>
                <span style={styles.convName}>{conv.name}</span>
                {conv.dernierDate && (
                  <span style={styles.convTime}>
                    {new Date(conv.dernierDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>
              <div style={styles.convBottom}>
                <span style={styles.convPreview}>{conv.dernierMessage}</span>
                {conv.nonLus > 0 && <span style={styles.badge}>{conv.nonLus}</span>}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f0f7f4',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e9ecef',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#212529',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#212529',
    margin: 0,
  },
  hint: {
    fontSize: '13px',
    color: '#adb5bd',
    textAlign: 'center',
    margin: '24px 0',
  },
  errorBanner: {
    backgroundColor: '#fdecea',
    color: '#b3261e',
    fontSize: '13px',
    fontWeight: '600',
    padding: '10px 24px',
    textAlign: 'center',
  },
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '48px 24px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 16px',
    gap: '8px',
  },
  convCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  avatar: {
    width: '44px',
    height: '44px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '800',
    flexShrink: 0,
  },
  convInfo: { flex: 1, minWidth: 0 },
  convTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  convName: { fontSize: '15px', fontWeight: '800', color: '#212529' },
  convTime: { fontSize: '11px', color: '#adb5bd' },
  convBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' },
  convPreview: {
    fontSize: '13px',
    color: '#6c757d',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  badge: {
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '800',
    borderRadius: '10px',
    padding: '2px 8px',
    marginLeft: '8px',
  },
};
