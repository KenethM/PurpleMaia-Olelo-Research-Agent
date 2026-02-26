#!/bin/bash

# Sync changes from the PMF template repository and create a PR.

echo "================ Sync from PMF Template ==============================="
echo ""

# Ensure we're in a git repo
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "Error: Not inside a git repository."
    exit 1
fi

# Add template remote if it doesn't exist
echo "Setting up template remote..."
if git remote get-url template > /dev/null 2>&1; then
    echo "Template remote already exists."
else
    git remote add template https://github.com/PurpleMaia/app-template.git
    echo "Template remote added."
fi
echo ""

# Fetch latest from template
echo "Fetching latest from template..."
git fetch template main
echo ""

# Check for differences
DIFF=$(git log HEAD..template/main --oneline 2>/dev/null)
if [ -z "$DIFF" ]; then
    echo "No new changes from template. You're up to date!"
    exit 0
fi

echo "Changes available from template:"
echo "$DIFF"
echo ""

# Ask user how to proceed
read -p "Create a PR branch with these changes? (y/n): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# Create branch
BRANCH="template-sync-$(date +%Y%m%d-%H%M%S)"
echo ""
echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

# Merge
echo "Merging template changes..."
if git merge template/main --no-edit; then
    echo "Merge successful."
else
    echo ""
    echo "⚠ Merge conflicts detected!"
    echo "Resolve conflicts, then run:"
    echo "  git add ."
    echo "  git commit"
    echo "  git push -u origin $BRANCH"
    echo "  gh pr create --title 'chore: sync with template'"
    exit 1
fi

# Push and create PR
echo ""
echo "Pushing branch..."
git push -u origin "$BRANCH"

echo ""
read -p "Create a PR now? (y/n): " CREATE_PR
if [[ "$CREATE_PR" =~ ^[Yy]$ ]]; then
    if command -v gh &> /dev/null; then
        gh pr create \
            --title "chore: sync with template repository" \
            --body "Syncs latest changes from PurpleMaia/app-template."
        echo "PR created!"
    else
        echo "GitHub CLI not installed. Create PR manually on GitHub."
    fi
else
    echo "Branch pushed. Create PR manually when ready:"
    echo "  gh pr create --title 'chore: sync with template'"
fi

echo ""
echo "Done!"