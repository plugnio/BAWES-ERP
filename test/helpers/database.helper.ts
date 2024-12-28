import { PrismaService } from '@/prisma/prisma.service';

export class DatabaseHelper {
  private static instance: PrismaService;

  static async getInstance(): Promise<PrismaService> {
    if (!this.instance) {
      const prisma = new PrismaService();
      await prisma.$connect();
      this.instance = prisma;
    }
    return this.instance;
  }

  static async cleanDatabase() {
    const prisma = await this.getInstance();
    
    try {
      // Delete in correct order to handle foreign key constraints
      await prisma.$transaction([
        prisma.refreshToken.deleteMany(),
        prisma.rolePermission.deleteMany(),
        prisma.personRole.deleteMany(),
        prisma.permission.deleteMany(),
        prisma.role.deleteMany(),
        prisma.email.deleteMany(),
        prisma.person.deleteMany(),
      ]);
    } catch (error) {
      if (error.code === 'P2021') {
        // Table does not exist - this is fine during initial setup
        console.log('Some tables do not exist yet. This is expected during initial setup.');
      } else {
        throw error;
      }
    }
  }

  static async disconnect() {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
    }
  }

  static async resetDatabase() {
    await this.cleanDatabase();
    await this.disconnect();
  }

  static async ensureTablesExist() {
    const prisma = await this.getInstance();
    try {
      // Try to access each table to ensure it exists
      await prisma.$transaction([
        prisma.person.count(),
        prisma.role.count(),
        prisma.permission.count(),
        prisma.rolePermission.count(),
        prisma.personRole.count(),
      ]);
    } catch (error) {
      if (error.code === 'P2021') {
        throw new Error('Database tables do not exist. Please run migrations first.');
      }
      throw error;
    }
  }
} 