import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getContractDashboard, DashboardStats } from '../../api/contractService';
import {
    DocumentTextIcon,
    ClockIcon,
    CheckCircleIcon,
    PaperAirplaneIcon,
    CalendarDaysIcon,
    ArrowPathIcon,
    BoltIcon,
    ShieldCheckIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';

/* ─── Vision-UI dark KPI card ──────────────────────────────────────────── */

type Tone = 'indigo' | 'cyan' | 'green' | 'rose' | 'amber' | 'fuchsia';

const toneRing: Record<Tone, string> = {
    indigo:  'from-indigo-500 to-indigo-700',
    cyan:    'from-cyan-500 to-blue-700',
    green:   'from-emerald-500 to-teal-700',
    rose:    'from-rose-500 to-pink-700',
    amber:   'from-amber-500 to-orange-700',
    fuchsia: 'from-fuchsia-500 to-purple-700',
};

interface StatCardProps {
    title: string;
    value: number | string;
    delta?: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: Tone;
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, delta, icon: Icon, tone, loading }) => (
    <div className="relative rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-xl overflow-hidden">
        <div className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br ${toneRing[tone]} opacity-30 rounded-full blur-2xl`} />
        <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-indigo-200/80 font-semibold">{title}</p>
                <p className="text-3xl font-extrabold mt-1 text-white">
                    {loading ? <span className="inline-block w-16 h-8 rounded bg-white/10 animate-pulse" /> : value}
                </p>
                {delta && <p className="text-xs text-emerald-300 mt-1">{delta}</p>}
            </div>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${toneRing[tone]} flex items-center justify-center shadow-lg shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

/* ─── Sparkline SVG ────────────────────────────────────────────────────── */

const Sparkline: React.FC<{ data: number[]; stroke: string; fillFrom: string; fillTo: string }> = ({
    data, stroke, fillFrom, fillTo,
}) => {
    const W = 600;
    const H = 180;
    const max = Math.max(1, ...data);
    const step = data.length > 1 ? W / (data.length - 1) : W;
    const points = data.map((v, i) => `${i * step},${H - (v / max) * (H - 20) - 10}`).join(' ');
    const id = useMemo(() => `g-${Math.random().toString(36).slice(2, 7)}`, []);
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillFrom} stopOpacity="0.45" />
                    <stop offset="100%" stopColor={fillTo} stopOpacity="0" />
                </linearGradient>
            </defs>
            <polygon
                fill={`url(#${id})`}
                points={`0,${H} ${points} ${W},${H}`}
            />
            <polyline
                fill="none"
                stroke={stroke}
                strokeWidth="2.5"
                points={points}
            />
        </svg>
    );
};

/* ─── Bar group SVG ────────────────────────────────────────────────────── */

const BarGroup: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const W = 600;
    const H = 200;
    const max = Math.max(1, ...data.map(d => d.value));
    const bw = W / data.length - 12;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-52">
            {data.map((d, i) => {
                const h = (d.value / max) * (H - 40);
                const x = i * (bw + 12) + 6;
                const y = H - h - 22;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={bw} height={h} rx="6"
                              fill="url(#barGrad)" />
                        <text x={x + bw / 2} y={H - 4} textAnchor="middle"
                              fontSize="10" fill="#9CA3AF">{d.label}</text>
                        <text x={x + bw / 2} y={y - 4} textAnchor="middle"
                              fontSize="11" fill="#F3F4F6" fontWeight="600">{d.value}</text>
                    </g>
                );
            })}
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#4338ca" />
                </linearGradient>
            </defs>
        </svg>
    );
};

/* ─── Page ─────────────────────────────────────────────────────────────── */

const AdminDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Admin xem toàn hệ thống (ismanager = true sẽ scope theo cây ASM của user;
            // false ở đây không quan trọng vì admin có Grp_List đặc biệt — BE trả full)
            const data = await getContractDashboard(true);
            setStats(data);
        } catch (e: any) {
            toast.error(e?.message || 'Không tải được dữ liệu Dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 11) return 'Chào buổi sáng';
        if (h < 14) return 'Chào buổi trưa';
        if (h < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    }, []);

    // Sample sparkline & bar — sẽ thay = data thật khi BE expose theo-tháng/theo-ngày
    const sparkData = [12, 18, 14, 22, 30, 28, 36, 32, 40, 38, 46, 52];
    const barData = useMemo(() => ([
        { label: 'Trình ký', value: stats?.count0 ?? 0 },
        { label: 'Chờ KT',  value: stats?.count101 ?? 0 },
        { label: 'Đã duyệt', value: stats?.count301 ?? 0 },
        { label: 'KH ký',   value: stats?.countKHSign ?? 0 },
        { label: 'Phát hành', value: stats?.countPH ?? 0 },
        { label: 'Đóng',    value: stats?.countClose ?? 0 },
    ]), [stats]);

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                    <p className="text-xs uppercase tracking-widest text-indigo-300">{greeting}</p>
                    <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                        Welcome back, {user?.fullName || user?.userCode}
                        <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Bạn đang vào hệ thống với quyền <span className="text-indigo-300 font-semibold">Admin</span>.
                        Có thể xem mọi hợp đồng, bypass duyệt và can thiệp luồng ký.
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15 transition-colors"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard loading={loading} title="Tổng hợp đồng" tone="indigo" icon={DocumentTextIcon}
                          value={stats?.countAll ?? 0} delta="Toàn hệ thống" />
                <StatCard loading={loading} title="Hôm nay"      tone="cyan"   icon={CalendarDaysIcon}
                          value={stats?.countAllDay ?? 0} delta="Tạo trong ngày" />
                <StatCard loading={loading} title="Tháng này"    tone="fuchsia" icon={ChartBarIcon}
                          value={stats?.countAllMonth ?? 0} />
                <StatCard loading={loading} title="Năm nay"      tone="amber"  icon={BoltIcon}
                          value={stats?.countAllYear ?? 0} />
            </div>

            {/* Sub KPI */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard loading={loading} title="Trình ký"   tone="amber"   icon={ClockIcon}        value={stats?.count0 ?? 0} />
                <StatCard loading={loading} title="Chờ KT"     tone="cyan"    icon={ClockIcon}        value={stats?.count101 ?? 0} />
                <StatCard loading={loading} title="Đã duyệt"   tone="green"   icon={CheckCircleIcon}  value={stats?.count301 ?? 0} />
                <StatCard loading={loading} title="KH đã ký"   tone="fuchsia" icon={PaperAirplaneIcon} value={stats?.countKHSign ?? 0} />
                <StatCard loading={loading} title="Phát hành"  tone="indigo"  icon={PaperAirplaneIcon} value={stats?.countPH ?? 0} />
                <StatCard loading={loading} title="Đóng HĐ"    tone="rose"    icon={ShieldCheckIcon}  value={stats?.countClose ?? 0} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-indigo-300">Sales overview</p>
                            <p className="text-lg font-bold">Hợp đồng theo tháng</p>
                        </div>
                        <span className="text-xs text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-md">
                            +{Math.round(((sparkData.at(-1) ?? 0) - (sparkData[0] || 1)) / (sparkData[0] || 1) * 100)}% YTD
                        </span>
                    </div>
                    <Sparkline data={sparkData} stroke="#a78bfa" fillFrom="#a78bfa" fillTo="#0b1437" />
                </div>

                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-indigo-300">Pipeline</p>
                            <p className="text-lg font-bold">Trạng thái hợp đồng</p>
                        </div>
                    </div>
                    <BarGroup data={barData} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
