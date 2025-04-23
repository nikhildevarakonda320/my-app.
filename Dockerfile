FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Remove the homepage field from package.json for local deployment
RUN npm pkg delete homepage

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"] 