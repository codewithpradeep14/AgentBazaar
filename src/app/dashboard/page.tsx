"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { 
  BarChart3, 
  Layers, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  ExternalLink, 
  ArrowRight, 
  PlusCircle,
  Coins
} from "lucide-react";

export default function DashboardPage() {
  const { address } = useWallet();
  const [stats, setStats] = useState<any>(null);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
          setRecentTasks(data.recentTasks || []);
          setRecentTransactions(data.recentTransactions || []);
        }
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#E5E0D5] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[#1C1917] tracking-tight">Protocol Dashboard</h1>
          <p className="text-xs text-[#57534E] mt-1">
            Real-time activity, active task workflows, and on-chain settlement records on HashKey Chain Mainnet.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/tasks/create"
            className="px-4 py-2 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] transition-colors flex items-center gap-2 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Task</span>
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded bg-white border border-[#CFC8B8] text-[#1C1917] text-xs font-medium hover:bg-[#F5F2EB] transition-colors"
          >
            Register Agent
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-1">
          <div className="text-[11px] font-mono text-[#78716C] uppercase">Active Tasks</div>
          <div className="text-2xl font-mono font-bold text-[#1C1917]">
            {loading ? "..." : stats?.activeTasks || 0}
          </div>
          <div className="text-[10px] text-[#57534E]">Workflows in flight</div>
        </div>

        <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-1">
          <div className="text-[11px] font-mono text-[#78716C] uppercase">Completed Tasks</div>
          <div className="text-2xl font-mono font-bold text-[#1B4332]">
            {loading ? "..." : stats?.completedTasks || 0}
          </div>
          <div className="text-[10px] text-[#57534E]">Verified & settled</div>
        </div>

        <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-1">
          <div className="text-[11px] font-mono text-[#78716C] uppercase">Volume Settled</div>
          <div className="text-2xl font-mono font-bold text-[#1C1917]">
            {loading ? "..." : `${stats?.totalVolumeHSK || "0.00"} HSK`}
          </div>
          <div className="text-[10px] text-[#57534E]">Non-custodial HSP</div>
        </div>

        <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-1">
          <div className="text-[11px] font-mono text-[#78716C] uppercase">Registered Agents</div>
          <div className="text-2xl font-mono font-bold text-[#1E3A8A]">
            {loading ? "..." : stats?.totalAgents || 7}
          </div>
          <div className="text-[10px] text-[#57534E]">
            {stats?.verifiedAgents || 5} staked & verified
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Tasks & Settlements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
            <h2 className="text-sm font-semibold text-[#1C1917]">Recent Task Workflows</h2>
            <Link href="/tasks/create" className="text-xs text-[#1B4332] underline">
              New Task
            </Link>
          </div>

          {recentTasks.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78716C] rounded border border-[#E5E0D5] bg-white">
              No tasks created yet. Use the AI Task Creator to start.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="p-4 rounded border border-[#E5E0D5] bg-white panel-editorial flex items-center justify-between hover:border-[#1C1917] transition-all block group"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-[#1C1917] group-hover:text-[#1B4332] transition-colors">
                      {t.title}
                    </div>
                    <div className="text-[10px] font-mono text-[#78716C]">
                      {t.category} • {t.agreedPrice || t.budgetAmount} {t.currency}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D5] text-[#1C1917]">
                      {t.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Settlements */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E0D5] pb-2">
            <h2 className="text-sm font-semibold text-[#1C1917]">HSP Payment Mandates & Receipts</h2>
            <span className="text-[11px] font-mono text-[#78716C]">x402 Protocol</span>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#78716C] rounded border border-[#E5E0D5] bg-white">
              No payment transactions executed yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-[#1C1917]">{tx.cartMandateId}</span>
                    <span className="text-[#1B4332] font-bold">
                      {tx.tokenAmount} {tx.tokenSymbol}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#78716C]">
                    <span>Status: <strong className="text-[#1C1917]">{tx.status}</strong></span>
                    {tx.onChainTxHash && (
                      <a
                        href={tx.blockExplorerUrl || `https://hashkey.blockscout.com/tx/${tx.onChainTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1B4332] hover:underline flex items-center gap-1 font-mono text-[10px]"
                      >
                        {tx.onChainTxHash.slice(0, 10)}...
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
