# Development Dockerfile for Medusa
FROM node:20-alpine

# Set working directory
WORKDIR /server

# Copy package files and yarn config
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases .yarn/releases

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Expose ports
EXPOSE 9000 5173

# Start server with migrations
CMD ["./start.sh"]
