import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    Squares2X2Icon,
    DocumentTextIcon,
    DocumentMagnifyingGlassIcon,
    ShieldCheckIcon,
    ArrowRightOnRectangleIcon,
    BoltIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/* Vision-UI inspired dark layout: glass sidebar + glow accents */
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
        { to: '/admin/logs', label: 'Logs', icon: DocumentMagnifyingGlassIcon },
    ];

    return (
        <div className="min-h-screen flex bg-[#0b1437] text-white relative overflow-hidden">
            {/* Background blobs */}
            <div className="pointer-events-none absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-indigo-600/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 w-[420px] h-[420px] rounded-full bg-fuchsia-600/30 blur-3xl" />
            <div className="pointer-events-none absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-500/20 blur-3xl" />

            {/* Sidebar */}
            <aside className="relative z-10 w-64 flex-shrink-0 m-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col">
                <div className="px-6 py-6 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                            <BoltIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-widest text-indigo-300">Admin Console</p>
                            <p className="text-lg font-bold text-white">ERP RC</p>
                        </div>
                    </div>
                </div>

                <nav className="px-3 py-4 flex-1 space-y-1">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        isActive
                                            ? 'bg-gradient-to-r from-indigo-500/30 to-fuchsia-500/20 text-white shadow-inner'
                                            : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                    }`
                                }
                            >
                                <Icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="px-3 pb-4 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-sm font-bold">
                            {(user?.fullName || user?.userCode || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{user?.fullName || user?.userCode}</p>
                            <p className="text-xs text-indigo-300 flex items-center gap-1">
                                <ShieldCheckIcon className="w-3 h-3" /> Admin · {user?.userCode}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> Đăng xuất
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="relative z-10 flex-1 p-4 overflow-x-hidden">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;
