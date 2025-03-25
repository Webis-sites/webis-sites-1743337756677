'use client';

import { useParams } from 'next/navigation';
import Preview from '../../components/Preview';

export default function PreviewPage() {
  const params = useParams();
  const projectName = params.projectName as string;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-right">תצוגה מקדימה של דף הנחיתה</h1>
        <p className="text-gray-600 text-right">צפה בדף הנחיתה בזמן שהוא נבנה</p>
      </div>
      
      {projectName ? (
        <Preview projectName={projectName} />
      ) : (
        <div className="text-center p-8 bg-red-50 text-red-700 rounded-lg">
          שם הפרויקט חסר בכתובת ה-URL
        </div>
      )}
    </div>
  );
} 