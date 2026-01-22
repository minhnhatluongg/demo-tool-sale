import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo & Title */}
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">W</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">WinInvoice</h1>
                                <p className="text-xs text-gray-500">Hệ thống quản lý hóa đơn</p>
                            </div>
                        </div>

                        {/* User Info & Logout */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg">
                                <UserCircleIcon className="w-6 h-6 text-blue-600" />
                                <div className="text-sm">
                                    <p className="font-semibold text-gray-800">{user?.fullName}</p>
                                    <p className="text-xs text-gray-500">{user?.userCode}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors duration-200"
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
            <footer className="mt-12 py-6 text-center text-xs text-gray-500 border-t border-gray-200">
                <p>© 2025 WinInvoice | Version 1.0.0</p>
                <p className="mt-1">Made with ❤️ by MNL</p>
            </footer>
        </div>
    );
};

export default DashboardLayout;
