import { Test, TestingModule } from '@nestjs/testing';
import { PersonService } from './person.service';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseHelper } from '../../test/helpers/database.helper';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { ConfigService } from '@nestjs/config';

describe('PersonService', () => {
  let service: PersonService;
  let prisma: PrismaService;
  let dbHelper: DatabaseHelper;

  beforeAll(async () => {
    dbHelper = DatabaseHelper.getInstance();
    prisma = dbHelper.getPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
  });

  beforeEach(async () => {
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    if (dbHelper) {
      await dbHelper.disconnect();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a person', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        nameAr: 'مستخدم اختبار',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.nameEn).toBe(dto.nameEn);
      expect(result.nameAr).toBe(dto.nameAr);
      expect(result.passwordHash).toBe(dto.passwordHash);
      expect(result.accountStatus).toBe(dto.accountStatus);
    });

    it('should create a person with minimal data', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.nameEn).toBe(dto.nameEn);
      expect(result.nameAr).toBeNull();
      expect(result.passwordHash).toBe(dto.passwordHash);
      expect(result.accountStatus).toBe(dto.accountStatus);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no people exist', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('should return all non-deleted people', async () => {
      // Create test data
      const dto1: CreatePersonDto = {
        nameEn: 'Test User 1',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const dto2: CreatePersonDto = {
        nameEn: 'Test User 2',
        passwordHash: 'hashedpassword456',
        accountStatus: 'active',
      };

      // Create the test users
      const person1 = await service.create(dto1);
      const person2 = await service.create(dto2);

      // Get all people
      const result = await service.findAll();

      // Verify we get exactly our two created users
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id).sort()).toEqual([person1.id, person2.id].sort());
      expect(result.map(p => p.nameEn).sort()).toEqual([dto1.nameEn, dto2.nameEn].sort());
    });
  });

  describe('findOne', () => {
    it('should return a person by id', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const created = await service.create(dto);
      const result = await service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.nameEn).toBe(dto.nameEn);
    });

    it('should return null for non-existent id', async () => {
      const result = await service.findOne('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a person', async () => {
      const createDto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const created = await service.create(createDto);

      const updateDto: UpdatePersonDto = {
        nameEn: 'Updated User',
        nameAr: 'مستخدم محدث',
      };

      const result = await service.update(created.id, updateDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.nameEn).toBe(updateDto.nameEn);
      expect(result.nameAr).toBe(updateDto.nameAr);
      expect(result.passwordHash).toBe(created.passwordHash);
    });

    it('should return null for non-existent id', async () => {
      const updateDto: UpdatePersonDto = {
        nameEn: 'Updated User',
      };

      const result = await service.update('non-existent-id', updateDto);
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should soft delete a person', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const created = await service.create(dto);
      const result = await service.remove(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.isDeleted).toBe(true);

      // Verify the person is not returned in findAll
      const allPeople = await service.findAll();
      expect(allPeople.map(p => p.id)).not.toContain(created.id);
    });

    it('should return null for non-existent id', async () => {
      const result = await service.remove('non-existent-id');
      expect(result).toBeNull();
    });
  });
});
