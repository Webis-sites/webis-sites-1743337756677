import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    console.log(`${colors.cyan}🚀 [Versions] Loading version ${params.id}${colors.green} 🌟${colors.reset}`);
    
    const versionPath = path.join(process.cwd(), 'tmp', 'versions', params.id);
    if (!existsSync(versionPath)) {
      console.error(`${colors.red}❌ [Versions] Version ${params.id} not found 🔴${colors.reset}`);
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    const dataPath = path.join(versionPath, 'data.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    const parsedData = JSON.parse(data);
    
    const componentsPath = path.join(versionPath, 'components');
    const components = await fs.readdir(componentsPath);
    
    console.log(`${colors.cyan}🚀 [Versions] Version ${params.id} loaded successfully${colors.green} 🌟${colors.reset}`);
    
    return NextResponse.json({
      ...parsedData,
      components
    });
    
  } catch (error) {
    console.error(`${colors.red}❌ [Versions] Error loading version: ${error} 🔴${colors.reset}`);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 