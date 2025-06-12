import { PrismaClient } from "@prisma/client";
import {baseAnxietySources} from "./seedData";

const prisma = new PrismaClient();

async function seedSystemAnxieties() {
    console.log("Seeding system anxieties...");
    for (const anx of baseAnxietySources) {
        const existing = await prisma.anxiety_source.findFirst({
            where: { anx_name: anx.anx_name, is_system: true }
        });
        if (existing) {
            console.log(`Anxiety source "${anx.anx_name}" already exists, skipping.`);
            continue;
        }
        console.log(`Creating anxiety source: ${anx.anx_name}`);

        const anxietySource = await prisma.anxiety_source.create({
            data: {
                anx_name: anx.anx_name,
                is_system: true,
                created_by: null,
            },
        });
        
        for (const factorData of anx.factors) {
            const factor = await prisma.factor.create({
                data: {
                    factor_name: factorData.factor_name,
                    anx_id: anxietySource.anx_id,
                },
            });
            console.log(`Created factor: ${factor.factor_name} for anxiety: ${anxietySource.anx_name}`);
            for (const condition of factorData.conditions) {
                await prisma.conditions.create({
                    data: {
                        condition_name: condition.condition_name,
                        con_desc: condition.con_desc || condition.condition_name,
                        factor_id: factor.factor_id,
                    },
                });
                console.log(`Created condition: ${condition.condition_name} for factor: ${factor.factor_name}`);
            }
        }
    }
}

async function main() {
  try {
    await seedSystemAnxieties();
    console.log('✅ Seeding completed successfully');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

