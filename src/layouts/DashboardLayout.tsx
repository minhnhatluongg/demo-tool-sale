import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowRightOnRectangleIcon, UserCircleIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleLogoClick = () => {
        navigate('/dashboard');
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
                ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
                : 'bg-gradient-to-br from-blue-50 via-white to-blue-50'
            }`}>
            {/* Header */}
            <header className={`shadow-md sticky top-0 z-50 transition-colors duration-300 ${isDark ? 'bg-slate-800 border-b border-slate-700' : 'bg-white'
                }`}>
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        {/* Logo & Employee Code */}
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleLogoClick}
                                className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200"
                            >
                                <img
                                    src="/images/icon-W-invoice.png"
                                    alt="WinInvoice Logo"
                                    className="h-10 w-auto"
                                />
                                <div className="text-left">
                                    <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        WinInvoice
                                    </h1>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Mã NV: {user?.userCode || 'N/A'}
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* User Info, Theme Toggle & Logout */}
                        <div className="flex items-center space-x-3">
                            {/* User Info */}
                            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-50'
                                }`}>
                                <UserCircleIcon className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                <div className="text-sm">
                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                        {user?.fullName}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {user?.userCode}
                                    </p>
                                </div>
                            </div>

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className={`p-2 rounded-lg transition-all duration-200 ${isDark
                                        ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDark ? (
                                    <SunIcon className="w-5 h-5" />
                                ) : (
                                    <MoonIcon className="w-5 h-5" />
                                )}
                            </button>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${isDark
                                        ? 'bg-red-900/50 text-red-400 hover:bg-red-900/70'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className={`mt-12 py-6 text-center text-xs border-t transition-colors duration-300 ${isDark
                    ? 'text-gray-400 border-slate-700'
                    : 'text-gray-500 border-gray-200'
                }`}>
                <p>© 2025 WinInvoice | Version 1.0.0</p>
                <p className="mt-1">Made with ❤️ by MNL</p>
            </footer>
        </div>
    );
};

export default DashboardLayout;
