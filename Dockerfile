# Use node alpine image as base container image
FROM node:20-alpine as build

# Create app directory in container
WORKDIR /usr/src/app

# Define app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json .

# Install dependencies
RUN npm install

# Copy files from source to container
COPY . .

# Define startup command as npm run dev
CMD [ "npm", "run", "dev" ]