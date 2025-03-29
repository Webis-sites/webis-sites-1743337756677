import { NextRequest, NextResponse } from 'next/server';
import { generateComponent } from '@/app/generate/components/service';
import { setupProject } from '../../generate/project';
import { generateSitePlan } from '@/app/generate/plan/service';
import { 
  FormData as ProjectFormData, 
  FormDataSchema, 
  SitePlan, 
  ComponentPlan,
  logger,
  ensureDirectoryExists,
  convertToValidDirectoryName
} from '../../generate/shared';
import { colorLogger } from '../../generate/shared/logger';
import { Dependency } from '../../generate/components/types';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

// Import types from components and project modules
import type { GeneratedComponent } from '../../generate/components';
import type { ProjectSetupResult } from '../../generate/project';

import { updateGenerationStatus } from './status/status-manager';

// Type for enhanced component result
interface EnhancedComponentResult extends GeneratedComponent {
  description: string;
  type: string;
  priority: number;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

// Type for API response
interface ApiResponse {
  success: boolean;
  projectDir: string;
  projectPath: string;
  sitePlan: SitePlan;
  components: EnhancedComponentResult[];
  status: {
    totalComponents: number;
    completedComponents: number;
    failedComponents: number;
    progress: number;
  };
  tokenUsage: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    requests: number;
  };
  deployedUrl?: string;
}

// Type for error response
interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Process form data and convert to proper types
 */
