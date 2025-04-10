#!/bin/bash

SSL_DIR="config/ssl"
CERT_FILE="$SSL_DIR/server.crt"
KEY_FILE="$SSL_DIR/server.key"

# Create the SSL directory if it doesn't exist
mkdir -p $SSL_DIR

# Generate the self-signed SSL certificate if it doesn't already exist
if [[ ! -f $CERT_FILE || ! -f $KEY_FILE ]]; then
  echo "Generating self-signed SSL certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout $KEY_FILE \
    -out $CERT_FILE \
    -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=localhost"
  echo "SSL certificate generated at $SSL_DIR"
else
  echo "SSL certificate already exists at $SSL_DIR"
fi
