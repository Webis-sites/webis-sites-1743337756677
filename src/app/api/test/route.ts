import { NextRequest, NextResponse } from 'next/server';
import { getComponentCodeAndDependencies } from '../generate/route';

export async function GET(request: NextRequest) {
  const testFormData = {
    businessName: "מספרה ביתא",
    businessType: "מספרה",
    industry: "טיפוח",
    businessSize: "קטן",
    description: "מספרה מודרנית עם דגש על חווית לקוח",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    typographyStyle: "modern",
    animationPreference: "moderate",
    language: "he",
    headline: "עיצוב שיער מקצועי",
    descriptionText: "המספרה המובילה באזור",
    ctaText: "קבע תור עכשיו",
    formFields: ["שם", "טלפון", "אימייל"],
    includeTestimonials: true,
    includeFAQ: true,
    hasProducts: true,
    hasServices: true,
    hasPortfolio: true,
    needsBookingSystem: true,
    metaKeywords: "מספרה, עיצוב שיער, תספורת",
    metaDescription: "מספרה מקצועית עם שירות אישי"
  };

  try {
    const result = await getComponentCodeAndDependencies('Header', '', testFormData);
    
    // Add 'use client' directive and update colors
    if (result.code) {
      result.code = `'use client';\n\n${result.code}`.replace(
        /bg-primary-500/g,
        `bg-[${testFormData.primaryColor}]`
      ).replace(
        /text-secondary-500/g,
        `text-[${testFormData.secondaryColor}]`
      );
    }

    // Update framer-motion version
    if (result.dependencies) {
      result.dependencies = result.dependencies.map(dep => {
        if (dep.name === 'framer-motion') {
          return { ...dep, version: '^11.0.3' };
        }
        return dep;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to generate component' }, { status: 500 });
  }
} 