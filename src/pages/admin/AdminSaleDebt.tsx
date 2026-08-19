import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
    InboxIcon,
    ShieldExclamationIcon,
    CheckCircleIcon,
    BellAlertIcon,
    LockClosedIcon,
    UsersIcon,
    PencilSquareIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import {
    getSaleDebtSummary,
    getSaleDebtList,
    getSaleDebtLevels,
    updateSaleDebtLevel,
    SaleDebtSummary,
    SaleDebtLevelOption,
    SalePermissionLevel,
    ACTION_LABELS,
    SaleBusinessAction,
    levelTone,
    TONE_PASTEL,
    isBlockingLevel,
} from '../../api/saleDebtService';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const fmtDateTime = (s?: string | null) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleString('vi-VN');
};

const errText = (e: any, fallback: string) =>
    e?.response?.data?.message || e?.message || fallback;

const thCls =
    'text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap';

/* ─── Bậc badge ────────────────────────────────────────────────────────── */

const LevelBadge: React.FC<{ level: number; name: string }> = ({ level, name }) => {
    const pastel = TONE_PASTEL[levelTone(level)];
    return (
        <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
            style={{ background: pastel.bg, color: pastel.fg }}
        >
            <span className="font-semibold tabular-nums">{level}</span>
            {name}
        </span>
    );
};

/* ─── KPI card ─────────────────────────────────────────────────────────── */

