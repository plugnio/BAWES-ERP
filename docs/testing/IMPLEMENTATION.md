# Test Implementation Plan

This document outlines the current test coverage and implementation plan to achieve our testing goals.

## Current Coverage Analysis

### Unit Tests
✅ Implemented:
- `src/rbac/services/permission.service.spec.ts`
- `src/person/person.service.spec.ts`
- `src/person/person.controller.spec.ts`
- `src/app.controller.spec.ts`

🚫 Missing:
- Role service tests
- Auth service tests
- Cache service tests
- Permission discovery tests
- Validation pipe tests
- Guard tests
- Interceptor tests

### E2E Tests
✅ Implemented:
- `test/app.e2e-spec.ts`
- `test/rbac/permission.e2e-spec.ts`

🚫 Missing:
- Auth flow E2E tests
- Person management E2E tests
- Role management E2E tests
- Permission assignment E2E tests
- SDK generation tests
- Contract tests
- Performance tests

### Integration Tests
🚫 Missing (All):
- Database integration tests
- Cache integration tests
- Service-to-service tests
- Transaction tests
- Event handling tests

## Implementation Priority

### Phase 1: Critical Path Tests
1. Authentication & Authorization
   - [ ] Auth service unit tests
   - [ ] Auth guard tests
   - [ ] JWT strategy tests
   - [ ] Auth E2E flow tests

2. RBAC Core
   - [ ] Role service unit tests
   - [ ] Permission discovery tests
   - [ ] Role assignment tests
   - [ ] Permission validation tests

3. Data Validation
   - [ ] DTO validation tests
   - [ ] Pipe tests
   - [ ] Input sanitization tests
   - [ ] Error handling tests

### Phase 2: Integration Tests
1. Database Operations
   - [ ] Transaction tests
   - [ ] Query performance tests
   - [ ] Batch operation tests
   - [ ] Error handling tests

2. Caching Layer
   - [ ] Cache service tests
   - [ ] Cache invalidation tests
   - [ ] Cache performance tests
   - [ ] Cache stampede tests

3. Service Integration
   - [ ] Service-to-service tests
   - [ ] Event handling tests
   - [ ] Error propagation tests
   - [ ] Circuit breaker tests

### Phase 3: Contract & SDK Tests
1. API Contracts
   - [ ] OpenAPI validation tests
   - [ ] Response schema tests
   - [ ] Error format tests
   - [ ] Header validation tests

2. SDK Generation
   - [ ] SDK build tests
   - [ ] Type generation tests
   - [ ] Breaking change tests
   - [ ] Version compatibility tests

### Phase 4: Performance Tests
1. Load Testing
   - [ ] Normal load tests
   - [ ] Peak load tests
   - [ ] Recovery tests
   - [ ] Error rate tests

2. Resource Usage
   - [ ] Memory leak tests
   - [ ] CPU usage tests
   - [ ] Database connection tests
   - [ ] Cache memory tests

## Implementation Tasks

### Immediate Tasks
1. Auth Service Tests
```typescript
// TODO: Create src/auth/services/auth.service.spec.ts
- Test login flow
- Test token generation
- Test password hashing
- Test token refresh
```

2. Role Service Tests
```typescript
// TODO: Create src/rbac/services/role.service.spec.ts
- Test role creation
- Test permission assignment
- Test role hierarchy
- Test permission inheritance
```

3. Cache Service Tests
```typescript
// TODO: Create src/cache/cache.service.spec.ts
- Test cache operations
- Test TTL handling
- Test invalidation
- Test concurrent access
```

### Next Steps
1. Create test utilities
```typescript
// TODO: Create test/helpers/test-utils.ts
- Database cleanup
- Test data generation
- Auth helpers
- Request helpers
```

2. Set up E2E infrastructure
```typescript
// TODO: Update test/test-setup.ts
- Add transaction support
- Add cache clearing
- Add auth helpers
- Add test data factories
```

3. Implement contract tests
```typescript
// TODO: Create test/contracts/api.contract.spec.ts
- OpenAPI validation
- Response schemas
- Error formats
- Breaking changes
```

## Coverage Goals

### Target Metrics
- Overall line coverage: 85%
- Branch coverage: 90%
- Critical paths: 100%
- E2E coverage: 100% of endpoints

### Current Metrics
- Overall line coverage: ~40%
- Branch coverage: ~35%
- Critical paths: ~50%
- E2E coverage: ~20%

## Timeline

### Week 1-2: Critical Path Tests
- [ ] Auth service tests
- [ ] Role service tests
- [ ] Permission tests
- [ ] Validation tests

### Week 3-4: Integration Tests
- [ ] Database tests
- [ ] Cache tests
- [ ] Service integration tests
- [ ] Event handling tests

### Week 5-6: Contract & SDK Tests
- [ ] API contract tests
- [ ] SDK generation tests
- [ ] Breaking change tests
- [ ] Version tests

### Week 7-8: Performance Tests
- [ ] Load tests
- [ ] Resource tests
- [ ] Monitoring setup
- [ ] Performance baselines

## Progress Tracking

Track progress directly in this document:
1. Update coverage metrics after each change
2. Mark completed tasks in implementation plan
3. Document any blockers or issues
4. Note any deviations from plan
5. Record test pattern improvements

## Test Workflow

### Before Making Changes
1. Run current tests and note status:
```bash
npm run test
npm run test:cov
```

2. Document current metrics in Coverage Report section

3. Check failing tests and document issues

