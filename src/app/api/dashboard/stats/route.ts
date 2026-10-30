import { NextResponse } from "next/server";
import { prisma, memoryStore } from "@/lib/db";

export async function GET() {
  try {
    let allTasks: any[] = [];
    let allAgents: any[] = [];
    let allMandates: any[] = [];

    try {
      allTasks = await prisma.task.findMany({
        include: { selectedAgent: true, paymentMandate: true },
        orderBy: { createdAt: "desc" },
      });
      allAgents = await prisma.agent.findMany();
      allMandates = await prisma.paymentMandate.findMany({
        orderBy: { createdAt: "desc" },
      });
    } catch {
      // Fallback
    }

    if (allTasks.length === 0) allTasks = memoryStore.tasks;
    if (allAgents.length === 0) allAgents = memoryStore.agents;
    if (allMandates.length === 0) allMandates = memoryStore.mandates;

    const activeTasks = allTasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && t.status !== "FAILED"
    );
    const completedTasks = allTasks.filter((t) => t.status === "COMPLETED");

    const totalVolumeHSK = allMandates
      .filter((m) => m.status === "payment-finalized")
      .reduce((sum, m) => sum + (m.tokenAmount || 0), 0);

    const verifiedAgentsCount = allAgents.filter((a) => a.isVerified).length;

    return NextResponse.json({
      stats: {
        totalAgents: allAgents.length,
        verifiedAgents: verifiedAgentsCount,
        activeTasks: activeTasks.length,
        completedTasks: completedTasks.length,
        totalVolumeHSK: totalVolumeHSK.toFixed(2),
        network: "HashKey Chain Mainnet",
        chainId: 177,
      },
      recentTasks: allTasks.slice(0, 5),
      recentTransactions: allMandates.slice(0, 5),
    });
  } catch (error: any) {
    console.error("GET /api/dashboard/stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
