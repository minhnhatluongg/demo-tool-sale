import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { KeyIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

interface CodeValidationStepProps {
    onValidationSuccess: (code: string, userInfo: any) => void;
    loading: boolean;
}

const CodeValidationStep: React.FC<CodeValidationStepProps> = ({
    onValidationSuccess,
    loading
}) => {
    const { isDark } = useTheme();
    const [code, setCode] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) {
            return;
        }
        onValidationSuccess(code.trim(), null);
    };

    return (
        <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isDark
            ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
            : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
            }`}>
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Validation Card */}
            <div className="relative z-10 w-full max-w-lg px-6">
                <div className={`backdrop-blur-xl rounded-2xl shadow-2xl border p-8 ${isDark
                    ? 'bg-slate-800/80 border-slate-700'
                    : 'bg-white/90 border-gray-200'
                    }`}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 shadow-lg ${isDark
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600'
                            : 'bg-gradient-to-br from-purple-500 to-pink-500'
                            }`}>
                            <KeyIcon className="w-10 h-10 text-white" />
                        </div>
                        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                            Xác thực mã đăng ký
                        </h1>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                            Vui lòng nhập mã kích hoạt từ kỹ thuật viên
                        </p>
                    </div>

                    {/* Info Box */}
                    <div className={`border-l-4 p-4 rounded-r-lg mb-6 ${isDark
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-blue-400 bg-blue-50'
                        }`}>
                        <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                ℹ️
                            </div>
                            <div>
                                <h3 className={`font-semibold mb-1 ${isDark ? 'text-blue-300' : 'text-blue-800'
                                    }`}>
                                    Hướng dẫn
                                </h3>
                                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-blue-700'
                                    }`}>
                                    <li>• Liên hệ bộ phận kỹ thuật để nhận mã kích hoạt</li>
                                    <li>• Mỗi mã chỉ sử dụng được một lần</li>
                                    <li>• Mã có thời hạn hiệu lực nhất định</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="registrationCode"
                                className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'
                                    }`}
                            >
                                Mã đăng ký <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="registrationCode"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className={`w-full px-4 py-3 pl-12 rounded-lg border-2 transition-all focus:outline-none focus:ring-2 ${isDark
                                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:ring-purple-500 focus:border-purple-500'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-purple-500 focus:border-purple-500'
                                        }`}
                                    placeholder="Nhập mã kích hoạt..."
                                    disabled={loading}
                                    required
                                />
                                <KeyIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !code.trim()}
                            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${loading || !code.trim()
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xác thực...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                    Xác thực mã
                                </span>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className={`mt-6 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        <p>
                            Chưa có mã?{' '}
                            <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                Liên hệ bộ phận kỹ thuật
                            </span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Custom animations */}
            <style>{`
                @keyframes blob {
                    0%, 100% {
                        transform: translate(0, 0) scale(1);
                    }
                    33% {
                        transform: translate(30px, -50px) scale(1.1);
                    }
                    66% {
                        transform: translate(-20px, 20px) scale(0.9);
                    }
                }
                
                .animate-blob {
                    animation: blob 7s infinite;
                }
                
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default CodeValidationStep;
