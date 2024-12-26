# Contract Testing Guide

This guide covers contract testing, focusing on SDK generation and API compatibility.

## Overview

Contract tests ensure:
- API backward compatibility
- SDK generation correctness
- OpenAPI specification accuracy
- Breaking change detection
- Type safety across clients

## SDK Generation Testing

### Test Structure
```typescript
// test/sdk/sdk-generation.spec.ts
describe('SDK Generation', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    // Set up test app with Swagger
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    
    // Configure Swagger
    const config = new DocumentBuilder()
      .setTitle('API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
      
    const document = SwaggerModule.createDocument(app, config);
    
    // Save OpenAPI spec
    await fs.writeFile('swagger.json', JSON.stringify(document));
    
    await app.init();
  });

  it('should generate valid SDK', async () => {
    // Generate SDK
    await exec('npm run generate:sdk');
    
    // Verify SDK structure
    expect(fs.existsSync('./tmp-sdk/src')).toBe(true);
    expect(fs.existsSync('./tmp-sdk/package.json')).toBe(true);
    
    // Build SDK
    await exec('npm run build:sdk');
    
    // Verify build artifacts
    expect(fs.existsSync('./tmp-sdk/dist')).toBe(true);
  });

  it('should generate correct types', async () => {
    const sdkTypes = await fs.readFile('./tmp-sdk/src/api.ts', 'utf8');
    
    // Verify DTO types
    expect(sdkTypes).toContain('export interface CreateUserDto');
    expect(sdkTypes).toContain('export interface UpdateUserDto');
    
    // Verify response types
    expect(sdkTypes).toContain('export interface UserResponse');
    
    // Verify enum types
    expect(sdkTypes).toContain('export enum UserRole');
  });
});
```

### Breaking Change Detection

```typescript
// test/sdk/breaking-changes.spec.ts
describe('Breaking Changes', () => {
  it('should detect breaking changes', async () => {
    // Get current OpenAPI spec
    const currentSpec = JSON.parse(
      await fs.readFile('swagger.json', 'utf8')
    );
    
    // Get previous version spec
    const previousSpec = JSON.parse(
      await fs.readFile('swagger.previous.json', 'utf8')
    );
    
    // Compare specs
    const changes = await openApiDiff.compare(previousSpec, currentSpec);
    
    // No breaking changes allowed
    expect(changes.breaking).toHaveLength(0);
    
    // Log non-breaking changes
    console.log('Non-breaking changes:', changes.nonBreaking);
  });
});
```

## API Contract Testing

### Endpoint Contracts

```typescript
// test/contracts/users.contract.spec.ts
describe('Users API Contract', () => {
  let testSetup: TestSetup;

  beforeAll(async () => {
    testSetup = await new TestSetup().init();
  });

  describe('GET /users', () => {
    it('should match contract', async () => {
      const response = await request(testSetup.app.getHttpServer())
        .get('/users')
        .expect(200);

      // Verify response schema
      expect(response.body).toMatchSchema({
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'email', 'roles'],
          properties: {
            id: { type: 'number' },
            email: { type: 'string', format: 'email' },
            roles: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      });
    });
  });

  describe('POST /users', () => {
    it('should validate request contract', async () => {
      // Invalid request (missing required field)
      await request(testSetup.app.getHttpServer())
        .post('/users')
        .send({})
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('email');
        });

      // Invalid request (wrong type)
      await request(testSetup.app.getHttpServer())
        .post('/users')
        .send({ email: 123 })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('email');
        });

      // Valid request
      await request(testSetup.app.getHttpServer())
        .post('/users')
        .send({ email: 'test@example.com' })
        .expect(201)
        .expect(res => {
          expect(res.body.id).toBeDefined();
          expect(res.body.email).toBe('test@example.com');
        });
    });
  });
});
```

### Response Headers

```typescript
describe('Response Headers', () => {
  it('should include required headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/users');

    // Verify CORS headers
    expect(response.headers['access-control-allow-origin']).toBeDefined();
    
    // Verify content type
    expect(response.headers['content-type']).toContain('application/json');
    
    // Verify cache headers
    expect(response.headers['cache-control']).toBeDefined();
  });
});
```

### Authentication Contracts

```typescript
describe('Authentication Contracts', () => {
  it('should enforce token format', async () => {
    // Missing token
    await request(app.getHttpServer())
      .get('/protected')
      .expect(401);

    // Invalid token format
    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Invalid')
      .expect(401);

    // Valid token format but expired
    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer ' + EXPIRED_TOKEN)
      .expect(401)
      .expect(res => {
        expect(res.body.message).toContain('expired');
      });
  });
});
```

## SDK Integration Testing

### TypeScript Client

```typescript
// test/sdk/client.spec.ts
describe('TypeScript Client', () => {
  it('should use SDK correctly', async () => {
    const api = new Api({
      baseURL: 'http://localhost:3000',
      headers: { Authorization: `Bearer ${token}` },
    });

    // Create user
    const user = await api.users.createUser({
      email: 'test@example.com',
      roles: ['USER'],
    });
    expect(user.id).toBeDefined();

    // Update user
    const updated = await api.users.updateUser(user.id, {
      email: 'updated@example.com',
    });
    expect(updated.email).toBe('updated@example.com');

    // Delete user
    await api.users.deleteUser(user.id);
    
    // Verify deletion
    await expect(
      api.users.getUser(user.id)
    ).rejects.toThrow('Not Found');
  });
});
```

## Version Management

### Version Testing

```typescript
describe('API Versioning', () => {
  it('should handle versioned endpoints', async () => {
    // V1 endpoint
    const v1Response = await request(app.getHttpServer())
      .get('/v1/users')
      .expect(200);

    // V2 endpoint with new fields
    const v2Response = await request(app.getHttpServer())
      .get('/v2/users')
      .expect(200);

    // V2 should have additional fields
    expect(v2Response.body[0]).toHaveProperty('metadata');
    expect(v1Response.body[0]).not.toHaveProperty('metadata');
  });
});
```

## Best Practices

### OpenAPI Specification
- Keep spec up to date
- Document all responses
- Use proper types
- Include examples
- Document security

### Version Control
- Track spec changes
- Review breaking changes
- Version SDKs properly
- Maintain changelog
- Tag releases

### Testing Strategy
- Test all endpoints
- Verify response formats
- Check error cases
- Validate headers
- Test SDK integration

### Documentation
- Clear descriptions
- Request/response examples
- Error explanations
- Authentication details
- Rate limit info

## Common Pitfalls

1. Breaking Changes
   - Removing fields
   - Changing types
   - Renaming properties
   - Changing URLs
   - Modifying auth

2. SDK Issues
   - Type mismatches
   - Missing endpoints
   - Wrong defaults
   - Auth problems
   - Error handling

3. Documentation
   - Outdated examples
   - Missing errors
   - Wrong types
   - Unclear auth
   - Missing fields

## Next Steps

1. Review [Performance Testing Guide](./performance-testing.md)
2. Set up contract testing
3. Configure SDK generation
4. Add breaking change detection
5. Document your APIs 