function processFormData(data: Record<string, any>): Record<string, any> {
  const result = { ...data };
  
  // Convert checkbox values to booleans
  const booleanFields = [
    'includeTestimonials',
    'includeFAQ',
    'hasProducts',
    'hasServices',
    'hasPortfolio',
    'needsBookingSystem'
  ];
  
  for (const field of booleanFields) {
    // Handle 'on' values from HTML checkboxes
    if (result[field] === 'on' || result[field] === 'true') {
      result[field] = true;
    } else if (result[field] === undefined || result[field] === 'off' || result[field] === 'false') {
      result[field] = false;
    }
  }
  
  // Default language to Hebrew
  if (!result.language) {
    result.language = 'he';
  }
  
  colorLogger.info(`Processed form data: ${JSON.stringify(result).substring(0, 100)}...`);
  return result;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse | ErrorResponse>> {
  try {
    // Reset token counters at the start of the process
    logger.resetTokens();
    
    // יצירת לוג גדול ויפה להתחלת התהליך
    colorLogger.startProcess('STARTING WEBSITE GENERATION');
    colorLogger.info('Creating a new awesome website with all required components');
    
    // יצירת תיקיית landing-pages
    const landingPagesDir = path.join(process.cwd(), 'landing-pages');
    await ensureDirectoryExists(landingPagesDir);
    colorLogger.filesystem(`Created landing-pages directory: ${landingPagesDir}`);
    
    // Try to get form data directly
    let formDataObj: Record<string, any>;
    
    try {
      // Try getting form data directly
      const formData = await req.formData();
      colorLogger.info('Received form data');
      
      // Convert to plain object
      formDataObj = {};
      formData.forEach((value, key) => {
        // Convert checkbox values to booleans
        if (value === 'on' || value === 'true') {
          formDataObj[key] = true;
        } else if (value === 'off' || value === 'false') {
          formDataObj[key] = false;
        } else if (key === 'designStyles') {
          // Convert designStyles string to array
          formDataObj[key] = value ? value.toString().split(',').map(s => s.trim()) : [];
        } else {
          formDataObj[key] = value;
        }
      });
      
      colorLogger.info(`Parsed form fields: ${Object.keys(formDataObj).join(', ')}`);
    } catch (formError) {
      // If not form data, try as URL encoded or JSON
      try {
        const rawData = await req.text();
        colorLogger.info(`Received raw data (${rawData.length} bytes)`);
        
        // Check if it's URL encoded form data
        if (rawData.includes('&') && rawData.includes('=')) {
          const params = new URLSearchParams(rawData);
          formDataObj = {};
          
          params.forEach((value, key) => {
            // Convert checkbox values to booleans
            if (value === 'on' || value === 'true') {
              formDataObj[key] = true;
            } else if (value === 'off' || value === 'false') {
              formDataObj[key] = false;
            } else if (key === 'designStyles') {
              // Convert designStyles string to array
              formDataObj[key] = value ? value.toString().split(',').map(s => s.trim()) : [];
            } else {
              formDataObj[key] = value;
            }
          });
          
          colorLogger.info(`Parsed as URL encoded form data: ${Object.keys(formDataObj).join(', ')}`);
        } else {
          // Try to parse as JSON as last resort
          try {
            formDataObj = JSON.parse(rawData);
            // Convert designStyles to array if it's a string
            if (formDataObj.designStyles && typeof formDataObj.designStyles === 'string') {
              formDataObj.designStyles = formDataObj.designStyles.split(',').map(s => s.trim());
            }
            colorLogger.info(`Parsed as JSON data: ${Object.keys(formDataObj).join(', ')}`);
          } catch (jsonError) {
            return NextResponse.json<ErrorResponse>({
              error: 'Failed to parse request data',
              details: `Raw data: ${rawData.substring(0, 100)}...`
            }, { status: 400 });
          }
        }
      } catch (textError) {
        return NextResponse.json<ErrorResponse>({
          error: 'Failed to read request data',
          details: textError instanceof Error ? textError.message : 'Unknown error'
        }, { status: 400 });
      }
    }
    
    // Validate the form data against our schema
    const formDataResult = FormDataSchema.safeParse(formDataObj);
    
    if (!formDataResult.success) {
      const errorDetails = JSON.stringify(formDataResult.error.format());
      colorLogger.error(`Invalid form data: ${errorDetails}`);
      return NextResponse.json<ErrorResponse>({ 
        error: 'Invalid form data structure', 
        details: errorDetails
      }, { status: 400 });
    }
    
    const formData: ProjectFormData = formDataResult.data;
    
    logger.startProcess('API: Generate Project & Components');
    
    // יצירת שם הפרויקט
    const timestamp = new Date().getTime();
    const safeBusinessName = formData.businessName 
      ? formData.businessName.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '-')
      : 'landing-page';
    const projectName = `${safeBusinessName}-${timestamp}`;

    // הגדרת תיקיית הפרויקט
    const { projectPath, projectDir } = await setupProject(projectName);
    logger.info(`Project setup completed: ${projectPath}`);
    
    // וידוא שהתיקייה נוצרה בהצלחה
    try {
      await fs.access(projectPath);
      logger.info(`Project directory created successfully at: ${projectPath}`);
    } catch (error) {
      logger.error(`Failed to access project directory: ${projectPath}`);
      throw new Error(`Failed to access project directory: ${projectPath}`);
    }

    // וידוא שהתיקיות המשניות נוצרו בהצלחה
    const requiredDirs = [
      path.join(projectPath, 'src', 'app'),
      path.join(projectPath, 'src', 'components'),
      path.join(projectPath, 'public')
    ];

    for (const dir of requiredDirs) {
      try {
        await fs.access(dir);
        logger.info(`Subdirectory created successfully: ${dir}`);
      } catch (error) {
        logger.error(`Failed to access subdirectory: ${dir}`);
        throw new Error(`Failed to access subdirectory: ${dir}`);
      }
    }
    
    // Generate a plan for the site components
    let sitePlan: SitePlan = {
      businessName: '',
      businessType: '',
      industry: '',
      theme: {
        primaryColor: '',
        secondaryColor: '',
        language: 'he'
      },
      components: []
    };
    
    try {
      sitePlan = await generateSitePlan(formData);
    } catch (error) {
      // טיפול בשגיאות Anthropic
      if (error instanceof Error) {
        if (error.message.includes('429')) {
          return NextResponse.json<ErrorResponse>({
            error: 'שגיאת מכסה מ-Anthropic',
            details: 'אנא בדוק את פרטי החיוב והמכסה שלך.'
          }, { status: 429 });
        }
        
        if (error.message.includes('401') || error.message.includes('403')) {
          return NextResponse.json<ErrorResponse>({
            error: 'שגיאת הרשאות ב-Anthropic',
            details: 'אנא בדוק את מפתח ה-API שלך.'
          }, { status: 401 });
        }
        
        if (error.message.includes('500') || error.message.includes('503')) {
          return NextResponse.json<ErrorResponse>({
            error: 'שגיאת שירות ב-Anthropic',
            details: 'אנא נסה שוב מאוחר יותר.'
          }, { status: 503 });
        }
        
        // טיפול בשגיאות אחרות
        return NextResponse.json<ErrorResponse>({
          error: 'שגיאה לא צפויה',
          details: error.message
        }, { status: 500 });
      }
    }
    
    // Generate components based on the plan
    const results: EnhancedComponentResult[] = [];
    
    // Create a copy and sort components by priority (lower number = higher priority)
    // This ensures components at the top of the page are generated first
    const sortedComponents: ComponentPlan[] = [...sitePlan.components].sort(
      (a: ComponentPlan, b: ComponentPlan) => a.priority - b.priority
    );
    
    // Log the total number of components to generate
    logger.info(`🏗️ Generating ${sortedComponents.length} components for ${formData.businessName || 'landing page'}`);
    
    // Track completed and failed components
    let completedComponents = 0;
    let failedComponents = 0;
    
    // Create initial components list with pending status
    const componentStatusList: {
      name: string;
      type: string;
      status: 'pending' | 'completed' | 'failed';
      description: string;
      error?: string;
    }[] = sortedComponents.map(component => ({
      name: component.name,
      type: component.type,
      status: 'pending',
      description: component.description
    }));
    
    // Update initial generation status
    updateGenerationStatus(
      projectDir,
      {
        totalComponents: sortedComponents.length,
        completedComponents: 0,
        failedComponents: 0,
        progress: 0
      },
      componentStatusList
    );
    
    // Generate each component
    for (let i = 0; i < sortedComponents.length; i++) {
      const component = sortedComponents[i];
      const currentIndex = i + 1;
      
      // Log component generation progress
      logger.componentProgress(currentIndex, sortedComponents.length, component.name);
      
      // Update component status to show current progress
      componentStatusList[i] = {
        ...componentStatusList[i],
        status: 'pending'
      };
      
      // Update generation status
      updateGenerationStatus(
        projectDir,
        {
          totalComponents: sortedComponents.length,
          completedComponents,
          failedComponents,
          progress: Math.round((completedComponents / sortedComponents.length) * 100)
        },
        componentStatusList
      );
      
      try {
        const generatedComponent = await generateComponent(
          component.name,
          projectPath,
          formData,
          component.prompts.main
        );
        
        // Log dependencies added
        logger.componentDependencies(component.name, generatedComponent.dependencies);
        
        // Log component success
        logger.componentSuccess(currentIndex, sortedComponents.length, component.name);
        
        // Update component status
        componentStatusList[i] = {
          ...componentStatusList[i],
          status: 'completed'
        };
        
        // Add to results with status
        results.push({
          ...generatedComponent,
          description: component.description,
          type: component.type,
          priority: component.priority,
          status: 'completed'
        });
        
        completedComponents++;
      } catch (error) {
        // Log component failure
        logger.componentFailure(currentIndex, sortedComponents.length, component.name, error);
        
        // Update component status
        componentStatusList[i] = {
          ...componentStatusList[i],
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        };
        
        // Add to results with error status
        results.push({
          name: component.name.split('/').pop() || component.name,
          code: "",
          dependencies: [] as Dependency[],
          path: component.name,
          description: component.description,
          type: component.type,
          priority: component.priority,
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        });
        
        failedComponents++;
      }
      
      // Update generation status after each component
      updateGenerationStatus(
        projectDir,
        {
          totalComponents: sortedComponents.length,
          completedComponents,
          failedComponents,
          progress: Math.round((completedComponents / sortedComponents.length) * 100)
        },
        componentStatusList
      );
    }
    
    // Calculate final progress
    const progress = (completedComponents / sortedComponents.length) * 100;
    
    // Save final status to filesystem
    const statusFile = path.join(projectPath, 'generation-status.json');
    const finalStatus = {
      projectDir,
      status: {
        totalComponents: sortedComponents.length,
        completedComponents,
        failedComponents,
        progress: Math.round(progress)
      },
      components: componentStatusList,
      tokenUsage: {
        totalInputTokens: logger.tokenInfo.totalInputTokens,
        totalOutputTokens: logger.tokenInfo.totalOutputTokens,
        totalTokens: logger.tokenInfo.totalTokens,
        requests: logger.tokenInfo.requests
      }
    };
    
    await fs.writeFile(statusFile, JSON.stringify(finalStatus, null, 2), 'utf-8');
    
    // Log token usage summary
    logger.tokenSummary();
    
    // End the process with project directory name
    colorLogger.success('WEBSITE GENERATION COMPLETED SUCCESSFULLY');
    colorLogger.info(`Total tokens used: ${logger.tokenInfo.totalTokens}`);
    colorLogger.endProcess(`API: Generate Project & Components - ${projectDir}`);
    
    // If all components were generated successfully, trigger deployment
    let deployedUrl: string | undefined;
    const successRatio = completedComponents / sortedComponents.length;
    if (successRatio >= 0.5) { // אם לפחות 50% מהרכיבים נוצרו בהצלחה
      try {
        const deployResponse = await fetch(`${req.nextUrl.origin}/api/generate/deploy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectDir }),
        });
        
        const deployResult = await deployResponse.json();
        if (deployResult.success && deployResult.url) {
          deployedUrl = deployResult.url;
          colorLogger.success(`Project deployed successfully: ${deployedUrl}`);
        } else {
          // בדוק אם יש שגיאה ספציפית
          if (deployResult.error && 
             (deployResult.error.includes('Vercel CLI is not authenticated') || 
              deployResult.error.includes('VERCEL_TOKEN is not set'))) {
            // במקרה של שגיאת הרשאות Vercel, נציג הודעה למשתמש
            colorLogger.warning(`Deployment limited to local preview: ${deployResult.error}`);
            deployedUrl = deployResult.url; // קישור לתצוגה מקומית
          } else {
            colorLogger.error(`Deployment failed: ${deployResult.error}`);
          }
        }
      } catch (deployError) {
        colorLogger.error(`Failed to trigger deployment: ${deployError}`);
      }
    }
    
    // Return the response with all necessary information
    const response: ApiResponse = {
      success: true,
      projectDir,
      projectPath,
      sitePlan,
      components: results,
      status: {
        totalComponents: sitePlan.components.length,
        completedComponents: results.filter(c => c.status === 'completed').length,
        failedComponents: results.filter(c => c.status === 'failed').length,
        progress: Math.round((results.filter(c => c.status === 'completed').length / sitePlan.components.length) * 100)
      },
      tokenUsage: {
        totalInputTokens: logger.tokenInfo.totalInputTokens,
        totalOutputTokens: logger.tokenInfo.totalOutputTokens,
        totalTokens: logger.tokenInfo.totalTokens,
        requests: logger.tokenInfo.requests
      },
      deployedUrl
    };

    // וידוא שהתשובה מכילה את כל המידע הנדרש
    if (!response.projectDir) {
      throw new Error('Project directory not included in response');
    }

    if (!response.projectPath) {
      throw new Error('Project path not included in response');
    }

    colorLogger.info(`Returning response with project directory: ${response.projectDir}`);
    // should create a repo, deploy to vercel and get a url for the website in vercel using the .sh fil
    return NextResponse.json(response);
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate API route:', error);
    
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to generate project', details: errorMessage },
      { status: 500 }
    );
  }
} 