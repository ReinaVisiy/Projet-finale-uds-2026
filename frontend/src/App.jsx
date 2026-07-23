// src/App.jsx
import { useState, useEffect, useRef } from 'react';
import NavigationConsole from './components/NavigationConsole';
import AgroMarketHome from './components/AgriconnectHome';
import AddProduct from './components/AddProduct';
import EditProduct from './components/EditProduct';
import VendeurOrders from './components/VendeurOrders';
import ClientOrders from './components/ClientOrders';
import ClientPurchases from './components/ClientPurchases';
import OrderManagementAdmin from './components/OrderManagementAdmin';
import PasswordRecovery from './components/PasswordRecovery';
import ConfirmEmailPage from './components/ConfirmEmailPage';
import ProductDetail from './components/ProductDetail';
import RegisterPage from './components/Registerpage';
import SalesHistory from './components/SalesHistory';
import SellerDashboard from './components/SellerDashboard';
import ShoppingCart from './components/ShoppingCart';
import StockAlerts from './components/StockAlerts';
import UserProfile from './components/UserProfile';
import CertificationRequest from './components/CertificationRequest';
import SignalementModal from './components/SignalementModal';
import LitigeModal from './components/LitigeModal';
import VendorVerificationAdmin from './components/VendorVerificationAdmin';
import ProducerProfile from './components/ProducerProfile';
import ClientProfile from './components/ClientProfile';
import UserSearchResults from './components/UserSearchResults';
import ProductCatalog from './components/ProductCatalog';
import AdminDashboard from './components/AdminDashboard';
import EditProfile from './components/EditProfile';
import FAQPage from './components/FAQPage';
import LoginPage from './components/LoginPage';
import Messagerie from './components/Messagerie';
import ModerationPanel from './components/ModerationPanel';
import MyProducts from './components/MyProducts';
import NotificationsCenter from './components/NotificationsCenter';
import OrderDetailAdmin from './components/OrderDetailAdmin';
import ChangePassword from './components/ChangePassword';
import PaymentReturn from './components/PaymentReturn';
import { authApi, utilisateurApi, produitApi, signalementApi, commandeApi, paiementApi, messageApi, certificationApi, notificationApi, litigeApi, getSession } from './services/api';
import { ROLE_FRONTEND_TO_BACKEND, joinNomComplet, splitNomComplet, mapProfileToFrontendUser } from './services/userMapping';
import { mapCertificationPourAdmin } from './services/certificationMapping';
import { mapProduitPourVendeur, construireProduitRequest } from './services/productMapping';
import { mapSignalementPourAffichage, construireRaison, TYPE_FRONTEND_TO_BACKEND } from './services/signalementMapping';
import { mapCommandePourAffichage, STATUT_FRANCAIS_TO_BACKEND } from './services/commandeMapping';
import { mapNotificationPourAffichage, construireNotificationRequest } from './services/notificationMapping';

