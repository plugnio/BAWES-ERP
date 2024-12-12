# Development Guide

Welcome to the BAWES ERP development documentation. This guide covers everything you need to know about developing for BAWES ERP.

## Quick Start

### Setup Development Environment

```bash
# Clone repositories
git clone git@github.com:plugnio/BAWES-ERP.git
git clone git@github.com:plugnio/BAWES-ERP-sdk.git

# Install dependencies
cd BAWES-ERP
npm install

# Start development server
npm run start:dev
```

### Running Tests

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:cov
```

## Contents

- [Setup Guide](./setup.md) - Development environment setup
- [Contributing Guide](./contributing.md) - How to contribute
- [Style Guide](./style-guide.md) - Coding standards
- [Testing Guide](./testing.md) - Testing practices

## Development Process

### 1. Code Standards
- TypeScript for type safety
- NestJS for backend
- Clean Architecture principles
- Test-Driven Development
- Comprehensive documentation

### 2. Version Control
- Feature branches
- Pull request workflow
- Semantic versioning
- Automated CI/CD

### 3. Testing Requirements
- Unit tests required
- E2E tests for critical paths
- Integration tests
- Test coverage requirements

## Best Practices

### 1. Code Quality
- Follow style guide
- Write clean, readable code
- Add comments when needed
- Keep functions small
- Use meaningful names

### 2. Testing
- Write tests first (TDD)
- Test edge cases
- Mock external services
- Keep tests maintainable

### 3. Documentation
- Document as you code
- Keep docs up to date
- Include examples
- Write clear commit messages

## Development Workflow

1. **Starting New Feature**
   ```bash
   # Create feature branch
   git checkout -b feature/your-feature
   
   # Make changes and test
   npm run test
   
   # Commit with conventional commits
   git commit -m "feat: add new feature"
   ```

2. **Submitting Changes**
   ```bash
   # Push to remote
   git push origin feature/your-feature
   
   # Create pull request
   gh pr create
   ```

3. **Review Process**
   - Code review required
   - Tests must pass
   - Style guide compliance
   - Documentation updated

## Tools and Technologies

### Core Stack
- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Jest for testing

### Development Tools
- VS Code (recommended)
- ESLint
- Prettier
- Git
- Docker

## Related Documentation

- [API Documentation](../api/README.md)
- [SDK Guide](../sdk/README.md)
- [Security Guide](../security/README.md) 