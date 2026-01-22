import React from 'react';

interface BackgroundElementsProps {
  isDark: boolean;
}

const BackgroundElements: React.FC<BackgroundElementsProps> = ({ isDark }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-20 animate-pulse ${
        isDark ? 'bg-purple-500' : 'bg-blue-400'
      }`} style={{animationDuration: '4s'}}></div>
      <div className={`absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl opacity-20 animate-pulse ${
        isDark ? 'bg-pink-500' : 'bg-purple-400'
      }`} style={{animationDuration: '6s', animationDelay: '1s'}}></div>
      <div className={`absolute top-1/2 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-10 animate-pulse ${
        isDark ? 'bg-blue-500' : 'bg-pink-400'
      }`} style={{animationDuration: '5s', animationDelay: '2s'}}></div>
    </div>
  );
};

export default BackgroundElements;