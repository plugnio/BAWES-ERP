# Pending CRUD Implementations

This document outlines the pending CRUD (Create, Read, Update, Delete) implementations needed based on our Prisma schema models.

## Organization

### Core CRUD
- [ ] Create OrganizationModule
  - [ ] OrganizationController with CRUD endpoints
  - [ ] OrganizationService with CRUD operations
  - [ ] CreateOrganizationDto
  - [ ] UpdateOrganizationDto
  - [ ] Organization entity/response class
  - [ ] Organization validation pipe
  - [ ] Organization CRUD tests

### Organization Relationships
- [ ] Organization-Email Management
  - [ ] Add/remove email endpoints
  - [ ] Set primary email functionality
  - [ ] Email relationship tests

- [ ] Organization-Phone Management
  - [ ] Add/remove phone endpoints
  - [ ] Set primary phone functionality
  - [ ] Phone relationship tests

## Email Management

### Core CRUD
- [ ] Create EmailModule
  - [ ] EmailController with CRUD endpoints
  - [ ] EmailService with CRUD operations
  - [ ] CreateEmailDto
  - [ ] UpdateEmailDto
  - [ ] Email entity/response class
  - [ ] Email validation pipe
  - [ ] Email CRUD tests

### Email Features
- [ ] Email Verification Flow
  - [ ] Generate verification code
  - [ ] Verify email endpoint
  - [ ] Resend verification endpoint
  - [ ] Verification tests

- [ ] Primary Email Management
  - [ ] Set primary email endpoint
  - [ ] Primary email validation
  - [ ] Primary email tests

## Phone Management

### Core CRUD
- [ ] Create PhoneModule
  - [ ] PhoneController with CRUD endpoints
  - [ ] PhoneService with CRUD operations
  - [ ] CreatePhoneDto
  - [ ] UpdatePhoneDto
  - [ ] Phone entity/response class
  - [ ] Phone validation pipe
  - [ ] Phone CRUD tests

### Phone Features
- [ ] Phone Verification Flow
  - [ ] Generate verification code
  - [ ] Verify phone endpoint
  - [ ] Resend verification endpoint
  - [ ] Verification tests

- [ ] Primary Phone Management
  - [ ] Set primary phone endpoint
  - [ ] Primary phone validation
  - [ ] Primary phone tests

## Account Management

### Core CRUD
- [ ] Create AccountModule
  - [ ] AccountController with CRUD endpoints
  - [ ] AccountService with CRUD operations
  - [ ] CreateAccountDto
  - [ ] UpdateAccountDto
  - [ ] Account entity/response class
  - [ ] Account validation pipe
  - [ ] Account CRUD tests

### Account Features
- [ ] Account Balance Management
  - [ ] Add balance record endpoint
  - [ ] Get balance history endpoint
  - [ ] Balance validation
  - [ ] Balance tests

## Bank Management

### Core CRUD
- [ ] Create BankModule
  - [ ] BankController with CRUD endpoints
  - [ ] BankService with CRUD operations
  - [ ] CreateBankDto
  - [ ] UpdateBankDto
  - [ ] Bank entity/response class
  - [ ] Bank validation pipe
  - [ ] Bank CRUD tests

### Bank Features
- [ ] Bank-Account Relationship
  - [ ] Link account to bank endpoint
  - [ ] Get bank accounts endpoint
  - [ ] Bank-account relationship tests

## Country Management

### Core CRUD
- [ ] Create CountryModule
  - [ ] CountryController with CRUD endpoints
  - [ ] CountryService with CRUD operations
  - [ ] CreateCountryDto
  - [ ] UpdateCountryDto
  - [ ] Country entity/response class
  - [ ] Country validation pipe
  - [ ] Country CRUD tests

### Country Features
- [ ] Country-Bank Relationship
  - [ ] Get country banks endpoint
  - [ ] Country-bank relationship tests

- [ ] Country-Phone Relationship
  - [ ] Phone number format validation
  - [ ] Country code validation
  - [ ] Country-phone relationship tests

## Account Balances

### Core CRUD
- [ ] Create AccountBalancesModule
  - [ ] AccountBalancesController with CRUD endpoints
  - [ ] AccountBalancesService with CRUD operations
  - [ ] CreateAccountBalanceDto
  - [ ] AccountBalance entity/response class
  - [ ] Balance validation pipe
  - [ ] Balance CRUD tests

### Balance Features
- [ ] Balance History
  - [ ] Get balance history endpoint
  - [ ] Balance aggregation endpoints
  - [ ] Balance history tests

## Implementation Notes

### Relationship Handling
- Emails and phones should be managed through separate endpoints after entity creation
- Each module should follow the Person module pattern:
  1. Create main entity first (Person, Organization)
  2. Use separate endpoints to manage relationships (add/remove emails, phones)
  3. Include relationship data in GET responses
  4. Support setting primary email/phone through dedicated endpoints

## Common Requirements for All Modules

### Module Structure
- [ ] Follow NestJS module architecture
- [ ] Implement CRUD operations in service layer
- [ ] Use Prisma service for database operations
- [ ] Follow repository pattern with Prisma

### Security
- [ ] Implement JwtAuthGuard
- [ ] Implement PermissionGuard
- [ ] Define granular permissions (create, read, update, delete)
- [ ] Use RequirePermissions decorator

### Validation
- [ ] Use class-validator decorators
- [ ] Implement custom validation pipes where needed
- [ ] Add Swagger decorators for DTO validation
- [ ] Handle soft deletes consistently

### Testing
- [ ] Unit tests for services (80% coverage minimum)
- [ ] Controller integration tests
- [ ] E2E tests for critical flows
- [ ] Mock Prisma service in tests
- [ ] Use test transactions for database tests
- [ ] Follow existing test patterns in person.service.spec.ts

### Documentation
- [ ] Add Swagger annotations (@ApiTags, @ApiOperation, @ApiResponse)
- [ ] Document all DTOs with @ApiProperty
- [ ] Include example responses
- [ ] Document permissions requirements

### Error Handling
- [ ] Use NestJS built-in exceptions
- [ ] Implement custom exceptions where needed
- [ ] Return appropriate HTTP status codes
- [ ] Include meaningful error messages

### API Design
- [ ] Follow RESTful principles
- [ ] Use consistent endpoint naming
- [ ] Implement proper HTTP methods
- [ ] Return standardized response formats
- [ ] Support soft delete operations 