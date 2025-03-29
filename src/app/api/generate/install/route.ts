import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs/promises';
import { logger } from '../../../generate/shared/logger';

const execAsync = promisify(exec);

let activePorts: Record<string, { port: number, pid: number }> = {};

export async function POST(req: NextRequest) {
  try {
    const { projectDir } = await req.json();
    
    if (!projectDir) {
      logger.error('שם פרויקט לא סופק');
      return NextResponse.json({ error: 'שם פרויקט לא סופק' }, { status: 400 });
    }
    
    const baseDir = path.join(process.cwd(), 'landing-pages');
    const projectPath = path.join(baseDir, projectDir);
    
    // בדוק אם יש פרויקט שכבר רץ על הפורט
    if (activePorts[projectDir]) {
      logger.info(`הפרויקט ${projectDir} כבר רץ על פורט ${activePorts[projectDir].port}`);
      return NextResponse.json({ 
        success: true, 
        port: activePorts[projectDir].port,
        url: `http://localhost:${activePorts[projectDir].port}`,
        message: 'הפרויקט כבר רץ'
      });
    }
    
    // בדוק שהתיקייה קיימת
    try {
      await fs.access(projectPath);
    } catch (err) {
      logger.error(`פרויקט לא נמצא: ${projectPath}`, err);
      return NextResponse.json({ error: 'פרויקט לא נמצא' }, { status: 404 });
    }
    
    // בדוק אם node_modules קיים, אם לא - התקן חבילות
    try {
      await fs.access(path.join(projectPath, 'node_modules'));
      logger.info(`node_modules כבר קיים עבור ${projectDir}`);
    } catch (err) {
      // התקן חבילות
      logger.info(`התקנת חבילות npm עבור ${projectDir}`);
      try {
        await execAsync('npm install', { cwd: projectPath });
      } catch (installError) {
        logger.error(`שגיאה בהתקנת חבילות npm עבור ${projectDir}`, installError);
        return NextResponse.json({ 
          error: 'שגיאה בהתקנת חבילות npm', 
          details: installError instanceof Error ? installError.message : 'שגיאה לא ידועה' 
        }, { status: 500 });
      }
    }
    
    // מצא פורט פנוי
    const port = 3000 + Math.floor(Math.random() * 2000);
    logger.info(`הרצת הפרויקט בפורט ${port}`);
    
    // הרץ את הפרויקט ברקע
    const npmProcess = exec(`npm run dev -- -p ${port}`, { cwd: projectPath });
    
    // שמור את ה-PID לשימוש מאוחר יותר (לסגירת התהליך)
    const pid = npmProcess.pid || 0;
    
    // שמור מידע על התהליך הרץ
    activePorts[projectDir] = { port, pid };
    
    // שמור את הפורט ו-PID בקובץ JSON
    const portsPath = path.join(process.cwd(), 'landing-pages', 'ports.json');
    let portsData: Record<string, { port: number, pid: number }> = {};
    
    try {
      const portsContent = await fs.readFile(portsPath, 'utf-8');
      portsData = JSON.parse(portsContent);
    } catch (err) {
      // אם הקובץ לא קיים - יצור חדש
      logger.info('יצירת קובץ ports.json חדש');
    }
    
    portsData[projectDir] = { port, pid };
    await fs.writeFile(portsPath, JSON.stringify(portsData, null, 2));
    
    // להמתין מעט כדי לאפשר לשרת להתחיל
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    return NextResponse.json({ 
      success: true, 
      port,
      url: `http://localhost:${port}`,
      message: 'הפרויקט הותקן והורץ בהצלחה'
    });
    
  } catch (error) {
    logger.error('שגיאה בהתקנה או הרצת הפרויקט', error);
    return NextResponse.json({ 
      error: 'שגיאה בהתקנה או הרצת הפרויקט',
      details: error instanceof Error ? error.message : 'שגיאה לא ידועה'
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectDir = url.searchParams.get('project');
    
    if (!projectDir) {
      logger.error('שם פרויקט לא סופק');
      return NextResponse.json({ error: 'שם פרויקט לא סופק' }, { status: 400 });
    }
    
    // בדוק אם הפרויקט רץ כרגע
    if (activePorts[projectDir]) {
      return NextResponse.json({
        running: true,
        port: activePorts[projectDir].port,
        url: `http://localhost:${activePorts[projectDir].port}`
      });
    }
    
    // בדוק גם בקובץ
    const portsPath = path.join(process.cwd(), 'landing-pages', 'ports.json');
    
    try {
      const portsContent = await fs.readFile(portsPath, 'utf-8');
      const portsData = JSON.parse(portsContent);
      
      if (portsData[projectDir]) {
        const { port, pid } = portsData[projectDir];
        
        // שמור במצב הזיכרון
        activePorts[projectDir] = { port, pid };
        
        return NextResponse.json({
          running: true,
          port,
          url: `http://localhost:${port}`
        });
      }
    } catch (err) {
      // אם הקובץ לא קיים
    }
    
    return NextResponse.json({ running: false });
    
  } catch (error) {
    logger.error('שגיאה בבדיקת סטטוס הרצה', error);
    return NextResponse.json({ error: 'שגיאה בבדיקת סטטוס הרצה' }, { status: 500 });
  }
} 