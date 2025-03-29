#!/bin/bash

# Load environment variables
source .env

# Login to Vercel
echo "\033[1;32m🔑 Logging into Vercel...\033[0m"
vercel login --token $VERCEL_TOKEN

# Link Project to Vercel
echo "\033[1;34m🔗 Linking project to Vercel...\033[0m"
vercel link 