### Making Changes
1. Make necessary code changes
2. Update tests to match implementation
3. Run tests frequently to catch issues early

### After Changes
1. Run full test suite:
```bash
npm run test
npm run test:cov
```

2. Compare metrics with previous run
3. Update Coverage Report section
4. Document any new patterns or utilities
5. Update Implementation Status

### If Tests Fail
1. Document exact error messages
2. Analyze root cause
3. Fix configuration issues first
4. Then fix implementation issues
5. Re-run tests after each fix

## Next Actions

1. [✓] Jest configuration updated for path aliases
2. [✓] Test database setup and migrations
3. [ ] Fix failing PersonService tests using new test helpers
4. [ ] Fix failing PermissionService tests
5. [ ] Add auth helper for test authentication

### Coverage Report Template
```
Last Updated: [DATE]

Unit Tests:
- Overall Coverage: XX%
- Files Covered: XX/XX
- Uncovered Lines: XX
- Critical Path Coverage: XX%

E2E Tests:
- API Endpoints Covered: XX%
- Scenarios Covered: XX/XX
- Missing Flows: XX

Integration Tests:
- Services Covered: XX%
- Database Operations: XX%
- Cache Operations: XX%
```

### Current Coverage Report
```
Last Updated: 2024-02-13

Unit Tests:
- Overall Coverage: 38.31%
- Branch Coverage: 17.72%
- Function Coverage: 28.57%
- Line Coverage: 36.01%

✅ High Coverage Areas:
1. Person Module:
   - PersonService: 100% coverage
   - PersonController: 78.26% coverage
   - DTOs: 90.9% coverage

2. RBAC Core:
   - PermissionService: 95.45% coverage
   - RoleService: 100% coverage
   - Permission Discovery Helper: 100% coverage
   - Test Module Helper: 100% coverage

🚫 Low Coverage Areas:
1. Auth Module:
   - AuthService: 10.69% coverage
   - Guards: 54.28% coverage
   - JWT Strategy: 43.33% coverage

2. RBAC Module:
   - PersonRoleService: 24.32% coverage
   - Permission Guard: 21.42% coverage
   - Permission Discovery Service: 44.73% coverage

3. Scripts & E2E Tests:
   - All scripts: 0% coverage
   - E2E tests: 0% coverage
```

### Implementation Status
```
Last Checked: 2024-02-13

✅ Completed:
- Basic app controller tests
- Test setup infrastructure
- Permission discovery integration
- Jest configuration with path aliases
- Database helper for test cleanup
- Test module helper for consistent setup
- Test environment configuration
- PersonService unit tests updated
- Test database migrations setup
- Database table validation
- PermissionService tests with high coverage
- RoleService tests with full coverage

🚧 In Progress:
- Fixing remaining unit tests
- Setting up test environment
- Implementing test helpers

⏱ Pending:
- Auth service tests
- Person-role service tests
- Permission guard tests
- E2E test coverage

❌ Blocked:
- None (previous blockers resolved)
```

### Immediate Actions Required
1. Fix test module configuration:
   ```typescript
   // Update test module setup to include PrismaService
   const module: TestingModule = await Test.createTestingModule({
     imports: [PrismaModule],
     providers: [PersonService],
   }).compile();
   ```

2. Fix decorator imports:
   ```typescript
   // Update path aliases in jest configuration
   moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/src/$1',
   }
   ```

3. Set up test database configuration:
   ```typescript
   // Add test database configuration
   // Update test-config.ts with proper database URL
   ```

## Coverage Validation & Maintenance

### Coverage Report Generation
```bash
# Generate coverage report
npm run test:cov

# Generate E2E coverage report
npm run test:e2e:cov
```

### Coverage Validation Steps
1. Before making changes:
   - Run coverage report
   - Note current coverage metrics
   - Document any failing tests

2. After making changes:
   - Run coverage report again
   - Compare with previous metrics
   - Ensure no regressions
   - Document any changes in coverage

3. Cross-check Implementation:
   - Verify file paths match actual codebase
   - Confirm test patterns match actual tests
   - Validate imports and dependencies
   - Check naming conventions

4. Documentation Updates:
   - Update coverage metrics in this doc
   - Add new test patterns if created
   - Document new test utilities
   - Note any deviations or special cases

### Validation Checklist
- [ ] Coverage report generated
- [ ] Metrics compared with previous
- [ ] File paths verified
- [ ] Test patterns validated
- [ ] Documentation updated
- [ ] No regressions introduced

## Progress Tracking

All will be maintained in this document.

## Next Actions

Next actions will be maintained in this document based on analysis results.

### Next Actions

1. [x] Create test environment file (.env.test)
2. [x] Fix failing PersonService tests using new test helpers
3. [ ] Fix failing PermissionService tests using new test helpers
4. [ ] Add auth helper for test authentication
5. [ ] Update E2E test setup with new helpers

1. [ ] Implement PersonRoleService tests
   ```typescript
   // TODO: Create src/rbac/services/person-role.service.spec.ts
   - Test role assignment
   - Test role removal
   - Test role validation
   - Test permission calculation
   ```

2. [ ] Implement AuthService tests
   ```typescript
   // TODO: Create src/auth/auth.service.spec.ts
   - Test login flow
   - Test token generation
   - Test password hashing
   - Test token refresh
   ```

3. [ ] Implement Permission Guard tests
   ```typescript
   // TODO: Create src/rbac/guards/permission.guard.spec.ts
   - Test permission validation
   - Test bitfield operations
   - Test cache integration
   - Test error handling
   ```