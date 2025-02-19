# Step 1: Use the official Node.js image to build the app
FROM node:16 AS build

# Step 2: Set the working directory in the container
WORKDIR /app

# Step 3: Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the app's source code
COPY . .

# Step 6: Build the React app for production
RUN npm run build

# Step 7: Use a smaller image to serve the production build
FROM nginx:alpine

# Step 8: Copy the build directory from the build container to nginx's html directory
COPY --from=build /app/build /usr/share/nginx/html

# Step 9: Expose port 80 (default port for nginx)
EXPOSE 80

# Step 10: Start nginx to serve the build
CMD ["nginx", "-g", "daemon off;"]
