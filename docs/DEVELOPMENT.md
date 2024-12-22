# Development Guide

## Environment Variables

### Core Configuration
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
- `JWT_SECRET` - Secret for JWT signing
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiry (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiry (default: 7d)

### Database Configuration
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_SSL` - Enable SSL for database (true/false)

### Debugging Configuration
- `DEBUG` - Enable debug mode (true/false)

## Debugging

### Enabling Debug Mode

Set the `DEBUG` environment variable to `true` to enable detailed logging:

```bash
DEBUG=true npm run start:dev
```

### Debug Features

When debug mode is enabled (`DEBUG=true`):

1. **HTTP Request Logging**
   - Request method and URL
   - Request headers (automatically sanitized)
   - Request query parameters
   - Request body (sensitive data redacted)
   - Response body (tokens redacted)
   - Request duration and status code

2. **Authentication Debugging**
   - JWT validation process
   - Token payload (sensitive parts redacted)
   - User lookup results
   - Permission calculations

3. **Log Levels**
   - Debug mode: error, warn, log, debug, verbose
   - Normal mode: error, warn, log

### Security in Debug Mode

The debug logging system automatically sanitizes sensitive information:

1. **Request Headers**
   - Authorization tokens are redacted
   - Only token presence is logged
   - Bearer token values are masked

2. **Request Body**
   - Passwords are automatically redacted
   - Sensitive fields are masked
   - Original data structure is preserved

3. **Response Body**
   - Access tokens are redacted
   - Refresh tokens are redacted
   - JWT tokens are masked
   - Non-JSON responses are safely handled

4. **Personal Information**
   - User IDs are preserved for tracing
   - Email addresses are visible for debugging
   - Other PII is context-dependent

### Best Practices

1. **Local Development**
   - Enable debug mode for detailed insights
   - Use the logs to trace request flow
   - Monitor permission calculations
   - Verify sensitive data is properly redacted

2. **Staging Environment**
   - Enable debug mode only for testing
   - Review logs for security concerns
   - Validate data sanitization
   - Monitor performance impact

3. **Production Environment**
   - Never enable debug mode
   - Use application monitoring instead
   - Rely on structured error logging
   - Configure proper log rotation

### Performance Considerations

1. **Debug Mode Impact**
   - Additional memory usage for log buffering
   - Slight latency increase due to logging
   - Disk space usage for log files
   - Consider log rotation in long sessions

2. **Optimization Tips**
   - Enable debug mode only when needed
   - Use targeted debugging for specific issues
   - Clear logs regularly in development
   - Monitor system resources