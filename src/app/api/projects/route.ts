import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const tmpDir = path.join(process.cwd(), 'tmp');
    
    // בדיקה אם התיקייה קיימת
    if (!fs.existsSync(tmpDir)) {
      return NextResponse.json([]);
    }

    // קריאת כל התיקיות בתוך tmp
    const projects = fs.readdirSync(tmpDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => {
        const projectPath = path.join(tmpDir, dirent.name);
        const componentsPath = path.join(projectPath, 'components');
        
        // קריאת רשימת הקומפוננטות
        const components = fs.existsSync(componentsPath)
          ? fs.readdirSync(componentsPath)
              .filter(file => file.endsWith('.tsx'))
              .map(file => file.replace('.tsx', ''))
          : [];

        // קריאת מטא-דאטה של הפרויקט
        const stats = fs.statSync(projectPath);
        
        return {
          name: dirent.name,
          components,
          createdAt: stats.birthtime.toISOString()
        };
      });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error reading projects:', error);
    return NextResponse.json({ error: 'Failed to read projects' }, { status: 500 });
  }
} 