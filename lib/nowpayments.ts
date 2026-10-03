import crypto from "crypto";

export interface CreateNowPaymentsInvoiceParams {
  orderId: string;
  priceAmount: number;
  priceCurrency?: string; // "usd" default
  orderDescription: string;
  ipnCallbackUrl?: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface NowPaymentsInvoiceResponse {
  success: boolean;
  id?: string;
  invoiceUrl?: string;
  error?: string;
}

function getNowPaymentsConfig() {
  const apiKey = (process.env.NOWPAYMENTS_API_KEY || "").trim();
  const ipnSecret = (process.env.NOWPAYMENTS_IPN_SECRET || "").trim();
  const isSandbox =
    (process.env.NOWPAYMENTS_SANDBOX || "false").toLowerCase() === "true";
  const baseUrl = isSandbox
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

  return { apiKey, ipnSecret, isSandbox, baseUrl };
}

/**
 * Creates a hosted cryptocurrency checkout invoice on NOWPayments.
 * Returns the hosted payment page URL (`invoice_url`) where buyers can pay with BTC, ETH, LTC, USDT, SOL, XMR, etc.
 */
export async function createNowPaymentsInvoice(
  params: CreateNowPaymentsInvoiceParams
): Promise<NowPaymentsInvoiceResponse> {
  const { apiKey, baseUrl, isSandbox } = getNowPaymentsConfig();

  if (!apiKey) {
    console.error("[NOWPayments] Missing NOWPAYMENTS_API_KEY in environment variables.");
    return {
      success: false,
      error: "NOWPayments configuration missing: NOWPAYMENTS_API_KEY must be configured in .env.local",
    };
  }

  const payload: Record<string, any> = {
    price_amount: parseFloat(params.priceAmount.toFixed(2)),
    price_currency: (params.priceCurrency || "usd").toLowerCase(),
    order_id: params.orderId,
    order_description: params.orderDescription,
  };

  if (params.ipnCallbackUrl) {
    payload.ipn_callback_url = params.ipnCallbackUrl;
  }
  if (params.successUrl) {
    payload.success_url = params.successUrl;
  }
  if (params.cancelUrl) {
    payload.cancel_url = params.cancelUrl;
  }

  try {
    const response = await fetch(`${baseUrl}/invoice`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg =
        data.message ||
        (typeof data.errors === "object" ? JSON.stringify(data.errors) : "NOWPayments invoice creation failed");
      console.error(`[NOWPayments API Error (${isSandbox ? "Sandbox" : "Live"})]:`, response.status, data);
      return { success: false, error: errMsg };
    }

    if (data.invoice_url) {
      return {
        success: true,
        id: String(data.id || data.token_id || params.orderId),
        invoiceUrl: data.invoice_url,
      };
    }

    return {
      success: false,
      error: "NOWPayments did not return an invoice URL.",
    };
  } catch (err: any) {
    console.error("[NOWPayments Connection Error]:", err);
    return {
      success: false,
      error: err.message || "Failed to communicate with NOWPayments API.",
    };
  }
}

/**
 * Verifies inbound NOWPayments Instant Payment Notification (IPN) webhook signature.
 * NOWPayments signs the payload by sorting all top-level keys alphabetically,
 * stringifying it, and generating an HMAC SHA-512 digest using the IPN Secret key.
 */
export function verifyNowPaymentsWebhook(
  requestBody: Record<string, any>,
  receivedSignature: string | null | undefined,
  ipnSecret: string
): boolean {
  if (!receivedSignature || !ipnSecret) {
    return false;
  }

  try {
    // 1. Sort the keys alphabetically and stringify
    const sortedString = JSON.stringify(requestBody, Object.keys(requestBody).sort());

    // 2. Compute HMAC SHA-512
    const hmac = crypto.createHmac("sha512", ipnSecret);
    hmac.update(sortedString);
    const computedSignature = hmac.digest("hex");

    // 3. Timing-safe comparison to prevent timing attacks
    const computedBuf = Buffer.from(computedSignature, "utf8");
    const receivedBuf = Buffer.from(receivedSignature.trim(), "utf8");

    if (computedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuf, receivedBuf);
  } catch (err) {
    console.error("[NOWPayments Signature Verification Error]:", err);
    return false;
  }
}

/**
 * Checks payment status directly with NOWPayments API by payment ID.
 */
export async function checkNowPaymentsPaymentStatus(paymentId: string) {
  const { apiKey, baseUrl } = getNowPaymentsConfig();
  if (!apiKey) return null;

  try {
    const res = await fetch(`${baseUrl}/payment/${paymentId}`, {
      headers: {
        "x-api-key": apiKey,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("[NOWPayments Status Check Error]:", err);
    return null;
  }
}
