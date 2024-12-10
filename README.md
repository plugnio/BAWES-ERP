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

## Testing
```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate test coverage
npm run test:cov
```

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
