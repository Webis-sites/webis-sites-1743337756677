import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../../generate/shared/logger';

// Interface for component status
interface ComponentStatus {
  name: string;
  type: string;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
  prompt?: string;
  description?: string;
}

// Interface for project status
interface ProjectStatus {
  projectDir: string;
  status: {
    totalComponents: number;
    completedComponents: number;
    failedComponents: number;
    progress: number;
  };
  components: ComponentStatus[];
}

// Map to store statuses for active generation processes
const activeGenerations = new Map<string, ProjectStatus>();

/**
 * Updates the status of a project generation
 */
function updateGenerationStatus(
  projectDir: string, 
  status: {
    totalComponents: number;
    completedComponents: number;
    failedComponents: number;
    progress: number;
  },
  components: ComponentStatus[]
): void {
  activeGenerations.set(projectDir, {
    projectDir,
    status,
    components
  });

  // We might want to clean up old statuses after some time
  setTimeout(() => {
    if (activeGenerations.has(projectDir)) {
      activeGenerations.delete(projectDir);
    }
  }, 1000 * 60 * 30); // 30 minutes
}

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
    // Read page content to check for imported components
    pageContent = await fs.readFile(pagePath, 'utf-8');
    
    // Extract imported components from page content
    const importRegex = /import\s+(\w+)\s+from\s+['"]\.\.\/components\/([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(pageContent)) !== null) {
      importedComponents.push({
        name: match[1],
        path: match[2]
      });
    }
  } catch (err) {
    // Page might not exist yet
    logger.warn(`Page file not found: ${pagePath}`);
  }
  
  try {
    // Get all component files
    const componentFiles = await listComponentFiles(componentsDir);
    
    // Create component status objects
    return componentFiles.map(file => {
      const name = path.basename(file, path.extname(file));
      const relativePath = path.relative(componentsDir, file).replace(path.extname(file), '');
      const isImported = importedComponents.some(comp => 
        comp.path.includes(relativePath) || comp.name === name
      );
      
      return {
        name,
        type: getComponentType(file),
        path: relativePath,
        status: isImported ? 'completed' : 'pending',
        description: `${name} component for the landing page`
      };
    });
  } catch (err) {
    logger.error('Error getting component status', err);
    return [];
  }
}

async function getPageStatus(projectPath: string) {
  const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
  
  try {
    const pageStats = await fs.stat(pagePath);
    return {
      exists: true,
      lastModified: pageStats.mtime
    };
  } catch (err) {
    return {
      exists: false
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