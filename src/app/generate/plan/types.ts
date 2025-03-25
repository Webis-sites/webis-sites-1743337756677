import { z } from 'zod';
import { ComponentPlan, SitePlan } from '../shared';

/**
 * Options for plan generation
 */
export type PlanOptions = {
  includeHeader?: boolean;
  includeFooter?: boolean;
  includeHero?: boolean;
  includeContactForm?: boolean;
  additionalSections?: string[];
};

/**
 * Zod schema for plan options
 */
export const PlanOptionsSchema = z.object({
  includeHeader: z.boolean().optional().default(true),
  includeFooter: z.boolean().optional().default(true),
  includeHero: z.boolean().optional().default(true),
  includeContactForm: z.boolean().optional().default(true),
  additionalSections: z.array(z.string()).optional().default([])
});

export type { ComponentPlan, SitePlan } from '../shared/types'; 