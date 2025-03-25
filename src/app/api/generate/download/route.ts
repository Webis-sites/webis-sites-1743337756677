import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import archiver from 'archiver';
import { logger } from '../../../generate/shared/logger';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const projectDir = url.searchParams.get('project');
    
    if (!projectDir) {
      return NextResponse.json({ error: 'Missing project parameter' }, { status: 400 });
    }
    
    // Use project directory in the project's tmp folder instead of os.tmpdir()
    const baseDir = path.join(process.cwd(), 'tmp');
    const projectPath = path.join(baseDir, projectDir);
    
    // Check if project exists
    try {
      await fs.promises.access(projectPath);
    } catch (error) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    // Create a zip file in memory
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Create a writable stream for the response
    const chunks: Uint8Array[] = [];
    
    // Listen for data events to capture chunks
    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    // Create a promise to wait for archive finalization
    const archiveDone = new Promise<Uint8Array>(resolve => {
      archive.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(new Uint8Array(buffer));
      });
    });
    
    // Add the entire project directory to the archive
    archive.directory(projectPath, projectDir);
    
    // Finalize the archive
    archive.finalize();
    
    // Wait for the archive to be created
    const zipBuffer = await archiveDone;
    
    logger.info(`Created zip archive for project: ${projectDir}`);
    
    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${projectDir}.zip"`
      }
    });
  } catch (error) {
    console.error('Error in download API route:', error);
    return NextResponse.json(
      { error: 'Failed to download project', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 