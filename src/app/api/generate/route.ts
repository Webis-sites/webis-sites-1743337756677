import { NextRequest, NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Console colors for better logging
const colors = {
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Types and Schemas
interface FormData {
  businessName: string;
  businessType: string;
  industry: string;
  businessSize: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  typographyStyle: string;
  animationPreference: string;
  language: string;
  headline: string;
  descriptionText: string;
  ctaText: string;
  formFields: string[];
  includeTestimonials: boolean;
  includeFAQ: boolean;
  hasProducts: boolean;
  hasServices: boolean;
  hasPortfolio: boolean;
  needsBookingSystem: boolean;
  metaKeywords: string;
  metaDescription: string;
}

const ComponentSchema = z.object({
  code: z.string().min(1),
  dependencies: z.array(z.object({
    name: z.string().min(1),
    version: z.string().min(1)
  }))
});

const ComponentPlanSchema = z.object({
  components: z.record(z.string())
});

type Component = z.infer<typeof ComponentSchema>;
type ComponentPlan = z.infer<typeof ComponentPlanSchema>;

// Helper Functions
function convertToValidDirectoryName(name: string) {
  const timestamp = Date.now();
  return `landing-${name.trim().replace(/\s+/g, '-')}-${timestamp}`;
}

// פונקציה חדשה ליצירת תיקיות משנה
async function ensureDirectoryExists(filePath: string) {
  const directory = path.dirname(filePath);
  try {
    await fs.promises.mkdir(directory, { recursive: true });
    console.log(`${colors.cyan}📁 Created directory: ${directory}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}❌ Error creating directory: ${directory}${colors.reset}`, error);
    throw error;
  }
}

function getFileExtension(fileName: string): string {
  // אם יש כבר סיומת, נשתמש בה
  if (fileName.includes('.')) {
    return '';
  }
  // אחרת נחליט לפי סוג הקובץ
  if (fileName.includes('css')) {
    return '.css';
  }
  if (fileName.endsWith('ts')) {
    return '.ts';
  }
  return '.tsx';
}

function getTargetDirectory(fileName: string, projectDir: string): string {
  // קבצים מיוחדים של Next.js
  if (fileName.toLowerCase().includes('layout') || 
      fileName.toLowerCase().includes('page') || 
      fileName.toLowerCase().includes('loading') || 
      fileName.toLowerCase().includes('error')) {
    return path.join(projectDir, 'src', 'app');
  }

  // קבצי סגנון
  if (fileName.startsWith('styles/')) {
    return path.join(projectDir, 'src', fileName.split('/').slice(0, -1).join('/'));
  }

  // קבצי ספריות ועזרים
  if (fileName.startsWith('lib/') || fileName.startsWith('utils/')) {
    return path.join(projectDir, 'src', fileName.split('/').slice(0, -1).join('/'));
  }

  // קומפוננטות UI
  if (fileName.startsWith('ui/')) {
    return path.join(projectDir, 'src', 'components', fileName.split('/').slice(0, -1).join('/'));
  }

  // קומפוננטות רגילות
  return path.join(projectDir, 'src', 'components');
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 1000,
  context: string = ''
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const waitTime = baseDelay * Math.pow(2, i);
      console.log(`${colors.yellow}⚠️ [Retry] Attempt ${i + 1}/${retries} failed for ${context}. Retrying in ${waitTime}ms...${colors.reset}`);
      console.error(`${colors.red}Error details:${colors.reset}`, error);
      await delay(waitTime);
    }
  }
  
  console.error(`${colors.red}❌ [Retry] All ${retries} attempts failed for ${context}${colors.reset}`);
  throw lastError;
}

// Helper function for logging errors
function logFunctionError(functionName: string, params: Record<string, any>, error: any) {
  console.error(`
${colors.red}❌ Error in function: ${functionName}${colors.reset}
${colors.yellow}Parameters:${colors.reset}
${Object.entries(params)
  .map(([key, value]) => `  ${key}: ${JSON.stringify(value, null, 2)}`)
  .join('\n')}
${colors.red}Error details:${colors.reset}
`, error);
}

