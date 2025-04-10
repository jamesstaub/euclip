FROM ruby:3.2  
WORKDIR /app  

# Install dependencies
RUN apt-get update -qq && apt-get install -y build-essential libpq-dev nano vim && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install gems  
COPY Gemfile Gemfile.lock ./  
RUN bundle install  

# Copy app files  
COPY . .  

# Set an environment variable to skip credentials check
ENV SKIP_CREDENTIALS_CHECK=true

# Expose port & start server  
EXPOSE 3000  
ENV RAILS_ENV=development
CMD ["rails", "server", "-b", "0.0.0.0"]
