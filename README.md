# Next.js Project with GitHub and Vercel Integration

This project demonstrates how to set up automatic deployments from GitHub to Vercel with custom domain support.

## Project Structure

```
server/
├── scripts/           # Deployment and setup scripts
│   ├── setup.sh      # Main setup script that runs all other scripts
│   ├── create-repo.sh
│   ├── vercel-setup.sh
│   ├── vercel-deploy.sh
│   ├── add-domain.sh  # Optional: For custom domain setup
│   └── check-status.sh
└── config/           # Configuration files
```

## Prerequisites

### Required Tools Installation

#### GitHub CLI (gh)

For macOS (using Homebrew):
```bash
brew install gh
```

For Windows (using Scoop):
```bash
scoop bucket add github-gh https://github.com/cli/scoop-gh.git
scoop install gh
```

For Linux (Ubuntu/Debian):
```bash
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

#### Vercel CLI

Using npm:
```bash
npm install -g vercel
```

Using yarn:
```bash
yarn global add vercel
```

Using pnpm:
```bash
pnpm add -g vercel
```

### Additional Prerequisites

- Node.js installed
- A `.env` file with the following variables:
  ```
  GITHUB_TOKEN=your_github_token
  VERCEL_TOKEN=your_vercel_token
  ```

## Setup Instructions

1. Make the setup script executable:
   ```bash
   chmod +x server/scripts/setup.sh
   ```

2. Run the setup script:
   ```bash
   ./server/scripts/setup.sh
   ```

The setup script will:
- Check for required prerequisites
- Make all scripts executable
- Create a GitHub repository with the current directory name
- Set up Vercel deployment
- Configure automatic deployments
- Check the deployment status

## Scripts Description

- `setup.sh`: Main script that runs all other scripts in the correct order
- `create-repo.sh`: Creates a GitHub organization and repository, then pushes the project
- `vercel-setup.sh`: Logs into Vercel and links the project
- `vercel-deploy.sh`: Sets up production branch and enables preview deployments
- `check-status.sh`: Checks deployment status and opens the project in browser

### Optional Scripts

- `add-domain.sh`: Adds and verifies custom domain (run separately when ready to add a custom domain)

## Environment Variables

Make sure your `.env` file contains the following variables:
- `GITHUB_TOKEN`: Your GitHub personal access token
- `VERCEL_TOKEN`: Your Vercel authentication token

## Notes

- The scripts use environment variables from `.env` file
- The repository name will be automatically set to the current directory name
- Custom domain setup is handled separately using `add-domain.sh` when you're ready to add your domain

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
