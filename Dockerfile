# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build

# Runtime stage
FROM nginx:alpine AS runtime

# SPA routing config (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Note: This app stores study progress/settings in the browser (LocalStorage).
# Container restarts do not delete browser LocalStorage, but clearing browser data will.
# Use the app's Settings > Export JSON regularly for backups.
CMD ["nginx", "-g", "daemon off;"]
