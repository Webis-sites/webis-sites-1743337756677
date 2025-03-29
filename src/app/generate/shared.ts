import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { Dependency } from './components/types';

export const CLAUDE_3_7_SONNET = 'claude-3-7-sonnet-20250219';
export const GPT_4_O = 'gpt-4';

export const AI_MODELS = {
  CLAUDE_3_7_SONNET,
  GPT_4_O
} as const;

export interface FormData {
  businessName: string;
  businessType?: string;
  industry?: string;
  businessSize?: string;
  description?: string;
  language?: string;
  primaryColor?: string;
  secondaryColor?: string;
  typographyStyle?: string;
  animationPreference?: string;
  headline?: string;
  descriptionText?: string;
  ctaText?: string;
  formFields?: string;
  includeTestimonials?: boolean;
  includeFAQ?: boolean;
  hasProducts?: boolean;
  hasServices?: boolean;
  hasPortfolio?: boolean;
  needsBookingSystem?: boolean;
  metaDescription?: string;
  metaKeywords?: string;
  tagline?: string;
  features?: string[];
  aiModel?: string;
  designStyles?: string[];
}

export const FormDataSchema = z.object({
  businessName: z.string(),
  businessType: z.string().optional(),
  industry: z.string().optional(),
  businessSize: z.string().optional(),
  description: z.string().optional(),
  language: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  typographyStyle: z.string().optional(),
  animationPreference: z.string().optional(),
  headline: z.string().optional(),
  descriptionText: z.string().optional(),
  ctaText: z.string().optional(),
  formFields: z.string().optional(),
  includeTestimonials: z.boolean().optional(),
  includeFAQ: z.boolean().optional(),
  hasProducts: z.boolean().optional(),
  hasServices: z.boolean().optional(),
  hasPortfolio: z.boolean().optional(),
  needsBookingSystem: z.boolean().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  tagline: z.string().optional(),
  features: z.array(z.string()).optional(),
  aiModel: z.string().optional(),
  designStyles: z.array(z.string()).optional()
});

export interface ApiResponse {
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

export interface SitePlan {
  businessName?: string;
  businessType?: string;
  industry?: string;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    language?: string;
  };
  components: ComponentPlan[];
}

export interface ComponentPlan {
  name: string;
  type: string;
  description: string;
  priority: number;
  prompts: {
    main: string;
  };
}

export interface EnhancedComponentResult {
  name: string;
  code: string;
  dependencies: Dependency[];
  path: string;
  description: string;
  type: string;
  priority: number;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

export const logger = {
  tokenInfo: {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    requests: 0
  },
  
  resetTokens() {
    this.tokenInfo = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      requests: 0
    };
  },
  
  startProcess(message: string) {
    console.log(`\n🚀 ${message}`);
  },
  
  endProcess(message: string) {
    console.log(`\n✅ ${message}`);
  },
  
  info(message: string) {
    console.log(`ℹ️ ${message}`);
  },
  
  error(message: string) {
    console.error(`❌ ${message}`);
  },
  
  success(message: string) {
    console.log(`✅ ${message}`);
  },
  
  warn(message: string) {
    console.warn(`⚠️ ${message}`);
  },
  
  fileCreated(filePath: string) {
    console.log(`📄 Created file: ${filePath}`);
  },
  
  summary(message: string) {
    console.log(`\n📊 ${message}`);
  },
  
  aiCall(prompt: string) {
    console.log(`🤖 AI Call: ${prompt.substring(0, 100)}...`);
  },
  
  aiResponse(model: string, length: number) {
    console.log(`✨ AI Response (${model}): ${length} characters`);
  },
  
  componentProgress(current: number, total: number, name: string) {
    console.log(`🔄 Generating component ${current}/${total}: ${name}`);
  },
  
  componentSuccess(current: number, total: number, name: string) {
    console.log(`✅ Completed component ${current}/${total}: ${name}`);
  },
  
  componentFailure(current: number, total: number, name: string, error: unknown) {
    console.error(`❌ Failed component ${current}/${total}: ${name}`, error);
  },
  
  componentDependencies(name: string, dependencies: Dependency[]) {
    console.log(`📦 Added dependencies for ${name}: ${dependencies.map(d => d.name).join(', ')}`);
  },
  
  updateTokenInfo(inputTokens: number, outputTokens: number) {
    this.tokenInfo.totalInputTokens += inputTokens;
    this.tokenInfo.totalOutputTokens += outputTokens;
    this.tokenInfo.totalTokens += inputTokens + outputTokens;
    this.tokenInfo.requests++;
  },
  
  getTokenInfo() {
    return this.tokenInfo;
  },
  
  tokenSummary() {
    console.log('\n📊 Token Usage Summary:');
    console.log(`Total Input Tokens: ${this.tokenInfo.totalInputTokens}`);
    console.log(`Total Output Tokens: ${this.tokenInfo.totalOutputTokens}`);
    console.log(`Total Tokens: ${this.tokenInfo.totalTokens}`);
    console.log(`Total Requests: ${this.tokenInfo.requests}`);
  }
};

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    // If the path is for a file, get the directory part
    const directoryPath = path.extname(dirPath) ? path.dirname(dirPath) : dirPath;
    
    // Check if directory already exists
    try {
      await fs.access(directoryPath);
      logger.info(`Directory already exists: ${directoryPath}`);
      return;
    } catch {
      // Directory doesn't exist, create it
      await fs.mkdir(directoryPath, { recursive: true });
      logger.info(`Created directory: ${directoryPath}`);
    }
  } catch (error) {
    logger.error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error(`Failed to create directory ${dirPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export const SitePlanSchema = z.object({
  components: z.array(z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    priority: z.number(),
    prompts: z.object({
      main: z.string()
    })
  }))
});

export function convertToValidDirectoryName(name: string | undefined): string {
  if (!name) {
    return 'landing-page';
  }
  
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05FF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}