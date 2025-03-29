#!/bin/bash

# Load environment variables
source .env

# Set production branch to main
echo "\033[1;32m🛠️ Setting production branch to main...\033[0m"
vercel project edit --prod-branch main

# Enable Preview Deployments
echo "\033[1;34m🚀 Deploying preview...\033[0m"
vercel deploy 