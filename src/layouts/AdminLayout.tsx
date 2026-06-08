import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Squares2X2Icon,
    DocumentTextIcon,
    DocumentMagnifyingGlassIcon,
    ShieldCheckIcon,
    ArrowRightOnRectangleIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

/* Editorial minimalist layout: warm-white canvas, 1px hairline borders, no gradients */
const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
        { to: '/admin/contracts', label: 'Hợp đồng', icon: DocumentTextIcon },
        { to: '/admin/expiring', label: 'Sắp hết hạn', icon: ExclamationTriangleIcon },
        { to: '/admin/sales-tree', label: 'Cây ASM', icon: UserGroupIcon },
        { to: '/admin/create-account', label: 'Cấp TK WinInvoice', icon: BuildingOffice2Icon },
        { to: '/admin/logs', label: 'Logs', icon: DocumentMagnifyingGlassIcon },
    ];

    return (
        <div className="min-h-screen flex bg-[#F7F6F3] text-[#2F3437]">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 bg-[#FBFBFA] border-r border-[#EAEAEA] flex flex-col">
                <div className="px-5 py-6 border-b border-[#EAEAEA]">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">Admin console</p>
                    <p className="text-lg font-semibold text-[#111111] tracking-tight mt-0.5">ERP RC</p>
                </div>

                <nav className="px-3 py-4 flex-1 space-y-0.5">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111] ${
                                        isActive
                                            ? 'bg-[#EFEEEA] text-[#111111] font-medium'
                                            : 'text-[#5f5e5b] hover:bg-[#F1F0EC] hover:text-[#111111]'
                                    }`
                                }
                            >
                                <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="px-4 py-4 border-t border-[#EAEAEA]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[#111111] text-white flex items-center justify-center text-sm font-semibold">
                            {(user?.fullName || user?.userCode || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-[#111111] truncate">{user?.fullName || user?.userCode}</p>
                            <p className="text-xs text-[#787774] flex items-center gap-1">
                                <ShieldCheckIcon className="w-3 h-3" /> Admin · {user?.userCode}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm text-[#9F2F2D] bg-[#FDEBEC] hover:bg-[#f9dfe1] active:scale-[0.98] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9F2F2D]"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 px-8 py-8 overflow-x-hidden animate-admin-enter">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
