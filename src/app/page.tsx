'use client';

import React, { useState, FormEvent, useEffect, Suspense } from 'react';
import Preview from './components/Preview';
import { useRouter } from 'next/navigation';
import StyleSelector from './generate/styles/StyleSelector';

interface FormData {
  businessName: string;
  businessType: string;
  industry: string;
  businessSize: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  typographyStyle: string;
  animationPreference: string;
  language: string;
  headline: string;
  descriptionText: string;
  ctaText: string;
  formFields: string;
  includeTestimonials: boolean;
  includeFAQ: boolean;
  hasProducts: boolean;
  hasServices: boolean;
  hasPortfolio: boolean;
  needsBookingSystem: boolean;
  metaKeywords: string;
  metaDescription: string;
  designStyles: string[];
}

interface GenerationStatus {
  currentComponent: string;
  description: string;
  completedComponents: string[];
  totalComponents: number;
  progress: number;
}

interface Project {
  name: string;
  components: string[];
  createdAt: string;
}

interface ComponentSkeletons {
  [key: string]: () => JSX.Element;
}

interface DependencyManager {
  dependencies: { [key: string]: string };
  devDependencies: { [key: string]: string };
}

interface ProjectStructure {
  components: {
    [key: string]: {
      code: string;
      dependencies?: {
        name: string;
        version: string;
        type: 'dependency' | 'devDependency';
      }[];
      styles?: string;
      types?: string;
      utils?: string[];
    };
  };
  utils?: {
    [key: string]: string;
  };
  types?: {
    [key: string]: string;
  };
  env?: {
    [key: string]: string;
  };
  packageJson: {
    dependencies: { [key: string]: string };
    devDependencies: { [key: string]: string };
  };
}

interface BuildStatus {
  currentComponent: string;
  status: 'pending' | 'building' | 'complete' | 'error';
  message?: string;
  progress: number;
}

interface GenerationResponse {
  projectName: string;
  status: {
    totalComponents: number;
    completedComponents: number;
    failedComponents: number;
    progress: number;
  };
}

const ComponentSkeleton: ComponentSkeletons = {
  Header: () => (
    <div className="animate-pulse bg-white p-4">
      <div className="h-16 bg-gray-200 rounded-lg mb-4"></div>
      <div className="flex justify-between">
        <div className="h-8 w-32 bg-gray-200 rounded"></div>
        <div className="flex space-x-4 rtl:space-x-reverse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  ),
  Hero: () => (
    <div className="animate-pulse bg-white p-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="h-12 bg-gray-200 rounded-lg mb-6 w-3/4 mx-auto"></div>
        <div className="h-24 bg-gray-200 rounded-lg mb-8"></div>
        <div className="h-12 w-48 bg-gray-200 rounded-lg mx-auto"></div>
      </div>
    </div>
  ),
  Services: () => (
    <div className="animate-pulse bg-white p-8">
      <div className="h-10 bg-gray-200 rounded-lg mb-8 w-1/4 mx-auto"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 rounded-lg bg-gray-100">
            <div className="h-16 w-16 bg-gray-200 rounded-full mb-4 mx-auto"></div>
            <div className="h-6 bg-gray-200 rounded mb-4 w-3/4 mx-auto"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  ),
  ProductShowcase: () => (
    <div className="animate-pulse bg-white p-8">
      <div className="h-10 bg-gray-200 rounded-lg mb-8 w-1/4 mx-auto"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg overflow-hidden">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  BookingForm: () => (
    <div className="animate-pulse bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="h-10 bg-gray-200 rounded-lg mb-8 w-1/2 mx-auto"></div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          ))}
          <div className="h-12 bg-gray-200 rounded-lg w-1/3 mx-auto"></div>
        </div>
      </div>
    </div>
  ),
  Testimonials: () => (
    <div className="animate-pulse bg-white p-8">
      <div className="h-10 bg-gray-200 rounded-lg mb-8 w-1/4 mx-auto"></div>
      <div className="max-w-3xl mx-auto">
        <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
        <div className="flex justify-center space-x-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-3 w-3 bg-gray-200 rounded-full"></div>
          ))}
        </div>
      </div>
    </div>
  ),
  FAQ: () => (
    <div className="animate-pulse bg-white p-8">
      <div className="h-10 bg-gray-200 rounded-lg mb-8 w-1/4 mx-auto"></div>
      <div className="max-w-3xl mx-auto space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg bg-gray-100 p-4">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  ),
  Footer: () => (
    <div className="animate-pulse bg-white p-8">
      <div className="grid grid-cols-4 gap-8 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 bg-gray-200 rounded w-3/4"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="h-12 bg-gray-200 rounded"></div>
    </div>
  ),
};

