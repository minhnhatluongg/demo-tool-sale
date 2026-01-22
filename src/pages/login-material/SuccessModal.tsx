import React from 'react';

interface SuccessModalProps {
  isVisible: boolean;
  username: string;
  isDark: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isVisible, username, isDark }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-md p-8 rounded-2xl shadow-2xl transform transition-all animate-scaleIn ${
        isDark ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-green-400 opacity-20 animate-ping"></div>
          </div>
        </div>

        {/* Success Text */}
        <h3 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Đăng nhập thành công!
        </h3>
        <p className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Chào mừng bạn trở lại, <span className="font-semibold text-purple-600">{username}</span>
        </p>

        {/* Loading Bar */}
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 animate-loadingBar"></div>
        </div>
        <p className={`text-sm text-center mt-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          Đang chuyển hướng...
        </p>
      </div>
    </div>
  );
};

export default SuccessModal;