import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`Seeding database for ${nodeEnv} environment...`);

    // Seed countries based on environment
    const countryCount = await prisma.country.count();
    if (countryCount === 0) {
        const { countries } = await import(`./data/${nodeEnv}/countries`);
        for (const country of countries) {
            await prisma.country.create({
                data: country
            });
        }
        console.log(`Successfully seeded ${countries.length} countries for ${nodeEnv} environment`);
    } else {
        console.log('Countries have already been seeded.');
    }

    // Seed banks based on environment
    const bankCount = await prisma.bank.count();
    if (bankCount === 0) {
        const { banks } = await import(`./data/${nodeEnv}/banks`);
        for (const bank of banks) {
            await prisma.bank.create({
                data: bank
            });
        }
        console.log(`Successfully seeded ${banks.length} banks for ${nodeEnv} environment`);
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
