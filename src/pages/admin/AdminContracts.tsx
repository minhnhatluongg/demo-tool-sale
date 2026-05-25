import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    BoltIcon,
    PaperAirplaneIcon,
    DocumentArrowUpIcon,
    XCircleIcon,
    EyeIcon,
    InformationCircleIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import {
    adminListPaged,
    adminGetSummary,
    adminBypassCapTk,
    adminBypassPhatHanh,
    adminBypassXuatHoaDon,
    econtractProposeSign,
    econtractUnsign,
    econtractRutTrinhKy,
    AdminListedContract,
} from '../../api/adminService';
import { useAuth } from '../../contexts/AuthContext';

/* ─── helpers ──────────────────────────────────────────────────────────── */

const getField = <T = any>(row: AdminListedContract, ...keys: string[]): T | undefined => {
    for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) return row[k] as T;
    }
    return undefined;
};

const getFieldNullable = (row: AdminListedContract, ...keys: string[]): string | null | undefined => {
    for (const k of keys) {
        if (k in row) return row[k] as string | null | undefined;
    }
    return undefined;
};

const fmtDate = (s?: string) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('vi-VN');
};

interface StatusInfo { label: string; tone: string; }
const statusMap: Record<number, StatusInfo> = {
    0:   { label: 'Dự Thảo',  tone: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    101: { label: 'Trình Ký',    tone: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    201: { label: 'Chờ GĐ',    tone: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    301: { label: 'Kế Toán Đã duyệt',  tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    401: { label: 'KH ký',     tone: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30' },
    501: { label: 'KH Đã ký',     tone: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
};

const StatusBadge: React.FC<{ code?: number }> = ({ code }) => {
    const meta = statusMap[code ?? -1] || { label: String(code ?? '—'), tone: 'bg-white/5 text-gray-300 border-white/10' };
    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${meta.tone}`}>
            {meta.label}
        </span>
    );
};

/* ─── Process status badges (tT1–tT8) ─────────────────────────────────── */

interface TtConfig { key: string; label: string; }
const ttFields: TtConfig[] = [
    { key: 'tT1', label: 'Trình ký' },
    { key: 'tT2', label: 'Tạo mẫu' },
    { key: 'tT3', label: 'Cấp TK' },
    { key: 'tT4', label: 'Phát hành HĐ' },
    { key: 'tT5', label: 'Ký KH' },
    { key: 'tT6', label: 'Hoàn tất ký' },
    { key: 'tT8', label: 'Xuất HĐĐT' },
];

const ProcessStatusBadges: React.FC<{ row: AdminListedContract }> = ({ row }) => {
    return (
        <div className="flex flex-wrap gap-1">
            {ttFields.map(({ key, label }) => {
                const val = getFieldNullable(row, key);
                // null hoặc undefined = chưa có / bỏ qua → ẩn
                if (val === undefined || val === null) return null;
                // Chuỗi rỗng "" = đã hoàn thành
                const isDone = val === '';
                // Chuỗi có nội dung = chưa xong (nội dung mô tả)
                return (
                    <span
                        key={key}
                        title={isDone ? `${label}: Hoàn thành` : val}
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded border whitespace-nowrap ${
                            isDone
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                        }`}
                    >
                        {isDone
                            ? <CheckCircleIcon className="w-3 h-3" />
                            : <ClockIcon className="w-3 h-3" />
                        }
                        {label}
                    </span>
                );
            })}
        </div>
    );
};

/* ─── page ─────────────────────────────────────────────────────────────── */

