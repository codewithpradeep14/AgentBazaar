import { PrismaClient } from "@prisma/client";
import { SEED_AGENTS } from "../src/lib/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AgentBazaar database with verified marketplace agents...");

  for (const agent of SEED_AGENTS) {
    await prisma.agent.upsert({
      where: { slug: agent.slug },
      update: {
        name: agent.name,
        category: agent.category,
        shortDescription: agent.shortDescription,
        fullDescription: agent.fullDescription,
        capabilities: JSON.stringify(agent.capabilities),
        inputFormats: JSON.stringify(agent.inputFormats),
        outputFormats: JSON.stringify(agent.outputFormats),
        priceAmount: agent.priceAmount,
        currency: agent.currency,
        expectedTurnaround: agent.expectedTurnaround,
        isAvailable: agent.isAvailable,
        isVerified: agent.isVerified,
        verificationSource: agent.verificationSource,
        rating: agent.rating,
        reviewCount: agent.reviewCount,
        completedJobs: agent.completedJobs,
        walletAddress: agent.walletAddress,
        endpointType: agent.endpointType,
        sampleDeliverables: JSON.stringify(agent.sampleDeliverables),
      },
      create: {
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        category: agent.category,
        shortDescription: agent.shortDescription,
        fullDescription: agent.fullDescription,
        capabilities: JSON.stringify(agent.capabilities),
        inputFormats: JSON.stringify(agent.inputFormats),
        outputFormats: JSON.stringify(agent.outputFormats),
        pricingModel: agent.pricingModel,
        priceAmount: agent.priceAmount,
        currency: agent.currency,
        expectedTurnaround: agent.expectedTurnaround,
        isAvailable: agent.isAvailable,
        isVerified: agent.isVerified,
        verificationSource: agent.verificationSource,
        rating: agent.rating,
        reviewCount: agent.reviewCount,
        completedJobs: agent.completedJobs,
        walletAddress: agent.walletAddress,
        endpointType: agent.endpointType,
        sampleDeliverables: JSON.stringify(agent.sampleDeliverables),
      },
    });
    console.log(`  ✓ Seeded agent: ${agent.name} (${agent.category})`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
