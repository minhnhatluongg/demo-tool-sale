import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    BoltIcon,
    PaperAirplaneIcon,
    DocumentArrowUpIcon,
    XCircleIcon,
    InformationCircleIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    ClockIcon,
    EllipsisHorizontalIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    InboxIcon,
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

/* Muted pastel status palette (minimalist-ui) */
interface StatusInfo { label: string; tone: string; }
const statusMap: Record<number, StatusInfo> = {
    0:   { label: 'Dự thảo',          tone: 'bg-[#FBF3DB] text-[#956400]' },
    101: { label: 'Trình ký',          tone: 'bg-[#E1F3FE] text-[#1F6C9F]' },
    201: { label: 'Chờ GĐ',            tone: 'bg-[#E1F3FE] text-[#1F6C9F]' },
    301: { label: 'Kế toán đã duyệt',  tone: 'bg-[#EDF3EC] text-[#346538]' },
    401: { label: 'KH ký',             tone: 'bg-[#FBF3DB] text-[#956400]' },
    501: { label: 'KH đã ký',          tone: 'bg-[#EDF3EC] text-[#346538]' },
};

const StatusBadge: React.FC<{ code?: number }> = ({ code }) => {
    const meta = statusMap[code ?? -1] || { label: String(code ?? '—'), tone: 'bg-[#F1F0EC] text-[#787774]' };
    return (
        <span className={`inline-block px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.05em] rounded-full whitespace-nowrap ${meta.tone}`}>
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
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded whitespace-nowrap ${
                            isDone
                                ? 'bg-[#EDF3EC] text-[#346538]'
                                : 'bg-[#FBF3DB] text-[#956400]'
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

/* ─── Skeleton row (loading state) ─────────────────────────────────────── */

const SkeletonRow: React.FC = () => (
    <tr>
        {[110, 180, 90, 110, 80, 70, 200, 60].map((w, i) => (
            <td key={i} className="px-3 py-3">
                <div className="h-3.5 rounded bg-[#EFEEEA] animate-pulse" style={{ maxWidth: w }} />
            </td>
        ))}
    </tr>
);

/* ─── Contract detail renderer (đẹp, không dump JSON thô) ──────────────── */

const FIELD_LABELS: Record<string, string> = {
    oid: 'OID', oDate: 'Ngày hợp đồng', cusName: 'Tên khách hàng', cusTax: 'MST',
    cusAddress: 'Địa chỉ', cusTel: 'Điện thoại', cusEmail: 'Email',
    cusPeople_Sign: 'Người đại diện ký', cusPeopleSign: 'Người đại diện ký',
    cusPosition_BySign: 'Chức vụ', cmpnName: 'Đơn vị bán', cmpnTax: 'MST đơn vị bán',
    saleEmID: 'Mã nhân viên', saleName: 'Nhân viên Sale', sampleID: 'Mẫu số',
    descript_Cus: 'Ghi chú', descriptCus: 'Ghi chú', crt_Date: 'Ngày tạo', crtDate: 'Ngày tạo',
    crt_User: 'Người tạo', crtUser: 'Người tạo', chgeDate: 'Ngày cập nhật',
    currSignNumb: 'Trạng thái ký', invcSample: 'Mẫu số', invcSign: 'Ký hiệu',
    invcFrm: 'Từ số', invcEnd: 'Đến số', isTT78: 'Theo TT78', isGiaHan: 'Gia hạn',
    referenceInfo: 'Thông tin tham chiếu', mailAcc: 'Email nhận',
};

const prettifyKey = (k: string): string =>
    FIELD_LABELS[k] ??
    k.replace(/_/g, ' ')
     .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
     .replace(/^./, c => c.toUpperCase());

const renderPrimitive = (key: string, val: any): React.ReactNode => {
    if (val === null || val === undefined || val === '')
        return <span className="text-[#a8a6a1] italic">—</span>;
    if (typeof val === 'boolean')
        return val
            ? <span className="inline-flex items-center gap-1 text-[#346538]"><CheckCircleIcon className="w-3.5 h-3.5" />Có</span>
            : <span className="text-[#a8a6a1]">Không</span>;
    const s = String(val);
    if (/date|ngay/i.test(key) && /^\d{4}-\d{2}-\d{2}/.test(s)) {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return d.toLocaleString('vi-VN');
    }
    return s;
};

const DetailRows: React.FC<{ obj: Record<string, any>; depth?: number }> = ({ obj, depth = 0 }) => (
    <div className={depth === 0 ? 'divide-y divide-[#F1F0EC]' : 'mt-1 ml-1 pl-3 border-l-2 border-[#EAEAEA] space-y-0.5'}>
        {Object.entries(obj).map(([key, val]) => {
            const isObj = val !== null && typeof val === 'object' && !Array.isArray(val);
            const isArr = Array.isArray(val);

            if (isObj) {
                return (
                    <div key={key} className="py-2 px-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#787774] mb-1">{prettifyKey(key)}</p>
                        <DetailRows obj={val} depth={depth + 1} />
                    </div>
                );
            }
            if (isArr) {
                return (
                    <div key={key} className="py-2 px-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#787774] mb-1">{prettifyKey(key)} ({val.length})</p>
                        {val.length === 0
                            ? <span className="text-[#a8a6a1] italic text-sm">— trống —</span>
                            : val.map((item, i) =>
                                item !== null && typeof item === 'object'
                                    ? <DetailRows key={i} obj={item} depth={depth + 1} />
                                    : <div key={i} className="text-sm text-[#2F3437] pl-1">{String(item)}</div>)}
                    </div>
                );
            }
            return (
                <div key={key} className="grid grid-cols-[170px_1fr] gap-2 py-2 px-3 hover:bg-[#FBFBFA] text-sm transition-colors duration-150">
                    <span className="text-[#787774] font-medium truncate" title={prettifyKey(key)}>{prettifyKey(key)}</span>
                    <span className="text-[#2F3437] break-words">{renderPrimitive(key, val)}</span>
                </div>
            );
        })}
    </div>
);

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
            toast('Không có hợp đồng nào cần trình ký');
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

    /* Row actions cho dropdown menu */
    const rowMenuActions = (oid: string) => [
        { key: 'captk',      label: 'Bypass Cấp TK',      icon: BoltIcon,            onClick: () => handleAction(oid, 'captk') },
        { key: 'phatHanh',   label: 'Phát hành HĐ',       icon: PaperAirplaneIcon,   onClick: () => handleAction(oid, 'phatHanh') },
        { key: 'xuatHD',     label: 'Xuất HĐĐT',          icon: DocumentArrowUpIcon, onClick: () => handleAction(oid, 'xuatHD') },
        { key: 'rutTrinhKy', label: 'Rút trình ký',       icon: ArrowPathIcon,       onClick: () => openReason(oid, 'rutTrinhKy'), danger: true },
        { key: 'unsign',     label: 'Gỡ ký (Unsign)',     icon: XCircleIcon,         onClick: () => openReason(oid, 'unsign'),     danger: true },
    ];

    return (
        <div className="max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 mb-6 border-b border-[#EAEAEA]">
                <div>
                    <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#111111]">Tất cả hợp đồng</h1>
                    <p className="text-sm text-[#787774] mt-1 max-w-[65ch]">
                        Quyền Admin — bypass quy trình, gỡ ký và rút trình ký không cần kiểm tra role.
                    </p>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#787774]" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') fetchData(1); }}
                            placeholder="Tìm OID, MST, tên khách hàng"
                            className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-[#EAEAEA] text-sm text-[#2F3437] placeholder:text-[#a8a6a1] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                        />
                    </div>
                    <button
                        onClick={() => fetchData(1)}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#111111]"
                    >
                        Tìm
                    </button>
                    <button
                        onClick={handleAutoSign}
                        disabled={autoSigning || loading || rows.length === 0}
                        className="px-4 py-2 rounded-md text-sm font-medium bg-white border border-[#EAEAEA] text-[#2F3437] hover:bg-[#F7F6F3] active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 flex items-center gap-2 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]"
                        title="Trình ký tự động tất cả hợp đồng chưa ký"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                        {autoSigning
                            ? `Đang ký (${autoSignProgress.done}/${autoSignProgress.total})`
                            : 'Trình ký tự động'}
                    </button>
                    <button
                        onClick={() => fetchData(page)}
                        aria-label="Tải lại danh sách"
                        className="p-2 rounded-md bg-white border border-[#EAEAEA] text-[#787774] hover:text-[#111111] hover:bg-[#F7F6F3] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg bg-white border border-[#EAEAEA] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#EAEAEA]">
                                <th className="text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">OID</th>
                                <th className="text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">Khách hàng</th>
                                <th className="text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">MST</th>
                                <th className="text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">Sale</th>
                                <th className="text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">Ngày tạo</th>
                                <th className="text-center px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">Ký</th>
                                <th className="text-left px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">Trạng thái xử lý</th>
                                <th className="text-right px-3 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[#787774] whitespace-nowrap">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F1F0EC]">
                            {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="py-16">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="w-12 h-12 rounded-lg bg-[#F7F6F3] border border-[#EAEAEA] flex items-center justify-center">
                                                <InboxIcon className="w-6 h-6 text-[#a8a6a1]" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#2F3437]">Không có hợp đồng nào</p>
                                                <p className="text-xs text-[#787774] mt-1">Thử đổi từ khóa tìm kiếm hoặc tải lại danh sách.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && rows.map((r, idx) => {
                                const oid     = getField<string>(r, 'OID', 'oid') || '';
                                const cusName = getField<string>(r, 'CusName', 'cusName') || '—';
                                const cusTax  = getField<string>(r, 'CusTax', 'cusTax') || '—';
                                const saleName = getField<string>(r, 'emplName', 'EmplName', 'SaleFullName', 'saleFullName', 'SaleEmID', 'saleEmID') || '—';
                                const crtDate = getField<string>(r, 'Crt_Date', 'crt_Date');
                                const sign    = getField<number>(r, 'CurrSignNumb', 'currSignNumb', 'SignNumb', 'signNumb');
                                const busyId  = (k: string) => actingOid === oid + ':' + k;
                                const rowBusy = actingOid !== null && actingOid.startsWith(oid + ':');
                                return (
                                    <tr key={oid + idx} className="hover:bg-[#FBFBFA] transition-colors duration-150">
                                        <td className="px-3 py-2.5 font-mono text-xs text-[#2F3437] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{oid}</td>
                                        <td className="px-3 py-2.5 max-w-[220px] truncate font-medium text-[#111111]" title={cusName}>{cusName}</td>
                                        <td className="px-3 py-2.5 text-[#5f5e5b] whitespace-nowrap font-mono text-xs" style={{ fontVariantNumeric: 'tabular-nums' }}>{cusTax}</td>
                                        <td className="px-3 py-2.5 text-[#5f5e5b] max-w-[140px] truncate" title={saleName}>{saleName}</td>
                                        <td className="px-3 py-2.5 text-[#787774] whitespace-nowrap" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDate(crtDate)}</td>
                                        <td className="px-3 py-2.5 text-center"><StatusBadge code={sign} /></td>
                                        <td className="px-3 py-2.5"><ProcessStatusBadges row={r} /></td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    title="Chi tiết"
                                                    onClick={() => openSummary(oid)}
                                                    className="w-7 h-7 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] flex items-center justify-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]"
                                                >
                                                    <InformationCircleIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    title="Trình ký"
                                                    disabled={busyId('proposeSign')}
                                                    onClick={() => handleAction(oid, 'proposeSign')}
                                                    className="w-7 h-7 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-40 flex items-center justify-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]"
                                                >
                                                    {busyId('proposeSign')
                                                        ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                        : <PencilSquareIcon className="w-4 h-4" />}
                                                </button>
                                                <Menu as="div" className="relative">
                                                    <MenuButton
                                                        title="Thao tác khác"
                                                        disabled={rowBusy}
                                                        className="w-7 h-7 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-40 flex items-center justify-center transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#111111]"
                                                    >
                                                        {rowBusy
                                                            ? <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                            : <EllipsisHorizontalIcon className="w-4 h-4" />}
                                                    </MenuButton>
                                                    <MenuItems
                                                        anchor="bottom end"
                                                        className="z-50 mt-1 w-52 rounded-md bg-white border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.04)] py-1 focus:outline-none"
                                                    >
                                                        {rowMenuActions(oid).map(a => {
                                                            const Icon = a.icon;
                                                            return (
                                                                <MenuItem key={a.key}>
                                                                    <button
                                                                        onClick={a.onClick}
                                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors duration-150 data-[focus]:bg-[#F7F6F3] ${
                                                                            a.danger ? 'text-[#9F2F2D]' : 'text-[#2F3437]'
                                                                        }`}
                                                                    >
                                                                        <Icon className="w-4 h-4" />
                                                                        {a.label}
                                                                    </button>
                                                                </MenuItem>
                                                            );
                                                        })}
                                                    </MenuItems>
                                                </Menu>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAEAEA] text-sm flex-wrap gap-3 bg-[#FBFBFA]">
                    <div className="flex items-center gap-3 text-[#787774]">
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                            Tổng <span className="text-[#111111] font-medium">{total.toLocaleString('vi-VN')}</span> hợp đồng
                            {total > 0 && (
                                <> — trang {page}/{totalPages}</>
                            )}
                        </span>
                        <select
                            value={pageSize}
                            onChange={e => fetchData(1, Number(e.target.value))}
                            className="bg-white border border-[#EAEAEA] rounded-md px-2 py-1 text-xs text-[#2F3437] focus:outline-none focus:border-[#111111] transition-colors duration-200"
                        >
                            {[10, 20, 50, 100].map(s => (
                                <option key={s} value={s}>{s} / trang</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => fetchData(1)}
                            className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                            title="Trang đầu"
                        >
                            <ChevronDoubleLeftIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => fetchData(page - 1)}
                            className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                            title="Trang trước"
                        >
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
                                    <button
                                        key={p}
                                        disabled={loading}
                                        onClick={() => fetchData(p as number)}
                                        style={{ fontVariantNumeric: 'tabular-nums' }}
                                        className={`min-w-[30px] h-[30px] px-1.5 rounded-md text-xs font-medium transition-colors duration-150 ${
                                            p === page
                                                ? 'bg-[#111111] text-white'
                                                : 'text-[#5f5e5b] hover:bg-[#F1F0EC] hover:text-[#111111]'
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
                            className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                            title="Trang sau"
                        >
                            <ChevronRightIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                            disabled={page >= totalPages || loading}
                            onClick={() => fetchData(totalPages)}
                            className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] disabled:opacity-30 disabled:pointer-events-none transition-colors duration-150"
                            title="Trang cuối"
                        >
                            <ChevronDoubleRightIcon className="w-3.5 h-3.5" />
                        </button>
                        {totalPages > 7 && (
                            <div className="flex items-center gap-1.5 ml-2">
                                <label htmlFor="goto-page" className="text-[#a8a6a1] text-xs">Đi trang</label>
                                <input
                                    id="goto-page"
                                    type="number"
                                    min={1}
                                    max={totalPages}
                                    className="w-16 px-2 py-1 rounded-md bg-white border border-[#EAEAEA] text-xs text-[#2F3437] focus:outline-none focus:border-[#111111] transition-colors duration-200"
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
            {reasonModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white border border-[#EAEAEA] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6">
                        <h3 className="text-lg font-semibold tracking-tight text-[#111111] mb-1">
                            {reasonModal.type === 'unsign' ? 'Gỡ ký hợp đồng' : 'Rút trình ký'}
                        </h3>
                        <p className="text-xs text-[#787774] mb-4">
                            OID: <span className="font-mono text-[#2F3437]">{reasonModal.oid}</span>
                        </p>
                        <label htmlFor="reason-input" className="block text-xs font-medium text-[#2F3437] mb-1.5">
                            Lý do <span className="text-[#9F2F2D]">*</span>
                        </label>
                        <textarea
                            id="reason-input"
                            value={reasonText}
                            onChange={e => setReasonText(e.target.value)}
                            rows={4}
                            placeholder="Mô tả lý do thực hiện thao tác này"
                            className="w-full px-3 py-2 rounded-md bg-white border border-[#EAEAEA] text-sm text-[#2F3437] placeholder:text-[#a8a6a1] focus:outline-none focus:border-[#111111] transition-colors duration-200 resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                onClick={() => setReasonModal(null)}
                                className="px-4 py-2 rounded-md text-sm text-[#5f5e5b] hover:bg-[#F1F0EC] hover:text-[#111111] transition-colors duration-200"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={submitReason}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] transition-all duration-200"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}

            {/* Summary modal */}
            {summaryModal && createPortal(
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-2xl max-h-[80vh] rounded-lg bg-white border border-[#EAEAEA] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-semibold tracking-tight text-[#111111]">
                                Chi tiết hợp đồng
                            </h3>
                            <button
                                onClick={() => setSummaryModal(null)}
                                aria-label="Đóng"
                                className="p-1.5 rounded-md text-[#787774] hover:text-[#111111] hover:bg-[#F1F0EC] transition-colors duration-150"
                            >
                                <XMarkIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-[#787774] mb-4">
                            OID: <span className="font-mono text-[#2F3437]">{summaryModal.oid}</span>
                        </p>

                        {summaryModal.loading ? (
                            <div className="flex-1 space-y-2 py-2">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="grid grid-cols-[180px_1fr] gap-2 py-1.5 px-3">
                                        <div className="h-3.5 rounded bg-[#EFEEEA] animate-pulse w-28" />
                                        <div className="h-3.5 rounded bg-[#EFEEEA] animate-pulse" style={{ maxWidth: 120 + (i * 47) % 200 }} />
                                    </div>
                                ))}
                            </div>
                        ) : summaryModal.data ? (
                            (() => {
                                const data: any = summaryModal.data;
                                // Bóc lớp { contract: {...} } để hiển thị field hợp đồng ngay (không lồng dưới 1 header)
                                const contractObj = data && typeof data === 'object' && data.contract && typeof data.contract === 'object'
                                    ? data.contract : null;
                                const primary = contractObj ?? data;
                                const extras = contractObj
                                    ? Object.fromEntries(Object.entries(data).filter(([k]) => k !== 'contract'))
                                    : null;
                                return (
                                    <div className="flex-1 overflow-y-auto pr-1">
                                        <DetailRows obj={primary} />
                                        {extras && Object.keys(extras).length > 0 && (
                                            <div className="mt-2 border-t border-[#EAEAEA]">
                                                <DetailRows obj={extras} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })()
                        ) : (
                            <p className="text-[#787774] text-center py-8">Không có dữ liệu</p>
                        )}

                        <div className="flex justify-end mt-4 pt-4 border-t border-[#EAEAEA]">
                            <button
                                onClick={() => setSummaryModal(null)}
                                className="px-4 py-2 rounded-md text-sm text-[#5f5e5b] hover:bg-[#F1F0EC] hover:text-[#111111] transition-colors duration-200"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

export default AdminContracts;
