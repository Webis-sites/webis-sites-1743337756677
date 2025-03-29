import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { logger, ensureDirectoryExists } from '../../../generate/shared';

export async function GET(request: Request, { params }: { params: { projectDir: string } }) {
  try {
    // בדוק אם שלחו projectDir כפרמטר ב-URL
    const url = new URL(request.url);
    let projectDir = params.projectDir;
    
    // אם לא הגיע בפרמטר route, נסה לקחת מפרמטר query
    if (!projectDir) {
      projectDir = url.searchParams.get('project') || '';
    }
    
    if (!projectDir) {
      logger.error('Project directory not provided');
      return NextResponse.json({ error: 'Project directory not provided' }, { status: 400 });
    }

    // יצירת תיקיית landing-pages
    const landingPagesDir = path.join(process.cwd(), 'landing-pages');
    await ensureDirectoryExists(landingPagesDir);
    logger.info(`Created landing-pages directory: ${landingPagesDir}`);

    const projectPath = path.join(landingPagesDir, projectDir);
    
    // בדיקת תיקיית הפרויקט
    try {
      logger.info(`Checking project directory: ${projectPath}`);
      await fs.access(projectPath);
      logger.info('Project directory exists');
    } catch (error) {
      logger.error(`Project directory not found: ${projectPath}`);
      return NextResponse.json({ error: `Project directory not found: ${projectPath}` }, { status: 404 });
    }
    
    const filePath = url.searchParams.get('path');
    
    // If a specific file is requested, return that file
    if (filePath) {
      try {
        const fullPath = path.join(projectPath, filePath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const contentType = getContentType(filePath);
        
        return new NextResponse(content, {
          headers: {
            'Content-Type': contentType
          }
        });
      } catch (error) {
        logger.error(`Error reading file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }
    
    // בדוק אם יש קובץ סטטוס מהפריסה
    let deploymentError = null;
    try {
      const statusFilePath = path.join(projectPath, 'deployment-status.json');
      const statusContent = await fs.readFile(statusFilePath, 'utf-8');
      const statusData = JSON.parse(statusContent);
      if (statusData.error) {
        deploymentError = statusData.error;
      }
    } catch (err) {
      // קובץ לא קיים, אפשר להתעלם
    }
    
    // Return the project structure along with status information
    const structure = await getProjectStructure(projectPath);
    const status = await getProjectStatus(projectPath);
    
    return NextResponse.json({
      projectDir,
      structure,
      status,
      deploymentError
    });
  } catch (error) {
    logger.error(`Error in preview API route: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}

/**
 * Gets project status information
 */
async function getProjectStatus(projectPath: string): Promise<any> {
  try {
    // Check for the existence of src/app/page.tsx
    const pagePath = path.join(projectPath, 'src', 'app', 'page.tsx');
    const componentsDir = path.join(projectPath, 'src', 'components');
    let pageExists = false;
    let pageContent = '';
    let componentCount = 0;
    let importedComponents: string[] = [];
    
    try {
      pageContent = await fs.readFile(pagePath, 'utf-8');
      pageExists = true;
      
      // Extract imported components from page content
      const importRegex = /import\s+(\w+)\s+from\s+['"]\.\.\/components\/([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(pageContent)) !== null) {
        importedComponents.push(match[1]);
      }
    } catch (err) {
      pageExists = false;
    }
    
    // Count components
    try {
      const componentFiles = await fs.readdir(componentsDir, { recursive: true });
      componentCount = componentFiles.filter(file => 
        file.endsWith('.tsx') || file.endsWith('.jsx')
      ).length;
    } catch (err) {
      // Components directory might not exist yet
    }
    
    return {
      completedComponents: componentCount,
      totalComponents: componentCount, // Update this if you have a target count
      importedComponents,
      pageReady: pageExists,
      progress: componentCount > 0 ? Math.floor((importedComponents.length / componentCount) * 100) : 0
    };
  } catch (error) {
    logger.error(`Error getting project status: ${error instanceof Error ? error.message : String(error)}`);
    return {
      completedComponents: 0,
      totalComponents: 0,
      importedComponents: [],
      pageReady: false,
      progress: 0
    };
  }
}

/**
 * Gets content type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  
  const contentTypeMap: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.tsx': 'text/plain',
    '.jsx': 'text/plain',
    '.ts': 'text/plain'
  };
  
  return contentTypeMap[ext] || 'application/octet-stream';
}

/**
 * Get project directory structure
 */
async function getProjectStructure(dirPath: string): Promise<any> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    const structure: Record<string, any> = {};
    
    for (const entry of entries) {
      // Skip node_modules and .next directories
      if (entry.name === 'node_modules' || entry.name === '.next') {
        continue;
      }
      
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        structure[entry.name] = await getProjectStructure(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        structure[entry.name] = {
          size: stats.size,
          modified: stats.mtime
        };
      }
    }
    
    return structure;
  } catch (error) {
    logger.error(`Error reading directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
} 