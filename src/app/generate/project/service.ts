import path from 'path';
import fs from 'fs/promises';
import { FormData, logger, ensureDirectoryExists, convertToValidDirectoryName, AI_MODELS } from '../shared';
import { createPackageJson } from './package';

/**
 * Type representing the result of project setup
 */
export interface ProjectSetupResult {
  projectPath: string;  // The full path to the project directory
  projectDir: string;   // The name of the project directory
}

/**
 * Creates Tailwind CSS configuration file
 */
function createTailwindConfig(formData: FormData): string {
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "${formData.primaryColor}",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "${formData.secondaryColor}",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`;
}

/**
 * Creates TypeScript configuration file
 */
function createTsConfig(): string {
  return `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`;
}

/**
 * Creates the main application layout file
 */
function createAppLayout(formData: FormData): string {
  const rtlSupport: boolean = formData.language === 'he';
  const htmlTagDirection: string = rtlSupport ? 'dir="rtl"' : '';
  const languageCode: string = rtlSupport ? 'he-IL' : 'en-US';
  
  return `import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '${formData.businessName}',
  description: '${formData.description}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="${languageCode}" ${htmlTagDirection}>
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  )
}`;
}

/**
 * Creates the main page file for the application
 */
function createRootPage(): string {
  return `'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This will be replaced when components are added
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
          <div className="h-4 w-56 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to your new website</h1>
        <p className="text-xl mb-8">
          Start building your site by adding components to this page.
        </p>
      </div>
    </main>
  );
}`;
}

/**
 * Sets up the basic project structure
 * @param projectName The name of the project directory
 * @returns Project setup result
 */
export async function setupProject(projectName: string): Promise<ProjectSetupResult> {
  try {
    // יצירת תיקיית landing-pages
    const landingPagesDir = path.join(process.cwd(), 'landing-pages');
    await ensureDirectoryExists(landingPagesDir);
    logger.info(`Created landing-pages directory: ${landingPagesDir}`);

    // יצירת תיקיית הפרויקט
    const projectPath = path.join(landingPagesDir, projectName);
    await ensureDirectoryExists(projectPath);
    logger.info(`Created project directory: ${projectPath}`);

    // יצירת תיקיות המשנה
    const srcPath = path.join(projectPath, 'src');
    const appPath = path.join(srcPath, 'app');
    const componentsPath = path.join(srcPath, 'components');
    const publicPath = path.join(projectPath, 'public');

    await Promise.all([
      ensureDirectoryExists(srcPath),
      ensureDirectoryExists(appPath),
      ensureDirectoryExists(componentsPath),
      ensureDirectoryExists(publicPath)
    ]);

    logger.info(`Created project subdirectories in: ${projectPath}`);

    // וידוא שכל התיקיות נוצרו בהצלחה
    await Promise.all([
      fs.access(srcPath),
      fs.access(appPath),
      fs.access(componentsPath),
      fs.access(publicPath)
    ]);

    // יצירת קובץ package.json ואיתחול פרויקט בסיסי
    const formData: FormData = {
      businessName: projectName,
      description: 'A website generated with Next.js',
      businessType: 'business',
      industry: 'general',
      primaryColor: '#3b82f6',
      secondaryColor: '#10b981',
      language: 'he',
      includeTestimonials: false,
      includeFAQ: false,
      hasProducts: false,
      hasServices: false,
      hasPortfolio: false,
      needsBookingSystem: false,
      designStyles: [],
      aiModel: AI_MODELS.CLAUDE_3_7_SONNET
    };
    
    // יצירת קבצי הבסיס
    const packageJsonContent = createPackageJson(formData);
    const tsConfigContent = createTsConfig();
    const tailwindConfigContent = createTailwindConfig(formData);
    const appLayoutContent = createAppLayout(formData);
    const rootPageContent = createRootPage();
    
    // כתיבת הקבצים
    await Promise.all([
      fs.writeFile(path.join(projectPath, 'package.json'), packageJsonContent),
      fs.writeFile(path.join(projectPath, 'tsconfig.json'), tsConfigContent),
      fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfigContent),
      fs.writeFile(path.join(appPath, 'layout.tsx'), appLayoutContent),
      fs.writeFile(path.join(appPath, 'page.tsx'), rootPageContent),
      fs.writeFile(path.join(appPath, 'globals.css'), `@tailwind base;\n@tailwind components;\n@tailwind utilities;`)
    ]);
    
    logger.info(`Created base project files in: ${projectPath}`);
    
    return {
      projectPath,
      projectDir: projectName
    };
  } catch (error) {
    logger.error(`Failed to setup project: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
} 