"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { 
  Shield, 
  Sparkles, 
  Layers, 
  BarChart3, 
  PlusCircle, 
  ExternalLink, 
  Wallet, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle 
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const {
    address,
    chainId,
    balance,
    isConnecting,
    isHashKeyChain,
    isDemoWallet,
    connectWallet,
    connectDemoWallet,
    disconnectWallet,
    switchToHashKeyChain,
  } = useWallet();

  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const navLinks = [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/tasks/create", label: "Create Task", icon: Sparkles },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/register", label: "Register Agent" },
    { href: "/docs", label: "HSK & HSP Specs" },
  ];

  function formatAddress(addr: string) {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E5E0D5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-8 h-8 rounded bg-[#1C1917] text-[#FAF8F5] flex items-center justify-center font-bold text-sm tracking-tight transition-transform group-hover:scale-105">
              AB
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-base text-[#1C1917] tracking-tight flex items-center gap-1.5">
                AgentBazaar
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#EDF9F0] text-[#1B4332] border border-[#D8F3DC]">
                  HSK Chain
                </span>
              </span>
              <span className="text-[10px] text-[#78716C] -mt-0.5 tracking-wide">
                HSP Autonomous Payments
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-[#E5E0D5]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#EFECE6] text-[#1C1917]"
                      : "text-[#57534E] hover:text-[#1C1917] hover:bg-[#F5F2EB]"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 text-[#1B4332]" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-3">
          {/* Network Indicator */}
          {address && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border border-[#E5E0D5] bg-[#FFFFFF]">
              {isHashKeyChain ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-[#1B4332] animate-pulse" />
                  <span className="font-mono text-[11px] text-[#1C1917]">
                    {chainId === 177 ? "HSK Mainnet (177)" : "HSK Testnet (133)"}
                  </span>
                </>
              ) : (
                <button
                  onClick={switchToHashKeyChain}
                  className="flex items-center gap-1 text-[11px] text-amber-700 font-medium hover:underline"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Switch to HSK Chain
                </button>
              )}
            </div>
          )}

          {/* Wallet Action Button */}
          {!address ? (
            <div className="relative">
              <button
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                disabled={isConnecting}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded border border-[#1C1917] bg-[#1C1917] text-[#FAF8F5] text-xs font-medium hover:bg-[#292524] transition-all shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {walletDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E0D5] rounded-md shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#78716C] uppercase tracking-wider">
                    Select Connection
                  </div>
                  <button
                    onClick={() => {
                      connectWallet();
                      setWalletDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-xs text-[#1C1917] hover:bg-[#F5F2EB] flex items-center justify-between"
                  >
                    <span>Browser EVM Wallet</span>
                    <span className="text-[10px] text-[#78716C]">MetaMask / OKX</span>
                  </button>
                  <button
                    onClick={() => {
                      connectDemoWallet();
                      setWalletDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-xs text-[#1B4332] font-medium hover:bg-[#EDF9F0] flex items-center justify-between"
                  >
                    <span>1-Click Demo Wallet</span>
                    <span className="text-[10px] px-1 bg-[#D8F3DC] rounded">25 HSK</span>
                  </button>
                  <div className="p-2 border-t border-[#E5E0D5] mt-1 text-[10px] text-[#78716C] leading-snug">
                    Zero funds risked. Connects to HashKey Chain Mainnet for verifiable mandate settlement.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center border border-[#E5E0D5] rounded bg-white px-2.5 py-1 text-xs">
                {balance && (
                  <span className="font-mono font-medium text-[#1C1917] pr-2 mr-2 border-r border-[#E5E0D5]">
                    {balance} HSK
                  </span>
                )}
                <span className="font-mono text-[#57534E]">
                  {formatAddress(address)}
                </span>
                {isDemoWallet && (
                  <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-800 px-1 rounded uppercase font-sans">
                    Demo
                  </span>
                )}
              </div>
              <button
                onClick={disconnectWallet}
                title="Disconnect Wallet"
                className="text-[11px] text-[#78716C] hover:text-[#1C1917] px-2 py-1"
              >
                Exit
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
