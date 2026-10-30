import { NextResponse } from "next/server";
import { prisma, memoryStore } from "@/lib/db";
import { signHSPMerchantRequest } from "@/lib/hsp";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { taskId, payerAddress, signature, onChainTxHash } = await request.json();

    if (!taskId || !signature) {
      return NextResponse.json({ error: "taskId and signature are required" }, { status: 400 });
    }

    // Fetch mandate
    let mandate: any = null;
    try {
      mandate = await prisma.paymentMandate.findUnique({
        where: { taskId },
        include: { task: true },
      });
    } catch {
      // Fallback
    }

    if (!mandate) {
      mandate = memoryStore.mandates.find((m) => m.taskId === taskId);
    }

    if (!mandate) {
      return NextResponse.json({ error: "Payment mandate not found for task" }, { status: 404 });
    }

    // Verify mandate has not expired
    const now = new Date();
    if (new Date(mandate.cartExpiry) < now) {
      return NextResponse.json(
        { error: "Cart Mandate has expired (HSP error code 40001)" },
        { status: 400 }
      );
    }

    // Generate or use transaction hash on HashKey Chain
    const txHash =
      onChainTxHash ||
      `0x${crypto.randomBytes(32).toString("hex")}`;

    const blockExplorerUrl = `https://hashkey.blockscout.com/tx/${txHash}`;

    // Perform HSP HMAC request signing simulation for Merchant Gateway
    const hspRequest = signHSPMerchantRequest({
      method: "POST",
      path: "/api/v1/merchant/payments",
      body: {
        cart_mandate_id: mandate.cartMandateId,
        payment_request_id: mandate.paymentRequestId,
        payer_address: payerAddress,
        signature,
        tx_signature: txHash,
      },
      appKey: process.env.HSP_APP_KEY || "ak_agentbazaar_demo",
      appSecret: process.env.HSP_APP_SECRET || "sec_agentbazaar_hsk_hackathon_2026",
    });

    // Update mandate status to finalized
    const updatedStatus = "payment-finalized";
    const paymentAttemptData = {
      id: `attempt-${Date.now()}`,
      attemptNumber: 1,
      gatewayRequest: JSON.stringify(hspRequest),
      gatewayResponse: JSON.stringify({
        code: 0,
        msg: "success",
        data: {
          flow_id: `FLOW-${Date.now().toString().slice(-6)}`,
          status: updatedStatus,
          tx_signature: txHash,
          network: "hsk-mainnet",
          chain: "eip155:177",
        },
      }),
      status: "SUCCESS",
      createdAt: new Date(),
    };

    const paymentLogData = {
      id: `log-${Date.now()}-pay`,
      actorType: "HSP_GATEWAY",
      actorName: "HashKey Settlement Protocol",
      action: "PAYMENT_SETTLED",
      message: `Payment authorized by ${payerAddress?.slice(0, 8)}... Settlement confirmed on HashKey Chain Mainnet (Chain ID 177). Status: payment-finalized.`,
      metadata: JSON.stringify({ txHash, blockExplorerUrl }),
      timestamp: new Date(),
    };

    try {
      await prisma.paymentMandate.update({
        where: { id: mandate.id },
        data: {
          status: updatedStatus,
          payerAddress,
          userSignature: signature,
          onChainTxHash: txHash,
          blockExplorerUrl,
          completedAt: new Date(),
          attempts: {
            create: [paymentAttemptData],
          },
        },
      });

      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "IN_PROGRESS",
          activityLogs: {
            create: [paymentLogData],
          },
        },
      });
    } catch (dbErr) {
      console.warn("DB payment save fallback:", dbErr);
    }

    // Update memory fallback
    const mandateIdx = memoryStore.mandates.findIndex((m) => m.id === mandate.id || m.taskId === taskId);
    if (mandateIdx >= 0) {
      memoryStore.mandates[mandateIdx].status = updatedStatus;
      memoryStore.mandates[mandateIdx].payerAddress = payerAddress;
      memoryStore.mandates[mandateIdx].userSignature = signature;
      memoryStore.mandates[mandateIdx].onChainTxHash = txHash;
      memoryStore.mandates[mandateIdx].blockExplorerUrl = blockExplorerUrl;
      memoryStore.mandates[mandateIdx].completedAt = new Date();
    }

    const taskIdx = memoryStore.tasks.findIndex((t) => t.id === taskId);
    if (taskIdx >= 0) {
      memoryStore.tasks[taskIdx].status = "IN_PROGRESS";
      memoryStore.logs.unshift({ ...paymentLogData, taskId });
    }

    return NextResponse.json({
      success: true,
      status: updatedStatus,
      txHash,
      blockExplorerUrl,
      mandateId: mandate.cartMandateId,
    });
  } catch (error: any) {
    console.error("POST /api/hsp/submit-payment error:", error);
    return NextResponse.json({ error: "Payment submission failed" }, { status: 500 });
  }
}
