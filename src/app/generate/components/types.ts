import { z } from 'zod';

/**
 * Type for external dependency
 */
export interface Dependency {
  name: string;  // Package name in npm
  version: string;  // Package version
}

/**
 * Type for AI-generated component
 */
export interface Component {
  code: string;  // Component code
  dependencies?: Dependency[];  // External dependencies needed
}

/**
 * Type for component generation result with additional info
 */
export interface GeneratedComponent {
  name: string;  // Component name
  code: string;  // Component code
  dependencies: Dependency[];  // Dependencies
  path: string;  // File path
}

/**
 * Zod schema for component validation
 */
export const ComponentSchema = z.object({
  code: z.string(),
  dependencies: z.array(
    z.object({
      name: z.string(),
      version: z.string()
    })
  ).optional()
}); 