// AI Functions
async function getComponentPlan(data: FormData): Promise<ComponentPlan> {
  console.log(`${colors.cyan}🚀 [AI] Requesting component plan${colors.green} 🌟${colors.reset}`);
  
  try {
    const { object } = await generateObject({
      model: anthropic('claude-3-7-sonnet-20250219'),
      schema: ComponentPlanSchema,
      prompt: `Generate a high-end, fully tailored, innovative and unique landing page built with the latest stable version of Next.js using the App Router architecture and styled with Tailwind CSS.  
The design, structure, and content must adapt dynamically to the provided business details.  
The landing page must be production-ready, modular, responsive, accessible, and optimized for performance, engagement, and conversion.

### AI Professional Behavior:
You are acting as a combination of:
- Senior UX/UI Designer  
- Conversion Rate Optimization (CRO) Specialist  
- Web Performance Engineer  
- SEO Expert  
- Software Architect

### Business Details:
- Business name: ${data.businessName}
- Business type: ${data.businessType}
- Industry: ${data.industry}
- Business size: ${data.businessSize}
- Description: ${data.description}
- Primary color: ${data.primaryColor}
- Secondary color: ${data.secondaryColor}
- Typography style: ${data.typographyStyle}
- Animation preference: ${data.animationPreference}
- Language: ${data.language}
- Headline: ${data.headline}
- Description text: ${data.descriptionText}
- Call to action text: ${data.ctaText}
- Form fields: ${data.formFields.join(', ')}
- Include testimonials: ${data.includeTestimonials}
- Include FAQ: ${data.includeFAQ}
- Has products: ${data.hasProducts}
- Has services: ${data.hasServices}
- Has portfolio: ${data.hasPortfolio}
- Needs booking system: ${data.needsBookingSystem}
- Meta keywords: ${data.metaKeywords}
- Meta description: ${data.metaDescription}

### Section Customization & Layout:
- Dynamically determine the number, type, and order of sections based on the business context.
- Do NOT use a fixed or repetitive template.
- Include creative, business-relevant sections.
- Use unique layout structures, non-repetitive visuals, and variation in section styling.
- Each section must serve a real, conversion-oriented purpose aligned with the business goals.
- Avoid boilerplate or generic content.
- For all images - DO NOT use local image paths. Instead, ALWAYS use Unsplash image URLs (https://images.unsplash.com/...) with appropriate alt text and proper error handling.

### Design and UX:
- Derive the color scheme from the input colors
- Typography should reflect the business tone
- Layouts must be responsive using CSS Grid or Flexbox
- Use Tailwind utility classes cleanly and semantically
- Include subtle animations using Framer Motion
- Use hover/focus states and visual feedback
- Use relevant icons and visuals
- Ensure full responsiveness
- Support RTL layout

### Component Prompts Output:
Return a valid JSON object where:
- Each key is the full file name of a component (e.g., "Hero.tsx")
- Each value is a full prompt to generate that specific component

Each prompt should include:
- The component purpose (based on business context)
- Requirements for responsiveness, accessibility, RTL support
- Focus on business relevance, tone, visual structure, and conversion`
    });

    return object;
  } catch (error) {
    console.error(`${colors.red}❌ Error getting component plan:${colors.reset}`, error);
    throw error;
  }
}

