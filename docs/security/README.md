# Security Documentation

Welcome to the BAWES ERP security documentation. This section covers authentication, authorization, and security best practices.

## Quick Start

### Authentication

```typescript
// Get JWT token
const response = await fetch('https://api.bawes-erp.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'your_password'
  })
});

const { accessToken, refreshToken } = await response.json();
```

### Using Authentication

```typescript
// Make authenticated request
const response = await fetch('https://api.bawes-erp.com/api/resource', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

## Contents

- [Authentication Guide](./authentication.md) - Detailed authentication docs
- [Authorization Guide](./authorization.md) - Access control and permissions
- [Best Practices](./best-practices.md) - Security guidelines

## Features

### JWT Authentication
- Access tokens for API requests
- Refresh tokens for session management
- Token rotation for security
- Configurable expiration times

### Authorization
- Role-based access control (RBAC)
- Permission-based actions
- Resource-level permissions
- Hierarchical roles

### Security Features
- HTTPS everywhere
- CORS protection
- Rate limiting
- Input validation
- SQL injection protection
- XSS protection

## Best Practices

1. **Token Management**
   - Store tokens securely
   - Refresh before expiration
   - Clear on logout
   - Handle token errors

2. **Password Security**
   - Strong password requirements
   - Secure password reset
   - Account lockout
   - 2FA when available

3. **API Security**
   - Always use HTTPS
   - Validate all input
   - Handle errors securely
   - Follow least privilege

## Implementation Guide

### Setting Up Authentication

1. **Initialize SDK with Auth**
   ```typescript
   const client = new BawesErpClient({
     baseUrl: 'YOUR_API_URL',
     onTokenRefresh: async (refreshToken) => {
       // Handle token refresh
       const newToken = await refreshAccessToken(refreshToken);
       return newToken;
     }
   });
   ```

2. **Handle Login**
   ```typescript
   try {
     const { accessToken, refreshToken } = await client.auth.login({
       email: 'user@example.com',
       password: 'password'
     });
     // Store tokens securely
   } catch (error) {
     // Handle auth error
   }
   ```

3. **Automatic Token Refresh**
   ```typescript
   client.setTokenRefreshCallback(async (refreshToken) => {
     try {
       const newToken = await client.auth.refresh(refreshToken);
       return newToken;
     } catch (error) {
       // Handle refresh error
       return null;
     }
   });
   ```

## Related Documentation

- [API Documentation](../api/README.md)
- [SDK Guide](../sdk/README.md)
- [Development Guide](../development/README.md) 