# API Documentation Guide

## Overview
BAWES ERP uses Swagger/OpenAPI for API documentation. The documentation is automatically generated from code annotations and provides an interactive interface for exploring and testing the API endpoints.

## Accessing the Documentation
- **Development**: Visit `http://localhost:3000/api` when running the application locally
- **Production**: Visit `https://your-domain.com/api` (replace with actual domain)

## Setup Details

### Core Configuration
The Swagger setup is configured in `src/main.ts`:

```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

// Swagger configuration
const config = new DocumentBuilder()
  .setTitle('BAWES ERP API')
  .setDescription('The BAWES ERP system API documentation')
  .setVersion('1.0')
  .addBearerAuth()  // Enables JWT authentication documentation
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);
```

### Authentication
- The API uses JWT Bearer token authentication
- Protected routes are marked with a lock icon in the Swagger UI
- The `addBearerAuth()` configuration enables the Authorization button in Swagger UI
- Use the "Authorize" button to input your JWT token for testing protected endpoints

## Documenting Endpoints

### Controller Level Decorators
```typescript
@ApiTags('Authentication')  // Groups endpoints under 'Authentication' section
@Controller('auth')
export class AuthController {}
```

### Endpoint Level Decorators
```typescript
// Operation metadata
@ApiOperation({ summary: 'User login' })

// Request body documentation
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      email: { type: 'string', example: 'user@example.com' },
      password: { type: 'string', example: 'password123' }
    }
  }
})

// Response documentation
@ApiResponse({ status: 200, description: 'Login successful' })
@ApiResponse({ status: 401, description: 'Invalid credentials' })
```

### Example Documented Endpoint
```typescript
@Public()
@Post('login')
@HttpCode(HttpStatus.OK)
@ApiOperation({ summary: 'User login' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      email: { type: 'string', example: 'user@example.com' },
      password: { type: 'string', example: 'password123' }
    }
  }
})
@ApiResponse({ status: 200, description: 'Login successful' })
@ApiResponse({ status: 401, description: 'Invalid credentials' })
async login(@Body() data: { email: string; password: string }) {
  // Implementation
}
```

## Currently Documented Endpoints

### Authentication Module
- **POST /auth/login**
  - Purpose: Authenticate user and receive JWT tokens
  - Body: `{ email: string, password: string }`
  - Responses: 200 (Success), 401 (Invalid credentials)

- **POST /auth/register**
  - Purpose: Register new user
  - Body: `{ email: string, password: string, nameEn?: string, nameAr?: string }`
  - Responses: 201 (Created), 400 (Bad request)

- **POST /auth/refresh**
  - Purpose: Refresh access token using refresh token
  - Body: `{ refresh_token: string }`
  - Responses: 200 (Success), 401 (Invalid token)

- **POST /auth/logout**
  - Purpose: Invalidate refresh token
  - Body: `{ refresh_token: string }`
  - Responses: 200 (Success)

- **POST /auth/verify-email**
  - Purpose: Verify user's email address
  - Body: `{ email: string, code: string }`
  - Responses: 200 (Success), 400 (Invalid code)

## Best Practices

### Documentation Guidelines
1. Always include:
   - Clear summary using `@ApiOperation`
   - Request body schema when applicable
   - Possible response codes and descriptions
   - Meaningful examples in schemas

2. Group related endpoints using `@ApiTags`

3. Document security requirements:
   - Use `@ApiBearerAuth()` for JWT protected routes
   - Mark public routes with `@Public()`

### Schema Documentation
1. Use descriptive examples:
```typescript
email: { 
  type: 'string', 
  example: 'user@example.com',
  description: 'User\'s email address'
}
```

2. Include validation rules:
```typescript
password: { 
  type: 'string',
  example: 'password123',
  description: 'User password - minimum 8 characters'
}
```

## Development Workflow

### Adding New Endpoints
1. Add the endpoint to your controller
2. Document using Swagger decorators
3. Include in appropriate `@ApiTags` group
4. Add security decorators if needed
5. Test in Swagger UI

### Updating Documentation
1. Changes to decorators are reflected immediately in dev mode
2. Restart the application if changing core Swagger config
3. Always test documentation changes in Swagger UI

## Testing in Swagger UI
1. Navigate to `/api` endpoint
2. Click "Authorize" for protected endpoints
3. Enter Bearer token: `Bearer your-jwt-token`
4. Expand endpoint section
5. Click "Try it out"
6. Fill in parameters
7. Execute and check response

## Common Issues and Solutions
1. **Bearer Token Not Working**
   - Ensure token format: `Bearer your-token`
   - Check token expiration
   - Verify token is properly signed

2. **Schema Not Showing**
   - Verify `@ApiBody` decorator is properly configured
   - Check for syntax errors in schema definition

3. **Protected Routes Not Marked**
   - Ensure `@ApiBearerAuth()` is applied
   - Check security scheme configuration 