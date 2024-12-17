# Getting Started with BAWES-ERP

This guide helps you set up your development environment for BAWES-ERP.

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

## Development Setup

1. **Clone Repository**
   ```bash
   git clone [repository-url]
   cd BAWES-ERP
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.sample .env
   ```
   
   Configure your .env file with appropriate values:
   ```env
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_USER=erpuser
   DATABASE_PASSWORD=erppassword
   DATABASE_NAME=erp_db
   DATABASE_PORT=5432
   DATABASE_URL="postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public"

   # JWT Configuration
   JWT_SECRET=your-super-secret-key-change-in-production
   JWT_ACCESS_TOKEN_EXPIRY=15m
   JWT_REFRESH_TOKEN_EXPIRY=7d

   # CORS Configuration
   ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

   # Redis Configuration
   REDIS_HOST=redis
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_TTL=3600
   REDIS_MAX_MEMORY=2gb
   ```

4. **Start Infrastructure**
   ```bash
   docker compose up -d
   ```

5. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev
   ```

6. **Start Development Server**
   ```bash
   npm run start:dev
   ```

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

## Project Structure

```
├── src/                # Source code
│   ├── auth/          # Authentication & authorization
│   │   ├── guards/    # Auth guards
│   │   └── strategies/# Auth strategies
│   ├── users/         # User management
│   ├── rbac/          # Role-based access control
│   └── cache/         # Caching implementation
├── prisma/            # Database schema and migrations
│   ├── schema.prisma  # Database schema
│   └── migrations/    # Migration files
├── test/             # Test files
│   ├── e2e/         # End-to-end tests
│   └── unit/        # Unit tests
├── docs/            # Documentation
└── scripts/        # Utility scripts
```

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
