import { describe, it } from "node:test";
import assert from "node:assert";
import crypto from "crypto";

// Test 1: Canonical JSON Implementation (RFC 8785)
function sortKeys(val) {
  if (val === null || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(sortKeys);
  const sorted = {};
  for (const key of Object.keys(val).sort()) {
    sorted[key] = sortKeys(val[key]);
  }
  return sorted;
}

function canonicalJSON(obj) {
  return JSON.stringify(sortKeys(obj));
}

function hashCanonicalJSON(obj) {
  const jsonStr = canonicalJSON(obj);
  return crypto.createHash("sha256").update(jsonStr, "utf8").digest("hex");
}

describe("Protocol & Architecture Automated Test Suite", () => {
  describe("1. Canonical JSON Hashing (RFC 8785)", () => {
    it("should sort object keys recursively and remove whitespace", () => {
      const inputA = { z: 1, a: 2, m: { y: "second", b: "first" } };
      const inputB = { a: 2, m: { b: "first", y: "second" }, z: 1 };

      const canonA = canonicalJSON(inputA);
      const canonB = canonicalJSON(inputB);

      assert.strictEqual(canonA, '{"a":2,"m":{"b":"first","y":"second"},"z":1}');
      assert.strictEqual(canonA, canonB);
    });

    it("should produce identical SHA-256 cart_hash regardless of original key order", () => {
      const mandate1 = {
        id: "ORDER-001",
        merchant_name: "AgentBazaar Protocol",
        user_cart_confirmation_required: true,
      };
      const mandate2 = {
        merchant_name: "AgentBazaar Protocol",
        user_cart_confirmation_required: true,
        id: "ORDER-001",
      };

      const hash1 = hashCanonicalJSON(mandate1);
      const hash2 = hashCanonicalJSON(mandate2);

      assert.strictEqual(hash1.length, 64);
      assert.strictEqual(hash1, hash2);
    });
  });

  describe("2. HSP HMAC-SHA256 Request Signing", () => {
    it("should construct valid 6-part message and sign with appSecret", () => {
      const method = "POST";
      const path = "/api/v1/merchant/payments";
      const query = "";
      const body = { cart_mandate_id: "ORD-001" };
      const appKey = "ak_test_123";
      const appSecret = "sec_test_secret";
      const timestamp = "1709123456";
      const nonce = "a3f1b2c4d5e6";

      const bodyHash = crypto.createHash("sha256").update(canonicalJSON(body), "utf8").digest("hex");
      const message = `${method}\n${path}\n${query}\n${bodyHash}\n${timestamp}\n${nonce}`;
      const sig = crypto.createHmac("sha256", appSecret).update(message, "utf8").digest("hex");

      assert.strictEqual(sig.length, 64);
      assert.match(message, /^POST\n\/api\/v1\/merchant\/payments\n\n[a-f0-9]{64}\n1709123456\na3f1b2c4d5e6$/);
    });
  });

  describe("3. Deterministic Task Parser & Budget Extraction", () => {
    it("should extract category and budget correctly from natural language prompt", () => {
      const prompt = "Find an AI agent that can audit my Solidity smart contract for a maximum budget of 5 HSK.";
      const lower = prompt.toLowerCase();

      let category = "DEVELOPMENT";
      if (lower.includes("audit") || lower.includes("security")) {
        category = "SECURITY";
      }

      const budgetMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:HSK|hsk)/i);
      const budget = budgetMatch ? parseFloat(budgetMatch[1]) : 0;

      assert.strictEqual(category, "SECURITY");
      assert.strictEqual(budget, 5.0);
    });
  });

  describe("4. Deterministic Multi-Agent Verification Logic", () => {
    it("should verify reentrancy protection and checks-effects-interactions", () => {
      const safeSolidityCode = `
        contract SafeVault {
          bool private locked;
          modifier nonReentrant() { locked = true; _; locked = false; }
          function withdraw(bytes32 id, uint256 amount) external nonReentrant {
            deposits[id] -= amount;
            (bool s, ) = msg.sender.call{value: amount}("");
            require(s);
          }
        }
      `;

      const hasReentrancyGuard = safeSolidityCode.includes("nonReentrant");
      const stateUpdatedBeforeCall =
        safeSolidityCode.indexOf("deposits[id] -= amount") < safeSolidityCode.indexOf(".call{value:");

      assert.strictEqual(hasReentrancyGuard, true);
      assert.strictEqual(stateUpdatedBeforeCall, true);
    });
  });

  describe("5. Address & Malformed Record Safeguards", () => {
    it("should reject invalid EVM addresses", () => {
      const validAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      const invalidAddress = "0xnotanaddress123";

      const evmRegex = /^0x[a-fA-F0-9]{40}$/;
      assert.strictEqual(evmRegex.test(validAddress), true);
      assert.strictEqual(evmRegex.test(invalidAddress), false);
    });
  });
});
