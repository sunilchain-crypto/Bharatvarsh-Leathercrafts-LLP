import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Order } from '../types';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE === 'false' ? false : (SMTP_PORT === 465);
const SMTP_USER = process.env.SMTP_USER || 'support@bharatvarshcrafts.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || `"Bharatvarsh Leathercrafts LLP" <support@bharatvarshcrafts.com>`;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'support@bharatvarshcrafts.com';

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransporter | null = null;

function getTransporter(): MailTransporter | null {
  if (!transporter && SMTP_USER && SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    } catch (err) {
      console.error('[SMTP Mailer] Failed to initialize nodemailer transporter:', err);
    }
  }
  return transporter;
}

export const mailerService = {
  getStatus() {
    return {
      configured: Boolean(SMTP_USER && SMTP_PASS),
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      from: SMTP_FROM,
      notificationEmail: NOTIFICATION_EMAIL
    };
  },

  async sendOrderConfirmation(order: Order): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
    const client = getTransporter();

    const itemsHtml = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
            <strong>${item.product.name}</strong><br>
            <span style="font-size: 12px; color: #6b7280;">Color: ${item.selectedColor}${item.monogramText ? ` | Monogram: "${item.monogramText}"` : ''}</span>
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${(item.product.price * item.quantity).toLocaleString('en-IN')}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6;">
        <div style="background-color: #1a1614; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #f3ece4; font-family: 'Cormorant Garamond', Georgia, serif; margin: 0; font-size: 26px; letter-spacing: 0.1em; text-transform: uppercase;">
            Bharatvarsh Leathercrafts LLP
          </h1>
          <p style="color: #c5a059; margin: 6px 0 0; font-size: 13px; letter-spacing: 0.05em;">
            Order Confirmation & GST Receipt • #${order.orderNumber}
          </p>
        </div>
        
        <div style="background-color: #ffffff; padding: 28px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">Dear <strong>${order.customer.name}</strong>,</p>
          <p>Thank you for choosing Bharatvarsh Leathercrafts. Our master artisans have received your bespoke commission and work will commence shortly.</p>
          
          <div style="background-color: #faf7f2; border: 1px solid #e8dfd3; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #5c2c16;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background-color: #efe8dc;">
                  <th style="padding: 8px; text-align: left;">Item</th>
                  <th style="padding: 8px; text-align: center;">Qty</th>
                  <th style="padding: 8px; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 16px; border-top: 1px solid #e8dfd3; padding-top: 10px; text-align: right; font-size: 14px;">
              <div>Subtotal: <strong>₹${order.subtotal.toLocaleString('en-IN')}</strong></div>
              ${order.discount ? `<div style="color: #059669;">Privilege Discount: -₹${order.discount.toLocaleString('en-IN')}</div>` : ''}
              <div>Shipping: <strong>${order.shipping === 0 ? 'Complimentary Express' : `₹${order.shipping}`}</strong></div>
              <div>18% GST (HSN 4202): <strong>₹${order.tax.toLocaleString('en-IN')}</strong></div>
              <div style="font-size: 18px; margin-top: 6px; color: #1a1614; font-weight: bold;">Grand Total: ₹${order.total.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style="font-size: 13px; color: #4b5563; margin-top: 20px; line-height: 1.5;">
            <strong>Shipping Destination:</strong><br>
            ${order.customer.address}, ${order.customer.city}, ${order.customer.state} - ${order.customer.pincode}<br>
            Phone: ${order.customer.phone}
            ${order.customer.gstin ? `<br><strong>B2B GSTIN:</strong> ${order.customer.gstin}` : ''}
          </div>

          <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
            <p style="margin: 0;">Bharatvarsh Leathercrafts LLP • Kanpur & Dharavi Artisanal Ateliers</p>
            <p style="margin: 4px 0 0;">Dedicated Concierge & Care Inquiries: <a href="mailto:${NOTIFICATION_EMAIL}" style="color: #8b4513;">${NOTIFICATION_EMAIL}</a></p>
          </div>
        </div>
      </div>
    `;

    if (!client) {
      console.log(`[SMTP Mailer Simulation] SMTP_PASS not set. Simulated order confirmation for #${order.orderNumber} to ${order.customer.email}`);
      return { success: true, simulated: true };
    }

    try {
      // 1. Send confirmation to customer
      const info = await client.sendMail({
        from: SMTP_FROM,
        to: order.customer.email,
        subject: `Order Confirmed: #${order.orderNumber} — Bharatvarsh Leathercrafts LLP`,
        html: htmlContent
      });

      // 2. Send notification to store admin / support
      await client.sendMail({
        from: SMTP_FROM,
        to: NOTIFICATION_EMAIL,
        subject: `[New Order Alert] #${order.orderNumber} by ${order.customer.name} (₹${order.total.toLocaleString('en-IN')})`,
        html: htmlContent
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('[SMTP Mailer] Failed sending order confirmation email:', err);
      return { success: false };
    }
  },

  async sendContactNotification(inquiry: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    type?: string;
    details?: any;
  }): Promise<{ success: boolean; simulated?: boolean }> {
    const client = getTransporter();

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #5c2c16; border-bottom: 2px solid #5c2c16; padding-bottom: 8px;">
          New Inquiry: ${inquiry.subject || inquiry.type || 'Customer Contact'}
        </h2>
        <p><strong>Patron Name:</strong> ${inquiry.name}</p>
        <p><strong>Email:</strong> <a href="mailto:${inquiry.email}">${inquiry.email}</a></p>
        ${inquiry.phone ? `<p><strong>Phone:</strong> ${inquiry.phone}</p>` : ''}
        ${inquiry.type ? `<p><strong>Inquiry Type:</strong> ${inquiry.type}</p>` : ''}
        <div style="background: #f9f9f9; padding: 14px; border-radius: 6px; margin: 16px 0; white-space: pre-wrap;">
          ${inquiry.message}
        </div>
        ${inquiry.details ? `<p><strong>Additional Details:</strong></p><pre style="background: #f3f4f6; padding: 10px; font-size: 12px; border-radius: 4px;">${JSON.stringify(inquiry.details, null, 2)}</pre>` : ''}
      </div>
    `;

    if (!client) {
      console.log(`[SMTP Mailer Simulation] Inquiry notification from ${inquiry.email} recorded. Notification recipient: ${NOTIFICATION_EMAIL}`);
      return { success: true, simulated: true };
    }

    try {
      await client.sendMail({
        from: SMTP_FROM,
        to: NOTIFICATION_EMAIL,
        replyTo: inquiry.email,
        subject: `[Inquiry] ${inquiry.subject || 'Store Inquiry'} - ${inquiry.name}`,
        html
      });
      return { success: true };
    } catch (err) {
      console.error('[SMTP Mailer] Error sending inquiry notification:', err);
      return { success: false };
    }
  }
};
