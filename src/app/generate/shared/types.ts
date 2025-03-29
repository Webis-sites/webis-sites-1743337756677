import { z } from 'zod';

/**
 * Type representing the form data for site generation
 */
export interface FormData {
  businessName?: string;       // Business name
  businessType?: string;       // Business type (e.g., store, restaurant, service business)
  industry?: string;           // Industry (e.g., technology, fashion, healthcare)
  businessSize?: string;       // Business size
  description?: string;        // Business description
  language?: string;           // Site language (he/en)
  primaryColor?: string;       // Primary color (hex format)
  secondaryColor?: string;     // Secondary color (hex format)
  typographyStyle?: string;    // Preferred typography style
  animationPreference?: string; // Animation preferences
  headline?: string;           // Main headline (if predefined)
  descriptionText?: string;    // Description text (if predefined)
  ctaText?: string;            // Call-to-action text (if predefined)
  formFields?: string;         // Custom form fields (comma-separated)
  includeTestimonials?: boolean;
  includeFAQ?: boolean;
  hasProducts?: boolean;
  hasServices?: boolean;
  hasPortfolio?: boolean;
  needsBookingSystem?: boolean;
  metaDescription?: string;     // Meta description for SEO
  metaKeywords?: string;        // Meta keywords for SEO
  tagline?: string;           // Tagline for the business
  features?: string[];        // Additional features or services
  aiModel?: string;           // AI model for generation
  designStyles?: string[];    // Selected design styles (e.g., minimalist, brutalist, etc.)
}

/**
 * Form data schema for the generator
 */
export const FormDataSchema = z.object({
  // Basic business information
  businessName: z.string().min(2, "שם העסק חייב להכיל לפחות 2 תווים"),
  businessType: z.string().min(2, "סוג העסק חייב להיות מוגדר"),
  industry: z.string().min(2, "התעשייה חייבת להיות מוגדרת"),
  businessSize: z.string().min(2, "גודל העסק חייב להיות מוגדר"),
  description: z.string().min(10, "תיאור העסק חייב להכיל לפחות 10 תווים"),
  
  // Design and style
  primaryColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "צבע ראשי חייב להיות בפורמט HEX תקין"),
  secondaryColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i, "צבע משני חייב להיות בפורמט HEX תקין"),
  typographyStyle: z.string().min(2, "סגנון הטיפוגרפיה חייב להיות מוגדר"),
  animationPreference: z.string().min(2, "העדפת האנימציה חייבת להיות מוגדרת"),
  language: z.enum(["he", "en"], {
    errorMap: () => ({ message: "שפה חייבת להיות עברית או אנגלית" })
  }),
  
  // Content - with default values
  headline: z.string().min(2, "כותרת ראשית חייבת להיות מוגדרת").default("כותרת ראשית"),
  descriptionText: z.string().min(10, "תיאור תוכן חייב להכיל לפחות 10 תווים").default("תיאור תוכן של האתר - יוחלף בתיאור האמיתי"),
  ctaText: z.string().min(2, "טקסט לכפתור קריאה לפעולה חייב להיות מוגדר").default("צור קשר"),
  formFields: z.string().min(2, "שדות הטופס חייבים להיות מוגדרים").default("שם, טלפון, אימייל, הודעה"),
  
  // Website options
  includeTestimonials: z.boolean().default(false),
  includeFAQ: z.boolean().default(false),
  hasProducts: z.boolean().default(false),
  hasServices: z.boolean().default(false),
  hasPortfolio: z.boolean().default(false),
  needsBookingSystem: z.boolean().default(false),
  
  // SEO - with default values
  metaKeywords: z.string().min(5, "מילות מפתח חייבות להכיל לפחות 5 תווים")
    .default("אתר, עסק, שירותים, מוצרים"),
  metaDescription: z.string().min(20, "תיאור מטא חייב להכיל לפחות 20 תווים")
    .default("תיאור מטא של האתר - יוחלף בתיאור האמיתי שיופיע בתוצאות החיפוש")
});

/**
 * Runtime type for form data
 */
export type FormDataRuntime = z.infer<typeof FormDataSchema>;

/**
 * Type representing a component in the site plan
 */
export interface ComponentPlan {
  name: string;           // Component name (e.g., "HeroSection")
  type: string;           // Component type (e.g., "hero", "features", "contact")
  description: string;    // Human-readable description
  priority: number;       // Order priority (lower number = higher priority)
  prompts: {
    main: string;         // Main prompt for component generation
    refinement?: string;  // Optional refinement prompt
  };
}

/**
 * Zod schema for component plan validation
 */
export const ComponentPlanSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
  prompts: z.object({
    main: z.string(),
    refinement: z.string().optional()
  }),
  priority: z.number().int().positive()
});

/**
 * Type representing a section in the site layout
 */
export interface LayoutSection {
  name: string;             // Section name
  priority: number;         // Display priority (lower number = higher on page)
  components: string[];     // Component names included in this section
}

/**
 * Zod schema for layout section validation
 */
export const LayoutSectionSchema = z.object({
  name: z.string(),
  priority: z.number().int().positive(),
  components: z.array(z.string())
});

/**
 * Site plan interface representing the entire site structure
 */
export interface SitePlan {
  businessName: string;          // Business name
  businessType: string;          // Business type
  industry: string;              // Industry
  theme: {
    primaryColor: string;        // Primary brand color
    secondaryColor: string;      // Secondary brand color
    language: string;            // Site language code
  };
  components: ComponentPlan[];   // Array of components to generate
}

/**
 * Zod schema for complete site plan validation
 */
export const SitePlanSchema = z.object({
  components: z.array(ComponentPlanSchema)
}); 