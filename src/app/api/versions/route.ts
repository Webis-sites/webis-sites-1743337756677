import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

// Add color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

// Default versions object
const defaultVersions = {};

// Function to ensure versions directory exists
async function ensureVersionsExist() {
  try {
    const versionsDir = path.join(process.cwd(), 'tmp', 'versions');
    await fs.mkdir(versionsDir, { recursive: true });
    
    const versionsFile = path.join(versionsDir, 'index.json');
    if (!existsSync(versionsFile)) {
      console.log(`${colors.cyan}🚀 [Versions] Creating empty index.json file${colors.reset} 🔴`);
      await fs.writeFile(versionsFile, JSON.stringify(defaultVersions, null, 2));
    }

    return defaultVersions;
  } catch (error) {
    console.error(`${colors.red}❌ 🔴 🔴 🔴 [ERROR] Failed to ensure versions exist:${colors.reset}`, error, '🔴 🔴 🔴 ❌');
    return defaultVersions;
  }
}

export async function GET() {
  try {
    // First ensure versions directory exists
    const versions = await ensureVersionsExist();
    
    // Convert versions object to array of version strings
    const versionsArray = Object.keys(versions);
    
    // Return the versions data as array of strings
    return NextResponse.json(versionsArray);
  } catch (error) {
    console.error(`${colors.red}❌ 🔴 🔴 🔴 [ERROR] Failed to read versions:${colors.reset}`, error, '🔴 🔴 🔴 ❌');
    // Return empty array in case of error to maintain expected format
    return NextResponse.json([]);
  }
} 