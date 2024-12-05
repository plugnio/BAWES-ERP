import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    /*
    * Seed the database with the banks data
    */
    const bankCount = await prisma.bank.count();

    if (bankCount === 0) {
        const { banks } = await import('./data/banks');
        for (const bank of banks) {
            await prisma.bank.create({
                data: bank,
            });
        }
    } else {
        console.log('Banks have already been seeded.');
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
