import { GenerationStatus } from './components/GenerationStatus';

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);
  setSuccess(false);
  
  try {
    // יצירת FormData
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, value.join(','));
      } else if (typeof value === 'boolean') {
        formData.append(key, value ? 'on' : 'off');
      } else {
        formData.append(key, value as string);
      }
    });
    
    // שליחת הבקשה לשרת
    const response = await fetch('/api/generate', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'שגיאה ביצירת האתר');
    }
    
    const data = await response.json();
    
    // שמירת המידע על הפרויקט
    setProjectData(data);
    setSuccess(true);
    
    // אם יש URL של האתר, נציג אותו
    if (data.deployedUrl) {
      setDeployedUrl(data.deployedUrl);
    }
    
    // אם יש שגיאות בקומפוננטות, נציג אותן
    if (data.components.some((c: any) => c.status === 'failed')) {
      setComponentErrors(data.components.filter((c: any) => c.status === 'failed'));
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'שגיאה לא צפויה');
  } finally {
    setIsLoading(false);
  }
};

export default function GeneratePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [componentErrors, setComponentErrors] = useState<any[]>([]);
  
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <GenerationStatus
        isLoading={isLoading}
        error={error}
        success={success}
        projectData={projectData}
        deployedUrl={deployedUrl}
        componentErrors={componentErrors}
      />
      {/* ... rest of the JSX ... */}
    </div>
  );
} 