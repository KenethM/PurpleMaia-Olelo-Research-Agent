#!/bin/bash

# Registers this repository with the PMF template for tracking and future sync notifications

echo "======================================================================="
echo "================ PMF Template Registration ============================"
echo "======================================================================="
echo ""

# Add template repo as git remote for future syncing
echo "Adding template repository as git remote..."
if git remote get-url template > /dev/null 2>&1; then
    echo "Template remote already exists."
else
    git remote add template git@github.com:PurpleMaia/app-template.git
    echo "Template remote added."
fi
echo ""

# Get current repo info
CURRENT_REPO=$(git remote get-url origin 2>/dev/null | sed -E 's/.*github.com[:/](.+)(\.git)?$/\1/' | sed 's/\.git$//')

if [ -z "$CURRENT_REPO" ]; then
    echo "Error: Could not determine current repository from git remote."
    echo "Make sure you have an 'origin' remote set up."
    exit 1
fi

echo "Current repository: $CURRENT_REPO"
echo ""

# Register with PMF template
echo "Registering with PMF template repository..."
if command -v gh &> /dev/null; then
    if gh auth status &> /dev/null; then
        gh api repos/PurpleMaia/app-template/dispatches \
            --method POST \
            -f event_type=register-downstream \
            -F client_payload[repo]="$CURRENT_REPO" \
            && echo "Successfully registered $CURRENT_REPO with PMF template." \
            || { echo "Error: Could not register with PMF template."; exit 1; }
    else
        echo "Error: GitHub CLI is not authenticated."
        echo "Run 'gh auth login' first, then re-run this script."
        exit 1
    fi
else
    echo "Error: GitHub CLI (gh) is not installed."
    echo "Install it from https://cli.github.com/ then re-run this script."
    exit 1
fi

echo ""
echo "======================================================================="
echo "Registration complete!"
echo ""
echo "You can sync template updates anytime with:"
echo "  git fetch template"
echo "  git merge template/main --allow-unrelated-histories"
echo "======================================================================="
