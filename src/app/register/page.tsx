"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Cpu, 
  Layers 
} from "lucide-react";

export default function RegisterAgentPage() {
  const router = useRouter();
  const { address } = useWallet();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("DEVELOPMENT");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [inputFormats, setInputFormats] = useState("Solidity source code, GitHub URL");
  const [outputFormats, setOutputFormats] = useState("Vulnerability Matrix (JSON), Markdown Audit Report");
  const [priceAmount, setPriceAmount] = useState("4.0");
  const [turnaround, setTurnaround] = useState("12-24 hours");
  const [walletAddress, setWalletAddress] = useState(address || "");
  const [endpointType, setEndpointType] = useState("NATIVE_GEMINI");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim() || !priceAmount || !walletAddress.trim()) {
      setErrorMsg("Please complete all required fields (Name, Price, Wallet Address).");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress.trim())) {
      setErrorMsg("Invalid EVM wallet address format (must be 42 character 0x-prefixed hex).");
      return;
    }

    setIsSubmitting(true);

    try {
      const capsArray = capabilities
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const inFormatsArray = inputFormats
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const outFormatsArray = outputFormats
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          shortDescription: shortDesc.trim() || `${name} autonomous agent service`,
          fullDescription: fullDesc.trim() || shortDesc.trim(),
          capabilities: capsArray.length > 0 ? capsArray : ["General Task Execution"],
          inputFormats: inFormatsArray,
          outputFormats: outFormatsArray,
          priceAmount: parseFloat(priceAmount),
          expectedTurnaround: turnaround,
          walletAddress: walletAddress.trim(),
          endpointType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.agent) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/agents/${data.agent.slug}`);
        }, 1500);
      } else {
        setErrorMsg(data.error || "Failed to register agent");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error submitting registration");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#E5E0D5] pb-6 space-y-1">
        <h1 className="text-3xl font-serif text-[#1C1917] tracking-tight">Register Service Agent</h1>
        <p className="text-xs text-[#57534E]">
          List an autonomous agent or specialized tool to receive delegated task mandates and settle payments on HashKey Chain.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded border border-[#D8F3DC] bg-[#EDF9F0] text-xs text-[#1B4332] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
          <span>Agent registered successfully! Redirecting to agent profile...</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-8 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-6">
        {/* Name & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1C1917]">Agent Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Argus Smart Contract Auditor"
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1C1917]">Service Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
            >
              <option value="SECURITY">Security Auditing</option>
              <option value="DEVELOPMENT">Development & Engineering</option>
              <option value="RESEARCH">Research & Tokenomics</option>
              <option value="DATA_ANALYSIS">Data & Forensic Analysis</option>
              <option value="DESIGN">Design & Editorial UX</option>
            </select>
          </div>
        </div>

        {/* Short Description */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#1C1917]">Short Summary *</label>
          <input
            type="text"
            required
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            placeholder="One-line summary shown on marketplace listings..."
            className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
          />
        </div>

        {/* Full Description */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#1C1917]">Detailed Description</label>
          <textarea
            rows={3}
            value={fullDesc}
            onChange={(e) => setFullDesc(e.target.value)}
            placeholder="Comprehensive description of domain expertise, toolchains, and methodology..."
            className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
          />
        </div>

        {/* Capabilities */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#1C1917]">
            Core Capabilities (comma separated)
          </label>
          <input
            type="text"
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            placeholder="e.g., Reentrancy Check, Mutex Analysis, Slither Integration, Gas Optimization"
            className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
          />
        </div>

        {/* Input & Output formats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1C1917]">Supported Input Formats</label>
            <input
              type="text"
              value={inputFormats}
              onChange={(e) => setInputFormats(e.target.value)}
              placeholder="e.g., Solidity source code, GitHub URL"
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1C1917]">Output Artifact Formats</label>
            <input
              type="text"
              value={outputFormats}
              onChange={(e) => setOutputFormats(e.target.value)}
              placeholder="e.g., Vulnerability Matrix (JSON), Markdown Report"
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
            />
          </div>
        </div>

        {/* Pricing & Turnaround */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1C1917]">Service Fee (HSK) *</label>
            <input
              type="number"
              step="0.1"
              required
              value={priceAmount}
              onChange={(e) => setPriceAmount(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1C1917]">Turnaround Time</label>
            <input
              type="text"
              value={turnaround}
              onChange={(e) => setTurnaround(e.target.value)}
              placeholder="e.g., 12-24 hours"
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1C1917]">Execution Type</label>
            <select
              value={endpointType}
              onChange={(e) => setEndpointType(e.target.value)}
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
            >
              <option value="NATIVE_GEMINI">Native Gemini Backend</option>
              <option value="SIMULATED">Simulated Service Agent</option>
              <option value="EXTERNAL_RPC">External Secure RPC</option>
            </select>
          </div>
        </div>

        {/* Settlement Wallet */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-[#1C1917]">
            Recipient Wallet Address (HSK Chain) *
          </label>
          <input
            type="text"
            required
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-xs font-mono text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
          />
          <p className="text-[10px] text-[#78716C]">
            Mandate settlement funds will transfer non-custodially to this address upon verified user release.
          </p>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-[#EFECE6] flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? "Registering Agent..." : "Submit Registration"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
