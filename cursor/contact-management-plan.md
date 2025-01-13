# Contact Management Implementation Plan

## Overview
This document outlines the implementation plan for contact management features, building upon our existing person module and prisma schema.

## Person Types and Access Levels

### Person States
1. **Contact Only**
   - No system access
   - No password/credentials
   - No roles assigned
   - Basic profile info only
   - Can have emails and phones

2. **System User**
   - Has system access
   - Has password credentials
   - Has assigned roles
   - Complete profile
   - Can have emails and phones

### State Transitions
1. **Contact to User Conversion**
   - Set password credentials
   - Assign initial roles
   - Update account status
   - Send welcome email
   - Optional: Verify primary email

2. **User to Contact Demotion**
   - Remove roles
   - Clear credentials
   - Update account status
   - Audit log entry
   - Notification to admins

## Implementation Phases

### Phase 1: Person Module Updates

#### 1.1 Update Person DTOs
```typescript
export class CreatePersonDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  passwordHash?: string; // Optional for contacts

  @ApiProperty({ enum: ['contact', 'active', 'suspended'] })
  @IsString()
  accountStatus: string = 'contact'; // Default to contact

  @ApiPropertyOptional({ type: [CreateEmailDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateEmailDto)
  emails?: CreateEmailDto[];

  @ApiPropertyOptional({ type: [CreatePhoneDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreatePhoneDto)
  phones?: CreatePhoneDto[];
}

export class ConvertToUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requireEmailVerification?: boolean = true;
}
```

#### 1.2 Update PersonService
```typescript
@Injectable()
export class PersonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly phoneService: PhoneService,
    private readonly roleService: RoleService,
    private readonly passwordService: PasswordService,
  ) {}

  async create(dto: CreatePersonDto) {
    return this.prisma.$transaction(async (tx) => {
      // Create person
      const person = await tx.person.create({
        data: {
          nameEn: dto.nameEn,
          nameAr: dto.nameAr,
          passwordHash: dto.passwordHash,
          accountStatus: dto.accountStatus || 'contact',
        },
      });

      // Handle emails if provided
      if (dto.emails?.length) {
        await Promise.all(
          dto.emails.map(email =>
            this.emailService.create({
              ...email,
              personId: person.id,
            }),
          ),
        );
      }

      // Handle phones if provided
      if (dto.phones?.length) {
        await Promise.all(
          dto.phones.map(phone =>
            this.phoneService.create({
              ...phone,
              personId: person.id,
            }),
          ),
        );
      }

      return this.findOne(person.id);
    });
  }

  async convertToUser(id: string, dto: ConvertToUserDto) {
    return this.prisma.$transaction(async (tx) => {
      // Verify person exists and is a contact
      const person = await tx.person.findUnique({
        where: { id },
        include: {
          roles: true,
          emails: {
            where: { isPrimary: true },
          },
        },
      });

      if (!person) {
        throw new PersonNotFoundException(id);
      }

      if (person.accountStatus !== 'contact') {
        throw new InvalidStateException('Person is already a system user');
      }

      // Hash password
      const passwordHash = await this.passwordService.hash(dto.password);

      // Update person
      const updated = await tx.person.update({
        where: { id },
        data: {
          passwordHash,
          accountStatus: 'active',
          roles: {
            create: dto.roleIds.map(roleId => ({
              roleId,
              assignedAt: new Date(),
            })),
          },
        },
      });

      // Send welcome email if we have a primary email
      if (person.emails[0] && dto.requireEmailVerification) {
        await this.emailService.sendVerification(person.emails[0].id);
      }

      return this.findOne(updated.id);
    });
  }

  async demoteToContact(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.findUnique({
        where: { id },
      });

      if (!person) {
        throw new PersonNotFoundException(id);
      }

      if (person.accountStatus === 'contact') {
        throw new InvalidStateException('Person is already a contact');
      }

      // Remove roles and credentials
      await tx.personRole.deleteMany({
        where: { personId: id },
      });

      return tx.person.update({
        where: { id },
        data: {
          passwordHash: null,
          accountStatus: 'contact',
        },
      });
    });
  }

  // Other existing methods...
}
```

