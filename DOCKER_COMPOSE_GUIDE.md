# Docker Compose Guide for ByteBuddy

## What is Docker Compose?

**Docker Compose** is a tool that allows you to define and run **multiple Docker containers** as a single application. Instead of running each service separately with long docker commands, you write everything in a `docker-compose.yml` file.

### Why Use It?

```
❌ Without Docker Compose (manual):
$ docker run -d --name mysql8 -e MYSQL_ROOT_PASSWORD=pass -p 3306:3306 mysql:8.0
$ docker run -d --name backend -p 8081:8081 -e DB_HOST=mysql8 backend:latest
$ docker run -d --name frontend -p 3000:3000 frontend:latest
$ docker run -d --name kong -p 8000:8000 kong:3.6

✅ With Docker Compose (one command):
$ docker-compose up -d
```

## The `docker-compose.yml` File

### What Does Ours Do?

The ByteBuddy `docker-compose.yml` defines **2-3 services**:

```yaml
version: "3.8"
services:
  kong: # API Gateway (optional)
    image: kong:3.6
    container_name: kong
    environment:
      - KONG_DATABASE=off
      - KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml
    ports:
      - "8000:8000" # Proxy for API requests
      - "8001:8001" # Admin API
    volumes:
      - ./kong.yml:/usr/local/kong/declarative/kong.yml
```

Currently, only **Kong** is configured. Let me show you what a **complete setup** looks like:

## Complete Docker Compose Setup

Here's what you **should add** to your `docker-compose.yml`:

```yaml
version: "3.8"

services:
  # ================================
  # MySQL Database
  # ================================
  mysql:
    image: mysql:8.0
    container_name: chatbot-mysql
    environment:
      MYSQL_ROOT_PASSWORD: yourpassword
      MYSQL_DATABASE: chatbot_db
      MYSQL_USER: chatbot
      MYSQL_PASSWORD: chatbot123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql # Persist data
    healthcheck: # Wait for MySQL to start
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - chatbot-network

  # ================================
  # Spring Boot Backend
  # ================================
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: chatbot-backend
    depends_on:
      mysql:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/chatbot_db
      SPRING_DATASOURCE_USERNAME: chatbot
      SPRING_DATASOURCE_PASSWORD: chatbot123
      GROQ_API_KEY: ${GROQ_API_KEY} # From .env file
    ports:
      - "8081:8081"
    networks:
      - chatbot-network

  # ================================
  # React Frontend
  # ================================
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: chatbot-frontend
    environment:
      REACT_APP_API_URL: http://localhost:8081
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - chatbot-network

  # ================================
  # Kong API Gateway (Optional)
  # ================================
  kong:
    image: kong:3.6
    container_name: chatbot-kong
    environment:
      KONG_DATABASE: off
      KONG_DECLARATIVE_CONFIG: /usr/local/kong/declarative/kong.yml
    ports:
      - "8000:8000" # Proxy
      - "8001:8001" # Admin API
    volumes:
      - ./kong.yml:/usr/local/kong/declarative/kong.yml
    networks:
      - chatbot-network

# ================================
# Persistent Volumes
# ================================
volumes:
  mysql_data:
    driver: local

# ================================
# Custom Network
# ================================
networks:
  chatbot-network:
    driver: bridge
```

## Key Concepts Explained

### 1. **Services**

Each service is an independent container. Think of them as microservices:

```yaml
services:
  mysql: # Service name (used for networking)
    image: mysql:8.0 # The Docker image to use
```

### 2. **Environment Variables**

Pass configuration to containers:

```yaml
environment:
  MYSQL_ROOT_PASSWORD:yourpassword # MySQLdata
  SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/chatbot_db
```

- `mysql` - service name (containers can reach each other by name)
- Host: `mysql`, Port: `3306` (internal network)

### 3. **Ports (Port Mapping)**

```yaml
ports:
  - "3306:3306" # Host:Container
  # ↑         ↑
  # Your PC  Inside Container
```

Access from your machine:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8081`
- MySQL: `localhost:3306`

### 4. **Volumes (Persistent Storage)**

```yaml
volumes:
  - mysql_data:/var/lib/mysql # Named volume
  # ↑           ↑
  # Host        Container path
```

Without volumes, data is **lost when container stops**. Volumes keep data persistent.

### 5. **Networks**

```yaml
networks:
  chatbot-network:
    driver: bridge
```

Containers on the same network can communicate:

- `backend` can reach `mysql` at `mysql:3306`
- `frontend` can reach `backend` at `backend:8081`

### 6. **Depends On (Service Dependencies)**

```yaml
depends_on:
  mysql:
    condition: service_healthy
