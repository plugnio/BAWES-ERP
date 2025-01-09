import { Test, TestingModule } from '@nestjs/testing';
import { PersonService } from './person.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { Person } from '@prisma/client';

describe('PersonService', () => {
  let service: PersonService;
  let prisma: DeepMockProxy<PrismaService>;

  const mockPerson = (data: Partial<Person> = {}): Person => ({
    id: '1',
    nameEn: 'Test User',
    nameAr: '',
    passwordHash: 'hashedpassword123',
    accountStatus: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: new Date(),
    passwordResetToken: '',
    passwordResetTokenExpiresAt: new Date(),
    isDeleted: false,
    ...data,
  });

  beforeEach(async () => {
    const mockPrisma = mockDeep<PrismaService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PersonService>(PersonService);
    prisma = module.get(PrismaService);
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

      prisma.person.create.mockResolvedValue(mockPerson(dto));

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

      prisma.person.create.mockResolvedValue(mockPerson(dto));

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.nameEn).toBe(dto.nameEn);
      expect(result.nameAr).toBe('');
      expect(result.passwordHash).toBe(dto.passwordHash);
      expect(result.accountStatus).toBe(dto.accountStatus);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no people exist', async () => {
      prisma.person.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });

    it('should return all non-deleted people', async () => {
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

      const person1 = mockPerson({ id: '1', ...dto1 });
      const person2 = mockPerson({ id: '2', ...dto2 });

      prisma.person.create.mockResolvedValueOnce(person1);
      prisma.person.create.mockResolvedValueOnce(person2);
      prisma.person.findMany.mockResolvedValue([person1, person2]);

      // Create the test users
      await service.create(dto1);
      await service.create(dto2);

      // Get all people
      const result = await service.findAll();

      // Verify we get exactly our two created users
      expect(result).toHaveLength(2);
      expect(result.map(p => p.id).sort()).toEqual(['1', '2']);
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

      const person = mockPerson(dto);
      const personWithIncludes = {
        ...person,
        emails: [],
        phones: [],
        roles: [],
      };

      prisma.person.create.mockResolvedValue(person);
      prisma.person.findFirst.mockResolvedValue(personWithIncludes);

      const created = await service.create(dto);
      const result = await service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.nameEn).toBe(dto.nameEn);
      expect(result.isDeleted).toBe(false);
    });

    it('should return null for non-existent id', async () => {
      prisma.person.findFirst.mockResolvedValue(null);
      const result = await service.findOne('non-existent-id');
      expect(result).toBeNull();
    });

    it('should return null for deleted person', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test User',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const person = mockPerson(dto);
      const deletedPerson = mockPerson({ ...dto, isDeleted: true });
      const deletedPersonWithIncludes = {
        ...deletedPerson,
        emails: [],
        phones: [],
        roles: [],
      };

      prisma.person.create.mockResolvedValue(person);
      prisma.person.update.mockResolvedValue(deletedPerson);
      prisma.person.findFirst.mockResolvedValue(null);

      const created = await service.create(dto);
      await service.remove(created.id);
      const result = await service.findOne(created.id);
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

      const person = mockPerson(createDto);

      const updateDto: UpdatePersonDto = {
        nameEn: 'Updated User',
        nameAr: 'مستخدم محدث',
      };

      const updatedPerson = mockPerson({ ...person, ...updateDto });

      prisma.person.create.mockResolvedValue(person);
      prisma.person.findUnique.mockResolvedValue(person);
      prisma.person.update.mockResolvedValue(updatedPerson);
      prisma.$transaction.mockImplementation(cb => cb(prisma));

      const created = await service.create(createDto);
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

      prisma.person.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(cb => cb(prisma));
      const result = await service.update('non-existent-id', updateDto);
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should soft delete a person', async () => {
      const dto: CreatePersonDto = {
        nameEn: 'Test Person',
        passwordHash: 'hashedpassword123',
        accountStatus: 'active',
      };

      const person = mockPerson(dto);
      const deletedPerson = mockPerson({ ...dto, isDeleted: true });

      prisma.person.create.mockResolvedValue(person);
      prisma.person.findUnique.mockResolvedValue(person);
      prisma.person.update.mockResolvedValue(deletedPerson);
      prisma.$transaction.mockImplementation(cb => cb(prisma));

      const created = await service.create(dto);
      const result = await service.remove(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.isDeleted).toBe(true);
      expect(prisma.person.update).toHaveBeenCalledWith({
        where: { id: created.id },
        data: { isDeleted: true },
      });
    });

    it('should return null for non-existent id', async () => {
      prisma.person.findUnique.mockResolvedValue(null);
      prisma.$transaction.mockImplementation(cb => cb(prisma));
      const result = await service.remove('non-existent-id');
      expect(result).toBeNull();
    });
  });
});
