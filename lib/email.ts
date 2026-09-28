import { Resend } from "resend";
import nodemailer from "nodemailer";

// ─── Email Provider Initialization ───────────────────────────────────────────

const resendApiKey = (process.env.RESEND_API_KEY || "").trim();
const isResendConfigured = Boolean(resendApiKey && resendApiKey.startsWith("re_") && !resendApiKey.includes("..."));
const resend = isResendConfigured ? new Resend(resendApiKey) : null;

const smtpHost = (process.env.SMTP_HOST || "").trim();
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = (process.env.SMTP_USER || "").trim();
const smtpPass = (process.env.SMTP_PASS || "").trim();
const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

const isSmtpConfigured = Boolean(smtpHost && (smtpUser || smtpPort));

let smtpTransporter: any = null;
if (isSmtpConfigured) {
  try {
    smtpTransporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass } : undefined,
    });
  } catch (smtpErr) {
    console.warn("[Email Service] Failed to initialize SMTP transporter:", smtpErr);
  }
}

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || "KRYPT MARKET <orders@krypt.market>";

export interface OrderEmailParams {
  orderId: string;
  buyerEmail: string;
  shopName: string;
  productTitle: string;
  quantity: number;
  unitPrice: string | number;
  totalAmount: string | number;
  currency?: string;
  paymentMethod: string;
  keyDuration?: string;
  keyExpiresAt?: string | null;
  keys: string[];
  customNote?: string | null;
}

export interface OrderLookupEmailItem {
  orderId: string;
  shopName: string;
  productTitle: string;
  totalAmount: string;
  currency: string;
  createdAt: string | Date;
  receiptUrl: string;
}

