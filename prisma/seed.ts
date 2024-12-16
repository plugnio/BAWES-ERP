import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    console.log(`Seeding database for ${nodeEnv} environment...`);

    // Seed RBAC
    const { categories, roles } = await import(`./data/${nodeEnv}/rbac`);
    
    // Create permissions by category
    for (const category of categories) {
        // Create permissions for this category
        for (const [index, permission] of category.permissions.entries()) {
            await prisma.permission.upsert({
                where: { code: permission.code },
                update: {
                    name: permission.name,
                    description: permission.description,
                    category: category.name
                },
                create: {
                    code: permission.code,
                    name: permission.name,
                    description: permission.description,
                    bitfield: new Decimal(2).pow(index).toString(),
                    category: category.name
                }
            });
        }
    }

    // Create roles and assign permissions
    for (const role of roles) {
        const createdRole = await prisma.role.upsert({
            where: { name: role.name },
            update: {
                description: role.description,
                isSystem: role.isSystem,
                sortOrder: role.sortOrder
            },
            create: {
                name: role.name,
                description: role.description,
                isSystem: role.isSystem,
                sortOrder: role.sortOrder
            }
        });

        // Handle permission assignment
        if (role.permissions === '*') {
            // Assign all permissions to this role
            const allPermissions = await prisma.permission.findMany();
            await Promise.all(
                allPermissions.map(permission =>
                    prisma.rolePermission.upsert({
                        where: {
                            roleId_permissionId: {
                                roleId: createdRole.id,
                                permissionId: permission.id
                            }
                        },
                        update: {},
                        create: {
                            roleId: createdRole.id,
                            permissionId: permission.id
                        }
                    })
                )
            );
        } else if (Array.isArray(role.permissions)) {
            // Assign specific permissions
            const permissions = await prisma.permission.findMany({
                where: {
                    code: {
                        in: role.permissions
                    }
                }
            });

            await Promise.all(
                permissions.map(permission =>
                    prisma.rolePermission.upsert({
                        where: {
                            roleId_permissionId: {
                                roleId: createdRole.id,
                                permissionId: permission.id
                            }
                        },
                        update: {},
                        create: {
                            roleId: createdRole.id,
                            permissionId: permission.id
                        }
                    })
                )
            );
        }
    }

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
