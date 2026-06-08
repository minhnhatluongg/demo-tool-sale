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

/* ─── Editorial light KPI card (minimalist-ui) ─────────────────────────── */

type Tone = 'red' | 'blue' | 'green' | 'yellow' | 'neutral';

const tonePastel: Record<Tone, { bg: string; fg: string }> = {
    red:     { bg: '#FDEBEC', fg: '#9F2F2D' },
    blue:    { bg: '#E1F3FE', fg: '#1F6C9F' },
    green:   { bg: '#EDF3EC', fg: '#346538' },
    yellow:  { bg: '#FBF3DB', fg: '#956400' },
    neutral: { bg: '#F1F0EC', fg: '#5f5e5b' },
};

interface StatCardProps {
    title: string;
    value: number | string;
    delta?: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: Tone;
    loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, delta, icon: Icon, tone, loading }) => {
    const pastel = tonePastel[tone];
    return (
        <div className="rounded-lg bg-white border border-[#EAEAEA] p-5 transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#787774] font-medium">{title}</p>
                    <p className="text-3xl font-semibold tracking-tight mt-1.5 text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {loading ? <span className="inline-block w-16 h-8 rounded bg-[#EFEEEA] animate-pulse" /> : value}
                    </p>
                    {delta && <p className="text-xs text-[#787774] mt-1">{delta}</p>}
                </div>
                <div
                    className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                    style={{ backgroundColor: pastel.bg, color: pastel.fg }}
                >
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

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
                    <stop offset="0%" stopColor={fillFrom} stopOpacity="0.18" />
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
                strokeWidth="2"
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
                        <rect x={x} y={y} width={bw} height={h} rx="4" fill="#2F3437" />
                        <text x={x + bw / 2} y={H - 4} textAnchor="middle"
                              fontSize="10" fill="#787774">{d.label}</text>
                        <text x={x + bw / 2} y={y - 6} textAnchor="middle"
                              fontSize="11" fill="#111111" fontWeight="600">{d.value}</text>
                    </g>
                );
            })}
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-6 mb-6 border-b border-[#EAEAEA]">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">{greeting}</p>
                    <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#111111] flex items-center gap-2 mt-0.5">
                        Welcome back, {user?.fullName || user?.userCode}
                        <ShieldCheckIcon className="w-6 h-6 text-[#346538]" />
                    </h1>
                    <p className="text-sm text-[#787774] mt-1 max-w-[65ch]">
                        Bạn đang vào hệ thống với quyền <span className="text-[#111111] font-medium">Admin</span>.
                        Có thể xem mọi hợp đồng, bypass duyệt và can thiệp luồng ký.
                    </p>
                </div>
                <button
                    onClick={fetchStats}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white border border-[#EAEAEA] text-[#2F3437] hover:bg-[#F7F6F3] active:scale-[0.98] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Đang tải' : 'Làm mới'}
                </button>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard loading={loading} title="Tổng hợp đồng" tone="neutral" icon={DocumentTextIcon}
                          value={stats?.countAll ?? 0} delta="Toàn hệ thống" />
                <StatCard loading={loading} title="Hôm nay"      tone="blue"   icon={CalendarDaysIcon}
                          value={stats?.countAllDay ?? 0} delta="Tạo trong ngày" />
                <StatCard loading={loading} title="Tháng này"    tone="green" icon={ChartBarIcon}
                          value={stats?.countAllMonth ?? 0} />
                <StatCard loading={loading} title="Năm nay"      tone="yellow"  icon={BoltIcon}
                          value={stats?.countAllYear ?? 0} />
            </div>

            {/* Sub KPI */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <StatCard loading={loading} title="Trình ký"   tone="yellow"  icon={ClockIcon}        value={stats?.count0 ?? 0} />
                <StatCard loading={loading} title="Chờ KT"     tone="blue"    icon={ClockIcon}        value={stats?.count101 ?? 0} />
                <StatCard loading={loading} title="Đã duyệt"   tone="green"   icon={CheckCircleIcon}  value={stats?.count301 ?? 0} />
                <StatCard loading={loading} title="KH đã ký"   tone="green"   icon={PaperAirplaneIcon} value={stats?.countKHSign ?? 0} />
                <StatCard loading={loading} title="Phát hành"  tone="blue"    icon={PaperAirplaneIcon} value={stats?.countPH ?? 0} />
                <StatCard loading={loading} title="Đóng HĐ"    tone="red"     icon={ShieldCheckIcon}  value={stats?.countClose ?? 0} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg bg-white border border-[#EAEAEA] p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#787774]">Sales overview</p>
                            <p className="text-lg font-semibold tracking-tight text-[#111111]">Hợp đồng theo tháng</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: '#EDF3EC', color: '#346538', fontVariantNumeric: 'tabular-nums' }}>
                            +{Math.round(((sparkData.at(-1) ?? 0) - (sparkData[0] || 1)) / (sparkData[0] || 1) * 100)}% YTD
                        </span>
                    </div>
                    <Sparkline data={sparkData} stroke="#2F3437" fillFrom="#2F3437" fillTo="#FFFFFF" />
                </div>

                <div className="rounded-lg bg-white border border-[#EAEAEA] p-5">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.08em] text-[#787774]">Pipeline</p>
                            <p className="text-lg font-semibold tracking-tight text-[#111111]">Trạng thái hợp đồng</p>
                        </div>
                    </div>
                    <BarGroup data={barData} />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
