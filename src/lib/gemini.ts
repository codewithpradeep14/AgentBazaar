import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

// Zod Schema for Structured Task Interpretation
export const StructuredTaskSchema = z.object({
  title: z.string().min(5),
  category: z.enum(["SECURITY", "DEVELOPMENT", "RESEARCH", "DATA_ANALYSIS", "DESIGN"]),
  budgetAmount: z.number().positive(),
  currency: z.string().default("HSK"),
  estimatedDuration: z.string(),
  requiredDeliverables: z.array(z.string()).min(1),
  acceptanceCriteria: z.array(z.string()).min(1),
  clarificationNeeded: z.boolean().default(false),
  clarificationQuestion: z.string().optional(),
  summary: z.string(),
});

export type StructuredTask = z.infer<typeof StructuredTaskSchema>;

export interface AgentRecommendation {
  agentId: string;
  agentName: string;
  matchScore: number; // 0 - 100
  reasoning: string;
  estimatedPrice: number;
  currency: string;
  fitAssessment: "EXCELLENT" | "GOOD" | "PARTIAL";
}

/**
 * Initializes Gemini client with configured API key.
 */
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GEMINI_KEY ||
    "";
  if (!apiKey || apiKey.trim() === "" || apiKey === "your-gemini-api-key") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey.trim());
}

/**
 * Parses a natural language user request into structured task requirements.
 * Example prompt: "Find an AI agent that can audit my Solidity smart contract for a maximum budget of 5 HSK."
 */
export async function parseNaturalLanguageTask(prompt: string): Promise<StructuredTask> {
  const gemini = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const systemPrompt = `
You are an expert AI task architect for AgentBazaar, a decentralized marketplace on HashKey Chain (HSK Chain).
Your job is to analyze the user's natural language request and extract structured task requirements.

Schema requirement:
{
  "title": "Concise task title",
  "category": "SECURITY" | "DEVELOPMENT" | "RESEARCH" | "DATA_ANALYSIS" | "DESIGN",
  "budgetAmount": number (extract budget or estimate reasonable HSK amount, e.g. 5.0),
  "currency": "HSK",
  "estimatedDuration": "e.g. 12-24 hours",
  "requiredDeliverables": ["array of specific deliverable items"],
  "acceptanceCriteria": ["verifiable acceptance criteria"],
  "clarificationNeeded": boolean (true if request is too vague to execute safely),
  "clarificationQuestion": "Question to user if clarificationNeeded is true",
  "summary": "Brief explanation of how the task was understood"
}

User request: "${prompt}"
`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 3500)
      );

      const result = await Promise.race([model.generateContent(systemPrompt), timeoutPromise]);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      return StructuredTaskSchema.parse(parsed);
    } catch (err) {
      console.warn("Gemini API call timed out or failed, using fast semantic parser:", err);
    }
  }

  // Deterministic Fallback Parser
  return parseDeterministicTask(prompt);
}

/**
 * Deterministic semantic parser when Gemini is offline or API key is not yet set.
 */
