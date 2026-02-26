#!/bin/bash

# Initializes the project by setting up environment variables and running initial migrations

echo "======================================================================="
echo "=================== PMF App Initialization ============================"
echo "======================================================================="

# Get Inputs
echo ""
read -p "Enter your new app name (no spaces or special characters): " APP_NAME
read -p "Enter the PMF Dokku Host (get from PMF Builder Admin): " PMF_DOKKU_HOST

# Create .env file
echo ""
echo "Creating .env file..."
touch .env
echo "PMF_DOKKU_HOST=$PMF_DOKKU_HOST" >> .env
echo "" >> .env

# Check for SSH access to Dokku host
echo "Verifying SSH access to Dokku host..."
ssh dokku@$PMF_DOKKU_HOST apps:list > /dev/null 2>&1
if [ $? -ne 0 ];
then
    echo "SSH access to Dokku host failed. Please ensure your SSH key is added to the Dokku server."
    echo ""
    echo "Run the SSH-key initialization script: "
    echo "pnpm run init:ssh"
    echo ""
    echo "Then contact PMF Builder Admin after running the script."
    exit 1 
fi
echo "SSH access to Dokku host verified successfully!"

# Build Dokku Apps & Postgres Containers
echo ""
echo "Building Dokku apps & postgres containers..."
./scripts/init/helpers/dokku.sh $APP_NAME
if [ $? -ne 0 ]; then
    echo "Dokku setup failed. Exiting initialization."
    exit 1
fi
echo ""

# Verify Golang Migrate Installation
echo "Verifying Golang Migrate installation..."
if ! command -v migrate &> /dev/null
then
    echo "Golang Migrate could not be found, please install it."
    # Windows use scoop
    if [[ "$OSTYPE" == "msys" ]]; then
        scoop install migrate
    # MacOS use brew
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        brew install golang-migrate
    # Linux use apt-get
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y golang-migrate
    else
        echo "Unsupported OS. Please install Golang Migrate manually from https://github.com/golang-migrate/migrate"
    fi
else
    echo "Golang Migrate is already installed."
fi
echo ""

# Install dependencies
echo "Installing project dependencies..."
pnpm install
echo ""

# Run database migrations
./scripts/init/helpers/db.sh
if [ $? -ne 0 ]; then
    echo "Database migration failed. Exiting initialization."
    exit 1
fi
echo ""

# Create a pepper for password hashing and store it in .env
echo "Creating pepper..."
PEPPER=$(openssl rand -hex 32)
echo "PASSWORD_HASH_SECRET=$PEPPER" >> .env
echo ""

# Insert Google OAuth credentials placeholders in .env
echo "Inserting Google OAuth credentials placeholders in .env..."
echo "GOOGLE_CLIENT_ID=your_google_client_id_here" >> .env
echo "GOOGLE_CLIENT_SECRET=your_google_client_secret_here" >> .env
echo "GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback" >> .env
echo ""

# Set up system admin user
echo "Setting up system admin user..."
tsx ./scripts/init/helpers/sysadmin.ts
echo ""

# Seed database with test data
echo "Seeding database with test data..."
tsx ./scripts/init/helpers/seed.ts
echo ""

# Create GitHub workflows for Dokku deployment
echo "Creating GitHub workflows for Dokku deployment..."
./scripts/init/helpers/cicd.sh $PMF_DOKKU_HOST $APP_NAME
if [ $? -ne 0 ]; then
    echo "GitHub workflow setup failed. Exiting initialization."
    exit 1
fi
echo ""

# Add template repo as git remote for future syncing
./scripts/init/helpers/register.sh
if [ $? -ne 0 ]; then
    echo "PMF template registration failed. Exiting initialization."
    exit 1
fi
echo ""

# Catch SIGINT to exit gracefully
trap "echo 'Initialization interrupted! Exiting...'; exit 1" SIGINT

echo "======================================================================="
echo "================= PMF App Initialization Complete ====================="
echo "======================================================================="
echo ""
echo "You can now start the development server with 'pnpm dev'"