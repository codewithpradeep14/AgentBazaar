import React from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck, Terminal, BookOpen, Layers } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E0D5] bg-[#F5F2EB]/60 mt-24 text-xs text-[#57534E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Hackathon */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-[#1C1917]">AgentBazaar</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EDF9F0] text-[#1B4332] border border-[#D8F3DC]">
                Horizon Mumbai
              </span>
            </div>
            <p className="text-[#78716C] leading-relaxed">
              The marketplace where autonomous AI agents discover services, coordinate task workflows, and settle payments under verified human authorization.
            </p>
            <div className="text-[11px] text-[#78716C] pt-1">
              HSK Chain Horizon Hackathon Mumbai Edition
            </div>
          </div>

          {/* Col 2: HashKey Chain Network */}
          <div className="space-y-2">
            <div className="font-medium text-[#1C1917] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#1B4332]" />
              HashKey Chain Mainnet
            </div>
            <ul className="space-y-1.5 font-mono text-[11px]">
              <li>Chain ID: <span className="text-[#1C1917]">177 (0xb1)</span></li>
              <li>Currency: <span className="text-[#1C1917]">HSK (18 Decimals)</span></li>
              <li>RPC: <span className="text-[#1C1917]">mainnet.hsk.xyz</span></li>
              <li>
                <a
                  href="https://hashkey.blockscout.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1C1917] flex items-center gap-1 underline underline-offset-2"
                >
                  Blockscout Explorer
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: HashKey Settlement Protocol (HSP) */}
          <div className="space-y-2">
            <div className="font-medium text-[#1C1917] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1B4332]" />
              HSP Payment Protocol
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>x402 Protocol v2 (RFC 8785 Canonical JSON)</li>
              <li>ES256K ECDSA Merchant JWTs</li>
              <li>Client Non-Custodial Authorizations</li>
              <li>
                <a
                  href="https://hashkey-merchant.github.io/#/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1C1917] flex items-center gap-1 underline underline-offset-2"
                >
                  Official HSP API Documentation
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Quick Links & Dev Resources */}
          <div className="space-y-2">
            <div className="font-medium text-[#1C1917] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#1B4332]" />
              Developer Resources
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <a
                  href="https://hashfans.io/dev-onepager"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1C1917] flex items-center gap-1"
                >
                  HashFans Developer One-Pager
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.hashkeychain.net/docs/Build-on-HashKey-Chain/Token-Contracts"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1C1917] flex items-center gap-1"
                >
                  HSK Chain Token Contracts
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/+LBRNQQKVmo83OTg1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#1C1917] flex items-center gap-1"
                >
                  HSK Chain Telegram Dev Group
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <Link href="/docs" className="hover:text-[#1C1917]">
                  Architecture & Settlement Specs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E5E0D5] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#78716C] gap-3">
          <div>
            © 2026 AgentBazaar. Built for the HSK Chain Horizon Hackathon Mumbai Edition. Non-custodial settlement.
          </div>
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center gap-1 text-[#1B4332] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
              HashKey Mainnet Ready
            </span>
            <span>Gemini 2.5 AI Layer</span>
            <span>HSP x402 Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
