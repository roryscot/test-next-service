# Dockerfile for Interview Next Service
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=development

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "run", "dev"]