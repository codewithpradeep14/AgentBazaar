import crypto from "crypto";

/**
 * RFC 8785 Canonical JSON implementation for HSP Cart Mandates and HMAC body hashes.
 * Rules:
 * 1. Object keys sorted lexicographically before stringify
 * 2. Arrays preserve element order
 * 3. Compact serialization (no extra whitespace)
 * 4. Identical semantics -> identical canonical string
 */

export function sortKeys(val: any): any {
  if (val === null || typeof val !== "object") {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(sortKeys);
  }
  const sorted: Record<string, any> = {};
  for (const key of Object.keys(val).sort()) {
    sorted[key] = sortKeys(val[key]);
  }
  return sorted;
}

export function canonicalJSON(obj: any): string {
  return JSON.stringify(sortKeys(obj));
}

/**
 * Computes the SHA-256 hex digest of the canonical JSON representation of an object.
 */
export function hashCanonicalJSON(obj: any): string {
  const jsonStr = canonicalJSON(obj);
  return crypto.createHash("sha256").update(jsonStr, "utf8").digest("hex");
}
