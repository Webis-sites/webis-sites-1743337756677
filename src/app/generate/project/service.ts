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
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "fade-out": {
          from: { opacity: 1 },
          to: { opacity: 0 },
        },
        "slide-in-from-top": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
        "slide-in-from-top": "slide-in-from-top 0.3s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.3s ease-out",
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
 * Creates Next.js configuration file with Unsplash images support
 */
function createNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com'],
  },
  i18n: {
    locales: ['he', 'en'],
    defaultLocale: 'he',
    localeDetection: true,
  },
};

module.exports = nextConfig;`;
}

/**
 * Creates PostCSS configuration file
 */
function createPostcssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};`;
}

/**
 * Creates the globals.css file with Tailwind imports and CSS variables
 */
function createGlobalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;
 
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71.4% 4.1%;
    --card: 0 0% 100%;
    --card-foreground: 224 71.4% 4.1%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71.4% 4.1%;
    --primary: 220.9 39.3% 11%;
    --primary-foreground: 210 20% 98%;
    --secondary: 220 14.3% 95.9%;
    --secondary-foreground: 220.9 39.3% 11%;
    --muted: 220 14.3% 95.9%;
    --muted-foreground: 220 8.9% 46.1%;
    --accent: 220 14.3% 95.9%;
    --accent-foreground: 220.9 39.3% 11%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 20% 98%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 224 71.4% 4.1%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 224 71.4% 4.1%;
    --foreground: 210 20% 98%;
    --card: 224 71.4% 4.1%;
    --card-foreground: 210 20% 98%;
    --popover: 224 71.4% 4.1%;
    --popover-foreground: 210 20% 98%;
    --primary: 210 20% 98%;
    --primary-foreground: 220.9 39.3% 11%;
    --secondary: 215 27.9% 16.9%;
    --secondary-foreground: 210 20% 98%;
    --muted: 215 27.9% 16.9%;
    --muted-foreground: 217.9 10.6% 64.9%;
    --accent: 215 27.9% 16.9%;
    --accent-foreground: 210 20% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 20% 98%;
    --border: 215 27.9% 16.9%;
    --input: 215 27.9% 16.9%;
    --ring: 216 12.2% 83.9%;
  }
}
 
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;
}

/**
 * Creates the SEO config file with default settings
 */
function createSeoConfig(formData: FormData): string {
  return `import { Metadata } from 'next';

/**
 * בסיס נתונים לקביעת מטא-תיאור עבור SEO
 */
export interface SeoProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
}

/**
 * קביעות ברירת מחדל עבור מטא-תיאור
 */
export const defaultSeo: SeoProps = {
  title: '${formData.businessName}',
  description: '${formData.description || 'אתר עסקי מקצועי'}',
  keywords: ['${formData.businessType}', '${formData.industry}', 'שירותים', 'עסק'],
  ogImage: '/og-image.jpg',
};

/**
 * יוצר מטא-תגים עבור כל עמוד
 */
export function constructMetadata({
  title = defaultSeo.title,
  description = defaultSeo.description,
  keywords = defaultSeo.keywords,
  ogImage = defaultSeo.ogImage,
  canonicalUrl,
}: SeoProps = defaultSeo): Metadata {
  return {
    title: title,
    description: description,
    keywords: keywords,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}`;
}

/**
 * Creates the SEO metadata component
 */
function createSeoComponent(): string {
  return `import React from 'react';
import { constructMetadata, SeoProps } from '@/lib/seo-config';

interface MetadataProps {
  params: SeoProps;
}

export function generateMetadata({ params }: MetadataProps) {
  return constructMetadata(params);
}

export default function Seo({ params }: { params: SeoProps }) {
  return null; // This component doesn't render anything
}`;
}

/**
 * Creates a simple robots.txt file
 */
function createRobotsTxt(formData: FormData): string {
  return `# robots.txt - ${formData.businessName}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${formData.businessName.toLowerCase().replace(/\s+/g, '-')}.com/sitemap.xml`;
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
    const libPath = path.join(srcPath, 'lib');
    const publicPath = path.join(projectPath, 'public');

    await Promise.all([
      ensureDirectoryExists(srcPath),
      ensureDirectoryExists(appPath),
      ensureDirectoryExists(componentsPath),
      ensureDirectoryExists(libPath),
      ensureDirectoryExists(publicPath)
    ]);

    logger.info(`Created project subdirectories in: ${projectPath}`);

    // וידוא שכל התיקיות נוצרו בהצלחה
    await Promise.all([
      fs.access(srcPath),
      fs.access(appPath),
      fs.access(componentsPath),
      fs.access(libPath),
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
    const nextConfigContent = createNextConfig();
    const postcssConfigContent = createPostcssConfig();
    const globalsCssContent = createGlobalsCss();
    const seoConfigContent = createSeoConfig(formData);
    const robotsTxtContent = createRobotsTxt(formData);
    
    // כתיבת הקבצים
    await Promise.all([
      fs.writeFile(path.join(projectPath, 'package.json'), packageJsonContent),
      fs.writeFile(path.join(projectPath, 'tsconfig.json'), tsConfigContent),
      fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfigContent),
      fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfigContent),
      fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfigContent),
      fs.writeFile(path.join(projectPath, 'robots.txt'), robotsTxtContent),
      fs.writeFile(path.join(appPath, 'layout.tsx'), appLayoutContent),
      fs.writeFile(path.join(appPath, 'page.tsx'), rootPageContent),
      fs.writeFile(path.join(appPath, 'globals.css'), globalsCssContent),
      fs.writeFile(path.join(libPath, 'seo-config.ts'), seoConfigContent)
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