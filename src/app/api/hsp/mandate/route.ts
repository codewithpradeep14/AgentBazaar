import { NextResponse } from "next/server";
import { prisma, memoryStore } from "@/lib/db";
import { buildCartMandate } from "@/lib/hsp";

export async function POST(request: Request) {
  try {
    const { taskId, agentId, priceAmount } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    // Fetch task and agent
    let task: any = null;
    let agent: any = null;

    try {
      task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { selectedAgent: true },
      });
      if (task?.selectedAgent) {
        agent = task.selectedAgent;
      }
    } catch {
      // Fallback
    }

    if (!task) {
      task = memoryStore.tasks.find((t) => t.id === taskId);
    }

    if (!agent && (agentId || task?.selectedAgentId)) {
      const idToFind = agentId || task?.selectedAgentId;
      agent = memoryStore.agents.find((a) => a.id === idToFind || a.slug === idToFind);
    }

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const providerAddress = agent?.walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const agentName = agent?.name || "Specialist Agent";
    const amount = priceAmount ? parseFloat(priceAmount) : task.agreedPrice || task.budgetAmount;

    // Generate official HSP Cart Mandate
    const { mandate, payload } = buildCartMandate({
      taskId,
      agentName,
      providerAddress,
      tokenAmount: amount,
      tokenSymbol: "HSK",
      usdRate: 1.0, // 1 HSK = $1.00 USD
      network: "hsk-mainnet",
      chainId: 177,
      expiryMinutes: 120,
    });

    const mandateRecord = {
      id: `mandate-${Date.now()}`,
      taskId,
      cartMandateId: mandate.contents.id,
      paymentRequestId: mandate.contents.payment_request.details.id,
      merchantName: mandate.contents.merchant_name,
      supportedMethods: "https://www.x402.org/",
      network: "hsk-mainnet",
      chainId: 177,
      payToAddress: providerAddress,
      coin: "HSK",
      amount: parseFloat(mandate.contents.payment_request.details.total.amount.value),
      currency: "USD",
      tokenAmount: amount,
      tokenSymbol: "HSK",
      additionalFee: 0.0,
      totalDue: parseFloat(mandate.contents.payment_request.details.total.amount.value),
      cartExpiry: new Date(mandate.contents.cart_expiry),
      cartHash: mandate.cart_hash,
      merchantAuthorization: mandate.merchant_authorization,
      status: "payment-required",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await prisma.paymentMandate.upsert({
        where: { taskId },
        update: mandateRecord,
        create: mandateRecord,
      });

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "AWAITING_PAYMENT_AUTHORIZATION",
          agreedPrice: amount,
          activityLogs: {
            create: [
              {
                id: `log-${Date.now()}-mandate`,
                actorType: "HSP_GATEWAY",
                actorName: "HSP Mandate Service",
                action: "MANDATE_CREATED",
                message: `HSP Cart Mandate ${mandate.contents.id} generated (Cart Hash: ${mandate.cart_hash.substring(0, 16)}...). Awaiting user wallet signature.`,
                timestamp: new Date(),
              },
            ],
          },
        },
      });
    } catch (dbErr) {
      console.warn("DB mandate save fallback:", dbErr);
    }

    // Memory fallback update
    const existingMandateIdx = memoryStore.mandates.findIndex((m) => m.taskId === taskId);
    if (existingMandateIdx >= 0) {
      memoryStore.mandates[existingMandateIdx] = mandateRecord;
    } else {
      memoryStore.mandates.unshift(mandateRecord);
    }

    const taskIdx = memoryStore.tasks.findIndex((t) => t.id === taskId);
    if (taskIdx >= 0) {
      memoryStore.tasks[taskIdx].status = "AWAITING_PAYMENT_AUTHORIZATION";
      memoryStore.tasks[taskIdx].agreedPrice = amount;
    }

    return NextResponse.json({
      mandate,
      orderPayload: payload,
      mandateRecord,
    });
  } catch (error: any) {
    console.error("POST /api/hsp/mandate error:", error);
    return NextResponse.json({ error: "Failed to generate HSP Cart Mandate" }, { status: 500 });
  }
}
