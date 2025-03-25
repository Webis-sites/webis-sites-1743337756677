import { anthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { FormData, SitePlan, ComponentPlan, logger, AI_MODELS, SitePlanSchema } from '../shared';
import { createSitePlanPrompt } from './prompts';
import { PlanOptions } from './types';

/**
 * Generates a plan for the site components using AI
 * @param formData Form data with business information
 * @returns Complete site plan with components and layout
 */
export async function generateSitePlan(formData: FormData): Promise<SitePlan> {
  logger.startProcess('Generating Site Plan');
  logger.aiCall('Claude 3.7 Sonnet');
  
  try {
    const prompt = createSitePlanPrompt(formData);
    
    // Use AI to generate the site plan
    const { object } = await generateObject({
      model: anthropic(AI_MODELS.CLAUDE_3_SONNET),
      schema: SitePlanSchema,
      prompt
    });
    
    logger.aiResponse('Claude 3.7 Sonnet', JSON.stringify(object).length);
    
    // Create the site plan structure
    const sitePlan: SitePlan = {
      businessName: formData.businessName,
      businessType: formData.businessType,
      industry: formData.industry,
      theme: {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        language: formData.language
      },
      components: object.components
    };
    
    // Log a summary of the plan
    logger.summary('Site Plan Summary', {
      'Total Components': sitePlan.components.length,
      'Business Type': sitePlan.businessType,
      'Language': sitePlan.theme.language,
      'Component Types': sitePlan.components.map(c => c.type).join(', ')
    });
    
    logger.endProcess('Generating Site Plan');
    
    return sitePlan;
  } catch (error) {
    logger.error('Error generating site plan', error);
    throw error;
  }
} 