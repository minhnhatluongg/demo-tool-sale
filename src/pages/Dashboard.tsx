import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    DocumentTextIcon,
    PlusCircleIcon,
    ClockIcon,
    CheckCircleIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const features = [
        {
            title: 'Đăng ký & Phát hành',
            description: 'Tạo đơn hàng, cấp tài khoản và phát hành mẫu hóa đơn',
            icon: DocumentTextIcon,
            color: 'from-blue-500 to-blue-600',
            path: '/register-publish',
        },
        {
            title: 'Tạo đơn hàng mới',
            description: 'Khởi tạo đơn hàng mới cho khách hàng',
            icon: PlusCircleIcon,
            color: 'from-green-500 to-green-600',
            path: '/register-publish',
        },
        {
            title: 'Đơn hàng đang xử lý',
            description: 'Xem và quản lý các đơn hàng đang xử lý',
            icon: ClockIcon,
            color: 'from-yellow-500 to-yellow-600',
            path: '/register-publish',
        },
        {
            title: 'Đơn hàng hoàn thành',
            description: 'Danh sách các đơn hàng đã hoàn thành',
            icon: CheckCircleIcon,
            color: 'from-purple-500 to-purple-600',
            path: '/register-publish',
        },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    Xin chào, {user?.fullName}! 👋
                </h2>
                <p className="text-gray-600">
                    Chào mừng bạn đến với hệ thống quản lý hóa đơn WinInvoice
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                            <p className="text-3xl font-bold text-gray-800">0</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Hoàn thành</p>
                            <p className="text-3xl font-bold text-gray-800">0</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <CheckCircleIcon className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Đang xử lý</p>
                            <p className="text-3xl font-bold text-gray-800">0</p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <ClockIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Hóa đơn mới</p>
                            <p className="text-3xl font-bold text-gray-800">0</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <PlusCircleIcon className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Chức năng chính</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(feature.path)}
                                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-left group"
                            >
                                <div
                                    className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                                >
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                                    {feature.title}
                                </h4>
                                <p className="text-sm text-gray-600">{feature.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Hoạt động gần đây</h3>
                <div className="text-center py-12">
                    <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có hoạt động nào</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
