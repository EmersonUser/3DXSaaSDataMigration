# Use the official Node.js image
FROM node:20

# Set working directory inside the container
WORKDIR /index.js

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all application files (ensure you have an index.js or server.js)
COPY . .

# Expose the port that your app runs on
EXPOSE 8086

# Command to start the Node.js app
CMD ["npm", "run", "dev"]