```

Ensures MySQL starts and is ready before Backend starts.

### 7. **Healthchecks**

```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 10s
  timeout: 5s
  retries: 5
```

Verifies the service is actually running and ready.

## How Services Communicate

### Network Diagram

```
┌─────────────────────────────────────────────────────┐
│         Docker Network (chatbot-network)            │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │  Frontend    │  │   Backend    │  │  MySQL   │ │
│  │ :3000        │  │  :8081       │  │  :3306   │ │
│  └──────┬───────┘  └──────┬───────┘  └────┬─────┘ │
│         │                 │                │       │
│         └─────────────────┼────────────────┘       │
│                           │                        │
│              Uses DNS: backend:8081                │
│                       mysql:3306                   │
└──────────────────────────────────────┬─────────────┘
                                       │
                        ┌──────────────┴──────┐
                        │  Your Machine       │
                        │  localhost:3000 ✓   │
                        │  localhost:8081 ✓   │
                        │  localhost:3306 ✓   │
                        └─────────────────────┘
```

**Inside containers**, they talk directly:

- Frontend → Backend: `http://backend:8081`
- Backend → MySQL: `jdbc:mysql://mysql:3306`

**From your machine**, use localhost:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8081`
- MySQL: `localhost:3306`

## Common Commands

### Start Services

```bash
# Start all services in background (-d = detached)
docker-compose up -d

# Start with logs visible
docker-compose up

# Rebuild images
docker-compose up -d --build

# Start specific service only
docker-compose up -d backend
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Stop Services

```bash
# Stop all containers (keep data)
docker-compose stop

# Stop specific service
docker-compose stop backend

# Remove all containers (keep data)
docker-compose down

# Remove all containers + volumes (DELETE data!)
docker-compose down -v
```

### Get Status

```bash
# List running containers
docker-compose ps

# Detailed info
docker-compose ps -a
```

### Debugging

```bash
# Execute command in container
docker-compose exec backend bash

# View MySQL database
docker-compose exec mysql mysql -u root -pPassword

# Check MySQL databases
docker-compose exec mysql mysql -u root -p -e "SHOW DATABASES;"
```

## Environment Variables (.env file)

Create `.env` file in project root:

```env
# Groq API
GROQ_API_KEY=gsk_your_api_key_here

# MySQL
MYSQL_ROOT_PASSWORD=Raghukanch007@
MYSQL_DATABASE=chatbot_db

# URLs
BACKEND_URL=http://localhost:8081
FRONTEND_URL=http://localhost:3000
```

Reference in docker-compose.yml:

```yaml
environment:
  GROQ_API_KEY: ${GROQ_API_KEY} # From .env
```

## Dockerfile Examples

### Backend Dockerfile

```dockerfile
# Build stage
FROM maven:3.9.0 as builder
WORKDIR /app
COPY . .
RUN mvn clean package -DskipTests

# Runtime stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
CMD ["java", "-jar", "app.jar"]
```

### Frontend Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json .
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

## Complete Workflow

### 1. Create docker-compose.yml

Write all service definitions

### 2. Build Images

```bash
docker-compose build
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Verify Running

```bash
docker-compose ps
```

### 5. Check Logs

```bash
docker-compose logs -f
```

### 6. Access Services

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8081`
- MySQL: `localhost:3306`

### 7. Stop When Done

```bash
docker-compose down
```

## Advantages of Docker Compose

✅ **Single machine deployment** (one `docker-compose up`)
✅ **Reproducible environments** (same setup everywhere)
✅ **Easy development** (no manual Docker commands)
✅ **Automatic networking** (containers discover each other)
✅ **Volume management** (persistent data)
✅ **Easy debugging** (access logs anytime)
✅ **Quick teardown** (one command cleans everything)

## Limitations

⚠️ **Single machine only** (for multiple machines, use Kubernetes)
⚠️ **Not for production** (use orchestration tools)
⚠️ **Storage is local** (no distributed storage)
⚠️ **Scaling is limited** (can't scale individual services easily)

## Next Steps

1. **Update docker-compose.yml** with the complete configuration above
2. **Create Dockerfiles** for backend and frontend
3. **Create .env file** with your API keys
4. **Run**: `docker-compose up -d --build`
5. **Test**: Visit services on localhost

## Troubleshooting

### Problem: Containers won't start

```bash
# Check logs
docker-compose logs backend

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Problem: Can't connect to database

```bash
# Verify MySQL is running
docker-compose ps mysql

# Check connectivity
docker-compose exec backend ping mysql
```

### Problem: Port already in use

```bash
# Change port in docker-compose.yml
ports:
  - "3307:3306"  # Changed from 3306
```

---

**Need more help? Check official docs:**

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Docker Hub Images](https://hub.docker.com/)
