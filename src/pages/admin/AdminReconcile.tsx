import React, { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
    XCircleIcon,
    InboxIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { VercelTabs } from '../../components/ui/vercel-tabs';
import { NumberCounter } from '../../components/ui/number-counter';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

import {
    getReconcileData,
    downloadReconcileExcel,
    downloadImportTemplate,
    importReconcileFile,
    checkReconcile,
    uncheckReconcile,
    ReconcileData,
    ReconcileMasterRow,
    ReconcileImportResult,
} from '../../api/adminReconcileService';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const fmtDate = (s?: string | null) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('vi-VN');
};
const fmtDateTime = (s?: string | null) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleString('vi-VN');
};
const fmtMoney = (n?: number) => (n || 0).toLocaleString('vi-VN');
const isoDaysAgo = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
};

const PAGE_SIZE = 100;

type StatusTab = 'all' | 'unchecked' | 'checked';

/* ─── Page ─────────────────────────────────────────────────────────────── */

const AdminReconcile: React.FC = () => {
    // Filters
    const [frmDate, setFrmDate] = useState(isoDaysAgo(90));   // mặc định 1 quý
    const [toDate, setToDate] = useState(isoDaysAgo(0));
    const [party, setParty] = useState('KL');
    const [search, setSearch] = useState('');
    const [statusTab, setStatusTab] = useState<StatusTab>('all');

    // Data
    const [data, setData] = useState<ReconcileData | null>(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Selection + pagination (client-side)
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);

    // Dialogs
    const [confirmAction, setConfirmAction] = useState<'check' | 'uncheck' | null>(null);
    const [checkNote, setCheckNote] = useState('');
    const [acting, setActing] = useState(false);
    const [importResult, setImportResult] = useState<ReconcileImportResult | null>(null);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── derived ──────────────────────────────────────────────────────── */

    const rows = useMemo(() => {
        const all = data?.masters ?? [];
        if (statusTab === 'checked') return all.filter(r => r.daDoiSoat);
        if (statusTab === 'unchecked') return all.filter(r => !r.daDoiSoat);
        return all;
    }, [data, statusTab]);

    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const allFilteredSelected = rows.length > 0 && rows.every(r => selected.has(r.oid));

    const statusTabs = useMemo(
        () => [
            { key: 'all', label: `Tất cả (${data?.masters.length ?? 0})` },
            { key: 'unchecked', label: `Chưa đối soát (${data?.summary.soChuaDoiSoat ?? 0})` },
            { key: 'checked', label: `Đã đối soát (${data?.summary.soDaDoiSoat ?? 0})` },
        ],
        [data],
    );

    /* ── actions ──────────────────────────────────────────────────────── */

    const load = async () => {
        if (!party.trim()) {
            toast.error('Nhập bên đối soát (party) trước đã.');
            return;
        }
        setLoading(true);
        setSelected(new Set());
        setPage(1);
        try {
            const res = await getReconcileData({ frmDate, toDate, party: party.trim(), search: search.trim() || undefined });
            if (res.success && res.data) {
                setData(res.data);
            } else {
                setData(null);
                toast.error(res.message || 'Tra cứu thất bại.');
            }
        } catch (e: any) {
            setData(null);
            toast.error(e?.response?.data?.message || 'Tra cứu thất bại.');
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (oid: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(oid) ? next.delete(oid) : next.add(oid);
            return next;
        });
    };

    const toggleAllFiltered = () => {
        setSelected(prev => {
            if (allFilteredSelected) {
                const next = new Set(prev);
                rows.forEach(r => next.delete(r.oid));
                return next;
            }
            return new Set([...Array.from(prev), ...rows.map(r => r.oid)]);
        });
    };

    const runBulk = async (action: 'check' | 'uncheck', oids: string[]) => {
        setActing(true);
        try {
            const res =
                action === 'check'
                    ? await checkReconcile({ oids, party: party.trim(), note: checkNote.trim() || undefined })
                    : await uncheckReconcile({ oids, party: party.trim() });
            if (res.success) {
                toast.success(res.message);
                await load();
            } else {
                toast.error(res.message || 'Thao tác thất bại.');
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Thao tác thất bại.');
        } finally {
            setActing(false);
            setConfirmAction(null);
            setCheckNote('');
        }
    };

    // Tick / gỡ tick nhanh 1 dòng — không cần confirm (hành động nhỏ, đảo lại được ngay)
    const quickToggle = async (row: ReconcileMasterRow) => {
        try {
            const res = row.daDoiSoat
                ? await uncheckReconcile({ oids: [row.oid], party: party.trim() })
                : await checkReconcile({ oids: [row.oid], party: party.trim() });
            if (res.success) {
                toast.success(row.daDoiSoat ? `Đã gỡ tích ${row.oid}` : `Đã tích ${row.oid}`);
                await load();
            } else {
                toast.error(res.message);
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Thao tác thất bại.');
        }
    };

    const handleExport = async () => {
        if (!party.trim()) {
            toast.error('Nhập bên đối soát (party) trước đã.');
            return;
        }
        setExporting(true);
        try {
            await downloadReconcileExcel({
                frmDate, toDate, party: party.trim(),
                search: search.trim() || undefined,
                onlyUnchecked: statusTab === 'unchecked',   // xuất theo tab đang xem
            });
            toast.success('Đã tải file Excel đối soát.');
        } catch {
            toast.error('Xuất Excel thất bại.');
        } finally {
            setExporting(false);
        }
    };

    const handleImportFile = async (file: File) => {
        setImporting(true);
        try {
            const res = await importReconcileFile(file, party.trim());
            if (res.success && res.data) {
                setImportResult(res.data);
                await load();
            } else {
                toast.error(res.message || 'Import thất bại.');
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Import thất bại.');
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    /* ── render ───────────────────────────────────────────────────────── */

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">Admin · Kế toán</p>
                    <h1 className="text-xl font-semibold text-[#111111] tracking-tight mt-0.5">
                        Đối soát hợp đồng với bên thứ 3
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => downloadImportTemplate().catch(() => toast.error('Tải template thất bại.'))}>
                        <DocumentArrowDownIcon className="w-4 h-4" /> Template import
                    </Button>
                    <Button variant="outline" size="sm" loading={importing} onClick={() => fileInputRef.current?.click()}>
                        <ArrowUpTrayIcon className="w-4 h-4" /> Import OID
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx"
                        className="hidden"
                        onChange={e => e.target.files?.[0] && handleImportFile(e.target.files[0])}
                    />
                    <Button variant="outline" size="sm" loading={exporting} onClick={handleExport}>
                        <ArrowDownTrayIcon className="w-4 h-4" /> Tải Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-5">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                        <Input label="Từ ngày" type="date" value={frmDate} onChange={e => setFrmDate(e.target.value)} />
                        <Input label="Đến ngày" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                        <Input label="Bên đối soát" placeholder="KL" value={party} onChange={e => setParty(e.target.value)} />
                        <Input
                            label="Tìm kiếm"
                            placeholder="Tên KH / MST / OID"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && load()}
                        />
                        <Button onClick={load} loading={loading}>
                            <MagnifyingGlassIcon className="w-4 h-4" /> Tra cứu
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {data && (
                <>
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Tổng hợp đồng', value: data.summary.soHopDong, tone: 'text-[#111111]' },
                            { label: 'Tổng tiền', value: data.summary.tongTien, tone: 'text-[#111111]', money: true },
                            { label: 'Đã đối soát', value: data.summary.soDaDoiSoat, tone: 'text-[#346538]' },
                            { label: 'Chưa đối soát', value: data.summary.soChuaDoiSoat, tone: 'text-[#9F2F2D]' },
                        ].map(s => (
                            <Card key={s.label} animate={false}>
                                <CardContent className="pt-4 pb-4">
                                    <p className="text-[11px] uppercase tracking-wide text-[#787774]">{s.label}</p>
                                    <p className={`text-xl font-semibold mt-1 ${s.tone}`}>
                                        {s.money ? fmtMoney(s.value) : <NumberCounter value={s.value} />}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Tabs trạng thái + bulk actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <VercelTabs
                            items={statusTabs}
                            value={statusTab}
                            onChange={k => { setStatusTab(k as StatusTab); setPage(1); }}
                        />
                        {selected.size > 0 && (
                            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
                                <Badge tone="info">{selected.size} đã chọn</Badge>
                                <Button variant="success" size="sm" onClick={() => setConfirmAction('check')}>
                                    <CheckCircleIcon className="w-4 h-4" /> Tích đã đối soát
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => setConfirmAction('uncheck')}>
                                    <XCircleIcon className="w-4 h-4" /> Gỡ tích
                                </Button>
                            </motion.div>
                        )}
                    </div>

                    {/* Table */}
                    <Card animate={false}>
                        <CardHeader>
                            <CardTitle>
                                Danh sách hợp đồng — kỳ {fmtDate(frmDate)} → {fmtDate(toDate)} · bên {party}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {rows.length === 0 ? (
                                <div className="py-10 flex flex-col items-center text-[#787774]">
                                    <InboxIcon className="w-8 h-8 mb-2" />
                                    <p className="text-sm">Không có hợp đồng nào khớp bộ lọc.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Cột OID + checkbox ghim TRÁI, nút thao tác ghim PHẢI —
                                        cuộn ngang vẫn luôn biết đang tick hợp đồng nào. */}
                                    <div className="overflow-x-auto -mx-5 max-h-[65vh] overflow-y-auto">
                                        <table className="min-w-full text-sm border-separate border-spacing-0">
                                            <thead>
                                                <tr className="text-[11px] uppercase tracking-wide text-[#787774]">
                                                    <th className="sticky top-0 left-0 z-30 bg-[#F7F8FA] border-b border-[#E4E7EC] w-12 px-4 py-2.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={allFilteredSelected}
                                                            onChange={toggleAllFiltered}
                                                            title={`Chọn tất cả ${rows.length} HĐ đang lọc`}
                                                        />
                                                    </th>
                                                    <th className="sticky top-0 left-12 z-30 bg-[#F7F8FA] border-b border-[#E4E7EC] shadow-[1px_0_0_0_#E4E7EC] text-left font-medium px-3 py-2.5 min-w-[195px] whitespace-nowrap">
                                                        OID
                                                    </th>
                                                    <th className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#E4E7EC] text-left font-medium px-3 py-2.5 min-w-[125px] whitespace-nowrap">Sale</th>
                                                    <th className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#E4E7EC] text-left font-medium px-3 py-2.5 min-w-[190px] whitespace-nowrap">Khách hàng</th>
                                                    <th className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#E4E7EC] text-left font-medium px-3 py-2.5 min-w-[105px] whitespace-nowrap">MST</th>
                                                    <th className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#E4E7EC] text-right font-medium px-3 py-2.5 min-w-[95px] whitespace-nowrap">Tổng tiền</th>
                                                    <th className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#E4E7EC] text-left font-medium px-3 py-2.5 min-w-[90px] whitespace-nowrap">KT ký</th>
                                                    <th className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#E4E7EC] text-left font-medium px-3 py-2.5 min-w-[90px] whitespace-nowrap">Khách ký</th>
                                                    <th className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#E4E7EC] text-left font-medium px-3 py-2.5 min-w-[105px] whitespace-nowrap">Đối soát</th>
                                                    <th className="sticky top-0 right-0 z-30 bg-[#F7F8FA] border-b border-[#E4E7EC] shadow-[-1px_0_0_0_#E4E7EC] text-right font-medium px-4 py-2.5 min-w-[92px] whitespace-nowrap">
                                                        Thao tác
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pageRows.map(r => {
                                                    const isSel = selected.has(r.oid);
                                                    // Ô ghim nằm đè lên ô khác nên phải tự set nền theo trạng thái dòng.
                                                    const stickyBg = isSel ? 'bg-[#EAF0FA]' : 'bg-white group-hover:bg-[#FAFAF8]';
                                                    const cell = 'border-b border-[#F1F0EC] px-3 py-2 whitespace-nowrap';
                                                    return (
                                                        <tr
                                                            key={r.oid}
                                                            onClick={() => toggleRow(r.oid)}
                                                            className={`group cursor-pointer ${isSel ? 'bg-[#EAF0FA]' : 'hover:bg-[#FAFAF8]'}`}
                                                        >
                                                            <td className={`sticky left-0 z-10 ${stickyBg} border-b border-[#F1F0EC] px-4 py-2`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSel}
                                                                    onChange={() => toggleRow(r.oid)}
                                                                    onClick={e => e.stopPropagation()}
                                                                />
                                                            </td>
                                                            <td className={`sticky left-12 z-10 ${stickyBg} shadow-[1px_0_0_0_#E4E7EC] ${cell} font-mono text-xs text-[#111111]`}>
                                                                {r.oid}
                                                            </td>
                                                            <td className={`${cell} max-w-[140px] truncate`} title={r.saleEmID || ''}>
                                                                {r.saleName || r.saleEmID || '—'}
                                                            </td>
                                                            <td className={`${cell} max-w-[210px] truncate`} title={r.cusName || ''}>{r.cusName}</td>
                                                            <td className={cell}>{r.cusTax}</td>
                                                            <td className={`${cell} text-right tabular-nums`}>{fmtMoney(r.sum_Amnt)}</td>
                                                            <td className={cell}>{fmtDate(r.ngayKeToanKy)}</td>
                                                            <td className={cell}>{fmtDate(r.ngayKhachKy)}</td>
                                                            <td className={cell}>
                                                                {r.daDoiSoat ? (
                                                                    <Badge tone="success">
                                                                        <span
                                                                            className="cursor-help"
                                                                            title={`${r.nguoiDoiSoat || ''} · ${fmtDateTime(r.ngayDoiSoat)}${r.ghiChuDoiSoat ? ` · ${r.ghiChuDoiSoat}` : ''}`}
                                                                        >
                                                                            ✓ {fmtDate(r.ngayDoiSoat)}
                                                                        </span>
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge tone="danger">Chưa</Badge>
                                                                )}
                                                            </td>
                                                            <td
                                                                className={`sticky right-0 z-10 ${stickyBg} shadow-[-1px_0_0_0_#E4E7EC] border-b border-[#F1F0EC] px-4 py-2 text-right`}
                                                                onClick={e => e.stopPropagation()}
                                                            >
                                                                <Button
                                                                    variant={r.daDoiSoat ? 'destructive' : 'success'}
                                                                    size="sm"
                                                                    onClick={() => quickToggle(r)}
                                                                >
                                                                    {r.daDoiSoat ? 'Gỡ tích' : 'Tích'}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination client-side */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mt-4">
                                            <p className="text-xs text-[#787774]">
                                                {rows.length.toLocaleString('vi-VN')} HĐ · trang {page}/{totalPages}
                                            </p>
                                            <div className="flex gap-1">
                                                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                                                    <ChevronLeftIcon className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Confirm tích / gỡ tích hàng loạt */}
            <ConfirmDialog
                open={confirmAction === 'check'}
                title={`Tích đã đối soát ${selected.size} hợp đồng?`}
                description={
                    <span>
                        Đánh dấu <b>{selected.size}</b> HĐ đã đối soát với bên <b>{party}</b>. HĐ đã tích từ trước sẽ bỏ qua.
                        <span className="block mt-3">
                            <Input
                                label="Ghi chú (tùy chọn)"
                                placeholder="vd: Đối soát Q2/2026"
                                value={checkNote}
                                onChange={e => setCheckNote(e.target.value)}
                            />
                        </span>
                    </span>
                }
                confirmText="Tích đã đối soát"
                loading={acting}
                onConfirm={() => runBulk('check', Array.from(selected))}
                onClose={() => { setConfirmAction(null); setCheckNote(''); }}
            />
            <ConfirmDialog
                open={confirmAction === 'uncheck'}
                tone="danger"
                title={`Gỡ tích ${selected.size} hợp đồng?`}
                description={<span>Bỏ đánh dấu đối soát với bên <b>{party}</b> cho <b>{selected.size}</b> HĐ đã chọn.</span>}
                confirmText="Gỡ tích"
                loading={acting}
                onConfirm={() => runBulk('uncheck', Array.from(selected))}
                onClose={() => setConfirmAction(null)}
            />

            {/* Kết quả import */}
            <ConfirmDialog
                open={!!importResult}
                title="Kết quả import"
                description={
                    importResult ? (
                        <span>
                            Đọc được <b>{importResult.tongOidDocDuoc}</b> OID —{' '}
                            <b className="text-[#346538]">{importResult.soDanhDauMoi} tích mới</b>,{' '}
                            {importResult.soDaDanhDauTruoc} đã tích từ trước
                            {importResult.soKhongTonTai > 0 && (
                                <>
                                    , <b className="text-[#9F2F2D]">{importResult.soKhongTonTai} OID không tồn tại</b>:
                                    <span className="block mt-2 max-h-40 overflow-y-auto rounded-md bg-[#FDEBEC] p-2 font-mono text-xs">
                                        {importResult.oidKhongTonTai.map(o => (
                                            <span key={o} className="block">{o}</span>
                                        ))}
                                    </span>
                                    <button
                                        type="button"
                                        className="mt-2 inline-flex items-center gap-1 text-xs text-[#1F6C9F] hover:underline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(importResult.oidKhongTonTai.join('\n'));
                                            toast.success('Đã copy danh sách OID lỗi.');
                                        }}
                                    >
                                        <ClipboardDocumentIcon className="w-3.5 h-3.5" /> Copy danh sách lỗi
                                    </button>
                                </>
                            )}
                        </span>
                    ) : undefined
                }
                confirmText="Đóng"
                onConfirm={() => setImportResult(null)}
                onClose={() => setImportResult(null)}
            />
        </div>
    );
};

export default AdminReconcile;
