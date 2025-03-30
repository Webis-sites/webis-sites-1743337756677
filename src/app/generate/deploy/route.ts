async function validateBuild(projectPath: string): Promise<{ success: boolean; error?: string }> {
  try {
    logger.info('🔍 בודק את תקינות ה-build...');
    
    // ניסיון build
    const buildResult = await execCommand('npm run build', {
      cwd: projectPath,
    });
    
    if (buildResult.exitCode !== 0) {
      logger.error(`❌ נכשל ה-build: ${buildResult.stderr}`);
      return { 
        success: false, 
        error: buildResult.stderr 
      };
    }
    
    // מחיקת תיקיית ה-build
    await execCommand('rm -rf .next', {
      cwd: projectPath,
    });
    
    logger.info('✅ ה-build עבר בהצלחה');
    return { success: true };
  } catch (error) {
    logger.error(`❌ שגיאה בבדיקת ה-build: ${error}`);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function generateComponent(projectPath: string, componentName: string, componentData: any): Promise<void> {
  try {
    // יצירת הקומפוננטה
    await createComponent(projectPath, componentName, componentData);
    
    // בדיקת build
    const buildValidation = await validateBuild(projectPath);
    if (!buildValidation.success) {
      logger.error(`❌ נכשל ה-build עבור הקומפוננטה ${componentName}`);
      logger.error(`שגיאה: ${buildValidation.error}`);
      
      // כאן נוכל להוסיף לוגיקה לתיקון הקומפוננטה במקרה של שגיאה
      await fixComponentBuildIssues(projectPath, componentName, buildValidation.error);
      
      // בדיקה חוזרת של ה-build
      const retryValidation = await validateBuild(projectPath);
      if (!retryValidation.success) {
        throw new Error(`לא הצלחנו לתקן את בעיות ה-build בקומפוננטה ${componentName}`);
      }
    }
    
    logger.info(`✅ הקומפוננטה ${componentName} נוצרה ונבדקה בהצלחה`);
  } catch (error) {
    throw new Error(`נכשלה יצירת הקומפוננטה ${componentName}: ${error.message}`);
  }
}

async function fixComponentBuildIssues(projectPath: string, componentName: string, buildError: string): Promise<void> {
  logger.info(`🔧 מנסה לתקן בעיות build בקומפוננטה ${componentName}`);
  
  // בדיקה אם השגיאה קשורה ל-props חסרים
  if (buildError.includes('missing the following properties')) {
    const missingProps = buildError.match(/missing the following properties[^:]*: ([^']*)/)?.[1].split(', ');
    if (missingProps) {
      await addMissingPropsToComponent(projectPath, componentName, missingProps);
    }
  }
  
  // כאן אפשר להוסיף טיפול בסוגים נוספים של שגיאות build
}

async function addMissingPropsToComponent(projectPath: string, componentName: string, missingProps: string[]): Promise<void> {
  const pagePath = `${projectPath}/src/app/page.tsx`;
  const pageContent = await fs.readFile(pagePath, 'utf-8');
  
  // מציאת השורה עם הקומפוננטה
  const componentRegex = new RegExp(`<${componentName}[^>]*\/>`, 'g');
  let updatedContent = pageContent.replace(componentRegex, (match) => {
    // הוספת ה-props החסרים עם ערכי ברירת מחדל
    const propsString = missingProps.map(prop => {
      switch(prop) {
        case 'gymName':
          return `gymName="מכון כושר ביתא"`;
        case 'address':
          return `address="רחוב הרצל 123, תל אביב"`;
        case 'coordinates':
          return `coordinates={{ lat: 32.0853, lng: 34.7818 }}`;
        case 'operatingHours':
          return `operatingHours={[
            { day: 'ראשון - חמישי', hours: '06:00 - 23:00' },
            { day: 'שישי', hours: '07:00 - 16:00' },
            { day: 'שבת', hours: '08:00 - 14:00' }
          ]}`;
        case 'transportationInfo':
          return `transportationInfo={[
            'קווי אוטובוס: 5, 18, 61, 72',
            'תחנת רכבת: במרחק 10 דקות הליכה',
            'חניה: חניון ציבורי צמוד למכון'
          ]}`;
        default:
          return `${prop}=""`;
      }
    }).join(' ');
    
    return `<${componentName} ${propsString} />`;
  });
  
  await fs.writeFile(pagePath, updatedContent, 'utf-8');
  logger.info(`✅ הוספו ה-props החסרים לקומפוננטה ${componentName}`);
} 