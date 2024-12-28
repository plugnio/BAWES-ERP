# Getting Started with BAWES ERP

## Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/plugnio/BAWES-ERP.git
cd BAWES-ERP
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Initialize the database and RBAC:
```bash
# Run migrations and create database schema
npx prisma migrate dev

# Seed initial data (including SUPER_ADMIN role)
npx prisma db seed
```

5. Start the development environment:
```bash
# This will discover and sync permissions
npm run start:dev
```

6. Create admin account:
```bash
# In a new terminal
npm run create:admin
```

> **Note**: The order of steps 4-6 is important for proper RBAC initialization:
> 1. Database setup creates SUPER_ADMIN role
> 2. Starting server discovers and assigns permissions
> 3. Admin creation grants all permissions via role

## First Steps

1. Access the API documentation at http://localhost:3000/api
2. Log in with your admin account
3. Configure banking integration
4. Start using the system

## Next Steps

- Read the [Architecture Guide](./architecture.md)
- Review [Security Documentation](../security/README.md)
- Explore [API Documentation](../api/README.md)
- Set up [Banking Integration](../integrations/banking/README.md)

## Need Help?

- Check our [Troubleshooting Guide](../development/README.md#troubleshooting)
- Review [Common Issues](../development/README.md#common-issues)
- Contact support 