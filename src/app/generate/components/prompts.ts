import { FormData } from '../shared';
import { getStylePrompts } from '../styles/prompts';

/**
 * Creates a prompt for component generation with JSON schema
 * @param name Component name
 * @param componentPrompt Specific prompt for the component
 * @param formData Form data
 * @returns Complete prompt string
 */
export function createComponentPromptWithJSON(name: string, componentPrompt: string, formData: FormData): string {
  // קבל את הפרומפטים של הסגנונות שנבחרו
  const stylePrompt = formData.designStyles && formData.designStyles.length > 0
    ? getStylePrompts(formData.designStyles)
    : '';

  return `
You are a Next.js expert developer. You're specializing in creating high-quality, modern React components for a ${formData.businessType} business in the ${formData.industry} industry.

BUSINESS INFORMATION:
- Business Type: ${formData.businessType}
- Industry: ${formData.industry}
- Size: ${formData.businessSize}
- Language: ${formData.language === 'he' ? 'Hebrew (RTL)' : 'English (LTR)'}
- Primary Color: ${formData.primaryColor}
- Secondary Color: ${formData.secondaryColor}
- Typography Style: ${formData.typographyStyle}
- Animation Preference: ${formData.animationPreference}
- Description: ${formData.description}

YOUR TASK:
Create a Next.js component named "${name}". ${componentPrompt || `Make it professional, modern and aligned with current web development best practices for a ${formData.businessType}.`}

REQUIREMENTS:
- Use TypeScript with proper types and interfaces
- Use Tailwind CSS for styling (already installed)
- Support ${formData.language === 'he' ? 'RTL (right-to-left) layout' : 'LTR (left-to-right) layout'}
- Use semantic HTML
- Create a responsive design that works on mobile, tablet, and desktop
- Follow modern React best practices and optimizations
- Implement accessibility best practices
- Write clean, well-commented, maintainable code
${formData.language === 'he' ? '- Ensure all text content is in Hebrew' : ''}

${stylePrompt ? `DESIGN STYLE REQUIREMENTS:\n${stylePrompt}\n` : ''}

OUTPUT FORMAT:
Provide only the complete code for the component with proper imports, TypeScript types, and Tailwind CSS classes. Return the code as a valid TypeScript React component.
`;
} 