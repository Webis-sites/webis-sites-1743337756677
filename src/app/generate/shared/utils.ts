import fs from 'fs/promises';
import path from 'path';

/**
 * Ensures that a directory exists, creating it recursively if it doesn't
 * @param dirPath Path to the directory
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    // If the path is for a file, get the directory part
    const directoryPath = path.extname(dirPath) ? path.dirname(dirPath) : dirPath;
    
    await fs.mkdir(directoryPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error}`);
  }
}

/**
 * Converts a business name to a valid directory name
 * @param name The business name to convert
 * @returns A valid directory name
 */
export function convertToValidDirectoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/[^\w-]/g, '')     // Remove non-word characters except hyphens
    .replace(/--+/g, '-')       // Replace multiple hyphens with a single hyphen
    .replace(/^-|-$/g, '');     // Remove leading and trailing hyphens
} 