import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    ShieldExclamationIcon,
    CheckBadgeIcon,
    XMarkIcon,
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

/* ─── TVAN Range badges ────────────────────────────────────────────────── */

const rangeOptions = [
    { key: '', label: 'Tất cả', tone: 'bg-white/5 text-gray-300 border-white/10' },
    { key: 'EXPIRED', label: 'Đã hết hạn', tone: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    { key: 'D7', label: '≤ 7 ngày', tone: 'bg-red-500/15 text-red-300 border-red-500/30' },
    { key: 'D15', label: '8–15 ngày', tone: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
    { key: 'D30', label: '16–30 ngày', tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    { key: 'M3', label: '1–3 tháng', tone: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
    { key: 'SAFE', label: '> 90 ngày', tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
];

const getRangeTone = (key?: string) => {
    const found = rangeOptions.find(r => r.key === key);
    return found?.tone || 'bg-white/5 text-gray-300 border-white/10';
};

const getRangeLabel = (key?: string) => {
    const found = rangeOptions.find(r => r.key === key);
    return found?.label || key || '—';
};

/* ─── Tab type ─────────────────────────────────────────────────────────── */

type TabKey = 'tvan' | 'cert';

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
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-sm flex-wrap gap-3">
            <div className="flex items-center gap-3 text-gray-400">
                <span>
                    Tổng <span className="text-white font-semibold">{total.toLocaleString('vi-VN')}</span> bản ghi
                    — trang {page}/{totalPages}
                </span>
                <select
                    value={pageSize}
                    onChange={e => onSizeChange(Number(e.target.value))}
                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                    {[10, 20, 50, 100].map(s => (
                        <option key={s} value={s} className="bg-[#0b1437]">{s} / trang</option>
                    ))}
                </select>
            </div>
            <div className="flex items-center gap-1">
                <button disabled={page <= 1 || loading} onClick={() => onPageChange(1)}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-xs">««</button>
                <button disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">←</button>
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
                            <span key={'e' + idx} className="px-1.5 text-gray-500">…</span>
                        ) : (
                            <button key={p} disabled={loading} onClick={() => onPageChange(p as number)}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                                    p === page ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 hover:bg-white/10 text-gray-300'
                                }`}>{p}</button>
                        )
                    );
                })()}
                <button disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">→</button>
                <button disabled={page >= totalPages || loading} onClick={() => onPageChange(totalPages)}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-xs">»»</button>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1500px] mx-auto">
            {/* Header */}
            <div className="mb-5">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-7 h-7 text-amber-400" />
                    Sắp hết hạn
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Theo dõi hợp đồng TVAN & chứng thư số sắp/đã hết hạn.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
                <button
                    onClick={() => setTab('tvan')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                        tab === 'tvan' ? 'bg-indigo-500/30 text-indigo-200 shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                    <ClockIcon className="w-4 h-4" />
                    HĐ TVAN hết hạn
                </button>
                <button
                    onClick={() => setTab('cert')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                        tab === 'cert' ? 'bg-indigo-500/30 text-indigo-200 shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                    <ShieldExclamationIcon className="w-4 h-4" />
                    Chứng thư số hết hạn
                </button>
            </div>

            {/* ═══════════════ TAB: TVAN ═══════════════ */}
            {tab === 'tvan' && (
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
                    {/* Filters */}
                    <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text" value={tvanSearch}
                                onChange={e => setTvanSearch(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') fetchTvan(1); }}
                                placeholder="MST / Tên KH / Sale..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                                        tvanRange === r.key
                                            ? r.tone + ' ring-1 ring-white/20'
                                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => fetchTvan(1)}
                            className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-colors flex items-center gap-1">
                            <MagnifyingGlassIcon className="w-4 h-4" /> Tìm
                        </button>
                        <button onClick={() => fetchTvan(tvanPage)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <ArrowPathIcon className={`w-4 h-4 ${tvanLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto" style={{ userSelect: resizingCol ? 'none' : 'auto', cursor: resizingCol ? 'col-resize' : 'auto' }}>
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5 text-indigo-200">
                                <tr>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">MST</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap relative group">
                                        Khách hàng
                                        <div
                                            onMouseDown={(e) => handleResizeStart('customer', e)}
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                                        />
                                    </th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap relative group">
                                        Sale
                                        <div
                                            onMouseDown={(e) => handleResizeStart('sale', e)}
                                            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500 transition-colors opacity-0 group-hover:opacity-100"
                                        />
                                    </th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Mã Sale</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Mã Hợp Đồng</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Ngày hết hạn</th>
                                    <th className="text-center px-3 py-3 font-semibold whitespace-nowrap">Còn lại</th>
                                    <th className="text-center px-3 py-3 font-semibold whitespace-nowrap">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {tvanLoading && (
                                    <tr><td colSpan={7} className="text-center text-gray-400 py-10">Đang tải...</td></tr>
                                )}
                                {!tvanLoading && tvanRows.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-gray-500 py-10">Không có dữ liệu</td></tr>
                                )}
                                {!tvanLoading && tvanRows.map((r, idx) => (
                                    <tr key={(r.oid || r.taxNumber || '') + idx} className="hover:bg-white/[0.03] transition-colors">
                                        <td className="px-3 py-2.5 font-mono text-xs text-indigo-200 whitespace-nowrap">{r.taxNumber || '—'}</td>
                                        <td className="px-3 py-2.5 truncate" style={{ maxWidth: `${customerNameWidth}px` }} title={r.customerName}>{r.customerName || '—'}</td>
                                        <td className="px-3 py-2.5 text-gray-300 truncate" style={{ maxWidth: `${saleNameWidth}px` }} title={r.saleFullName || r.saleCode}>{r.saleFullName || r.saleCode || '—'}</td>
                                        <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{r.saleCode || '—'}</td>
                                        <td className="px-3 py-2.5 text-gray-400 text-xs">{r.contractOID || '—'}</td>
                                        <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{fmtDate(r.expiryDate)}</td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`font-bold text-xs ${
                                                (r.daysRemaining ?? 0) < 0 ? 'text-rose-400'
                                                : (r.daysRemaining ?? 0) <= 7 ? 'text-red-400'
                                                : (r.daysRemaining ?? 0) <= 30 ? 'text-amber-400'
                                                : 'text-emerald-400'
                                            }`}>
                                                {r.daysRemaining != null ? `${r.daysRemaining} ngày` : '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getRangeTone(r.rangeKey)}`}>
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
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
                    {/* Filters */}
                    <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[200px] max-w-xs">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text" value={certSearch}
                                onChange={e => setCertSearch(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') fetchCert(1); }}
                                placeholder="MST / Tên công ty / Sale..."
                                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <button onClick={() => fetchCert(1)}
                            className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-colors flex items-center gap-1">
                            <MagnifyingGlassIcon className="w-4 h-4" /> Tìm
                        </button>
                        <button onClick={() => fetchCert(certPage)}
                            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <ArrowPathIcon className={`w-4 h-4 ${certLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-white/5 text-indigo-200">
                                <tr>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Nhà cung cấp</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">MST</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Công ty</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Ngày hết hạn</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">SĐT</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Email</th>
                                    <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Sale</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {certLoading && (
                                    <tr><td colSpan={7} className="text-center text-gray-400 py-10">Đang tải...</td></tr>
                                )}
                                {!certLoading && certRows.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-gray-500 py-10">Không có dữ liệu</td></tr>
                                )}
                                {!certLoading && certRows.map((r, idx) => {
                                    const expDate = r.certNotAfterDate ? new Date(r.certNotAfterDate) : null;
                                    const daysLeft = expDate ? Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
                                    const phone = [r.tel1, r.tel2, r.tel3].filter(Boolean).join(', ') || '—';
                                    const email = [r.email1, r.email2, r.email3].filter(Boolean)[0] || '—';
                                    return (
                                        <tr key={(r.certSerialNumber || '') + idx} className="hover:bg-white/[0.03] transition-colors">
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-semibold ${
                                                    r.certSubjectName === 'WINCA'
                                                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                                }`}>
                                                    <CheckBadgeIcon className="w-3 h-3" />
                                                    {r.certSubjectName || '—'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 font-mono text-xs text-indigo-200 whitespace-nowrap">{r.taxnumber || '—'}</td>
                                            <td className="px-3 py-2.5 max-w-[220px] truncate" title={r.merchantName || ''}>{r.merchantName || '—'}</td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span className={`text-xs font-medium ${
                                                    daysLeft !== null && daysLeft < 0 ? 'text-rose-400'
                                                    : daysLeft !== null && daysLeft <= 30 ? 'text-amber-400'
                                                    : 'text-gray-300'
                                                }`}>
                                                    {fmtDate(r.certNotAfterDate)}
                                                    {daysLeft !== null && (
                                                        <span className="ml-1 text-[10px] opacity-70">
                                                            ({daysLeft < 0 ? `quá ${Math.abs(daysLeft)}d` : `${daysLeft}d`})
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{phone}</td>
                                            <td className="px-3 py-2.5 text-gray-400 text-xs max-w-[180px] truncate" title={email}>{email}</td>
                                            <td className="px-3 py-2.5 text-gray-300 text-xs max-w-[140px] truncate" title={r.saleFullName || ''}>
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
