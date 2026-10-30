import { NextResponse } from "next/server";
import { getAgents, createAgent } from "@/lib/db";
import { AgentData } from "@/lib/seedData";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query")?.toLowerCase();
    const verifiedOnly = searchParams.get("verified") === "true";

    let agents = await getAgents();

    if (category && category !== "ALL") {
      agents = agents.filter((a) => a.category.toUpperCase() === category.toUpperCase());
    }

    if (verifiedOnly) {
      agents = agents.filter((a) => a.isVerified);
    }

    if (query) {
      agents = agents.filter(
        (a) =>
          a.name.toLowerCase().includes(query) ||
          a.shortDescription.toLowerCase().includes(query) ||
          a.capabilities.some((c) => c.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category || !body.priceAmount || !body.walletAddress) {
      return NextResponse.json(
        { error: "Missing required fields (name, category, priceAmount, walletAddress)" },
        { status: 400 }
      );
    }

    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newAgent: AgentData = {
      id: `agent-custom-${Date.now()}`,
      name: body.name,
      slug,
      category: body.category,
      shortDescription: body.shortDescription || "Registered service agent on AgentBazaar",
      fullDescription: body.fullDescription || body.shortDescription || "",
      capabilities: Array.isArray(body.capabilities) ? body.capabilities : ["General Task Execution"],
      inputFormats: Array.isArray(body.inputFormats) ? body.inputFormats : ["Text", "JSON"],
      outputFormats: Array.isArray(body.outputFormats) ? body.outputFormats : ["Markdown Report"],
      pricingModel: body.pricingModel || "FIXED",
      priceAmount: parseFloat(body.priceAmount),
      currency: "HSK",
      expectedTurnaround: body.expectedTurnaround || "12-24 hours",
      isAvailable: true,
      isVerified: false, // New custom agents start as self-reported
      verificationSource: "Self-Reported Registration",
      rating: 5.0,
      reviewCount: 0,
      completedJobs: 0,
      walletAddress: body.walletAddress,
      endpointType: body.endpointType || "NATIVE_GEMINI",
      sampleDeliverables: body.sampleDeliverables || [],
    };

    const saved = await createAgent(newAgent);
    return NextResponse.json({ agent: saved }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/agents error:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
