import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { name: string } }
) {
  try {
    const projectName = params.name;
    const projectPath = path.join(process.cwd(), 'tmp', projectName);
    
    // בדיקה אם התיקייה קיימת
    if (!fs.existsSync(projectPath)) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const componentsPath = path.join(projectPath, 'components');
    const formDataPath = path.join(projectPath, 'formData.json');
    
    // קריאת רשימת הקומפוננטות
    const components = fs.existsSync(componentsPath)
      ? fs.readdirSync(componentsPath)
          .filter(file => file.endsWith('.tsx'))
          .map(file => file.replace('.tsx', ''))
      : [];

    // קריאת נתוני הטופס
    let formData = {};
    if (fs.existsSync(formDataPath)) {
      formData = JSON.parse(fs.readFileSync(formDataPath, 'utf-8'));
    }

    return NextResponse.json({
      components,
      formData
    });
  } catch (error) {
    console.error('Error reading project:', error);
    return NextResponse.json({ error: 'Failed to read project' }, { status: 500 });
  }
} 