#### 1.3 Update PersonController
```typescript
@Controller('persons')
export class PersonController {
  @Post(':id/convert-to-user')
  @RequirePermissions('persons.manage')
  async convertToUser(
    @Param('id') id: string,
    @Body() dto: ConvertToUserDto,
  ) {
    return this.personService.convertToUser(id, dto);
  }

  @Post(':id/demote-to-contact')
  @RequirePermissions('persons.manage')
  async demoteToContact(
    @Param('id') id: string,
  ) {
    return this.personService.demoteToContact(id);
  }

  // Other existing endpoints...
}
```

### Phase 2: Contact Module Implementation

#### 2.1 Email Module
- Create module structure:
  ```
  src/email/
    ├── email.module.ts
    ├── email.service.ts
    ├── email.controller.ts
    ├── dto/
    │   ├── create-email.dto.ts
    │   ├── update-email.dto.ts
    │   ├── verify-email.dto.ts
    │   └── email-filter.dto.ts
    └── test/
        ├── email.service.spec.ts
        └── email.controller.spec.ts
  ```

#### 2.2 Phone Module
- Create module structure:
  ```
  src/phone/
    ├── phone.module.ts
    ├── phone.service.ts
    ├── phone.controller.ts
    ├── dto/
    │   ├── create-phone.dto.ts
    │   ├── update-phone.dto.ts
    │   ├── verify-phone.dto.ts
    │   └── phone-filter.dto.ts
    └── test/
        ├── phone.service.spec.ts
        └── phone.controller.spec.ts
  ```

### Phase 3: Core Services Implementation

#### 3.1 Email Service
```typescript
@Injectable()
export class EmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateEmailDto) {
    return this.prisma.$transaction(async (tx) => {
      // Implementation
    });
  }

  // Other methods as per original plan
}
```

#### 3.2 Phone Service
```typescript
@Injectable()
export class PhoneService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreatePhoneDto) {
    return this.prisma.$transaction(async (tx) => {
      // Implementation
    });
  }

  // Other methods as per original plan
}
```

## Testing Strategy

### Unit Tests
1. Person Service Tests
```typescript
describe('PersonService', () => {
  describe('create', () => {
    it('should create contact without credentials', async () => {
      // Test creating contact
    });

    it('should create user with credentials', async () => {
      // Test creating user
    });
  });

  describe('convertToUser', () => {
    it('should convert contact to user', async () => {
      // Test conversion
    });

    it('should fail if already a user', async () => {
      // Test validation
    });

    it('should assign roles correctly', async () => {
      // Test role assignment
    });
  });

  describe('demoteToContact', () => {
    it('should remove roles and credentials', async () => {
      // Test demotion
    });
  });
});
```

### E2E Tests
```typescript
describe('Person Management', () => {
  describe('Contact to User Flow', () => {
    it('should handle complete contact to user conversion', async () => {
      // Create contact
      // Add email/phone
      // Convert to user
      // Verify roles
      // Test authentication
    });
  });
});
```

## Required Permissions
```typescript
export const Permissions = {
  // ... existing permissions
  PERSONS_MANAGE: 'persons.manage', // Required for conversion/demotion
  PERSONS_CREATE: 'persons.create',
  PERSONS_READ: 'persons.read',
  PERSONS_UPDATE: 'persons.update',
  PERSONS_DELETE: 'persons.delete',
} as const;
```

## Migration Steps
1. Update person module
2. Add conversion endpoints
3. Update tests
4. Update documentation
5. Deploy with feature flags

## SDK Updates
1. Add new DTOs
2. Document conversion flows
3. Update examples
4. Version bump 