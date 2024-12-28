# Test Implementation Plan

## Implementation Rules

### 1. Test File Organization
- Test files must be co-located with source files
- Follow naming convention: `*.spec.ts` for unit tests, `*.e2e-spec.ts` for E2E tests
- Group related tests using describe blocks
- Use clear, descriptive test names

### 2. Test Structure
- Follow Arrange-Act-Assert pattern
- Each test should focus on one specific behavior
- Use beforeEach for common setup
- Clean up after tests using afterEach when needed
- Mock external dependencies consistently
- Test DTOs through controller/service integration tests
- Only create separate DTO tests for custom validation or transformation logic

### 3. Coverage Requirements
- Minimum 80% coverage for critical paths
- Minimum 60% overall coverage
- 100% coverage for permission-related code
- Test both success and error cases
- Include edge cases and boundary conditions

### 4. Database Testing
- Use separate test database
- Clean database before each test
- Use transactions when possible
- Mock database for unit tests
- Use real database for E2E tests

### 5. Authentication Testing
- Test both authenticated and unauthenticated states
- Verify token generation and validation
- Test permission checks
- Include refresh token flows
- Test token expiration

### 6. Error Handling
- Test all error conditions
- Verify error messages
- Check error status codes
- Test validation errors
- Verify error logging

### 7. Performance Testing
- Include timeout assertions
- Test cache effectiveness
- Verify connection pooling
- Test under load conditions
- Monitor memory usage

### 8. Code Quality
- No duplicate test code
- Use test helpers and utilities
- Keep tests maintainable
- Document complex test setups
- Follow project style guide

### 9. Decorator Testing
- Test different decorator types appropriately:
  - Method Decorators:
    - Test metadata setting using `Reflect.getMetadata`
    - Verify metadata values and keys
    - Test stacking with other decorators
    - Verify method functionality preservation
  
  - Parameter Decorators:
    - Test the decorator factory function behavior
    - Mock ExecutionContext and request objects
    - Test with various input scenarios
    - Verify proper request handling

  - Class Decorators:
    - Test metadata on class level
    - Verify class behavior modifications
    - Test inheritance scenarios

- Common Test Cases:
  ```typescript
  // Method Decorator Example
  it('should set metadata correctly', () => {
    class TestClass {
      @SomeDecorator()
      method() {}
    }
    const metadata = Reflect.getMetadata(KEY, TestClass.prototype.method);
    expect(metadata).toBe(expectedValue);
  });

  // Parameter Decorator Example
  it('should handle request data', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ data: 'value' }),
      }),
    } as ExecutionContext;

    const result = decoratorFunction(undefined, mockContext);
    expect(result).toBe(expectedValue);
  });
  ```

- Coverage Requirements:
  - 100% coverage for security-related decorators
  - Test all possible metadata combinations
  - Verify error cases and edge conditions
  - Test decorator composition

### Current Coverage Report
```
Last Updated: 2024-12-27

Unit Tests:
- Overall Coverage: 57.87%
- Branch Coverage: 47.72%
- Function Coverage: 43.84%
- Line Coverage: 56.68%

✅ High Coverage Areas:
1. Auth Decorators:
   - Current User Decorator: 100% coverage
   - Public Decorator: 100% coverage
   - Permissions Decorator: 100% coverage

2. RBAC Core:
   - Permission Discovery Service: 79.82% coverage
   - Permission Guard: 85.71% coverage
   - Role Service: 95.45% coverage
   - Person Role Service: 91.67% coverage

3. Auth Module:
   - Auth Service: 91.19% coverage
   - JWT Strategy: 76.66% coverage

🚫 Low Coverage Areas:
1. RBAC Module:
   - Permission Service: 44.73% → 100% (Focus: CRUD operations, validation)
   - RbacCache Service: 57.14% → 100% (Focus: Cache operations, invalidation)

2. Scripts & E2E Tests:
   - All scripts: 0% coverage
   - E2E tests: 0% coverage

### Implementation Status
```
Last Checked: 2024-12-27

✅ Completed:
- Auth decorator tests (CurrentUser, Public, Permissions) - 100%
- Permission Guard tests - 85.71%
- Permission Discovery Service tests - 79.82%
- Role Service tests - 95.45%
- Person Role Service tests - 91.67%
- Auth Service tests - 91.19%
- JWT Strategy tests - 76.66%
- Test setup infrastructure
- Jest configuration

