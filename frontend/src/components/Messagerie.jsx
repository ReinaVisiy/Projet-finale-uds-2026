import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { messageApi, utilisateurApi } from '../services/api';
import {
  Search,
  Send,
  ImageIcon,
  X,
  CornerUpLeft,
  Copy,
  Trash2,
  Check,
  CheckCheck,
  ArrowDown,
  ChevronLeft,
  MessageSquare,
  MoreVertical,
  User
} from 'lucide-react';

// Marqueur insere dans le tout premier message d'une conversation demarree
// depuis la page d'un produit (bouton "Contacter le vendeur"). Il permet
// d'afficher un bandeau "Conversation a propos de : <produit>" au debut
// de l'echange, comme une banniere de date. N'apparait PAS si la
// conversation a ete demarree en contactant un producteur trouve par
// recherche (dans ce cas, aucun produit n'est associe).
const PRODUCT_MARKER_PREFIX = '[PRODUIT:';

// Marqueur de reponse-a-un-message : purement cote frontend (pas de champ
// dedie cote backend), stocke au debut du contenu du nouveau message.
const REPLY_MARKER_PREFIX = '[Reponse a: "';

export default function Messagerie({ onBack, vendor, currentUser, onMessageEnvoye }) {
  const { t, i18n } = useTranslation();
  const currentUserId = currentUser?.id;
  const ROLE_LABELS = {
    CLIENT: t('messagerie.roleClient'),
    PRODUCTEUR: t('messagerie.roleVendeur'),
    ADMIN: t('messagerie.roleAdmin')
  };

  // State Management
  const [conversations, setConversations] = useState([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState(() => {
    if (vendor?.id) return vendor.id;
    const saved = sessionStorage.getItem('agrycam_last_chat_partner');
    return saved ? Number(saved) : null;
  });
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Advanced features state
  const [replyTo, setReplyTo] = useState(null);
  const [attachedImageBase64, setAttachedImageBase64] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mobile layout state - si on arrive depuis un vendeur precis (produit ou
  // profil producteur), on saute directement sur la conversation.
  const [activePane, setActivePane] = useState(vendor?.id ? 'chat' : 'list');

  // Dynamic names, profile details, and interactive actions menus
  const [userNames, setUserNames] = useState({});
  const [activeMessageMenuId, setActiveMessageMenuId] = useState(null);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Dynamic Name Resolution Helper
  // partnerIdHint permet de resoudre un nom meme quand aucune conversation
  // n'existe encore (avant l'envoi du tout premier message), par exemple
  // dans l'en-tete de la discussion.
  const getPartnerName = (convo, partnerIdHint) => {
    const id = convo?.partnerId ?? partnerIdHint;
    if (id == null) return t('messagerie.user');
    if (userNames[id]) return userNames[id];
    if (convo?.partnerName) return convo.partnerName;
    if (vendor?.id === id && vendor?.name) return vendor.name;
    return t('messagerie.userWithId', { id });
  };

  // Refs
  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Display Toast Alert
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Graceful name fallback builder
  const obtenirNomUtilisateur = (id, name) => {
    if (name && name.trim() !== "") return name;
    return t('messagerie.user');
  };

  // Si on arrive depuis un vendeur precis (bouton "Contacter" sur un produit
  // ou un profil producteur), on ouvre directement cette conversation.
  useEffect(() => {
    if (vendor?.id) {
      setSelectedPartnerId(vendor.id);
      sessionStorage.setItem('agrycam_last_chat_partner', vendor.id);
      setActivePane('chat');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor?.id]);

  // Doit rester coherent avec MessageService#TAILLE_MAX_IMAGE_BASE64 cote
  // backend (3 000 000 caracteres ~= 2,1 Mo d'image d'origine).
  const TAILLE_MAX_IMAGE_BASE64 = 3_000_000;

  // Convert files to base64 (envoye ensuite via le champ dedie imageData,
  // pas embarque dans le texte du message).
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // permet de re-selectionner le meme fichier ensuite
    if (file) {
      if (!file.type.startsWith('image/')) {
        triggerToast(t('messagerie.imageTooLarge'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result.length > TAILLE_MAX_IMAGE_BASE64) {
          triggerToast(t('messagerie.imageTooLarge'));
          return;
        }
        setAttachedImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Retire un contenu de ses marqueurs techniques ([PRODUIT:..],
  // [Reponse a: "..."]) pour construire un apercu texte propre (liste des
  // conversations, bouton "copier", etc.)
  const nettoyerApercu = (contenuBrut) => {
    let texte = contenuBrut || '';
    if (texte.startsWith(PRODUCT_MARKER_PREFIX)) {
      const idx = texte.indexOf(']');
      texte = idx !== -1 ? texte.substring(idx + 1).replace(/^\n/, '').trim() : texte;
    }
    if (texte.startsWith(REPLY_MARKER_PREFIX)) {
      const quoteCloseIdx = texte.indexOf('"]');
      texte = quoteCloseIdx !== -1 ? texte.substring(quoteCloseIdx + 2).replace(/^\n/, '').trim() : texte;
    }
    return texte;
  };

  // Poll main message lists
  const fetchMessagesAndConversations = async (isInitial = false) => {
    if (!currentUserId) return;
    try {
      if (isInitial) setLoading(true);

      const allMessages = await messageApi.getMesMessages();
      const unreads = await messageApi.compterNonLus().catch(() => 0);
      setUnreadTotal(unreads);

      // Group messages by partner ID
      const grouped = {};

      allMessages.forEach(msg => {
        const partnerId = msg.expediteurId === currentUserId ? msg.destinataireId : msg.expediteurId;
        const partnerNom = msg.expediteurId === currentUserId ? msg.destinataireNom : msg.expediteurNom;

        if (!grouped[partnerId]) {
          grouped[partnerId] = {
            partnerId,
            partnerName: obtenirNomUtilisateur(partnerId, partnerNom),
            messages: [],
            unreadCount: 0
          };
        }

        grouped[partnerId].messages.push(msg);

        // Calculate unread count strictly: message.estLu === false AND current logged-in user IS the recipient
        if (!msg.estLu && msg.destinataireId === currentUserId) {
          grouped[partnerId].unreadCount += 1;
        }
      });

      // Map to array and sort by latest message date descending
      const conversationsList = Object.values(grouped).map(convo => {
        // Sort conversation messages ascending
        convo.messages.sort((a, b) => new Date(a.dateEnvoi) - new Date(b.dateEnvoi));
        convo.lastMessage = convo.messages[convo.messages.length - 1];
        return convo;
      }).sort((a, b) => new Date(b.lastMessage.dateEnvoi) - new Date(a.lastMessage.dateEnvoi));

      setConversations(conversationsList);

      // If a conversation is selected, update active messages list
      if (selectedPartnerId !== null) {
        const activeConvo = conversationsList.find(c => c.partnerId === selectedPartnerId);
        if (activeConvo) {
          setMessages(activeConvo.messages);

          // Trigger read receipts for incoming unread messages in this selected conversation
          activeConvo.messages.forEach(async (msg) => {
            if (!msg.estLu && msg.destinataireId === currentUserId) {
              try {
                await messageApi.marquerLu(msg.id);
                msg.estLu = true; // Optimistic update
              } catch (err) {
                console.error("Could not mark message as read:", err);
              }
            }
          });
        } else {
          // If selected partner not in conversation lists yet (e.g. started new but empty)
          const singleHistory = await messageApi.getConversation(selectedPartnerId).catch(() => []);
          setMessages(singleHistory);
        }
      }
    } catch (error) {
      console.error("Error fetching messagerie records:", error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Run initial fetch and configure 10s polling interval
  useEffect(() => {
    fetchMessagesAndConversations(true);

    const interval = setInterval(() => {
      fetchMessagesAndConversations(false);
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartnerId, currentUserId]);

  // Dynamically load real names for any conversation partner we have in our lists
  useEffect(() => {
    const fetchMissingNames = async () => {
      const missingIds = conversations
        .map(c => c.partnerId)
        .filter(id => !userNames[id]);

      if (selectedPartnerId && !userNames[selectedPartnerId] && !missingIds.includes(selectedPartnerId)) {
        missingIds.push(selectedPartnerId);
      }

      if (missingIds.length === 0) return;

      missingIds.forEach(async (id) => {
        try {
          const u = await utilisateurApi.getUtilisateurById(id);
          if (u && u.nom) {
            setUserNames(prev => ({ ...prev, [id]: u.nom }));
          }
        } catch (e) {
          console.error("Failed to load user name for:", id, e);
        }
      });
    };

    fetchMissingNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, selectedPartnerId]);

  // Persist conversation selection and set pane context
  const handleSelectConversation = (partnerId) => {
    setSelectedPartnerId(partnerId);
    sessionStorage.setItem('agrycam_last_chat_partner', partnerId);
    setActivePane('chat');
    // Clear advanced message modifiers
    setReplyTo(null);
    setAttachedImageBase64(null);
  };

  // Detect scroll behavior for floating bottom-anchor action
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Show button if user scrolled up more than 300px
    const isUp = scrollHeight - scrollTop - clientHeight > 300;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Auto scroll to bottom when messages list size changes
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Send message action
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImageBase64) return;
    if (!selectedPartnerId) return;

    setSending(true);

    try {
      let finalContent = inputText.trim();

      // Incorporate reply-to context markup if applicable
      if (replyTo) {
        const replyPreview = replyTo.estSupprime
          ? t('messagerie.deletedMessage')
          : (replyTo.contenu ? nettoyerApercu(replyTo.contenu) : t('messagerie.imagePreview'));
        finalContent = `${REPLY_MARKER_PREFIX}${replyPreview.substring(0, 40)}${replyPreview.length > 40 ? '...' : ''}"] \n${finalContent}`;
      }

      // Si on contacte un vendeur depuis une fiche produit et qu'aucun
      // message n'a encore ete echange avec lui, on marque ce premier
      // message avec le produit concerne (affiche ensuite comme une
      // banniere au debut de la conversation). Ne s'applique jamais a une
      // conversation demarree via un profil producteur trouve par
      // recherche (pas de produit associe dans ce cas).
      const estNouvelleConversationViaProduit =
        vendor?.id === selectedPartnerId && !!vendor?.product && messages.length === 0;
      if (estNouvelleConversationViaProduit) {
        finalContent = `${PRODUCT_MARKER_PREFIX}${vendor.product}]\n${finalContent}`;
      }

      const sentMsg = await messageApi.envoyerMessage({
        destinataireId: selectedPartnerId,
        contenu: finalContent,
        imageData: attachedImageBase64 || undefined
      });

      // Update states optimistically
      setMessages(prev => [...prev, sentMsg]);
      setInputText('');
      setReplyTo(null);
      setAttachedImageBase64(null);
      if (textInputRef.current) {
        textInputRef.current.style.height = 'auto'; // Reset textarea height
      }

      onMessageEnvoye?.(selectedPartnerId, sentMsg);

      // Re-trigger global refresh
      fetchMessagesAndConversations(false);
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (err) {
      console.error("Failed to transmit message:", err);
      triggerToast(t('messagerie.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  // Suppression reelle et persistante (pas juste locale) : appelle le
  // backend (DELETE /api/messages/{id}), qui marque le message comme
  // supprime de facon definitive (estSupprime=true, contenu/imageData vides).
  // On applique la reponse du backend a l'etat local tout de suite pour que
  // le placeholder "Message supprime" s'affiche immediatement ET reste
  // affiche apres le prochain rafraichissement (polling toutes les 10s).
  const handleDeleteMessage = async (id) => {
    try {
      const updated = await messageApi.supprimerMessage(id);
      setMessages(prev => prev.map(m => m.id === id ? updated : m));
      triggerToast(t('messagerie.messageDeletedToast'));
      fetchMessagesAndConversations(false);
    } catch (err) {
      console.error("Failed to delete message:", err);
      triggerToast(t('messagerie.deleteFailed'));
    }
  };

  // Copy to clipboard utility
  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(nettoyerApercu(text));
    triggerToast(t('messagerie.copiedToClipboard'));
  };

  // Auto expand textarea logic
  const handleTextareaInput = (e) => {
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    setInputText(el.value);
  };

  // Date Formatting Helper
  const localeTag = i18n.language === 'en' ? 'en-US' : 'fr-FR';
  const formatDateHeader = (dateString) => {
    const d = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return t('messagerie.today');
    } else if (d.toDateString() === yesterday.toDateString()) {
      return t('messagerie.yesterday');
    } else {
      return d.toLocaleDateString(localeTag, { day: 'numeric', month: 'short', year: 'numeric' });
    }
  };

  // Time stamp extraction
  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleTimeString(localeTag, { hour: '2-digit', minute: '2-digit' });
  };

  // Filter conversations list by user's search query
  const filteredConversations = conversations.filter(c =>
    getPartnerName(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.partnerId.toString().includes(searchQuery)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4fbf7' }}>
      {/* Dynamic Navigation Bar with Back Arrow, Discussion Context Menu, and User Profile Info */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e9ecef',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxShadow: 'var(--shadow-sm)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Back Arrow button - ramene a l'ecran d'ou l'on vient (produit,
            profil producteur, ou l'ecran courant si ouvert depuis la
            barre de navigation) */}
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#1f6b4d',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 107, 77, 0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          title={t('messagerie.close')}
        >
          <ChevronLeft size={24} />
        </button>

        {/* Right side: Discussion Menu (if active) + User Name & Picture */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          {selectedPartnerId && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
                style={{
                  color: '#1f6b4d',
                  padding: '8px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(31, 107, 77, 0.08)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title={t('messagerie.discussionMenu')}
              >
                <MoreVertical size={20} />
              </button>

              {showHeaderDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '0',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid #e9ecef',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px 0',
                  zIndex: 200,
                  minWidth: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setShowHeaderDropdown(false);
                      setLoadingProfile(true);
                      setShowProfileModal(true);
                      try {
                        const u = await utilisateurApi.getUtilisateurById(selectedPartnerId);
                        setPartnerProfile(u);
                      } catch (e) {
                        console.error(e);
                        triggerToast(t('messagerie.profileLoadFailed'));
                      } finally {
                        setLoadingProfile(false);
                      }
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-neutral-light)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User size={16} style={{ color: '#1f6b4d' }} />
                    <span>{t('messagerie.viewProfile')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setShowHeaderDropdown(false);
                      if (window.confirm(t('messagerie.clearConversationConfirm'))) {
                        try {
                          await messageApi.supprimerConversation(selectedPartnerId);
                          setMessages([]);
                          triggerToast(t('messagerie.conversationCleared'));
                          fetchMessagesAndConversations(false);
                        } catch (e) {
                          console.error(e);
                          triggerToast(t('messagerie.clearConversationError'));
                        }
                      }
                    }}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--status-cancelled)',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      width: '100%'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--status-cancelled-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={16} style={{ color: 'var(--status-cancelled)' }} />
                    <span>{t('messagerie.clearConversation')}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {currentUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span
                className="hidden sm:inline"
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--text-main)'
                }}
              >
                {currentUser.prenom || (currentUser.email ? currentUser.email.split('@')[0] : t('messagerie.user'))}
              </span>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(31, 107, 77, 0.1)',
                border: '1.5px solid #1f6b4d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1f6b4d',
                fontWeight: '700',
                fontSize: '14px',
                overflow: 'hidden'
              }}>
                {currentUser.photo ? (
                  <img src={currentUser.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUser.prenom?.[0]?.toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Floating Status / Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          backgroundColor: '#1f6b4d',
          color: 'white',
          padding: '12px 20px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>

        {/* Left Sidebar Pane */}
        <div style={{
          width: '350px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e9ecef',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        className="mobile-convo-pane"
        >
          {/* Sidebar Header: SOLID FOREST GREEN with white text */}
          <div style={{
            padding: '16px',
            backgroundColor: '#1f6b4d',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>{t('messagerie.discussions')}</h2>
                {unreadTotal > 0 && (
                  <span style={{
                    backgroundColor: 'white',
                    color: '#1f6b4d',
                    borderRadius: '10px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    {unreadTotal}
                  </span>
                )}
              </div>
            </div>

            {/* Search Filter */}
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.7)'
              }} />
              <input
                type="text"
                placeholder={t('messagerie.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px 8px 36px',
                  fontSize: '13px',
                  outline: 'none',
                  color: 'white'
                }}
              />
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>

            {loading ? (
              // Shimmer Skeletons
              Array(4).fill(0).map((_, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                }}>
                  <div className="shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="shimmer" style={{ width: '40%', height: '14px', marginBottom: '8px', borderRadius: '4px' }}></div>
                    <div className="shimmer" style={{ width: '70%', height: '10px', borderRadius: '4px' }}></div>
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-muted)'
              }}>
                <MessageSquare size={36} style={{ margin: '0 auto 12px auto', opacity: 0.5, color: '#1f6b4d' }} />
                <p style={{ fontSize: '13px', fontWeight: '500' }}>{t('messagerie.noConvFound')}</p>
              </div>
            ) : (
              filteredConversations.map((convo) => {
                const isActive = selectedPartnerId === convo.partnerId;
                const partnerNameResolved = getPartnerName(convo);
                const initials = partnerNameResolved.charAt(0).toUpperCase() || '?';
                const hasUnread = convo.unreadCount > 0;

                const lastMsgText = convo.lastMessage?.estSupprime
                  ? t('messagerie.deletedMessage')
                  : (convo.lastMessage?.imageData && !convo.lastMessage?.contenu?.trim()
                    ? t('messagerie.imagePreview')
                    : nettoyerApercu(convo.lastMessage?.contenu || ''));

                return (
                  <div
                    key={convo.partnerId}
                    onClick={() => handleSelectConversation(convo.partnerId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderLeft: isActive ? '4px solid #1f6b4d' : '4px solid transparent',
                      backgroundColor: isActive ? 'rgba(31, 107, 77, 0.05)' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* Partner Avatar fallback with lucide User icon if default */}
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: '#1f6b4d',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '700',
                      flexShrink: 0
                    }}>
                      {partnerNameResolved === t('messagerie.user') ? (
                        <User size={18} />
                      ) : (
                        initials
                      )}
                    </div>

                    {/* Chat Preview Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: hasUnread ? '700' : '600',
                          color: '#1e293b',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {partnerNameResolved}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)'
                        }}>
                          {convo.lastMessage ? formatTime(convo.lastMessage.dateEnvoi) : ''}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px'
                      }}>
                        <p style={{
                          fontSize: '12px',
                          color: hasUnread ? '#0f172a' : 'var(--text-muted)',
                          fontWeight: hasUnread ? '600' : '400',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1
                        }}>
                          {lastMsgText || t('messagerie.noContent')}
                        </p>

                        {/* Unread Badge */}
                        {hasUnread && (
                          <span style={{
                            backgroundColor: '#1f6b4d',
                            color: 'white',
                            borderRadius: '50%',
                            minWidth: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: '700',
                            padding: '0 4px'
                          }}>
                            {convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Chat Window Pane */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          backgroundColor: '#efeae2',
          position: 'relative',
        }}
        className="mobile-chat-pane"
        >
          {selectedPartnerId === null ? (
            // No Selected Chat Empty State
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{
                backgroundColor: 'rgba(31, 107, 77, 0.08)',
                color: '#1f6b4d',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <MessageSquare size={36} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' }}>
                {t('messagerie.selectConversation')}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '340px' }}>
                {t('messagerie.selectConversationHint')}
              </p>
            </div>
          ) : (
            // Active Conversation Elements
            <>
              {/* Chat Header: SOLID FOREST GREEN with white text */}
              <div style={{
                height: '60px',
                backgroundColor: '#1f6b4d',
                color: 'white',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Mobile Back Trigger Button */}
                  <button
                    onClick={() => setActivePane('list')}
                    className="mobile-back-btn"
                    style={{
                      padding: '4px',
                      display: 'none', // Set via style block for mobile
                      color: 'white',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    color: '#1f6b4d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}>
                    {getPartnerName(conversations.find(c => c.partnerId === selectedPartnerId), selectedPartnerId) === t('messagerie.user') ? (
                      <User size={16} />
                    ) : (
                      getPartnerName(conversations.find(c => c.partnerId === selectedPartnerId), selectedPartnerId).charAt(0).toUpperCase() || '?'
                    )}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>
                      {getPartnerName(conversations.find(c => c.partnerId === selectedPartnerId), selectedPartnerId)}
                    </h3>
                  </div>
                </div>

                {/* Top-Right header close operation */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Close conversation */}
                  <button
                    onClick={() => {
                      setSelectedPartnerId(null);
                      sessionStorage.removeItem('agrycam_last_chat_partner');
                    }}
                    style={{
                      color: 'white',
                      padding: '8px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title={t('messagerie.close')}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Chat Message Scrollable Canvas */}
              <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {messages.length === 0 ? (
                  <div style={{
                    margin: 'auto',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    maxWidth: '300px',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {t('messagerie.noMessagesYet')}
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMyMessage = msg.expediteurId === currentUserId;
                    const showDateHeader = index === 0 || formatDateHeader(messages[index-1].dateEnvoi) !== formatDateHeader(msg.dateEnvoi);

                    let cleanContent = msg.contenu || '';

                    // Parse le contexte produit - uniquement possible sur le
                    // tout premier message de la conversation, puisque
                    // c'est le seul ou ce marqueur est jamais ajoute.
                    let productContext = null;
                    if (index === 0 && cleanContent.startsWith(PRODUCT_MARKER_PREFIX)) {
                      const closeIdx = cleanContent.indexOf(']');
                      if (closeIdx !== -1) {
                        productContext = cleanContent.substring(PRODUCT_MARKER_PREFIX.length, closeIdx);
                        cleanContent = cleanContent.substring(closeIdx + 1).replace(/^\n/, '');
                      }
                    }

                    // Parse custom reply context if stored inside content
                    let replyTextContext = null;
                    if (cleanContent.startsWith(REPLY_MARKER_PREFIX)) {
                      const quoteCloseIdx = cleanContent.indexOf('"]');
                      if (quoteCloseIdx !== -1) {
                        replyTextContext = cleanContent.substring(REPLY_MARKER_PREFIX.length, quoteCloseIdx);
                        cleanContent = cleanContent.substring(quoteCloseIdx + 2).replace(/^\n/, '');
                      }
                    }

                    return (
                      <React.Fragment key={msg.id || index}>
                        {/* Day Divider */}
                        {showDateHeader && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            margin: '12px 0 6px 0'
                          }}>
                            <span style={{
                              backgroundColor: 'rgba(226, 232, 240, 0.9)',
                              color: 'var(--text-muted)',
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '600',
                              boxShadow: '0 1px 1px rgba(0,0,0,0.03)'
                            }}>
                              {formatDateHeader(msg.dateEnvoi)}
                            </span>
                          </div>
                        )}

                        {/* Conversation a propos d'un produit - banniere au
                            tout debut de l'echange, dans le meme esprit que
                            la banniere de date ci-dessus */}
                        {productContext && (
                          <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            margin: '0 0 6px 0'
                          }}>
                            <span style={{
                              backgroundColor: 'rgba(31, 107, 77, 0.1)',
                              color: '#1f6b4d',
                              padding: '5px 14px',
                              borderRadius: '20px',
                              fontSize: '11px',
                              fontWeight: '700',
                              textAlign: 'center',
                              maxWidth: '80%'
                            }}>
                              💬 {t('messagerie.aboutProduct')} {productContext}
                            </span>
                          </div>
                        )}

                        {/* Message Bubble Container */}
                        <div
                          className="animate-slide-in"
                          style={{
                            display: 'flex',
                            justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                            position: 'relative'
                          }}
                        >
                          <div style={{
                            maxWidth: '70%',
                            backgroundColor: isMyMessage ? '#1f6b4d' : '#ffffff',
                            color: isMyMessage ? '#ffffff' : 'var(--text-main)',
                            borderRadius: isMyMessage ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            padding: '8px 12px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                            position: 'relative'
                          }}>
                            {/* Tap / Click Actions Vertical Menu Button - masque
                                pour un message deja supprime : rien a
                                repondre/copier/supprimer dessus. */}
                            {!msg.estSupprime && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              right: isMyMessage ? 'auto' : '-28px',
                              left: isMyMessage ? '-28px' : 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 100
                            }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <MoreVertical size={14} />
                              </button>

                              {activeMessageMenuId === msg.id && (
                                <div style={{
                                  position: 'absolute',
                                  bottom: '24px',
                                  right: isMyMessage ? '0' : 'auto',
                                  left: !isMyMessage ? '0' : 'auto',
                                  backgroundColor: 'var(--bg-card)',
                                  border: '1px solid #e9ecef',
                                  borderRadius: 'var(--radius-md)',
                                  boxShadow: 'var(--shadow-md)',
                                  padding: '4px 0',
                                  zIndex: 1000,
                                  minWidth: '110px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  animation: 'fadeIn 0.15s ease-out'
                                }}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyTo(msg);
                                      setActiveMessageMenuId(null);
                                    }}
                                    style={{
                                      padding: '8px 12px',
                                      backgroundColor: 'transparent',
                                      border: 'none',
                                      color: 'var(--text-main)',
                                      fontSize: '12px',
                                      fontWeight: '600',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      textAlign: 'left',
                                      width: '100%'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-neutral-light)'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  >
                                    <CornerUpLeft size={12} style={{ color: 'var(--primary-color)' }} />
                                    <span>{t('messagerie.reply')}</span>
                                  </button>
                                  {msg.contenu && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleCopyToClipboard(msg.contenu);
                                        setActiveMessageMenuId(null);
                                      }}
                                      style={{
                                        padding: '8px 12px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: 'var(--text-main)',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textAlign: 'left',
                                        width: '100%'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-neutral-light)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <Copy size={12} style={{ color: 'var(--primary-color)' }} />
                                      <span>{t('messagerie.copy')}</span>
                                    </button>
                                  )}
                                  {isMyMessage && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleDeleteMessage(msg.id);
                                        setActiveMessageMenuId(null);
                                      }}
                                      style={{
                                        padding: '8px 12px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        color: 'var(--status-cancelled)',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textAlign: 'left',
                                        width: '100%'
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--status-cancelled-bg)'}
                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                      <Trash2 size={12} style={{ color: 'var(--status-cancelled)' }} />
                                      <span>{t('messagerie.delete')}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            )}

                            {/* Reply Quote Banner nested in bubble */}
                            {!msg.estSupprime && replyTextContext && (
                              <div style={{
                                backgroundColor: isMyMessage ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)',
                                padding: '6px 10px',
                                borderLeft: '3px solid #1f6b4d',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '11px',
                                marginBottom: '6px',
                                fontStyle: 'italic',
                                opacity: 0.9,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {replyTextContext}
                              </div>
                            )}

                            {/* Attached Image inside bubble (champ dedie imageData) */}
                            {!msg.estSupprime && msg.imageData && (
                              <div style={{ marginBottom: '6px', borderRadius: '8px', overflow: 'hidden' }}>
                                <img
                                  src={msg.imageData}
                                  alt=""
                                  referrerPolicy="no-referrer"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '240px',
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                />
                              </div>
                            )}

                            {/* Message supprime - espace reserve, comme sur WhatsApp,
                                a la place du contenu original (deja efface cote
                                backend et jamais renvoye une fois estSupprime actif). */}
                            {msg.estSupprime ? (
                              <p style={{
                                fontSize: '13px',
                                fontStyle: 'italic',
                                opacity: 0.7,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                lineHeight: '1.4'
                              }}>
                                {t('messagerie.deletedMessage')}
                              </p>
                            ) : cleanContent && (
                              <p style={{
                                fontSize: '13px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                lineHeight: '1.4'
                              }}>
                                {cleanContent}
                              </p>
                            )}

                            {/* Time and Receipts footer inside bubble */}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '4px',
                              marginTop: '4px',
                              fontSize: '10px',
                              opacity: 0.7,
                              color: isMyMessage ? '#e2f0e9' : 'var(--text-muted)',
                              textAlign: 'right'
                            }}>
                              <span>{formatTime(msg.dateEnvoi)}</span>

                              {isMyMessage && (
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                  {msg.estLu ? (
                                    <CheckCheck size={13} style={{ color: '#8f9e95' }} />
                                  ) : msg.estDelivre ? (
                                    <CheckCheck size={13} style={{ color: '#cbd5e1' }} />
                                  ) : (
                                    <Check size={13} style={{ color: '#cbd5e1' }} />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>

              {/* Floating bottom-anchor scroll action button */}
              {showScrollBottom && (
                <button
                  onClick={() => scrollToBottom('smooth')}
                  style={{
                    position: 'absolute',
                    bottom: '80px',
                    right: '24px',
                    backgroundColor: '#ffffff',
                    color: '#1f6b4d',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid #e9ecef',
                    cursor: 'pointer',
                    zIndex: 20
                  }}
                >
                  <ArrowDown size={18} />
                </button>
              )}

              {/* Advanced reply modifier preview banner */}
              {replyTo && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #e9ecef',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ borderLeft: '3px solid #1f6b4d', paddingLeft: '10px', minWidth: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: '#1f6b4d' }}>
                      {replyTo.expediteurId === currentUserId ? t('messagerie.replyToSelf') : t('messagerie.replyToUser')}
                    </span>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {replyTo.estSupprime
                        ? t('messagerie.deletedMessage')
                        : (replyTo.contenu ? nettoyerApercu(replyTo.contenu) : t('messagerie.imagePreview'))}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Advanced base64 image attaching preview banner */}
              {attachedImageBase64 && (
                <div style={{
                  backgroundColor: '#ffffff',
                  borderTop: '1px solid #e9ecef',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
                    <img
                      src={attachedImageBase64}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      onClick={() => setAttachedImageBase64(null)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: 'none'
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#1f6b4d' }}>{t('messagerie.attachedImage')}</span>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('messagerie.attachedImageHint')}</p>
                  </div>
                </div>
              )}

              {/* Chat Input Bar Form */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '12px 16px',
                  backgroundColor: '#f0f2f5',
                  borderTop: '1px solid #e9ecef',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '12px',
                  zIndex: 10
                }}
              >
                {/* Hidden input file connector */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />

                {/* Attach File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '8px',
                    borderRadius: '50%',
                    color: '#1f6b4d',
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(31,107,77,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <ImageIcon size={20} />
                </button>

                {/* Auto expanding text input field */}
                <textarea
                  ref={textInputRef}
                  rows={1}
                  placeholder={t('messagerie.inputPlaceholder')}
                  value={inputText}
                  onInput={handleTextareaInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    backgroundColor: '#ffffff',
                    outline: 'none',
                    resize: 'none',
                    maxHeight: '120px',
                    lineHeight: '1.4'
                  }}
                />

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={sending || (!inputText.trim() && !attachedImageBase64)}
                  style={{
                    backgroundColor: '#1f6b4d',
                    color: 'white',
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: 'none',
                    opacity: (sending || (!inputText.trim() && !attachedImageBase64)) ? 0.6 : 1,
                    boxShadow: '0 2px 4px rgba(31,107,77,0.2)'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Partner Profile Detail Modal */}
      {showProfileModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(15,23,42,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div className="animate-fade-in" style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '400px',
            padding: '24px',
            border: '1px solid #e9ecef',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--primary-color)', margin: 0 }}>{t('messagerie.profileTitle')}</h3>
              <button onClick={() => { setShowProfileModal(false); setPartnerProfile(null); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {loadingProfile ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div className="shimmer" style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px auto' }}></div>
                <div className="shimmer" style={{ width: '120px', height: '14px', borderRadius: '4px', margin: '0 auto' }}></div>
              </div>
            ) : partnerProfile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '8px 0' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-glow)',
                  color: 'var(--primary-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: '700',
                  border: '2px solid var(--primary-color)'
                }}>
                  {partnerProfile.nom ? partnerProfile.nom.charAt(0).toUpperCase() : '?'}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 4px 0' }}>{partnerProfile.nom}</h4>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: 'var(--primary-color)',
                    backgroundColor: 'var(--primary-glow)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    textTransform: 'uppercase'
                  }}>
                    {ROLE_LABELS[partnerProfile.role] || partnerProfile.role}
                  </span>
                </div>

                <div style={{ width: '100%', borderTop: '1px solid #e9ecef', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{t('messagerie.profileId')}</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '700' }}>{partnerProfile.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{t('messagerie.profileEmail')}</span>
                    <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{partnerProfile.email}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>{t('messagerie.profileUnavailable')}</p>
            )}
          </div>
        </div>
      )}

      {/* Embedded CSS rules for hover elements and responsiveness */}
      <style>{`
        /* Hover triggers for actions in message bubble */
        .animate-slide-in:hover .bubble-actions {
          opacity: 1 !important;
        }

        /* Mobile adaptation */
        @media (max-width: 768px) {
          .mobile-back-btn {
            display: block !important;
          }
          .mobile-convo-pane {
            display: ${activePane === 'list' ? 'flex' : 'none'} !important;
            width: 100% !important;
          }
          .mobile-chat-pane {
            display: ${activePane === 'chat' ? 'flex' : 'none'} !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
