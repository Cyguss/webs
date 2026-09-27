import crypto from "crypto";

export interface CreatePaymentParams {
  amount: string;
  currency: string;
  orderId: string;
  urlReturn: string;
  urlCallback: string;
}

export interface CryptomusPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
}

function getCryptomusConfig() {
  const merchantId = (process.env.CRYPTOMUS_MERCHANT_ID || "").trim();
  const paymentKey = (process.env.CRYPTOMUS_PAYMENT_KEY || "").trim();
  const payoutKey = (process.env.CRYPTOMUS_PAYOUT_KEY || "").trim();

  return { merchantId, paymentKey, payoutKey };
}

/**
 * Generates Cryptomus API request signature:
 * sign = md5(base64_encode(json_encode(data)) + API_KEY)
 */
export function generateCryptomusSignature(payload: any, apiKey: string): string {
  const jsonString = JSON.stringify(payload);
  const base64Data = Buffer.from(jsonString).toString("base64");
  return crypto.createHash("md5").update(base64Data + apiKey).digest("hex");
}

/**
 * Verifies inbound Cryptomus Webhook signature:
 */
export function verifyCryptomusWebhook(rawBody: string, receivedSign: string, apiKey: string): boolean {
  if (!rawBody || !receivedSign || !apiKey) return false;
  try {
    const parsed = JSON.parse(rawBody);
    // Remove sign if present in body before computing
    const { sign, ...dataWithoutSign } = parsed;
    const computedSign = generateCryptomusSignature(dataWithoutSign, apiKey);
    return computedSign.toLowerCase() === receivedSign.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Creates a Cryptomus hosted checkout invoice:
 */
export async function createCryptomusPayment(params: CreatePaymentParams): Promise<CryptomusPaymentResponse> {
  const { merchantId, paymentKey } = getCryptomusConfig();

  if (!merchantId || !paymentKey) {
    return {
      success: false,
      error: "Cryptomus configuration missing: CRYPTOMUS_MERCHANT_ID and CRYPTOMUS_PAYMENT_KEY must be set in .env.local",
    };
  }

  const payload = {
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    order_id: params.orderId,
    url_return: params.urlReturn,
    url_callback: params.urlCallback,
    is_payment_multiple: false,
    lifetime: 3600, // 1 hour
  };

  const signature = generateCryptomusSignature(payload, paymentKey);

  try {
    const response = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: merchantId,
        sign: signature,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.state === 0 && data.result?.url) {
      return {
        success: true,
        paymentUrl: data.result.url,
        paymentId: data.result.uuid,
      };
    }

    const errMsg = data.message || (typeof data.errors === "object" ? JSON.stringify(data.errors) : "Cryptomus payment creation failed");
    return {
      success: false,
      error: errMsg,
    };
  } catch (err: any) {
    console.error("[Cryptomus API Error]:", err);
    return {
      success: false,
      error: err.message || "Network error connecting to Cryptomus API",
    };
  }
}

/**
 * Creates an automatic crypto payout via Cryptomus Payout API:
 */
export async function createCryptomusPayout(params: {
  amount: string;
  currency: string;
  orderId: string;
  address: string;
  network?: string;
}) {
  const { merchantId, payoutKey } = getCryptomusConfig();

  if (!merchantId || !payoutKey) {
    throw new Error("Cryptomus payout keys not configured in environment");
  }

  const payload = {
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    order_id: params.orderId,
    address: params.address,
    is_subtract: 1,
    network: params.network,
    url_callback: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/crypto/payout`,
  };

  const signature = generateCryptomusSignature(payload, payoutKey);

  const response = await fetch("https://api.cryptomus.com/v1/payout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      merchant: merchantId,
      sign: signature,
    },
    body: JSON.stringify(payload),
  });

  return await response.json();
}