async function getComponentCodeAndDependencies(name: string, componentPrompt: string, formData: FormData): Promise<Component> {
  console.log(`${colors.cyan}🚀 [AI] Creating component: ${name}${colors.green} 🌟${colors.reset}`);

  return withRetry(
    async () => {
      try {
        const { object } = await generateObject({
          model: anthropic('claude-3-7-sonnet-20250219'),
          schema: ComponentSchema,
          prompt: `Using the following prompt, generate a fully responsive, accessible, RTL-compatible React component in TypeScript using Tailwind CSS and Framer Motion.

Component Name: ${name}

Business Context:
- Business Name: ${formData.businessName}
- Primary Color: ${formData.primaryColor}
- Secondary Color: ${formData.secondaryColor}
- Language: ${formData.language} (RTL: ${formData.language === 'he'})
- Animation Level: ${formData.animationPreference}

Component Prompt:
${componentPrompt}

Technical Requirements:
- Use TypeScript with strict type checking
- Use Tailwind CSS for styling
- Implement responsive design
- Follow React best practices
- Include proper error handling
- Add loading states where needed
- Optimize for performance
- Include proper TypeScript types/interfaces
- Add JSDoc comments for better documentation
- Include proper aria-labels and roles for accessibility
- IMPORTANT: Add 'use client' directive at the top of the file if using any client-side features like:
  - framer-motion
  - React hooks (useState, useEffect, etc.)
  - Browser APIs
  - Event listeners
  - Context API
- Use relative imports for components (e.g., '@/components/ui/Button')
- For all images - DO NOT use local image paths like '/images/...' or '/something.jpg'. Instead, ALWAYS use Unsplash image URLs (https://images.unsplash.com/...) with appropriate alt text and proper error handling.

IMPORTANT INSTRUCTIONS:
1. YOU MUST return a JSON object that strictly follows this exact format:
{
  "code": "YOUR_FULL_CODE_HERE",
  "dependencies": [
    {
      "name": "package-name",
      "version": "^x.y.z" 
    }
  ]
}

2. The "code" field MUST be a string containing your complete component code.
3. The "dependencies" field MUST be an array of objects with "name" and "version" properties.
4. Do not include any markdown, explanations, or backticks in your response - ONLY the valid JSON object.
5. Even if you have no dependencies to add, return an empty array for "dependencies", not null or undefined.

Example valid response structure:
{
  "code": "'use client';\n\nimport React from 'react';\n...",
  "dependencies": []
}

Make sure your response can be directly parsed with JSON.parse() without any errors.`
        });

        // נבדוק אם האובייקט מכיל את השדות הנדרשים
        if (!object.code || !object.dependencies) {
          throw new Error('Generated object is missing required fields: code or dependencies');
        }

        // נוסיף את 'use client' אם הקומפוננטה משתמשת ב-framer-motion
        if (object.code.includes('framer-motion') && !object.code.includes("'use client'")) {
          object.code = "'use client';\n\n" + object.code;
        }

        return object;
      } catch (error) {
        logFunctionError('getComponentCodeAndDependencies', {
          name,
          componentPrompt,
          formData: {
            businessName: formData.businessName,
            businessType: formData.businessType,
            language: formData.language,
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            animationPreference: formData.animationPreference
          }
        }, error);
        throw error;
      }
    },
    3,
    1000,
    `component ${name}`
  );
}

