#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo ".env file not found! Please run the init script first."
    exit 1
fi

# Run initial migrations on development and production databases
echo "Running initial database migrations..."
echo "This will create the following data tables in your schema:"
echo "  - users (system_roles: sysadmin, user)"
echo "  - sessions"
echo "  - login_attempts"
pnpm migrate:up d 1
pnpm migrate:up p 1
echo ""

# Run multi-tenancy migration (orgs & members)
echo ""
echo "The next migration will set up multi-tenancy data tables."
echo "This will create the following data tables in your schema:"
echo "  - orgs (roles: org_admin, member, guest)"
echo "  - members"
echo "Running multi-tenancy database migrations..."
pnpm migrate:up d 1
pnpm migrate:up p 1
echo ""