# Use Node.js as the base image
FROM node:20-slim AS builder

# Set working directory
WORKDIR /app

# Install yarn
RUN corepack enable && corepack prepare yarn@3.2.1 --activate

# Copy only the necessary files for dependency installation
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn

# Copy the entire monorepo
COPY . .

# Install dependencies
RUN yarn install

# Build the backend (Medusa) and its dependencies
RUN yarn turbo run build --filter=@medusajs/medusa...

# Production image
FROM node:20-slim

WORKDIR /app

COPY --from=builder /app /app

# Set environment variables
ENV NODE_ENV=production

# Expose the port
EXPOSE 9000

# Start the application
CMD ["yarn", "workspace", "@medusajs/medusa", "serve"]
