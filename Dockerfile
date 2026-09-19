# Use official Node image
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of your frontend code
COPY . .

# The default command
CMD ["npm", "run", "dev", "--", "--host"]