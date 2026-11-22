# Joineazy Backend Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies if needed
COPY package*.json ./
RUN npm ci

COPY . .

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000

CMD ["node", "src/server.js"]
