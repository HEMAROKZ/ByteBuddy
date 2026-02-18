# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY public public/
COPY src src/

# Build the application
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the built React app
RUN npm install -g serve

# Copy built app from builder stage
COPY --from=builder /app/build build/

# Expose port
EXPOSE 3000

# Set environment variable for React
ENV REACT_APP_API_URL="http://localhost:8080/api"

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
