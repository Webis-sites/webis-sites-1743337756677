#!/bin/bash

# Load environment variables
source .env

# Get current directory name
REPO_NAME=$(basename $(pwd))

# Variables
ORG_NAME=my-org

# Set GitHub token
export GITHUB_TOKEN=$GITHUB_TOKEN

# Create Organization (if doesn't exist)
echo "\033[1;32m✅ Checking or creating organization...\033[0m"
gh org view $ORG_NAME || gh org create $ORG_NAME --industry "Software"

# Create Repository
echo "\033[1;34m📦 Creating repository: $REPO_NAME...\033[0m"
gh repo create $ORG_NAME/$REPO_NAME --public --source=. --remote=origin

# Push to GitHub
echo "\033[1;36m🚀 Pushing to GitHub...\033[0m"
git add .
git commit -m "Initial commit"
git push origin main 