import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../../generate/shared/logger';

/**
 * API לעדכון קומפוננטות כדי להוסיף data-component attribute
 * לשימוש עבור זיהוי הקומפוננטות ב-DOM
 */
export async function POST(req: NextRequest) {
  try {
    const { projectDir } = await req.json();
    
    if (!projectDir) {
      return NextResponse.json({ error: 'שם פרויקט לא סופק' }, { status: 400 });
    }
    
    const baseDir = path.join(process.cwd(), 'landing-pages');
    const projectPath = path.join(baseDir, projectDir);
    const componentsDir = path.join(projectPath, 'src', 'components');
    
    // בדוק שהתיקייה קיימת
    try {
      await fs.access(componentsDir);
    } catch (err) {
      logger.error(`תיקיית components לא נמצאה: ${componentsDir}`, err);
      return NextResponse.json({ error: 'תיקיית components לא נמצאה' }, { status: 404 });
    }
    
    // מצא את כל הקבצים בתיקיית components
    const componentFiles = await listComponentFiles(componentsDir);
    
    // עדכן כל קומפוננטה
    const results = await Promise.all(
      componentFiles.map(file => updateComponentForTracking(file))
    );
    
    return NextResponse.json({
      success: true,
      modifiedFiles: results.filter(Boolean).length,
      totalFiles: componentFiles.length
    });
    
  } catch (error) {
    logger.error('שגיאה בעדכון קומפוננטות', error);
    return NextResponse.json({ 
      error: 'שגיאה בעדכון קומפוננטות',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
}

/**
 * מוצא את כל קבצי הקומפוננטות בתיקייה נתונה
 */
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
    logger.error(`שגיאה במציאת קבצי קומפוננטות`, err);
    return [];
  }
}

/**
 * מעדכן קומפוננטה כדי להוסיף data-component attribute
 * כדי שנוכל לזהות אותה ב-DOM ולגלול אליה
 */
async function updateComponentForTracking(filePath: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const componentName = path.basename(filePath, path.extname(filePath));
    
    // בדוק אם הקומפוננטה כבר מכילה data-component
    if (content.includes('data-component')) {
      logger.info(`הקומפוננטה ${componentName} כבר מכילה data-component`);
      return false;
    }
    
    // מצא את האלמנט החיצוני ביותר
    const returnRegex = /return\s*\(\s*<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)>/;
    const returnMatch = content.match(returnRegex);
    
    if (!returnMatch) {
      logger.warn(`לא נמצא אלמנט חיצוני בקומפוננטה ${componentName}`);
      return false;
    }
    
    // חלץ את סוג האלמנט והתכונות שלו
    const [fullMatch, elementType, attributes] = returnMatch;
    
    // בדוק אם יש כבר className
    if (attributes.includes('className')) {
      // הוסף data-component לתוך האלמנט הקיים
      const updatedContent = content.replace(
        returnRegex, 
        `return (<${elementType}${attributes} data-component="${componentName}">`
      );
      
      await fs.writeFile(filePath, updatedContent, 'utf-8');
    } else {
      // הוסף className חדש ו-data-component
      const updatedContent = content.replace(
        returnRegex, 
        `return (<${elementType}${attributes} className="${componentName}" data-component="${componentName}">`
      );
      
      await fs.writeFile(filePath, updatedContent, 'utf-8');
    }
    
    logger.info(`עודכנה קומפוננטה ${componentName} עם data-component`);
    return true;
    
  } catch (error) {
    logger.error(`שגיאה בעדכון קומפוננטה ${path.basename(filePath)}`, error);
    return false;
  }
} 