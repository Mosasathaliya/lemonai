# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm with specific version and clean cache
RUN npm install -g pnpm@8.15.5 --no-cache

# Set environment variables for build
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=2048

# Copy package files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Install dependencies with frozen lockfile and clean cache
RUN pnpm install --frozen-lockfile --prefer-offline && \
    pnpm store prune

# Copy app source
COPY . .

# Build the app
RUN pnpm run build

# Stage 2: Create the production image
FROM node:18-alpine

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8.15.5 --no-cache

# Set environment variables
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1024
ENV PORT=3000

# Copy package files
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

# Install production dependencies only and clean cache
RUN pnpm install --frozen-lockfile --prod --prefer-offline && \
    pnpm store prune && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/bin ./bin
COPY --from=builder --chown=appuser:appgroup /app/public ./public

# Set proper permissions
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { if (res.statusCode !== 200) throw new Error() }).on('error', () => process.exit(1))"

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["node", "bin/www"]
