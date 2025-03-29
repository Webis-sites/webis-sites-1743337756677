#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check for gh
if ! command_exists gh; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Check for vercel
if ! command_exists vercel; then
    echo "❌ Vercel CLI is not installed. Please install it first."
    exit 1
fi

# Check for .env file
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with GITHUB_TOKEN and VERCEL_TOKEN."
    exit 1
fi

# Make all scripts executable
echo -e "${BLUE}🔧 Making scripts executable...${NC}"
chmod +x "$(dirname "$0")"/*.sh

# Run scripts in order
echo -e "${GREEN}🚀 Starting setup process...${NC}"

# Create GitHub repository
echo -e "${BLUE}📦 Creating GitHub repository...${NC}"
"$(dirname "$0")/create-repo.sh"

# Setup Vercel
echo -e "${BLUE}🔗 Setting up Vercel...${NC}"
"$(dirname "$0")/vercel-setup.sh"

# Deploy to Vercel
echo -e "${BLUE}🚀 Deploying to Vercel...${NC}"
"$(dirname "$0")/vercel-deploy.sh"

# Check status
echo -e "${BLUE}📊 Checking deployment status...${NC}"
"$(dirname "$0")/check-status.sh"

echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo -e "${BLUE}ℹ️  Note: To add a custom domain later, run: ./server/scripts/add-domain.sh${NC}" 