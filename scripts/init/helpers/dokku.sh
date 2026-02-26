#!/bin/bash

APP_NAME=$1
ENV_FILE=".env"
export $(cat $ENV_FILE | grep -v '^#' | xargs)

# Check if SSH access is working
echo "Verifying SSH access to Dokku host..."
ssh dokku@$PMF_DOKKU_HOST apps:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "SSH access to Dokku host failed. Please ensure your SSH key is added to the Dokku server."
    echo "Contact PMF Builder Admin and run the ssh-key initialization script: "
    echo "pnpm run init:ssh"
    exit 1
fi

# Check if env vars are set
if [ -z "$PMF_DOKKU_HOST" ]; then
    echo "PMF_DOKKU_HOST is not set in .env file. Please set it and try again."
    exit 1
fi

# Create Dokku apps (dev & prod)
echo "Creating Dokku apps and Postgres containers for $APP_NAME..."
## DEV
echo "Creating DEV Dokku app & postgres container..."
ssh dokku@$PMF_DOKKU_HOST apps:create $APP_NAME-dev
ssh dokku@$PMF_DOKKU_HOST postgres:create $APP_NAME-dev-db
ssh dokku@$PMF_DOKKU_HOST postgres:expose $APP_NAME-dev-db
ssh dokku@$PMF_DOKKU_HOST postgres:link $APP_NAME-dev-db $APP_NAME-dev
ssh dokku@$PMF_DOKKU_HOST letsencrypt:enable $APP_NAME-dev

## PROD
echo "Creating PROD Dokku app & postgres container..."
ssh dokku@$PMF_DOKKU_HOST apps:create $APP_NAME
ssh dokku@$PMF_DOKKU_HOST postgres:create $APP_NAME-db
ssh dokku@$PMF_DOKKU_HOST postgres:expose $APP_NAME-db
ssh dokku@$PMF_DOKKU_HOST postgres:link $APP_NAME-db $APP_NAME
ssh dokku@$PMF_DOKKU_HOST letsencrypt:enable $APP_NAME
echo ""

echo "Dokku apps and Postgres containers created successfully!"
echo ""

# Get external database URLs
echo "Retrieving database connection URLs and writing to .env file..."
DEV_INTERNAL_DB_URL=$(ssh dokku@$PMF_DOKKU_HOST postgres:info $APP_NAME-dev-db | grep 'Dsn:' | awk '{print $2}')
DEV_EXPOSED_PORT=$(ssh dokku@$PMF_DOKKU_HOST postgres:info $APP_NAME-dev-db | grep 'Exposed ports:' | awk '{print $3}' | cut -d'>' -f2)
DEV_DOMAIN=$(ssh dokku@$PMF_DOKKU_HOST domains:report $APP_NAME-dev | grep 'Domains app vhosts:' | awk '{print $4}')

DEV_DB_URL=$(echo $DEV_INTERNAL_DB_URL | sed "s/@[^:]*:[0-9]*/@$PMF_DOKKU_HOST:$DEV_EXPOSED_PORT/")
echo "DEV_DB_URL: $DEV_DB_URL"

PROD_INTERNAL_DB_URL=$(ssh dokku@$PMF_DOKKU_HOST postgres:info $APP_NAME-db | grep 'Dsn:' | awk '{print $2}')
PROD_EXPOSED_PORT=$(ssh dokku@$PMF_DOKKU_HOST postgres:info $APP_NAME-db | grep 'Exposed ports:' | awk '{print $3}' | cut -d'>' -f2)
PROD_DOMAIN=$(ssh dokku@$PMF_DOKKU_HOST domains:report $APP_NAME | grep 'Domains app vhosts:' | awk '{print $4}')

PROD_DB_URL=$(echo $PROD_INTERNAL_DB_URL | sed "s/@[^:]*:[0-9]*/@$PMF_DOKKU_HOST:$PROD_EXPOSED_PORT/")
echo "PROD_DB_URL: $PROD_DB_URL"
echo ""

# Write DB URLs to .env file
echo "Writing DEV_DB_URL and PROD_DB_URL to .env file..."
echo "" >> .env
echo "# Database connection URLs, DEV is set to default, uncomment to test PROD" >> .env
echo "DATABASE_URL=$DEV_DB_URL" >> .env
echo "#DATABASE_URL=$PROD_DB_URL" >> .env
echo "" >> .env
echo "# When you want to test different database environments on the application level, uncomment the corresponding database URLs below" >> .env
echo "# Refer to src/lib/db/kysely/client.ts for how these are used" >> .env
echo "DEV_URL=$DEV_DB_URL" >> .env
echo "PROD_URL=$PROD_DB_URL" >> .env
echo "" >> .env
echo "# Application base URLs for DEV and PROD environments (locally is localhost:3000)" >> .env
echo "#NEXT_PUBLIC_BASE_URL=https://$DEV_DOMAIN" >> .env
echo "#NEXT_PUBLIC_BASE_URL=https://$PROD_DOMAIN" >> .env
echo "" >> .env
echo ""
