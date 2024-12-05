import { PrismaClient } from '@prisma/client';
import { banks } from './data/banks';

const prisma = new PrismaClient();

async function main() {
  const bankCount = await prisma.bank.count();

  if (bankCount === 0) {
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
