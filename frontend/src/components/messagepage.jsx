import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Check, CheckCheck } from 'lucide-react';
import { messageApi } from '../services/api';

/** Convertit un MessageResponse backend en objet bulle affichable. */
function mapMessage(msg, currentUserId) {
  return {
    id: msg.id,
    text: msg.contenu,
    sender: msg.expediteurId === currentUserId ? 'client' : 'vendor',
    time: msg.dateEnvoi
      ? new Date(msg.dateEnvoi).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : '',
    status: msg.estLu ? 'read' : 'sent',
  };
}

export default function MessagePage({ onBack, vendor, currentUser }) {

  const vendorInfo = vendor || { name: 'Ferme Dschang', product: 'Banane Fraîche' };
  const destinataireId = vendorInfo.id;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const bottomRef = useRef(null);

  // Charge la conversation réelle depuis message-service au montage.
  const chargerConversation = useCallback(async () => {
    if (!destinataireId) {
      setErreur("Impossible de démarrer la conversation : producteur introuvable.");
      setChargement(false);
      return;
    }
    setChargement(true);
    setErreur(null);
    try {
      const data = await messageApi.getConversation(destinataireId);
      const mapped = (data || []).map((m) => mapMessage(m, currentUser?.id));
      setMessages(mapped);

      // Marque comme lus les messages reçus du vendeur qui ne le sont pas encore.
      (data || [])
        .filter((m) => m.destinataireId === currentUser?.id && !m.estLu)
        .forEach((m) => {
          messageApi.marquerLu(m.id).catch(() => {});
        });
    } catch (e) {
      setErreur(e?.message || "Impossible de charger la conversation.");
    } finally {
      setChargement(false);
    }
  }, [destinataireId, currentUser?.id]);

  useEffect(() => {
    chargerConversation();
  }, [chargerConversation]);

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const contenu = input.trim();
    if (!contenu || !destinataireId || envoiEnCours) return;

    setEnvoiEnCours(true);
    setErreur(null);
    try {
      const response = await messageApi.envoyerMessage({ destinataireId, contenu });
      setMessages((prev) => [...prev, mapMessage(response, currentUser?.id)]);
      setInput('');
    } catch (e) {
      setErreur(e?.message || "L'envoi du message a échoué. Réessayez.");
    } finally {
      setEnvoiEnCours(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.wrapper}>

      {/* HEADER */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={20} />
        </button>

        <div style={styles.vendorInfo}>
          <div style={styles.avatar}>{vendorInfo.name[0]}</div>
          <div>
            <h3 style={styles.vendorName}>{vendorInfo.name}</h3>
            <span style={styles.onlineStatus}>● En ligne</span>
          </div>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.iconBtn}><Phone size={20} color="#2d6a4f" /></button>
          <button style={styles.iconBtn}><Video size={20} color="#2d6a4f" /></button>
          <button style={styles.iconBtn}><MoreVertical size={20} color="#6c757d" /></button>
        </div>
      </div>

      {/* Produit concerné */}
      <div style={styles.productBanner}>
        <span style={styles.productBannerText}>
          💬 Conversation à propos de : <strong>{vendorInfo.product}</strong>
        </span>
      </div>

      {erreur && (
        <div style={styles.errorBanner}>{erreur}</div>
      )}

      {/* MESSAGES */}
      <div style={styles.messagesArea}>
        {chargement && (
          <p style={styles.hint}>Chargement de la conversation...</p>
        )}
        {!chargement && messages.length === 0 && !erreur && (
          <p style={styles.hint}>Aucun message pour le moment. Dites bonjour 👋</p>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              ...styles.msgRow,
              justifyContent: msg.sender === 'client' ? 'flex-end' : 'flex-start'
            }}
          >
            {/* Avatar vendeur */}
            {msg.sender === 'vendor' && (
              <div style={styles.msgAvatar}>{vendorInfo.name[0]}</div>
            )}

            <div style={{
              ...styles.bubble,
              ...(msg.sender === 'client' ? styles.bubbleClient : styles.bubbleVendor)
            }}>
              <p style={styles.msgText}>{msg.text}</p>
              <div style={styles.msgMeta}>
                <span style={styles.msgTime}>{msg.time}</span>
                {msg.sender === 'client' && (
                  msg.status === 'read'
                    ? <CheckCheck size={14} color="#2d6a4f" />
                    : <Check size={14} color="#adb5bd" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ZONE DE SAISIE */}
      <div style={styles.inputArea}>
        <div style={styles.inputWrap}>
          <textarea
            style={styles.input}
            placeholder="Écrire un message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            style={{
              ...styles.sendBtn,
              backgroundColor: input.trim() && !envoiEnCours ? '#2d6a4f' : '#dee2e6',
              cursor: input.trim() && !envoiEnCours ? 'pointer' : 'default'
            }}
            onClick={handleSend}
            disabled={!input.trim() || envoiEnCours}
          >
            <Send size={18} color={input.trim() && !envoiEnCours ? '#ffffff' : '#adb5bd'} />
          </button>
        </div>
        <p style={styles.hint}>Appuyez sur Entrée pour envoyer</p>
      </div>

    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f0f7f4',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },

  // HEADER
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
  vendorInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
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
  },
  vendorName: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#212529',
    margin: 0,
  },
  onlineStatus: {
    fontSize: '12px',
    color: '#2d6a4f',
    fontWeight: '600',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
  },

  errorBanner: {
    backgroundColor: '#fdecea',
    color: '#b3261e',
    fontSize: '13px',
    fontWeight: '600',
    padding: '10px 24px',
    textAlign: 'center',
  },

  // BANNIERE PRODUIT
  productBanner: {
    backgroundColor: '#e9f5ee',
    padding: '10px 24px',
    borderBottom: '1px solid #b7e4c7',
    textAlign: 'center',
  },
  productBannerText: {
    fontSize: '13px',
    color: '#2d6a4f',
    fontWeight: '600',
  },

  // MESSAGES
  messagesArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  msgRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  msgAvatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#1b4d3e',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '800',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '18px',
  },
  bubbleClient: {
    backgroundColor: '#2d6a4f',
    color: '#ffffff',
    borderBottomRightRadius: '4px',
  },
  bubbleVendor: {
    backgroundColor: '#ffffff',
    color: '#212529',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  msgText: {
    fontSize: '15px',
    margin: '0 0 6px 0',
    lineHeight: '1.5',
  },
  msgMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '4px',
  },
  msgTime: {
    fontSize: '11px',
    opacity: 0.7,
  },

  // INPUT
  inputArea: {
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e9ecef',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '20px',
    padding: '8px 8px 8px 16px',
    border: '1px solid #e9ecef',
  },
  input: {
    flex: 1,
    border: 'none',
    background: 'none',
    fontSize: '15px',
    color: '#212529',
    outline: 'none',
    resize: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    lineHeight: '1.5',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
  },
  hint: {
    fontSize: '11px',
    color: '#adb5bd',
    textAlign: 'center',
    margin: '6px 0 0 0',
  },
};