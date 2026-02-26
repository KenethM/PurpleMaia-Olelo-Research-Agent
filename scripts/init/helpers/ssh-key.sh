#!/bin/bash

# Initializes SSH key for the application

# Check for .env file and load environment variables
if [ ! -f ".env" ]; then
    echo ".env file not found! Please run the init script first to create it."
    exit 1
fi

ENV_FILE=".env"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

if [ -z "$PMF_DOKKU_HOST" ]; then
    echo "PMF_DOKKU_HOST is not set in .env file! Please ask the PMF Builder admin for the correct host and add it to the .env file."
    exit 1
fi

# Check if SSH keys already exist

if [ -f "$HOME/.ssh/id_ed25519" ]; then
    echo "SSH key already exists."
else
    # Generate new SSH keys
    read -p "Enter your Github-associated email for SSH key generation: " user_email
    ssh-keygen -t ed25519 -C "$user_email" -f "$HOME/.ssh/id_ed25519" -N ""
    echo "New SSH key generated."
fi

# Display the public key
echo "Your public SSH key is:"
cat "$HOME/.ssh/id_ed25519.pub"

# Send instructions to add the SSH key to Github
echo ""
echo "Send the above public key to PMF Builder admin, wait for approval from admin, then press any key to continue..."
read -n 1 -s

# Validate SSH access
echo "Validating SSH access..."
ssh dokku@$PMF_DOKKU_HOST apps:list 

echo "SSH key initialized successfully!"