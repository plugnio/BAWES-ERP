# Initial Setup Guide

This guide will help you set up your development environment and create your first admin user.

## Prerequisites

1. **Required Tools**
   - Node.js 18 or later
   - Docker Desktop
   - Git

2. **Recommended Tools**
   - VS Code with extensions:
     - ESLint
     - Prettier
     - Prisma
     - Docker
     - GitLens
     - DotENV
   - PostgreSQL client (optional)

## Setup Steps

1. **Install Dependencies**   
```bash
   npm install   
```

2. **Set Up Environment**   
```bash
   cp .env.sample .env   
```
   Edit `.env` file with your database credentials and other configurations.

3. **Database Setup**   
```bash
   # Run migrations to create database schema
   npx prisma migrate dev

   # Run seeds to populate initial data (including RBAC setup)
   npx prisma db seed   
```
   This creates the database schema and seeds the SUPER_ADMIN role.

4. **Start Development Server**  
```bash
   npm run start:dev   
```
   This step is crucial as it:
   - Discovers permissions from controller decorators
   - Syncs permissions to the database
   - Assigns all permissions to SUPER_ADMIN role

5. **Create Admin User**  
```bash
   # In a new terminal
   npm run create:admin   
```
   Follow the interactive prompts to create your admin account.
   The admin will automatically receive all permissions through the SUPER_ADMIN role.

> **Important**: The order of these steps matters:
> 1. Database setup must come first to create the SUPER_ADMIN role
> 2. Starting the server discovers and syncs permissions to SUPER_ADMIN role
> 3. Creating admin user last ensures it gets all permissions through role inheritance

## Understanding RBAC (Role-Based Access Control)

Our RBAC system is designed to be flexible and scalable:

- **Permissions** are automatically discovered and managed
- **Super Admin** role is created during seeding and has all permissions
- New permissions are automatically added when detected
- Permissions use efficient bitfield storage for fast checking

### RBAC Initialization Process

The RBAC system initializes in the following sequence:

1. **Database Seeding**
   - Creates SUPER_ADMIN role
   - Sets up basic system roles
   - Prepares role-permission structure

2. **Permission Discovery**
   - Runs when application starts
   - Scans all controllers for @RequirePermission decorators
   - Creates new permissions in database
   - Assigns all permissions to SUPER_ADMIN role

3. **Admin User Creation**
   - Creates admin user account
   - Assigns SUPER_ADMIN role
   - Inherits all permissions through role

This sequence ensures that:
- All permissions are properly discovered
- SUPER_ADMIN role has complete access
- Admin user has full system control
- Permissions are consistently managed

### Permission Structure

Permissions follow the format: `category.action`
Examples:
- `users.create`
- `roles.update`
- `permissions.manage`

### Key Files

- `prisma/data/production/rbac.ts` - Production RBAC seeds
- `prisma/data/development/rbac.ts` - Development RBAC seeds
- `src/rbac/` - RBAC implementation

## Development Workflow

1. **Start Development Server**   ```bash
   npm run start:dev   ```

2. **Access API Documentation**
   - Swagger UI: http://localhost:3000/api
   - OpenAPI JSON: http://localhost:3000/api-json

3. **Testing**   ```bash
   # Run unit tests
   npm run test

   # Run e2e tests
   npm run test:e2e   ```

## Development Workflow

### Daily Development

1. Start infrastructure:
   ```bash
   docker compose up -d
   ```

2. Start development server:
   ```bash
   npm run start:dev
   ```

3. Access services:
   - API: http://localhost:3000
   - Swagger: http://localhost:3000/api
   - Prisma Studio: `npx prisma studio`

### Debugging

1. **VS Code Debugging**
   - Start server in debug mode: `npm run start:debug`
   - Add breakpoints in VS Code
   - Use VS Code debug console

2. **API Testing**
   - Use Swagger UI for endpoint testing
   - Check logs: `docker compose logs -f`
   - Monitor Redis: `docker compose exec redis redis-cli`

### Database Operations

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

### Package Management

```bash
# Install new package
npm install package-name

# Update dependencies
npm update

# Audit dependencies
npm audit
npm audit fix
```

### SDK Development

1. **Feature Branch Development**
   ```bash
   git checkout -b feature/my-feature
   # SDK auto-generates on push
   git push origin feature/my-feature
   ```

2. **SDK Versioning**
   - Feature branches: `0.0.0-feature-name-timestamp`
   - Dev branch: `0.0.0-dev-timestamp`
   - Main branch: Semantic versioning

3. **Testing SDK Changes**
   - SDK updates on every push
   - Use branch-specific SDK in frontend
   - Test thoroughly before merging

## Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Check database status
   docker compose ps
   
   # Reset database
   npx prisma migrate reset
   
   # Check database logs
   docker compose logs postgres
   ```

2. **Node Modules**
   ```bash
   # Clean install
   rm -rf node_modules
   npm install
   
   # Clear npm cache if needed
   npm cache clean --force
   ```

3. **Docker Issues**
   ```bash
   # Full reset
   docker compose down
   docker system prune -f
   docker compose up -d
   
   # Check container logs
   docker compose logs -f
   ```

## Additional Resources

- [Development Standards](./development/README.md)
- [Contributing Guide](./development/contributing.md)
- [Style Guide](./development/style-guide.md)
- [Testing Guide](./development/testing.md)
- [API Documentation](./api/README.md)
- [Architecture Overview](./core/architecture.md)


## Common Tasks

### Adding New Permissions

1. Create your new endpoint with `@RequirePermission('category.action')` decorator
2. Permissions are automatically discovered and added on next server start
3. Assign the new permission to roles as needed

### Managing Roles

- Super Admin role is system-managed and cannot be modified via API
- Other roles can be managed through the roles API endpoints
- Role changes trigger permission cache clearing

## Troubleshooting

If you encounter issues:

1. Ensure database migrations are up to date   ```bash
   npm run migrate:dev   ```

2. Refresh seeds   ```bash
   npm run seed   ```

3. Clear permission cache   ```bash
   # Via API endpoint (requires admin access)
   POST /api/permissions/cache/clear   ```

For more detailed information, check the other documentation files in the `/docs` directory. 