// Project Generation Functions
async function generateComponent(name: string, projectDir: string, formData: FormData, componentPrompt: string) {
  console.log(`${colors.cyan}🚀 [Component] Generating ${name}${colors.green} 🌟${colors.reset}`);
  
  try {
    // הסרת תחיליות מיותרות מהשם
    const fileName = name
      .replace('app/', '')
      .replace('components/', '');
    
    // קביעת הסיומת המתאימה
    const extension = getFileExtension(fileName);
    
    // קביעת התיקייה המתאימה
    const targetDir = getTargetDirectory(fileName, projectDir);
    
    // יצירת הנתיב המלא לקובץ
    const filePath = path.join(targetDir, fileName + extension);
    
    // וידוא שכל תיקיות המשנה קיימות
    await ensureDirectoryExists(filePath);

    const { code, dependencies } = await getComponentCodeAndDependencies(fileName, componentPrompt, formData);
    
    // שמירת הקובץ
    await fs.promises.writeFile(filePath, code, 'utf-8');
    console.log(`${colors.cyan}📝 Created file: ${filePath}${colors.reset}`);

    if (dependencies?.length > 0) {
      const packageJsonPath = path.join(projectDir, 'package.json');
      const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

      dependencies.forEach(dep => {
        if (!packageJson.dependencies[dep.name]) {
          packageJson.dependencies[dep.name] = dep.version;
          console.log(`${colors.cyan}📦 Added dependency: ${dep.name}@${dep.version}${colors.reset}`);
        }
      });

      await fs.promises.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    // החזרת הנתיב היחסי הנכון
    const relativePath = fileName + extension;

    return {
      name: fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || fileName,
      code,
      dependencies,
      path: relativePath
    };
  } catch (error) {
    logFunctionError('generateComponent', {
      name,
      projectDir,
      componentPrompt,
      formData: {
        businessName: formData.businessName,
        businessType: formData.businessType,
        language: formData.language,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        animationPreference: formData.animationPreference
      }
    }, error);
    throw error;
  }
}

async function createNextProject(projectDir: string, data: FormData) {
  console.log(`${colors.cyan}🚀 [Next.js] Creating new project: ${projectDir}${colors.green} 🌟${colors.reset}`);
  
  try {
    const plan = await getComponentPlan(data);
    const componentNames = Object.keys(plan.components);
    
    console.log(`\n${colors.cyan}📋 Component Generation Plan:${colors.reset}`);
    console.log(`${colors.cyan}Total components to generate: ${componentNames.length}${colors.reset}`);
    console.log(`${colors.cyan}Components list:${colors.reset}`);
    componentNames.forEach((name, index) => {
      console.log(`${colors.cyan}${index + 1}. ${name}${colors.reset}`);
    });
    console.log('\n');
    
    // Create project structure
    await mkdir(path.join(projectDir, 'src', 'app'), { recursive: true });
    await mkdir(path.join(projectDir, 'src', 'components'), { recursive: true });
    await mkdir(path.join(projectDir, 'public'), { recursive: true });

    // Create base configuration files
    const baseFiles = {
      'package.json': {
        name: path.basename(projectDir),
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start'
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          '@tailwindcss/forms': '^0.5.7',
          'tailwindcss': '^3.4.1',
          'autoprefixer': '^10.4.17',
          'postcss': '^8.4.35',
          'framer-motion': '^11.0.3',
          'react-error-boundary': '^4.0.12',
          '@types/react': '^18.2.55',
          '@types/react-dom': '^18.2.19',
          '@types/node': '^20.11.16',
          'typescript': '^5.3.3'
        }
      },
      'tsconfig.json': `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
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
}`,
      'next.config.js': `/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
    ],
  },
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '${data.primaryColor}',
        secondary: '${data.secondaryColor}'
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
}`,
      'postcss.config.js': `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'src/app/layout.tsx': `import './globals.css'
import ClientLayout from '../components/ClientLayout'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${data.businessName}</title>
      </head>
      <body>
        <ClientLayout businessInfo={{
          name: "${data.businessName}",
          primaryColor: "${data.primaryColor}",
          secondaryColor: "${data.secondaryColor}",
          language: "${data.language}"
        }}>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}`,
      'src/components/ClientLayout.tsx': `'use client';

import React, { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { motion, AnimatePresence } from 'framer-motion';

interface BusinessInfo {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  language: string;
}

interface ClientLayoutProps {
  children: React.ReactNode;
  businessInfo: BusinessInfo;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div role="alert" className="p-4 bg-red-50 text-red-700 rounded-lg">
      <h2 className="text-lg font-semibold">משהו השתבש:</h2>
      <pre className="mt-2 text-sm">{error.message}</pre>
    </div>
  );
}

export default function ClientLayout({ children, businessInfo }: ClientLayoutProps) {
  useEffect(() => {
    // הוספת מחלקות CSS לאלמנט html
    document.documentElement.classList.add('scroll-smooth');
    document.documentElement.style.setProperty('--primary-color', businessInfo.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', businessInfo.secondaryColor);
  }, [businessInfo]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </ErrorBoundary>
  );
}`,
      'src/app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --primary-color: ${data.primaryColor};
  --secondary-color: ${data.secondaryColor};
}

body {
  direction: rtl;
}

@layer base {
  html {
    @apply scroll-smooth;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200;
  }
  
  .btn-secondary {
    @apply bg-secondary text-primary px-4 py-2 rounded-lg hover:bg-opacity-90 transition-all duration-200;
  }
}`,
      'src/app/page.tsx': `'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-4xl font-bold text-center">דף נחיתה בבנייה</h1>
    </motion.main>
  );
}`
    };

    // Write base files
    for (const [filePath, content] of Object.entries(baseFiles)) {
      await fs.promises.writeFile(
        path.join(projectDir, filePath),
        typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      );
    }

    // Generate components
    const components = [];
    let completedComponents = 0;
    const totalComponents = componentNames.length;
    
    for (const [fileName, componentPrompt] of Object.entries(plan.components)) {
      const currentIndex = completedComponents + 1;
      console.log(`\n${colors.cyan}🔄 [${currentIndex}/${totalComponents}] Generating component: ${fileName}${colors.reset}`);
      
      try {
        const component = await generateComponent(fileName, projectDir, data, componentPrompt);
        components.push(component);
        completedComponents++;
        console.log(`${colors.green}✅ [${currentIndex}/${totalComponents}] Successfully generated: ${fileName}${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}❌ [${currentIndex}/${totalComponents}] Failed to generate ${fileName}:${colors.reset}`, error);
      }
    }

    console.log(`\n${colors.cyan}📊 Generation Summary:${colors.reset}`);
    console.log(`${colors.cyan}Total planned: ${totalComponents}${colors.reset}`);
    console.log(`${colors.green}Successfully generated: ${completedComponents}${colors.reset}`);
    console.log(`${colors.red}Failed: ${totalComponents - completedComponents}${colors.reset}\n`);

    // Update page.tsx with components
    const mainPageContent = `'use client';

import { Fragment } from 'react';
${components.map(comp => `import ${comp.name} from '@/components/${comp.name}';`).join('\n')}

export default function Page() {
  return (
    <Fragment>
      ${components.map(comp => `<${comp.name} />`).join('\n      ')}
    </Fragment>
  );
}`;

    await fs.promises.writeFile(path.join(projectDir, 'src', 'app', 'page.tsx'), mainPageContent);

    return {
      success: true,
      project: {
        name: data.businessName,
        path: projectDir,
        directoryName: path.basename(projectDir)
      },
      components: components.map(comp => ({
        name: comp.name,
        path: comp.path,
        dependencies: comp.dependencies,
        status: 'complete'
      })),
      status: {
        totalComponents,
        completedComponents,
        failedComponents: totalComponents - completedComponents,
        progress: Math.round((completedComponents / totalComponents) * 100)
      }
    };

  } catch (error) {
    console.error(`${colors.red}❌ Error creating Next.js project:${colors.reset}`, error);
    throw error;
  }
}

