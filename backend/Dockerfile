# Backend Dockerfile
FROM node:20-alpine

# Install build dependencies for native modules (bcrypt, sqlite3) and curl for health checks
RUN apk add --no-cache python3 make g++ sqlite curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create database directory
RUN mkdir -p db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Run migrations and start server
CMD ["sh", "-c", "npm run setup && npm start"]
