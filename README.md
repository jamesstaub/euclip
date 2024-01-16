# Euclip API
This repo is the back end for Euclip Drum console. It is a Rails 7 API that serves JSON data to the front end following the JSOAPI convention. It uses JWT for authentication and is deployed to Heroku.

You'll need to have the [euclip emberjs app](https://github.com/jamesstaub/euclip) running to develop against the frontend. Or you can run the most recent frontend build on this server. See setup instrction below to run the server.

[the user auth strategy for this app was forked from](https://github.com/scott-knight/rails6-sandbox-api)

## Pre-requisites for development
1. Ruby 3.2.2 (rvm recommended for version management)
1. Postgresql 
1. HTTPS Self-Signed Cert Setup (see below)


## HTTPS Self-Signed Cert Setup
For local development create a self-signed certificate for localhost.ssl

### MacOS:

So we can serve things over HTTPS, we need to an SSL certificate which our Rails server can use.  After we create it, we need to tell macOS (and, by proxy, our browsers) to always trust it. 

To generate our certificate:

- `cd ~/.ssh`
- `openssl genrsa -des3 -passout pass:x -out server.pass.key 2048`
- `openssl rsa -passin pass:x -in server.pass.key -out server.key`
- `rm server.pass.key`
- `openssl req -newkey rsa:2048 -x509 -nodes -keyout server.key -new -out server.crt -subj /CN=localhost.ssl -reqexts SAN -extensions SAN -config <(cat /System/Library/OpenSSL/openssl.cnf <(printf '[SAN]\nsubjectAltName=DNS:localhost,DNS:demo.noteflight.com')) -sha256 -days 3650`

To tell macOS to trust it:

- Get a Finder window opened to your .ssh directory: `open .`
- Open the Keychain Access app.
- Select the System Keychain in the list on the left.
- Drag the "server.crt" file into the "System" Keychain.  It should appear as "localhost.ssl".
- Right click on localhost.ssl.  Select "Get Info"
- Open up the "Trust" section of the certificate.
- Change the "When using this certificate" section to "Always Trust".
- Close this window - you'll be asked to put your password in when you close it.

Now, when we start our Rails development server, we can tell it to use this certificate, and our browser should happily accept it.

### Linux
Create a private key

- `cd ~/.ssh`
- `openssl genrsa -des3 -out server.orig.key 2048`

Remove the password

- `openssl rsa -in server.orig.key -out server.key`

Generate a certificate signing request

- `openssl req -new -key server.key -out server.csr`

Make ABSOLUTELY CERTAIN to set Common Name to localhost.ssl

Generate self-signed-cert

- `openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt`

Add localhost.ssl to your hosts file as:

- `127.0.0.1 localhost.ssl`

## Setup the app

1. `bundle install` to install dependencies
1. `rake db:migrate` to setup the database
1. `./reset-db.sh` to create deafult seed data (not this clears the any existing data so be careful on subsequent runs) 
1. `rails server -b 'ssl://127.0.0.1:3000?key=PATH_TO_YOUR_KEY.key&cert=PATH_TO_YOUR_CERT.crt'` to start the server. Be sure to use the correct paths to your key and cert files. See above for how to create them.

Assuming that all went off without a hithch, you should be able to visit https://localhost:3000/ and see the app running.

