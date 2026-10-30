import { PrismaClient } from "@prisma/client";
import { SEED_AGENTS, AgentData } from "./seedData";

// Global singleton for PrismaClient in development to prevent hot-reload connection exhaustion
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  fallbackStore: {
    agents: AgentData[];
    tasks: any[];
    mandates: any[];
    logs: any[];
    reviews: any[];
  } | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Memory/Local fallback store ensures zero-failure operation
if (!globalForPrisma.fallbackStore) {
  globalForPrisma.fallbackStore = {
    agents: [...SEED_AGENTS],
    tasks: [],
    mandates: [],
    logs: [],
    reviews: [],
  };
}

export const memoryStore = globalForPrisma.fallbackStore;

/**
 * Returns all active agents from database, or fallback store if DB is uninitialized.
 */
export async function getAgents(): Promise<AgentData[]> {
  try {
    const dbAgents = await prisma.agent.findMany({
      orderBy: { rating: "desc" },
    });
    if (dbAgents && dbAgents.length > 0) {
      return dbAgents.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        category: a.category as any,
        shortDescription: a.shortDescription,
        fullDescription: a.fullDescription,
        capabilities: JSON.parse(a.capabilities || "[]"),
        inputFormats: JSON.parse(a.inputFormats || "[]"),
        outputFormats: JSON.parse(a.outputFormats || "[]"),
        pricingModel: a.pricingModel,
        priceAmount: a.priceAmount,
        currency: a.currency,
        expectedTurnaround: a.expectedTurnaround,
        isAvailable: a.isAvailable,
        isVerified: a.isVerified,
        verificationSource: a.verificationSource || "Self-Reported",
        rating: a.rating,
        reviewCount: a.reviewCount,
        completedJobs: a.completedJobs,
        walletAddress: a.walletAddress,
        endpointType: a.endpointType as any,
        sampleDeliverables: JSON.parse(a.sampleDeliverables || "[]"),
      }));
    }
  } catch {
    // Database unseeded or connecting -> fallback
  }
  return memoryStore.agents;
}

/**
 * Retrieves a single agent by slug or id.
 */
export async function getAgentBySlug(slug: string): Promise<AgentData | null> {
  const agents = await getAgents();
  return agents.find((a) => a.slug === slug || a.id === slug) || null;
}

/**
 * Saves a new agent to database and memory fallback.
 */
export async function createAgent(data: AgentData): Promise<AgentData> {
  try {
    await prisma.agent.create({
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        category: data.category,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        capabilities: JSON.stringify(data.capabilities),
        inputFormats: JSON.stringify(data.inputFormats),
        outputFormats: JSON.stringify(data.outputFormats),
        pricingModel: data.pricingModel,
        priceAmount: data.priceAmount,
        currency: data.currency,
        expectedTurnaround: data.expectedTurnaround,
        isAvailable: data.isAvailable,
        isVerified: data.isVerified,
        verificationSource: data.verificationSource,
        rating: data.rating,
        reviewCount: data.reviewCount,
        completedJobs: data.completedJobs,
        walletAddress: data.walletAddress,
        endpointType: data.endpointType,
        sampleDeliverables: JSON.stringify(data.sampleDeliverables),
      },
    });
  } catch (err) {
    console.warn("DB save agent fallback:", err);
  }

  // Always update memory store
  const existingIdx = memoryStore.agents.findIndex((a) => a.id === data.id || a.slug === data.slug);
  if (existingIdx >= 0) {
    memoryStore.agents[existingIdx] = data;
  } else {
    memoryStore.agents.unshift(data);
  }
  return data;
}
