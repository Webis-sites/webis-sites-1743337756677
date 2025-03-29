#!/bin/bash

# Load environment variables
source .env

# Check Vercel Status
echo "\033[1;34m📊 Checking Vercel deployment status...\033[0m"
vercel ls

# Open the project in browser
echo "\033[1;32m🌍 Opening project in browser...\033[0m"
vercel open 