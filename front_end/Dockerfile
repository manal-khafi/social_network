# Use Node.js 24 for frontend
FROM node:24-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package files (works whether package-lock.json exists or not)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 5173

# Start development server (make it accessible from outside the container)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
