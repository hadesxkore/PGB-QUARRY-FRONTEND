# 🐳 Docker Deployment Guide

## Prerequisites
- Docker Desktop installed and running
- Node.js 20+ (for local development)

## 📦 Files Created
- `Dockerfile` - Multi-stage build configuration
- `nginx.conf` - Nginx server configuration
- `.dockerignore` - Files to exclude from Docker build

## 🚀 Build & Run Docker Container

### 1. Start Docker Desktop
Make sure Docker Desktop is running on your machine.

### 2. Build the Docker Image
```bash
docker build -t pgb-quarry-frontend .
```

This will:
- Use Node.js 20 Alpine image
- Install dependencies
- Build the Vite app
- Create production-ready image with Nginx
- Final image size: ~50MB

### 3. Run the Container
```bash
docker run -d -p 3000:80 --name quarry-frontend pgb-quarry-frontend
```

### 4. Test the Application
Open your browser and go to: `http://localhost:3000`

### 5. View Container Logs
```bash
docker logs quarry-frontend
```

### 6. Stop the Container
```bash
docker stop quarry-frontend
```

### 7. Remove the Container
```bash
docker rm quarry-frontend
```

## 🌐 Deploy to Vercel

### Option 1: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

### Option 2: GitHub Integration
1. Push your code to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Vite and deploy

### Environment Variables on Vercel
Add these in Vercel Dashboard → Settings → Environment Variables:
```
VITE_API_URL=your_backend_api_url
VITE_SOCKET_URL=your_websocket_url
```

## 🚢 Deploy to Render

### 1. Create render.yaml
Already configured in your project root.

### 2. Deploy Steps
1. Go to https://render.com
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Render will auto-detect and deploy

### Build Settings:
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

### Environment Variables on Render:
```
VITE_API_URL=your_backend_api_url
VITE_SOCKET_URL=your_websocket_url
```

## 🔧 Docker Commands Cheat Sheet

```bash
# Build image
docker build -t pgb-quarry-frontend .

# Run container
docker run -d -p 3000:80 --name quarry-frontend pgb-quarry-frontend

# View running containers
docker ps

# View all containers
docker ps -a

# Stop container
docker stop quarry-frontend

# Start container
docker start quarry-frontend

# Remove container
docker rm quarry-frontend

# Remove image
docker rmi pgb-quarry-frontend

# View logs
docker logs quarry-frontend

# Follow logs
docker logs -f quarry-frontend

# Execute command in container
docker exec -it quarry-frontend sh

# View container stats
docker stats quarry-frontend
```

## 📊 Docker Image Details

### Multi-Stage Build
- **Stage 1 (Builder)**: Builds the app with Node.js
- **Stage 2 (Production)**: Serves with Nginx

### Features
✅ Optimized production build
✅ Gzip compression enabled
✅ Security headers configured
✅ SPA routing handled (React Router)
✅ Static asset caching
✅ Small image size (~50MB)

## 🧪 Testing Docker Build

### Test Build Process
```bash
# Build
docker build -t pgb-quarry-frontend .

# Run
docker run -d -p 3000:80 --name test-frontend pgb-quarry-frontend

# Test
curl http://localhost:3000

# Check logs
docker logs test-frontend

# Cleanup
docker stop test-frontend && docker rm test-frontend
```

## 🔍 Troubleshooting

### Docker Desktop Not Running
```
ERROR: error during connect: ... dockerDesktopLinuxEngine
```
**Solution**: Start Docker Desktop application

### Port Already in Use
```
Error: port is already allocated
```
**Solution**: Use different port
```bash
docker run -d -p 3001:80 --name quarry-frontend pgb-quarry-frontend
```

### Build Fails
```bash
# Clean build
docker system prune -a
docker build --no-cache -t pgb-quarry-frontend .
```

## 📝 Production Checklist

Before deploying:
- [ ] Update `.env` with production API URLs
- [ ] Test Docker build locally
- [ ] Verify all routes work
- [ ] Check WebSocket connections
- [ ] Test on mobile devices
- [ ] Verify PDF export works
- [ ] Test all user/admin features

## 🎯 Next Steps

1. **Start Docker Desktop**
2. **Run**: `docker build -t pgb-quarry-frontend .`
3. **Run**: `docker run -d -p 3000:80 --name quarry-frontend pgb-quarry-frontend`
4. **Test**: Open `http://localhost:3000`
5. **Deploy**: Push to Vercel or Render

Good luck with your deployment! 🚀
