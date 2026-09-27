import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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
  keys: string[];
  customNote?: string | null;
}

export async function sendOrderDeliveryEmail(params: OrderEmailParams) {
  const {
    orderId,
    buyerEmail,
    shopName,
    productTitle,
    quantity,
    unitPrice,
    totalAmount,
    currency = "USD",
    paymentMethod,
    keys,
    customNote,
  } = params;

  if (!resend) {
    console.warn("[Email Service] RESEND_API_KEY is not configured in environment. Skipping email delivery.");
    return { success: false, error: "RESEND_API_KEY missing" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { generateOrderAccessToken } = await import("@/lib/order-auth");
  const token = generateOrderAccessToken(orderId, buyerEmail);
  const receiptUrl = `${appUrl}/order/${orderId}?token=${token}`;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vaultly <onboarding@resend.dev>";
  const shortOrderId = orderId.slice(0, 8).toUpperCase();

  const keysHtml = keys
    .map((key, index) => {
      const keyLabel = keys.length > 1 ? `<div style="font-size: 11px; color: #818cf8; font-weight: 700; margin-bottom: 4px; text-transform: uppercase;">Key #${index + 1}</div>` : "";
      return `
        <div style="background: #090a0f; border: 1px solid rgba(99, 102, 241, 0.35); border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;">
          ${keyLabel}
          <div style="font-family: 'Courier New', Courier, monospace; font-size: 15px; font-weight: 700; color: #38bdf8; word-break: break-all; letter-spacing: 0.05em;">
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
  <title>Your ${escapeHtml(shopName)} Order #${shortOrderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #08090c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f4f6;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #08090c; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #0f1118; border: 1px solid rgba(255, 255, 255, 0.09); border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.07); background: linear-gradient(180deg, rgba(99, 102, 241, 0.12) 0%, rgba(15, 17, 24, 0) 100%);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%; background: rgba(16, 185, 129, 0.18); border: 1px solid rgba(16, 185, 129, 0.35); color: #34d399; font-size: 24px; margin-bottom: 14px;">
                ✓
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Payment Confirmed & Keys Delivered
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #9ca3af;">
                Thank you for your purchase from <strong style="color: #f3f4f6;">${escapeHtml(shopName)}</strong>
              </p>
            </td>
          </tr>

          <!-- License Keys Section -->
          <tr>
            <td style="padding: 28px 32px 20px;">
              <div style="font-size: 12px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
                ${keys.length > 1 ? `Your ${keys.length} License Keys` : "Your License Key"}
              </div>
              ${keysHtml}
            </td>
          </tr>

          ${customNote ? `
          <!-- Custom Merchant Receipt Note -->
          <tr>
            <td style="padding: 0 32px 20px;">
              <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.28); border-radius: 10px; padding: 16px 18px;">
                <div style="font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
                  Message / Instructions from Merchant
                </div>
                <div style="font-size: 13px; color: #e0e7ff; line-height: 1.6; white-space: pre-wrap;">
                  ${escapeHtml(customNote)}
                </div>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- Order Summary Details -->
          <tr>
            <td style="padding: 0 32px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 18px 20px;">
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #9ca3af;">Product</td>
                  <td align="right" style="padding-bottom: 10px; font-size: 13px; font-weight: 600; color: #ffffff;">
                    ${escapeHtml(productTitle)} ${quantity > 1 ? `<span style="color: #818cf8;">(x${quantity})</span>` : ""}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #9ca3af;">Order ID</td>
                  <td align="right" style="padding-bottom: 10px; font-size: 13px; font-family: monospace; color: #f3f4f6;">
                    #${shortOrderId}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; font-size: 13px; color: #9ca3af;">Payment Method</td>
                  <td align="right" style="padding-bottom: 10px; font-size: 13px; text-transform: uppercase; font-weight: 600; color: #f3f4f6;">
                    ${escapeHtml(paymentMethod)}
                  </td>
                </tr>
                <tr style="border-top: 1px solid rgba(255, 255, 255, 0.08);">
                  <td style="padding-top: 10px; font-size: 14px; font-weight: 700; color: #ffffff;">Total Amount Paid</td>
                  <td align="right" style="padding-top: 10px; font-size: 16px; font-weight: 800; color: #10b981;">
                    $${parseFloat(totalAmount.toString()).toFixed(2)} ${escapeHtml(currency)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="${receiptUrl}" target="_blank" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                View Online Receipt & Keys &rarr;
              </a>
              <div style="font-size: 12px; color: #6b7280; margin-top: 14px;">
                Receipt URL: <a href="${receiptUrl}" style="color: #818cf8; text-decoration: underline;">${receiptUrl}</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: rgba(0, 0, 0, 0.4); border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
              <div style="font-size: 12px; color: #6b7280; line-height: 1.5;">
                This email was automatically generated by <strong style="color: #9ca3af;">Vaultly Digital Commerce</strong> for order fulfillment.
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

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: buyerEmail,
      subject: `Your ${shopName} Purchase - Order #${shortOrderId}`,
      html: emailHtml,
    });

    console.log(`[Email Service] Order delivery email dispatched for #${shortOrderId} to ${buyerEmail}:`, result);
    return { success: true, result };
  } catch (err: any) {
    console.warn(`[Email Service] Failed to send order email to ${buyerEmail}:`, err?.message || err);
    return { success: false, error: err?.message || "Failed to send email" };
  }
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

export async function send2FADisableEmail({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Vaultly Security <onboarding@resend.dev>";

  if (!resend) {
    console.log(`\n========================================\n[DEV 2FA DISABLE OTP] Code for ${email}: ${otp}\n========================================\n`);
    return { success: true };
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 28px; color: #111; max-width: 500px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #ef4444; margin-top: 0; font-size: 20px;">Security Verification: Disable 2FA</h2>
      <p style="font-size: 14px; color: #374151; line-height: 1.5;">
        You have requested to turn off Two-Factor Authentication (2FA) for your Vaultly merchant account.
      </p>
      <p style="font-size: 13px; color: #4b5563;">Use the following 6-digit confirmation code:</p>
      <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 14px 24px; background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; width: fit-content; margin: 18px 0; color: #b91c1c;">
        ${otp}
      </div>
      <p style="color: #6b7280; font-size: 12px; line-height: 1.5;">
        This code is valid for 5 minutes. If you did not initiate this request, someone may be attempting to access your account. Please change your password immediately.
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Vaultly Security - Verification Code to Disable 2FA",
      html,
    });
    console.log(`[Email Service] 2FA disable code sent to ${email}`);
    return { success: true, result };
  } catch (err: any) {
    console.error("[Email Service] Failed to send 2FA disable email:", err);
    return { success: false, error: err?.message };
  }
}
