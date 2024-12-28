import { Test } from '@nestjs/testing';
import { PersonService } from './person.service';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseHelper } from '../../test/helpers/database.helper';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { NotFoundException } from '@nestjs/common';

describe('PersonService', () => {
  let service: PersonService;
  let prisma: PrismaService;
  let dbHelper: DatabaseHelper;

  beforeEach(async () => {
    // Get database helper instance
    dbHelper = DatabaseHelper.getInstance();
    prisma = dbHelper.getPrismaService();

    const module = await Test.createTestingModule({
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

  afterEach(async () => {
    await dbHelper.cleanDatabase();
  });

  afterAll(async () => {
    await dbHelper.disconnect();
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

      const person = await service.create(dto);

      expect(person).toBeDefined();
      expect(person.nameEn).toBe(dto.nameEn);
      expect(person.nameAr).toBe(dto.nameAr);
      expect(person.accountStatus).toBe(dto.accountStatus);
    });

    it('should create a person with minimal data', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
      };

      const person = await service.create(dto);

      expect(person).toBeDefined();
      expect(person.nameEn).toBe(dto.nameEn);
      expect(person.accountStatus).toBe('active');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no people exist', async () => {
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('should return all people', async () => {
      const dto1: CreatePersonDto = {
        nameEn: 'Test User 1',
        passwordHash: 'hashedpassword123',
      };

      const dto2: CreatePersonDto = {
        nameEn: 'Test User 2',
        passwordHash: 'hashedpassword456',
      };

      await service.create(dto1);
      await service.create(dto2);

      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result.map(p => p.nameEn)).toContain(dto1.nameEn);
      expect(result.map(p => p.nameEn)).toContain(dto2.nameEn);
    });
  });

  describe('findOne', () => {
    it('should return person by id', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
      };

      const created = await service.create(dto);
      const found = await service.findOne(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.nameEn).toBe(created.nameEn);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update person', async () => {
      const createDto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
      };

      const created = await service.create(createDto);

      const updateDto: UpdatePersonDto = {
        nameEn: 'Updated Name',
        nameAr: 'الاسم المحدث',
      };

      const updated = await service.update(created.id, updateDto);

      expect(updated.nameEn).toBe(updateDto.nameEn);
      expect(updated.nameAr).toBe(updateDto.nameAr);
      expect(updated.accountStatus).toBe(created.accountStatus);
    });

    it('should throw error for non-existent id', async () => {
      const updateDto: UpdatePersonDto = {
        nameEn: 'Updated Name',
      };

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should remove person', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
      };

      const created = await service.create(dto);
      await service.remove(created.id);

      await expect(service.findOne(created.id)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent id', async () => {
      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
