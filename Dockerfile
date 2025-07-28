# Use Node.js 20 slim image
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy app source
COPY . .

# Create directories
RUN mkdir -p auth_info_baileys sessions

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
