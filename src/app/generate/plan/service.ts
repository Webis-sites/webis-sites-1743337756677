import { anthropic } from '@ai-sdk/anthropic';
import { FormData, SitePlan, ComponentPlan, logger, SitePlanSchema, AI_MODELS } from '../shared';
import { createSitePlanPrompt } from './prompts';
import { PlanOptions } from './types';
import { generateObject } from 'ai';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY environment variable is missing. Please add it to your .env file.');
}

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
      model: anthropic(AI_MODELS.CLAUDE_3_7_SONNET),
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
      components: object.components.map((comp: { 
        name?: string;
        type?: string;
        description?: string;
        priority?: number;
        prompts?: { main?: string };
      }) => ({
        name: comp.name || 'unnamed-component',
        type: comp.type || 'default',
        description: comp.description || '',
        priority: comp.priority || 0,
        prompts: {
          main: comp.prompts?.main || ''
        }
      }))
    };
    
    // Log a summary of the plan
    logger.summary(`Site Plan Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Components: ${sitePlan.components.length}
🏢 Business Type: ${sitePlan.businessType}
🌐 Language: ${sitePlan.theme?.language}

📦 Component Types:
${sitePlan.components.map(c => `   • ${c.type}`).join('\n')}

🔧 Components:
${sitePlan.components.map(c => `   • ${c.name}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    logger.endProcess('Generating Site Plan');
    
    return sitePlan;
  } catch (error) {
    // טיפול בשגיאות OpenAI
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('שגיאת מכסה מ-Anthropic. אנא בדוק את פרטי החיוב והמכסה שלך.');
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error('שגיאת הרשאות ב-Anthropic. אנא בדוק את מפתח ה-API שלך.');
      }
      
      if (error.message.includes('500') || error.message.includes('503')) {
        throw new Error('שגיאת שירות ב-Anthropic. אנא נסה שוב מאוחר יותר.');
      }
      
      // טיפול בשגיאות אחרות של OpenAI
      throw new Error(`שגיאה בשירות Anthropic: ${error.message}`);
    }
    
    // טיפול בשגיאות אחרות
    throw new Error(`שגיאה לא צפויה: ${error instanceof Error ? error.message : String(error)}`);
  }
} 