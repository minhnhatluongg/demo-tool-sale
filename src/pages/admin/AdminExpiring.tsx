import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ClockIcon,
    ShieldExclamationIcon,
    CheckBadgeIcon,
    InboxIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';
import {
    getTvanExpiringSoon,
    getCertExpire,
    TvanRenewalItem,
    CertExpireItem,
} from '../../api/adminService';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const fmtDate = (s?: string | null) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('vi-VN');
};

/* ─── TVAN Range badges — muted pastel palette ─────────────────────────── */

const rangeOptions = [
    { key: '', label: 'Tất cả', tone: 'bg-[#F1F0EC] text-[#5f5e5b]' },
    { key: 'EXPIRED', label: 'Đã hết hạn', tone: 'bg-[#FDEBEC] text-[#9F2F2D]' },
    { key: 'D7', label: '≤ 7 ngày', tone: 'bg-[#FDEBEC] text-[#9F2F2D]' },
    { key: 'D15', label: '8–15 ngày', tone: 'bg-[#FBF3DB] text-[#956400]' },
    { key: 'D30', label: '16–30 ngày', tone: 'bg-[#FBF3DB] text-[#956400]' },
    { key: 'M3', label: '1–3 tháng', tone: 'bg-[#E1F3FE] text-[#1F6C9F]' },
    { key: 'SAFE', label: '> 90 ngày', tone: 'bg-[#EDF3EC] text-[#346538]' },
];

const getRangeTone = (key?: string) => {
    const found = rangeOptions.find(r => r.key === key);
    return found?.tone || 'bg-[#F1F0EC] text-[#5f5e5b]';
};

const getRangeLabel = (key?: string) => {
    const found = rangeOptions.find(r => r.key === key);
    return found?.label || key || '—';
};

/* ─── Days-remaining text tone ─────────────────────────────────────────── */

const daysTone = (d: number | null | undefined) => {
    if (d == null) return 'text-[#787774]';
    if (d < 0) return 'text-[#9F2F2D]';
    if (d <= 30) return 'text-[#956400]';
    return 'text-[#346538]';
};

/* ─── Tab type ─────────────────────────────────────────────────────────── */

type TabKey = 'tvan' | 'cert';

/* ─── Shared cell / header styles ──────────────────────────────────────── */

const thCls = 'text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap';

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-3 py-3">
                <div className="h-3.5 rounded bg-[#EFEEEA] animate-pulse" style={{ maxWidth: 70 + (i * 53) % 130 }} />
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
                    <p className="text-sm font-medium text-[#2F3437]">Không có dữ liệu</p>
                    <p className="text-xs text-[#787774] mt-1">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                </div>
            </div>
        </td>
    </tr>
);

/* ─── Page ─────────────────────────────────────────────────────────────── */

