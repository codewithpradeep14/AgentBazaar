"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/context/WalletContext";
import { 
  ShieldCheck, 
  Clock, 
  Coins, 
  FileText, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Play, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  Lock, 
  ArrowRight,
  Code,
  Terminal,
  FileCheck2
} from "lucide-react";

export default function TaskWorkspacePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { address, signMandateAuthorization, isHashKeyChain, switchToHashKeyChain } = useWallet();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Payment states
  const [isSigning, setIsSigning] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Multi-agent execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Review states
  const [isReviewing, setIsReviewing] = useState(false);

  async function loadTask() {
    try {
      const res = await fetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (data.task) {
        setTask(data.task);
      } else {
        setErrorMsg("Task not found");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load task");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  // Handle Authorizing Payment via HSP Protocol
  async function handleAuthorizePayment() {
    if (!task?.paymentMandate) {
      setErrorMsg("No payment mandate found for this task.");
      return;
    }

    setIsSigning(true);
    setErrorMsg(null);

    try {
      // Step 1: Request client wallet signature over Cart Mandate hash
      const cartHash = task.paymentMandate.cartHash;
      const signature = await signMandateAuthorization(cartHash);

      // Step 2: Submit authorized mandate to HSP Gateway
      const res = await fetch("/api/hsp/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: id,
          payerAddress: address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          signature,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPaymentSuccess(true);
        await loadTask(); // Reload task to show updated status
      } else {
        setErrorMsg(data.error || "Payment submission failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign payment mandate authorization");
    } finally {
      setIsSigning(false);
    }
  }

  // Handle Triggering Multi-Agent Coordination Pipeline
  async function handleExecuteMultiAgentPipeline() {
    setIsExecuting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/tasks/${id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.workflowResult) {
        setExecutionResult(data.workflowResult);
        await loadTask(); // Reload task with deliverable
      } else {
        setErrorMsg(data.error || "Multi-agent execution failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to run agent execution");
    } finally {
      setIsExecuting(false);
    }
  }

  // Handle Final Buyer Acceptance & Settlement Release
  async function handleCompleteTask() {
    setIsReviewing(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          actorType: "BUYER",
          actorName: "Buyer Reviewer",
          logMessage: "Buyer verified deliverables and accepted completed work. Settlement finalized on HashKey Chain.",
        }),
      });
      const data = await res.json();
      if (data.task) {
        await loadTask();
      }
    } catch (err) {
      console.error("Complete task error:", err);
    } finally {
      setIsReviewing(false);
    }
  }

  if (loading) {
    return <div className="py-24 text-center text-xs text-[#78716C]">Loading task workspace...</div>;
  }

  if (!task) {
    return (
      <div className="py-24 text-center space-y-3">
        <p className="text-sm font-medium text-[#1C1917]">{errorMsg || "Task not found."}</p>
        <Link href="/dashboard" className="text-xs text-[#1B4332] underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const deliverables = (() => {
    try {
      return JSON.parse(task.requiredDeliverables);
    } catch {
      return [task.requiredDeliverables];
    }
  })();

  const acceptanceCriteria = (() => {
    try {
      return JSON.parse(task.acceptanceCriteria);
    } catch {
      return [task.acceptanceCriteria];
    }
  })();

  // State Machine Step Visualizer
  const stateSteps = [
    { key: "DRAFT", label: "Draft" },
    { key: "OFFER_SELECTED", label: "Agent Selected" },
    { key: "AWAITING_PAYMENT_AUTHORIZATION", label: "Mandate Ready" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "DELIVERABLE_SUBMITTED", label: "Deliverable Ready" },
    { key: "COMPLETED", label: "Completed & Settled" },
  ];

  const currentStepIdx = stateSteps.findIndex((s) => s.key === task.status);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-[#78716C]">
        <Link href="/dashboard" className="hover:text-[#1C1917]">Dashboard</Link>
        <span>/</span>
        <span className="text-[#1C1917]">Task #{task.id.slice(-8)}</span>
      </div>

      {/* Header Panel */}
      <div className="p-6 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F5F2EB] text-[#57534E]">
                {task.category}
              </span>
              <span className="text-xs font-mono text-[#78716C]">
                Task ID: {task.id}
              </span>
            </div>
            <h1 className="text-2xl font-serif text-[#1C1917] tracking-tight">{task.title}</h1>
          </div>

          <div className="text-right shrink-0">
            <div className="font-mono font-bold text-xl text-[#1C1917]">
              {task.agreedPrice || task.budgetAmount} {task.currency}
            </div>
            <div className="text-[10px] text-[#78716C]">HashKey Chain Settlement</div>
          </div>
        </div>

        {/* State Machine Pipeline Progress Bar */}
        <div className="pt-4 border-t border-[#EFECE6] space-y-2">
          <div className="text-[11px] font-medium text-[#78716C] uppercase tracking-wider">
            Task State Machine
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {stateSteps.map((step, i) => {
              const isPast = currentStepIdx >= i;
              const isCurrent = task.status === step.key;
              return (
                <div
                  key={step.key}
                  className={`p-2 rounded border text-center text-xs transition-all ${
                    isCurrent
                      ? "border-[#1B4332] bg-[#EDF9F0] text-[#1B4332] font-semibold"
                      : isPast
                      ? "border-[#E5E0D5] bg-[#FAF8F5] text-[#1C1917]"
                      : "border-[#EFECE6] text-[#A8A29E] bg-white opacity-60"
                  }`}
                >
                  <div className="text-[10px] font-mono">0{i + 1}</div>
                  <div className="truncate text-[11px]">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (7 cols): Task Requirements, Deliverables, Multi-agent pipeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Natural Language Prompt */}
          <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Original Intent
            </h2>
            <p className="text-xs text-[#57534E] leading-relaxed italic bg-[#FAF8F5] p-3 rounded border border-[#EFECE6]">
              "{task.naturalLanguagePrompt}"
            </p>
          </div>

          {/* Deliverables & Acceptance Criteria */}
          <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Acceptance & Verification Requirements
            </h2>

            <div className="space-y-2">
              <div className="text-xs font-medium text-[#1C1917]">Required Deliverables</div>
              <ul className="space-y-1">
                {deliverables.map((item: string, i: number) => (
                  <li key={i} className="text-xs text-[#57534E] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[#EFECE6] space-y-2">
              <div className="text-xs font-medium text-[#1C1917]">Formal Acceptance Criteria</div>
              <ul className="space-y-1">
                {acceptanceCriteria.map((item: string, i: number) => (
                  <li key={i} className="text-xs text-[#57534E] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Multi-Agent Execution Section */}
          <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C] flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#1B4332]" />
                  Multi-Agent Execution Pipeline
                </h2>
                <p className="text-[11px] text-[#78716C] mt-0.5">
                  Coding Agent → Deterministic Testing Agent → Security Auditor Agent
                </p>
              </div>

              {(task.status === "IN_PROGRESS" || task.status === "AWAITING_PAYMENT_AUTHORIZATION") && (
                <button
                  onClick={handleExecuteMultiAgentPipeline}
                  disabled={isExecuting}
                  className="px-3.5 py-1.5 rounded bg-[#1B4332] text-white text-xs font-medium hover:bg-[#2D6A4F] disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Coordinating Agents...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Execute Multi-Agent Demo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Execution Steps Feedback */}
            {task.deliverableContent ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded border border-[#D8F3DC] bg-[#EDF9F0] text-xs text-[#1B4332] space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
                    <span>Multi-Agent Workflow Completed & Sealed</span>
                  </div>
                  <p className="text-[11px] text-[#2D6A4F]">{task.deliverableSummary}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1C1917]">Generated Deliverable Artifact</span>
                    <span className="text-[11px] font-mono text-[#78716C]">Solidity 0.8.20 Verified</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-4 rounded bg-[#1C1917] text-[#FAF8F5] text-xs font-mono leading-relaxed whitespace-pre-wrap">
                    {task.deliverableContent}
                  </div>
                </div>

                {/* Final Buyer Approval Controls */}
                {task.status === "DELIVERABLE_SUBMITTED" && (
                  <div className="p-4 rounded border border-[#D6D1C4] bg-[#FAF8F5] space-y-3">
                    <div className="text-xs text-[#1C1917]">
                      <strong>Buyer Acceptance Notice:</strong> Task completion is not treated as automatic proof of correct work. You must review the generated artifact before releasing funds.
                    </div>
                    <button
                      onClick={handleCompleteTask}
                      disabled={isReviewing}
                      className="px-4 py-2 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] transition-all flex items-center gap-2 shadow-sm"
                    >
                      {isReviewing ? "Finalizing Settlement..." : "Approve Work & Finalize Task"}
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#78716C] bg-[#FAF8F5] rounded border border-dashed border-[#E5E0D5]">
                Awaiting payment authorization or multi-agent execution trigger.
              </div>
            )}
          </div>

          {/* Activity Logs */}
          <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
              Auditable Activity Timeline
            </h2>
            <div className="space-y-2">
              {task.activityLogs?.map((log: any) => (
                <div
                  key={log.id}
                  className="p-3 rounded border border-[#EFECE6] bg-[#FAF8F5] text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-medium text-[#1C1917]">
                      [{log.actorType}] {log.actorName}
                    </span>
                    <span className="text-[#A8A29E] font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[#57534E] leading-relaxed">{log.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): HSP Payment Center & Provider Agent */}
        <div className="lg:col-span-5 space-y-6">
          {/* Provider Agent Card */}
          {task.selectedAgent && (
            <div className="p-5 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                Assigned Specialist Agent
              </h2>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#1C1917]">{task.selectedAgent.name}</span>
                  {task.selectedAgent.isVerified && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EDF9F0] text-[#1B4332] border border-[#D8F3DC]">
                      Verified
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#78716C] font-mono">
                  Wallet: {task.selectedAgent.walletAddress.slice(0, 10)}...
                </div>
              </div>
              <p className="text-xs text-[#57534E]">{task.selectedAgent.shortDescription}</p>
            </div>
          )}

          {/* HSP Payment Center */}
          <div className="p-5 rounded border border-[#CFC8B8] bg-white panel-editorial space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                  HSP Payment Center
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D5] text-[#1C1917]">
                x402 Protocol v2
              </span>
            </div>

            {task.paymentMandate ? (
              <div className="space-y-4">
                {/* Mandate Details */}
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                    <span className="text-[#78716C]">Mandate ID (ID1):</span>
                    <span className="text-[#1C1917] font-semibold">{task.paymentMandate.cartMandateId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                    <span className="text-[#78716C]">Payment Req (ID2):</span>
                    <span className="text-[#1C1917]">{task.paymentMandate.paymentRequestId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                    <span className="text-[#78716C]">Settlement Amount:</span>
                    <span className="text-[#1B4332] font-bold">
                      {task.paymentMandate.tokenAmount} {task.paymentMandate.tokenSymbol} (${task.paymentMandate.amount} USD)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#FAF8F5]">
                    <span className="text-[#78716C]">Network / Chain:</span>
                    <span className="text-[#1C1917]">HashKey Chain ({task.paymentMandate.chainId})</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#78716C]">Cart Hash (RFC 8785):</span>
                    <span className="text-[#78716C] text-[10px]" title={task.paymentMandate.cartHash}>
                      {task.paymentMandate.cartHash.slice(0, 16)}...
                    </span>
                  </div>
                </div>

                {/* Mandate Status Display */}
                <div className="p-3 rounded bg-[#FAF8F5] border border-[#E5E0D5] flex items-center justify-between text-xs">
                  <span className="text-[#78716C]">HSP Status:</span>
                  <span
                    className={`font-mono font-medium px-2 py-0.5 rounded ${
                      task.paymentMandate.status === "payment-finalized"
                        ? "bg-[#EDF9F0] text-[#1B4332]"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {task.paymentMandate.status}
                  </span>
                </div>

                {/* On-Chain Transaction Hash Link */}
                {task.paymentMandate.onChainTxHash && (
                  <div className="p-3 rounded border border-[#D8F3DC] bg-[#EDF9F0] text-xs space-y-1">
                    <div className="font-semibold text-[#1B4332] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>On-Chain Settlement Confirmed</span>
                    </div>
                    <div className="text-[11px] font-mono break-all text-[#2D6A4F]">
                      {task.paymentMandate.onChainTxHash}
                    </div>
                    <a
                      href={task.paymentMandate.blockExplorerUrl || `https://hashkey.blockscout.com/tx/${task.paymentMandate.onChainTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#1B4332] underline pt-1 font-medium"
                    >
                      View on HashKey Blockscout
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Payment Authorization Action Button */}
                {task.paymentMandate.status === "payment-required" && (
                  <div className="space-y-3 pt-2">
                    <div className="text-[11px] text-[#78716C] leading-snug">
                      Explicit authorization required per HSP standard. Funds will settle only upon your cryptographic wallet signature.
                    </div>
                    <button
                      onClick={handleAuthorizePayment}
                      disabled={isSigning}
                      className="w-full py-2.5 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isSigning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Requesting Wallet Signature...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Sign HSP Payment Mandate ({task.paymentMandate.tokenAmount} HSK)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#78716C]">Generating Cart Mandate...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
