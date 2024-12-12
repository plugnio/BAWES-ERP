# Getting Started with BAWES ERP

## Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/plugnio/BAWES-ERP.git
cd BAWES-ERP
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development environment:
```bash
docker compose up
```

## First Steps

1. Access the API documentation at http://localhost:3000/api
2. Set up your first user account
3. Configure banking integration
4. Start using the system

## Next Steps

- Read the [Architecture Guide](./architecture.md)
- Review [Security Documentation](../security/README.md)
- Explore [API Documentation](../api/README.md)
- Set up [Banking Integration](../integrations/banking/README.md)

## Need Help?

- Check our [Troubleshooting Guide](../development/README.md#troubleshooting)
- Review [Common Issues](../development/README.md#common-issues)
- Contact support 