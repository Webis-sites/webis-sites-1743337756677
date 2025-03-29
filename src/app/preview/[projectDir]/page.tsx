'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface ProjectStatus {
  completedComponents: number;
  totalComponents: number;
  importedComponents: string[];
  pageReady: boolean;
  progress: number;
}

interface ProjectStructure {
  [key: string]: any;
}

export default function PreviewPage() {
  const params = useParams();
  const projectDir = params?.projectDir as string;
  const [status, setStatus] = useState<ProjectStatus | null>(null);
  const [structure, setStructure] = useState<ProjectStructure | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVercelError, setIsVercelError] = useState<boolean>(false);

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        if (!projectDir) {
          setError('שם הפרויקט חסר');
          return;
        }

        const response = await fetch(`/api/generate/preview?project=${encodeURIComponent(projectDir)}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'שגיאה בטעינת הפרויקט');
        }

        const data = await response.json();
        setStatus(data.status);
        setStructure(data.structure);
        
        // בדוק אם יש שגיאת Vercel
        if (data.deploymentError && 
            (data.deploymentError.includes('Vercel CLI is not authenticated') || 
             data.deploymentError.includes('VERCEL_TOKEN is not set'))) {
          setIsVercelError(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'שגיאה לא ידועה');
      }
    };

    if (projectDir) {
      fetchProjectData();
    }
  }, [projectDir]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-4 rounded-lg">
          <h1 className="text-red-600 text-xl font-bold mb-2">שגיאה</h1>
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">תצוגה מקדימה של הפרויקט</h1>
        
        {isVercelError && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="mr-3">
                <p className="text-sm text-yellow-700">
                  <strong>הערה:</strong> האתר זמין כרגע רק בתצוגה מקומית מכיוון שאין הרשאות Vercel.
                  <br />להתקנת Vercel CLI, הריצו <code className="bg-gray-100 px-1 py-0.5 rounded">npm i -g vercel</code> ואז <code className="bg-gray-100 px-1 py-0.5 rounded">vercel login</code>.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">סטטוס התקדמות</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>קומפוננטות שהושלמו:</span>
              <span>{status.completedComponents}/{status.totalComponents}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${status.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {structure && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">מבנה הפרויקט</h2>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
              {JSON.stringify(structure, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 