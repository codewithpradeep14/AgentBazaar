import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgentBySlug } from "@/lib/db";
import { 
  ShieldCheck, 
  Clock, 
  Coins, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles,
  ArrowRight,
  Layers
} from "lucide-react";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = await getAgentBySlug(slug);

  if (!agent) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-[#78716C]">
        <Link href="/marketplace" className="hover:text-[#1C1917]">
          Marketplace
        </Link>
        <span>/</span>
        <span className="text-[#1C1917]">{agent.name}</span>
      </div>

      {/* Hero Header */}
      <div className="p-8 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F5F2EB] text-[#57534E]">
                {agent.category}
              </span>
              {agent.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-[#EDF9F0] text-[#1B4332] border border-[#D8F3DC] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1B4332]" />
                  Verified on HashKey Chain
                </span>
              ) : (
                <span className="text-xs text-[#A8A29E] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D5]">
                  Self-Reported Identity
                </span>
              )}
            </div>

            <h1 className="text-3xl font-serif text-[#1C1917] tracking-tight">{agent.name}</h1>
            <p className="text-sm text-[#57534E] leading-relaxed max-w-2xl">
              {agent.shortDescription}
            </p>
          </div>

          {/* Pricing Card */}
          <div className="p-5 rounded border border-[#E5E0D5] bg-[#FAF8F5] shrink-0 text-right space-y-3 sm:w-56">
            <div>
              <div className="text-[11px] text-[#78716C] uppercase tracking-wide">Base Service Fee</div>
              <div className="text-2xl font-mono font-bold text-[#1C1917]">
                {agent.priceAmount} {agent.currency}
              </div>
              <div className="text-[10px] text-[#78716C]">Native HSK Settlement</div>
            </div>

            <div className="pt-2 border-t border-[#E5E0D5] text-[11px] text-[#57534E] space-y-1">
              <div className="flex justify-between">
                <span>Turnaround:</span>
                <span className="font-mono text-[#1C1917]">{agent.expectedTurnaround}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-mono text-[#1C1917]">{agent.completedJobs} jobs</span>
              </div>
              <div className="flex justify-between">
                <span>Rating:</span>
                <span className="font-mono text-[#1C1917]">★ {agent.rating.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href={`/tasks/create?agentId=${agent.id}&prompt=Hire+${encodeURIComponent(agent.name)}+for+task`}
              className="w-full py-2.5 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              Hire This Agent
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Identity & Verification Metadata */}
        <div className="pt-4 border-t border-[#EFECE6] flex flex-wrap items-center gap-4 text-xs text-[#78716C]">
          <div>
            <span className="text-[#A8A29E]">Agent Wallet: </span>
            <span className="font-mono text-[#1C1917]">{agent.walletAddress}</span>
          </div>
          <span>•</span>
          <div>
            <span className="text-[#A8A29E]">Verification: </span>
            <span className="text-[#1C1917]">{agent.verificationSource}</span>
          </div>
          <span>•</span>
          <div>
            <span className="text-[#A8A29E]">Execution: </span>
            <span className="font-mono text-[#1C1917]">{agent.endpointType}</span>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Full description & capabilities */}
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1C1917]">About Service Agent</h2>
            <p className="text-xs text-[#57534E] leading-relaxed whitespace-pre-line">
              {agent.fullDescription}
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[#1C1917]">Supported Capabilities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {agent.capabilities.map((cap, i) => (
                <div
                  key={i}
                  className="p-3 rounded border border-[#E5E0D5] bg-white flex items-center gap-2 text-xs text-[#1C1917]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#1B4332] shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Sample Deliverables */}
          {agent.sampleDeliverables && agent.sampleDeliverables.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-[#1C1917]">Verified Example Deliverables</h2>
              <div className="space-y-2">
                {agent.sampleDeliverables.map((sample, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded border border-[#E5E0D5] bg-[#FAF8F5] text-xs text-[#57534E] font-mono leading-relaxed"
                  >
                    {sample}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Technical Input/Output Specifications */}
        <div className="space-y-6">
          <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Technical Protocols
            </h3>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#1C1917]">Accepted Input Formats</div>
              <ul className="space-y-1">
                {agent.inputFormats.map((fmt, i) => (
                  <li key={i} className="text-xs text-[#57534E] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
                    {fmt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[#EFECE6] space-y-2">
              <div className="text-xs font-medium text-[#1C1917]">Output Artifacts</div>
              <ul className="space-y-1">
                {agent.outputFormats.map((fmt, i) => (
                  <li key={i} className="text-xs text-[#57534E] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]" />
                    {fmt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[#EFECE6] space-y-1 text-[11px] text-[#78716C]">
              <div>Settlement: <span className="text-[#1C1917]">HSP x402 Protocol v2</span></div>
              <div>Network: <span className="text-[#1C1917]">HashKey Chain Mainnet</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
