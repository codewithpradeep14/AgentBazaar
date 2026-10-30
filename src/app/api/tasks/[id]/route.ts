import { NextResponse } from "next/server";
import { prisma, memoryStore } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let task: any = null;
    try {
      task = await prisma.task.findUnique({
        where: { id },
        include: {
          selectedAgent: true,
          paymentMandate: {
            include: { attempts: true },
          },
          activityLogs: { orderBy: { timestamp: "desc" } },
          review: true,
        },
      });
    } catch {
      // Fallback
    }

    if (!task) {
      task = memoryStore.tasks.find((t) => t.id === id);
      if (task) {
        task.paymentMandate = memoryStore.mandates.find((m) => m.taskId === id) || null;
        task.activityLogs = memoryStore.logs.filter((l) => l.taskId === id);
      }
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("GET /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, selectedAgentId, agreedPrice, deliverableVerified, logMessage } = body;

    const logData = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actorType: body.actorType || "BUYER",
      actorName: body.actorName || "Buyer Action",
      action: status || "UPDATE",
      message: logMessage || `Task status updated to ${status}.`,
      timestamp: new Date(),
    };

    let updatedTask: any = null;
    try {
      updatedTask = await prisma.task.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(selectedAgentId && { selectedAgentId }),
          ...(agreedPrice && { agreedPrice: parseFloat(agreedPrice) }),
          ...(deliverableVerified !== undefined && { deliverableVerified }),
          activityLogs: {
            create: [logData],
          },
        },
        include: {
          selectedAgent: true,
          paymentMandate: true,
          activityLogs: { orderBy: { timestamp: "desc" } },
        },
      });
    } catch {
      // Fallback update memoryStore
    }

    if (!updatedTask) {
      const idx = memoryStore.tasks.findIndex((t) => t.id === id);
      if (idx >= 0) {
        if (status) memoryStore.tasks[idx].status = status;
        if (selectedAgentId) memoryStore.tasks[idx].selectedAgentId = selectedAgentId;
        if (agreedPrice) memoryStore.tasks[idx].agreedPrice = parseFloat(agreedPrice);
        if (deliverableVerified !== undefined) memoryStore.tasks[idx].deliverableVerified = deliverableVerified;
        memoryStore.logs.unshift({ ...logData, taskId: id });
        updatedTask = memoryStore.tasks[idx];
        updatedTask.activityLogs = memoryStore.logs.filter((l) => l.taskId === id);
      }
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
