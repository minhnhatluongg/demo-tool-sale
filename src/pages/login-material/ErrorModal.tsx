import React from 'react';

interface ErrorModalProps {
  isVisible: boolean;
  error: string;
  onClose: () => void;
  isDark: boolean;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ isVisible, error, onClose, isDark }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-md p-8 rounded-2xl shadow-2xl transform transition-all animate-shakeX ${
        isDark ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 rounded-full bg-red-400 opacity-20 animate-ping"></div>
          </div>
        </div>

        {/* Error Text */}
        <h3 className={`text-2xl font-bold text-center mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Đăng nhập thất bại
        </h3>
        <p className={`text-center mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {error}
        </p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-6 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;