const consoleColors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

const uiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5', '#9B786F', '#588C7E'];
const typographyStyles = ['modern', 'classic', 'playful', 'minimal'];
const animations = ['minimal', 'moderate', 'extensive'];
const businessTypes = ['מסעדה', 'חנות בגדים', 'סטודיו לצילום', 'משרד עורכי דין', 'מכון כושר', 'מספרה', 'בית קפה', 'חנות ספרים'];
const industries = ['קמעונאות', 'שירותים', 'מזון', 'בריאות', 'אופנה', 'טכנולוגיה', 'חינוך', 'בידור'];
const sizes = ['small', 'medium', 'large'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomColor(): string {
  return randomElement(uiColors);
}

function complementaryColors(primary: string): string[] {
  return uiColors.filter(c => c !== primary);
}

function randomBool(): boolean {
  return Math.random() > 0.5;
}

function generateRandomData() {
  const businessType = randomElement(businessTypes);
  const primaryColor = randomColor();
  const secondaryColor = randomElement(complementaryColors(primaryColor));

  return {
    businessName: `${businessType} ${['אלפא', 'ביתא', 'גמא', 'דלתא'][Math.floor(Math.random() * 4)]}`,
    businessType,
    industry: randomElement(industries),
    businessSize: randomElement(sizes),
    description: `אנחנו ${businessType} מוביל בתחום ה${randomElement(industries)} עם ניסיון של שנים רבות. אנחנו מתמחים במתן שירות מקצועי ואיכותי ללקוחותינו.`,
    primaryColor,
    secondaryColor,
    typographyStyle: randomElement(typographyStyles),
    animationPreference: randomElement(animations),
    language: 'he',
    headline: `${businessType} מוביל בישראל`,
    descriptionText: 'חווית לקוח מושלמת בכל ביקור',
    ctaText: 'קבע תור עכשיו',
    formFields: 'שם, טלפון, אימייל, הודעה',
    includeTestimonials: randomBool(),
    includeFAQ: randomBool(),
    hasProducts: randomBool(),
    hasServices: true,
    hasPortfolio: randomBool(),
    needsBookingSystem: randomBool(),
    metaKeywords: `${businessType}, שירות, איכות, מקצועיות, ישראל`,
    metaDescription: `${businessType} מוביל המספק שירות מקצועי ואיכותי. הזמינו תור עוד היום!`,
    designStyles: [],
  };
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessType: '',
    industry: '',
    businessSize: '',
    description: '',
    language: 'he',
    primaryColor: '#3498db',
    secondaryColor: '#2ecc71',
    typographyStyle: 'modern',
    animationPreference: 'subtle',
    headline: '',
    descriptionText: '',
    ctaText: '',
    formFields: '',
    includeTestimonials: false,
    includeFAQ: false,
    hasProducts: false,
    hasServices: false,
    hasPortfolio: false,
    needsBookingSystem: false,
    metaDescription: '',
    metaKeywords: '',
    designStyles: [],
  });

  const [generatedPageUrl, setGeneratedPageUrl] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [components, setComponents] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    currentComponent: '',
    description: '',
    completedComponents: [],
    totalComponents: 0,
    progress: 0
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // הוספת סטייט לגרסאות
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState('');

  const [projectStructure, setProjectStructure] = useState<ProjectStructure>({
    components: {},
    utils: {},
    types: {},
    packageJson: {
      dependencies: {},
      devDependencies: {}
    }
  });
  
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    currentComponent: '',
    status: 'pending',
    progress: 0
  });

  const [loadedComponents, setLoadedComponents] = useState<{
    [key: string]: (() => JSX.Element) | null;
  }>({});

  const [generationResult, setGenerationResult] = useState<GenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // הוספת סטייט לשלבים
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    // טעינת רשימת הפרויקטים בטעינת הדף
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error('Error loading projects:', err));

    // הוספת useEffect לטעינת הגרסאות
    const loadVersions = async () => {
      try {
        const response = await fetch('/api/versions');
        if (!response.ok) {
          console.error(`${consoleColors.red}❌ [Versions] Error loading versions 🔴${consoleColors.reset}`);
          throw new Error('Error loading versions');
        }
        const data = await response.json();
        setVersions(data.versions);
      } catch (error) {
        console.error(`${consoleColors.red}❌ [Versions] Error loading versions: ${error} 🔴${consoleColors.reset}`);
      }
    };

    loadVersions();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      console.log(`${consoleColors.cyan}🚀 [Form] Submitting form data${consoleColors.green} 🌟${consoleColors.reset}`);
      
      // במקום להשתמש ב-FormData מה-DOM, שאינו מכיל את כל השדות בתצוגה מדורגת,
      // ניצור אובייקט FormData מנתוני ה-state המלאים
      const formDataObj = new FormData();
      
      // הוספת כל השדות החיוניים מה-state
      formDataObj.append('businessName', formData.businessName);
      formDataObj.append('businessType', formData.businessType);
      formDataObj.append('industry', formData.industry);
      formDataObj.append('businessSize', formData.businessSize);
      formDataObj.append('description', formData.description);
      formDataObj.append('language', formData.language);
      formDataObj.append('primaryColor', formData.primaryColor);
      formDataObj.append('secondaryColor', formData.secondaryColor);
      formDataObj.append('typographyStyle', formData.typographyStyle);
      formDataObj.append('animationPreference', formData.animationPreference);
      formDataObj.append('headline', formData.headline);
      formDataObj.append('descriptionText', formData.descriptionText);
      formDataObj.append('ctaText', formData.ctaText);
      formDataObj.append('formFields', formData.formFields);
      
      // הוספת שדות בוליאניים
      formDataObj.append('includeTestimonials', formData.includeTestimonials.toString());
      formDataObj.append('includeFAQ', formData.includeFAQ.toString());
      formDataObj.append('hasProducts', formData.hasProducts.toString());
      formDataObj.append('hasServices', formData.hasServices.toString());
      formDataObj.append('hasPortfolio', formData.hasPortfolio.toString());
      formDataObj.append('needsBookingSystem', formData.needsBookingSystem.toString());
      
      // הוספת מטא-נתונים
      formDataObj.append('metaDescription', formData.metaDescription);
      formDataObj.append('metaKeywords', formData.metaKeywords);
      
      // טיפול בשדות מערך (אם קיימים)
      if (formData.designStyles && formData.designStyles.length > 0) {
        formData.designStyles.forEach((styleId) => {
          formDataObj.append('designStyles', styleId);
        });
      }
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formDataObj,
      });

      if (!response.ok) {
        console.error(`${consoleColors.red}❌ [Form] Error submitting form data 🔴${consoleColors.reset}`);
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error submitting form');
      }

      const data = await response.json();
      
      if (data.error) {
        console.error(`${consoleColors.red}❌ [Form] Server returned error: ${data.error} 🔴${consoleColors.reset}`);
        throw new Error(data.error);
      }

      if (!data.projectName) {
        console.error(`${consoleColors.red}❌ [Form] No project directory returned from server 🔴${consoleColors.reset}`);
        throw new Error('לא התקבל שם פרויקט מהשרת');
      }

      // שמירת תוצאות היצירה
      setGenerationResult({
        projectName: data.projectName,
        status: data.status
      });

      console.log(`${consoleColors.cyan}🚀 [Form] Form submitted successfully${consoleColors.green} 🌟${consoleColors.reset}`);
      
      // הפניה לדף התצוגה המקדימה רק אחרי שיש לנו את כל המידע
      router.push(`/preview/${data.projectName}`);
    } catch (error) {
      console.error(`${consoleColors.red}❌ [Form] Error: ${error} 🔴${consoleColors.reset}`);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRandomFill = () => {
    setFormData(generateRandomData());
  };

  const loadComponents = async (projectName: string) => {
    if (!projectName) return [];

    try {
      // השתמש בשיטה חלופית במקום require.context שמייצר בעיות
      // ניתן לטעון רשימת קומפוננטות מה-API
      const response = await fetch(`/api/components/${projectName}`);
      if (!response.ok) {
        throw new Error('שגיאה בטעינת רשימת הקומפוננטות');
      }
      
      const data = await response.json();
      return data.components || [];
    } catch (error) {
      console.error('שגיאה בטעינת הקומפוננטות:', error);
      return [];
    }
  };

  const handleDependencyInstallation = async (componentName: string, dependencies: ProjectStructure['components'][string]['dependencies']) => {
    if (!dependencies?.length) return true;

    setBuildStatus(prev => ({
      ...prev,
      message: `מתקין חבילות עבור ${componentName}...`,
    }));

    try {
      // קריאה ל-API להתקנת החבילות
      const response = await fetch('/api/install-dependencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: selectedProject,
          dependencies: dependencies.map(dep => ({
            name: dep.name,
            version: dep.version,
            type: dep.type
          }))
        })
      });

      if (!response.ok) {
        throw new Error('שגיאה בהתקנת החבילות');
      }

      const { updatedPackageJson } = await response.json();
      
      // עדכון ה-package.json במבנה הפרויקט
      setProjectStructure(prev => ({
        ...prev,
        packageJson: updatedPackageJson
      }));

      return true;
    } catch (error) {
      console.error('שגיאה בהתקנת החבילות:', error);
      setBuildStatus(prev => ({
        ...prev,
        status: 'error',
        message: `שגיאה בהתקנת החבילות עבור ${componentName}`,
      }));
      return false;
    }
  };

  const loadComponent = async (projectName: string, componentName: string) => {
    if (!componentName || typeof componentName !== 'string') {
      console.error('שם קומפוננטה לא תקין:', componentName);
      return null;
    }

    const componentData = projectStructure.components[componentName];
    if (!componentData) {
      console.error('לא נמצא מידע על הקומפוננטה:', componentName);
      return null;
    }

    // התקנת חבילות נדרשות
    const installSuccess = await handleDependencyInstallation(componentName, componentData.dependencies);
    if (!installSuccess) {
      return null;
    }

    // בדיקה שהקומפוננטה נמצאת ברשימת הקומפוננטות המותרות
    const validComponents = Object.keys(ComponentSkeleton);
    if (!validComponents.includes(componentName)) {
      console.error('קומפוננטה לא מורשית:', componentName);
      return null;
    }

    return () => {
      const SkeletonComponent = ComponentSkeleton[componentName];
      return (
        <div className="component-wrapper">
          <SkeletonComponent />
          <div className="text-center text-sm text-gray-500 mt-2">
            {componentName} (תצוגה זמנית)
          </div>
        </div>
      );
    };
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProjectSelect = async (projectName: string) => {
    try {
      setIsLoading(true);
      setProjectName(projectName);
      setSelectedProject(projectName);
      
      const response = await fetch(`/api/projects/${projectName}`);
      if (!response.ok) {
        throw new Error('Failed to load project data');
      }
      
      const data = await response.json();
      console.log('Loaded project data:', data);
      
      if (data.components && Array.isArray(data.components)) {
        setComponents(data.components);
      }
      
      if (data.formData) {
        setFormData(data.formData);
      }
    } catch (error) {
      console.error('Error loading project:', error);
      // הצג הודעת שגיאה למשתמש
      alert('שגיאה בטעינת הפרויקט. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  // הוספת פונקציה לטעינת גרסה
  const handleVersionSelect = async (version: string) => {
    try {
      console.log(`${consoleColors.cyan}🚀 [Version] Loading version ${version}${consoleColors.green} 🌟${consoleColors.reset}`);
      
      const response = await fetch(`/api/versions/${version}`);
      if (!response.ok) {
        console.error(`${consoleColors.red}❌ [Version] Error loading version ${version} 🔴${consoleColors.reset}`);
        throw new Error('Error loading version');
      }

      const data = await response.json();
      if (!data.components) {
        console.error(`${consoleColors.red}❌ [Version] No components found in version ${version} 🔴${consoleColors.reset}`);
        throw new Error('No components found');
      }

      console.log(`${consoleColors.cyan}🚀 [Version] Version ${version} loaded successfully${consoleColors.green} 🌟${consoleColors.reset}`);
      setComponents(data.components);
    } catch (error) {
      console.error(`${consoleColors.red}❌ [Version] Error: ${error} 🔴${consoleColors.reset}`);
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // פונקציה לטעינת קומפוננטה
  const loadAndCacheComponent = async (componentName: string) => {
    const Component = await loadComponent(selectedProject || '', componentName);
    setLoadedComponents(prev => ({
      ...prev,
      [componentName]: Component
    }));
  };

  const renderPreview = () => {
    return (
      <div className="preview-container">
        {Object.keys(projectStructure.components).map(componentName => {
          if (componentName === buildStatus.currentComponent && buildStatus.status === 'building') {
            const SkeletonComponent = ComponentSkeleton[componentName];
            return (
              <div key={componentName} className="component-wrapper">
                {SkeletonComponent ? (
                  <SkeletonComponent />
                ) : (
                  <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
                )}
                <div className="text-center text-sm text-gray-500 mt-2">
                  {buildStatus.message || `בונה את ${componentName}...`}
                </div>
              </div>
            );
          }

          // בדיקה אם הקומפוננטה כבר נטענה
          if (!loadedComponents[componentName]) {
            // אם לא, מתחיל את תהליך הטעינה
            loadAndCacheComponent(componentName);
            // ומציג skeleton בינתיים
            const SkeletonComponent = ComponentSkeleton[componentName];
            return (
              <div key={componentName} className="component-wrapper">
                {SkeletonComponent ? (
                  <SkeletonComponent />
                ) : (
                  <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
                )}
                <div className="text-center text-sm text-gray-500 mt-2">
                  טוען את {componentName}...
                </div>
              </div>
            );
          }

          // אם הקומפוננטה נטענה, מציג אותה
          const Component = loadedComponents[componentName];
          return Component ? <Component key={componentName} /> : null;
        })}
      </div>
    );
  };

  const steps = [
    "פרטי העסק",
    "סגנון וחוויית משתמש",
    "תוכן",
    "תכונות מתקדמות",
    "סגנונות עיצוב",
    "יצירת האתר"
  ];
  
  // פונקציות ניווט בין השלבים
  const nextStep = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };
  
  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center mb-8">יוצר דפי נחיתה חכם</h1>

      {/* תצוגה מקדימה של הפרויקט */}
      {generationResult && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">תצוגה מקדימה</h2>
          <div className="bg-white rounded-lg shadow-lg p-4">
            <Preview projectDir={generationResult.projectName} />
          </div>
        </div>
      )}

      {/* סטטוס היצירה */}
      {generationResult && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-xl font-semibold mb-2">סטטוס התקדמות</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>קומפוננטות שהושלמו:</span>
                <span>{generationResult?.status?.completedComponents}/{generationResult?.status?.totalComponents}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${generationResult?.status?.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* תצוגת שלבים */}
      {!generationResult && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex justify-between">
            {steps.map((stepName, index) => (
              <div 
                key={index}
                className={`text-sm font-medium ${index <= step ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {stepName}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 h-2 mt-2 rounded-full">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* טופס יצירת דף נחיתה */}
      {!generationResult && (
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={handleRandomFill}
              className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              מלא נתונים רנדומליים
            </button>

            <div className="flex gap-4">
              <select
                value={selectedProject || ''}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="p-2 border rounded-lg"
              >
                <option value="">בחר פרויקט קיים</option>
                {projects.map((project) => (
                  <option key={project.name} value={project.name}>
                    {project.name} ({new Date(project.createdAt).toLocaleDateString('he-IL')})
                  </option>
                ))}
              </select>

              <select
                value={selectedVersion}
                onChange={(e) => handleVersionSelect(e.target.value)}
                className="p-2 border rounded-lg"
              >
                <option value="">בחר גרסה</option>
                {versions?.map((version: string) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* שלב 1 - פרטי העסק */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">שם העסק</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  required
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">סוג העסק</label>
                <input
                  type="text"
                  name="businessType"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  required
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תעשייה</label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  required
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">גודל העסק</label>
                <select 
                  name="businessSize" 
                  value={formData.businessSize}
                  onChange={(e) => handleInputChange('businessSize', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="small">קטן</option>
                  <option value="medium">בינוני</option>
                  <option value="large">גדול</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תיאור</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">שפה</label>
                <select 
                  name="language" 
                  value={formData.language}
                  onChange={(e) => handleInputChange('language', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="he">עברית</option>
                  <option value="en">אנגלית</option>
                </select>
              </div>
            </div>
          )}

          {/* שלב 2 - סגנון וחוויית משתמש */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">צבע ראשי</label>
                  <input
                    type="color"
                    name="primaryColor"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="w-full p-1 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">צבע משני</label>
                  <input
                    type="color"
                    name="secondaryColor"
                    value={formData.secondaryColor}
                    onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                    className="w-full p-1 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">סגנון טיפוגרפיה</label>
                <select 
                  name="typographyStyle" 
                  value={formData.typographyStyle}
                  onChange={(e) => handleInputChange('typographyStyle', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="modern">מודרני</option>
                  <option value="classic">קלאסי</option>
                  <option value="playful">שובבי</option>
                  <option value="minimal">מינימליסטי</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">רמת אנימציות</label>
                <select 
                  name="animationPreference" 
                  value={formData.animationPreference}
                  onChange={(e) => handleInputChange('animationPreference', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="minimal">מינימלית</option>
                  <option value="moderate">בינונית</option>
                  <option value="extensive">מרובה</option>
                </select>
              </div>
            </div>
          )}

          {/* שלב 3 - תוכן */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">כותרת ראשית</label>
                <input
                  type="text"
                  name="headline"
                  value={formData.headline}
                  onChange={(e) => handleInputChange('headline', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">טקסט תיאור</label>
                <textarea
                  name="descriptionText"
                  value={formData.descriptionText}
                  onChange={(e) => handleInputChange('descriptionText', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">טקסט לכפתור קריאה לפעולה</label>
                <input
                  type="text"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={(e) => handleInputChange('ctaText', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">שדות טופס (מופרדים בפסיקים)</label>
                <input
                  type="text"
                  name="formFields"
                  value={formData.formFields}
                  onChange={(e) => handleInputChange('formFields', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="שם, טלפון, אימייל, הודעה"
                />
              </div>
            </div>
          )}

          {/* שלב 4 - תכונות מתקדמות */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="includeTestimonials"
                    id="includeTestimonials"
                    checked={formData.includeTestimonials}
                    onChange={(e) => handleInputChange('includeTestimonials', e.target.checked)}
                    className="ml-2"
                  />
                  <label htmlFor="includeTestimonials">כלול המלצות</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="includeFAQ"
                    id="includeFAQ"
                    checked={formData.includeFAQ}
                    onChange={(e) => handleInputChange('includeFAQ', e.target.checked)}
                    className="ml-2"
                  />
                  <label htmlFor="includeFAQ">כלול שאלות נפוצות</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasProducts"
                    id="hasProducts"
                    checked={formData.hasProducts}
                    onChange={(e) => handleInputChange('hasProducts', e.target.checked)}
                    className="ml-2"
                  />
                  <label htmlFor="hasProducts">יש מוצרים</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasServices"
                    id="hasServices"
                    checked={formData.hasServices}
                    onChange={(e) => handleInputChange('hasServices', e.target.checked)}
                    className="ml-2"
                  />
                  <label htmlFor="hasServices">יש שירותים</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="hasPortfolio"
                    id="hasPortfolio"
                    checked={formData.hasPortfolio}
                    onChange={(e) => handleInputChange('hasPortfolio', e.target.checked)}
                    className="ml-2"
                  />
                  <label htmlFor="hasPortfolio">יש תיק עבודות</label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="needsBookingSystem"
                    id="needsBookingSystem"
                    checked={formData.needsBookingSystem}
                    onChange={(e) => handleInputChange('needsBookingSystem', e.target.checked)}
                    className="ml-2"
                  />
                  <label htmlFor="needsBookingSystem">צריך מערכת הזמנות</label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">מילות מפתח למטא (SEO)</label>
                <input
                  type="text"
                  name="metaKeywords"
                  value={formData.metaKeywords}
                  onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="מילות מפתח, מופרדות, בפסיקים"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">תיאור מטא (SEO)</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  rows={2}
                  placeholder="תיאור קצר של האתר עבור מנועי חיפוש"
                />
              </div>
            </div>
          )}

          {/* שלב 5 - סגנונות עיצוב */}
          {step === 4 && (
            <StyleSelector
              selectedStyles={formData.designStyles || []}
              onChange={(styles) => handleInputChange('designStyles', styles)}
              direction={formData.language === 'he' ? 'rtl' : 'ltr'}
            />
          )}

          {/* שלב 6 - יצירת האתר */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-xl font-semibold mb-2">מוכן ליצירת האתר!</h3>
                <p className="text-gray-700">
                  כל הפרטים הוזנו בהצלחה. לחץ על כפתור "צור דף נחיתה" כדי להתחיל בתהליך היצירה.
                </p>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">שם העסק:</span>
                    <span>{formData.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">סוג העסק:</span>
                    <span>{formData.businessType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">צבעים:</span>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.primaryColor }}></div>
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: formData.secondaryColor }}></div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">סגנונות עיצוב שנבחרו:</span>
                    <span>
                      {formData.designStyles?.length 
                        ? formData.designStyles.length
                        : 'ללא סגנון ספציפי'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* כפתורי ניווט בין השלבים */}
          <div className="flex justify-between mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                הקודם
              </button>
            )}
            
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 ml-auto"
              >
                הבא
              </button>
            ) : (
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {isGenerating ? 'יוצר דף נחיתה...' : 'צור דף נחיתה'}
              </button>
            )}
          </div>
        </form>
      )}

      {error && (
        <div className="text-red-600 text-center mt-4">
          {error}
        </div>
      )}
    </main>
  );
}
