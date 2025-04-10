FROM node:18

# Set the working directory to /app
WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json ./
RUN cd /app && npm install -g ember-cli && npm install

# Update browserslist database
RUN npx update-browserslist-db@latest --update-db

# Copy the rest of the application files
COPY . .

# Ensure node_modules is created and dependencies are installed
# RUN test -d node_modules || npm install

EXPOSE 4200

# Explicitly serve from /app
CMD ["ember", "serve", "--host", "0.0.0.0", "--ssl=false", "--proxy", "http://euclip_backend:3000"]
