import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ActionSelectionModal from '../components/ActionSelectionModal';
import {
    DocumentTextIcon,
    PlusCircleIcon,
    ClockIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const features = [
        {
            title: 'Đăng ký & Phát hành',
            description: 'Tạo đơn hàng, cấp tài khoản và phát hành mẫu hóa đơn',
            icon: DocumentTextIcon,
            color: 'from-blue-500 to-blue-600',
            path: 'modal', // Special path to trigger modal
        },
        {
            title: 'Tạo đơn hàng mới',
            description: 'Khởi tạo đơn hàng mới cho khách hàng',
            icon: PlusCircleIcon,
            color: 'from-green-500 to-green-600',
            path: '/register',
        },
        {
            title: 'Đơn hàng đang xử lý',
            description: 'Xem và quản lý các đơn hàng đang xử lý',
            icon: ClockIcon,
            color: 'from-yellow-500 to-yellow-600',
            path: '/in-process',
        },
        {
            title: 'Đơn hàng hoàn thành',
            description: 'Danh sách các đơn hàng đã hoàn thành',
            icon: CheckCircleIcon,
            color: 'from-purple-500 to-purple-600',
            path: '/completed',
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
                <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Xin chào, {user?.fullName}! 👋
                </h2>
                <p className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                    Chào mừng bạn đến với hệ thống quản lý hóa đơn WinInvoice
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className={`rounded-xl shadow-md p-6 border-l-4 border-blue-500 ${isDark ? 'bg-slate-800' : 'bg-white'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Tổng đơn hàng
                            </p>
                            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>0</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                            }`}>
                            <DocumentTextIcon className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl shadow-md p-6 border-l-4 border-green-500 ${isDark ? 'bg-slate-800' : 'bg-white'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Hoàn thành
                            </p>
                            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>0</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-900/50' : 'bg-green-100'
                            }`}>
                            <CheckCircleIcon className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl shadow-md p-6 border-l-4 border-yellow-500 ${isDark ? 'bg-slate-800' : 'bg-white'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Đang xử lý
                            </p>
                            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>0</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-yellow-900/50' : 'bg-yellow-100'
                            }`}>
                            <ClockIcon className={`w-6 h-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                        </div>
                    </div>
                </div>

                <div className={`rounded-xl shadow-md p-6 border-l-4 border-purple-500 ${isDark ? 'bg-slate-800' : 'bg-white'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Hóa đơn mới
                            </p>
                            <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>0</p>
                        </div>
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'
                            }`}>
                            <PlusCircleIcon className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Chức năng chính
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (feature.path === 'modal') {
                                        setIsModalOpen(true);
                                    } else {
                                        navigate(feature.path);
                                    }
                                }}
                                className={`rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left group ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white'
                                    }`}
                            >
                                <div
                                    className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h4 className={`text-lg font-semibold mb-2 transition-colors ${isDark
                                    ? 'text-white group-hover:text-blue-400'
                                    : 'text-gray-800 group-hover:text-blue-600'
                                    }`}>
                                    {feature.title}
                                </h4>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {feature.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className={`rounded-xl shadow-md p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Hoạt động gần đây
                </h3>
                <div className="text-center py-12">
                    <DocumentTextIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'
                        }`} />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        Chưa có hoạt động nào
                    </p>
                </div>
            </div>

            {/* Action Selection Modal */}
            <ActionSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default Dashboard;
