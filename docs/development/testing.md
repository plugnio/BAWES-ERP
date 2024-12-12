# Testing Guide

## Overview

This guide covers testing practices for the BAWES ERP system.

## Test Types

### Unit Tests

- Test individual components in isolation
- Mock external dependencies
- Focus on business logic
- High coverage required

```typescript
import { BankingService } from './banking.service';

describe('BankingService', () => {
  let service: BankingService;
  
  beforeEach(() => {
    service = new BankingService();
  });
  
  it('should validate transaction amount', () => {
    expect(service.validateAmount(-100)).toBe(false);
    expect(service.validateAmount(100)).toBe(true);
  });
});
```

### Integration Tests

- Test component interactions
- Use test databases
- Test API endpoints
- Verify data flow

```typescript
describe('Banking API', () => {
  it('should process transaction', async () => {
    const response = await request(app)
      .post('/api/transactions')
      .send({
        amount: 100,
        accountId: 'test123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });
});
```

### E2E Tests

- Test complete workflows
- Use production-like environment
- Test user scenarios
- Verify system integration

## Test Environment Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure test database:
   ```bash
   npm run test:db:setup
   ```

3. Run tests:
   ```bash
   npm run test        # Unit tests
   npm run test:e2e    # E2E tests
   npm run test:cov    # Coverage report
   ```

## Writing Tests

### Best Practices

- Use descriptive test names
- Follow AAA pattern
- One assertion per test
- Keep tests independent

### Test Structure

```typescript
describe('Feature', () => {
  describe('Subfeature', () => {
    it('should do something specific', () => {
      // Arrange
      const input = {};
      
      // Act
      const result = doSomething(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Mocking

- Use Jest mocks
- Mock external services
- Mock database calls
- Provide test doubles

```typescript
jest.mock('./database.service');

const mockDb = {
  query: jest.fn()
};

describe('Service', () => {
  beforeEach(() => {
    mockDb.query.mockReset();
  });
});
```

## Test Coverage

- Minimum 80% coverage required
- 100% coverage for critical paths
- Generate coverage reports
- Review uncovered code

## Continuous Integration

- Tests run on every PR
- All tests must pass
- Coverage must meet threshold
- Performance benchmarks

## Financial Testing

### Decimal Testing

- Test decimal precision
- Verify rounding behavior
- Test currency conversions
- Validate calculations

```typescript
import { Decimal } from 'decimal.js';

describe('Financial Calculations', () => {
  it('should handle precise decimals', () => {
    const amount = new Decimal('100.50');
    const result = amount.plus(new Decimal('0.01'));
    expect(result.toString()).toBe('100.51');
  });
});
```

## Security Testing

- Test authentication
- Test authorization
- Verify input validation
- Check error handling

## Performance Testing

- Load testing
- Stress testing
- Memory leaks
- Response times
``` 