# BAWES ERP Style Guide

## Code Style

### TypeScript Guidelines

- Use TypeScript for all new code
- Enable strict mode
- Use explicit types where beneficial
- Use interfaces for object shapes

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Bad
const user = {
  id: '123',
  name: 'John',
  email: 'john@example.com'
};
```

### Naming Conventions

- Use PascalCase for class names
- Use camelCase for variables and functions
- Use UPPER_SNAKE_CASE for constants
- Use descriptive names

```typescript
// Good
class BankTransaction {
  private readonly MAX_AMOUNT = 1000000;
  
  processPayment(amount: number): void {
    // implementation
  }
}

// Bad
class trans {
  private readonly max = 1000000;
  
  process(a: number): void {
    // implementation
  }
}
```

### File Organization

- One class per file
- Group related functionality
- Use feature-based directory structure
- Keep files focused and small

### Comments and Documentation

- Use JSDoc for public APIs
- Write clear, concise comments
- Document complex algorithms
- Include usage examples

```typescript
/**
 * Processes a bank transaction
 * @param {number} amount - The transaction amount
 * @param {string} accountId - The account identifier
 * @returns {Promise<Transaction>} The processed transaction
 * @throws {InvalidAmountError} If amount is invalid
 */
async function processTransaction(
  amount: number,
  accountId: string
): Promise<Transaction> {
  // implementation
}
```

### Error Handling

- Use custom error classes
- Include error context
- Handle async errors properly
- Log errors appropriately

### Testing

- Write unit tests for all new code
- Use descriptive test names
- Follow AAA pattern (Arrange-Act-Assert)
- Mock external dependencies

```typescript
describe('BankTransaction', () => {
  it('should process valid payment', async () => {
    // Arrange
    const transaction = new BankTransaction();
    const amount = 100;
    
    // Act
    const result = await transaction.processPayment(amount);
    
    // Assert
    expect(result.status).toBe('success');
  });
});
```

## Financial Code Guidelines

### Decimal Handling

- Use decimal.js for all monetary calculations
- Never use floating-point arithmetic
- Validate decimal places
- Document precision requirements

```typescript
import { Decimal } from 'decimal.js';

// Good
const amount = new Decimal('100.50');
const total = amount.plus(new Decimal('50.25'));

// Bad
const amount = 100.50;
const total = amount + 50.25;
```

### Currency Operations

- Always specify currency
- Use ISO currency codes
- Handle exchange rates carefully
- Document rounding behavior

## Git Commit Guidelines

- Use conventional commits
- Write clear commit messages
- Keep commits focused
- Reference issues

```bash
# Good
git commit -m "feat(banking): add transaction validation"

# Bad
git commit -m "fixed stuff"
```

## Code Review Guidelines

- Review for security issues
- Check for performance impacts
- Verify error handling
- Ensure test coverage
``` 