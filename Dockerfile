# Stage 1: Build environment 
FROM node:18.20.3-alpine AS builder

# Install build tools
RUN apk add --no-cache python3 make g++ curl

# Install wait-for script
RUN curl -o /usr/local/bin/wait-for https://github.com/eficode/wait-for/releases/download/v2.2.3/wait-for && \
    chmod +x /usr/local/bin/wait-for

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --include=dev

# Copy source files
COPY . .

# Build application
RUN npm run build

# Clean build tools
RUN apk del python3 make g++ curl

# --- Stage 2: Production environment ---
FROM node:18.20.3-alpine

# Runtime environment
ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# Copy production files (Note: .env file is not copied)
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/app.js ./
COPY --from=builder --chown=node:node /app/views ./views
COPY --from=builder --chown=node:node /app/utils ./utils
COPY --from=builder --chown=node:node /usr/local/bin/wait-for /usr/local/bin/wait-for

# Install production dependencies
RUN npm ci --omit=dev

# Set runtime user
USER node

# Expose port and add healthcheck
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s \
  CMD curl -f http://localhost:3000/health || exit 1

# Startup command
CMD ["node", "app.js"]
