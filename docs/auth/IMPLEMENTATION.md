# Authentication Implementation

## Overview
Our authentication system implements a secure JWT-based authentication with refresh token functionality. This document outlines the implementation details, security measures, and usage guidelines.

## Token System

### Access Tokens
- Short-lived JWT tokens (15 minutes by default)
- Used for API authentication
- Contains minimal payload (user ID)
- Stateless validation
- Transmitted via Authorization Bearer header

### Refresh Tokens
- Long-lived tokens (7 days by default)
- Stored in database with metadata
- Used to obtain new access tokens
- Can be revoked server-side
- Contains unique JTI (JWT ID) for tracking
- Transmitted only during refresh operations

## Authentication Flow

1. **Login Flow**
   ```
   POST /auth/login
   {
     "email": "user@example.com",
     "password": "password"
   }
   ```
   Response:
   ```json
   {
     "access_token": "eyJhbG...",
     "refresh_token": "eyJhbG...",
     "token_type": "Bearer",
     "expires_in": 900
   }
   ```

2. **Token Refresh Flow**
   ```
   POST /auth/refresh
   {
     "refresh_token": "eyJhbG..."
   }
   ```
   Response:
   ```json
   {
     "access_token": "eyJhbG...",
     "token_type": "Bearer",
     "expires_in": 900
   }
   ```

3. **Logout Flow**
   ```
   POST /auth/logout
   {
     "refresh_token": "eyJhbG..."
   }
   ```
   - Revokes the refresh token
   - Client should discard both tokens

## Security Measures

1. **Access Token Security**
   - Short lifespan (15 minutes)
   - Signed using RS256 algorithm
   - Contains minimal payload
   - Validated on every request

2. **Refresh Token Security**
   - Stored in database with metadata
   - Can be revoked server-side
   - Unique JTI for tracking
   - Rotation possible for enhanced security
   - HTTP-only cookie storage recommended

3. **Database Storage**
   - Refresh tokens tracked in database
   - Includes metadata (user ID, expiry, revocation status)
   - Regular cleanup of expired tokens
   - Ability to revoke tokens by user/device

## Implementation Details

### Environment Variables
```env
# JWT configuration
JWT_SECRET=your-secret-key
JWT_ACCESS_TOKEN_EXPIRY=15m  # Short-lived access tokens
JWT_REFRESH_TOKEN_EXPIRY=7d  # Long-lived refresh tokens
```

Note: The system uses `JWT_ACCESS_TOKEN_EXPIRY` for regular access tokens and `JWT_REFRESH_TOKEN_EXPIRY` for refresh tokens. There is no need for a generic `JWT_EXPIRES_IN` as each token type has its specific expiry setting.

### Database Schema
```prisma
model RefreshToken {
  id        String   @id
  personId  String
  expiresAt DateTime
  isRevoked Boolean  @default(false)
  person    Person   @relation(fields: [personId], references: [id])

  @@index([personId])
}
```

### API Endpoints

1. **Login** - `POST /auth/login`
   - Validates credentials
   - Issues access and refresh tokens
   - Updates last login timestamp

2. **Refresh** - `POST /auth/refresh`
   - Validates refresh token
   - Issues new access token
   - Optionally rotates refresh token

3. **Logout** - `POST /auth/logout`
   - Revokes refresh token
   - Requires valid refresh token

4. **Register** - `POST /auth/register`
   - Creates new user account
   - Sends email verification
   - Returns registration status

5. **Verify Email** - `POST /auth/verify-email`
   - Verifies email using code
   - Activates user account

## Best Practices

1. **Token Storage**
   - Access Token: Memory only (e.g., JavaScript variable)
   - Refresh Token: HTTP-only cookie or secure storage
   - Never store in localStorage/sessionStorage

2. **Token Usage**
   - Include access token in Authorization header
   - Refresh token only used for token refresh
   - Implement automatic refresh before expiry

3. **Error Handling**
   - Proper HTTP status codes
   - Clear error messages
   - Automatic retry on 401 with refresh

4. **Security Considerations**
   - HTTPS only
   - CORS configuration
   - Rate limiting
   - Input validation
   - XSS protection
   - CSRF protection

## Client Implementation Example

```typescript
class AuthClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    this.setTokens(data);
  }

  async refreshAccessToken() {
    if (!this.refreshToken) throw new Error('No refresh token');

    const response = await fetch('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });
    const data = await response.json();
    this.accessToken = data.access_token;
  }

  async logout() {
    if (!this.refreshToken) return;

    await fetch('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: this.refreshToken }),
    });
    this.clearTokens();
  }

  private setTokens(data: { access_token: string; refresh_token: string }) {
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }
}
```

## Maintenance and Monitoring

1. **Token Cleanup**
   - Regular cleanup of expired refresh tokens
   - Monitoring of token usage patterns
   - Alerts for suspicious activities

2. **Performance Monitoring**
   - Token validation performance
   - Database query optimization
   - Cache hit rates

3. **Security Monitoring**
   - Failed authentication attempts
   - Token refresh patterns
   - Revocation events
   - Suspicious IP addresses

## Troubleshooting

1. **Invalid Token Errors**
   - Check token expiration
   - Verify token signature
   - Check token revocation status
   - Validate token format

2. **Refresh Token Issues**
   - Verify token exists in database
   - Check revocation status
   - Validate expiration time
   - Check for token rotation

3. **Common Problems**
   - Clock skew between servers
   - Database connection issues
   - Rate limiting triggers
   - Network timeouts 