function parseDeterministicTask(prompt: string): StructuredTask {
  const lower = prompt.toLowerCase();

  let category: "SECURITY" | "DEVELOPMENT" | "RESEARCH" | "DATA_ANALYSIS" | "DESIGN" = "DEVELOPMENT";
  if (lower.includes("audit") || lower.includes("security") || lower.includes("vulnerability") || lower.includes("reentrancy")) {
    category = "SECURITY";
  } else if (lower.includes("research") || lower.includes("paper") || lower.includes("literature") || lower.includes("market analysis")) {
    category = "RESEARCH";
  } else if (lower.includes("data") || lower.includes("analytics") || lower.includes("indexer") || lower.includes("subgraph")) {
    category = "DATA_ANALYSIS";
  } else if (lower.includes("design") || lower.includes("ui") || lower.includes("ux") || lower.includes("figma") || lower.includes("brand")) {
    category = "DESIGN";
  }

  // Extract budget: look for number followed by HSK or preceded by budget
  let budgetAmount = 5.0;
  const budgetMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:HSK|hsk)/i) || prompt.match(/budget\s*(?:of|is|:)?\s*(\d+(?:\.\d+)?)/i);
  if (budgetMatch && budgetMatch[1]) {
    budgetAmount = parseFloat(budgetMatch[1]);
  }

  // Check if prompt is too short / ambiguous
  const clarificationNeeded = prompt.trim().length < 15;
  const clarificationQuestion = clarificationNeeded
    ? "Could you provide additional details on the exact deliverables and target repository or contract?"
    : undefined;

  let title = "Custom Agent Service";
  let requiredDeliverables = ["Comprehensive Task Report", "Verification Checklist"];
  let acceptanceCriteria = ["Meets defined specifications", "Zero critical defects reported"];

  if (category === "SECURITY") {
    title = "Solidity Smart Contract Security Audit";
    requiredDeliverables = [
      "Vulnerability Assessment Matrix (High/Medium/Low/Informational)",
      "Reentrancy, Access Control & Gas Optimization Report",
      "Executive Summary & Remediation Recommendations",
    ];
    acceptanceCriteria = [
      "All functions analyzed for checks-effects-interactions violations",
      "Compiler warning audit completed for Solidity 0.8+",
      "Automated and manual static analysis cross-referenced",
    ];
  } else if (category === "DEVELOPMENT") {
    title = "Full-Stack Web3 Application Feature Implementation";
    requiredDeliverables = ["Source Code Implementation", "Automated Unit Tests", "Deployment Script"];
    acceptanceCriteria = ["Tests pass with 100% success rate", "Linting & typecheck clean"];
  }

  return {
    title,
    category,
    budgetAmount,
    currency: "HSK",
    estimatedDuration: "12-24 hours",
    requiredDeliverables,
    acceptanceCriteria,
    clarificationNeeded,
    clarificationQuestion,
    summary: `Understood task under ${category} category with budget of ${budgetAmount} HSK on HashKey Chain.`,
  };
}

/**
 * Matches and ranks registered agents against structured task requirements.
 * Only agents that actually exist in the database are ranked.
 */
export async function matchAndRankAgents(params: {
  task: StructuredTask;
  registeredAgents: Array<{
    id: string;
    name: string;
    category: string;
    priceAmount: number;
    rating: number;
    capabilities: string[];
    isAvailable: boolean;
  }>;
}): Promise<AgentRecommendation[]> {
  const { task, registeredAgents } = params;

  // Filter eligible candidates by availability and reasonable budget threshold
  const eligible = registeredAgents.filter((a) => a.isAvailable);

  const gemini = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  if (gemini && eligible.length > 0) {
    try {
      const model = gemini.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const prompt = `
You are the AgentBazaar Intelligent Matchmaker.
Match and rank the following REAL registered service agents against the user's task.
Do NOT invent new agents. Only evaluate the candidates provided.

Task:
- Title: ${task.title}
- Category: ${task.category}
- Budget: ${task.budgetAmount} ${task.currency}
- Deliverables: ${task.requiredDeliverables.join(", ")}

Registered Candidate Agents:
${JSON.stringify(eligible, null, 2)}

Output JSON format:
[
  {
    "agentId": "string (must match candidate id)",
    "agentName": "string",
    "matchScore": number (0 to 100),
    "reasoning": "Detailed explanation of why this agent is or is not suitable",
    "estimatedPrice": number,
    "currency": "HSK",
    "fitAssessment": "EXCELLENT" | "GOOD" | "PARTIAL"
  }
]
`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini timeout")), 3500)
      );

      const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn("Gemini agent matching timed out or failed, using fast ranking:", err);
    }
  }

  // Deterministic Ranking Fallback
  return eligible
    .map((agent) => {
      let score = 50;
      if (agent.category === task.category) score += 35;
      if (agent.priceAmount <= task.budgetAmount) score += 15;
      else if (agent.priceAmount <= task.budgetAmount * 1.25) score += 5;
      else score -= 15;

      const ratingBoost = Math.min(10, (agent.rating - 4.0) * 10);
      score = Math.min(99, Math.max(20, Math.round(score + ratingBoost)));

      let fit: "EXCELLENT" | "GOOD" | "PARTIAL" = "PARTIAL";
      if (score >= 80) fit = "EXCELLENT";
      else if (score >= 65) fit = "GOOD";

      const reasoning =
        agent.category === task.category
          ? `Direct domain match in ${agent.category}. Listed fee of ${agent.priceAmount} HSK aligns with budget (${task.budgetAmount} HSK). Historical rating: ${agent.rating}/5.0.`
          : `Adjacent domain capability. Listed fee: ${agent.priceAmount} HSK.`;

      return {
        agentId: agent.id,
        agentName: agent.name,
        matchScore: score,
        reasoning,
        estimatedPrice: agent.priceAmount,
        currency: "HSK",
        fitAssessment: fit,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
