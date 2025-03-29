#!/bin/bash

# Load environment variables
source .env

# Variables
DOMAIN_NAME=yourdomain.com

# Add custom domain
echo "\033[1;32m🌐 Adding custom domain: $DOMAIN_NAME...\033[0m"
vercel domains add $DOMAIN_NAME

# Verify domain
echo "\033[1;34m🔎 Verifying domain...\033[0m"
vercel domains inspect $DOMAIN_NAME 