import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../../generate/shared/logger';
import { ComponentStatus, getGenerationStatus } from './status-manager';

/**
 * GET handler for status requests
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectDir = url.searchParams.get('project');
    
    if (!projectDir) {
      logger.error('שם פרויקט לא סופק');
      return NextResponse.json({ error: 'שם פרויקט לא סופק' }, { status: 400 });
    }
    
    const baseDir = path.join(process.cwd(), 'landing-pages');
    const projectPath = path.join(baseDir, projectDir);
    
    // בדוק שהתיקייה קיימת
    try {
      await fs.access(projectPath);
    } catch (err) {
      logger.error(`פרויקט לא נמצא: ${projectPath}`, err);
      return NextResponse.json({ error: 'פרויקט לא נמצא' }, { status: 404 });
    }
    
    // Get component status information
    const components = await getComponentsStatus(projectPath);
    const pageStatus = await getPageStatus(projectPath);
    
    return NextResponse.json({
      components,
      pageStatus
    });
  } catch (error) {
    logger.error('שגיאה בקבלת סטטוס הפרויקט', error);
    return NextResponse.json({ error: 'שגיאה בקבלת סטטוס הפרויקט' }, { status: 500 });
  }
}

async function getComponentsStatus(projectPath: string) {
  const componentsDir = path.join(projectPath, 'src', 'components');
  const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
  let pageContent = '';
  let importedComponents: Array<{ name: string; path: string }> = [];
  
  try {
    // קרא את תוכן הדף
    pageContent = await fs.readFile(pagePath, 'utf-8');
    
    // מצא את כל הייבואים של הקומפוננטות
    const importRegex = /import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(pageContent)) !== null) {
      const componentNames = match[1].split(',').map(name => name.trim());
      const importPath = match[2];
      
      componentNames.forEach(name => {
        importedComponents.push({ name, path: importPath });
      });
    }
  } catch (error) {
    logger.error('שגיאה בקריאת קובץ הדף', error);
  }
  
  // בדוק את כל הקומפוננטות המיובאות
  const components: ComponentStatus[] = [];
  
  for (const { name, path: importPath } of importedComponents) {
    try {
      const componentPath = path.join(projectPath, 'src', importPath);
      await fs.access(componentPath);
      components.push({
        name,
        type: 'component',
        status: 'completed'
      });
    } catch (error) {
      components.push({
        name,
        type: 'component',
        status: 'failed',
        error: 'קומפוננטה לא נמצאה'
      });
    }
  }
  
  return components;
}

async function getPageStatus(projectPath: string) {
  const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
  
  try {
    await fs.access(pagePath);
    return {
      status: 'completed',
      error: null
    };
  } catch (error) {
    return {
      status: 'failed',
      error: 'קובץ הדף לא נמצא'
    };
  }
}

async function listComponentFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subdirFiles = await listComponentFiles(fullPath);
        files.push(...subdirFiles);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  } catch (err) {
    // Directory might not exist yet
    return [];
  }
}

function getComponentType(filePath: string): string {
  // Determine component type based on file name
  const fileName = path.basename(filePath, path.extname(filePath)).toLowerCase();
  
  if (fileName.includes('hero')) return 'hero';
  if (fileName.includes('feature')) return 'features';
  if (fileName.includes('service')) return 'services';
  if (fileName.includes('testimonial')) return 'testimonials';
  if (fileName.includes('pricing')) return 'pricing';
  if (fileName.includes('contact') || fileName.includes('form')) return 'contact';
  if (fileName.includes('footer')) return 'footer';
  if (fileName.includes('header') || fileName.includes('nav')) return 'header';
  if (fileName.includes('about')) return 'about';
  if (fileName.includes('cta')) return 'cta';
  if (fileName.includes('faq')) return 'faq';
  
  // Default type if no specific pattern matches
  return 'component';
} 