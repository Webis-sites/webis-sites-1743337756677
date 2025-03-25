import { FormData } from '../shared';

/**
 * Creates a site plan prompt
 */
export function createSitePlanPrompt(formData: FormData): string {
  return `
You are a Next.js website planning expert. You are designing a site plan for a ${formData.businessType} in the ${formData.industry} industry.

BUSINESS INFORMATION:
- Name: ${formData.businessName}
- Business Type: ${formData.businessType}
- Industry: ${formData.industry}
- Size: ${formData.businessSize}
- Description: ${formData.description}
- Has Products: ${formData.hasProducts ? 'Yes' : 'No'}
- Has Services: ${formData.hasServices ? 'Yes' : 'No'}
- Has Portfolio: ${formData.hasPortfolio ? 'Yes' : 'No'}
- Needs Booking System: ${formData.needsBookingSystem ? 'Yes' : 'No'}
- Testimonials: ${formData.includeTestimonials ? 'Yes' : 'No'}
- FAQ: ${formData.includeFAQ ? 'Yes' : 'No'}

DESIGN PREFERENCES:
- Language: ${formData.language === 'he' ? 'Hebrew (RTL)' : 'English (LTR)'}
- Primary Color: ${formData.primaryColor}
- Secondary Color: ${formData.secondaryColor}
- Typography Style: ${formData.typographyStyle}
- Animation Preference: ${formData.animationPreference}

CONTENT REQUIREMENTS:
- Headline: ${formData.headline}
- Description Text: ${formData.descriptionText}
- CTA Text: ${formData.ctaText}
- Form Fields: ${formData.formFields}
- Meta Keywords: ${formData.metaKeywords}
- Meta Description: ${formData.metaDescription}

YOUR TASK:
Create a logical and structured site plan for a landing page. Plan the components that should be generated for this website to effectively showcase the business.

For each component, provide:
1. A unique name (e.g., "HeroSection", "ServicesList")
2. Type (e.g., "hero", "features", "testimonials")
3. Description explaining the purpose of the component
4. Priority order (lower number = higher on page)
5. A detailed prompt for the AI to generate the component

RETURN FORMAT:
Return a JSON object containing an array of components. Each component should include name, type, description, priority, and prompts.

Example component:
{
  "name": "HeroSection",
  "type": "hero",
  "description": "Main hero section with headline and call to action",
  "priority": 1,
  "prompts": {
    "main": "Create a hero section with a strong headline, subheadline, and prominent call-to-action button that clearly communicates the value proposition."
  }
}

Only return the components array in valid JSON format. No additional explanation is needed.
`;
} 