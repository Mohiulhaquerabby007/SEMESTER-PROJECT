# Use Node.js 20 LTS as the base image
FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json and package-lock.json are copied.
COPY package*.json ./

# Install dependencies.
# If you have a package-lock.json, speed up builds with 'npm ci'.
RUN npm install --production

# Copy local code to the container image.
COPY . .

# Expose the port the app runs on
EXPOSE 5005

# Run the web service on container startup.
CMD [ "npm", "start" ]
