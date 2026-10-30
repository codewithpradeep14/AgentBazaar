import { NextResponse } from "next/server";
import { matchAndRankAgents, StructuredTask } from "@/lib/gemini";
import { getAgents } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { task } = (await request.json()) as { task: StructuredTask };
    if (!task || !task.category) {
      return NextResponse.json({ error: "Structured task object is required" }, { status: 400 });
    }

    const allAgents = await getAgents();
    const recommendations = await matchAndRankAgents({
      task,
      registeredAgents: allAgents,
    });

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("POST /api/ai/match-agents error:", error);
    return NextResponse.json({ error: "Failed to rank candidate agents" }, { status: 500 });
  }
}
