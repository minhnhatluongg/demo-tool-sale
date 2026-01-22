import React from 'react';

interface LoginIllustrationProps {
  isDark: boolean;
}

const LoginIllustration: React.FC<LoginIllustrationProps> = ({ isDark }) => {
  return (
    <div className="hidden md:flex flex-col items-center justify-center p-8">
      <div className="relative w-full max-w-md">
        {/* Decorative circles */}
        <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl ${
          isDark ? 'bg-purple-600/30' : 'bg-blue-400/30'
        } animate-pulse`} style={{animationDuration: '3s'}}></div>
        <div className={`absolute bottom-0 right-0 w-40 h-40 rounded-full blur-2xl ${
          isDark ? 'bg-pink-600/30' : 'bg-purple-400/30'
        } animate-pulse`} style={{animationDuration: '4s', animationDelay: '1s'}}></div>

        {/* Main Illustration */}
        <div className="relative">
          <svg viewBox="0 0 400 400" className="w-full h-auto drop-shadow-2xl">
            {/* Background Circle */}
            <circle cx="200" cy="200" r="180" fill={isDark ? '#1e293b' : '#ffffff'} opacity="0.8"/>

            {/* Document Icon */}
            <rect x="120" y="80" width="160" height="220" rx="8" fill={isDark ? '#334155' : '#e2e8f0'}/>
            <rect x="120" y="80" width="160" height="50" rx="8" fill={isDark ? '#7c3aed' : '#8b5cf6'}/>

            {/* Document Lines */}
            <line x1="140" y1="150" x2="260" y2="150" stroke={isDark ? '#64748b' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round"/>
            <line x1="140" y1="170" x2="240" y2="170" stroke={isDark ? '#64748b' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round"/>
            <line x1="140" y1="190" x2="260" y2="190" stroke={isDark ? '#64748b' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round"/>
            <line x1="140" y1="210" x2="220" y2="210" stroke={isDark ? '#64748b' : '#cbd5e1'} strokeWidth="4" strokeLinecap="round"/>

            {/* Checkmark Circle */}
            <circle cx="320" cy="280" r="40" fill={isDark ? '#10b981' : '#34d399'} className="animate-pulse" style={{animationDuration: '2s'}}/>
            <path d="M 305 280 L 315 290 L 335 270" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

            {/* Lock Icon */}
            <rect x="80" y="140" width="40" height="50" rx="4" fill={isDark ? '#6366f1' : '#818cf8'}/>
            <circle cx="100" cy="125" r="15" stroke={isDark ? '#6366f1' : '#818cf8'} strokeWidth="6" fill="none"/>
          </svg>
        </div>
      </div>

      <div className="mt-8 text-center">
        <h2 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          WinInvoice System For SALE
        </h2>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Quản lý hóa đơn thông minh, hiệu quả
        </p>
      </div>
    </div>
  );
};

export default LoginIllustration;