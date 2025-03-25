import { NextRequest, NextResponse } from 'next/server';
import { generateComponent } from '../../generate/components';
import { setupProject } from '../../generate/project';
import { generateSitePlan } from '../../generate/plan';
import { 
  FormData as ProjectFormData, 
  FormDataSchema, 
  SitePlan, 
  ComponentPlan,
  logger 
} from '../../generate/shared';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

// Import types from components and project modules
import type { GeneratedComponent } from '../../generate/components';
import type { ProjectSetupResult } from '../../generate/project';

import { updateGenerationStatus } from './status/route';

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
}

// Type for error response
interface ErrorResponse {
  error: string;
  details: unknown;
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
  
  logger.info(`Processed form data: ${JSON.stringify(result).substring(0, 100)}...`);
  return result;
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse | ErrorResponse>> {
  try {
    // Reset token counters at the start of the process
    logger.resetTokens();
    
    // Try to get form data directly
    let formDataObj: Record<string, any>;
    
    try {
      // Try getting form data directly
      const formData = await req.formData();
      logger.info('Received form data');
      
      // Convert to plain object
      formDataObj = {};
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      
      logger.info(`Parsed form fields: ${Object.keys(formDataObj).join(', ')}`);
    } catch (formError) {
      // If not form data, try as URL encoded or JSON
      try {
        const rawData = await req.text();
        logger.info(`Received raw data (${rawData.length} bytes)`);
        
        // Check if it's URL encoded form data
        if (rawData.includes('&') && rawData.includes('=')) {
          const params = new URLSearchParams(rawData);
          formDataObj = {};
          
          params.forEach((value, key) => {
            formDataObj[key] = value;
          });
          
          logger.info(`Parsed as URL encoded form data: ${Object.keys(formDataObj).join(', ')}`);
        } else {
          // Try to parse as JSON as last resort
          try {
            formDataObj = JSON.parse(rawData);
            logger.info(`Parsed as JSON data: ${Object.keys(formDataObj).join(', ')}`);
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
    
    // Process the form data to handle special fields
    const processedData = processFormData(formDataObj);
    
    // Validate the form data against our schema
    const formDataResult = FormDataSchema.safeParse(processedData);
    
    if (!formDataResult.success) {
      return NextResponse.json<ErrorResponse>({ 
        error: 'Invalid form data structure', 
        details: formDataResult.error.format() 
      }, { status: 400 });
    }
    
    const formData: ProjectFormData = formDataResult.data;
    
    logger.startProcess('API: Generate Project & Components');
    
    // Create a project name with business name and timestamp
    const timestamp = new Date().getTime();
    const safeBusinessName = formData.businessName.replace(/[^a-zA-Z0-9\u0590-\u05FF]/g, '-');
    const projectDirName = `landing-page-${safeBusinessName}-${timestamp}`;
    
    // Use a directory in the current project instead of os.tmpdir()
    const baseDir: string = path.join(process.cwd(), 'tmp');
    
    // Ensure the tmp directory exists
    await fs.mkdir(baseDir, { recursive: true });
    
    // Setup the project structure with the custom project directory name
    const { projectPath, projectDir }: ProjectSetupResult = await setupProject(
      formData,
      baseDir,
      projectDirName
    );
    
    // Generate a plan for the site components
    const sitePlan: SitePlan = await generateSitePlan(formData);
    
    // Generate components based on the plan
    const results: EnhancedComponentResult[] = [];
    
    // Create a copy and sort components by priority (lower number = higher priority)
    // This ensures components at the top of the page are generated first
    const sortedComponents: ComponentPlan[] = [...sitePlan.components].sort(
      (a: ComponentPlan, b: ComponentPlan) => a.priority - b.priority
    );
    
    // Log the total number of components to generate
    logger.info(`🏗️ Generating ${sortedComponents.length} components for ${formData.businessName}`);
    
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
          dependencies: [],
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
    logger.endProcess('API: Generate Project & Components', projectDir);
    
    // Return the successful response with status information
    return NextResponse.json<ApiResponse>({
      success: true,
      projectDir,
      projectPath,
      sitePlan,
      components: results,
      status: {
        totalComponents: sortedComponents.length,
        completedComponents,
        failedComponents,
        progress: Math.round(progress)
      },
      tokenUsage: {
        totalInputTokens: logger.tokenInfo.totalInputTokens,
        totalOutputTokens: logger.tokenInfo.totalOutputTokens,
        totalTokens: logger.tokenInfo.totalTokens,
        requests: logger.tokenInfo.requests
      }
    });
  } catch (error: unknown) {
    const errorMessage: string = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate API route:', error);
    
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to generate project', details: errorMessage },
      { status: 500 }
    );
  }
}