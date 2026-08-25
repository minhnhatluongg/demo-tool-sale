import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';
import {
    Squares2X2Icon,
    DocumentTextIcon,
    DocumentMagnifyingGlassIcon,
    ShieldCheckIcon,
    ArrowRightOnRectangleIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    BuildingOffice2Icon,
    ArrowPathRoundedSquareIcon,
    ScaleIcon,
    UserPlusIcon,
    NoSymbolIcon,
    BellSlashIcon,
} from '@heroicons/react/24/outline';

/*
 * Editorial minimalist layout — nâng cấp theo phong cách JolyUI:
 * active-pill của sidebar trượt mượt giữa các mục (framer-motion layoutId),
 * giữ nguyên bảng màu hairline light-only của admin console.
 */
const AdminLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems: {
        to: string;
        label: string;
        icon: React.ComponentType<any>;
        adminOnly?: boolean;
    }[] = [
        { to: '/admin/dashboard', label: 'Dashboard', icon: Squares2X2Icon },
        { to: '/admin/contracts', label: 'Hợp đồng', icon: DocumentTextIcon },
        { to: '/admin/expiring', label: 'Sắp hết hạn', icon: ExclamationTriangleIcon },
        { to: '/admin/pending-emails', label: 'Email loại trừ cảnh báo', icon: BellSlashIcon, adminOnly: true },
        { to: '/admin/tvan', label: 'Gia hạn / Hủy TVAN', icon: ArrowPathRoundedSquareIcon },
        { to: '/admin/reconcile', label: 'Đối soát bên thứ 3', icon: ScaleIcon },
        { to: '/admin/sale-debt', label: 'Công nợ Sale', icon: NoSymbolIcon },
        { to: '/admin/sales-tree', label: 'Cây ASM', icon: UserGroupIcon },
        { to: '/admin/create-employee', label: 'Tạo nhân viên', icon: UserPlusIcon },
        { to: '/admin/create-account', label: 'Cấp TK WinInvoice', icon: BuildingOffice2Icon },
        { to: '/admin/logs', label: 'Logs', icon: DocumentMagnifyingGlassIcon },
    ];

    return (
        <div className="min-h-screen flex bg-[#EDF0F4] text-[#2F3437]">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 bg-[#F7F8FA] border-r border-[#E4E7EC] flex flex-col">
                <div className="px-5 py-6 border-b border-[#EAEAEA]">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">Admin console</p>
                    <p className="text-lg font-semibold text-[#111111] tracking-tight mt-0.5">ERP RC</p>
                </div>

                <nav className="px-3 py-4 flex-1 space-y-0.5">
                    {navItems.filter(item => !item.adminOnly || isAdmin(user)).map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.to);
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111] ${
                                    isActive
                                        ? 'text-[#111111] font-medium'
                                        : 'text-[#5f5e5b] hover:bg-[#F1F0EC] hover:text-[#111111]'
                                }`}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="admin-nav-pill"
                                        className="absolute inset-0 bg-[#EFEEEA] rounded-md"
                                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                    />
                                )}
                                <Icon className="relative z-10 w-[18px] h-[18px]" strokeWidth={1.8} />
                                <span className="relative z-10">{item.label}</span>
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
