import React from 'react';

interface LoginIllustrationProps {
  isDark: boolean;
}

const LoginIllustration: React.FC<LoginIllustrationProps> = ({ isDark }) => {
  return (
    <div className="hidden md:flex flex-col items-center justify-center p-8">
      <div className="relative w-full max-w-md">
        {/* Decorative circles */}
        <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl ${isDark ? 'bg-purple-600/30' : 'bg-blue-400/30'
          } animate-pulse`} style={{ animationDuration: '3s' }}></div>
        <div className={`absolute bottom-0 right-0 w-40 h-40 rounded-full blur-2xl ${isDark ? 'bg-pink-600/30' : 'bg-purple-400/30'
          } animate-pulse`} style={{ animationDuration: '4s', animationDelay: '1s' }}></div>

        {/* WINtech Logo */}
        <div className="relative flex items-center justify-center">
          <div className={`absolute inset-0 rounded-3xl blur-xl ${isDark ? 'bg-gradient-to-br from-purple-600/20 to-pink-600/20' : 'bg-gradient-to-br from-blue-400/20 to-purple-400/20'
            } animate-pulse`} style={{ animationDuration: '3s' }}></div>

          <div className={`relative p-8 rounded-3xl backdrop-blur-sm ${isDark ? 'bg-slate-800/50' : 'bg-white/50'
            } shadow-2xl transform hover:scale-105 transition-transform duration-300`}>
            <img
              src="/images/logowinerp.png"
              alt="WINtech Logo - Step to Success"
              className="w-full h-auto drop-shadow-2xl"
              style={{
                filter: isDark ? 'brightness(1.1)' : 'brightness(1)',
                maxWidth: '400px'
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 text-center space-y-4">
        <h2 className={`text-4xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'
          } animate-fade-in`}>
          WinInvoice System For SALE
        </h2>
        <p className={`text-xl font-medium ${isDark ? 'text-purple-300' : 'text-blue-600'
          }`}>
          Step to Success
        </p>
        <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
          Quản lý hóa đơn thông minh, hiệu quả
        </p>
      </div>
    </div>
  );
};

export default LoginIllustration;