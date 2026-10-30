import { NextResponse } from "next/server";
import { parseNaturalLanguageTask } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json({ error: "Task prompt is required" }, { status: 400 });
    }

    const structuredTask = await parseNaturalLanguageTask(prompt);
    return NextResponse.json({ task: structuredTask });
  } catch (error: any) {
    console.error("POST /api/ai/parse-task error:", error);
    return NextResponse.json({ error: "Failed to parse task prompt" }, { status: 500 });
  }
}
