# Initial Setup Guide

This guide will help you set up your development environment and create your first admin user.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 13 or higher
- npm or yarn

## Setup Steps

1. **Install Dependencies**   ```bash
   npm install   ```

2. **Set Up Environment**   ```bash
   cp .env.example .env   ```
   Edit `.env` file with your database credentials and other configurations.

3. **Database Setup**   ```bash
   # Run migrations to create database schema
   npm run migrate:dev

   # Run seeds to populate initial data (including RBAC setup)
   npm run seed   ```

4. **Create Admin User**   ```bash
   npm run create:admin   ```
   Follow the interactive prompts to create your admin account.

## Understanding RBAC (Role-Based Access Control)

Our RBAC system is designed to be flexible and scalable:

- **Permissions** are automatically discovered and managed
- **Super Admin** role is created during seeding and has all permissions
- New permissions are automatically added when detected
- Permissions use efficient bitfield storage for fast checking

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