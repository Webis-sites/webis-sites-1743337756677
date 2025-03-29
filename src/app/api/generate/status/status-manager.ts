import { logger } from '../../../generate/shared/logger';

// Interface for component status
export interface ComponentStatus {
  name: string;
  type: string;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
  prompt?: string;
  description?: string;
}

// Interface for project status
export interface ProjectStatus {
  projectDir: string;
  status: {
    totalComponents: number;
    completedComponents: number;
    failedComponents: number;
    progress: number;
  };
  components: ComponentStatus[];
}

// Map to store statuses for active generation processes
const activeGenerations = new Map<string, ProjectStatus>();

/**
 * Updates the status of a project generation
 */
export function updateGenerationStatus(
  projectDir: string, 
  status: {
    totalComponents: number;
    completedComponents: number;
    failedComponents: number;
    progress: number;
  },
  components: ComponentStatus[]
): void {
  activeGenerations.set(projectDir, {
    projectDir,
    status,
    components
  });

  // We might want to clean up old statuses after some time
  setTimeout(() => {
    if (activeGenerations.has(projectDir)) {
      activeGenerations.delete(projectDir);
    }
  }, 1000 * 60 * 30); // 30 minutes
}

/**
 * Gets the current status of a project generation
 */
export function getGenerationStatus(projectDir: string): ProjectStatus | undefined {
  return activeGenerations.get(projectDir);
} 