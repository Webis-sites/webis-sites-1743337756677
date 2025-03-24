'use client';

import { useEffect, useState } from 'react';

// קומפוננטה שמציגה את הקוד כמו במסך מחשב
function DesktopFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* חלק עליון של המסך - כמו שורת כותרת של חלון */}
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-sm text-gray-400">תצוגה מקדימה</div>
          </div>
        </div>
        
        {/* תוכן המסך */}
        <div className="bg-white h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

interface PreviewData {
  page: string;
  data: {
    businessName: string;
    language?: string;
    // ... יתר השדות
  };
}

export default function Preview({ params }: { params: { projectName: string } }) {
  const { projectName } = params;
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    // קריאת תוכן דף ה-page.tsx והנתונים
    fetch(`/api/preview/${projectName}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('שגיאה בטעינת התצוגה המקדימה');
        }
        return res.json();
      })
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setPreviewData(data);
      })
      .catch(err => {
        console.error('שגיאה בטעינת התצוגה המקדימה:', err);
        setError(err.message);
      });
  }, [projectName]);
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <DesktopFrame>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">שגיאה</h1>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </DesktopFrame>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <DesktopFrame>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">טוען תצוגה מקדימה...</p>
            </div>
          </div>
        </DesktopFrame>
      </div>
    );
  }

  // הצגת הדף שנטען בתוך מסגרת הדפדפן
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <DesktopFrame>
        <div 
          className="min-h-full"
          dir={previewData?.data?.language === 'he' ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{ __html: previewData?.page }}
        />
      </DesktopFrame>
    </div>
  );
} 