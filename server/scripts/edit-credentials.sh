#!/bin/bash

set -e

CREDENTIALS_FILE="credentials.yml"
ENCRYPTED_FILE="config/credentials.yml.enc"
MASTER_KEY_FILE="config/master.key"

# Decrypt the credentials
openssl aes-256-cbc -d -in $ENCRYPTED_FILE -out $CREDENTIALS_FILE -pass file:$MASTER_KEY_FILE
echo "Decrypted credentials. Edit the $CREDENTIALS_FILE file."

# Wait for the user to edit the file
read -p "Press Enter after editing the credentials to re-encrypt them..."

# Re-encrypt the credentials
openssl aes-256-cbc -e -in $CREDENTIALS_FILE -out $ENCRYPTED_FILE -pass file:$MASTER_KEY_FILE
echo "Re-encrypted credentials."

# Remove the plaintext file
rm $CREDENTIALS_FILE
echo "Removed plaintext credentials file."
