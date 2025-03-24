import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Add color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

// Function to check if port is in use
async function isPortInUse(port: number): Promise<boolean> {
  try {
    await execAsync(`lsof -i:${port}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to kill process on port
async function killProcessOnPort(port: number): Promise<void> {
  try {
    await execAsync(`lsof -ti:${port} | xargs kill -9`);
    // Wait a bit to ensure the process is killed
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    // Ignore if no process was found
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    console.log(`${colors.cyan}🚀 [Preview] Starting to load preview for ${params.projectName}${colors.green} 🌟${colors.reset}`);

    const projectPath = path.join(process.cwd(), 'tmp', params.projectName);
    if (!fs.existsSync(projectPath)) {
      console.error(`${colors.red}❌ [Preview] Project directory not found: ${projectPath} 🔴${colors.reset}`);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log(`${colors.cyan}🚀 [Preview] Loading project data from ${projectPath}${colors.green} 🌟${colors.reset}`);
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.error(`${colors.red}❌ [Preview] package.json not found in project directory 🔴${colors.reset}`);
      return NextResponse.json({ error: 'Project configuration not found' }, { status: 404 });
    }

    // Install dependencies if node_modules doesn't exist
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(`${colors.cyan}🚀 [Preview] Installing dependencies${colors.green} 🌟${colors.reset}`);
      try {
        await execAsync(`cd "${projectPath}" && npm install`);
        console.log(`${colors.cyan}🚀 [Preview] Dependencies installed successfully${colors.green} 🌟${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}❌ [Preview] Error installing dependencies: ${error} 🔴${colors.reset}`);
        return NextResponse.json({ error: 'Failed to install dependencies' }, { status: 500 });
      }
    }

    const port = 3001;
    
    // Check if port is in use and kill the process if needed
    if (await isPortInUse(port)) {
      console.log(`${colors.cyan}🚀 [Preview] Port ${port} is in use, killing existing process${colors.green} 🌟${colors.reset}`);
      await killProcessOnPort(port);
    }
    
    console.log(`${colors.cyan}🚀 [Preview] Starting development server on port ${port}${colors.green} 🌟${colors.reset}`);
    
    try {
      // Start the development server
      const command = `cd "${projectPath}" && npm run dev -- -p ${port}`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`${colors.red}❌ [Preview] Error starting development server: ${error} 🔴${colors.reset}`);
          return;
        }
        if (stdout) {
          console.log(`${colors.cyan}🚀 [Preview] Development server output: ${stdout}${colors.green} 🌟${colors.reset}`);
        }
        if (stderr) {
          console.error(`${colors.red}❌ [Preview] Development server errors: ${stderr} 🔴${colors.reset}`);
        }
      });

      // Wait a bit longer to make sure the server has started
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Double check if the server is actually running
      if (await isPortInUse(port)) {
        console.log(`${colors.cyan}🚀 [Preview] Preview started successfully${colors.green} 🌟${colors.reset}`);
        return NextResponse.json({
          status: 'started',
          url: `http://localhost:${port}`
        });
      } else {
        console.error(`${colors.red}❌ [Preview] Server failed to start on port ${port} 🔴${colors.reset}`);
        return NextResponse.json({ error: 'Failed to start preview server' }, { status: 500 });
      }

    } catch (error) {
      console.error(`${colors.red}❌ [Preview] Error starting development server: ${error} 🔴${colors.reset}`);
      return NextResponse.json({ error: 'Failed to start preview server' }, { status: 500 });
    }

  } catch (error) {
    console.error(`${colors.red}❌ [Preview] Error: ${error} 🔴${colors.reset}`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectName: string } }
) {
  try {
    console.log(`${colors.cyan}🚀 [Preview] Stopping preview for ${params.projectName}${colors.green} 🌟${colors.reset}`);
    
    const port = 3001;
    await killProcessOnPort(port);
    console.log(`${colors.cyan}🚀 [Preview] Preview server stopped${colors.green} 🌟${colors.reset}`);

    return NextResponse.json({ status: 'stopped' });
  } catch (error) {
    console.error(`${colors.red}❌ [Preview] Error stopping preview: ${error} 🔴${colors.reset}`);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 