export default function App() {
  // Détection du retour de paiement NotchPay (successUrl/cancelUrl construits
  // par paiement-service sur /pay/success ou /pay/cancel avec
  // ?transactionId=..., cf. PaiementService#initierPaiement). Le serveur de
  // dev Vite (et la config de déploiement SPA) redirige ces chemins vers
  // index.html, donc App.jsx doit lire l'URL lui-même au montage.
  const detecterEcranInitial = () => {
    if (typeof window === 'undefined') return 'home';
    const chemin = window.location.pathname;
    return (chemin === '/pay/success' || chemin === '/pay/cancel') ? 'payment-return' : 'home';
  };
  const lireTransactionIdDepuisUrl = () => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('transactionId');
  };

  const [screen, setScreen] = useState(detecterEcranInitial);
  const [paymentTransactionId] = useState(lireTransactionIdDepuisUrl);
  const [previousScreen, setPreviousScreen] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedProfileClient, setSelectedProfileClient] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Nettoie l'URL (chemin + query string) une fois le transactionId lu,
  // pour qu'un rafraîchissement de page ne rejoue pas l'écran de retour.
  useEffect(() => {
    if (screen === 'payment-return' && typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // La langue est désormais gérée globalement par react-i18next (voir
  // src/i18n) — plus besoin d'état local ici ; chaque écran lit la langue
  // directement via useTranslation().

  // ===== UTILISATEUR CONNECTÉ =====
  const [currentUser, setCurrentUser] = useState(null);
  // Plan d'abonnement du vendeur. setActivePlan est appele au login/inscription
  // mais aucun ecran n'affiche encore activePlan (fonctionnalite a construire).
  // eslint-disable-next-line no-unused-vars
  const [activePlan, setActivePlan] = useState('gratuit');

  // ===== COMPTES INSCRITS =====
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Email en attente de confirmation apres inscription (ou apres une
  // tentative de connexion sur un compte non confirme) : alimente
  // ConfirmEmailPage. Vide quand aucune confirmation n'est en cours.
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState('');

  // ===== NOTIFICATIONS =====
  // Depuis l'ajout de notification-service côté backend, les
  // notifications sont persistées et scopées par utilisateur (via le
  // JWT), et ne vivent plus uniquement dans le localStorage du
  // navigateur (qui mélangeait auparavant les notifications de tous
  // les comptes utilisés sur le même appareil).
  const [notifications, setNotifications] = useState([]);
  const addNotification = (userId, type, message, lien = null) => {
    // Mise à jour optimiste : uniquement si la notification concerne
    // l'utilisateur actuellement connecté sur CE navigateur. Avant ce
    // correctif, setNotifications() s'exécutait pour TOUT appel, même
    // quand userId visait un tiers (le vendeur d'une commande, les
    // admins d'un signalement...) : le client qui déclenchait l'action
    // voyait alors apparaître, dans sa propre cloche, une notification
    // qui ne lui était pas destinée.
    if (userId === currentUser?.id) {
      const newNotif = {
        id: `notif-${Date.now()}`,
        utilisateurId: userId,
        type: type,
        message,
        lien,
        lu: false,
        dateCreation: new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    // Envoi réel au backend. On avale volontairement l'erreur : une
    // notification qui échoue à se créer ne doit jamais faire échouer
    // l'action métier qui l'a déclenchée (commande, paiement,
    // inscription, etc.). On RENVOIE toutefois la promesse : certains
    // appelants (ex. handleCheckout, qui enchaîne avec une redirection
    // window.location.href) doivent pouvoir l'attendre pour éviter que
    // la navigation n'annule la requête réseau avant son envoi.
    //
    // Note : on vérifie la session JWT via getSession() plutôt que la
    // variable currentUser du closure, car addNotification est parfois
    // appelée juste après setCurrentUser(...) (ex. handleLoginSuccess,
    // handleRegisterSuccess) — à cet instant currentUser n'a pas encore
    // été mis à jour (setState est asynchrone), alors que le token JWT,
    // lui, a déjà été sauvegardé de façon synchrone par authApi.login.
    if (!getSession()) return Promise.resolve(); // pas de JWT disponible avant connexion
    // On transmet directement "type" (la sévérité UI choisie par
    // l'appelant : info/success/warning/error) au backend en tant que
    // "niveau" — plus besoin de la redeviner au chargement, puisque
    // notification-service la stocke désormais telle quelle.
    return notificationApi
      .creerNotification(construireNotificationRequest(userId, message, lien, type))
      .catch((err) => console.error('Notification non persistée côté serveur :', err));
  };

  // ===== IDENTIFIANTS ADMIN RÉELS =====
  // Remplace le précédent broadcast codé en dur vers userId=1 : on
  // récupère les vrais comptes ADMIN auprès de utilisateur-service
  // (GET /api/utilisateurs est public, donc accessible même avant
  // connexion) et on notifie chacun d'eux individuellement.
  const [adminIds, setAdminIds] = useState([]);
  useEffect(() => {
    utilisateurApi
      .getAllUtilisateurs()
      .then((tous) => {
        const ids = (tous || [])
          .filter((u) => u.role === 'ADMIN')
          .map((u) => u.id);
        setAdminIds(ids);
      })
      .catch((err) => console.error("Impossible de récupérer la liste des comptes admin :", err));
  }, []);

  const notifierAdmins = (type, message, lien = null) => {
    if (adminIds.length === 0) {
      // Repli si la liste n'a pas encore été chargée (ex. tout début du
      // chargement de l'app) : on garde l'ancien comportement plutôt que
      // de perdre silencieusement la notification.
      addNotification(1, type, message, lien);
      return;
    }
    adminIds.forEach((id) => addNotification(id, type, message, lien));
  };

  const chargerMesNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const dtos = await notificationApi.getMesNotifications();
      setNotifications((dtos || []).map(mapNotificationPourAffichage));
    } catch (err) {
      console.error('Impossible de charger vos notifications :', err);
    }
  };

  // ===== MESSAGES NON LUS =====
  // Compteur affiché en badge sur "Mes messages", à côté de la cloche de
  // notifications. Rechargé au changement d'utilisateur, puis toutes les
  // 30s tant qu'un utilisateur est connecté (pas de websocket disponible).
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const chargerMessagesNonLus = async () => {
    if (!currentUser?.id) return;
    try {
      const count = await messageApi.compterNonLus();
      setUnreadMessagesCount(count || 0);
    } catch (err) {
      console.error('Impossible de charger le nombre de messages non lus :', err);
    }
  };

  // ===== COMPTE ADMIN =====
  // NOTE : il n'y a plus de compte admin codé en dur ici. La connexion admin
  // passe désormais par le vrai backend (auth-service). Un compte avec le
  // rôle ADMIN doit exister dans la base de utilisateur-service (créé via
  // POST /api/utilisateurs/admin/creer par un autre admin, ou directement
  // en base pour le tout premier compte).

  // ===== AUTRES ÉTATS =====
  const [showSignalement, setShowSignalement] = useState(false);
  const [signalementTarget, setSignalementTarget] = useState(null);
  const [signalementTargetType, setSignalementTargetType] = useState('produit'); // 'produit' | 'utilisateur'
  const [signalementCibleLabel, setSignalementCibleLabel] = useState('');
  const [showLitige, setShowLitige] = useState(false);
  const [litigeOrder, setLitigeOrder] = useState(null);
  const [mesLitiges, setMesLitiges] = useState([]);
  const [vendeurProducts, setVendeurProducts] = useState([]);
  const [vendorVerifications, setVendorVerifications] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [authRedirectMessage, setAuthRedirectMessage] = useState('');
  const [signalements, setSignalements] = useState([]);
  // Vraies commandes issues de commande-service : mesCommandes pour le
  // client, toutesLesCommandes pour l'admin/le vendeur (AdminDashboard,
  // OrderManagementAdmin, SellerDashboard, VendeurOrders).
  const [mesCommandes, setMesCommandes] = useState([]);
  const [toutesLesCommandes, setToutesLesCommandes] = useState([]);
  // Commandes du vendeur connecté uniquement (endpoint /api/commandes/vendeur/{id}) —
  // à ne pas confondre avec toutesLesCommandes, réservé aux écrans admin :
  // getAllCommandes() renvoie les commandes de TOUS les vendeurs, ce que
  // SellerDashboard/VendeurOrders ne doivent pas recevoir.
  const [mesCommandesVendeur, setMesCommandesVendeur] = useState([]);
  // Vue admin uniquement : transactions de paiement (revenu plateforme,
  // section 4 du cahier des charges) et litiges (module Litige, section 3).
  const [toutesLesTransactions, setToutesLesTransactions] = useState([]);
  const [tousLesLitiges, setTousLesLitiges] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isClientMode, setIsClientMode] = useState(false);

  // ===== PANIER : clé de stockage propre à l'utilisateur =====
  // Avant, le panier était stocké sous une clé unique 'cartItems' pour
  // tout le monde : à la déconnexion, currentUser passait à null mais le
  // panier restait affiché tel quel en mémoire, puis à la prochaine
  // connexion (potentiellement un AUTRE utilisateur sur le même
  // navigateur) c'est ce même panier partagé qui réapparaissait — jamais
  // le panier propre à l'utilisateur qui vient de se reconnecter. On
  // scinde donc le panier par utilisateur (clé 'cartItems_<id>'), avec
  // une clé 'cartItems_invite' pour les visiteurs non connectés, afin que
  // chaque utilisateur retrouve bien SON panier après une déconnexion.
  const getCartStorageKey = (user) => (user ? `cartItems_${user.id}` : 'cartItems_invite');
  const cartKeyRef = useRef(getCartStorageKey(null));

  // ===== CHARGEMENT DEPUIS localStorage =====
  useEffect(() => {
    const savedCart = localStorage.getItem(cartKeyRef.current);
    if (savedCart) { try { setCartItems(JSON.parse(savedCart)); } catch { /* panier corrompu dans localStorage, on ignore */ } }
    const savedClientMode = localStorage.getItem('isClientMode');
    if (savedClientMode) { setIsClientMode(JSON.parse(savedClientMode)); }

    // Restaurer la session utilisateur à partir du token JWT stocké,
    // en revérifiant le profil auprès du backend (utilisateur-service)
    // plutôt que de faire confiance à une copie locale potentiellement
    // périmée.
    const session = getSession();
    if (session) {
      utilisateurApi
        .getUtilisateurById(session.uid)
        .then((profile) => {
          setCurrentUser(mapProfileToFrontendUser(profile, session.roles));
        })
        .catch(() => {
          // Token invalide/expiré ou utilisateur supprimé : on nettoie la session.
          authApi.logout();
        });
    }
  }, []);

  // ===== PANIER : bascule de panier à la connexion/déconnexion =====
  // Dès que l'utilisateur connecté change (connexion, déconnexion ou
  // restauration de session au chargement), on sauvegarde d'abord le
  // panier courant sous son ancienne clé (pour ne pas perdre les articles
  // ajoutés en tant qu'invité), puis on recharge le panier propre au
  // nouvel utilisateur (ou le panier invité après une déconnexion).
  useEffect(() => {
    const newKey = getCartStorageKey(currentUser);
    if (newKey === cartKeyRef.current) return;
    localStorage.setItem(cartKeyRef.current, JSON.stringify(cartItems));
    cartKeyRef.current = newKey;
    const savedCart = localStorage.getItem(newKey);
    try { setCartItems(savedCart ? JSON.parse(savedCart) : []); } catch { setCartItems([]); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // ===== SAUVEGARDE =====
  useEffect(() => { localStorage.setItem(cartKeyRef.current, JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem('isClientMode', JSON.stringify(isClientMode)); }, [isClientMode]);

  // ===== PRODUITS DU VENDEUR CONNECTÉ =====
  // Remplace l'ancien stockage local : on va chercher les vrais produits
  // du vendeur auprès de produit-service dès qu'un vendeur est connecté.
  const refreshVendeurProducts = async () => {
    if (!currentUser || currentUser.role !== 'vendeur') return;
    try {
      const data = await produitApi.getMesProduits();
      setVendeurProducts((data || []).map(mapProduitPourVendeur));
    } catch (err) {
      console.error('Impossible de charger vos produits :', err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'vendeur') {
      refreshVendeurProducts();
    } else {
      setVendeurProducts([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  // ===== SIGNALEMENTS (modération admin) =====
  // Remplace l'ancien stockage local : on va chercher les vrais
  // signalements auprès de signalement-service, puis on résout le nom
  // affichable de la cible (produit ou utilisateur) et de l'auteur,
  // car le backend ne stocke que des IDs.
  const chargerSignalements = async () => {
    try {
      const dtos = await signalementApi.getAllSignalements();
      const enrichis = await Promise.all(
        (dtos || []).map(async (dto) => {
          let cibleNom;
          let targetOwnerId;
          try {
            if (dto.type === 'PRODUIT') {
              const produit = await produitApi.getProduitById(dto.targetId);
              cibleNom = produit?.nom;
              targetOwnerId = produit?.producteurId; // vendeur à suspendre si besoin
            } else {
              const utilisateur = await utilisateurApi.getUtilisateurById(dto.targetId);
              cibleNom = utilisateur?.nom;
            }
          } catch {
            cibleNom = undefined; // cible supprimée entretemps : on garde l'ID en repli
          }
          let auteurNom;
          try {
            const reporter = await utilisateurApi.getUtilisateurById(dto.reporterId);
            auteurNom = reporter?.nom;
          } catch {
            auteurNom = undefined;
          }
          return mapSignalementPourAffichage(dto, cibleNom, auteurNom, targetOwnerId);
        })
      );
      setSignalements(enrichis);
    } catch (err) {
      console.error('Impossible de charger les signalements :', err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      chargerSignalements();
      chargerUtilisateurs();
      chargerCertifications();
    }
  }, [currentUser?.id, currentUser?.role]);

  // ===== UTILISATEURS (liste admin) =====
  // Remplace l'ancien stockage local/localStorage : liste réelle depuis
  // utilisateur-service pour le dashboard admin (comptage, blocage...).
  const chargerUtilisateurs = async () => {
    try {
      const dtos = await utilisateurApi.getAllUtilisateurs();
      setRegisteredUsers((dtos || []).map((dto) => mapProfileToFrontendUser(dto, [dto.role])));
    } catch (err) {
      console.error('Impossible de charger les utilisateurs :', err);
    }
  };

  // ===== CERTIFICATIONS (vérification vendeurs, admin) =====
  // Vraies demandes depuis certification-service, avec le nom/email/
  // téléphone du producteur résolus via utilisateur-service
  // (certification-service ne connaît que producteurId).
  // On récupère TOUTES les certifications (pas seulement celles en
  // attente) : sinon, dès qu'une certification était approuvée ou
  // rejetée, elle disparaissait purement et simplement du tableau de
  // bord admin, alors que les onglets "Approuvées"/"Rejetées" sont
  // censés continuer à l'afficher.
  const chargerCertifications = async () => {
    try {
      const dtos = await certificationApi.getToutesCertifications();
      const enrichies = await Promise.all(
        (dtos || []).map(async (dto) => {
          let producteurInfo = {};
          try {
            const producteur = await utilisateurApi.getUtilisateurById(dto.producteurId);
            const { prenom, nom } = splitNomComplet(producteur?.nom);
            producteurInfo = { prenom, nom, email: producteur?.email, telephone: producteur?.telephone, adresse: producteur?.adresse };
          } catch {
            // producteur introuvable : mapCertificationPourAdmin retombe sur des valeurs par défaut
          }
          return mapCertificationPourAdmin(dto, producteurInfo);
        })
      );
      setVendorVerifications(enrichies);
    } catch (err) {
      console.error('Impossible de charger les certifications :', err);
    }
  };

  // ===== COMMANDES (commande-service) =====
  // commande-service ne renvoie que des IDs (produitId, clientId) : on
  // résout les noms de produits (et, pour le vendeur, les noms de clients)
  // avant de transmettre aux écrans, qui attendent déjà ce format enrichi
  // (voir commandeMapping.js).
  const resoudreNomsProduits = async (commandes) => {
    const idsUniques = [...new Set(
      commandes.flatMap((c) => (c.lignesCommande || []).map((lc) => lc.produitId))
    )];
    const noms = new Map();
    await Promise.all(idsUniques.map(async (id) => {
      try {
        const produit = await produitApi.getProduitById(id);
        noms.set(id, produit?.nom);
      } catch {
        // produit supprimé entretemps : on gardera le repli "Produit #id"
      }
    }));
    return noms;
  };

  const chargerMesCommandes = async () => {
    if (!currentUser?.id) return;
    try {
      const dtos = await commandeApi.getCommandesByClientId(currentUser.id);
      const noms = await resoudreNomsProduits(dtos || []);
      const nomClient = joinNomComplet(currentUser.prenom, currentUser.nom);
      const commandesMappees = (dtos || []).map((dto) => mapCommandePourAffichage(dto, nomClient, currentUser.email, noms));
      setMesCommandes(await enrichirAvecStatutPaiement(commandesMappees));
    } catch (err) {
      console.error('Impossible de charger vos commandes :', err);
    }
  };

  // Litiges ouverts par le client connecté (module Litige) — pilote le
  // bouton "Ouvrir un litige" / badge de statut sur "Mes commandes".
  const chargerMesLitiges = async () => {
    if (!currentUser?.id) return;
    try {
      const dtos = await litigeApi.getMesLitiges();
      setMesLitiges(dtos || []);
    } catch (err) {
      console.error('Impossible de charger vos litiges :', err);
    }
  };

  // Interroge paiement-service pour savoir si une commande a été payée
  // (transaction.statut === PAYE). Utilisé pour afficher un badge "Payée"
  // côté admin, vendeur et client.
  const enrichirAvecStatutPaiement = async (commandes) => {
    return Promise.all((commandes || []).map(async (commande) => {
      try {
        const statut = await paiementApi.getStatutReference('COMMANDE', commande.id);
        return { ...commande, paye: !!statut?.paye };
      } catch {
        // Pas de transaction trouvée ou service indisponible : on
        // considère la commande comme non payée plutôt que de bloquer
        // l'affichage de la liste.
        return { ...commande, paye: false };
      }
    }));
  };

  const chargerToutesLesCommandes = async () => {
    try {
      const dtos = await commandeApi.getAllCommandes();
      const noms = await resoudreNomsProduits(dtos || []);
      const idsClientsUniques = [...new Set((dtos || []).map((c) => c.clientId))];
      const clients = new Map();
      await Promise.all(idsClientsUniques.map(async (id) => {
        try {
          const utilisateur = await utilisateurApi.getUtilisateurById(id);
          clients.set(id, utilisateur);
        } catch {
          // client supprimé entretemps : on gardera le repli "Client #id"
        }
      }));
      const commandesMappees = (dtos || []).map((dto) => {
        const client = clients.get(dto.clientId);
        return mapCommandePourAffichage(dto, client?.nom, client?.email, noms);
      });
      setToutesLesCommandes(await enrichirAvecStatutPaiement(commandesMappees));
    } catch (err) {
      console.error('Impossible de charger les commandes :', err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'client') {
      chargerMesCommandes();
      chargerMesLitiges();
    } else {
      setMesCommandes([]);
      setMesLitiges([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  // Commandes du vendeur connecté uniquement, via l'endpoint scopé
  // /api/commandes/vendeur/{id} (plutôt que de filtrer côté client dans
  // la liste admin-wide, qui n'aurait de toute façon pas dû être envoyée
  // à un simple vendeur).
  const chargerCommandesVendeur = async () => {
    if (!currentUser?.id) return;
    try {
      const dtos = await commandeApi.getCommandesByProducteurId(currentUser.id);
      const noms = await resoudreNomsProduits(dtos || []);
      const idsClientsUniques = [...new Set((dtos || []).map((c) => c.clientId))];
      const clients = new Map();
      await Promise.all(idsClientsUniques.map(async (id) => {
        try {
          const utilisateur = await utilisateurApi.getUtilisateurById(id);
          clients.set(id, utilisateur);
        } catch {
          // client supprimé entretemps : on gardera le repli "Client #id"
        }
      }));
      const commandesMappees = (dtos || []).map((dto) => {
        const client = clients.get(dto.clientId);
        return mapCommandePourAffichage(dto, client?.nom, client?.email, noms);
      });
      setMesCommandesVendeur(await enrichirAvecStatutPaiement(commandesMappees));
    } catch (err) {
      console.error('Impossible de charger vos commandes reçues :', err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      chargerToutesLesCommandes();
    } else {
      setToutesLesCommandes([]);
    }
    if (currentUser?.role === 'vendeur') {
      chargerCommandesVendeur();
    } else {
      setMesCommandesVendeur([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, currentUser?.role]);

  // Revenu plateforme (5% de commission + frais de 10% retenus a
  // l'annulation) : liste brute des transactions, agregee cote
  // AdminDashboard plutot qu'ici (les deux totaux y sont affiches
  // separement dans le detail de la carte KPI).
  const chargerToutesLesTransactions = async () => {
    try {
      const transactions = await paiementApi.getToutesTransactionsAdmin();
      setToutesLesTransactions(transactions || []);
    } catch (err) {
      console.error('Impossible de charger les transactions :', err);
    }
  };

  // Litiges (module Litige, etape 8) : commande-service ne connait que
  // clientId, donc on resout le nom du client comme pour les autres
  // listes admin. Le flag fondsDejaRetires est deja calcule cote
  // backend (LitigeResponse) et pilote le bouton de remboursement.
  const chargerTousLesLitiges = async () => {
    try {
      const dtos = await litigeApi.getTousLesLitiges();
      const idsClientsUniques = [...new Set((dtos || []).map((l) => l.clientId))];
      const clients = new Map();
      await Promise.all(idsClientsUniques.map(async (id) => {
        try {
          const utilisateur = await utilisateurApi.getUtilisateurById(id);
          clients.set(id, utilisateur);
        } catch {
          // client supprimé entretemps : on gardera le repli "Client #id"
        }
      }));
      setTousLesLitiges((dtos || []).map((dto) => ({
        ...dto,
        clientNom: clients.get(dto.clientId)?.nom || `Client #${dto.clientId}`,
      })));
    } catch (err) {
      console.error('Impossible de charger les litiges :', err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      chargerToutesLesTransactions();
      chargerTousLesLitiges();
    } else {
      setToutesLesTransactions([]);
      setTousLesLitiges([]);
    }
  }, [currentUser?.id, currentUser?.role]);

  // Rembourse en un clic un litige "Produit non livré" (refuse par le
  // backend, avec message explicite, si les fonds ont deja ete
  // liberes vers le solde disponible du vendeur).
  const handleRembourserLitige = async (litigeId) => {
    try {
      await litigeApi.rembourserLitige(litigeId);
      await chargerTousLesLitiges();
    } catch (err) {
      alert(err?.message || "Le remboursement du litige a échoué.");
    }
  };

  // Resolution manuelle (types autres que "Produit non livré", ou
  // rejet d'un litige non fonde) : aucun mouvement financier automatique.
  const handleResoudreLitige = async (litigeId, statut) => {
    try {
      await litigeApi.resoudreLitige(litigeId, statut);
      await chargerTousLesLitiges();
    } catch (err) {
      alert(err?.message || "La résolution du litige a échoué.");
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      chargerMesNotifications();
      chargerMessagesNonLus();
      const interval = setInterval(() => {
        chargerMesNotifications();
        chargerMessagesNonLus();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadMessagesCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // ===== GARDE AUTH =====
  const requireLogin = (action) => {
    if (currentUser) action();
    else {
      setAuthRedirectMessage('Connectez-vous ou créez un compte pour continuer.');
      setScreen('login-page');
    }
  };

  // ===== ACTIONS =====
  const addToCart = (product, quantity = 1) => {
    requireLogin(() => {
      if (currentUser.role !== 'client' && !isClientMode) {
        alert('Seuls les clients peuvent ajouter des produits au panier.');
        return;
      }
      setCartItems(prev => {
        const existing = prev.find(i => i.id === product.id);
        if (existing) {
          return prev.map(i => i.id === product.id
            ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.price }
            : i
          );
        }
        return [...prev, {
          id: product.id,
          name: product.name,
          farm: product.farm || 'Producteur local',
          producteurId: product.producteurId,
          price: product.price,
          image: product.image,
          quantity,
          total: product.price * quantity,
        }];
      });
      setScreen('cart');
    });
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(i => i.id !== id));

  const updateCartItemQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, quantity: newQuantity, total: item.price * newQuantity } : item
      )
    );
  };

  // ===== VALIDATION DE COMMANDE (commande-service + paiement-service) =====
  // Le panier est scindé par vendeur (ShoppingCart.jsx affiche un bouton
  // de paiement indépendant par groupe) : une Commande côté backend ne
  // peut plus contenir des produits que d'un seul producteur. On crée
  // donc ici une Commande + une Transaction NotchPay pour le seul groupe
  // concerné, puis on redirige directement vers NotchPay — sans demander de
  // numéro de téléphone sur AgriCam au préalable.
  const handleCheckout = async (vendeurId) => {
    const itemsDuGroupe = cartItems.filter(item => item.producteurId === vendeurId);
    if (itemsDuGroupe.length === 0) {
      throw new Error("Ce groupe de panier est introuvable.");
    }

    const lignesCommande = itemsDuGroupe.map(item => ({
      produitId: item.id,
      quantite: item.quantity,
      prixUnitaire: item.price,
    }));
    const commande = await commandeApi.createCommande({
      clientId: currentUser.id,
      lignesCommande,
    });

    // Notifie le vendeur dès la création de la commande (et non après la
    // redirection NotchPay ci-dessous, qui quitte la page immédiatement
    // via window.location.href et rendait ce code plus bas inatteignable
    // en pratique — cf. groupe H, point 19). On ATTEND la requête réseau
    // ici (await) : sans ça, window.location.href plus bas déclenche la
    // navigation avant que le navigateur n'ait eu le temps d'envoyer la
    // requête POST /api/notifications, qui se retrouvait annulée — le
    // vendeur ne recevait alors jamais cette notification.
    await addNotification(vendeurId, 'info', `Nouvelle commande #${commande.id} de ${joinNomComplet(currentUser?.prenom, currentUser?.nom) || 'Client'}`, '/vendeur-orders');

    const transaction = await paiementApi.initierPaiement({
      typeReference: 'COMMANDE',
      referenceId: commande.id,
      vendeurId,
      montant: commande.montantTotal,
    });

    // Seuls les articles de ce vendeur quittent le panier ; les autres
    // groupes restent disponibles pour un paiement séparé.
    setCartItems(prev => prev.filter(item => item.producteurId !== vendeurId));

    if (transaction?.notchpayCheckoutUrl) {
      // Redirection vers la page de paiement NotchPay : le client revient
      // ensuite sur /pay/success ou /pay/cancel (cf. PaymentReturn).
      window.location.href = transaction.notchpayCheckoutUrl;
      return;
    }

    addNotification(currentUser.id, 'success', `Commande #${commande.id} confirmée !`, '/orders');
    await chargerMesCommandes();
    navigate('orders');
  };

  // Bouton "Payer" dans "Mes commandes" : la commande existe déjà (créée
  // par handleCheckout) mais n'a pas de transaction PAYE — soit le client
  // a fermé l'onglet NotchPay, soit un paiement précédent a échoué. On
  // réutilise initierPaiement avec la même referenceId (commande.id) : le
  // backend réutilise la MÊME ligne Transaction existante (nouvelle session
  // NotchPay dessus, référence unique via suffixe aléatoire, cf.
  // PaiementService) au lieu d'en créer une nouvelle à chaque tentative.
  const handlePayerCommandeExistante = async (order) => {
    const transaction = await paiementApi.initierPaiement({
      typeReference: 'COMMANDE',
      referenceId: order.id,
      vendeurId: order.producteurId,
      montant: order.amount,
    });

    if (transaction?.notchpayCheckoutUrl) {
      window.location.href = transaction.notchpayCheckoutUrl;
    }
  };

  const openSignalement = (target, targetType = 'produit', cibleLabel = '') => {
    requireLogin(() => {
      setSignalementTarget(target);
      setSignalementTargetType(targetType);
      setSignalementCibleLabel(cibleLabel);
      setShowSignalement(true);
    });
  };

  const openLitige = (order) => {
    requireLogin(() => {
      setLitigeOrder(order);
      setShowLitige(true);
    });
  };

  const handleCreerLitige = async ({ type, description }) => {
    try {
      await litigeApi.creerLitige({
        commandeId: litigeOrder.id,
        type,
        description,
      });
      notifierAdmins('error', `Nouveau litige ouvert sur la commande #${litigeOrder.id} par ${currentUser?.prenom || 'un client'}`, '/admin/moderation-panel');
      await chargerMesLitiges();
      if (currentUser?.role === 'admin') await chargerTousLesLitiges();
    } catch (err) {
      alert(err?.message || "L'ouverture du litige a échoué.");
    }
  };

  // ===== CONNEXION =====
  // Appelle le vrai backend (auth-service + utilisateur-service).
  // Retourne l'utilisateur (au format frontend) en cas de succès,
  // ou lève une erreur avec un message lisible en cas d'échec.
  const validateLogin = async (email, password, uiRole) => {
    const authResponse = await authApi.login(email, password);
    const expectedBackendRole = ROLE_FRONTEND_TO_BACKEND[uiRole];

    // Un admin n'a ni le rôle CLIENT ni PRODUCTEUR : il n'existe pas de
    // bouton "admin" sur l'écran de connexion (il n'y a que
    // client/vendeur), donc on le laisse passer quel que soit le toggle
    // sélectionné. Son rôle réel (ADMIN) est de toute façon déterminé
    // juste après par mapProfileToFrontendUser à partir du profil
    // backend, pas par uiRole : le bypass ici ne fait qu'éviter un rejet
    // à tort, il ne donne pas les droits admin à quelqu'un qui ne les a
    // pas déjà.
    const estAdmin = authResponse.roles?.includes('ADMIN');

    if (!estAdmin && !authResponse.roles?.includes(expectedBackendRole)) {
      authApi.logout();
      throw new Error(`Aucun compte ${uiRole} trouvé avec ces identifiants.`);
    }

    const profile = await utilisateurApi.getUtilisateurById(authResponse.uid);
    return mapProfileToFrontendUser(profile, authResponse.roles);
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setAuthRedirectMessage('');
    if (userData.role === 'vendeur') {
      setActivePlan(userData.plan || 'gratuit');
    }
    // Ne notifie plus les admins à chaque connexion : ce n'est ni un
    // événement "plateforme" (contrairement à une inscription), ni une
    // activité de l'admin lui-même — cela leur exposait les connexions de
    // tous les autres comptes (cf. backlog #16/#18).
    addNotification(userData.id, 'success', `Bienvenue ${userData.prenom} ! Vous êtes connecté.`, '/profil');

    setIsClientMode(false);

    if (userData.role === 'admin') setScreen('admin-dashboard');
    else if (userData.role === 'vendeur') {
      setScreen('seller-dashboard');
    } else setScreen('home');
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
    setIsClientMode(false);
    setSelectedVendor(null);
    setSelectedProduct(null);
    setScreen('home');
  };

  // ===== MODE CLIENT =====
  const toggleClientMode = () => {
    setIsClientMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setScreen('home');
      } else {
        setScreen('seller-dashboard');
      }
      return newMode;
    });
  };

  // ===== INSCRIPTION =====
  // Crée le compte auprès de utilisateur-service. Le compte est créé non
  // confirmé (cf. UtilisateurService#createUtilisateur côté backend) : on
  // ne connecte plus automatiquement l'utilisateur, on l'envoie plutôt
  // vers l'écran de confirmation d'email (cf. case 'confirm-email').
  const handleRegisterSuccess = async ({ role, prenom, nom, email, telephone, password, photo }) => {
    await utilisateurApi.createUtilisateur({
      nom: joinNomComplet(prenom, nom),
      email,
      motDePasse: password,
      telephone,
      photo: photo || null,
      role: ROLE_FRONTEND_TO_BACKEND[role],
    });

    notifierAdmins('info', `Nouvel utilisateur inscrit : ${prenom} ${nom} (${role})`, '/admin/dashboard');

    setPendingConfirmationEmail(email.trim().toLowerCase());
    navigate('confirm-email');
  };

  // ===== GESTION DES PRODUITS =====
  // AddProduct.jsx et EditProduct.jsx appellent désormais produitApi
  // eux-mêmes ; ici on se contente de répercuter le résultat dans l'état
  // local pour un retour visuel immédiat sur les autres écrans (StockAlerts,
  // SellerDashboard...) qui partagent tous vendeurProducts.
  const handleAddProduct = (newProduct) => {
    setVendeurProducts(prev => [...prev, newProduct]);
    navigate('my-products');
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    navigate('edit-product');
  };

  const handleUpdateProduct = (updatedProduct) => {
    setVendeurProducts(prev =>
      prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    setEditingProduct(null);
    navigate('my-products');
  };

  const handleDeleteProduct = async (id) => {
    const previous = vendeurProducts;
    setVendeurProducts(prev => prev.filter(p => p.id !== id));
    try {
      await produitApi.supprimerProduit(id);
    } catch (err) {
      alert(err?.message || 'La suppression du produit a échoué.');
      setVendeurProducts(previous); // on annule le changement optimiste si l'appel échoue
    }
  };

  const handleDuplicateProduct = async (product) => {
    try {
      const request = construireProduitRequest({
        nom: `${product.name} (Copie)`,
        description: product.description,
        prix: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl,
        categorieId: product.categoryId,
        localisation: product.localisation,
      });
      const produitCree = await produitApi.publierProduit(request);
      setVendeurProducts(prev => [...prev, mapProduitPourVendeur(produitCree)]);
    } catch (err) {
      alert(err?.message || 'La duplication du produit a échoué.');
    }
  };

  // ===== APPROBATION / REJET =====
  const handleConfirmerPaiementVerification = async (id) => {
    try {
      await certificationApi.confirmerPaiementCertification(id, { paye: true });
      await chargerCertifications();
    } catch (err) {
      alert(err?.message || "La confirmation du paiement a échoué.");
    }
  };

  const handleApproveVerification = async (id) => {
    try {
      await certificationApi.reviserCertification(id, { approuve: true });
      await chargerCertifications();
    } catch (err) {
      alert(err?.message || "L'approbation a échoué.");
    }
  };

  const handleRejectVerification = async (id, motifRejet) => {
    try {
      await certificationApi.reviserCertification(id, { approuve: false, motifRejet });
      await chargerCertifications();
    } catch (err) {
      alert(err?.message || "Le rejet a échoué.");
    }
  };
  // `joursSaisis` est déjà saisi via la fenêtre de confirmation intégrée
  // (ConfirmActionModal) côté appelant : plus de window.prompt() ici.
  const handleToggleUserBlocked = async (userId, joursSaisis) => {
    const user = registeredUsers.find(u => u.id === userId);
    const estSuspensionEnCours = !user || !user.suspendu;
    let jours = 0;
    if (estSuspensionEnCours) {
      jours = parseInt(joursSaisis, 10);
      if (!jours || jours <= 0) { alert('Veuillez saisir un nombre de jours valide.'); return; }
    }
    try {
      await utilisateurApi.suspendreUtilisateur(userId, jours);
      addNotification(
        userId,
        estSuspensionEnCours ? 'error' : 'success',
        estSuspensionEnCours
          ? `Votre compte a été suspendu pendant ${jours} jour${jours > 1 ? 's' : ''} pour non-respect des règles d'intégrité de la plateforme.`
          : `Votre compte a été réactivé. Vous pouvez de nouveau vous connecter.`,
        '/profil'
      );
      await chargerUtilisateurs();
      await chargerSignalements();
    } catch (err) {
      alert(err?.message || "Le changement de statut a échoué.");
    }
  };

  // Suppression d'un produit signalé par l'admin depuis le panneau de
  // modération (endpoint admin dédié, sans vérification de propriété).
  // Le vendeur reçoit une notification l'informant du retrait, avec le
  // motif, plutôt que de découvrir la disparition sans explication.
  const handleSupprimerProduitSignalement = async (produitId, vendeurId, nomProduit) => {
    try {
      await produitApi.supprimerProduitAdmin(produitId);
      if (vendeurId) {
        addNotification(
          vendeurId,
          'error',
          `Votre produit${nomProduit ? ` « ${nomProduit} »` : ''} a été supprimé par un administrateur pour non-respect des règles d'intégrité de la plateforme (signalement confirmé).`,
          '/my-products'
        );
      }
      await chargerSignalements();
    } catch (err) {
      alert(err?.message || "La suppression du produit a échoué.");
    }
  };

  // Inscription d'un nouvel administrateur, depuis l'onglet "Administrateurs"
  // du tableau de bord admin (POST /api/utilisateurs/admin/creer, reservé
  // aux admins côté backend). Recharge la liste des utilisateurs pour que
  // le nouvel admin apparaisse immédiatement.
  const handleCreateAdmin = async ({ nom, email, password }) => {
    await utilisateurApi.creerAdministrateur({ nom, email, password });
    await chargerUtilisateurs();
  };

  // ===== NAVIGATION =====
  const goToProduct = (product) => { setSelectedProduct(product); setScreen('product-detail'); };
  const goToMessage = (vendor) => requireLogin(() => { setPreviousScreen(screen); setSelectedVendor(vendor); setScreen('message'); });
  const goToProducerProfile = (vendor) => { setSelectedVendor(vendor); setScreen('producer-profile'); };
  // Choisit le bon écran de profil public selon le rôle de l'utilisateur trouvé.
  const goToUserProfile = (utilisateur) => {
    if (utilisateur.role === 'vendeur') {
      setSelectedVendor({ id: utilisateur.id, prenom: utilisateur.prenom, nom: utilisateur.nom, photo: utilisateur.photo });
      setScreen('producer-profile');
    } else {
      setSelectedProfileClient(utilisateur);
      setScreen('client-profile');
    }
  };

  const clientOnlyScreens = ['cart', 'checkout-wizard', 'orders', 'purchases'];
  const vendeurOnlyScreens = ['add-product', 'edit-product', 'my-products', 'seller-dashboard', 'sales-history', 'stock-alerts', 'certification', 'vendeur-orders'];
  const adminOnlyScreens = ['admin-dashboard', 'order-management-admin', 'order-detail-admin', 'moderation-panel', 'vendor-verification'];

  // Écrans où un statut de commande est affiché : mesCommandes /
  // mesCommandesVendeur ne sont chargées qu'une fois à la connexion
  // (cf. useEffect plus haut), donc sans ce rechargement explicite à
  // l'entrée sur l'écran, "Mes achats" et "Mes ventes" peuvent afficher
  // un statut périmé (confirmation de livraison faite entretemps par
  // l'autre partie, ou auto-confirmation à 72h côté backend).
  const ecransCommandesClient = ['orders', 'purchases'];
  const ecransCommandesVendeur = ['vendeur-orders', 'seller-dashboard', 'sales-history'];

  const navigate = (s) => {
    setPreviousScreen(screen);
    if (screen === 'messages-inbox' && s !== 'messages-inbox') {
      chargerMessagesNonLus();
    }
    if (currentUser?.role === 'client' && ecransCommandesClient.includes(s)) {
      chargerMesCommandes();
    }
    if (currentUser?.role === 'vendeur' && ecransCommandesVendeur.includes(s)) {
      chargerCommandesVendeur();
    }
    const publicScreens = ['home', 'login-page', 'register', 'recovery', 'product-detail', 'faq', 'producer-profile', 'client-profile', 'user-search', 'catalogue'];
    if (!currentUser && !publicScreens.includes(s)) {
      requireLogin(() => setScreen(s));
      return;
    }
    if (currentUser) {
      if (isClientMode) {
        if (vendeurOnlyScreens.includes(s) || adminOnlyScreens.includes(s)) {
          alert('Vous êtes en mode client, cette section est réservée aux vendeurs.');
          return;
        }
      } else {
        if (clientOnlyScreens.includes(s) && currentUser.role !== 'client') {
          alert("Cette section est réservée aux clients.");
          setScreen(currentUser.role === 'admin' ? 'admin-dashboard' : 'my-products');
          return;
        }
        if (vendeurOnlyScreens.includes(s) && currentUser.role !== 'vendeur') {
          alert('Cette section est réservée aux vendeurs.');
          setScreen(currentUser.role === 'admin' ? 'admin-dashboard' : 'home');
          return;
        }
        if (adminOnlyScreens.includes(s) && currentUser.role !== 'admin') {
          alert("Cette section est réservée à l'administrateur.");
          setScreen(currentUser.role === 'vendeur' ? 'my-products' : 'home');
          return;
        }
      }
    }
    setScreen(s);
  };

  // ===== RENDU =====
  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return <AgroMarketHome
          onNavigateToProduct={goToProduct}
          onNavigateToLogin={() => navigate('login-page')}
          onNavigateToCatalogue={() => navigate('catalogue')}
          onAddToCart={addToCart}
          currentUser={currentUser}
        />;
      case 'catalogue':
        return <ProductCatalog
          onBack={() => navigate('home')}
          onNavigateToProduct={goToProduct}
          onAddToCart={addToCart}
        />;
      case 'login-page':
        return <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onValidateLogin={validateLogin}
          infoMessage={authRedirectMessage}
          onNavigateToRecovery={() => navigate('recovery')}
          onNavigateToRegister={() => navigate('register')}
          onUnconfirmedEmail={(email) => {
            setPendingConfirmationEmail(email);
            navigate('confirm-email');
          }}
        />;
      case 'register':
        return <RegisterPage
          onRegisterSuccess={handleRegisterSuccess}
          onNavigateToLogin={() => navigate('login-page')}
        />;
      case 'confirm-email':
        return <ConfirmEmailPage
          email={pendingConfirmationEmail}
          onBack={() => navigate('login-page')}
          onConfirmed={() => {
            setPendingConfirmationEmail('');
            setAuthRedirectMessage('Email confirmé avec succès ! Vous pouvez maintenant vous connecter.');
            navigate('login-page');
          }}
        />;
      case 'recovery':
        return <PasswordRecovery
          onBack={() => navigate('login-page')}
          onSuccess={() => navigate('login-page')}
        />;
      case 'product-detail':
        return <ProductDetail
          product={selectedProduct}
          onBack={() => navigate('home')}
          onAddToCart={(qty) => addToCart(selectedProduct, qty)}
          onContactVendor={goToMessage}
          onSignaler={() => openSignalement(selectedProduct, 'produit', selectedProduct?.name || selectedProduct?.nom)}
          onNavigateToProducerProfile={goToProducerProfile}
          currentUser={currentUser}
          onAvisPublie={(producteurId, product) => {
            if (producteurId) {
              addNotification(producteurId, 'info', `Un avis a été laissé sur votre produit "${product?.name || ''}"`, '/seller-dashboard');
            }
          }}
        />;
      case 'add-product':
        return <AddProduct
          onProductAdded={handleAddProduct}
          onCancel={() => navigate('my-products')}
        />;
      case 'edit-product':
        return <EditProduct
          product={editingProduct}
          onSave={handleUpdateProduct}
          onCancel={() => {
            setEditingProduct(null);
            navigate('my-products');
          }}
        />;
      case 'my-products':
        return <MyProducts
          products={vendeurProducts}
          onNavigateToAddProduct={() => navigate('add-product')}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          onDuplicateProduct={handleDuplicateProduct}
          onBack={() => navigate('seller-dashboard')}
        />;
      case 'payment-return':
        return <PaymentReturn
          transactionId={paymentTransactionId}
          onTermine={() => navigate(currentUser?.role === 'client' ? 'orders' : 'home')}
          onPaiementConfirme={() => {
            if (currentUser?.id) {
              addNotification(currentUser.id, 'success', 'Votre paiement a été confirmé avec succès.', '/orders');
            }
          }}
        />;
      case 'cart':
        return <ShoppingCart
          cartItems={cartItems}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateCartItemQuantity}
          onCheckout={handleCheckout}
          onContinueShopping={() => navigate('home')}
        />;
      case 'checkout-wizard':
        return <ShoppingCart
          cartItems={cartItems}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateCartItemQuantity}
          onCheckout={handleCheckout}
          onContinueShopping={() => navigate('home')}
        />;
      case 'orders':
        return <ClientOrders
          orders={mesCommandes}
          litiges={mesLitiges}
          onOpenLitige={openLitige}
          onBackHome={() => navigate('home')}
          onConfirmReception={async (orderId) => {
            await commandeApi.updateStatutCommande(orderId, 'LIVREE');
            const commandeConcernee = mesCommandes.find((c) => c.id === orderId);
            if (commandeConcernee) {
              addNotification(commandeConcernee.producteurId, 'success', `Le client a confirmé la réception de la commande #${orderId}.`, '/vendeur-orders');
            }
            await chargerMesCommandes();
          }}
          onCancelOrder={async (orderId) => {
            await commandeApi.annulerCommande(orderId);
            const commandeConcernee = mesCommandes.find((c) => c.id === orderId);
            if (commandeConcernee) {
              addNotification(commandeConcernee.producteurId, 'warning', `Le client a annulé la commande #${orderId}.`, '/vendeur-orders');
            }
            await chargerMesCommandes();
          }}
          onPayOrder={handlePayerCommandeExistante}
        />;
      case 'purchases':
        return <ClientPurchases
          orders={mesCommandes}
          onBackHome={() => navigate('home')}
        />;
      case 'messages-inbox':
        return <Messagerie
          currentUser={currentUser}
          vendor={null}
          onBack={() => navigate(previousScreen)}
          onMessageEnvoye={(destinataireId) => {
            addNotification(destinataireId, 'info', `Vous avez reçu un message de ${joinNomComplet(currentUser?.prenom, currentUser?.nom) || 'un utilisateur'}`, '/messages-inbox');
          }}
        />;
      case 'message':
        return <Messagerie
          vendor={selectedVendor}
          currentUser={currentUser}
          onBack={() => navigate(previousScreen)}
          onMessageEnvoye={(destinataireId) => {
            addNotification(destinataireId, 'info', `Vous avez reçu un message de ${joinNomComplet(currentUser?.prenom, currentUser?.nom) || 'un utilisateur'}`, '/messages-inbox');
          }}
        />;
      case 'user-profile':
        return <UserProfile
          currentUser={currentUser}
          onEditProfile={() => navigate('edit-profile')}
          onChangePassword={() => navigate('change-password')}
          onBack={() => navigate(previousScreen)}
          onNavigateToProduct={goToProduct}
        />;
      case 'edit-profile':
        return <EditProfile
          currentUser={currentUser}
          onBack={() => navigate('user-profile')}
          onSave={async (updatedData) => {
            // Appelle utilisateur-service (PUT /api/utilisateurs/{id}) au lieu
            // de ne mettre à jour que l'état local. Le backend n'a qu'un seul
            // champ "nom" : on recombine prenom + nom avec joinNomComplet.
            try {
              const profileDto = await utilisateurApi.updateProfil(currentUser.id, {
                nom: joinNomComplet(updatedData.prenom, updatedData.nom),
                email: updatedData.email,
                telephone: updatedData.telephone,
                photo: updatedData.photo,
                adresse: currentUser.adresse || '',
              });
              const updatedUser = mapProfileToFrontendUser(
                profileDto,
                [ROLE_FRONTEND_TO_BACKEND[currentUser.role]]
              );
              setCurrentUser(updatedUser);
              setRegisteredUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
              navigate('user-profile');
            } catch (err) {
              alert(err?.message || 'La mise à jour du profil a échoué.');
            }
          }}
        />;
      case 'change-password':
        return <ChangePassword
          currentUser={currentUser}
          onBack={() => navigate('user-profile')}
          onSave={async (currentPassword, newPassword) => {
            // Appelle utilisateur-service (PUT /api/utilisateurs/{id}/mot-de-passe).
            // Le backend vérifie lui-même l'ancien mot de passe ; en cas
            // d'erreur, on laisse l'exception remonter jusqu'à ChangePassword
            // pour qu'elle affiche le message sur le champ concerné.
            await utilisateurApi.changerMotDePasse(currentUser.id, currentPassword, newPassword);
            addNotification(currentUser.id, 'info', 'Votre mot de passe a été modifié avec succès.', null);
          }}
        />;
      case 'notifications':
        return <NotificationsCenter
          onBack={() => navigate('home')}
          currentUser={currentUser}
          notifications={notifications}
          onMarkAsRead={(id) => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, lu: true } : n));
            notificationApi.marquerCommeLu(id).catch((err) => console.error('Échec marquage lu :', err));
          }}
          onMarkAllAsRead={() => {
            setNotifications(prev => prev.map(n => (n.utilisateurId === currentUser.id || n.utilisateurId === 1) ? { ...n, lu: true } : n));
            notificationApi.marquerToutesLues().catch((err) => console.error('Échec « tout marquer lu » :', err));
          }}
          onDelete={(id) => {
            setNotifications(prev => prev.filter(n => n.id !== id));
            notificationApi.supprimerNotification(id).catch((err) => console.error('Échec suppression notification :', err));
          }}
          onNavigateToLink={(lien) => {
            if (lien) {
              if (lien.startsWith('/')) {
                const target = lien.replace('/', '');
                if (target === 'profil') navigate('user-profile');
                else if (target === 'orders') navigate('orders');
                else if (target === 'purchases') navigate('purchases');
                else if (target === 'seller-dashboard') navigate('seller-dashboard');
                else if (target === 'vendeur-orders') navigate('vendeur-orders');
                else if (target === 'messages-inbox') navigate('messages-inbox');
                else if (target === 'admin/dashboard') navigate('admin-dashboard');
                else if (target === 'admin/order-management-admin') navigate('order-management-admin');
                else if (target === 'admin/moderation-panel') navigate('moderation-panel');
                else if (target === 'admin/vendor-verification') navigate('vendor-verification');
                else navigate('home');
              } else {
                alert(`Redirection vers : ${lien}`);
              }
            }
          }}
        />;
      case 'faq':
        return <FAQPage onBack={() => navigate('home')} />;
      case 'seller-dashboard':
        return <SellerDashboard
          onNavigate={navigate}
          onLogout={handleLogout}
          currentUser={currentUser}
          vendeurProducts={vendeurProducts}
          adminOrders={mesCommandesVendeur}
          onUpdateOrderStatus={async (orderId, newStatus) => {
            try {
              const statutBackend = STATUT_FRANCAIS_TO_BACKEND[newStatus] || newStatus;
              await commandeApi.updateStatutCommande(orderId, statutBackend);
              const commandeConcernee = mesCommandesVendeur.find((c) => c.id === orderId);
              if (commandeConcernee) {
                addNotification(commandeConcernee.id_client, 'info', `Statut de votre commande #${orderId} mis à jour : ${newStatus}`, '/orders');
              }
              await chargerCommandesVendeur();
            } catch (err) {
              alert(err?.message || "La mise à jour du statut de la commande a échoué.");
            }
          }}
        />;
      case 'sales-history':
        return <SalesHistory onBack={() => navigate('seller-dashboard')} adminOrders={mesCommandesVendeur} vendeurProducts={vendeurProducts} />;
      case 'stock-alerts':
        return <StockAlerts onBack={() => navigate('seller-dashboard')} vendeurProducts={vendeurProducts} />;
      case 'certification':
        return <CertificationRequest
          onBack={() => navigate('seller-dashboard')}
        />;
      case 'admin-dashboard':
        return <AdminDashboard
          registeredUsers={registeredUsers}
          adminOrders={toutesLesCommandes}
          vendorVerifications={vendorVerifications}
          signalements={signalements}
          vendeurProducts={vendeurProducts}
          currentUser={currentUser}
          notifications={notifications}
          transactions={toutesLesTransactions}
          litiges={tousLesLitiges}
          onNavigate={navigate}
          onNavigateToVendorVerification={() => navigate('vendor-verification')}
          onNavigateToModeration={() => { chargerSignalements(); navigate('moderation-panel'); }}
          onLogout={handleLogout}
          onApproveCertification={handleApproveVerification}
          onRejectCertification={handleRejectVerification}
          onRembourserLitige={handleRembourserLitige}
          onResoudreLitige={handleResoudreLitige}
          onToggleUserBlocked={handleToggleUserBlocked}
          onCreateAdmin={handleCreateAdmin}
        />;
      case 'order-management-admin':
        return <OrderManagementAdmin
          ordersData={toutesLesCommandes}
          onViewOrder={(orderId) => { setSelectedOrderId(orderId); navigate('order-detail-admin'); }}
          onBack={() => navigate('admin-dashboard')}
        />;
      case 'order-detail-admin': {
        const commandeSelectionnee = toutesLesCommandes.find((c) => c.id === selectedOrderId) || null;
        return <OrderDetailAdmin
          order={commandeSelectionnee}
          onBack={() => navigate('order-management-admin')}
          onMarkAsDelivered={async (orderId) => {
            try {
              await commandeApi.updateStatutCommande(orderId, 'LIVREE');
              await chargerToutesLesCommandes();
            } catch (err) {
              alert(err?.message || "La confirmation de livraison a échoué.");
              throw err;
            }
          }}
        />;
      }
      case 'moderation-panel':
        return <ModerationPanel
          signalements={signalements}
          onResolve={async (id) => {
            try {
              await signalementApi.updateStatutSignalement(id, 'RESOLU');
              notifierAdmins('info', `Signalement résolu`, '/admin/moderation-panel');
              const signalementConcerne = signalements.find((s) => s.id === id);
              if (signalementConcerne) {
                // Pas de "voir plus" : aucune page ne permet à un déclarant
                // de consulter le suivi de ses propres signalements.
                addNotification(signalementConcerne.reporterId, 'success', `Votre signalement a été traité et jugé fondé.`);
              }
              await chargerSignalements();
            } catch (err) {
              alert(err?.message || "La mise à jour du signalement a échoué.");
            }
          }}
          onReject={async (id) => {
            try {
              await signalementApi.updateStatutSignalement(id, 'REJETE');
              notifierAdmins('info', `Signalement rejeté`, '/admin/moderation-panel');
              const signalementConcerne = signalements.find((s) => s.id === id);
              if (signalementConcerne) {
                addNotification(signalementConcerne.reporterId, 'info', `Votre signalement a été examiné et jugé non fondé.`);
              }
              await chargerSignalements();
            } catch (err) {
              alert(err?.message || "La mise à jour du signalement a échoué.");
            }
          }}
          onSuspendUtilisateur={handleToggleUserBlocked}
          onSupprimerProduit={handleSupprimerProduitSignalement}
          onBack={() => navigate('admin-dashboard')}
        />;
      case 'vendor-verification':
        return <VendorVerificationAdmin
          pendingVerifications={vendorVerifications}
          onApprove={handleApproveVerification}
          onReject={handleRejectVerification}
          onConfirmerPaiement={handleConfirmerPaiementVerification}
          onBack={() => navigate('admin-dashboard')}
        />;
      case 'producer-profile':
        return <ProducerProfile
          producteur={selectedVendor}
          currentUser={currentUser}
          onBack={() => navigate(previousScreen)}
          onContactVendor={goToMessage}
          onNavigateToProduct={goToProduct}
          onNavigateToLogin={() => navigate('login-page')}
          onSignaler={() => openSignalement(selectedVendor, 'utilisateur', selectedVendor?.nom)}
        />;
      case 'client-profile':
        return <ClientProfile
          client={selectedProfileClient}
          onBack={() => navigate(previousScreen)}
          onContactVendor={goToMessage}
          onNavigateToProduct={goToProduct}
          onSignaler={() => openSignalement(
            selectedProfileClient,
            'utilisateur',
            selectedProfileClient?.prenom ? `${selectedProfileClient.prenom} ${selectedProfileClient.nom}` : selectedProfileClient?.nom
          )}
        />;
      case 'user-search':
        return <UserSearchResults
          onBack={() => navigate(previousScreen)}
          onSelectUser={goToUserProfile}
        />;
      case 'vendeur-orders':
        return <VendeurOrders
          orders={mesCommandesVendeur}
          onUpdateOrderStatus={async (orderId, newStatus) => {
            try {
              const statutBackend = STATUT_FRANCAIS_TO_BACKEND[newStatus] || newStatus;
              await commandeApi.updateStatutCommande(orderId, statutBackend);
              const commandeConcernee = mesCommandesVendeur.find((c) => c.id === orderId);
              if (commandeConcernee) {
                addNotification(commandeConcernee.id_client, 'info', `Statut de votre commande #${orderId} mis à jour : ${newStatus}`, '/orders');
              }
              await chargerCommandesVendeur();
            } catch (err) {
              alert(err?.message || "La mise à jour du statut de la commande a échoué.");
            }
          }}
        />;
      default:
        return <AgroMarketHome
          onNavigateToProduct={goToProduct}
          onNavigateToLogin={() => navigate('login-page')}
          onNavigateToCart={() => navigate('cart')}
          onAddToCart={addToCart}
          cartCount={cartItems.length}
          onSignaler={openSignalement}
          currentUser={currentUser}
          onNavigateToProfile={() => navigate('user-profile')}
        />;
    }
  };

  return (
    <div style={styles.appWrapper}>
      <NavigationConsole
        currentScreen={screen}
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        cartCount={cartItems.length}
        notifications={notifications}
        unreadMessagesCount={unreadMessagesCount}
        isClientMode={isClientMode}
        onToggleClientMode={toggleClientMode}
      />
      <div style={styles.screenContainer}>{renderScreen()}</div>
      {showSignalement && (
        <SignalementModal
          target={signalementTarget}
          targetType={signalementTargetType}
          cibleLabel={signalementCibleLabel}
          onClose={() => { setShowSignalement(false); setSignalementTarget(null); }}
          onSubmit={async (data) => {
            try {
              await signalementApi.createSignalement({
                type: TYPE_FRONTEND_TO_BACKEND[signalementTargetType],
                targetId: signalementTarget.id,
                reporterId: currentUser.id,
                raison: construireRaison(data.motif, data.commentaire),
              });
              notifierAdmins('error', `Nouveau signalement de ${data.cible} par ${currentUser?.prenom || 'Client'}`, '/admin/moderation-panel');
              if (currentUser?.role === 'admin') await chargerSignalements();
            } catch (err) {
              alert(err?.message || "L'envoi du signalement a échoué.");
            }
          }}
        />
      )}
      {showLitige && (
        <LitigeModal
          order={litigeOrder}
          onClose={() => { setShowLitige(false); setLitigeOrder(null); }}
          onSubmit={handleCreerLitige}
        />
      )}
    </div>
  );
}

const styles = {
  appWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#f8f9fa',
  },
  screenContainer: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
};