const AdminContracts: React.FC = () => {
    const { user } = useAuth();
    const [rows, setRows] = useState<AdminListedContract[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [actingOid, setActingOid] = useState<string | null>(null);
    const [reasonModal, setReasonModal] = useState<{ oid: string; type: 'unsign' | 'rutTrinhKy' } | null>(null);
    const [reasonText, setReasonText] = useState('');

    /* ─── Auto propose-sign state ──────────────────────────────────────── */
    const [autoSigning, setAutoSigning] = useState(false);
    const [autoSignProgress, setAutoSignProgress] = useState({ done: 0, total: 0, success: 0, fail: 0 });

    /* ─── Summary modal state ──────────────────────────────────────────── */
    const [summaryModal, setSummaryModal] = useState<{ oid: string; data: any; loading: boolean } | null>(null);

    const yearAgo = useMemo(() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().slice(0, 10);
    }, []);
    const tomorrow = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        return d.toISOString().slice(0, 10);
    }, []);

    const fetchData = async (p = page, ps = pageSize) => {
        setLoading(true);
        try {
            const res = await adminListPaged({
                fromDate: yearAgo,
                toDate: tomorrow,
                searchKeyword: search || undefined,
                page: p,
                pageSize: ps,
            });

            // adminListPaged wraps in ApiResponse — extract khoan dung
            const payload = res?.data ?? res;
            const data: AdminListedContract[] =
                payload?.lstMonitor ??
                payload?.data ??
                payload?.items ??
                payload?.records ??
                (Array.isArray(payload) ? payload : []);
            const totalCount: number =
                payload?.totalCount ?? payload?.totalRecords ?? payload?.total ?? payload?.count ?? data.length;

            setRows(data);
            setTotal(totalCount);
            setPage(p);
            setPageSize(ps);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không tải được danh sách hợp đồng');
            setRows([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAction = async (oid: string, kind: 'proposeSign' | 'captk' | 'phatHanh' | 'xuatHD') => {
        if (!oid) return;
        setActingOid(oid + ':' + kind);
        const action =
            kind === 'proposeSign' ? econtractProposeSign
          : kind === 'captk' ? adminBypassCapTk
          : kind === 'phatHanh' ? adminBypassPhatHanh
          : adminBypassXuatHoaDon;
        const label =
            kind === 'proposeSign' ? 'Trình ký'
          : kind === 'captk' ? 'Bypass Cấp TK'
          : kind === 'phatHanh' ? 'Bypass Phát hành HĐ'
          : 'Bypass Xuất HĐĐT';

        try {
            const res = await action(oid);
            if (res?.success === false) {
                toast.error(res?.message || `${label} thất bại`);
            } else {
                toast.success(`${label} thành công cho OID ${oid}`);
                fetchData(page);
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || `${label} lỗi`);
        } finally {
            setActingOid(null);
        }
    };

    const openReason = (oid: string, type: 'unsign' | 'rutTrinhKy') => {
        setReasonModal({ oid, type });
        setReasonText('');
    };

    const submitReason = async () => {
        if (!reasonModal) return;
        const { oid, type } = reasonModal;
        if (!reasonText.trim()) {
            toast.error('Vui lòng nhập lý do');
            return;
        }
        setActingOid(oid + ':' + type);
        try {
            if (type === 'unsign') {
                const fullName = user?.fullName || 'Admin';
                const res = await econtractUnsign({
                    oid,
                    requestedBy: `${fullName} - ADMIN`,
                    fullName,
                    role: 'ADMIN',
                    reason: reasonText.trim(),
                });
                if (res?.success === false) {
                    toast.error(res?.message || 'Gỡ ký thất bại');
                } else {
                    toast.success('Đã gỡ ký thành công');
                    setReasonModal(null);
                    fetchData(page);
                }
            } else {
                const res = await econtractRutTrinhKy({ OID: oid, Reason: reasonText.trim() });
                if (res?.success === false) {
                    toast.error(res?.message || 'Rút trình ký thất bại');
                } else {
                    toast.success('Đã rút trình ký');
                    setReasonModal(null);
                    fetchData(page);
                }
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Lỗi');
        } finally {
            setActingOid(null);
        }
    };

    /* ─── Auto Trình ký tất cả (chỉ ký những HĐ chưa ký - sign === 0 hoặc undefined) */
    const handleAutoSign = async () => {
        // Lọc các hợp đồng có thể trình ký (sign = 0 hoặc chưa có trạng thái)
        const signable = rows.filter(r => {
            const sign = getField<number>(r, 'CurrSignNumb', 'currSignNumb', 'SignNumb', 'signNumb');
            return sign === undefined || sign === null || sign === 0;
        });

        if (signable.length === 0) {
            toast('Không có hợp đồng nào cần trình ký', { icon: 'ℹ️' });
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn trình ký tự động ${signable.length} hợp đồng?`)) return;

        setAutoSigning(true);
        setAutoSignProgress({ done: 0, total: signable.length, success: 0, fail: 0 });

        let success = 0;
        let fail = 0;

        for (let i = 0; i < signable.length; i++) {
            const oid = getField<string>(signable[i], 'OID', 'oid') || '';
            if (!oid) { fail++; continue; }
            try {
                const res = await econtractProposeSign(oid);
                if (res?.success === false) {
                    fail++;
                } else {
                    success++;
                }
            } catch {
                fail++;
            }
            setAutoSignProgress({ done: i + 1, total: signable.length, success, fail });
            // Delay nhẹ để không spam API
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        setAutoSigning(false);
        toast.success(`Trình ký tự động hoàn tất: ${success} thành công, ${fail} thất bại`);
        fetchData(page);
    };

    /* ─── Summary handler ──────────────────────────────────────────────── */
    const openSummary = async (oid: string) => {
        setSummaryModal({ oid, data: null, loading: true });
        try {
            const res = await adminGetSummary(oid);
            const payload = res?.data ?? res;
            setSummaryModal({ oid, data: payload, loading: false });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'Không tải được chi tiết hợp đồng');
            setSummaryModal(null);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="max-w-[1500px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Tất cả hợp đồng</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Quyền Admin — bypass quy trình, gỡ ký / rút trình ký không cần check role.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') fetchData(1); }}
                            placeholder="Tìm OID / MST / Tên KH..."
                            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => fetchData(1)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-colors flex items-center gap-2"
                    >
                        <MagnifyingGlassIcon className="w-4 h-4" /> Tìm
                    </button>
                    <button
                        onClick={handleAutoSign}
                        disabled={autoSigning || loading || rows.length === 0}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500/20 to-indigo-500/20 text-sky-200 hover:from-sky-500/30 hover:to-indigo-500/30 disabled:opacity-40 transition-colors flex items-center gap-2"
                        title="Trình ký tự động tất cả hợp đồng chưa ký"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        {autoSigning
                            ? `Đang ký (${autoSignProgress.done}/${autoSignProgress.total})`
                            : 'Trình ký tự động'}
                    </button>
                    <button
                        onClick={() => fetchData(page)}
                        className="px-3 py-2 rounded-xl text-sm bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-white/5 text-indigo-200">
                            <tr>
                                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">OID</th>
                                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Khách hàng</th>
                                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">MST</th>
                                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Sale</th>
                                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Ngày tạo</th>
                                <th className="text-center px-3 py-3 font-semibold whitespace-nowrap">Ký</th>
                                <th className="text-left px-3 py-3 font-semibold whitespace-nowrap">Trạng thái xử lý</th>
                                <th className="text-right px-3 py-3 font-semibold whitespace-nowrap">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading && (
                                <tr><td colSpan={8} className="text-center text-gray-400 py-10">Đang tải...</td></tr>
                            )}
                            {!loading && rows.length === 0 && (
                                <tr><td colSpan={8} className="text-center text-gray-500 py-10">Không có hợp đồng nào</td></tr>
                            )}
                            {!loading && rows.map((r, idx) => {
                                const oid     = getField<string>(r, 'OID', 'oid') || '';
                                const cusName = getField<string>(r, 'CusName', 'cusName') || '—';
                                const cusTax  = getField<string>(r, 'CusTax', 'cusTax') || '—';
                                const saleName = getField<string>(r, 'emplName', 'EmplName', 'SaleFullName', 'saleFullName', 'SaleEmID', 'saleEmID') || '—';
                                const crtDate = getField<string>(r, 'Crt_Date', 'crt_Date');
                                const sign    = getField<number>(r, 'CurrSignNumb', 'currSignNumb', 'SignNumb', 'signNumb');
                                const busyId  = (k: string) => actingOid === oid + ':' + k;
                                return (
                                    <tr key={oid + idx} className="hover:bg-white/[0.03] transition-colors">
                                        <td className="px-3 py-2.5 font-mono text-xs text-indigo-200 whitespace-nowrap">{oid}</td>
                                        <td className="px-3 py-2.5 max-w-[200px] truncate" title={cusName}>{cusName}</td>
                                        <td className="px-3 py-2.5 text-gray-300 whitespace-nowrap">{cusTax}</td>
                                        <td className="px-3 py-2.5 text-gray-300 max-w-[130px] truncate" title={saleName}>{saleName}</td>
                                        <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{fmtDate(crtDate)}</td>
                                        <td className="px-3 py-2.5 text-center"><StatusBadge code={sign} /></td>
                                        <td className="px-3 py-2.5"><ProcessStatusBadges row={r} /></td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-end gap-0.5">
                                                <button title="Chi tiết" onClick={() => openSummary(oid)}
                                                    className="w-6 h-6 rounded-md bg-violet-500/15 text-violet-200 hover:bg-violet-500/30 flex items-center justify-center transition-colors">
                                                    <InformationCircleIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Trình ký" disabled={busyId('proposeSign')} onClick={() => handleAction(oid, 'proposeSign')}
                                                    className="w-6 h-6 rounded-md bg-sky-500/15 text-sky-200 hover:bg-sky-500/30 disabled:opacity-40 flex items-center justify-center transition-colors">
                                                    <PencilSquareIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Bypass Cấp TK" disabled={busyId('captk')} onClick={() => handleAction(oid, 'captk')}
                                                    className="w-6 h-6 rounded-md bg-indigo-500/15 text-indigo-200 hover:bg-indigo-500/30 disabled:opacity-40 flex items-center justify-center transition-colors">
                                                    <BoltIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Phát hành HĐ" disabled={busyId('phatHanh')} onClick={() => handleAction(oid, 'phatHanh')}
                                                    className="w-6 h-6 rounded-md bg-cyan-500/15 text-cyan-200 hover:bg-cyan-500/30 disabled:opacity-40 flex items-center justify-center transition-colors">
                                                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Xuất HĐĐT" disabled={busyId('xuatHD')} onClick={() => handleAction(oid, 'xuatHD')}
                                                    className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40 flex items-center justify-center transition-colors">
                                                    <DocumentArrowUpIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Rút trình ký" disabled={busyId('rutTrinhKy')} onClick={() => openReason(oid, 'rutTrinhKy')}
                                                    className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-200 hover:bg-amber-500/30 disabled:opacity-40 flex items-center justify-center transition-colors">
                                                    <ArrowPathIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button title="Gỡ ký (Unsign)" disabled={busyId('unsign')} onClick={() => openReason(oid, 'unsign')}
                                                    className="w-6 h-6 rounded-md bg-rose-500/15 text-rose-200 hover:bg-rose-500/30 disabled:opacity-40 flex items-center justify-center transition-colors">
                                                    <XCircleIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 text-sm flex-wrap gap-3">
                    <div className="flex items-center gap-3 text-gray-400">
                        <span>
                            Tổng <span className="text-white font-semibold">{total.toLocaleString('vi-VN')}</span> hợp đồng
                            {total > 0 && (
                                <> — trang {page}/{totalPages}</>
                            )}
                        </span>
                        <select
                            value={pageSize}
                            onChange={e => fetchData(1, Number(e.target.value))}
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            {[10, 20, 50, 100].map(s => (
                                <option key={s} value={s} className="bg-[#0b1437]">{s} / trang</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => fetchData(1)}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-xs"
                            title="Trang đầu"
                        >
                            ««
                        </button>
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => fetchData(page - 1)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                        >
                            ←
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
                                    <span key={'e' + idx} className="px-1.5 text-gray-500">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        disabled={loading}
                                        onClick={() => fetchData(p as number)}
                                        className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                                            p === page
                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                                : 'bg-white/5 hover:bg-white/10 text-gray-300'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            );
                        })()}
                        <button
                            disabled={page >= totalPages || loading}
                            onClick={() => fetchData(page + 1)}
                            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                        >
                            →
                        </button>
                        <button
                            disabled={page >= totalPages || loading}
                            onClick={() => fetchData(totalPages)}
                            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors text-xs"
                            title="Trang cuối"
                        >
                            »»
                        </button>
                        {totalPages > 7 && (
                            <div className="flex items-center gap-1 ml-2">
                                <span className="text-gray-500 text-xs">Đi trang</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    className="w-16 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            const v = parseInt((e.target as HTMLInputElement).value);
                                            if (v >= 1 && v <= totalPages) fetchData(v);
                                        }
                                    }}
                                    placeholder={String(page)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reason modal */}
            {reasonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl bg-[#0b1437] border border-white/10 shadow-2xl p-5">
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <XCircleIcon className="w-5 h-5 text-rose-300" />
                            {reasonModal.type === 'unsign' ? 'Gỡ ký hợp đồng' : 'Rút trình ký'}
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">OID: <span className="font-mono text-indigo-200">{reasonModal.oid}</span></p>
                        <textarea
                            value={reasonText}
                            onChange={e => setReasonText(e.target.value)}
                            rows={4}
                            placeholder="Nhập lý do…"
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setReasonModal(null)}
                                className="px-4 py-2 rounded-xl text-sm bg-white/5 hover:bg-white/10"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitReason}
                                className="px-4 py-2 rounded-xl text-sm bg-gradient-to-r from-indigo-500 to-fuchsia-500 hover:from-indigo-600 hover:to-fuchsia-600 font-semibold"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Summary modal */}
            {summaryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-[#0b1437] border border-white/10 shadow-2xl p-5 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <InformationCircleIcon className="w-5 h-5 text-violet-300" />
                                Chi tiết hợp đồng
                            </h3>
                            <button
                                onClick={() => setSummaryModal(null)}
                                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <XCircleIcon className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mb-4">
                            OID: <span className="font-mono text-indigo-200">{summaryModal.oid}</span>
                        </p>

                        {summaryModal.loading ? (
                            <div className="flex-1 flex items-center justify-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-400" />
                                <span className="ml-3 text-gray-400">Đang tải...</span>
                            </div>
                        ) : summaryModal.data ? (
                            <div className="flex-1 overflow-y-auto pr-1 space-y-1">
                                {Object.entries(summaryModal.data).map(([key, val]) => (
                                    <div key={key} className="grid grid-cols-[180px_1fr] gap-2 py-1.5 px-3 rounded-lg hover:bg-white/5 text-sm">
                                        <span className="text-indigo-300/80 font-medium truncate" title={key}>{key}</span>
                                        <span className="text-gray-200 break-all">
                                            {val === null || val === undefined
                                                ? <span className="text-gray-500 italic">null</span>
                                                : typeof val === 'object'
                                                    ? <pre className="text-xs bg-white/5 rounded p-2 overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>
                                                    : String(val)
                                            }
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">Không có dữ liệu</p>
                        )}

                        <div className="flex justify-end mt-4 pt-3 border-t border-white/10">
                            <button
                                onClick={() => setSummaryModal(null)}
                                className="px-4 py-2 rounded-xl text-sm bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContracts;
