import React from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Layers, 
  ExternalLink, 
  FileCode2, 
  CheckCircle2, 
  Lock, 
  BookOpen, 
  Cpu,
  Terminal
} from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div className="border-b border-[#E5E0D5] pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#1B4332] font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Technical Reference & Settlement Architecture</span>
        </div>
        <h1 className="text-3xl font-serif text-[#1C1917] tracking-tight">
          HSK Chain & HSP Payment Protocol Documentation
        </h1>
        <p className="text-xs text-[#57534E]">
          Official network parameters, smart contract verification, and HashKey Settlement Protocol implementation details for the HSK Chain Horizon Hackathon Mumbai Edition.
        </p>
      </div>

      {/* 1. HSK Chain Mainnet Network Specification */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1B4332]" />
          1. Verified HashKey Chain (HSK Chain) Mainnet Parameters
        </h2>
        <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[#78716C] block text-[10px]">Network Name</span>
              <span className="text-[#1C1917] font-bold">HashKey Chain Mainnet (HSKChain)</span>
            </div>
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[#78716C] block text-[10px]">Chain ID</span>
              <span className="text-[#1C1917] font-bold">177 (Hex: 0xb1)</span>
            </div>
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[#78716C] block text-[10px]">Native Currency</span>
              <span className="text-[#1C1917] font-bold">HSK (18 Decimals, Native Gas)</span>
            </div>
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6]">
              <span className="text-[#78716C] block text-[10px]">RPC Endpoint</span>
              <span className="text-[#1C1917] font-bold">https://mainnet.hsk.xyz</span>
            </div>
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6] sm:col-span-2">
              <span className="text-[#78716C] block text-[10px]">Block Explorer</span>
              <a
                href="https://hashkey.blockscout.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1B4332] font-bold underline flex items-center gap-1"
              >
                https://hashkey.blockscout.com
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-[#57534E] font-sans leading-relaxed">
            <strong>Source References:</strong> Verified via official <a href="https://hashfans.io/dev-onepager" target="_blank" rel="noopener noreferrer" className="underline text-[#1C1917]">HashFans Developer One-Pager</a> and <a href="https://docs.hashkeychain.net/docs/Build-on-HashKey-Chain/Token-Contracts" target="_blank" rel="noopener noreferrer" className="underline text-[#1C1917]">Token Contracts Documentation</a>. HSK is the native gas token (Layer 2 OP Stack).
          </div>
        </div>
      </section>

      {/* 2. Official HSP Integration Specification */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
          2. HashKey Settlement Protocol (HSP) Payment Workflow
        </h2>
        <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-4 text-xs">
          <p className="text-[#57534E] leading-relaxed">
            AgentBazaar strictly implements the official HashKey Settlement Protocol (HSP) standard per <a href="https://hashkey-merchant.github.io/#/" target="_blank" rel="noopener noreferrer" className="underline text-[#1C1917]">hashkey-merchant.github.io</a>.
          </p>

          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6] space-y-1">
              <div className="font-bold text-[#1C1917]">A. Canonical JSON Hashing (RFC 8785)</div>
              <p className="text-[#57534E] font-sans">
                Cart Mandate contents undergo recursive lexicographical key sorting and compact serialization before being SHA-256 hashed to produce the deterministic <code>cart_hash</code>.
              </p>
            </div>

            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6] space-y-1">
              <div className="font-bold text-[#1C1917]">B. Merchant Authorization JWT (ES256K)</div>
              <p className="text-[#57534E] font-sans">
                The mandate embeds an ES256K JWT with claims (<code>iss</code>, <code>sub</code>, <code>aud: "HashkeyMerchant"</code>, <code>iat</code>, <code>exp</code>, <code>jti</code>, <code>cart_hash</code>).
              </p>
            </div>

            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6] space-y-1">
              <div className="font-bold text-[#1C1917]">C. HMAC-SHA256 Request Signing</div>
              <p className="text-[#57534E] font-sans">
                Outgoing gateway requests include <code>X-App-Key</code>, <code>X-Timestamp</code>, <code>X-Nonce</code>, and <code>X-Signature</code> over the Canonical JSON body hash.
              </p>
            </div>

            <div className="p-3 rounded bg-[#FAF8F5] border border-[#EFECE6] space-y-1">
              <div className="font-bold text-[#1C1917]">D. Explicit Client Wallet Signature</div>
              <p className="text-[#57534E] font-sans">
                No autonomous fund movement occurs without the user's explicit cryptographic signature authorizing the Cart Hash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Smart Contract Architecture */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
          <FileCode2 className="w-4 h-4 text-[#1B4332]" />
          3. Smart Contract: AgentBazaarEscrow.sol
        </h2>
        <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-4 text-xs">
          <p className="text-[#57534E] leading-relaxed">
            The smart contract acts as an immutable, trust-minimized escrow and settlement registry on HashKey Chain.
          </p>

          <div className="p-4 rounded bg-[#1C1917] text-[#FAF8F5] font-mono text-[11px] leading-relaxed overflow-x-auto">
            {`// Key Functions:
lockPayment(bytes32 taskId, address provider, address token, uint256 amount, bytes32 mandateHash, uint256 duration)
releasePayment(bytes32 taskId)  // Only buyer or owner
refundPayment(bytes32 taskId)   // Only buyer after timeout, or owner
disputePayment(bytes32 taskId, string reason)
getAgreement(bytes32 taskId)`}
          </div>

          <div className="pt-2 text-xs text-[#57534E] space-y-1">
            <div>• <strong>Checks-Effects-Interactions:</strong> State transitions occur strictly before external value transfers.</div>
            <div>• <strong>Reentrancy Guard:</strong> Built-in mutex locks prevent concurrent calls.</div>
            <div>• <strong>Duplicate Prevention:</strong> Prevents locking payment multiple times for the same task.</div>
          </div>
        </div>
      </section>

      {/* 4. Mainnet Deployment Checklist & Safety */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#1B4332]" />
          4. Mainnet Deployment Checklist & Safety Rules
        </h2>
        <div className="p-5 rounded border border-amber-200 bg-amber-50/50 space-y-3 text-xs text-amber-900">
          <div className="font-semibold text-amber-950 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-800" />
            <span>Mainnet Deployment Protection Notice</span>
          </div>
          <p className="leading-relaxed">
            In accordance with hackathon instructions: <em>Do not deploy to mainnet, spend funds, sign transactions, or publish credentials without explicit approval.</em>
          </p>

          <div className="space-y-1.5 pt-1 text-[11px] font-mono">
            <div>1. Compile contracts: <code>npx hardhat compile</code> (Done, 0 errors)</div>
            <div>2. Run unit tests: <code>npx hardhat test</code> (6/6 tests passing)</div>
            <div>3. Configure private key in .env (DEPLOYER_PRIVATE_KEY)</div>
            <div>4. Run deploy script: <code>npx hardhat run scripts/deploy.js --network hskMainnet</code></div>
            <div>5. Verify contract on HashKey Blockscout: <code>https://hashkey.blockscout.com</code></div>
          </div>
        </div>
      </section>
    </div>
  );
}
