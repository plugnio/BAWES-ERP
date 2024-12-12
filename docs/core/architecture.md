# BAWES ERP Architecture

## System Overview

BAWES ERP is built on a modern, scalable architecture using the following key technologies:

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL
- **Caching**: Redis
- **Message Queue**: RabbitMQ
- **Container Orchestration**: Docker & Kubernetes

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐
│   API Gateway   │────▶│  Auth Service   │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Core Services  │────▶│    Database     │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Integration    │────▶│ Banking APIs    │
│  Services       │     └─────────────────┘
└─────────────────┘
```

## Core Components

### API Gateway
- Route management
- Request validation
- Rate limiting
- API documentation

### Authentication Service
- User management
- JWT token handling
- Role-based access control
- Session management

### Core Services
- Banking operations
- Account management
- Transaction processing
- Reporting engine

### Integration Services
- Bank API integration
- Statement processing
- Real-time updates
- Data synchronization

## Data Flow

1. **Request Flow**
   - API Gateway receives request
   - Authentication validation
   - Route to appropriate service
   - Process business logic
   - Return response

2. **Banking Integration Flow**
   - Scheduled jobs trigger updates
   - Real-time webhook processing
   - Data validation and normalization
   - Database updates

## Security Architecture

See [Security Documentation](../security/README.md) for detailed security implementation.

## Scalability

- Horizontal scaling of services
- Database replication
- Caching strategies
- Load balancing

## Monitoring

- Prometheus metrics
- Grafana dashboards
- Error tracking
- Performance monitoring

## Development Environment

See [Development Guide](../development/README.md) for local setup and development practices. 