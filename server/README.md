# Euclip API
This repo is the back end for Euclip Drum console. It is a Rails 7 API that serves JSON data to the front end following the JSOAPI convention. It uses JWT for authentication and is deployed to Heroku.

You'll need to have the [euclip emberjs app](https://github.com/jamesstaub/euclip) running to develop against the frontend. Or you can run the most recent frontend build on this server. See setup instructions below to run the server.

[The user auth strategy for this app was forked from](https://github.com/scott-knight/rails6-sandbox-api).

---

## Setup the App

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/euclip-api.git
   cd euclip-api
   ```

2. **Create a `.env` file**:
   ```bash
   cp .env.example .env
   ```

3. **Run the full setup**:
   ```bash
   make setup
   ```
   This will:
   - Generate the `config/master.key` and `config/credentials.yml.enc` files (if they don't exist).
   - Start the services.
   - Generate a self-signed SSL certificate.
   - Set up the database.

4. **Edit Rails credentials**:
   If you need to edit the Rails credentials, use the following command:
   ```bash
   make edit-credentials
   ```
   This will:
   - Start a temporary container.
   - Open the Rails credentials editor using `nano`.
   - Save and encrypt the credentials when you exit the editor.

   Add the following content to the credentials file:
   ```yaml
   devise:
     secret_key: your_devise_secret_key
     jwt_secret_key: your_jwt_secret_key
   system_email: your_system_email@example.com
   ```
   Replace `your_devise_secret_key`, `your_jwt_secret_key`, and `your_system_email@example.com` with appropriate values. You can generate secure keys using:
   ```bash
   rails secret
   ```

5. **Access the application**:
   - Backend: [https://localhost:3000](https://localhost:3000)
   - Frontend: [http://localhost:4200](http://localhost:4200)

---

## Enabling HTTPS for Local Development

The `make setup` command automatically generates a self-signed SSL certificate for HTTPS. If you need to regenerate the certificate manually, you can run:

```bash
make generate-ssl
```

The certificate and key are stored in the `config/ssl` directory.

---

## Resetting Credentials

If the Rails credentials are misconfigured or you want to start fresh, you can reset them by running:

```bash
rm config/credentials.yml.enc config/master.key
make generate-credentials
```

This will remove the existing credentials and allow you to regenerate them.

---

## Deploying to Heroku

Make sure you have the Heroku CLI installed.

1. **Login to Heroku**:
   ```bash
   heroku login
   ```

2. **Push the code to Heroku**:
   ```bash
   git push heroku main
   ```

3. **Run database migrations**:
   ```bash
   heroku run rake db:migrate
   ```

---

## Debugging

1. **Access the Rails console on Heroku**:
   ```bash
   heroku run rails console
   ```

2. **View logs**:
   ```bash
   heroku logs --tail
   ```

3. **Access the backend container shell**:
   ```bash
   make shell-backend
   ```

4. **Access the database container shell**:
   ```bash
   make shell-db
   ```