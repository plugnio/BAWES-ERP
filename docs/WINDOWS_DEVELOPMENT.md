# Windows Development Guide

## Development with WSL2 and Docker

When developing on Windows, using WSL2 (Windows Subsystem for Linux) with Docker Desktop provides the best development experience. This setup allows for native Linux performance and compatibility while working on Windows.

### Prerequisites Setup

1. **Install WSL2**
   ```powershell
   # Run in PowerShell as Administrator
   wsl --install
   
   # After installation, restart your computer
   ```

2. **Install Ubuntu on WSL2**
   - Open Microsoft Store
   - Search for "Ubuntu"
   - Install Ubuntu 22.04 LTS (recommended)

3. **Install Docker Desktop**
   - Download from [Docker Hub](https://hub.docker.com/editions/community/docker-ce-desktop-windows)
   - Ensure WSL2 backend is enabled in Docker Desktop settings

4. **Install VSCode Extensions**
   - [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - [Remote - WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl)

### Project Setup

1. **Clone Repository in WSL**
   ```bash
   # Open Ubuntu terminal
   cd ~
   mkdir projects
   cd projects
   git clone <repository-url>
   ```

2. **VSCode Integration**
   - Install VSCode on Windows
   - Install "Remote - WSL" extension
   - Install "Remote - Containers" extension
   - Open project from WSL:
     ```bash
     code .
     ```

### Development Workflow

#### Option 1: Full WSL Development (Recommended)
1. Keep your project files in WSL filesystem
2. Use VSCode's "Remote - WSL" to edit files
3. Run Docker commands directly in WSL terminal
4. Node modules work correctly due to native Linux environment

Benefits:
- Better performance than Windows file system
- Native Linux compatibility
- No file permission issues
- Correct platform-specific binaries

#### Option 2: VSCode Remote Containers
1. Open project in VSCode through WSL
2. Use "Remote-Containers: Reopen in Container"
3. Development happens entirely in container

### File System Performance

1. **Optimal File Location**
   - Keep project files in WSL filesystem
   - Avoid Windows filesystem mounts
   - Path should be like: `/home/<user>/projects/`
   - NOT like: `/mnt/c/Users/<user>/projects/`

2. **Node Modules Behavior**
   - node_modules syncs correctly between WSL and container
   - Native modules compile properly in Linux environment
   - No platform-specific issues like on MacOS

### Common Issues and Solutions

1. **File Permission Issues**
   - If encountered, run in WSL:
     ```bash
     sudo chown -R $USER:$USER .
     ```

2. **Docker Connection Issues**
   - Ensure Docker Desktop is running
   - Check WSL integration in Docker Desktop settings
   - Verify with:
     ```bash
     docker info
     ```

3. **Performance Problems**
   - Ensure files are in WSL filesystem
   - Avoid working from `/mnt/c/`
   - Use Ubuntu distro (performs better than others)

### Best Practices

1. **Project Location**
   ```bash
   # Good
   /home/username/projects/your-project

   # Bad
   /mnt/c/Users/username/projects/your-project
   ```

2. **Terminal Usage**
   - Use WSL terminal or VSCode's integrated terminal
   - Run all commands in WSL environment
   - Keep Docker Desktop running

3. **Git Configuration**
   ```bash
   # Configure Git in WSL
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

4. **Docker Commands**
   ```bash
   # Build and start containers
   docker-compose up -d --build

   # View logs
   docker-compose logs -f api

   # Execute commands in container
   docker-compose exec api npm install
   ```

### IDE Setup

1. **VSCode Extensions in WSL**
   - ESLint
   - Prettier
   - Docker
   - TypeScript and JavaScript extensions
   
2. **Workspace Settings**
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

### Debugging

1. **VSCode Debugging**
   - Works natively through WSL
   - Use launch configurations as normal
   - Breakpoints work seamlessly

2. **Container Debugging**
   - Access container shell:
     ```bash
     docker-compose exec api bash
     ```
   - View logs in real-time:
     ```bash
     docker-compose logs -f api
     ```

Remember to always work within the WSL environment for the best development experience on Windows. This setup provides native Linux performance while maintaining Windows compatibility. 