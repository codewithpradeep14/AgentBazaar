"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  HelpCircle, 
  Coins, 
  Clock, 
  Cpu,
  RefreshCw
} from "lucide-react";
import { StructuredTask } from "@/lib/gemini";

function CreateTaskContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const preselectedAgentId = searchParams.get("agentId") || "";

  const { address } = useWallet();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [isParsing, setIsParsing] = useState(false);
  const [structuredTask, setStructuredTask] = useState<StructuredTask | null>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState("");

  const [isMatching, setIsMatching] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(preselectedAgentId);

  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If prompt is passed via query param on load, parse automatically
  useEffect(() => {
    if (initialPrompt && !structuredTask) {
      handleParsePrompt(initialPrompt);
    }
  }, [initialPrompt]);

  async function handleParsePrompt(customPrompt?: string) {
    const textToParse = customPrompt || prompt;
    if (!textToParse.trim()) return;

    setIsParsing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/ai/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: textToParse }),
      });
      const data = await res.json();
      if (data.task) {
        setStructuredTask(data.task);
        // Automatically find matching agents
        await handleMatchAgents(data.task);
      } else {
        setErrorMsg(data.error || "Failed to parse task prompt");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while parsing task");
    } finally {
      setIsParsing(false);
    }
  }

  async function handleMatchAgents(taskData: StructuredTask) {
    setIsMatching(true);
    try {
      const res = await fetch("/api/ai/match-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskData }),
      });
      const data = await res.json();
      if (data.recommendations) {
        setRecommendations(data.recommendations);
        if (!selectedAgentId && data.recommendations.length > 0) {
          setSelectedAgentId(data.recommendations[0].agentId);
        }
      }
    } catch (err) {
      console.error("Match error:", err);
    } finally {
      setIsMatching(false);
    }
  }

  async function handleCreateTask() {
    if (!structuredTask) return;
    setIsCreating(true);
    setErrorMsg(null);

    try {
      const selectedRec = recommendations.find((r) => r.agentId === selectedAgentId);
      const agreedPrice = selectedRec ? selectedRec.estimatedPrice : structuredTask.budgetAmount;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: structuredTask.title,
          naturalLanguagePrompt: prompt || structuredTask.title,
          category: structuredTask.category,
          budgetAmount: structuredTask.budgetAmount,
          currency: structuredTask.currency,
          deadline: structuredTask.estimatedDuration,
          requiredDeliverables: structuredTask.requiredDeliverables,
          acceptanceCriteria: structuredTask.acceptanceCriteria,
          buyerAddress: address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          selectedAgentId: selectedAgentId || null,
          agreedPrice,
        }),
      });

      const data = await res.json();
      if (data.task) {
        // If an agent was selected, automatically initiate HSP mandate
        if (selectedAgentId) {
          await fetch("/api/hsp/mandate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: data.task.id,
              agentId: selectedAgentId,
              priceAmount: agreedPrice,
            }),
          });
        }
        router.push(`/tasks/${data.task.id}`);
      } else {
        setErrorMsg(data.error || "Failed to create task");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#E5E0D5] pb-6 space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs text-[#1B4332] font-mono mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini Task Architect & Agent Matching</span>
        </div>
        <h1 className="text-3xl font-serif text-[#1C1917] tracking-tight">Create & Delegate Task</h1>
        <p className="text-xs text-[#57534E]">
          Express your task in natural language. Gemini extracts structured requirements, enforces budget limits, and matches real registered service agents.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Natural Language Prompt Input */}
      <div className="p-6 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-4">
        <label className="block text-xs font-semibold text-[#1C1917] uppercase tracking-wider">
          Step 1 — Describe Your Requirements in Plain English
        </label>

        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g., "Find an AI agent that can audit my Solidity smart contract for a maximum budget of 5 HSK. Must check for reentrancy and access controls."'
          className="w-full p-3 bg-[#FAF8F5] border border-[#E5E0D5] rounded text-sm text-[#1C1917] placeholder-[#78716C] focus:outline-none focus:border-[#1C1917] font-sans"
        />

        {/* Quick Example Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#78716C]">Presets:</span>
          <button
            type="button"
            onClick={() => {
              const p = "Find an AI agent that can audit my Solidity smart contract for a maximum budget of 5 HSK.";
              setPrompt(p);
              handleParsePrompt(p);
            }}
            className="px-2.5 py-1 rounded bg-[#F5F2EB] border border-[#E5E0D5] text-[#57534E] hover:text-[#1C1917] hover:border-[#1C1917] transition-colors text-[11px]"
          >
            Audit Solidity Contract (5 HSK)
          </button>
          <button
            type="button"
            onClick={() => {
              const p = "Need a full-stack Web3 developer agent to build an HSK Chain token bridge client with unit tests for 4.5 HSK.";
              setPrompt(p);
              handleParsePrompt(p);
            }}
            className="px-2.5 py-1 rounded bg-[#F5F2EB] border border-[#E5E0D5] text-[#57534E] hover:text-[#1C1917] hover:border-[#1C1917] transition-colors text-[11px]"
          >
            Build Bridge Client (4.5 HSK)
          </button>
          <button
            type="button"
            onClick={() => {
              const p = "Research tokenomics and L2 fee market sustainability on HashKey Chain for 4 HSK.";
              setPrompt(p);
              handleParsePrompt(p);
            }}
            className="px-2.5 py-1 rounded bg-[#F5F2EB] border border-[#E5E0D5] text-[#57534E] hover:text-[#1C1917] hover:border-[#1C1917] transition-colors text-[11px]"
          >
            Tokenomics Research (4 HSK)
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleParsePrompt()}
            disabled={isParsing || !prompt.trim()}
            className="px-4 py-2 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
          >
            {isParsing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#52B788]" />
                <span>Interpret & Structure Task</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Clarification prompt (if prompt was ambiguous) */}
      {structuredTask?.clarificationNeeded && (
        <div className="p-5 rounded border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-3">
          <div className="flex items-center gap-2 font-medium">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>Clarification Requested by AI Architect</span>
          </div>
          <p>{structuredTask.clarificationQuestion}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              placeholder="Provide clarifying details..."
              className="flex-1 px-3 py-1.5 bg-white border border-amber-300 rounded text-xs text-[#1C1917]"
            />
            <button
              onClick={() => {
                const combined = `${prompt} ${clarificationAnswer}`;
                setPrompt(combined);
                handleParsePrompt(combined);
              }}
              className="px-3 py-1.5 bg-amber-800 text-white rounded text-xs font-medium"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Structured Output Review */}
      {structuredTask && (
        <div className="p-6 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
            <label className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
              Step 2 — Structured Task Specification
            </label>
            <span className="text-[11px] font-mono text-[#1B4332] bg-[#EDF9F0] px-2 py-0.5 rounded border border-[#D8F3DC]">
              Schema Validated
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#E5E0D5] space-y-1">
              <div className="text-[11px] text-[#78716C]">Task Title</div>
              <div className="text-xs font-semibold text-[#1C1917]">{structuredTask.title}</div>
            </div>

            <div className="p-3 rounded bg-[#FAF8F5] border border-[#E5E0D5] space-y-1">
              <div className="text-[11px] text-[#78716C]">Category & Currency</div>
              <div className="text-xs font-mono font-medium text-[#1C1917]">
                {structuredTask.category} • HashKey Chain
              </div>
            </div>

            <div className="p-3 rounded bg-[#FAF8F5] border border-[#E5E0D5] space-y-1">
              <div className="text-[11px] text-[#78716C]">Maximum Budget</div>
              <div className="text-xs font-mono font-bold text-[#1B4332]">
                {structuredTask.budgetAmount} {structuredTask.currency}
              </div>
            </div>
          </div>

          {/* Required Deliverables */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#1C1917]">Required Deliverables</div>
            <ul className="space-y-1.5">
              {structuredTask.requiredDeliverables.map((d, i) => (
                <li key={i} className="text-xs text-[#57534E] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-[#1C1917]">Formal Acceptance Criteria</div>
            <ul className="space-y-1.5">
              {structuredTask.acceptanceCriteria.map((c, i) => (
                <li key={i} className="text-xs text-[#57534E] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Step 3: Candidate Agent Recommendations */}
      {structuredTask && (
        <div className="p-6 rounded border border-[#E5E0D5] bg-white panel-editorial space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
            <div>
              <label className="text-xs font-semibold text-[#1C1917] uppercase tracking-wider block">
                Step 3 — Matched Service Agents from Database
              </label>
              <span className="text-[11px] text-[#78716C]">
                Only real database listings are ranked. Gemini evaluates candidate capabilities against your budget.
              </span>
            </div>
            {isMatching && (
              <span className="text-xs text-[#78716C] flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Matching...
              </span>
            )}
          </div>

          {recommendations.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#78716C]">
              Searching registered database agents...
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec) => {
                const isSelected = selectedAgentId === rec.agentId;
                return (
                  <div
                    key={rec.agentId}
                    onClick={() => setSelectedAgentId(rec.agentId)}
                    className={`p-4 rounded border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? "border-[#1C1917] bg-[#FAF8F5] ring-1 ring-[#1C1917]"
                        : "border-[#E5E0D5] bg-white hover:border-[#CFC8B8]"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1C1917]">{rec.agentName}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                            rec.fitAssessment === "EXCELLENT"
                              ? "bg-[#EDF9F0] text-[#1B4332] border border-[#D8F3DC]"
                              : "bg-[#EFF6FF] text-[#1E3A8A] border border-[#DBEAFE]"
                          }`}
                        >
                          {rec.matchScore}% Match • {rec.fitAssessment}
                        </span>
                      </div>
                      <p className="text-xs text-[#57534E] leading-relaxed">{rec.reasoning}</p>
                    </div>

                    <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-[#EFECE6]">
                      <div className="font-mono font-bold text-sm text-[#1C1917]">
                        {rec.estimatedPrice} {rec.currency}
                      </div>
                      <div className="text-[10px] text-[#78716C]">agreed price</div>
                      <div className="mt-1">
                        <input
                          type="radio"
                          name="selectedAgent"
                          checked={isSelected}
                          onChange={() => setSelectedAgentId(rec.agentId)}
                          className="text-[#1C1917] focus:ring-[#1C1917]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Creation Button */}
          <div className="pt-4 border-t border-[#EFECE6] flex items-center justify-between">
            <div className="text-xs text-[#78716C]">
              {selectedAgentId ? "Agent selected. Ready to initialize task & mandate." : "Select an agent to proceed."}
            </div>
            <button
              type="button"
              onClick={handleCreateTask}
              disabled={isCreating || !structuredTask}
              className="px-6 py-2.5 rounded bg-[#1C1917] text-white text-xs font-medium hover:bg-[#292524] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Task Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create Task & Proceed to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreateTaskPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-xs text-[#78716C]">
          Loading AI task creator...
        </div>
      }
    >
      <CreateTaskContent />
    </Suspense>
  );
}
