FROM node:14

# Set up Workspace
WORKDIR /usr/app

# Install app dependencies
COPY ./package*.json ./
RUN npm install --quiet

# Copy app source
COPY . .

# Expose ports
EXPOSE 8001

# Default Command
CMD ["npm", "run", "start:ui"]
