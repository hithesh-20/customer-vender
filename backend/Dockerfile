# =============================================================================
# VendorSaathi Backend - Production Dockerfile
# =============================================================================

# Use official Node.js LTS image
FROM node:18-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source files
COPY . .

# Build the application (if needed)
RUN npm run build --if-present

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "dev"]

# =============================================================================

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy from development stage
COPY --from=development /app/node_modules ./node_modules

# Copy source files
COPY . .

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads/temp /app/uploads/public

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Command to run the application
CMD ["node", "src/app.js"]
