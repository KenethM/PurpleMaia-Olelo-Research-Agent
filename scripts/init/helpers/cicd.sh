#!/bin/bash

PMF_DOKKU_HOST=$1
APP_NAME=$2

cd .github
mkdir -p workflows
cd workflows

# Create prod workflow file for Dokku deployment
touch deploy.yml
echo "---" >> deploy.yml
echo "name: Deploy to Dokku" >> deploy.yml
echo "on:" >> deploy.yml
echo "  push:" >> deploy.yml
echo "    branches:" >> deploy.yml
echo "      - main" >> deploy.yml
echo "jobs:" >> deploy.yml
echo "  deploy:" >> deploy.yml
echo "    runs-on: ubuntu-latest" >> deploy.yml
echo "    steps:" >> deploy.yml
echo "      - name: Checkout code" >> deploy.yml
echo "        uses: actions/checkout@v4" >> deploy.yml
echo "        with:" >> deploy.yml
echo "          fetch-depth: 0" >> deploy.yml
echo "" >> deploy.yml
echo "      - name: Push to dokku" >> deploy.yml
echo "        uses: dokku/github-action@master" >> deploy.yml
echo "        with:" >> deploy.yml
echo "          git_remote_url: 'ssh://dokku@{$PMF_DOKKU_HOST}:22/${APP_NAME}'" >> deploy.yml
echo "          ssh_private_key: \${{ secrets.SSH_PRIVATE_SANDBOX_DOKKU_JK }}" >> deploy.yml
echo "          branch: main" >> deploy.yml

# Create dev workflow file for Dokku deployment
touch deploy-dev.yml
echo "---" >> deploy-dev.yml
echo "name: Deploy to Dokku" >> deploy-dev.yml
echo "on:" >> deploy-dev.yml
echo "  push:" >> deploy-dev.yml
echo "    branches:" >> deploy-dev.yml
echo "      - main" >> deploy-dev.yml
echo "jobs:" >> deploy-dev.yml
echo "  deploy:" >> deploy-dev.yml
echo "    runs-on: ubuntu-latest" >> deploy-dev.yml
echo "    steps:" >> deploy-dev.yml
echo "      - name: Checkout code" >> deploy-dev.yml
echo "        uses: actions/checkout@v4" >> deploy-dev.yml
echo "        with:" >> deploy-dev.yml
echo "          fetch-depth: 0" >> deploy-dev.yml
echo "" >> deploy-dev.yml
echo "      - name: Push to dokku" >> deploy-dev.yml
echo "        uses: dokku/github-action@master" >> deploy-dev.yml
echo "        with:" >> deploy-dev.yml
echo "          git_remote_url: 'ssh://dokku@{$PMF_DOKKU_HOST}:22/${APP_NAME}-dev'" >> deploy-dev.yml
echo "          ssh_private_key: \${{ secrets.SSH_PRIVATE_SANDBOX_DOKKU_JK }}" >> deploy-dev.yml
echo "          branch: dev" >> deploy-dev.yml