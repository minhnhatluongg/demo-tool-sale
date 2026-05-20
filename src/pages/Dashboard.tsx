import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ActionSelectionModal from '../components/ActionSelectionModal';
import {
    DocumentTextIcon,
    PlusCircleIcon,
    ClockIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    PaperAirplaneIcon,
    BuildingOfficeIcon,
    UserCircleIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    BoltIcon,
    EnvelopeIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import { getContractDashboard, DashboardStats } from '../api/contractService';

type Tone = 'blue' | 'green' | 'yellow' | 'purple' | 'rose' | 'cyan' | 'emerald' | 'amber';

interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string }>;
    tone: Tone;
    sub?: string;
    isDark: boolean;
    loading?: boolean;
}

const toneStyles: Record<Tone, { bar: string; iconWrap: string; iconWrapDark: string; icon: string; iconDark: string; }> = {
    blue:    { bar: 'border-blue-500',    iconWrap: 'bg-blue-100',    iconWrapDark: 'bg-blue-900/50',    icon: 'text-blue-600',    iconDark: 'text-blue-400'    },
    green:   { bar: 'border-green-500',   iconWrap: 'bg-green-100',   iconWrapDark: 'bg-green-900/50',   icon: 'text-green-600',   iconDark: 'text-green-400'   },
    yellow:  { bar: 'border-yellow-500',  iconWrap: 'bg-yellow-100',  iconWrapDark: 'bg-yellow-900/50',  icon: 'text-yellow-600',  iconDark: 'text-yellow-400'  },
    purple:  { bar: 'border-purple-500',  iconWrap: 'bg-purple-100',  iconWrapDark: 'bg-purple-900/50',  icon: 'text-purple-600',  iconDark: 'text-purple-400'  },
    rose:    { bar: 'border-rose-500',    iconWrap: 'bg-rose-100',    iconWrapDark: 'bg-rose-900/50',    icon: 'text-rose-600',    iconDark: 'text-rose-400'    },
    cyan:    { bar: 'border-cyan-500',    iconWrap: 'bg-cyan-100',    iconWrapDark: 'bg-cyan-900/50',    icon: 'text-cyan-600',    iconDark: 'text-cyan-400'    },
    emerald: { bar: 'border-emerald-500', iconWrap: 'bg-emerald-100', iconWrapDark: 'bg-emerald-900/50', icon: 'text-emerald-600', iconDark: 'text-emerald-400' },
    amber:   { bar: 'border-amber-500',   iconWrap: 'bg-amber-100',   iconWrapDark: 'bg-amber-900/50',   icon: 'text-amber-600',   iconDark: 'text-amber-400'   },
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, tone, sub, isDark, loading }) => {
    const t = toneStyles[tone];
    return (
        <div
            className={`rounded-2xl shadow-md p-5 border-l-4 ${t.bar} transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 ${
                isDark ? 'bg-slate-800/80 backdrop-blur-sm' : 'bg-white'
            }`}
        >
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <p className={`text-xs uppercase tracking-wide font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {title}
                    </p>
                    <p className={`text-3xl font-extrabold leading-tight ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {loading ? <span className="inline-block w-12 h-7 rounded bg-gray-300/40 animate-pulse" /> : value}
                    </p>
                    {sub && (
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{sub}</p>
                    )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? t.iconWrapDark : t.iconWrap}`}>
                    <Icon className={`w-6 h-6 ${isDark ? t.iconDark : t.icon}`} />
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 11) return 'Chào buổi sáng';
        if (h < 14) return 'Chào buổi trưa';
        if (h < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const data = await getContractDashboard(false);
            setStats(data);
        } catch (e: any) {
            toast.error(e?.message || 'Không tải được dữ liệu Dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const features = [
        {
            title: 'Đăng ký & Phát hành',
            description: 'Tạo đơn hàng và phát hành mẫu hóa đơn',
            icon: DocumentTextIcon,
            color: 'from-blue-500 to-blue-600',
            path: 'modal',
        },
        {
            title: 'Tạo đơn hàng mới',
            description: 'Khởi tạo đơn hàng mới cho khách hàng',
            icon: PlusCircleIcon,
            color: 'from-green-500 to-green-600',
            path: '/register',
        },
        {
            title: 'Phát hành mẫu',
            description: 'Thiết kế và phát hành mẫu hóa đơn',
            icon: PaperAirplaneIcon,
            color: 'from-purple-500 to-purple-600',
            path: '/publish',
        },
    ];

    const fullName = user?.fullName || user?.userName || user?.loginName || 'bạn';
    const userCode = user?.userCode || 'N/A';
    const userPosition = user?.userPosition || 'Nhân viên Sale';
    const grpList = user?.grp_List;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome / Header banner */}
            <div
                className={`relative overflow-hidden rounded-3xl mb-8 p-6 md:p-8 shadow-md ${
                    isDark
                        ? 'bg-gradient-to-r from-slate-800 via-indigo-900/40 to-slate-800 border border-slate-700'
                        : 'bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-blue-100'
                }`}
            >
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-purple-400/20 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                            isDark ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-indigo-500 to-blue-600'
                        }`}>
                            <UserCircleIcon className="w-9 h-9 text-white" />
                        </div>
                        <div>
                            <p className={`text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>{greeting} 👋</p>
                            <h2 className={`text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {fullName}
                            </h2>
                            <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                <span className="inline-flex items-center gap-1">
                                    <BuildingOfficeIcon className="w-4 h-4" /> {userPosition}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <BoltIcon className="w-4 h-4" /> Mã NV: <strong>{userCode}</strong>
                                </span>
                                {user?.email && (
                                    <span className="inline-flex items-center gap-1">
                                        <EnvelopeIcon className="w-4 h-4" /> {user.email}
                                    </span>
                                )}
                                {user?.phoneNumber && (
                                    <span className="inline-flex items-center gap-1">
                                        <PhoneIcon className="w-4 h-4" /> {user.phoneNumber}
                                    </span>
                                )}
                                {grpList && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        isDark ? 'bg-indigo-900/60 text-indigo-200' : 'bg-indigo-100 text-indigo-700'
                                    }`}>
                                        {grpList}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchStats}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                                isDark
                                    ? 'bg-slate-700/80 text-white hover:bg-slate-600'
                                    : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                            }`}
                        >
                            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Đang tải...' : 'Làm mới'}
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md transition-all"
                        >
                            <PlusCircleIcon className="w-4 h-4" /> Bắt đầu
                        </button>
                    </div>
                </div>
            </div>

            {/* Cá nhân */}
            <div className="mb-3 flex items-center gap-2">
                <UserCircleIcon className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Hợp đồng của tôi</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard isDark={isDark} loading={loading} title="Tổng HĐ"      tone="blue"    icon={DocumentTextIcon} value={stats?.countAlluser     ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Trình ký"     tone="yellow"  icon={ClockIcon}        value={stats?.count0user      ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Chờ kiểm tra" tone="cyan"    icon={ChartBarIcon}     value={stats?.count101user    ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Đã duyệt"     tone="emerald" icon={CheckCircleIcon}  value={stats?.count301user    ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="KH đã ký"     tone="purple"  icon={PaperAirplaneIcon} value={stats?.countKHSignuser ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Đã phát hành" tone="green"   icon={PaperAirplaneIcon} value={stats?.countPHuser     ?? 0} />
            </div>

            {/* Toàn hệ thống */}
            <div className="mb-3 flex items-center gap-2">
                <ChartBarIcon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Toàn hệ thống</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                <StatCard isDark={isDark} loading={loading} title="Tổng hợp đồng"  tone="blue"   icon={DocumentTextIcon} value={stats?.countAll ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Hôm nay"        tone="amber"  icon={CalendarDaysIcon} value={stats?.countAllDay ?? 0} sub="Tạo trong ngày" />
                <StatCard isDark={isDark} loading={loading} title="Tháng này"      tone="cyan"   icon={CalendarDaysIcon} value={stats?.countAllMonth ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Năm nay"        tone="purple" icon={CalendarDaysIcon} value={stats?.countAllYear ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Trình ký"       tone="yellow" icon={ClockIcon}        value={stats?.count0 ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="Chờ kiểm tra"   tone="cyan"   icon={ClockIcon}        value={stats?.count101 ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="HĐ đã duyệt"    tone="emerald" icon={CheckCircleIcon} value={stats?.count301 ?? 0} />
                <StatCard isDark={isDark} loading={loading} title="HĐ đã phát hành" tone="rose"  icon={PaperAirplaneIcon} value={stats?.countPH ?? 0} />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Chức năng chính
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                                className={`rounded-2xl shadow-md p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] text-left group ${
                                    isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white'
                                }`}
                            >
                                <div
                                    className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                                >
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <h4 className={`text-lg font-semibold mb-2 transition-colors ${
                                    isDark
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

            {/* Empty placeholder area (recent activity) */}
            <div className={`rounded-2xl shadow-md p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Hoạt động gần đây
                </h3>
                <div className="text-center py-12">
                    <DocumentTextIcon className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
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
