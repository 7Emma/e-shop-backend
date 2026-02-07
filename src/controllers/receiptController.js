import Order from '../models/Order.js';

/**
 * Générer et envoyer un reçu en format texte
 */
export const generateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur accède à sa propre commande
    const order = await Order.findById(id)
      .populate('items.product')
      .populate('user', 'firstName lastName email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    if (order.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const receiptText = `
╔════════════════════════════════════════════════════════════════════════════╗
║                           REÇU DE COMMANDE                                 ║
╚════════════════════════════════════════════════════════════════════════════╝

NUMÉRO DE COMMANDE:        ${order._id}
CODE DE SUIVI:             ${order.trackingCode}
DATE DE COMMANDE:          ${new Date(order.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

CLIENT:
  Nom:                     ${order.user?.firstName} ${order.user?.lastName}
  Email:                   ${order.user?.email}

────────────────────────────────────────────────────────────────────────────

ARTICLES COMMANDÉS:

${order.items?.map(item => `
  ${item.product?.name || 'Produit'}
    Référence:             ${item.product?._id || 'N/A'}
    Quantité:              ${item.quantity} unité(s)
    Prix unitaire:         ${item.price.toFixed(2)}€
    Sous-total:            ${(item.quantity * item.price).toFixed(2)}€
`).join('────────────────────────────────────────────────────────────────────────────\n')}

────────────────────────────────────────────────────────────────────────────

RÉSUMÉ FINANCIER:

  Sous-total des articles: ${(order.totalPrice * (1 - 0.2)).toFixed(2)}€
  Taxes (20%):             ${(order.totalPrice * 0.2).toFixed(2)}€
  ────────────────────────────────────────────────────────────────────────────
  MONTANT TOTAL TTC:       ${order.totalPrice.toFixed(2)}€

ADRESSE DE LIVRAISON:

  ${order.shippingAddress?.firstName} ${order.shippingAddress?.lastName}
  ${order.shippingAddress?.street}
  ${order.shippingAddress?.zipCode} ${order.shippingAddress?.city}
  ${order.shippingAddress?.country}
  Téléphone:               ${order.shippingAddress?.phone || 'Non renseigné'}

STATUT DE LA COMMANDE:

  Paiement:                ${order.paymentStatus === 'paid' ? '✓ Payé' : order.paymentStatus === 'pending' ? '⏳ En attente' : '✗ Échoué'}
  Livraison:               ${order.status === 'pending' ? '⏳ En attente' : order.status === 'processing' ? '📦 En traitement' : order.status === 'shipped' ? '🚚 Expédié' : order.status === 'delivered' ? '✓ Livré' : '✗ Annulé'}
  ${order.trackingNumber ? `Numéro de colis:         ${order.trackingNumber}` : ''}

────────────────────────────────────────────────────────────────────────────

SUIVI DE VOTRE COMMANDE:

  Utilisez votre code de suivi pour suivre votre commande en temps réel:
  Code: ${order.trackingCode}

  Site: [URL de suivi]
  
  Conservez ce reçu en sécurité pour vos dossiers.

────────────────────────────────────────────────────────────────────────────

Merci pour votre confiance!

Pour toute question ou réclamation, veuillez contacter notre service client.

────────────────────────────────────────────────────────────────────────────
Généré le: ${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    `;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="Reçu_${order.trackingCode}.txt"`);
    res.send(receiptText);
  } catch (error) {
    console.error('Erreur génération reçu:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
