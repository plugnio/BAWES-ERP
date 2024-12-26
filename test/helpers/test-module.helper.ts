import { ModuleMetadata } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseHelper } from './database.helper';

export class TestModuleHelper {
  static async createTestingModule(metadata: ModuleMetadata): Promise<TestingModule> {
    // Always include PrismaService and ConfigModule
    const baseMetadata: ModuleMetadata = {
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        ...(metadata.imports || []),
      ],
      providers: [
        {
          provide: PrismaService,
          useFactory: async () => {
            return DatabaseHelper.getInstance();
          },
        },
        ...(metadata.providers || []),
      ],
      exports: [...(metadata.exports || [])],
      controllers: [...(metadata.controllers || [])],
    };

    return Test.createTestingModule(baseMetadata).compile();
  }
} 