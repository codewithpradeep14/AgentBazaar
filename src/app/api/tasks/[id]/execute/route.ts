import { NextResponse } from "next/server";
import { prisma, memoryStore } from "@/lib/db";
import { executeMultiAgentPipeline } from "@/lib/multiAgent";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch task
    let task: any = null;
    try {
      task = await prisma.task.findUnique({
        where: { id },
        include: { selectedAgent: true },
      });
    } catch {
      // Fallback
    }

    if (!task) {
      task = memoryStore.tasks.find((t) => t.id === id);
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Execute multi-agent coordination pipeline
    const workflowResult = await executeMultiAgentPipeline({
      taskId: id,
      taskTitle: task.title,
      category: task.category,
      useSimulation: true,
    });

    const executionLogData = {
      id: `log-${Date.now()}-exec`,
      actorType: "AGENT",
      actorName: "Multi-Agent Coordinator",
      action: "DELIVERABLE_SUBMITTED",
      message: `Multi-agent execution complete: Coder, Tester & Auditor agents finalized work. Deterministic checks: ${workflowResult.verificationReport.checksPassed}/${workflowResult.verificationReport.checksRan} Passed.`,
      metadata: JSON.stringify(workflowResult.verificationReport),
      timestamp: new Date(),
    };

    // Update task in database
    let updatedTask: any = null;
    try {
      updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: "DELIVERABLE_SUBMITTED",
          deliverableContent: workflowResult.deliverableContent,
          deliverableSummary: workflowResult.deliverableSummary,
          deliverableVerified: workflowResult.deterministicVerificationPassed,
          verificationLog: JSON.stringify(workflowResult.verificationReport),
          activityLogs: {
            create: [executionLogData],
          },
        },
        include: {
          selectedAgent: true,
          activityLogs: { orderBy: { timestamp: "desc" } },
        },
      });
    } catch {
      // Fallback
    }

    if (!updatedTask) {
      const idx = memoryStore.tasks.findIndex((t) => t.id === id);
      if (idx >= 0) {
        memoryStore.tasks[idx].status = "DELIVERABLE_SUBMITTED";
        memoryStore.tasks[idx].deliverableContent = workflowResult.deliverableContent;
        memoryStore.tasks[idx].deliverableSummary = workflowResult.deliverableSummary;
        memoryStore.tasks[idx].deliverableVerified = workflowResult.deterministicVerificationPassed;
        memoryStore.tasks[idx].verificationLog = JSON.stringify(workflowResult.verificationReport);
        memoryStore.logs.unshift({ ...executionLogData, taskId: id });
        updatedTask = memoryStore.tasks[idx];
        updatedTask.activityLogs = memoryStore.logs.filter((l) => l.taskId === id);
      }
    }

    return NextResponse.json({
      workflowResult,
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("POST /api/tasks/[id]/execute error:", error);
    return NextResponse.json({ error: "Multi-agent execution failed" }, { status: 500 });
  }
}
