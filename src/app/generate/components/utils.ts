import fs from 'fs';
import path from 'path';
import { logger, FILE_TYPES } from '../shared';

/**
 * Gets appropriate file extension based on filename
 * @param fileName The file name
 * @returns The file extension
 */
export function getFileExtension(fileName: string): string {
  if (fileName.includes('.')) {
    return '';
  }
  if (fileName.includes('css')) {
    return '.css';
  }
  if (fileName.endsWith('ts')) {
    return '.ts';
  }
  return '.tsx';
}

/**
 * Gets appropriate target directory based on filename
 * @param fileName The file name
 * @param projectDir The project directory path
 * @returns Full target path for parent directory
 */
export function getTargetDirectory(fileName: string, projectDir: string): string {
  let targetDir: string;
  
  // Extract the base name without path to check if it contains indicators
  const baseName = fileName.split('/').pop() || fileName;
  
  if (baseName.toLowerCase().includes('layout') || 
      baseName.toLowerCase().includes('page') || 
      baseName.toLowerCase().includes('loading') || 
      baseName.toLowerCase().includes('error')) {
    targetDir = path.join(projectDir, 'src', 'app');
  } else if (fileName.includes('/')) {
    // If the fileName contains a path, split at the last part
    const parts = fileName.split('/');
    parts.pop(); // Remove the actual filename part
    const dirPath = parts.join('/');
    
    // Handle different directories based on pattern
    if (fileName.startsWith('styles/')) {
      targetDir = path.join(projectDir, 'src', dirPath);
    } else if (fileName.startsWith('lib/') || fileName.startsWith('utils/')) {
      targetDir = path.join(projectDir, 'src', dirPath);
    } else if (fileName.startsWith('ui/')) {
      targetDir = path.join(projectDir, 'src', 'components', dirPath);
    } else {
      // For other paths with / in them, create the full directory structure
      targetDir = path.join(projectDir, 'src', 'components', dirPath);
    }
  } else {
    // Default to components folder for component files
    targetDir = path.join(projectDir, 'src', 'components');
  }
  
  // Debug log to help trace directory creation
  logger.info(`Target directory for ${fileName}: ${targetDir}`);
  
  return targetDir;
}

/**
 * Checks if 'use client' directive should be added to code
 * @param code Component code
 * @returns Whether to add the directive
 */
export function shouldAddUseClientDirective(code: string): boolean {
  // Indicators that a component should be a client component
  const clientIndicators = [
    'framer-motion',
    'useState',
    'useEffect',
    'useContext',
    'useReducer',
    'useRef',
    'useCallback',
    'useMemo',
    'useLayoutEffect',
    'useImperativeHandle',
    'addEventListener',
    'onClick',
    'onChange',
    'onSubmit',
    'onFocus',
    'onBlur',
    'window.',
    'document.'
  ];
  
  return clientIndicators.some(indicator => code.includes(indicator)) &&
         !code.includes("'use client'") &&
         !code.includes('"use client"');
}

/**
 * Adds 'use client' directive to code if needed
 * @param code Component code
 * @returns Updated code
 */
export function ensureUseClientDirective(code: string): string {
  if (shouldAddUseClientDirective(code)) {
    logger.info('Adding "use client" directive to client component');
    return "'use client';\n\n" + code;
  }
  return code;
}