const AdminExpiring: React.FC = () => {
    const [tab, setTab] = useState<TabKey>('tvan');

    /* ─── TVAN state ─── */
    const [tvanRows, setTvanRows] = useState<TvanRenewalItem[]>([]);
    const [tvanTotal, setTvanTotal] = useState(0);
    const [tvanPage, setTvanPage] = useState(1);
    const [tvanSize, setTvanSize] = useState(20);
    const [tvanSearch, setTvanSearch] = useState('');
    const [tvanRange, setTvanRange] = useState('');
    const [tvanLoading, setTvanLoading] = useState(false);

    /* ─── Cert state ─── */
    const [certRows, setCertRows] = useState<CertExpireItem[]>([]);
    const [certTotal, setCertTotal] = useState(0);
    const [certPage, setCertPage] = useState(1);
    const [certSize, setCertSize] = useState(20);
    const [certSearch, setCertSearch] = useState('');
    const [certLoading, setCertLoading] = useState(false);

    /* ─── Column resize state ─── */
    const [customerNameWidth, setCustomerNameWidth] = useState(220);
    const [saleNameWidth, setSaleNameWidth] = useState(150);
    const [resizingCol, setResizingCol] = useState<'customer' | 'sale' | null>(null);
    const [resizeStartX, setResizeStartX] = useState(0);

    /* ─── Resize handlers ─── */
    const handleResizeStart = (col: 'customer' | 'sale', e: React.MouseEvent) => {
        e.preventDefault();
        setResizingCol(col);
        setResizeStartX(e.clientX);
    };

    React.useEffect(() => {
        if (!resizingCol) return;

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - resizeStartX;
            if (resizingCol === 'customer') {
                setCustomerNameWidth(prev => Math.max(100, prev + delta));
            } else if (resizingCol === 'sale') {
                setSaleNameWidth(prev => Math.max(100, prev + delta));
            }
            setResizeStartX(e.clientX);
        };

        const handleMouseUp = () => {
            setResizingCol(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingCol, resizeStartX]);

    /* ─── TVAN fetch ─── */
    const fetchTvan = async (p = tvanPage, s = tvanSize, rangeKey?: string) => {
        setTvanLoading(true);
        try {
            const res = await getTvanExpiringSoon({
                daysBeforeExpiry: 90,
                includeExpired: true,
                keyword: tvanSearch || undefined,
                rangeKey: rangeKey !== undefined ? rangeKey : tvanRange || undefined,
                page: p,
                size: s,
            });
            const payload = res?.data ?? res;
            const items: TvanRenewalItem[] = payload?.items ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
            const total: number = payload?.total ?? payload?.totalRecords ?? payload?.totalCount ?? items.length;
            setTvanRows(items);
            setTvanTotal(total);
            setTvanPage(p);
            setTvanSize(s);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Lỗi tải TVAN');
            setTvanRows([]);
            setTvanTotal(0);
        } finally {
            setTvanLoading(false);
        }
    };

    /* ─── Cert fetch ─── */
    const fetchCert = async (p = certPage, s = certSize) => {
        setCertLoading(true);
        try {
            const res = await getCertExpire({
                page: p,
                pageSize: s,
                searchKeyword: certSearch || undefined,
            });
            const payload = res?.data ?? res;
            const items: CertExpireItem[] = payload?.data ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
            const total: number = payload?.total ?? payload?.totalRecords ?? payload?.totalCount ?? items.length;
            setCertRows(items);
            setCertTotal(total);
            setCertPage(p);
            setCertSize(s);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Lỗi tải Cert Expire');
            setCertRows([]);
            setCertTotal(0);
        } finally {
            setCertLoading(false);
        }
    };

    useEffect(() => {
        fetchTvan(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (tab === 'cert' && certRows.length === 0 && !certLoading) {
            fetchCert(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const tvanTotalPages = Math.max(1, Math.ceil(tvanTotal / tvanSize));
    const certTotalPages = Math.max(1, Math.ceil(certTotal / certSize));

    /* ─── Pagination helper ─── */
    const PaginationBar: React.FC<{
        page: number; totalPages: number; total: number; pageSize: number;
        loading: boolean;
        onPageChange: (p: number) => void;
        onSizeChange: (s: number) => void;
    }> = ({ page, totalPages, total, pageSize, loading, onPageChange, onSizeChange }) => (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAEAEA] text-sm flex-wrap gap-3 bg-[#FBFBFA]">
            <div className="flex items-center gap-3 text-[#787774]">
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    Tổng <span className="text-[#111111] font-medium">{total.toLocaleString('vi-VN')}</span> bản ghi
                    — trang {page}/{totalPages}
                </span>
                <select
                    value={pageSize}
                    onChange={e => onSizeChange(Number(e.target.value))}
                    className="bg-white border border-[#EAEAEA] rounded-md px-2 py-1 text-xs text-[#2F3437] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                >
                    {[10, 20, 50, 100].map(s => (
                        <option key={s} value={s}>{s} / trang</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-1">
                <button disabled={page <= 1 || loading} onClick={() => onPageChange(1)} title="Trang đầu"
                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150">
                    <ChevronDoubleLeftIcon className="w-3.5 h-3.5" />
                </button>
                <button disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} title="Trang trước"
                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150">
                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                {(() => {
                    const pages: (number | '...')[] = [];
                    if (totalPages <= 7) {
                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                        pages.push(1);
                        if (page > 3) pages.push('...');
                        for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
                        if (page < totalPages - 2) pages.push('...');
                        pages.push(totalPages);
                    }
                    return pages.map((p, idx) =>
                        p === '...' ? (
                            <span key={'e' + idx} className="px-1.5 text-[#a8a6a1]">…</span>
                        ) : (
                            <button key={p} disabled={loading} onClick={() => onPageChange(p as number)}
                                style={{ fontVariantNumeric: 'tabular-nums' }}
                                className={`min-w-[30px] h-[30px] px-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                                    p === page ? 'bg-[#111111] text-white' : 'text-[#5f5e5b] hover:bg-[#F1F0EC] hover:text-[#111111]'
                                }`}>{p}</button>
                        )
                    );
                })()}
                <button disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} title="Trang sau"
                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150">
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
                <button disabled={page >= totalPages || loading} onClick={() => onPageChange(totalPages)} title="Trang cuối"
                    className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150">
                    <ChevronDoubleRightIcon className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="pb-6 mb-6 border-b border-[#EAEAEA]">
                <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#111111]">Sắp hết hạn</h1>
                <p className="text-sm text-[#787774] mt-1 max-w-[65ch]">
                    Theo dõi hợp đồng TVAN và chứng thư số sắp hoặc đã hết hạn.
                </p>
            </div>

            {/* Tabs — underline style */}
            <div className="flex gap-6 mb-5 border-b border-[#EAEAEA]">
                <button
                    onClick={() => setTab('tvan')}
                    className={`pb-2.5 -mb-px text-sm flex items-center gap-2 border-b-2 transition-colors duration-200 ${
                        tab === 'tvan'
                            ? 'border-[#111111] text-[#111111] font-medium'
                            : 'border-transparent text-[#787774] hover:text-[#111111]'
                    }`}
                >
                    <ClockIcon className="w-4 h-4" />
                    HĐ TVAN hết hạn
                </button>
                <button
                    onClick={() => setTab('cert')}
                    className={`pb-2.5 -mb-px text-sm flex items-center gap-2 border-b-2 transition-colors duration-200 ${
                        tab === 'cert'
                            ? 'border-[#111111] text-[#111111] font-medium'
                            : 'border-transparent text-[#787774] hover:text-[#111111]'
                    }`}
                >
                    <ShieldExclamationIcon className="w-4 h-4" />
                    Chứng thư số hết hạn
                </button>
            </div>

            {/* ═══════════════ TAB: TVAN ═══════════════ */}
            {tab === 'tvan' && (
                <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                    {/* Filters */}
                    <div className="px-4 py-3 border-b border-[#EAEAEA] flex flex-wrap items-center gap-2 bg-[#FBFBFA]">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
                            <input
                                type="text" value={tvanSearch}
                                onChange={e => setTvanSearch(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') fetchTvan(1); }}
                                placeholder="MST, tên KH, sale"
                                className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-[#EAEAEA] text-sm text-[#2F3437] placeholder:text-[#a8a6a1] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                            />
                        </div>
                        {/* Range filter buttons */}
                        <div className="flex flex-wrap gap-1">
                            {rangeOptions.map(r => (
                                <button
                                    key={r.key}
                                    onClick={() => {
                                        setTvanRange(r.key);
                                        fetchTvan(1, tvanSize, r.key);
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150 ${
                                        tvanRange === r.key
                                            ? r.tone + ' ring-1 ring-[#11111120]'
                                            : 'bg-white border border-[#EAEAEA] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3]'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => fetchTvan(1)}
                            className="px-4 py-2 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] transition-all duration-200">
                            Tìm
                        </button>
                        <button onClick={() => fetchTvan(tvanPage)} aria-label="Tải lại"
                            className="p-2 rounded-md bg-white border border-[#EAEAEA] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors duration-200">
                            <ArrowPathIcon className={`w-4 h-4 ${tvanLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto" style={{ userSelect: resizingCol ? 'none' : 'auto', cursor: resizingCol ? 'col-resize' : 'auto' }}>
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#EAEAEA]">
                                    <th className={thCls}>MST</th>
                                    <th className={`${thCls} relative group`}>
                                        Khách hàng
                                        <div
                                            onMouseDown={(e) => handleResizeStart('customer', e)}
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#111111] transition-colors opacity-0 group-hover:opacity-100"
                                        />
                                    </th>
                                    <th className={`${thCls} relative group`}>
                                        Sale
                                        <div
                                            onMouseDown={(e) => handleResizeStart('sale', e)}
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[#111111] transition-colors opacity-0 group-hover:opacity-100"
                                        />
                                    </th>
                                    <th className={thCls}>Mã Sale</th>
                                    <th className={thCls}>Mã hợp đồng</th>
                                    <th className={thCls}>Ngày hết hạn</th>
                                    <th className={`${thCls} text-center`}>Còn lại</th>
                                    <th className={`${thCls} text-center`}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F0EC]">
                                {tvanLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={8} />)}
                                {!tvanLoading && tvanRows.length === 0 && <EmptyRow cols={8} />}
                                {!tvanLoading && tvanRows.map((r, idx) => (
                                    <tr key={(r.oid || r.taxNumber || '') + idx} className="hover:bg-[#FBFBFA] transition-colors duration-150">
                                        <td className="px-3 py-2.5 font-mono text-xs text-[#2F3437] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.taxNumber || '—'}</td>
                                        <td className="px-3 py-2.5 truncate font-medium text-[#111111]" style={{ maxWidth: `${customerNameWidth}px` }} title={r.customerName}>{r.customerName || '—'}</td>
                                        <td className="px-3 py-2.5 text-[#5f5e5b] truncate" style={{ maxWidth: `${saleNameWidth}px` }} title={r.saleFullName || r.saleCode}>{r.saleFullName || r.saleCode || '—'}</td>
                                        <td className="px-3 py-2.5 text-[#787774] text-xs whitespace-nowrap">{r.saleCode || '—'}</td>
                                        <td className="px-3 py-2.5 text-[#787774] text-xs font-mono">{r.contractOID || '—'}</td>
                                        <td className="px-3 py-2.5 text-[#5f5e5b] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDate(r.expiryDate)}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`font-semibold text-xs ${daysTone(r.daysRemaining)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                {r.daysRemaining != null ? `${r.daysRemaining} ngày` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.05em] ${getRangeTone(r.rangeKey)}`}>
                                                {getRangeLabel(r.rangeKey)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <PaginationBar
                        page={tvanPage} totalPages={tvanTotalPages} total={tvanTotal} pageSize={tvanSize} loading={tvanLoading}
                        onPageChange={p => fetchTvan(p)} onSizeChange={s => fetchTvan(1, s)}
                    />
                </div>
            )}

            {/* ═══════════════ TAB: CERT EXPIRE ═══════════════ */}
            {tab === 'cert' && (
                <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                    {/* Filters */}
                    <div className="px-4 py-3 border-b border-[#EAEAEA] flex flex-wrap items-center gap-2 bg-[#FBFBFA]">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
                            <input
                                type="text" value={certSearch}
                                onChange={e => setCertSearch(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') fetchCert(1); }}
                                placeholder="MST, tên công ty, sale"
                                className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-[#EAEAEA] text-sm text-[#2F3437] placeholder:text-[#a8a6a1] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                            />
                        </div>
                        <button onClick={() => fetchCert(1)}
                            className="px-4 py-2 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] transition-all duration-200">
                            Tìm
                        </button>
                        <button onClick={() => fetchCert(certPage)} aria-label="Tải lại"
                            className="p-2 rounded-md bg-white border border-[#EAEAEA] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors duration-200">
                            <ArrowPathIcon className={`w-4 h-4 ${certLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#EAEAEA]">
                                    <th className={thCls}>Nhà cung cấp</th>
                                    <th className={thCls}>MST</th>
                                    <th className={thCls}>Công ty</th>
                                    <th className={thCls}>Ngày hết hạn</th>
                                    <th className={thCls}>SĐT</th>
                                    <th className={thCls}>Email</th>
                                    <th className={thCls}>Sale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F0EC]">
                                {certLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={7} />)}
                                {!certLoading && certRows.length === 0 && <EmptyRow cols={7} />}
                                {!certLoading && certRows.map((r, idx) => {
                                    const expDate = r.certNotAfterDate ? new Date(r.certNotAfterDate) : null;
                                    const daysLeft = expDate ? Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                                    const phone = [r.tel1, r.tel2, r.tel3].filter(Boolean).join(', ') || '—';
                                    const email = [r.email1, r.email2, r.email3].filter(Boolean)[0] || '—';
                                    return (
                                        <tr key={(r.certSerialNumber || '') + idx} className="hover:bg-[#FBFBFA] transition-colors duration-150">
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-[0.05em] ${
                                                    r.certSubjectName === 'WINCA'
                                                        ? 'bg-[#E1F3FE] text-[#1F6C9F]'
                                                        : 'bg-[#F1F0EC] text-[#5f5e5b]'
                                                }`}>
                                                    <CheckBadgeIcon className="w-3 h-3" />
                                                    {r.certSubjectName || '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-xs text-[#2F3437] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.taxnumber || '—'}</td>
                                            <td className="px-3 py-2.5 max-w-[220px] truncate font-medium text-[#111111]" title={r.merchantName || ''}>{r.merchantName || '—'}</td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span className={`text-xs font-medium ${
                                                    daysLeft !== null && daysLeft < 0 ? 'text-[#9F2F2D]'
                                                    : daysLeft !== null && daysLeft <= 30 ? 'text-[#956400]'
                                                    : 'text-[#5f5e5b]'
                                                }`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    {fmtDate(r.certNotAfterDate)}
                                                    {daysLeft !== null && (
                                                        <span className="ml-1 text-[10px] opacity-70">
                                                            ({daysLeft < 0 ? `quá ${Math.abs(daysLeft)} ngày` : `${daysLeft} ngày`})
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-[#787774] text-xs whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{phone}</td>
                                            <td className="px-3 py-2.5 text-[#787774] text-xs max-w-[180px] truncate" title={email}>{email}</td>
                                            <td className="px-3 py-2.5 text-[#5f5e5b] text-xs max-w-[140px] truncate" title={r.saleFullName || ''}>
                                                {r.saleFullName || r.saleLoginName || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <PaginationBar
                        page={certPage} totalPages={certTotalPages} total={certTotal} pageSize={certSize} loading={certLoading}
                        onPageChange={p => fetchCert(p)} onSizeChange={s => fetchCert(1, s)}
                    />
                </div>
            )}
        </div>
    );
};

export default AdminExpiring;