// API Route Handler
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const data = {
      businessName: formData.get('businessName') as string,
      businessType: formData.get('businessType') as string,
      industry: formData.get('industry') as string,
      businessSize: formData.get('businessSize') as string,
      description: formData.get('description') as string,
      primaryColor: formData.get('primaryColor') as string,
      secondaryColor: formData.get('secondaryColor') as string,
      typographyStyle: formData.get('typographyStyle') as string,
      animationPreference: formData.get('animationPreference') as string,
      language: formData.get('language') as string || 'he',
      headline: formData.get('headline') as string,
      descriptionText: formData.get('descriptionText') as string,
      ctaText: formData.get('ctaText') as string,
      formFields: (formData.get('formFields') as string)?.split(',').map(field => field.trim()) || ['name', 'email', 'phone'],
      includeTestimonials: formData.get('includeTestimonials') === 'true',
      includeFAQ: formData.get('includeFAQ') === 'true',
      hasProducts: formData.get('hasProducts') === 'true',
      hasServices: formData.get('hasServices') === 'true',
      hasPortfolio: formData.get('hasPortfolio') === 'true',
      needsBookingSystem: formData.get('needsBookingSystem') === 'true',
      metaKeywords: formData.get('metaKeywords') as string,
      metaDescription: formData.get('metaDescription') as string
    } as FormData;

    const projectDir = path.join(process.cwd(), 'tmp', convertToValidDirectoryName(data.businessName));
    await mkdir(projectDir, { recursive: true });
    
    const result = await createNextProject(projectDir, data);
    return NextResponse.json({
      ...result,
      projectName: path.basename(projectDir)
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate landing page' }, { status: 500 });
  }
} 