🚧 In Progress:
- Permission Service tests (44.73% → 100%)
  - Focus: CRUD operations
  - Focus: Permission validation
  - Focus: Error handling
  - Focus: Permission relationships

- RbacCache Service tests (57.14% → 100%)
  - Focus: Cache operations
  - Focus: Cache invalidation
  - Focus: Error handling
  - Focus: Concurrent access

⏱ Pending:
- E2E test coverage (0%)
- Script tests (0%)

❌ Blocked:
- None
```

### Next Actions (Priority Order)

1. [ ] Complete Permission Service Tests (44.73% → 100%)
   ```typescript
   // TODO: Improve coverage by focusing on:
   - CRUD operations (especially update/delete) - 35% covered
   - Permission validation edge cases - 40% covered
   - Error handling scenarios - 50% covered
   - Permission relationships - 25% covered
   ```

2. [ ] Improve RbacCache Service Tests (57.14% → 100%)
   ```typescript
   // TODO: Focus on uncovered scenarios:
   - Cache miss handling - 0% covered
   - Cache invalidation triggers - 45% covered
   - Concurrent access patterns - 30% covered
   - Error recovery - 25% covered
   ```

3. [ ] Add E2E Tests (0% → 80%)
   ```typescript
   // TODO: Implement core E2E scenarios:
   - Auth flow (login, refresh, logout)
   - Permission checks and role assignment
   - User management operations
   - Error handling and recovery
   ```

## Implementation Plan

### Phase 1: Core Infrastructure (Current)
1. Test Environment Setup
   - Configure Jest properly
   - Set up test database
   - Create test helpers
   - Implement cleanup utilities

2. Critical Services
   - Auth service tests
   - Permission service tests
   - Role service tests
   - Person service tests

3. Database Layer
   - Prisma service tests
   - Transaction handling
   - Error scenarios
   - Connection management

### Phase 2: Security & Authorization
1. Authentication
   - Login flow
   - Token management
   - Password handling
   - Session management

2. Authorization
   - Permission guards
   - Role checks
   - Access control
   - Token validation

3. Security Features
   - Rate limiting
   - Input validation
   - SQL injection prevention
   - XSS protection

### Phase 3: Integration & E2E
1. API Integration
   - Controller tests
   - Request handling
   - Response formatting
   - Error handling

2. E2E Scenarios
   - User journeys
   - Complex workflows
   - Edge cases
   - Error scenarios

3. Performance Tests
   - Load testing
   - Stress testing
   - Scalability checks
   - Resource usage

### Phase 4: SDK & Contracts
1. SDK Generation
   - Type generation
   - API compatibility
   - Version management
   - Breaking changes

2. Contract Tests
   - API contracts
   - Schema validation
   - Backward compatibility
   - Documentation sync

# Testing Guidelines
1. Test File Organization:
   - Co-locate test files with source files
   - Use `.spec.ts` for unit tests, `.e2e-spec.ts` for E2E
   - Group related tests in describe blocks
   - Clear, descriptive test names
   - Test DTOs through controller/service integration tests, not separately

2. Test Structure:
   - Follow Arrange-Act-Assert pattern
   - One behavior per test
   - Use beforeEach for setup
   - Clean up in afterEach when needed
   - Mock external dependencies
   - Only create separate DTO tests for custom validation or transformation logic

3. Coverage Requirements:
   - 80% minimum for critical paths
   - 60% minimum overall coverage
   - 100% for permission code
   - Test success and error cases
   - Include edge cases
   - Ensure DTOs are covered through controller/service tests
   - Run `npm run test:cov` after changes to verify coverage
   - Fix failing tests before committing changes
   - Never delete existing tests unless part of approved refactoring

4. Database Testing:
   - Use test database
   - Clean before each test
   - Use transactions
   - Mock for unit tests
   - Real DB for E2E
   - Verify database cleanup works correctly

5. Authentication Testing:
   - Test auth states
   - Verify tokens
   - Check permissions
   - Test refresh flows
   - Test expiration

6. Error Handling:
   - Test all errors
   - Verify messages
   - Check status codes
   - Test validation
   - Verify logging

7. Code Quality:
   - No test duplication
   - Use test helpers
   - Keep maintainable
   - Document complexity
   - Follow style guide

8. Test Verification Steps:
   - Run `npm run test` after every code change
   - Run `npm run test:cov` to check coverage
   - Fix any failing tests immediately
   - Improve coverage if below requirements
   - Document any coverage exceptions
   - Never skip test verification