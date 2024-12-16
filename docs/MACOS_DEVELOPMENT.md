# MacOS Development Guide

## Node Modules and Docker Considerations

When developing on MacOS, there are some important considerations regarding node_modules and Docker containers, especially with native dependencies like `bcrypt`.

### Prerequisites

1. **Install Required VSCode Extensions**
   - [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)

### Getting Started

1. **Start the Containers**
   ```bash
   # Start all services
   docker-compose up -d
   ```

2. **Connect to Development Container** (Two Methods)

   **Method 1: Using Command Palette**
   - Open VSCode command palette (Cmd + Shift + P)
   - Type "Dev Containers: Attach to Running Container"
   - Select the `nestjs_api` container
   - VSCode will open a new window connected to the container

   **Method 2: Using Docker Extension**
   - Open Docker extension in VSCode (left sidebar)
   - Find `nestjs_api` under Containers
   - Right-click and select "Attach Visual Studio Code"
   - VSCode will open a new window connected to the container

3. **Setup Container Development Environment**
   - In the container VSCode window:
   - Open folder `/usr/src/app`
   - Install recommended VSCode extensions when prompted
   - You now have a full development environment inside the container

### Development Workflow

1. **Editing Files**
   - Edit files directly in the container VSCode window
   - Changes are synchronized with your host machine
   - TypeScript intellisense and debugging work natively

2. **Running Commands**
   - Use the VSCode integrated terminal
   - Terminal is already in the container context
   - Example commands:
     ```bash
     # Run tests
     npm run test
     
     # Watch mode
     npm run start:dev
     
     # Install new dependency
     npm install some-package
     ```

3. **Debugging**
   - Add this to `.vscode/launch.json`:
     ```json
     {
       "version": "0.2.0",
       "configurations": [
         {
           "type": "node",
           "request": "attach",
           "name": "Debug NestJS",
           "port": 9229,
           "restart": true,
           "sourceMaps": true,
           "remoteRoot": "/usr/src/app"
         }
       ]
     }
     ```
   - Start app in debug mode:
     ```bash
     npm run start:debug
     ```
   - Press F5 in VSCode to attach debugger
   - Breakpoints will work as expected

### Common Development Tasks

1. **Viewing Logs**
   ```bash
   # Follow all logs
   docker-compose logs -f
   
   # Just API logs
   docker-compose logs -f api
   ```

2. **Restarting Services**
   ```bash
   # Restart just the API
   docker-compose restart api
   
   # Rebuild and restart API
   docker-compose up -d --build api
   ```

3. **Database Access**
   - Connect to Postgres:
     ```bash
     docker-compose exec postgres psql -U erpuser -d erp_db
     ```

4. **Redis CLI**
   ```bash
   docker-compose exec redis redis-cli
   ```

### Best Practices

1. **Container Management**
   - Keep Docker Desktop running
   - Use container VSCode window for all development
   - Don't run npm commands on host machine

2. **Dependency Management**
   - Always install dependencies inside container
   - package.json changes will sync to host
   - node_modules stays in container only

3. **Performance Tips**
   - Keep Docker Desktop resources adequate
     - Minimum 4GB RAM recommended
     - At least 2 CPU cores
   - Close unused Docker containers
   - Regular Docker system prune

### Troubleshooting

1. **Container Won't Start**
   ```bash
   # Check logs
   docker-compose logs api
   
   # Rebuild from scratch
   docker-compose down -v
   docker-compose up -d --build
   ```

2. **VSCode Can't Connect**
   - Ensure Docker Desktop is running
   - Try restarting VSCode
   - Check container is running:
     ```bash
     docker-compose ps
     ```

3. **Slow Performance**
   - Check Docker Desktop resources
   - Consider pruning old containers/images:
     ```bash
     docker system prune
     ```

Remember: Always develop inside the container via VSCode Dev Containers for the best experience with native dependencies and consistent development environment.