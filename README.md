# BAWES ERP System

## Overview
BAWES ERP is a comprehensive enterprise resource planning system built with NestJS, designed to handle business operations including banking, accounting, and workflow management.

## Quick Start
```bash
# Install dependencies
npm install

# Setup environment
cp .env.sample .env

# Run development server
npm run start:dev

# Run production build
npm run start:prod
```

## Core Features
- 🏦 Banking Integration
- 🔐 Centralized Authentication
- 💼 Multi-currency Support
- 📊 Financial Reporting
- 🔄 Workflow Management

## API Documentation & SDK

### Swagger Documentation
- Access the interactive API documentation at `/api` when running the application
- View comprehensive documentation guide at [API Documentation](docs/api-documentation.md)
- Test endpoints directly through the Swagger UI

### TypeScript SDK
The project automatically generates and maintains a TypeScript SDK for frontend consumption. The SDK is hosted directly on GitHub for easy installation.

#### Using the SDK in Frontend Projects

1. **Installation**
   ```bash
   # Install directly from GitHub
   npm install github:bawes/erp-sdk#v1.0.0
   ```

   Or in your `package.json`:
   ```json
   {
     "dependencies": {
       "@bawes/erp-api-sdk": "github:bawes/erp-sdk#v1.0.0"
     }
   }
   ```

2. **Usage**
   ```typescript
   import { DefaultApi } from '@bawes/erp-api-sdk';

   const api = new DefaultApi({
     basePath: process.env.NEXT_PUBLIC_API_URL,
     accessToken: () => localStorage.getItem('token') || ''
   });

   // Type-safe API calls
   const login = async (email: string, password: string) => {
     const response = await api.authControllerLogin({ email, password });
     return response.data;
   };
   ```

### SDK Development Workflow

1. **Automatic Generation**
   - SDK is automatically generated from Swagger documentation
   - Generated when pushing changes to `main` branch
   - Published to GitHub repository with version tags

2. **Breaking Changes Detection**
   - Automatically checks for breaking API changes
   - Creates GitHub issues for breaking changes
   - Enforces semantic versioning through git tags

3. **Version Management**
   - Use specific versions via git tags (e.g., `#v1.0.0`)
   - Use latest version via branch name (e.g., `#main`)
   - Breaking changes trigger GitHub issues

4. **Local Development**
   ```bash
   # Generate SDK locally
   npm run generate:sdk

   # Build SDK
   npm run build:sdk

   # Check for breaking changes
   npm run check:breaking-changes
   ```

### Frontend Development Guidelines

1. **Environment Setup**
   ```typescript
   // .env.local in NextJS project
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

2. **Type Safety**
   - Use generated types for API requests/responses
   - TypeScript will catch API contract changes
   - IDE autocompletion for all API endpoints

3. **Financial Calculations**
   - Always use decimal.js for monetary calculations
   - Import Decimal from 'decimal.js'
   - Never use native JavaScript floating-point arithmetic

4. **Authentication**
   - JWT tokens handled automatically by SDK
   - Store tokens securely in localStorage/cookies
   - Refresh token flow included

## Testing
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:cov
```

## Contributing

### SDK Updates
1. Make changes to NestJS controllers/services
2. Update Swagger documentation
3. Push to main branch
4. GitHub Actions will:
   - Check for breaking changes
   - Generate new SDK version
   - Push to SDK repository with version tag

### Breaking Changes
When breaking changes are detected:
1. GitHub issue is created automatically
2. Review the changes in the issue
3. Update major version if proceeding
4. Notify frontend teams

### Version Updates
Frontend developers can:
1. Watch repository for new tags
2. Review breaking changes in issues
3. Update SDK version when ready
4. Test against new API version

## Documentation
For detailed documentation, please see our [documentation hub](docs/README.md).

### Quick Links

#### Core Concepts
- [Authentication & Security](docs/auth.md)

#### Banking Documentation
- [Bank Statements](docs/banking/statements.md)
- [ABK Accounts](docs/banking/abkAccounts.md)
- [Bank Output](docs/banking/bankoutput.md)

## Project Structure
```
├── docs/                    # Documentation
│   ├── readme.md           # Documentation hub
│   ├── auth.md             # Authentication guide
│   ├── roadmap.md          # Project roadmap
│   └── banking/            # Banking documentation
│       ├── abkAccounts.md
│       ├── bankoutput.md
│       └── statements.md
├── prisma/                 # Database schema and migrations
├── src/                    # Source code
└── test/                   # Test files
```

## Documentation Standards
When contributing to documentation:

1. File Organization
   - Keep documentation in appropriate subdirectories
   - Use clear, descriptive filenames
   - Maintain the existing directory structure

2. Content Guidelines
   - Start each document with a clear overview
   - Include code examples where appropriate
   - Keep content focused and concise
   - Use proper Markdown formatting

3. Linking
   - Use relative links between documents
   - Ensure all links are valid
   - Update the README.md when adding new documents

4. Maintenance
   - Review and update documentation regularly
   - Remove outdated information
   - Keep the file structure documentation current

## License
Proprietary - All rights reserved
