import PDFDocument from "pdfkit";
import Order from "../models/Order.js";

/**
 * Générer et télécharger un reçu/facture en PDF professionnel
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const generatePDFReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    console.log(`Génération PDF - OrderID: ${id}, UserID: ${userId}`);

    // ═══════════════════════════════════════════════════════════════
    // 1. RÉCUPÉRATION ET VÉRIFICATION DES DONNÉES
    // ═══════════════════════════════════════════════════════════════

    const order = await Order.findById(id)
      .populate("items.product")
      .populate("user", "firstName lastName email");

    if (!order) {
      console.error(`Commande non trouvée: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Commande non trouvée",
      });
    }

    // Autoriser les commandes guest ET les commandes de l'utilisateur authentifié
    if (order.user && userId && order.user._id.toString() !== userId) {
      console.error(
        `Accès non autorisé - Order user: ${order.user._id}, Request user: ${userId}`
      );
      return res.status(403).json({
        success: false,
        message: "Accès non autorisé",
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. CONFIGURATION DES HEADERS HTTP
    // ═══════════════════════════════════════════════════════════════

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Facture_${order.trackingCode}.pdf"`
    );
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

    // ═══════════════════════════════════════════════════════════════
    // 3. INITIALISATION DU DOCUMENT PDF
    // ═══════════════════════════════════════════════════════════════

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      bufferPages: true,
    });
    doc.pipe(res);

    // Configuration des couleurs
    const colors = {
      primary: "#dc2626",
      secondary: "#1f2937",
      text: "#374151",
      lightGray: "#f3f4f6",
      border: "#e5e7eb",
      success: "#059669",
    };

    // ═══════════════════════════════════════════════════════════════
    // 4. EN-TÊTE AVEC DESIGN MODERNE
    // ═══════════════════════════════════════════════════════════════

    // Bandeau supérieur coloré
    doc.rect(0, 0, 595, 120).fill(colors.primary);

    // Logo et nom de l'entreprise (en blanc sur fond rouge)
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("E-Shop", 50, 35);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#ffffff")
      .text("Votre boutique en ligne de confiance", 50, 70)
      .text("contact@eshop.com  | +229 01 91 73 24 65", 50, 87);

    // Encadré facture (côté droit)
    doc
      .roundedRect(380, 30, 165, 75, 5)
      .fillAndStroke("#ffffff", colors.primary);

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(colors.primary)
      .text("FACTURE", 390, 42, { width: 145, align: "center" });

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(colors.text)
      .text(`N° ${order.trackingCode}`, 390, 65, {
        width: 145,
        align: "center",
      })
      .text(
        `ID: ${order._id.toString().substring(0, 8).toUpperCase()}`,
        390,
        80,
        { width: 145, align: "center" }
      );

    // ═══════════════════════════════════════════════════════════════
    // 5. INFORMATIONS CLIENT & COMMANDE (LAYOUT EN COLONNES)
    // ═══════════════════════════════════════════════════════════════

    let yPos = 150;

    // Colonne gauche - Informations de commande
    doc
      .roundedRect(50, yPos, 240, 110, 5)
      .fillAndStroke(colors.lightGray, colors.border);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(colors.secondary)
      .text("DÉTAILS DE LA COMMANDE", 65, yPos + 15);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(colors.text)
      .text(`Code de suivi`, 65, yPos + 40)
      .font("Helvetica-Bold")
      .text(order.trackingCode, 65, yPos + 55);

    doc
      .font("Helvetica")
      .text(`Date de commande`, 65, yPos + 75)
      .font("Helvetica-Bold")
      .text(
        new Date(order.createdAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        65,
        yPos + 90
      );

    // Colonne droite - Informations client
    doc
      .roundedRect(305, yPos, 240, 110, 5)
      .fillAndStroke(colors.lightGray, colors.border);

    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .fillColor(colors.secondary)
      .text("INFORMATIONS CLIENT", 320, yPos + 15);

    const firstName = order.shippingAddress?.firstName || order.user?.firstName;
    const lastName = order.shippingAddress?.lastName || order.user?.lastName;
    const email = order.shippingAddress?.email || order.user?.email;
    const phone =
      order.shippingAddress?.phone || order.user?.phone || "Non fourni";

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor(colors.text)
      .text(`${firstName} ${lastName}`, 320, yPos + 40)
      .text(` ${email}`, 320, yPos + 60)
      .text(` ${phone}`, 320, yPos + 80);

    // ═══════════════════════════════════════════════════════════════
    // 6. TABLEAU DES ARTICLES (DESIGN MODERNE)
    // ═══════════════════════════════════════════════════════════════

    yPos = 290;

    // Titre de section
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(colors.secondary)
      .text("ARTICLES COMMANDÉS", 50, yPos);

    yPos += 30;

    // En-tête du tableau avec fond coloré
    doc.rect(50, yPos, 495, 25).fill(colors.secondary);

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text("Article", 65, yPos + 7)
      .text("Qté", 320, yPos + 7, { width: 40, align: "center" })
      .text("Prix unit.", 380, yPos + 7, { width: 70, align: "right" })
      .text("Total", 470, yPos + 7, { width: 60, align: "right" });

    yPos += 25;

    // Lignes du tableau avec alternance de couleurs
    order.items?.forEach((item, index) => {
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      // Fond alterné
      if (index % 2 === 0) {
        doc.rect(50, yPos, 495, 30).fill(colors.lightGray);
      }

      const itemTotal = (item.quantity * item.price).toFixed(2);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(colors.text)
        .text(item.product?.name || "Produit", 65, yPos + 8, {
          width: 240,
          ellipsis: true,
        })
        .text(item.quantity.toString(), 320, yPos + 8, {
          width: 40,
          align: "center",
        })
        .text(`${item.price.toFixed(2)} €`, 380, yPos + 8, {
          width: 70,
          align: "right",
        })
        .font("Helvetica-Bold")
        .text(`${itemTotal} €`, 470, yPos + 8, {
          width: 60,
          align: "right",
        });

      yPos += 30;
    });

    // Ligne de fermeture du tableau
    doc.moveTo(50, yPos).lineTo(545, yPos).stroke(colors.border);

    // ═══════════════════════════════════════════════════════════════
    // 7. RÉSUMÉ FINANCIER (ENCADRÉ ÉLÉGANT)
    // ═══════════════════════════════════════════════════════════════

    yPos += 20;

    // TVA Calculation: Les prix sont en HT
    // TVA = HT × taux, TTC = HT × (1 + taux)
    const TVA_RATE = 0.18; // 18% (Benin/Togo standard)
    const ht = order.totalPrice.toFixed(2);
    const tva = (order.totalPrice * TVA_RATE).toFixed(2);
    const totalTTC = (order.totalPrice * (1 + TVA_RATE)).toFixed(2);

    // Encadré du résumé
    doc
      .roundedRect(330, yPos, 215, 110, 5)
      .fillAndStroke(colors.lightGray, colors.border);

    yPos += 15;

    // Sous-total HT
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor(colors.text)
      .text("Sous-total HT", 345, yPos)
      .text(`${ht} €`, 470, yPos, { width: 60, align: "right" });

    yPos += 20;

    // TVA (18%)
    doc
      .text("TVA (18%)", 345, yPos)
      .text(`${tva} €`, 470, yPos, { width: 60, align: "right" });

    yPos += 25;

    // Ligne de séparation
    doc.moveTo(345, yPos).lineTo(530, yPos).stroke(colors.primary);

    yPos += 15;

    // Total TTC (mise en valeur)
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor(colors.primary)
      .text("TOTAL TTC", 345, yPos)
      .text(`${totalTTC} €`, 470, yPos, {
        width: 60,
        align: "right",
      });

    // ═══════════════════════════════════════════════════════════════
    // 8. ADRESSE DE LIVRAISON (ENCADRÉ)
    // ═══════════════════════════════════════════════════════════════

    yPos += 50;

    if (order.shippingAddress) {
      doc
        .roundedRect(50, yPos, 240, 100, 5)
        .fillAndStroke(colors.lightGray, colors.border);

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(colors.secondary)
        .text("ADRESSE DE LIVRAISON", 65, yPos + 15);

      const addr = order.shippingAddress;
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(colors.text)
        .text(`${addr.firstName} ${addr.lastName}`, 65, yPos + 40)
        .text(addr.street, 65, yPos + 55)
        .text(`${addr.zipCode} ${addr.city}`, 65, yPos + 70)
        .text(addr.country, 65, yPos + 85);
    }

    // ═══════════════════════════════════════════════════════════════
    // 9. PIED DE PAGE PROFESSIONNEL
    // ═══════════════════════════════════════════════════════════════

    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      // Ligne de séparation
      doc.moveTo(50, 770).lineTo(545, 770).stroke(colors.border);

      // Texte du pied de page
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#9ca3af")
        .text(
          "Merci de votre confiance. Ce document constitue une preuve d'achat officielle.",
          50,
          780,
          { align: "center", width: 495 }
        );
    }

    // Finalisation du document
    doc.end();
    console.log(`PDF généré avec succès`);
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error.message);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la génération du PDF",
      });
    } else {
      res.end();
    }
  }
};
