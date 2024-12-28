import { Test, TestingModule } from '@nestjs/testing';
import { PersonController } from './person.controller';
import { PersonService } from './person.service';
import { PrismaService } from '../prisma/prisma.service';
import { RbacCacheService } from '../rbac/services/rbac-cache.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TestModuleHelper } from '../../test/helpers/test-module.helper';
import { PermissionService } from '../rbac/services/permission.service';
import { PersonRoleService } from '../rbac/services/person-role.service';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { PermissionCacheService } from '../rbac/services/permission-cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('PersonController', () => {
  let controller: PersonController;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      switch (key) {
        case 'DATABASE_URL':
          return 'postgresql://test:test@localhost:5432/test';
        default:
          return undefined;
      }
    }),
    getOrThrow: jest.fn((key: string) => {
      switch (key) {
        case 'DATABASE_URL':
          return 'postgresql://test:test@localhost:5432/test';
        default:
          throw new Error(`Config key "${key}" not found`);
      }
    }),
  };

  beforeAll(async () => {
    const module = await TestModuleHelper.createTestingModule({
      controllers: [PersonController],
      providers: [
        PersonService,
        RbacCacheService,
        PermissionService,
        PersonRoleService,
        PermissionCacheService,
        Reflector,
        EventEmitter2,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
          },
        },
      ],
    });

    controller = module.get<PersonController>(PersonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
