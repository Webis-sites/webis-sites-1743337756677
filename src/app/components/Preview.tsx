import { useState, useEffect, useRef } from 'react';

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

interface ComponentStatus {
  name: string;
  type: string;
  description?: string;
  status: 'completed' | 'failed' | 'pending';
  error?: string;
}

export default function Preview({ projectName }: PreviewProps) {
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>({ status: 'loading' });
  const [projectData, setProjectData] = useState<any>(null);
  const [components, setComponents] = useState<ComponentStatus[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [newComponents, setNewComponents] = useState<string[]>([]);
  const [isSiteReady, setIsSiteReady] = useState<boolean>(false);
  const [allowScroll, setAllowScroll] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Helper function to add logs
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`].slice(-10));
  };

  // Function to initialize site preview
  const initSitePreview = async () => {
    try {
      addLog('מתחיל להכין את התצוגה המקדימה של האתר');
      
      // הכן את האתר להצגה במסגרת iframe
      const response = await fetch('/api/generate/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDir: projectName })
      });
      
      if (!response.ok) {
        throw new Error('שגיאה בהכנת תצוגה מקדימה');
      }
      
      const data = await response.json();
      setPreviewUrl(data.url);
      setIsSiteReady(true);
      addLog(`האתר מוכן לתצוגה: ${data.url}`);
      
    } catch (error) {
      addLog(`שגיאה בהכנת תצוגה מקדימה: ${error instanceof Error ? error.message : String(error)}`);
      setIsSiteReady(false);
    }
  };

  // Function to scroll iframe to a specific component
  const scrollToComponent = (componentName: string) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    try {
      const iframe = iframeRef.current;
      const iframeWindow = iframe.contentWindow;
      
      addLog(`גולל אל קומפוננטה: ${componentName}`);
      
      // חכה שהדף ייטען באופן מלא
      setTimeout(() => {
        try {
          if (!iframeWindow || !iframeWindow.document) {
            addLog(`iframeWindow או document לא זמינים`);
            return;
          }

          // מצא את האלמנט לפי שם הקומפוננטה
          const targetElement = iframeWindow.document.querySelector(`[data-component="${componentName}"]`);
          
          if (targetElement) {
            // גלול אל האלמנט
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // הדגש את הקומפוננטה החדשה
            targetElement.classList.add('highlight-new-component');
            setTimeout(() => {
              targetElement.classList.remove('highlight-new-component');
            }, 3000);
          } else {
            // נסה למצוא אלמנט לפי מאפיינים אחרים
            const possibleElement = iframeWindow.document.querySelector(`.${componentName}`) || 
                                   iframeWindow.document.getElementById(componentName);
            
            if (possibleElement) {
              possibleElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              addLog(`לא נמצא אלמנט עבור קומפוננטה: ${componentName}`);
            }
          }
        } catch (error) {
          addLog(`שגיאה בגלילה לקומפוננטה: ${error instanceof Error ? error.message : String(error)}`);
        }
      }, 1000);
    } catch (error) {
      addLog(`שגיאה בגישה ל-iframe: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Function to fetch project structure and components
  const fetchProjectData = async () => {
    try {
      if (!projectName) {
        addLog(`Invalid project name: ${projectName}`);
        throw new Error('שם פרויקט לא תקין');
      }

      addLog(`Fetching data for project: ${projectName}`);
      const response = await fetch(`/api/generate/preview?project=${projectName}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`Error response from preview API: ${errorText}`);
        throw new Error(`Error fetching project data: ${response.status}`);
      }
      
      const data = await response.json();
      addLog(`Received project data: ${data.projectDir || 'unknown'}`);
      setProjectData(data);
      
      // Check if we have component status data from another endpoint
      const statusUrl = `/api/generate/status?project=${projectName}`;
      addLog(`Fetching status from: ${statusUrl}`);
      const statusResponse = await fetch(statusUrl);
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        addLog(`Status data received: ${statusData.components?.length || 0} components`);
        
        if (statusData.components) {
          // בדוק אם יש קומפוננטות חדשות שהושלמו
          interface ComponentItem {
            name: string;
            status: string;
          }
          
          const prevComponents = components.filter((c: ComponentStatus) => c.status === 'completed').map((c: ComponentStatus) => c.name);
          const newlyCompleted = statusData.components
            .filter((c: ComponentItem) => c.status === 'completed')
            .filter((c: ComponentItem) => !prevComponents.includes(c.name))
            .map((c: ComponentItem) => c.name);
          
          if (newlyCompleted.length > 0) {
            setNewComponents(newlyCompleted);
            // אם יש קומפוננטה חדשה שהושלמה, גלול אליה
            if (isSiteReady && newlyCompleted.length > 0) {
              scrollToComponent(newlyCompleted[0]);
            }
          }
          
          setComponents(statusData.components);
          
          // עדכן את מונה הקומפוננטות
          const completed = statusData.components.filter((c: ComponentItem) => c.status === 'completed').length;
          const total = statusData.components.length;
          setCompletedCount(completed);
          setTotalCount(total);
          
          // אם כל הקומפוננטות הושלמו, אפשר גלילה
          if (completed === total && total > 0) {
            setAllowScroll(true);
          }
        }
      } else {
        const errorText = await statusResponse.text();
        addLog(`Error from status API: ${errorText}`);
      }
      
      setPreviewStatus({
        status: 'running',
        url: `/api/generate/preview?project=${projectName}`
      });
      
      // אם האתר עדיין לא מוכן, הכן אותו
      if (!isSiteReady) {
        initSitePreview();
      }
    } catch (error) {
      addLog(`Error in fetchProjectData: ${error instanceof Error ? error.message : String(error)}`);
      setPreviewStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    // הוסף CSS בראש העמוד לחסימת גלילה
    const style = document.createElement('style');
    style.innerHTML = `
      .no-scroll {
        overflow: hidden !important;
      }
      
      .iframe-container {
        position: relative;
        width: 100%;
        height: 0;
        padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
        overflow: hidden;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      .iframe-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }
      
      @keyframes highlight {
        0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
        70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
      }
      
      .highlight-new-component {
        animation: highlight 2s ease-in-out;
      }
    `;
    document.head.appendChild(style);
    
    // חסום גלילה בגוף העמוד
    if (!allowScroll) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.head.removeChild(style);
      document.body.classList.remove('no-scroll');
    };
  }, [allowScroll]);

  useEffect(() => {
    // Initial fetch
    if (projectName) {
      addLog(`Initializing preview for project: ${projectName}`);
      fetchProjectData();
      
      // Set up polling to refresh data every 3 seconds
      const interval = setInterval(fetchProjectData, 3000);
      setPollingInterval(interval);
    } else {
      addLog('No project name provided');
      setPreviewStatus({
        status: 'error',
        error: 'שם פרויקט לא סופק'
      });
    }

    // Cleanup when leaving component
    return () => {
      if (pollingInterval) {
        addLog('Cleaning up polling interval');
        clearInterval(pollingInterval);
      }
    };
  }, [projectName]);

  if (previewStatus.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
        <span className="mb-2">טוען תצוגה מקדימה...</span>
        <div className="text-xs text-gray-500">{projectName}</div>
      </div>
    );
  }

  if (previewStatus.status === 'error') {
    return (
      <div className="flex flex-col p-4 text-center">
        <div className="text-red-500">
          <p className="font-bold text-lg mb-2">שגיאה בטעינת התצוגה המקדימה:</p>
          <p className="mb-4">{previewStatus.error}</p>
        </div>
        <div className="border rounded p-2 bg-gray-50 mt-2 text-left text-xs font-mono">
          <div className="font-bold mb-1">לוגים אחרונים:</div>
          {logs.map((log, i) => (
            <div key={i} className="text-gray-700">{log}</div>
          ))}
        </div>
        <button 
          onClick={fetchProjectData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  // Render live preview
  const renderLivePreview = () => {
    if (!isSiteReady || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg font-medium">מכין את תצוגת האתר...</p>
          <p className="text-sm text-gray-500 mt-2">אנו עובדים על הכנת האתר לתצוגה, אנא המתן</p>
        </div>
      );
    }
    
    return (
      <div className="relative">
        <div className="iframe-container">
          <iframe 
            ref={iframeRef}
            src={previewUrl}
            title="תצוגה מקדימה של האתר"
            className="w-full"
          />
        </div>
        {!allowScroll && (
          <div className="absolute bottom-4 left-0 right-0 text-center">
            <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              <span className="mr-1">⚠️</span>
              בניית האתר בתהליך, הגלילה חסומה עד להשלמה
            </div>
          </div>
        )}
      </div>
    );
  };

  // Project info display
  const renderProjectInfo = () => {
    if (!projectData) return null;
    
    return (
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-bold mb-2">מידע על הפרויקט</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">שם הפרויקט: </span>
            <span>{projectData.projectDir}</span>
          </div>
          <div>
            <span className="font-semibold">התקדמות: </span>
            <span>{`${completedCount}/${totalCount} (${Math.round((completedCount / Math.max(totalCount, 1)) * 100)}%)`}</span>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${Math.round((completedCount / Math.max(totalCount, 1)) * 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  // Render skeleton for components
  const renderComponentSkeletons = () => {
    if (!components || components.length === 0) {
      return (
        <div className="space-y-6 py-8">
          <div className="text-center text-gray-500 pb-4">
            טוען מידע על קומפוננטות...
          </div>
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-md mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-8 py-6">
        {components.map((component, index) => (
          <div 
            key={index} 
            className={`border rounded-lg p-4 ${
              component.status === 'failed' ? 'border-red-400 bg-red-50' : 
              component.status === 'completed' ? 'border-green-400 bg-green-50' : 
              'border-gray-200'
            } ${newComponents.includes(component.name) ? 'animate-pulse' : ''}`}
          >
            <div className="flex items-center mb-2">
              <span className="font-semibold">{component.name}</span>
              <span className="mr-2 text-sm text-gray-500">({component.type})</span>
              {component.status === 'completed' && (
                <span className="mr-2 text-green-500">✅</span>
              )}
              {component.status === 'failed' && (
                <span className="mr-2 text-red-500">❌</span>
              )}
              {component.status === 'pending' && (
                <div className="mr-2 animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              )}
              
              {component.status === 'completed' && (
                <button 
                  onClick={() => scrollToComponent(component.name)}
                  className="mr-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded transition-colors"
                >
                  צפה
                </button>
              )}
            </div>
            
            {component.description && (
              <div className="text-sm text-gray-600 mb-2">{component.description}</div>
            )}
            
            {component.status === 'pending' && (
              <div className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-md"></div>
              </div>
            )}
            
            {component.status === 'failed' && component.error && (
              <div className="mt-2 text-xs text-red-500 p-2 bg-red-50 rounded">
                {component.error}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold">תצוגה מקדימה של הדף</h3>
        <p className="text-sm text-gray-500">בניית דף הנחיתה בתהליך. תצוגה תתעדכן אוטומטית.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
        <div className="md:col-span-2">
          {renderLivePreview()}
        </div>
        
        <div className="md:col-span-1">
          {renderProjectInfo()}
          {renderComponentSkeletons()}
          
          {logs.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <details className="text-xs">
                <summary className="font-semibold cursor-pointer">לוגים אחרונים</summary>
                <div className="mt-2 bg-gray-50 p-2 rounded font-mono">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 