import React from 'react';

interface GenerationStatusProps {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  projectData: any;
  deployedUrl: string | null;
  componentErrors: any[];
}

export const GenerationStatus: React.FC<GenerationStatusProps> = ({
  isLoading,
  error,
  success,
  projectData,
  deployedUrl,
  componentErrors
}) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-4">יוצר את האתר שלך...</h2>
            <p className="text-gray-600">זה יכול לקחת כמה דקות. אנא המתן.</p>
            {projectData?.status && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{ width: `${projectData.status.progress}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  התקדמות: {projectData.status.progress}% ({projectData.status.completedComponents} מתוך {projectData.status.totalComponents} קומפוננטות)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-4">שגיאה</h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="text-green-500 text-4xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-4">האתר נוצר בהצלחה!</h2>
            {deployedUrl ? (
              <div>
                <p className="text-gray-600 mb-4">האתר שלך זמין בכתובת:</p>
                <a 
                  href={deployedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline"
                >
                  {deployedUrl}
                </a>
              </div>
            ) : (
              <p className="text-gray-600">האתר שלך מוכן! תוכל למצוא אותו בתיקיית הפרויקט.</p>
            )}
            {componentErrors.length > 0 && (
              <div className="mt-4 text-left">
                <h3 className="font-bold text-red-500 mb-2">שגיאות בקומפוננטות:</h3>
                <ul className="list-disc list-inside">
                  {componentErrors.map((error, index) => (
                    <li key={index} className="text-gray-600">
                      {error.name}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 