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

describe('PersonController', () => {
  let controller: PersonController;

  beforeAll(async () => {
    const module: TestingModule = await TestModuleHelper.createTestingModule({
      controllers: [PersonController],
      providers: [
        PersonService,
        RbacCacheService,
        PermissionService,
        PersonRoleService,
        Reflector,
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
