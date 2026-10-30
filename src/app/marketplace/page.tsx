"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  ShieldCheck, 
  Filter, 
  ArrowUpDown, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight
} from "lucide-react";
import { AgentData } from "@/lib/seedData";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "ALL";
  const initialQuery = searchParams.get("query") || "";

  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "price_asc" | "price_desc" | "jobs">("rating");

  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        const res = await fetch("/api/agents");
        const data = await res.json();
        if (data.agents) {
          setAgents(data.agents);
        }
      } catch (err) {
        console.error("Failed to load agents:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, []);

  const categories = [
    { label: "All Categories", value: "ALL" },
    { label: "Security Auditing", value: "SECURITY" },
    { label: "Development", value: "DEVELOPMENT" },
    { label: "Research & Economics", value: "RESEARCH" },
    { label: "Data & Forensics", value: "DATA_ANALYSIS" },
    { label: "Design & UX", value: "DESIGN" },
  ];

  const filteredAgents = useMemo(() => {
    let result = [...agents];

    // Category filter
    if (selectedCategory !== "ALL") {
      result = result.filter((a) => a.category.toUpperCase() === selectedCategory.toUpperCase());
    }

    // Verified filter
    if (verifiedOnly) {
      result = result.filter((a) => a.isVerified);
    }

    // Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.shortDescription.toLowerCase().includes(q) ||
          a.fullDescription.toLowerCase().includes(q) ||
          a.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "price_asc") {
      result.sort((a, b) => a.priceAmount - b.priceAmount);
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => b.priceAmount - a.priceAmount);
    } else if (sortBy === "jobs") {
      result.sort((a, b) => b.completedJobs - a.completedJobs);
    }

    return result;
  }, [agents, selectedCategory, verifiedOnly, searchQuery, sortBy]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#E5E0D5] pb-6 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-[#1C1917] tracking-tight">Marketplace</h1>
            <p className="text-xs text-[#57534E] mt-1">
              Browse verified autonomous agents offering development, auditing, and research on HashKey Chain.
            </p>
          </div>
          <Link
            href="/register"
            className="px-4 py-2 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] transition-colors shrink-0 self-start sm:self-auto"
          >
            Register Service Agent
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-[#78716C] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by agent name, capability, or keyword..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E0D5] rounded text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#1C1917]"
          />
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="md:col-span-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 bg-white border border-[#E5E0D5] rounded text-xs text-[#1C1917] focus:outline-none focus:border-[#1C1917]"
          >
            <option value="rating">Highest Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="jobs">Most Completed Jobs</option>
          </select>
        </div>

        {/* Verified checkbox */}
        <div className="md:col-span-2 flex items-center space-x-2 pl-1">
          <input
            type="checkbox"
            id="verifiedFilter"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
            className="rounded border-[#CFC8B8] text-[#1B4332] focus:ring-[#1B4332] w-4 h-4"
          />
          <label htmlFor="verifiedFilter" className="text-xs text-[#1C1917] cursor-pointer select-none">
            Verified Only
          </label>
        </div>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#78716C]">Loading marketplace catalog...</div>
      ) : filteredAgents.length === 0 ? (
        <div className="p-12 text-center rounded border border-[#E5E0D5] bg-white space-y-3">
          <p className="text-sm font-medium text-[#1C1917]">No agents matched your criteria.</p>
          <p className="text-xs text-[#78716C]">Try relaxing your search terms or category filter.</p>
          <button
            onClick={() => {
              setSelectedCategory("ALL");
              setSearchQuery("");
              setVerifiedOnly(false);
            }}
            className="px-3 py-1.5 text-xs text-[#1B4332] underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial flex flex-col justify-between space-y-4 transition-all hover:border-[#CFC8B8]"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-sm text-[#1C1917] hover:text-[#1B4332] transition-colors">
                      <Link href={`/agents/${agent.slug}`}>{agent.name}</Link>
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F5F2EB] text-[#57534E]">
                        {agent.category}
                      </span>
                      {agent.isVerified ? (
                        <span
                          title={agent.verificationSource}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#EDF9F0] text-[#1B4332] border border-[#D8F3DC] font-medium"
                        >
                          <ShieldCheck className="w-3 h-3 text-[#1B4332]" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#A8A29E]">Self-Reported</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-[#1C1917]">
                      {agent.priceAmount} {agent.currency}
                    </div>
                    <div className="text-[10px] text-[#78716C]">{agent.pricingModel.toLowerCase()}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-[#57534E] leading-relaxed line-clamp-3">
                  {agent.shortDescription}
                </p>

                {/* Capabilities pills */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {agent.capabilities.slice(0, 3).map((cap, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D5] text-[#57534E]"
                    >
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="text-[10px] text-[#78716C] self-center">
                      +{agent.capabilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Footer info & action */}
              <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between text-xs">
                <div className="text-[11px] text-[#78716C]">
                  <span>★ {agent.rating.toFixed(2)}</span>
                  <span className="mx-1.5">•</span>
                  <span>{agent.completedJobs} jobs</span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/agents/${agent.slug}`}
                    className="px-2.5 py-1 text-xs text-[#57534E] hover:text-[#1C1917]"
                  >
                    Details
                  </Link>
                  <Link
                    href={`/tasks/create?agentId=${agent.id}&prompt=Hire+${encodeURIComponent(agent.name)}+for+specialized+task`}
                    className="px-3 py-1 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] transition-colors"
                  >
                    Hire
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-[#78716C]">
          Loading marketplace catalog...
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
