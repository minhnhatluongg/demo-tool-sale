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
    DocumentTextIcon,
    MagnifyingGlassCircleIcon,
    BuildingOffice2Icon,
    IdentificationIcon,
} from '@heroicons/react/24/outline';
import {
    getTvanExpiringSoon,
    getCertExpire,
    getLowRemainingInv,
    TvanRenewalItem,
    CertExpireItem,
    LowRemainingInvItem,
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

/* ─── Số hóa đơn còn lại — tone theo mức cảnh báo ──────────────────────── */

const invRemainTone = (remain?: number | null) => {
    if (remain == null) return 'text-[#787774]';
    if (remain <= 0) return 'text-[#9F2F2D]';
    if (remain <= 50) return 'text-[#956400]';
    return 'text-[#346538]';
};

/* ─── Cert days-left từ ngày hết hạn ────────────────────────────────────── */

const certDaysLeft = (s?: string | null) => {
    if (!s) return null;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

/* ─── Tab type ─────────────────────────────────────────────────────────── */

type TabKey = 'tvan' | 'cert' | 'inv' | 'lookup';

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

    /* ─── Số hóa đơn còn lại (low-remaining-inv) state ─── */
    const [invRows, setInvRows] = useState<LowRemainingInvItem[]>([]);
    const [invTotal, setInvTotal] = useState(0);
    const [invPage, setInvPage] = useState(1);
    const [invSize, setInvSize] = useState(20);
    const [invSearch, setInvSearch] = useState('');
    const [invLoading, setInvLoading] = useState(false);

    /* ─── Tra cứu tổng quát theo MST state ─── */
    const [lookupMst, setLookupMst] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupDone, setLookupDone] = useState(false);
    const [lookupTvan, setLookupTvan] = useState<TvanRenewalItem[]>([]);
    const [lookupCert, setLookupCert] = useState<CertExpireItem[]>([]);
    const [lookupInv, setLookupInv] = useState<LowRemainingInvItem[]>([]);

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

    /* ─── Số hóa đơn còn lại fetch ─── */
    const fetchInv = async (p = invPage, s = invSize) => {
        setInvLoading(true);
        try {
            const res = await getLowRemainingInv({
                page: p,
                pageSize: s,
                searchKeyword: invSearch || undefined,
            });
            const payload = res?.data ?? res;
            const items: LowRemainingInvItem[] = payload?.data ?? payload?.items ?? (Array.isArray(payload) ? payload : []);
            const total: number = payload?.total ?? payload?.totalRecords ?? payload?.totalCount ?? items.length;
            setInvRows(items);
            setInvTotal(total);
            setInvPage(p);
            setInvSize(s);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Lỗi tải số hóa đơn còn lại');
            setInvRows([]);
            setInvTotal(0);
        } finally {
            setInvLoading(false);
        }
    };

    /* ─── Tra cứu tổng quát theo MST — gộp 3 nguồn ─── */
    const runLookup = async (mstArg?: string) => {
        const mst = (mstArg ?? lookupMst).trim();
        if (!mst) {
            toast.error('Nhập mã số thuế để tra cứu');
            return;
        }
        setLookupLoading(true);
        setLookupDone(false);
        try {
            const [tvanRes, certRes, invRes] = await Promise.allSettled([
                getTvanExpiringSoon({ keyword: mst, daysBeforeExpiry: 3650, includeExpired: true, page: 1, size: 100 }),
                getCertExpire({ searchKeyword: mst, page: 1, pageSize: 100 }),
                getLowRemainingInv({ searchKeyword: mst, page: 1, pageSize: 100 }),
            ]);

            const pick = (r: PromiseSettledResult<any>, keysFirst: 'data' | 'items') => {
                if (r.status !== 'fulfilled') return [];
                const payload = r.value?.data ?? r.value;
                const a = keysFirst === 'items'
                    ? (payload?.items ?? payload?.data)
                    : (payload?.data ?? payload?.items);
                return a ?? (Array.isArray(payload) ? payload : []);
            };

            const tvan: TvanRenewalItem[] = pick(tvanRes, 'items');
            const cert: CertExpireItem[] = pick(certRes, 'data');
            const inv: LowRemainingInvItem[] = pick(invRes, 'data');

            // Chỉ giữ đúng MST đã nhập (API là "search" nên có thể trả gần đúng)
            const eq = (v?: string) => (v || '').replace(/\s/g, '') === mst.replace(/\s/g, '');
            setLookupTvan(tvan.filter(x => eq(x.taxNumber) || eq(x.mst) || tvan.length <= 3));
            setLookupCert(cert.filter(x => eq(x.taxnumber) || cert.length <= 3));
            setLookupInv(inv.filter(x => eq(x.taxnumber) || inv.length <= 3));
            setLookupDone(true);

            if (!tvan.length && !cert.length && !inv.length) {
                toast('Không có dữ liệu cảnh báo cho MST này (có thể vẫn còn hạn / đủ số).', { icon: 'ℹ️' });
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Lỗi tra cứu');
        } finally {
            setLookupLoading(false);
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
        if (tab === 'inv' && invRows.length === 0 && !invLoading) {
            fetchInv(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    const tvanTotalPages = Math.max(1, Math.ceil(tvanTotal / tvanSize));
    const certTotalPages = Math.max(1, Math.ceil(certTotal / certSize));
    const invTotalPages = Math.max(1, Math.ceil(invTotal / invSize));

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
                    Theo dõi hợp đồng TVAN, chứng thư số và số hóa đơn sắp/đã hết hạn — hoặc tra cứu tổng quát theo mã số thuế.
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
                <button
                    onClick={() => setTab('inv')}
                    className={`pb-2.5 -mb-px text-sm flex items-center gap-2 border-b-2 transition-colors duration-200 ${
                        tab === 'inv'
                            ? 'border-[#111111] text-[#111111] font-medium'
                            : 'border-transparent text-[#787774] hover:text-[#111111]'
                    }`}
                >
                    <DocumentTextIcon className="w-4 h-4" />
                    Số hóa đơn còn lại
                </button>
                <button
                    onClick={() => setTab('lookup')}
                    className={`pb-2.5 -mb-px text-sm flex items-center gap-2 border-b-2 transition-colors duration-200 ${
                        tab === 'lookup'
                            ? 'border-[#111111] text-[#111111] font-medium'
                            : 'border-transparent text-[#787774] hover:text-[#111111]'
                    }`}
                >
                    <MagnifyingGlassCircleIcon className="w-4 h-4" />
                    Tra cứu tổng quát
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

            {/* ═══════════════ TAB: SỐ HÓA ĐƠN CÒN LẠI ═══════════════ */}
            {tab === 'inv' && (
                <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                    {/* Filters */}
                    <div className="px-4 py-3 border-b border-[#EAEAEA] flex flex-wrap items-center gap-2 bg-[#FBFBFA]">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
                            <input
                                type="text" value={invSearch}
                                onChange={e => setInvSearch(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') fetchInv(1); }}
                                placeholder="MST, tên công ty, sale"
                                className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-[#EAEAEA] text-sm text-[#2F3437] placeholder:text-[#a8a6a1] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                            />
                        </div>
                        <button onClick={() => fetchInv(1)}
                            className="px-4 py-2 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] transition-all duration-200">
                            Tìm
                        </button>
                        <button onClick={() => fetchInv(invPage)} aria-label="Tải lại"
                            className="p-2 rounded-md bg-white border border-[#EAEAEA] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors duration-200">
                            <ArrowPathIcon className={`w-4 h-4 ${invLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#EAEAEA]">
                                    <th className={thCls}>MST</th>
                                    <th className={thCls}>Công ty</th>
                                    <th className={thCls}>Mẫu số</th>
                                    <th className={thCls}>Ký hiệu</th>
                                    <th className={`${thCls} text-right`}>Tổng số</th>
                                    <th className={`${thCls} text-right`}>Đã dùng</th>
                                    <th className={`${thCls} text-right`}>Còn lại</th>
                                    <th className={thCls}>SĐT</th>
                                    <th className={thCls}>Sale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F0EC]">
                                {invLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={9} />)}
                                {!invLoading && invRows.length === 0 && <EmptyRow cols={9} />}
                                {!invLoading && invRows.map((r, idx) => {
                                    const phone = [r.tel1, r.tel2, r.tel3].filter(Boolean).join(', ') || '—';
                                    return (
                                        <tr key={(r.taxnumber || '') + (r.invcSign || '') + idx} className="hover:bg-[#FBFBFA] transition-colors duration-150">
                                            <td className="px-3 py-2.5 font-mono text-xs text-[#2F3437] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.taxnumber || '—'}</td>
                                            <td className="px-3 py-2.5 max-w-[220px] truncate font-medium text-[#111111]" title={r.merchantName || ''}>{r.merchantName || '—'}</td>
                                            <td className="px-3 py-2.5 text-[#5f5e5b] text-xs whitespace-nowrap">{r.sampleSign || '—'}</td>
                                            <td className="px-3 py-2.5 text-[#5f5e5b] text-xs whitespace-nowrap">{r.invcSign || '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-[#5f5e5b]" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.invcTotal != null ? r.invcTotal.toLocaleString('vi-VN') : '—'}</td>
                                            <td className="px-3 py-2.5 text-right text-[#787774]" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.invcUsed != null ? r.invcUsed.toLocaleString('vi-VN') : '—'}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <span className={`font-semibold ${invRemainTone(r.invcRemain)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    {r.invcRemain != null ? r.invcRemain.toLocaleString('vi-VN') : '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-[#787774] text-xs whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{phone}</td>
                                            <td className="px-3 py-2.5 text-[#5f5e5b] text-xs max-w-[140px] truncate" title={r.saleFullName || ''}>{r.saleFullName || r.saleLoginName || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <PaginationBar
                        page={invPage} totalPages={invTotalPages} total={invTotal} pageSize={invSize} loading={invLoading}
                        onPageChange={p => fetchInv(p)} onSizeChange={s => fetchInv(1, s)}
                    />
                </div>
            )}

            {/* ═══════════════ TAB: TRA CỨU TỔNG QUÁT ═══════════════ */}
            {tab === 'lookup' && (
                <div className="space-y-5">
                    {/* Ô nhập MST */}
                    <div className="rounded-lg bg-white border border-[#EAEAEA] p-4">
                        <label className="block text-xs font-medium uppercase tracking-[0.08em] text-[#787774] mb-2">
                            Mã số thuế
                        </label>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 min-w-[240px] max-w-sm">
                                <IdentificationIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
                                <input
                                    type="text" value={lookupMst}
                                    onChange={e => setLookupMst(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') runLookup(); }}
                                    placeholder="Nhập MST để tra cứu…"
                                    className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-[#EAEAEA] text-sm font-mono text-[#2F3437] placeholder:text-[#a8a6a1] placeholder:font-sans focus:outline-none focus:border-[#111111] transition-colors duration-200"
                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                />
                            </div>
                            <button onClick={() => runLookup()} disabled={lookupLoading}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] disabled:opacity-40 transition-all duration-200 flex items-center gap-2">
                                {lookupLoading
                                    ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    : <MagnifyingGlassCircleIcon className="w-4 h-4" />}
                                Tra cứu
                            </button>
                        </div>
                        <p className="text-xs text-[#a8a6a1] mt-2">
                            Tổng hợp từ: chứng thư số, hợp đồng TVAN và số lượng hóa đơn còn lại của MST.
                        </p>
                    </div>

                    {/* Trạng thái ban đầu */}
                    {!lookupDone && !lookupLoading && (
                        <div className="rounded-lg bg-white border border-[#EAEAEA] py-16">
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="w-12 h-12 rounded-lg bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center">
                                    <MagnifyingGlassCircleIcon className="w-6 h-6 text-[#a8a6a1]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#2F3437]">Nhập mã số thuế để bắt đầu</p>
                                    <p className="text-xs text-[#787774] mt-1">Kết quả sẽ tổng hợp chữ ký số, TVAN và hóa đơn.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading */}
                    {lookupLoading && (
                        <div className="rounded-lg bg-white border border-[#EAEAEA] py-16 flex items-center justify-center gap-2 text-[#787774] text-sm">
                            <ArrowPathIcon className="w-4 h-4 animate-spin" /> Đang tra cứu…
                        </div>
                    )}

                    {/* Kết quả */}
                    {lookupDone && !lookupLoading && (() => {
                        const company =
                            lookupCert.find(c => c.merchantName)?.merchantName ||
                            lookupInv.find(c => c.merchantName)?.merchantName ||
                            lookupTvan.find(c => c.customerName)?.customerName ||
                            lookupTvan.find(c => c.cusName)?.cusName ||
                            '';
                        const totalRemain = lookupInv.reduce((sum, r) => sum + (r.invcRemain ?? 0), 0);
                        const hasData = lookupCert.length || lookupTvan.length || lookupInv.length;
                        return (
                            <>
                                {/* Tên công ty */}
                                {company && (
                                    <div className="flex items-center gap-2 text-[#111111]">
                                        <BuildingOffice2Icon className="w-5 h-5 text-[#787774]" />
                                        <span className="text-lg font-semibold">{company}</span>
                                        <span className="font-mono text-sm text-[#787774]" style={{ fontVariantNumeric: 'tabular-nums' }}>· {lookupMst.trim()}</span>
                                    </div>
                                )}

                                {!hasData && (
                                    <div className="rounded-lg bg-[#EDF3EC] border border-[#cfe3cf] px-4 py-3 text-sm text-[#346538]">
                                        Không tìm thấy dữ liệu cảnh báo cho MST này — chứng thư số còn hạn, hợp đồng TVAN chưa tới hạn và số hóa đơn còn đủ.
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Card: Chữ ký số */}
                                    <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[#EAEAEA] bg-[#FBFBFA] flex items-center gap-2">
                                            <ShieldExclamationIcon className="w-4 h-4 text-[#787774]" />
                                            <span className="text-sm font-medium text-[#111111]">Chữ ký số</span>
                                            <span className="ml-auto text-xs text-[#787774]">{lookupCert.length} CTS</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {lookupCert.length === 0 && (
                                                <p className="text-xs text-[#787774]">Không có chứng thư số sắp/đã hết hạn.</p>
                                            )}
                                            {lookupCert.map((c, i) => {
                                                const dl = certDaysLeft(c.certNotAfterDate);
                                                return (
                                                    <div key={(c.certSerialNumber || '') + i} className="pb-3 border-b border-[#F1F0EC] last:border-0 last:pb-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                                                                c.certSubjectName === 'WINCA' ? 'bg-[#E1F3FE] text-[#1F6C9F]' : 'bg-[#F1F0EC] text-[#5f5e5b]'
                                                            }`}>
                                                                <CheckBadgeIcon className="w-3 h-3" />{c.certSubjectName || 'CTS'}
                                                            </span>
                                                            {dl != null && (
                                                                <span className={`text-xs font-semibold ${dl < 0 ? 'text-[#9F2F2D]' : dl <= 30 ? 'text-[#956400]' : 'text-[#346538]'}`}>
                                                                    {dl < 0 ? `Đã hết hạn ${Math.abs(dl)} ngày` : `Còn ${dl} ngày`}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-[#787774] space-y-0.5">
                                                            <div>Hết hạn: <span className="text-[#5f5e5b]">{fmtDate(c.certNotAfterDate)}</span></div>
                                                            {c.certSerialNumber && <div className="font-mono truncate" title={c.certSerialNumber}>Serial: {c.certSerialNumber}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Card: HĐ TVAN */}
                                    <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[#EAEAEA] bg-[#FBFBFA] flex items-center gap-2">
                                            <ClockIcon className="w-4 h-4 text-[#787774]" />
                                            <span className="text-sm font-medium text-[#111111]">Hợp đồng TVAN</span>
                                            <span className="ml-auto text-xs text-[#787774]">{lookupTvan.length} HĐ</span>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {lookupTvan.length === 0 && (
                                                <p className="text-xs text-[#787774]">Không có hợp đồng TVAN sắp/đã hết hạn.</p>
                                            )}
                                            {lookupTvan.map((t, i) => (
                                                <div key={(t.contractOID || t.oid || '') + i} className="pb-3 border-b border-[#F1F0EC] last:border-0 last:pb-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${getRangeTone(t.rangeKey)}`}>
                                                            {getRangeLabel(t.rangeKey)}
                                                        </span>
                                                        {t.daysRemaining != null && (
                                                            <span className={`text-xs font-semibold ${daysTone(t.daysRemaining)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                                {t.daysRemaining < 0 ? `Quá ${Math.abs(t.daysRemaining)} ngày` : `Còn ${t.daysRemaining} ngày`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-[#787774] space-y-0.5">
                                                        <div>Hết hạn: <span className="text-[#5f5e5b]">{fmtDate(t.expiryDate)}</span></div>
                                                        {(t.contractOID || t.oid) && <div className="font-mono truncate">Mã HĐ: {t.contractOID || t.oid}</div>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Card: Số hóa đơn */}
                                    <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                                        <div className="px-4 py-3 border-b border-[#EAEAEA] bg-[#FBFBFA] flex items-center gap-2">
                                            <DocumentTextIcon className="w-4 h-4 text-[#787774]" />
                                            <span className="text-sm font-medium text-[#111111]">Số hóa đơn</span>
                                            {lookupInv.length > 0 && (
                                                <span className={`ml-auto text-xs font-semibold ${invRemainTone(totalRemain)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                    Còn {totalRemain.toLocaleString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-3">
                                            {lookupInv.length === 0 && (
                                                <p className="text-xs text-[#787774]">Không có dải hóa đơn sắp/đã hết.</p>
                                            )}
                                            {lookupInv.map((v, i) => (
                                                <div key={(v.invcSign || '') + i} className="pb-3 border-b border-[#F1F0EC] last:border-0 last:pb-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-medium text-[#2F3437]">
                                                            {[v.sampleSign, v.invcSign].filter(Boolean).join(' · ') || 'Dải hóa đơn'}
                                                        </span>
                                                        <span className={`text-xs font-semibold ${invRemainTone(v.invcRemain)}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                            {v.invcRemain != null ? `còn ${v.invcRemain.toLocaleString('vi-VN')}` : '—'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-[#787774]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                                        Đã dùng {(v.invcUsed ?? 0).toLocaleString('vi-VN')} / {(v.invcTotal ?? 0).toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default AdminExpiring;