const StatCard: React.FC<{
    title: string;
    value: number | string;
    delta?: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: keyof typeof TONE_PASTEL;
    loading?: boolean;
    active?: boolean;
    onClick?: () => void;
}> = ({ title, value, delta, icon: Icon, tone, loading, active, onClick }) => {
    const pastel = TONE_PASTEL[tone];
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!onClick}
            className={`text-left w-full rounded-lg bg-white border p-5 transition-all duration-200 ${
                onClick ? 'hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.99] cursor-pointer' : 'cursor-default'
            } ${active ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#EAEAEA]'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-[#787774] font-medium">{title}</p>
                    <p
                        className="text-3xl font-semibold tracking-tight mt-1.5 text-[#111111]"
                        style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                        {loading ? <span className="inline-block w-16 h-8 rounded bg-[#EFEEEA] animate-pulse" /> : value}
                    </p>
                    {delta && <p className="text-xs text-[#787774] mt-1">{delta}</p>}
                </div>
                <div
                    className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: pastel.bg, color: pastel.fg }}
                >
                    <Icon className="w-[18px] h-[18px]" />
                </div>
            </div>
        </button>
    );
};

/* ─── Nút phân trang ───────────────────────────────────────────────────── */

const PageBtn: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    label: string;
    children: React.ReactNode;
}> = ({ onClick, disabled, label, children }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        className="p-1.5 rounded-md border border-[#EAEAEA] bg-white text-[#2F3437] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[#F7F6F3] active:scale-[0.96] transition-all"
    >
        {children}
    </button>
);

/* ─── Skeleton / empty ─────────────────────────────────────────────────── */

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-3 py-3">
                <div className="h-3.5 rounded bg-[#EFEEEA] animate-pulse" style={{ maxWidth: 70 + ((i * 53) % 130) }} />
            </td>
        ))}
    </tr>
);

const EmptyRow: React.FC<{ cols: number }> = ({ cols }) => (
    <tr>
        <td colSpan={cols} className="py-16">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-lg bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center">
                    <InboxIcon className="w-6 h-6 text-[#a8a6a1]" />
                </div>
                <div>
                    <p className="text-sm font-medium text-[#2F3437]">Không có tài khoản nào</p>
                    <p className="text-xs text-[#787774] mt-1">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
            </div>
        </td>
    </tr>
);

/* ─── Modal chỉnh bậc ──────────────────────────────────────────────────── */

const EditLevelModal: React.FC<{
    row: SalePermissionLevel;
    levels: SaleDebtLevelOption[];
    onClose: () => void;
    onSaved: () => void;
}> = ({ row, levels, onClose, onSaved }) => {
    const [level, setLevel] = useState(row.level);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const selected = levels.find(l => l.value === level);
    const changed = level !== row.level;

    // Khoá scroll nền + đóng bằng Esc khi modal mở.
    useEffect(() => {
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    const submit = async () => {
        if (!changed) {
            toast('Bậc không thay đổi.', { icon: 'ℹ️' });
            return;
        }
        setSaving(true);
        try {
            const res = await updateSaleDebtLevel(row.userCode, { level, reason: reason.trim() || undefined });
            if (!res.success) throw new Error(res.message);
            toast.success(res.message || 'Đã cập nhật bậc công nợ');
            onSaved();
            onClose();
        } catch (e: any) {
            toast.error(errText(e, 'Không cập nhật được bậc công nợ'));
        } finally {
            setSaving(false);
        }
    };

    /*
     * Render qua portal ra thẳng document.body.
     *
     * BẮT BUỘC: <main> của AdminLayout mang class .animate-admin-enter, mà animation
     * đó khai báo `both` nên transform: translateY(0) DÍNH LẠI vĩnh viễn. Ancestor có
     * transform sẽ thành containing block của position:fixed → inset-0 bám chiều cao
     * CẢ TRANG thay vì viewport, modal rơi xuống giữa trang. Portal thoát khỏi cây đó.
     */
    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4 overflow-y-auto py-8"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-lg bg-white border border-[#EAEAEA] shadow-lg my-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#EAEAEA]">
                    <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">Điều chỉnh bậc công nợ</p>
                        <p className="text-base font-semibold text-[#111111] truncate mt-0.5">
                            {row.fullName || row.loginName || row.userCode}
                        </p>
                        <p className="text-xs text-[#787774] mt-0.5">
                            {row.userCode}
                            {row.loginName ? ` · ${row.loginName}` : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[#F1F0EC] text-[#787774]">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-4 space-y-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-[#787774] font-medium mb-2">Bậc mới</p>
                        <div className="space-y-1.5">
                            {levels.map(opt => {
                                const pastel = TONE_PASTEL[levelTone(opt.value)];
                                const isSel = opt.value === level;
                                return (
                                    <label
                                        key={opt.value}
                                        className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                                            isSel ? 'border-[#111111] bg-[#F7F6F3]' : 'border-[#EAEAEA] hover:bg-[#F7F6F3]'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="level"
                                            className="mt-1"
                                            checked={isSel}
                                            onChange={() => setLevel(opt.value)}
                                        />
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                                                    style={{ background: pastel.bg, color: pastel.fg }}
                                                >
                                                    <span className="font-semibold tabular-nums">{opt.value}</span>
                                                    {opt.name}
                                                </span>
                                                {opt.value === row.level && (
                                                    <span className="text-[11px] text-[#787774]">(hiện tại)</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#5f5e5b] mt-1">{opt.description}</p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.08em] text-[#787774] font-medium mb-1.5">
                            Lý do
                        </label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            rows={2}
                            maxLength={500}
                            placeholder="VD: Công nợ quá hạn 45 ngày, tồn 120tr"
                            className="w-full px-3 py-2 rounded-md border border-[#EAEAEA] text-sm focus:outline-none focus:border-[#111111]"
                        />
                        <p className="text-[11px] text-[#787774] mt-1">
                            Ghi vào log hệ thống kèm bậc cũ → bậc mới. Không lưu vào DB.
                        </p>
                    </div>

                    {selected && selected.blockedActions.length > 0 && (
                        <div className="rounded-md bg-[#FDEBEC] px-3 py-2.5">
                            <p className="text-xs font-medium text-[#9F2F2D]">Sau khi lưu, tài khoản này sẽ bị chặn:</p>
                            <p className="text-xs text-[#9F2F2D] mt-1">
                                {selected.blockedActions.map(a => ACTION_LABELS[a] || a).join(' · ')}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#EAEAEA]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm text-[#5f5e5b] hover:bg-[#F1F0EC] transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={submit}
                        disabled={saving || !changed}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-[#111111] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2F3437] active:scale-[0.98] transition-all"
                    >
                        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ─── Page ─────────────────────────────────────────────────────────────── */

const AdminSaleDebt: React.FC = () => {
    const [summary, setSummary] = useState<SaleDebtSummary | null>(null);
    const [levels, setLevels] = useState<SaleDebtLevelOption[]>([]);
    const [rows, setRows] = useState<SalePermissionLevel[]>([]);

    const [keyword, setKeyword] = useState('');
    const [levelFilter, setLevelFilter] = useState<number | null>(null);

    const [loadingSummary, setLoadingSummary] = useState(true);
    const [loadingRows, setLoadingRows] = useState(true);
    const [editing, setEditing] = useState<SalePermissionLevel | null>(null);

    // Phân trang phía client — API trả full list nên cắt trang tại đây.
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    // Lấy hết — không lọc IsAcctive, không lọc IsDelete. Tổng khớp COUNT(*) của bosUser.
    const fetchSummary = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const res = await getSaleDebtSummary();
            setSummary(res.data);
        } catch (e: any) {
            toast.error(errText(e, 'Không tải được tổng hợp công nợ'));
        } finally {
            setLoadingSummary(false);
        }
    }, []);

    const fetchRows = useCallback(async () => {
        setLoadingRows(true);
        try {
            const res = await getSaleDebtList({ keyword, level: levelFilter });
            setRows(res.data || []);
            setPage(1); // đổi bộ lọc → về trang đầu, tránh đứng ở trang trống
        } catch (e: any) {
            toast.error(errText(e, 'Không tải được danh sách tài khoản'));
            setRows([]);
        } finally {
            setLoadingRows(false);
        }
    }, [keyword, levelFilter]);

    // Danh mục bậc lấy từ BE — không hardcode để ma trận chặn đổi thì UI theo luôn.
    useEffect(() => {
        getSaleDebtLevels()
            .then(res => setLevels(res.data || []))
            .catch(e => toast.error(errText(e, 'Không tải được danh mục bậc')));
    }, []);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);
    useEffect(() => { fetchRows(); }, [levelFilter]); // eslint-disable-line react-hooks/exhaustive-deps

    const refreshAll = () => { fetchSummary(); fetchRows(); };

    const onSearch = (e: React.FormEvent) => { e.preventDefault(); fetchRows(); };

    const blockedPct = useMemo(() => {
        if (!summary || summary.total === 0) return 0;
        return Math.round((summary.blocked / summary.total) * 1000) / 10;
    }, [summary]);

    const loading = loadingSummary || loadingRows;

    /* ─── Phân trang ─── */
    const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const pagedRows = useMemo(
        () => rows.slice((safePage - 1) * pageSize, safePage * pageSize),
        [rows, safePage, pageSize]
    );
    const rangeFrom = rows.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const rangeTo = Math.min(safePage * pageSize, rows.length);
    const blockedInFilter = useMemo(() => rows.filter(r => isBlockingLevel(r.level)).length, [rows]);

    const goPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-6 mb-6 border-b border-[#EAEAEA]">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">Kiểm soát công nợ</p>
                    <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#111111] mt-0.5">
                        Trạng thái chặn của nhân viên kinh doanh
                    </h1>
                    <p className="text-sm text-[#787774] mt-1 max-w-[75ch]">
                        Bậc công nợ nằm ở cột <span className="text-[#111111] font-medium">bosUser.PermissionLevels</span>,
                        do Khánh Linh đẩy sang qua API. Sale vẫn đăng nhập được ở mọi bậc — chỉ nghiệp vụ
                        lên đơn / lên hợp đồng bị chặn. Tool cache 5 phút nên thay đổi có độ trễ tối đa 5 phút.
                    </p>
                </div>
                <button
                    onClick={refreshAll}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-white border border-[#EAEAEA] text-[#2F3437] hover:bg-[#F7F6F3] active:scale-[0.98] transition-all duration-200 flex-shrink-0"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Đang tải' : 'Làm mới'}
                </button>
            </div>

            {/* KPI — bấm để lọc nhanh */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <StatCard
                    loading={loadingSummary} title="Tổng tài khoản" tone="neutral" icon={UsersIcon}
                    value={summary?.total ?? 0}
                    delta="Toàn bộ bosUser — không lọc IsAcctive/IsDelete"
                    active={levelFilter === null}
                    onClick={() => setLevelFilter(null)}
                />
                <StatCard
                    loading={loadingSummary} title="Bình thường" tone="green" icon={CheckCircleIcon}
                    value={summary?.normal ?? 0} delta="Bậc 0 — không hạn chế"
                    active={levelFilter === 0}
                    onClick={() => setLevelFilter(0)}
                />
                <StatCard
                    loading={loadingSummary} title="Đang cảnh báo" tone="yellow" icon={BellAlertIcon}
                    value={summary?.warned ?? 0} delta="Bậc 1–2 — vẫn lên đơn được"
                />
                <StatCard
                    loading={loadingSummary} title="Đang bị chặn" tone="red" icon={ShieldExclamationIcon}
                    value={summary?.blocked ?? 0} delta={`Bậc 3–4 · ${blockedPct}% tổng số`}
                />
            </div>

            {/* Phân bố theo bậc */}
            <div className="rounded-lg bg-white border border-[#EAEAEA] p-5 mb-6">
                <p className="text-[11px] uppercase tracking-[0.08em] text-[#787774] font-medium mb-4">
                    Phân bố theo bậc — bấm để lọc bảng bên dưới
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {(summary?.levels || []).map(l => {
                        const pastel = TONE_PASTEL[levelTone(l.level)];
                        const isSel = levelFilter === l.level;
                        return (
                            <button
                                key={l.level}
                                onClick={() => setLevelFilter(isSel ? null : l.level)}
                                className={`text-left rounded-md border p-3 transition-all duration-200 hover:bg-[#F7F6F3] active:scale-[0.99] ${
                                    isSel ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#EAEAEA]'
                                }`}
                            >
                                <span
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
                                    style={{ background: pastel.bg, color: pastel.fg }}
                                >
                                    <span className="font-semibold tabular-nums">{l.level}</span>
                                    {l.name}
                                </span>
                                <p className="text-2xl font-semibold text-[#111111] mt-2 tabular-nums">{l.count}</p>
                                <div className="h-1 rounded-full bg-[#F1F0EC] mt-2 overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${l.percent}%`, background: pastel.fg }} />
                                </div>
                                <p className="text-[11px] text-[#787774] mt-1.5">{l.percent}% tổng số</p>
                                <p className="text-[11px] text-[#5f5e5b] mt-1.5 leading-snug">
                                    {l.blockedActions.length === 0
                                        ? 'Không chặn nghiệp vụ nào'
                                        : `Chặn: ${l.blockedActions.map(a => ACTION_LABELS[a] || a).join(', ')}`}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                <form onSubmit={onSearch} className="relative flex-1 min-w-0">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a6a1]" />
                    <input
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        placeholder="Tìm theo mã NV, tên đăng nhập hoặc họ tên…"
                        className="w-full pl-9 pr-3 py-2 rounded-md border border-[#EAEAEA] bg-white text-sm focus:outline-none focus:border-[#111111]"
                    />
                </form>

                <select
                    value={levelFilter ?? ''}
                    onChange={e => setLevelFilter(e.target.value === '' ? null : Number(e.target.value))}
                    className="px-3 py-2 rounded-md border border-[#EAEAEA] bg-white text-sm focus:outline-none focus:border-[#111111]"
                >
                    <option value="">Tất cả bậc</option>
                    {levels.map(l => (
                        <option key={l.value} value={l.value}>{l.value} — {l.name}</option>
                    ))}
                </select>

            </div>

            {/* Bảng */}
            <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-[#FAFAF9] border-b border-[#EAEAEA]">
                            <tr>
                                <th className={thCls}>Mã NV</th>
                                <th className={thCls}>Họ tên</th>
                                <th className={thCls}>Đăng nhập</th>
                                <th className={thCls}>Bậc</th>
                                <th className={thCls}>Nghiệp vụ bị chặn</th>
                                <th className={thCls}>Người đặt</th>
                                <th className={thCls}>Thời điểm</th>
                                <th className={thCls}></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F0EC]">
                            {loadingRows ? (
                                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)
                            ) : pagedRows.length === 0 ? (
                                <EmptyRow cols={8} />
                            ) : (
                                pagedRows.map(r => (
                                    <tr key={r.userCode} className="hover:bg-[#FAFAF9] transition-colors">
                                        <td className="px-3 py-3 font-medium text-[#111111] tabular-nums whitespace-nowrap">
                                            {r.userCode}
                                        </td>
                                        <td className="px-3 py-3 text-[#2F3437]">
                                            {r.fullName || '—'}
                                            {r.isDelete && (
                                                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-[#FDEBEC] text-[#9F2F2D] whitespace-nowrap">
                                                    đã xóa
                                                </span>
                                            )}
                                            {!r.isAcctive && !r.isDelete && (
                                                <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded bg-[#F1F0EC] text-[#787774] whitespace-nowrap">
                                                    ngừng hoạt động
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-[#5f5e5b]">{r.loginName || '—'}</td>
                                        <td className="px-3 py-3">
                                            <LevelBadge level={r.level} name={r.levelName} />
                                        </td>
                                        <td className="px-3 py-3 text-xs text-[#5f5e5b]">
                                            {r.blockedActions.length === 0 ? (
                                                <span className="text-[#787774]">—</span>
                                            ) : (
                                                r.blockedActions
                                                    .map((a: SaleBusinessAction) => ACTION_LABELS[a] || a)
                                                    .join(' · ')
                                            )}
                                        </td>
                                        <td className="px-3 py-3 text-[#5f5e5b] whitespace-nowrap">{r.chgeUser || '—'}</td>
                                        <td className="px-3 py-3 text-[#787774] whitespace-nowrap text-xs">
                                            {fmtDateTime(r.chgeDate)}
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                onClick={() => setEditing(r)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#2F3437] border border-[#EAEAEA] hover:bg-[#F7F6F3] active:scale-[0.98] transition-all whitespace-nowrap"
                                            >
                                                <PencilSquareIcon className="w-3.5 h-3.5" />
                                                Chỉnh bậc
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loadingRows && rows.length > 0 && (
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-4 py-3 border-t border-[#EAEAEA] bg-[#FAFAF9]">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="text-xs text-[#787774]">
                                <span className="tabular-nums font-medium text-[#2F3437]">{rangeFrom}–{rangeTo}</span>
                                {' / '}
                                <span className="tabular-nums font-medium text-[#2F3437]">{rows.length}</span> tài khoản
                                {levelFilter !== null && ` · lọc bậc ${levelFilter}`}
                            </p>
                            {blockedInFilter > 0 && (
                                <p className="text-xs text-[#9F2F2D] flex items-center gap-1.5">
                                    <LockClosedIcon className="w-3.5 h-3.5" />
                                    {blockedInFilter} đang bị chặn nghiệp vụ
                                </p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={pageSize}
                                onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="px-2 py-1.5 rounded-md border border-[#EAEAEA] bg-white text-xs focus:outline-none focus:border-[#111111]"
                            >
                                {[20, 50, 100, 200].map(n => (
                                    <option key={n} value={n}>{n} dòng/trang</option>
                                ))}
                            </select>

                            <div className="flex items-center gap-1">
                                <PageBtn onClick={() => goPage(1)} disabled={safePage === 1} label="Trang đầu">
                                    <ChevronDoubleLeftIcon className="w-4 h-4" />
                                </PageBtn>
                                <PageBtn onClick={() => goPage(safePage - 1)} disabled={safePage === 1} label="Trang trước">
                                    <ChevronLeftIcon className="w-4 h-4" />
                                </PageBtn>

                                <span className="px-2 text-xs text-[#5f5e5b] tabular-nums whitespace-nowrap">
                                    Trang {safePage} / {totalPages}
                                </span>

                                <PageBtn onClick={() => goPage(safePage + 1)} disabled={safePage === totalPages} label="Trang sau">
                                    <ChevronRightIcon className="w-4 h-4" />
                                </PageBtn>
                                <PageBtn onClick={() => goPage(totalPages)} disabled={safePage === totalPages} label="Trang cuối">
                                    <ChevronDoubleRightIcon className="w-4 h-4" />
                                </PageBtn>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {editing && (
                <EditLevelModal
                    row={editing}
                    levels={levels}
                    onClose={() => setEditing(null)}
                    onSaved={refreshAll}
                />
            )}
        </div>
    );
};

export default AdminSaleDebt;
