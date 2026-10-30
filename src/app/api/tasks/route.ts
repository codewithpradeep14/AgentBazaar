import { NextResponse } from "next/server";
import { prisma, memoryStore } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerAddress = searchParams.get("buyerAddress");

    try {
      const dbTasks = await prisma.task.findMany({
        where: buyerAddress ? { buyerAddress } : undefined,
        include: {
          selectedAgent: true,
          paymentMandate: true,
          activityLogs: { orderBy: { timestamp: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      });
      if (dbTasks && dbTasks.length > 0) {
        return NextResponse.json({ tasks: dbTasks });
      }
    } catch {
      // Fallback to memoryStore
    }

    let tasks = memoryStore.tasks;
    if (buyerAddress) {
      tasks = tasks.filter((t) => t.buyerAddress.toLowerCase() === buyerAddress.toLowerCase());
    }
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      title,
      naturalLanguagePrompt,
      category,
      budgetAmount,
      currency = "HSK",
      deadline,
      requiredDeliverables,
      acceptanceCriteria,
      buyerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      selectedAgentId,
      agreedPrice,
    } = body;

    if (!title || !category || !budgetAmount) {
      return NextResponse.json(
        { error: "Missing required task properties (title, category, budgetAmount)" },
        { status: 400 }
      );
    }

    const taskId = `task-${Date.now()}`;
    const initialStatus = selectedAgentId ? "OFFER_SELECTED" : "OPEN";

    const initialLog = {
      id: `log-${Date.now()}-1`,
      taskId,
      actorType: "BUYER",
      actorName: "Task Creator",
      action: "TASK_CREATED",
      message: `Task "${title}" initialized with budget of ${budgetAmount} ${currency}.`,
      timestamp: new Date(),
    };

    let taskRecord: any = null;

    try {
      taskRecord = await prisma.task.create({
        data: {
          id: taskId,
          buyerAddress,
          title,
          naturalLanguagePrompt: naturalLanguagePrompt || title,
          category,
          budgetAmount: parseFloat(budgetAmount),
          currency,
          deadline: deadline || "24 hours",
          requiredDeliverables: Array.isArray(requiredDeliverables)
            ? JSON.stringify(requiredDeliverables)
            : String(requiredDeliverables),
          acceptanceCriteria: Array.isArray(acceptanceCriteria)
            ? JSON.stringify(acceptanceCriteria)
            : String(acceptanceCriteria),
          status: initialStatus,
          selectedAgentId: selectedAgentId || null,
          agreedPrice: agreedPrice ? parseFloat(agreedPrice) : parseFloat(budgetAmount),
          activityLogs: {
            create: [initialLog],
          },
        },
        include: {
          selectedAgent: true,
          activityLogs: true,
        },
      });
    } catch (dbErr) {
      console.warn("DB task create fallback:", dbErr);
    }

    if (!taskRecord) {
      taskRecord = {
        id: taskId,
        buyerAddress,
        title,
        naturalLanguagePrompt: naturalLanguagePrompt || title,
        category,
        budgetAmount: parseFloat(budgetAmount),
        currency,
        deadline: deadline || "24 hours",
        requiredDeliverables: Array.isArray(requiredDeliverables)
          ? JSON.stringify(requiredDeliverables)
          : String(requiredDeliverables),
        acceptanceCriteria: Array.isArray(acceptanceCriteria)
          ? JSON.stringify(acceptanceCriteria)
          : String(acceptanceCriteria),
        status: initialStatus,
        selectedAgentId: selectedAgentId || null,
        agreedPrice: agreedPrice ? parseFloat(agreedPrice) : parseFloat(budgetAmount),
        createdAt: new Date(),
        updatedAt: new Date(),
        activityLogs: [initialLog],
      };
      memoryStore.tasks.unshift(taskRecord);
    }

    return NextResponse.json({ task: taskRecord }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
