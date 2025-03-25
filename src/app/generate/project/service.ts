import path from 'path';
import fs from 'fs/promises';
import { FormData, logger, ensureDirectoryExists, convertToValidDirectoryName } from '../shared';
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
 * @param formData Form data with business information
 * @param baseDir Base directory path
 * @param customDirName Optional custom directory name for the project
 * @returns Project setup result
 */
export async function setupProject(
  formData: FormData,
  baseDir: string,
  customDirName?: string
): Promise<ProjectSetupResult> {
  try {
    // Create valid directory name - use custom name if provided
    const projectDir: string = customDirName || convertToValidDirectoryName(formData.businessName);
    const projectPath: string = path.join(baseDir, projectDir);
    
    logger.startProcess(`Project Setup: ${projectDir}`);
    logger.info(`Creating project at path: ${projectPath}`);
    
    // Create base directories
    await ensureDirectoryExists(path.join(projectPath, 'src', 'app'));
    await ensureDirectoryExists(path.join(projectPath, 'src', 'components'));
    await ensureDirectoryExists(path.join(projectPath, 'public'));
    
    // Create configuration files
    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      createPackageJson(formData),
      'utf-8'
    );
    logger.fileCreated('package.json');
    
    await fs.writeFile(
      path.join(projectPath, 'tailwind.config.js'),
      createTailwindConfig(formData),
      'utf-8'
    );
    logger.fileCreated('tailwind.config.js');
    
    await fs.writeFile(
      path.join(projectPath, 'postcss.config.js'),
      `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'utf-8'
    );
    logger.fileCreated('postcss.config.js');
    
    await fs.writeFile(
      path.join(projectPath, 'tsconfig.json'),
      createTsConfig(),
      'utf-8'
    );
    logger.fileCreated('tsconfig.json');
    
    // Create basic application files
    await fs.writeFile(
      path.join(projectPath, 'src', 'app', 'layout.tsx'),
      createAppLayout(formData),
      'utf-8'
    );
    logger.fileCreated('src/app/layout.tsx');
    
    await fs.writeFile(
      path.join(projectPath, 'src', 'app', 'page.tsx'),
      createRootPage(),
      'utf-8'
    );
    logger.fileCreated('src/app/page.tsx');
    
    await fs.writeFile(
      path.join(projectPath, 'src', 'app', 'globals.css'),
      `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-color: ${formData.primaryColor};
  --secondary-color: ${formData.secondaryColor};
}

body {
  direction: ${formData.language === 'he' ? 'rtl' : 'ltr'};
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}`,
      'utf-8'
    );
    logger.fileCreated('src/app/globals.css');
    
    // Create project summary for logging
    const projectSummary: Record<string, string | boolean> = {
      'Project Name': projectDir,
      'Business Type': formData.businessType,
      'Industry': formData.industry,
      'Language': formData.language,
      'RTL Support': formData.language === 'he'
    };
    
    logger.summary('Project Setup Summary', projectSummary);
    logger.endProcess(`Project Setup: ${projectDir}`);
    
    return {
      projectPath,
      projectDir
    };
  } catch (error: unknown) {
    logger.error('Error setting up project structure', error);
    throw error;
  }
} 