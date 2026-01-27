import React from 'react';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { DocumentPlusIcon, RocketLaunchIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ActionSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ActionSelectionModal: React.FC<ActionSelectionModalProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { isDark } = useTheme();

    const handleRegister = () => {
        navigate('/register');
        onClose();
    };

    const handlePublish = () => {
        navigate('/publish');
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

            {/* Full-screen container */}
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className={`relative max-w-2xl w-full rounded-2xl shadow-2xl p-8 ${isDark ? 'bg-slate-800' : 'bg-white'
                    }`}>
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${isDark
                                ? 'hover:bg-slate-700 text-gray-400 hover:text-white'
                                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>

                    {/* Title */}
                    <Dialog.Title className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'
                        }`}>
                        Chọn hành động
                    </Dialog.Title>
                    <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Vui lòng chọn một trong hai hành động bên dưới
                    </p>

                    {/* Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Register Card */}
                        <button
                            onClick={handleRegister}
                            className={`group relative overflow-hidden rounded-xl p-8 text-left transition-all duration-300 transform hover:scale-105 ${isDark
                                    ? 'bg-gradient-to-br from-blue-900/50 to-blue-800/50 hover:from-blue-900/70 hover:to-blue-800/70 border border-blue-700'
                                    : 'bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${isDark ? 'bg-blue-600' : 'bg-blue-500'
                                }`}>
                                <DocumentPlusIcon className="w-8 h-8 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'
                                }`}>
                                Đăng ký
                            </h3>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                Tạo đơn hàng mới và cấp tài khoản cho khách hàng chưa có tài khoản EVAT
                            </p>

                            {/* Arrow indicator */}
                            <div className={`mt-6 flex items-center text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'
                                }`}>
                                <span>Bắt đầu</span>
                                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </button>

                        {/* Publish Card */}
                        <button
                            onClick={handlePublish}
                            className={`group relative overflow-hidden rounded-xl p-8 text-left transition-all duration-300 transform hover:scale-105 ${isDark
                                    ? 'bg-gradient-to-br from-purple-900/50 to-purple-800/50 hover:from-purple-900/70 hover:to-purple-800/70 border border-purple-700'
                                    : 'bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border border-purple-200'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 ${isDark ? 'bg-purple-600' : 'bg-purple-500'
                                }`}>
                                <RocketLaunchIcon className="w-8 h-8 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'
                                }`}>
                                Phát hành
                            </h3>
                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}>
                                Chọn mẫu hóa đơn và phát hành cho khách hàng đã có tài khoản
                            </p>

                            {/* Arrow indicator */}
                            <div className={`mt-6 flex items-center text-sm font-medium ${isDark ? 'text-purple-400' : 'text-purple-600'
                                }`}>
                                <span>Bắt đầu</span>
                                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </div>
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default ActionSelectionModal;
