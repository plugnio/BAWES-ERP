# BAWES ERP Documentation

## Documentation Structure

### Core Concepts
Our core documentation covers the fundamental aspects of the BAWES ERP system:

- **[Authentication & Security](auth.md)**
  - JWT-based authentication
  - Security best practices
  - Service-to-service communication

### Banking Integration
Documentation for banking operations:

- **Banking Operations**
  - [Bank Statements](banking/statements.md)
  - [ABK Accounts](banking/abkAccounts.md)
  - [Bank Output](banking/bankoutput.md)

## File Structure
```
docs/
├── readme.md              # This file
├── auth.md               # Authentication guide
├── roadmap.md            # Project roadmap
│
└── banking/             # Banking documentation
    ├── abkAccounts.md   # ABK accounts reference
    ├── bankoutput.md    # Bank output format reference
    └── statements.md    # Bank statements guide
```

## Documentation Standards
When contributing to documentation:

1. File Organization
   - Keep documentation in appropriate subdirectories
   - Use clear, descriptive filenames (lowercase .md extension)
   - Maintain the existing directory structure

2. Content Guidelines
   - Start each document with a clear overview
   - Include code examples where appropriate
   - Keep content focused and concise
   - Use proper Markdown formatting

3. Linking
   - Use relative links between documents
   - Ensure all links are valid
   - Update the readme.md when adding new documents

4. Maintenance
   - Review and update documentation regularly
   - Remove outdated information
   - Keep the file structure documentation current

## Documentation Updates
This documentation is continuously updated. For the latest changes, please check the git history of the docs/ directory.
