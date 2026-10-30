import crypto from "crypto";
import { canonicalJSON, hashCanonicalJSON } from "./canonicalJson";

export interface HSPMethodData {
  supported_methods: string;
  data: {
    x402Version: number;
    network: string;
    chain_id: number;
    contract_address: string;
    pay_to: string;
    coin: string;
  };
}

export interface HSPDisplayItem {
  label: string;
  amount: {
    currency: string; // must be USD
    value: string;
  };
}

export interface HSPModifier {
  supported_methods: string;
  data?: {
    method_data_indexes: number[];
  };
  additional_display_items: HSPDisplayItem[];
  total?: {
    label: string;
    amount: {
      currency: string;
      value: string;
    };
  };
}

export interface HSPCartMandateContents {
  id: string; // cart_mandate_id (ID1)
  user_cart_confirmation_required: boolean;
  payment_request: {
    method_data: HSPMethodData[];
    details: {
      id: string; // payment_request_id (ID2)
      display_items?: HSPDisplayItem[];
      total: {
        label: string;
        amount: {
          currency: string;
          value: string;
        };
      };
      modifiers?: HSPModifier[];
    };
  };
  cart_expiry: string; // RFC 3339
  merchant_name: string;
}

export interface HSPCartMandate {
  contents: HSPCartMandateContents;
  merchant_authorization: string; // ES256K JWT
  cart_hash: string;
}

export interface HSPOrderRequest {
  cart_mandate: {
    contents: HSPCartMandateContents;
    merchant_authorization: string;
  };
  redirect_url?: string;
}

export interface HSPPaymentRecord {
  content_id: string;
  payment_request_id: string;
  flow_id: string;
  app_key: string;
  status:
    | "payment-required"
    | "payment-submitted"
    | "payment-verified"
    | "payment-processing"
    | "payment-included"
    | "payment-safe"
    | "payment-finalized"
    | "payment-failed";
  status_reason?: string;
  pay_amount: string;
  token: string;
  token_address: string;
  payer_address?: string;
  to_pay_address: string;
  chain: string;
  network: string;
  tx_signature?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * Creates an official HSP Cart Mandate payload for a task.
 */
export function buildCartMandate(params: {
  taskId: string;
  agentName: string;
  providerAddress: string;
  tokenAmount: number; // in HSK
  tokenSymbol?: string;
  usdRate?: number; // exchange rate to USD
  network?: string;
  chainId?: number;
  contractAddress?: string;
  expiryMinutes?: number;
}): { mandate: HSPCartMandate; payload: HSPOrderRequest } {
  const {
    taskId,
    agentName,
    providerAddress,
    tokenAmount,
    tokenSymbol = "HSK",
    usdRate = 1.0, // Default 1 HSK = $1.00 USD
    network = "hsk-mainnet",
    chainId = 177,
    contractAddress = "0x0000000000000000000000000000000000000000",
    expiryMinutes = 120, // 2 hours standard
  } = params;

  const now = new Date();
  const expiryDate = new Date(now.getTime() + expiryMinutes * 60 * 1000);

  const cartMandateId = `ORD-HSK-${taskId.slice(-8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const paymentRequestId = `PAY-REQ-${taskId.slice(-8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

  const usdValue = (tokenAmount * usdRate).toFixed(2);

  const contents: HSPCartMandateContents = {
    id: cartMandateId,
    user_cart_confirmation_required: true,
    payment_request: {
      method_data: [
        {
          supported_methods: "https://www.x402.org/",
          data: {
            x402Version: 2,
            network: network,
            chain_id: chainId,
            contract_address: contractAddress,
            pay_to: providerAddress,
            coin: tokenSymbol,
          },
        },
      ],
      details: {
        id: paymentRequestId,
        display_items: [
          {
            label: `AI Service: ${agentName}`,
            amount: {
              currency: "USD",
              value: usdValue,
            },
          },
        ],
        total: {
          label: "Total Service Fee",
          amount: {
            currency: "USD",
            value: usdValue,
          },
        },
      },
    },
    cart_expiry: expiryDate.toISOString(),
    merchant_name: process.env.HSP_MERCHANT_NAME || "AgentBazaar Protocol",
  };

  // Compute Canonical JSON SHA-256 hash per RFC 8785
  const cartHash = hashCanonicalJSON(contents);

  // Generate ES256K JWT
  const merchantAuthorization = generateMerchantJWT(contents.merchant_name, cartHash, expiryDate);

  const mandate: HSPCartMandate = {
    contents,
    merchant_authorization: merchantAuthorization,
    cart_hash: cartHash,
  };

  const payload: HSPOrderRequest = {
    cart_mandate: {
      contents,
      merchant_authorization: merchantAuthorization,
    },
    redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tasks/${taskId}?payment=complete`,
  };

  return { mandate, payload };
}

/**
 * Creates merchant ES256K JWT signed with merchant key or development fallback.
 */
function generateMerchantJWT(merchantName: string, cartHash: string, expiryDate: Date): string {
  const header = {
    alg: "ES256K",
    typ: "JWT",
  };

  const claims = {
    iss: merchantName,
    sub: merchantName,
    aud: "HashkeyMerchant",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(expiryDate.getTime() / 1000),
    jti: `JWT-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    cart_hash: cartHash,
  };

  const base64Url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const unsignedToken = `${base64Url(header)}.${base64Url(claims)}`;

  // In production with private key, sign with ES256K ECDSA secp256k1
  const privateKeyPem = process.env.HSP_MERCHANT_PRIVATE_KEY;
  if (privateKeyPem) {
    try {
      const sign = crypto.createSign("SHA256");
      sign.update(unsignedToken);
      const signature = sign.sign({ key: privateKeyPem, dsaEncoding: "ieee-p1363" });
      const sigB64 = signature.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      return `${unsignedToken}.${sigB64}`;
    } catch {
      // Fallback
    }
  }

  // Development / sandbox signature
  const mockSig = crypto
    .createHmac("sha256", process.env.HSP_APP_SECRET || "agentbazaar-secret")
    .update(unsignedToken)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsignedToken}.${mockSig}`;
}

/**
 * Signs an outgoing merchant HTTP request with HMAC-SHA256 per official HSP specification.
 */
export function signHSPMerchantRequest(params: {
  method: string;
  path: string;
  query?: string;
  body?: any;
  appKey: string;
  appSecret: string;
}): {
  headers: Record<string, string>;
  message: string;
  signature: string;
} {
  const { method, path, query = "", body, appKey, appSecret } = params;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString("hex");

  // Step 1: Body Hash
  let bodyHash = "";
  if (body) {
    const canonical = canonicalJSON(body);
    bodyHash = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  }

  // Step 2: Message string = "{METHOD}\n{PATH}\n{QUERY}\n{bodyHash}\n{timestamp}\n{nonce}"
  const message = `${method.toUpperCase()}\n${path}\n${query}\n${bodyHash}\n${timestamp}\n${nonce}`;

  // Step 3: HMAC-SHA256 signature
  const signature = crypto.createHmac("sha256", appSecret).update(message, "utf8").digest("hex");

  return {
    headers: {
      "Content-Type": "application/json",
      "X-App-Key": appKey,
      "X-Timestamp": timestamp,
      "X-Nonce": nonce,
      "X-Signature": signature,
    },
    message,
    signature,
  };
}