async function sendMailUnified({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ success: boolean; error?: string; provider?: string }> {
  // 1. Try Resend if configured
  if (resend) {
    try {
      const result = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });
      return { success: true, provider: "resend" };
    } catch (err: any) {
      console.warn("[Email Service] Resend dispatch failed, attempting SMTP fallback if available:", err?.message);
    }
  }

  // 2. Try SMTP if configured
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      return { success: true, provider: "smtp" };
    } catch (smtpErr: any) {
      console.error("[Email Service] SMTP dispatch failed:", smtpErr?.message);
      return { success: false, error: smtpErr?.message || "SMTP delivery failed" };
    }
  }

  // 3. Dev fallback (Neither configured)
  console.log(`\n========================================\n[DEV EMAIL NOT SENT - NO RESEND/SMTP]\nTo: ${to}\nSubject: ${subject}\n========================================\n`);
  return { success: false, error: "No email provider configured (Set RESEND_API_KEY or SMTP_HOST in .env.local)" };
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendOrderDeliveryEmail(params: OrderEmailParams) {
  const {
    orderId,
    buyerEmail,
    shopName,
    productTitle,
    quantity,
    totalAmount,
    currency = "USD",
    paymentMethod,
    keyDuration,
    keyExpiresAt,
    keys,
    customNote,
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { generateOrderAccessToken } = await import("@/lib/order-auth");
  const token = generateOrderAccessToken(orderId, buyerEmail);
  const receiptUrl = `${appUrl}/order/${orderId}?token=${token}`;
  const shortOrderId = orderId.slice(0, 8).toUpperCase();

  const keysHtml = keys
    .map((key, index) => {
      const keyLabel =
        keys.length > 1
          ? `<div style="font-size: 10px; color: #c4b5fd; font-family: 'Courier New', monospace; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">[KEY #${String(index + 1).padStart(2, "0")}]</div>`
          : "";
      return `
        <div style="background: #030305; border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 6px; padding: 12px 14px; margin-bottom: 8px;">
          ${keyLabel}
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; color: #ffffff; word-break: break-all; letter-spacing: 0.05em;">
            ${escapeHtml(key)}
          </div>
        </div>
      `;
    })
    .join("");

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${escapeHtml(shopName)} Keys - TXID #${shortOrderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030305; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030305; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #08080c; border: 1px solid rgba(55, 44, 102, 0.6); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.9);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, rgba(55, 44, 102, 0.4) 0%, rgba(8, 8, 12, 0) 100%);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 10px; background: rgba(55, 44, 102, 0.4); border: 1px solid rgba(139, 92, 246, 0.4); color: #c4b5fd; font-size: 20px; margin-bottom: 12px;">
                ✓
              </div>
              <div style="font-family: 'Courier New', monospace; font-size: 10px; color: #c4b5fd; letter-spacing: 0.08em; margin-bottom: 4px;">
                // KRYPT_DISPATCH: KEYS_DECRYPTED
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.01em;">
                Payment Confirmed & Keys Dispatched
              </h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #9ca3af;">
                Order from <strong style="color: #ffffff;">${escapeHtml(shopName)}</strong>
              </p>
            </td>
          </tr>

          <!-- License Keys Section -->
          <tr>
            <td style="padding: 22px 32px 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 11px; font-family: 'Courier New', monospace; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.05em;">
                  ${keys.length > 1 ? `[${keys.length} DECRYPTED KEYS]` : "[DECRYPTED LICENSE KEY]"}
                </span>
                ${keyDuration ? `<span style="font-size: 10px; font-family: 'Courier New', monospace; font-weight: 700; background: rgba(55, 44, 102, 0.4); color: #c4b5fd; border: 1px solid rgba(139, 92, 246, 0.4); padding: 1px 6px; border-radius: 4px;">${escapeHtml(keyDuration)}</span>` : ""}
              </div>
              ${keysHtml}
              ${keyExpiresAt ? `<div style="font-size: 11px; font-family: 'Courier New', monospace; color: #9ca3af; margin-top: 4px;">EXPIRES: <strong style="color: #ffffff;">${new Date(keyExpiresAt).toLocaleString()}</strong></div>` : ""}
            </td>
          </tr>

          ${customNote ? `
          <!-- Custom Merchant Instructions -->
          <tr>
            <td style="padding: 0 32px 16px;">
              <div style="background: rgba(55, 44, 102, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 12px 14px;">
                <div style="font-size: 10px; font-family: 'Courier New', monospace; font-weight: 700; color: #c4b5fd; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">
                  // INSTRUCTIONS_FROM_SELLER
                </div>
                <div style="font-size: 12px; color: #e0e7ff; line-height: 1.5; white-space: pre-wrap;">
                  ${escapeHtml(customNote)}
                </div>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- Order Summary Details -->
          <tr>
            <td style="padding: 0 32px 20px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 14px 16px; font-family: 'Courier New', monospace;">
                <tr>
                  <td style="padding-bottom: 6px; font-size: 12px; color: #9ca3af;">PRODUCT</td>
                  <td align="right" style="padding-bottom: 6px; font-size: 12px; font-weight: 700; color: #ffffff;">
                    ${escapeHtml(productTitle)} ${quantity > 1 ? `<span style="color: #c4b5fd;">(x${quantity})</span>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 6px; font-size: 12px; color: #9ca3af;">TXID REF</td>
                  <td align="right" style="padding-bottom: 6px; font-size: 12px; color: #ffffff;">
                    #${shortOrderId}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 6px; font-size: 12px; color: #9ca3af;">GATEWAY</td>
                  <td align="right" style="padding-bottom: 6px; font-size: 12px; text-transform: uppercase; color: #f3f4f6;">
                    ${escapeHtml(paymentMethod)}
                  </td>
                </tr>
                <tr style="border-top: 1px solid rgba(255, 255, 255, 0.08);">
                  <td style="padding-top: 8px; font-size: 13px; font-weight: 700; color: #ffffff;">SETTLED TOTAL</td>
                  <td align="right" style="padding-top: 8px; font-size: 14px; font-weight: 800; color: #ffffff;">
                    $${parseFloat(totalAmount.toString()).toFixed(2)} ${escapeHtml(currency)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <a href="${receiptUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%); color: #ffffff; text-decoration: none; font-family: 'Courier New', monospace; font-weight: 800; font-size: 13px; padding: 11px 22px; border-radius: 6px; border: 1px solid rgba(167, 139, 250, 0.4); box-shadow: 0 0 16px rgba(55, 44, 102, 0.5);">
                [OPEN_LIVE_RECEIPT]
              </a>
              <div style="font-size: 11px; font-family: 'Courier New', monospace; color: #6b7280; margin-top: 10px;">
                Direct URL: <a href="${receiptUrl}" style="color: #c4b5fd; text-decoration: underline;">${receiptUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 14px 32px; background: rgba(0, 0, 0, 0.5); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <div style="font-size: 10px; font-family: 'Courier New', monospace; color: #6b7280;">
                KRYPT MARKET PROTOCOL // ZERO LOG RETENTION
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendMailUnified({
    to: buyerEmail,
    subject: `[KRYPT] Keys Dispatched: ${shopName} - #${shortOrderId}`,
    html: emailHtml,
  });
}

export async function sendOrderLookupEmail({
  email,
  orders,
}: {
  email: string;
  orders: OrderLookupEmailItem[];
}) {
  const shortCount = orders.length;
  const itemsHtml = orders
    .map(
      (ord) => `
      <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
        <td style="padding: 10px 6px;">
          <div style="font-weight: 700; font-size: 13px; color: #ffffff;">${escapeHtml(ord.productTitle)}</div>
          <div style="font-size: 11px; font-family: 'Courier New', monospace; color: #c4b5fd;">${escapeHtml(ord.shopName)} • TXID #${ord.orderId.slice(0, 8).toUpperCase()}</div>
          <div style="font-size: 10px; font-family: 'Courier New', monospace; color: #6b7280; margin-top: 2px;">${new Date(ord.createdAt).toLocaleDateString()}</div>
        </td>
        <td align="right" style="padding: 10px 6px;">
          <div style="font-weight: 800; font-family: 'Courier New', monospace; color: #ffffff; font-size: 13px; margin-bottom: 4px;">$${parseFloat(ord.totalAmount).toFixed(2)} ${escapeHtml(ord.currency)}</div>
          <a href="${ord.receiptUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, rgb(55, 44, 102) 0%, rgb(78, 62, 140) 100%); color: #ffffff; text-decoration: none; font-size: 11px; font-family: 'Courier New', monospace; font-weight: 800; padding: 5px 12px; border-radius: 4px; border: 1px solid rgba(167, 139, 250, 0.4);">
            [VIEW_KEYS]
          </a>
        </td>
      </tr>
    `
    )
    .join("");

  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your KRYPT Order Access Links</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030305; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030305; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #08080c; border: 1px solid rgba(55, 44, 102, 0.6); border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 24px 32px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); background: linear-gradient(180deg, rgba(55, 44, 102, 0.4) 0%, rgba(8, 8, 12, 0) 100%);">
              <h1 style="margin: 0; font-size: 18px; font-weight: 800; color: #ffffff; font-family: 'Courier New', monospace;">
                [LEDGER_LOOKUP_RESULTS]
              </h1>
              <p style="margin: 6px 0 0; font-size: 12px; color: #9ca3af;">
                Found ${shortCount} purchase records associated with ${escapeHtml(email)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                ${itemsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 32px; background: rgba(0, 0, 0, 0.5); border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <div style="font-size: 10px; font-family: 'Courier New', monospace; color: #6b7280;">
                KRYPT PROTOCOL // SECURE DISPATCH
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendMailUnified({
    to: email,
    subject: `[KRYPT] Purchased Orders Ledger (${shortCount} order${shortCount > 1 ? "s" : ""})`,
    html: emailHtml,
  });
}

export async function send2FADisableEmail({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  const html = `
    <div style="font-family: 'Courier New', monospace; padding: 24px; color: #fff; max-width: 480px; margin: 0 auto; border: 1px solid rgba(255, 42, 75, 0.3); border-radius: 8px; background: #06080e;">
      <h2 style="color: #ff2a4b; margin-top: 0; font-size: 18px;">[SECURITY_AUTH: DISABLE_2FA]</h2>
      <p style="font-size: 13px; color: #9ca3af; line-height: 1.5;">
        You have requested to deactivate Two-Factor Authentication (2FA) for your KRYPT operator account.
      </p>
      <p style="font-size: 12px; color: #d1d5db;">Verification OTP Token:</p>
      <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 12px 20px; background: rgba(255, 42, 75, 0.1); border: 1px solid #ff2a4b; border-radius: 6px; width: fit-content; margin: 14px 0; color: #ff2a4b;">
        ${otp}
      </div>
      <p style="color: #6b7280; font-size: 11px; line-height: 1.5;">
        Token expires in 5 minutes. If you did not initiate this request, lock your session immediately.
      </p>
    </div>
  `;

  return sendMailUnified({
    to: email,
    subject: "[KRYPT SEC] 2FA Deactivation Security Token",
    html,
  });
}

