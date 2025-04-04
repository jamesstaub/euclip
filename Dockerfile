FROM node:18

WORKDIR /app

# Copy only package files first for better caching
COPY package.json package-lock.json ./
RUN npm install -g ember-cli && npm install

# Update browserslist database
RUN npx update-browserslist-db@latest --update-db

# Copy the rest of the application files
COPY . .

EXPOSE 4200

# Use a more concise CMD
CMD ["ember", "serve", "--host", "0.0.0.0", "--ssl=false"]
