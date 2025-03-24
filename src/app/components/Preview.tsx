import { useState, useEffect } from 'react';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m'
};

interface PreviewProps {
  projectName: string;
}

interface PreviewStatus {
  status: 'loading' | 'running' | 'error';
  url?: string;
  error?: string;
}

export default function Preview({ projectName }: PreviewProps) {
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>({ status: 'loading' });

  useEffect(() => {
    const startPreview = async () => {
      try {
        if (!projectName) {
          console.error(`${colors.red}❌ [Preview] Invalid project name: ${projectName} 🔴${colors.reset}`);
          throw new Error('שם פרויקט לא תקין');
        }

        console.log(`${colors.cyan}🚀 [Preview] Starting preview for ${projectName}${colors.green} 🌟${colors.reset}`);
        
        const response = await fetch(`/api/preview/${projectName}`, {
          method: 'GET'
        });

        if (!response.ok) {
          console.error(`${colors.red}❌ [Preview] Error getting server response for ${projectName} 🔴${colors.reset}`);
          throw new Error('Error starting preview');
        }

        const data = await response.json();
        
        if (data.status === 'started') {
          console.log(`${colors.cyan}🚀 [Preview] Preview started successfully for ${projectName}${colors.green} 🌟${colors.reset}`);
          setPreviewStatus({
            status: 'running',
            url: data.url
          });
        } else {
          console.error(`${colors.red}❌ [Preview] Error starting preview: ${data.error} 🔴${colors.reset}`);
          throw new Error(data.error || 'Unknown error');
        }
      } catch (error) {
        console.error(`${colors.red}❌ [Preview] Error starting preview: ${error} 🔴${colors.reset}`);
        setPreviewStatus({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    if (projectName) {
      startPreview();
    }

    // Cleanup when leaving component
    return () => {
      if (projectName) {
        console.log(`${colors.cyan}🚀 [Preview] Cleaning up preview for ${projectName}${colors.green} 🌟${colors.reset}`);
        fetch(`/api/preview/${projectName}`, {
          method: 'DELETE'
        }).catch(error => {
          console.error(`${colors.red}❌ [Preview] Error cleaning up preview: ${error} 🔴${colors.reset}`);
        });
      }
    };
  }, [projectName]);

  if (previewStatus.status === 'loading') {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="mr-3">טוען תצוגה מקדימה...</span>
      </div>
    );
  }

  if (previewStatus.status === 'error') {
    return (
      <div className="text-red-500 p-4 text-center">
        <p>שגיאה בטעינת התצוגה המקדימה:</p>
        <p>{previewStatus.error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] border border-gray-200 rounded-lg overflow-hidden">
      <iframe
        src={previewStatus.url}
        className="w-full h-full"
        title="תצוגה מקדימה של דף הנחיתה"
      />
    </div>
  );
} 