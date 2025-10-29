# Build a lightweight Node.js image
FROM node:20-alpine

ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
# Use lockfile for reproducible builds if present, otherwise install
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

# Copy source
COPY . .

# Ensure uploads dir exists and writable
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to non-root user
USER node

# Expose default port (Coolify maps this automatically)
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]