# API Documentation

Welcome to the BAWES ERP API documentation. This section covers everything you need to know about our REST API.

## Quick Start

1. **Authentication**
   ```bash
   # Get JWT token
   curl -X POST https://api.bawes-erp.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "user@example.com", "password": "your_password"}'
   ```

2. **Using the Token**
   ```bash
   # Make authenticated request
   curl -X GET https://api.bawes-erp.com/api/resource \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Contents

- [API Reference](./endpoints.md) - Detailed endpoint documentation
- [Breaking Changes](./breaking-changes.md) - Guide to API changes and versioning
- [Error Handling](./error-handling.md) - API error codes and handling

## Documentation Features

### Automatic Generation
Our API documentation is automatically generated from code annotations using OpenAPI/Swagger:

1. Code annotations in controllers
2. Automatic OpenAPI spec generation
3. Swagger UI for interactive testing
4. SDK generation from OpenAPI spec

### Interactive Documentation
Visit our Swagger UI:
- Development: `http://localhost:3000/api`
- Production: `https://api.bawes-erp.com/api`

## Best Practices

1. **Authentication**
   - Always use HTTPS
   - Include JWT token in Authorization header
   - Refresh tokens before expiry

2. **Error Handling**
   - Check HTTP status codes
   - Read error messages in response body
   - Handle rate limiting appropriately

3. **Data Formats**
   - Use JSON for request/response bodies
   - Follow date format: ISO 8601
   - Handle pagination for list endpoints

## Versioning

We use semantic versioning for our API:
- Major version: Breaking changes (v1 → v2)
- Minor version: New features (v1.1 → v1.2)
- Patch version: Bug fixes (v1.1.1 → v1.1.2)

## Related Documentation

- [SDK Guide](../sdk/README.md) - Using our TypeScript SDK
- [Security](../security/README.md) - Authentication & authorization
- [Development](../development/README.md) - Contributing to the API