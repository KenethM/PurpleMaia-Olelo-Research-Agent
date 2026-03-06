FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy source (node_modules excluded via .dockerignore)
COPY . .

EXPOSE 3000

ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
