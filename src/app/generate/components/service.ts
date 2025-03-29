import { generateObject } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { Component, componentSchema, GeneratedComponent, Dependency } from './types';
import { FormData, logger, ensureDirectoryExists, AI_MODELS } from '../shared';
import { createComponentPromptWithJSON } from './prompts';
import { getFileExtension, getTargetDirectory, ensureUseClientDirective } from './utils';
import fs from 'fs/promises';
import path from 'path';

/**
 * Generates a component based on the form data and name
 * @param name Component name
 * @param projectDir Project path
 * @param formData Form data
 * @param componentPrompt Prompt for component generation
 * @returns Generated component result
 */
export async function generateComponent(
  name: string, 
  projectDir: string, 
  formData: FormData, 
  componentPrompt: string
): Promise<GeneratedComponent> {
  logger.startProcess(`Component Generation: ${name}`);
  
  try {
    const fileName: string = name
      .replace('app/', '')
      .replace('components/', '');
    
    const extension: string = getFileExtension(fileName);
    const targetDir: string = getTargetDirectory(fileName, projectDir);
    const filePath: string = path.join(targetDir, fileName + extension);
    
    // Check if filePath is a directory
    const stat = await fs.stat(filePath).catch(() => null);
    if (stat && stat.isDirectory()) {
      // If it's a directory, add an index file
      const indexPath = path.join(filePath, `index${extension}`);
      logger.warn(`${filePath} is a directory, writing to ${indexPath} instead`);
      
      await ensureDirectoryExists(path.dirname(indexPath));
      
      const result: Component = await getComponentCodeAndDependencies(fileName, componentPrompt, formData);
      
      // Ensure the code has 'use client' directive if needed
      const enhancedCode: string = ensureUseClientDirective(result.code);
      
      await fs.writeFile(indexPath, enhancedCode, 'utf-8');
      logger.fileCreated(indexPath);
      
      // Safely handle dependencies
      const dependencies: Dependency[] = (result.dependencies || []).filter((dep): dep is Dependency => 
        typeof dep.name === 'string' && 
        typeof dep.version === 'string' && 
        dep.name.length > 0 && 
        dep.version.length > 0
      );
      
      if (dependencies.length > 0) {
        const packageJsonPath: string = path.join(projectDir, 'package.json');
        const packageJsonContent: string = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson: { dependencies: Record<string, string> } = JSON.parse(packageJsonContent);

        dependencies.forEach(dep => {
          if (!packageJson.dependencies[dep.name]) {
            packageJson.dependencies[dep.name] = dep.version;
            logger.info(`📦 Added dependency: ${dep.name}@${dep.version}`);
          }
        });

        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      }
      
      logger.summary(`Component Generation Results:
Component Name: ${fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || fileName}
File Path: ${fileName + extension}
Dependencies Added: ${dependencies.length}
File Size: ${enhancedCode.length}`);
      
      logger.endProcess(`Component Generation: ${name}`);
      
      // Update page.tsx with the new component
      await updatePageWithComponent(projectDir, fileName, name);
      
      // Build and return the generated component result
      const generatedComponent: GeneratedComponent = {
        name: fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || fileName,
        code: enhancedCode,
        dependencies: dependencies,
        path: `${fileName}/index${extension}`
      };
      
      return generatedComponent;
    }
    
    // Normal file creation flow
    await ensureDirectoryExists(path.dirname(filePath));
    
    const result: Component = await getComponentCodeAndDependencies(fileName, componentPrompt, formData);
    
    // Ensure the code has 'use client' directive if needed
    const enhancedCode: string = ensureUseClientDirective(result.code);
    
    await fs.writeFile(filePath, enhancedCode, 'utf-8');
    logger.fileCreated(filePath);
    
    // Safely handle dependencies
    const dependencies: Dependency[] = (result.dependencies || []).filter((dep): dep is Dependency => 
      typeof dep.name === 'string' && 
      typeof dep.version === 'string' && 
      dep.name.length > 0 && 
      dep.version.length > 0
    );
    
    if (dependencies.length > 0) {
      const packageJsonPath: string = path.join(projectDir, 'package.json');
      const packageJsonContent: string = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson: { dependencies: Record<string, string> } = JSON.parse(packageJsonContent);

      dependencies.forEach(dep => {
        if (!packageJson.dependencies[dep.name]) {
          packageJson.dependencies[dep.name] = dep.version;
          logger.info(`📦 Added dependency: ${dep.name}@${dep.version}`);
        }
      });

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    logger.summary(`Component Generation Results:
Component Name: ${fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || fileName}
File Path: ${fileName + extension}
Dependencies Added: ${dependencies.length}
File Size: ${enhancedCode.length}`);
    
    logger.endProcess(`Component Generation: ${name}`);
    
    // Update page.tsx with the new component
    await updatePageWithComponent(projectDir, fileName, name);
    
    // Build and return the generated component result
    const generatedComponent: GeneratedComponent = {
      name: fileName.split('/').pop()?.replace(/\.[^/.]+$/, '') || fileName,
      code: enhancedCode,
      dependencies: dependencies,
      path: fileName + extension
    };
    
    return generatedComponent;
  } catch (error: unknown) {
    logger.error(`Error generating component ${name}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Gets component code and dependencies using AI
 * @param name Component name
 * @param componentPrompt AI model prompt
 * @param formData Form data
 * @returns Component code and dependencies
 */
async function getComponentCodeAndDependencies(
  name: string, 
  componentPrompt: string, 
  formData: FormData
): Promise<Component> {
  logger.aiCall('Claude 3.7 Sonnet');
  
  try {
    // Add retry logic
    let maxRetries = 3;
    let attempt = 0;
    let error: any = null;
    
    while (attempt < maxRetries) {
      try {
        attempt++;
        logger.info(`AI generation attempt ${attempt} for component ${name}`);
        
        const prompt: string = createComponentPromptWithJSON(name, componentPrompt, formData);
        
        const response = await generateObject({
          model: anthropic(AI_MODELS.CLAUDE_3_7_SONNET),
          schema: componentSchema,
          maxTokens: 4000,
          temperature: 0.5,
          prompt
        });
        
        const { object, usage } = response;
        
        // Log token usage for this request
        if (usage) {
          logger.updateTokenInfo(usage.promptTokens || 0, usage.completionTokens || 0);
          logger.aiResponse('Claude 3.7 Sonnet', object.code.length);
        } else {
          logger.aiResponse('Claude 3.7 Sonnet', object.code.length);
        }
        
        // Validate response has required fields
        if (!object || !object.code || typeof object.code !== 'string' || object.code.trim() === '') {
          throw new Error(`AI response missing required 'code' field for component ${name}`);
        }
        
        // Validate dependencies
        const dependencies: Dependency[] = (object.dependencies || []).filter((dep: unknown): dep is Dependency => 
          typeof dep === 'object' &&
          dep !== null &&
          'name' in dep &&
          'version' in dep &&
          typeof dep.name === 'string' && 
          typeof dep.version === 'string' && 
          dep.name.length > 0 && 
          dep.version.length > 0
        );
        
        return {
          code: object.code,
          dependencies
        };
      } catch (attemptError) {
        error = attemptError;
        logger.warn(`Attempt ${attempt} failed for component ${name}: ${attemptError instanceof Error ? attemptError.message : 'Unknown error'}`);
        
        // Sleep for a moment before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // On last attempt, fall back to a simple template if everything fails
        if (attempt === maxRetries) {
          logger.warn(`All ${maxRetries} attempts failed for component ${name}, using fallback template`);
          
          // Create a minimal fallback component
          const fallbackCode = createFallbackComponent(name, formData);
          
          return {
            code: fallbackCode,
            dependencies: [] as Dependency[]
          };
        }
      }
    }
    
    // Should never reach here due to fallback, but TypeScript needs this
    throw error || new Error(`Failed to generate component ${name} after ${maxRetries} attempts`);
  } catch (error: unknown) {
    logger.error(`Error in AI component generation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

/**
 * Creates a fallback component when AI generation fails
 * @param name Component name
 * @param formData Form data
 * @returns Simple component code
 */
function createFallbackComponent(name: string, formData: FormData): string {
  const isHebrew = formData.language === 'he';
  const direction = isHebrew ? 'rtl' : 'ltr';
  const simpleComponentName = name.split('/').pop() || name;
  
  return `'use client';
  
import React from 'react';

/**
 * ${simpleComponentName} Component
 * (Fallback component due to generation failure)
 */
export default function ${simpleComponentName}() {
  return (
    <div className="w-full py-12 px-4 bg-white" dir="${direction}">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-center" style={{color: '${formData.primaryColor}'}}>
          ${formData.headline || (isHebrew ? 'כותרת הקומפוננט' : 'Component Heading')}
        </h2>
        <p className="text-lg mb-8 text-center">
          ${formData.descriptionText || (isHebrew ? 'תיאור קצר של הקומפוננט שלא הצליח להיווצר. נסה לרענן את הדף או ליצור שוב.' : 'A short description of the component that failed to generate. Try refreshing or regenerating.')}
        </p>
        <div className="text-center">
          <button 
            className="px-6 py-3 rounded-md text-white font-medium"
            style={{backgroundColor: '${formData.secondaryColor}'}}
          >
            ${formData.ctaText || (isHebrew ? 'כפתור פעולה' : 'Action Button')}
          </button>
        </div>
      </div>
    </div>
  );
}`;
}

/**
 * Updates the main page.tsx file to import and use a newly generated component
 * @param projectDir Project directory path
 * @param componentPath Component path (relative to components directory)
 * @param componentName Component name for import statement
 */
async function updatePageWithComponent(
  projectDir: string, 
  componentPath: string,
  componentName: string
): Promise<void> {
  try {
    const pageFilePath = path.join(projectDir, 'src', 'app', 'page.tsx');
    
    // Check if page file exists
    try {
      await fs.access(pageFilePath);
    } catch (error) {
      logger.warn(`Cannot update page.tsx - file not found: ${pageFilePath}`);
      return;
    }
    
    // Read current page content
    const currentPageContent = await fs.readFile(pageFilePath, 'utf-8');
    
    // Generate import statement for the component
    const componentImportPath = `../components/${componentPath}`;
    const importStatement = `import ${componentName} from '${componentImportPath}';`;
    
    // Check if component is already imported
    if (currentPageContent.includes(importStatement)) {
      logger.info(`Component ${componentName} is already imported in page.tsx`);
      return;
    }
    
    // Find position to insert import statement (after existing imports)
    const importRegex = /import\s+.*\s+from\s+['"'].*['"'];/g;
    let lastImportMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;
    
    while ((match = importRegex.exec(currentPageContent)) !== null) {
      lastImportMatch = match;
    }
    
    let newPageContent: string;
    
    if (lastImportMatch) {
      // Insert after the last import
      const insertPosition = lastImportMatch.index + lastImportMatch[0].length;
      newPageContent = 
        currentPageContent.substring(0, insertPosition) + 
        '\n' + importStatement + 
        currentPageContent.substring(insertPosition);
    } else {
      // No imports found, add at the beginning
      newPageContent = importStatement + '\n' + currentPageContent;
    }
    
    // Add component usage if not already present
    const componentUsage = `<${componentName} />`;
    
    if (!newPageContent.includes(componentUsage)) {
      // Check if there's a main element or div to add the component into
      const mainCloseTagMatch = newPageContent.match(/<\/main>/);
      
      if (mainCloseTagMatch) {
        const insertPosition = mainCloseTagMatch.index!;
        newPageContent = 
          newPageContent.substring(0, insertPosition) + 
          `\n      ${componentUsage}\n    ` + 
          newPageContent.substring(insertPosition);
      } else {
        // If no main closing tag, look for div with className containing max-w
        const divCloseTagMatch = newPageContent.match(/<\/div>(?=[\s\S]*<\/main>)/);
        
        if (divCloseTagMatch) {
          const insertPosition = divCloseTagMatch.index!;
          newPageContent = 
            newPageContent.substring(0, insertPosition) + 
            `\n        ${componentUsage}\n      ` + 
            newPageContent.substring(insertPosition);
        }
      }
    }
    
    // Write updated content back to the file
    await fs.writeFile(pageFilePath, newPageContent, 'utf-8');
    logger.info(`Updated page.tsx with component ${componentName}`);
    
  } catch (error) {
    logger.error(`Error updating page.tsx with component ${componentName}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * מעדכן קומפוננטה שנוצרה להוספת מאפיין data-component
 * לשימוש עבור זיהוי במערכת התצוגה המקדימה
 */
async function updateComponentWithDataAttribute(
  filePath: string, 
  componentName: string
): Promise<void> {
  try {
    // קרא את תוכן הקובץ
    const content = await fs.readFile(filePath, 'utf-8');
    
    // בדוק אם הקומפוננטה כבר מכילה data-component
    if (content.includes('data-component')) {
      return;
    }
    
    // מצא את האלמנט החיצוני ביותר ב-return של הקומפוננטה
    const returnRegex = /return\s*\(\s*<([a-zA-Z][a-zA-Z0-9]*)([^>]*?)>/;
    const returnMatch = content.match(returnRegex);
    
    if (!returnMatch) {
      logger.warn(`לא נמצא אלמנט חיצוני בקומפוננטה ${componentName}`);
      return;
    }
    
    // חלץ את סוג האלמנט והתכונות שלו
    const [fullMatch, elementType, attributes] = returnMatch;
    
    let updatedContent;
    
    // בדוק אם יש כבר className
    if (attributes.includes('className')) {
      // הוסף data-component לתוך האלמנט הקיים
      updatedContent = content.replace(
        returnRegex, 
        `return (<${elementType}${attributes} data-component="${componentName}">`
      );
    } else {
      // הוסף className חדש ו-data-component
      updatedContent = content.replace(
        returnRegex, 
        `return (<${elementType}${attributes} className="${componentName}-component" data-component="${componentName}">`
      );
    }
    
    // כתוב את הקובץ המעודכן
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    logger.info(`עודכנה קומפוננטה ${componentName} עם data-component`);
    
  } catch (error) {
    logger.error(`שגיאה בעדכון מאפיין data-component לקומפוננטה ${componentName}: ${error instanceof Error ? error.message : String(error)}`);
  }
} 