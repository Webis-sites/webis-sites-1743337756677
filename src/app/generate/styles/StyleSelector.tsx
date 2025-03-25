'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { stylePrompts } from './prompts';

interface StyleSelectorProps {
  selectedStyles: string[];
  onChange: (styles: string[]) => void;
  direction?: 'rtl' | 'ltr';
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  selectedStyles, 
  onChange,
  direction = 'rtl'
}) => {
  const [showMore, setShowMore] = useState(false);
  const displayStyles = showMore ? stylePrompts : stylePrompts.slice(0, 6);

  const toggleStyle = (styleId: string) => {
    const isSelected = selectedStyles.includes(styleId);
    let updatedStyles: string[];
    
    if (isSelected) {
      updatedStyles = selectedStyles.filter(id => id !== styleId);
    } else {
      updatedStyles = [...selectedStyles, styleId];
    }
    
    onChange(updatedStyles);
  };

  return (
    <div className={`w-full ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      <h3 className="text-xl font-semibold mb-3">בחר סגנונות עיצוב</h3>
      <p className="text-gray-600 mb-4">
        בחר סגנון אחד או יותר כדי להגדיר את החוויה הויזואלית של האתר שלך
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {displayStyles.map((style) => (
          <div 
            key={style.id}
            onClick={() => toggleStyle(style.id)}
            className={`
              relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer
              ${selectedStyles.includes(style.id) 
                ? 'border-blue-500 ring-2 ring-blue-300' 
                : 'border-gray-200 hover:border-gray-300'}
            `}
          >
            <div className="relative h-40 w-full">
              {style.imageUrl && (
                <Image
                  src={style.imageUrl}
                  alt={style.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              )}
              {selectedStyles.includes(style.id) && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <div className="p-4 bg-white">
              <h4 className="font-medium text-lg">{style.name}</h4>
              <p className="text-gray-600 text-sm mt-1">{style.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {stylePrompts.length > 6 && (
        <button
          onClick={() => setShowMore(!showMore)}
          className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {showMore ? 'הצג פחות סגנונות' : 'הצג עוד סגנונות'}
        </button>
      )}
      
      {selectedStyles.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="font-medium mb-2">סגנונות נבחרים:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedStyles.map(styleId => {
              const style = stylePrompts.find(s => s.id === styleId);
              return style ? (
                <span 
                  key={styleId}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {style.name}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStyle(styleId);
                    }}
                    className="ml-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleSelector; 