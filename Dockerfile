# Build a lightweight Node.js image
FROM node:20-alpine

ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

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