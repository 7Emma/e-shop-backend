import nodemailer from 'nodemailer';

// 📧 Configuration du transporter email
// En développement: utilise MailHog (localhost:1025)
// En production: utilise Gmail ou un service SMTP
const transporter = nodemailer.createTransport(
  process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVICE
    ? {
        // MailHog - Serveur SMTP local pour développement
        host: process.env.EMAIL_HOST || 'localhost',
        port: process.env.EMAIL_PORT || 1025,
        secure: false, // MailHog n'utilise pas SSL
        auth: false, // MailHog ne nécessite pas d'authentification
      }
    : {
        // Gmail ou service SMTP en production
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      }
);

export const sendOrderConfirmation = async (email, order, trackingCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@eshop.com',
      to: email,
      subject: `Commande confirmée - Code de suivi: ${trackingCode}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
              .tracking-code { 
                background-color: #fee2e2; 
                border: 2px solid #dc2626; 
                padding: 15px; 
                text-align: center; 
                border-radius: 8px;
                margin: 20px 0;
              }
              .tracking-code h3 { color: #7f1d1d; margin: 0 0 10px 0; }
              .tracking-code .code { 
                font-size: 24px; 
                font-weight: bold; 
                color: #dc2626; 
                font-family: monospace;
                letter-spacing: 2px;
              }
              .items { margin: 20px 0; }
              .item { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .item:last-child { border-bottom: none; }
              .item-name { font-weight: bold; }
              .item-qty { color: #666; font-size: 14px; }
              .totals { margin: 20px 0; font-size: 16px; }
              .total-price { font-weight: bold; color: #dc2626; font-size: 20px; }
              .button { 
                display: inline-block; 
                background-color: #dc2626; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px;
                margin-top: 20px;
              }
              .footer { 
                text-align: center; 
                color: #666; 
                font-size: 12px; 
                margin-top: 30px; 
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Commande Confirmée ✓</h1>
              </div>

              <div class="content">
                <h2>Merci pour votre commande!</h2>
                <p>Votre paiement a été confirmé. Voici les détails de votre commande:</p>

                <div class="tracking-code">
                  <h3>Code de suivi de votre commande</h3>
                  <div class="code">${trackingCode}</div>
                  <p style="color: #666; margin: 10px 0 0 0; font-size: 12px;">
                    Conservez ce code pour suivre votre commande
                  </p>
                </div>

                <h3>Détails de la commande</h3>
                <div class="items">
                   ${order.items && order.items.length > 0 ? order.items.map(item => `
                     <div class="item">
                       <div class="item-name">${item.name || item.product?.name || 'Produit'}</div>
                       <div class="item-qty">Quantité: ${item.quantity} × ${item.price.toFixed(2)}€</div>
                       <div style="text-align: right; font-weight: bold;">
                         ${(item.quantity * item.price).toFixed(2)}€
                       </div>
                     </div>
                   `).join('') : '<div class="item">Aucun article détaillé</div>'}
                 </div>

                <div class="totals">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Sous-total:</span>
                    <span>${(order.totalPrice * (1 - 0.2)).toFixed(2)}€</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span>Taxes (20%):</span>
                    <span>${(order.totalPrice * 0.2).toFixed(2)}€</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 18px;">
                    <span style="font-weight: bold;">Total:</span>
                    <span class="total-price">${order.totalPrice.toFixed(2)}€</span>
                  </div>
                </div>

                ${order.shippingAddress ? `
                  <h3>Adresse de livraison</h3>
                  <div style="background-color: white; padding: 10px; border-radius: 6px;">
                    <p style="margin: 5px 0;">
                      ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}
                    </p>
                    <p style="margin: 5px 0;">${order.shippingAddress.street}</p>
                    <p style="margin: 5px 0;">
                      ${order.shippingAddress.zipCode} ${order.shippingAddress.city}
                    </p>
                    <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
                  </div>
                ` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/track/${trackingCode}" class="button">
                  Suivre ma commande
                </a>
              </div>

              <div class="footer">
                <p>Cet email a été envoyé automatiquement. Veuillez ne pas répondre directement à cet email.</p>
                <p>&copy; 2024 E-Shop. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmation envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi email:', error.message);
    return false;
  }
};

export const sendOTPEmail = async (email, otpCode, trackingCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@eshop.com',
      to: email,
      subject: `Code de vérification OTP - Suivi de commande ${trackingCode}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .header h2 { margin: 0; }
              .content { background-color: #f9fafb; padding: 30px; margin: 0; border-radius: 0 0 8px 8px; }
              .otp-box { 
                background-color: #fee2e2; 
                border: 2px solid #dc2626; 
                padding: 20px; 
                text-align: center; 
                border-radius: 8px;
                margin: 20px 0;
              }
              .otp-box h3 { color: #7f1d1d; margin: 0 0 10px 0; font-size: 14px; }
              .otp-code { 
                font-size: 28px; 
                font-weight: bold;
                color: #dc2626;
                letter-spacing: 3px;
                font-family: 'Courier New', monospace;
              }
              .otp-expiry { color: #9ca3af; font-size: 12px; margin-top: 10px; }
              .info { color: #6b7280; font-size: 14px; line-height: 1.6; margin: 15px 0; }
              .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🔐 Code de vérification</h2>
              </div>
              <div class="content">
                <p>Bonjour,</p>
                <p class="info">Vous avez demandé un code de vérification pour accéder aux détails de votre commande.</p>
                
                <div class="otp-box">
                  <h3>VOTRE CODE OTP</h3>
                  <div class="otp-code">${otpCode}</div>
                  <div class="otp-expiry">Code valide pendant 15 minutes</div>
                </div>

                <p class="info">
                  <strong>Code de suivi:</strong> ${trackingCode}<br>
                  <strong>Utilisez ce code</strong> pour vérifier votre accès au suivi de commande.
                </p>

                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 15px 0; border-radius: 4px;">
                  <p style="margin: 0; color: #92400e; font-size: 13px;">
                    ⚠️ <strong>Ne partagez pas ce code.</strong> Nous ne demandons jamais ce code par email ou SMS.
                  </p>
                </div>

                <p class="info">Si vous n'avez pas fait cette demande, veuillez ignorer cet email.</p>

                <div class="footer">
                  <p>Cet email a été envoyé automatiquement. Veuillez ne pas répondre directement à cet email.</p>
                  <p>&copy; 2024 E-Shop. Tous droits réservés.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email OTP envoyé à ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur envoi OTP email:', error.message);
    return false;
  }
};
