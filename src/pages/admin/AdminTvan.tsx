import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import {
    MagnifyingGlassIcon,
    ArrowPathIcon,
    BoltIcon,
    CalendarDaysIcon,
    TrashIcon,
    InboxIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { VercelTabs } from '../../components/ui/vercel-tabs';
import { NumberCounter } from '../../components/ui/number-counter';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

import {
    getTvanInfo,
    getTvanPackages,
    renewTvan,
    cancelTvan,
    syncTvan,
    TvanInfo,
    TvanExtension,
    TvanPackage,
} from '../../api/adminTvanService';

/* ─── Helpers ──────────────────────────────────────────────────────────── */

const fmtDate = (s?: string | null) => {
    if (!s) return '—';
    const d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('vi-VN');
};

const fmtMoney = (n?: number) => (n || 0).toLocaleString('vi-VN') + ' đ';

/* ─── Page ─────────────────────────────────────────────────────────────── */

const AdminTvan: React.FC = () => {
    // Tra cứu
    const [mst, setMst] = useState('');
    const [searching, setSearching] = useState(false);
    const [info, setInfo] = useState<TvanInfo | null>(null);

    // Gói + gia hạn
    const [packages, setPackages] = useState<TvanPackage[]>([]);
    const [selectedPkg, setSelectedPkg] = useState('');
    const [oid, setOid] = useState('');
    // Số lượng = số lần nhân gói (gói 1 năm × qty = qty năm). Mặc định 1; chỉ dùng case đặc biệt.
    const [renewQty, setRenewQty] = useState(1);
    const [confirmRenew, setConfirmRenew] = useState(false);
    const [renewing, setRenewing] = useState(false);

    // Hủy
    const [cancelTarget, setCancelTarget] = useState<TvanExtension | null>(null);
    const [canceling, setCanceling] = useState(false);

    // Đồng bộ
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        getTvanPackages()
            .then(res => {
                const list = res.data || [];
                setPackages(list);
                if (list.length > 0) setSelectedPkg(list[0].itemID);
            })
            .catch(() => toast.error('Không tải được danh sách gói TVAN.'));
    }, []);

    const pkgTabs = useMemo(
        () =>
            packages.map(p => ({
                key: p.itemID,
                label: `${p.soNam} năm — ${p.itemID}`,
                hint: `${p.itemName} · ${fmtMoney(p.itemPrice)}`,
            })),
        [packages],
    );

    const currentPkg = packages.find(p => p.itemID === selectedPkg);

    /* ── actions ──────────────────────────────────────────────────────── */

    const handleSearch = async () => {
        if (!mst.trim()) {
            toast.error('Nhập MST trước đã.');
            return;
        }
        setSearching(true);
        try {
            const res = await getTvanInfo(mst);
            if (res.success && res.data) {
                setInfo(res.data);
                if (res.data.tongSoLanGiaHan === 0) toast('MST chưa có bản ghi gia hạn TVAN nào.', { icon: 'ℹ️' });
            } else {
                setInfo(null);
                toast.error(res.message || 'Tra cứu thất bại.');
            }
        } catch (e: any) {
            setInfo(null);
            toast.error(e?.response?.data?.message || 'Tra cứu thất bại.');
        } finally {
            setSearching(false);
        }
    };

    const handleRenew = async () => {
        if (!info || !currentPkg) return;
        setRenewing(true);
        try {
            const res = await renewTvan({
                mst: info.mst,
                oid: oid.trim() || null,
                packageItemId: currentPkg.itemID,
                quantity: renewQty,
            });
            if (res.success && res.data) {
                toast.success(
                    `Gia hạn ${res.data.soNam} năm thành công — hạn mới ${fmtDate(res.data.ngayThuPhiDTMoi)}.`,
                );
                if (res.data.infoSauGiaHan) setInfo(res.data.infoSauGiaHan);
                setOid('');
                setRenewQty(1);
            } else {
                toast.error(res.message || 'Gia hạn thất bại.');
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Gia hạn thất bại.');
        } finally {
            setRenewing(false);
            setConfirmRenew(false);
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget || !info) return;
        setCanceling(true);
        try {
            const res = await cancelTvan({ id: cancelTarget.id, mst: info.mst });
            if (res.success) {
                toast.success('Đã hủy bản ghi gia hạn.');
                if (res.data) setInfo(res.data);
            } else {
                toast.error(res.message || 'Hủy thất bại.');
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Hủy thất bại.');
        } finally {
            setCanceling(false);
            setCancelTarget(null);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await syncTvan();
            res.success ? toast.success('Đồng bộ TVAN thành công.') : toast.error(res.message || 'Đồng bộ thất bại.');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Đồng bộ thất bại.');
        } finally {
            setSyncing(false);
        }
    };

    /* ── render ───────────────────────────────────────────────────────── */

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#787774]">Admin · TVAN</p>
                    <h1 className="text-xl font-semibold text-[#111111] tracking-tight mt-0.5">
                        Gia hạn / Hủy dịch vụ TVAN
                    </h1>
                </div>
                <Button variant="outline" size="sm" onClick={handleSync} loading={syncing}>
                    <ArrowPathIcon className="w-4 h-4" /> Đồng bộ toàn hệ thống
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-5">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Nhập MST khách hàng..."
                            value={mst}
                            onChange={e => setMst(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} loading={searching} className="shrink-0">
                            <MagnifyingGlassIcon className="w-4 h-4" /> Tra cứu
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AnimatePresence mode="wait">
                {info && (
                    <motion.div
                        key={info.mst + info.tongSoLanGiaHan}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-5"
                    >
                        {/* Trạng thái hiện tại — xem TRƯỚC khi gia hạn */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card animate={false}>
                                <CardHeader>
                                    <CardTitle>Gói hiện tại</CardTitle>
                                    <ShieldCheckIcon className="w-4 h-4 text-[#787774]" />
                                </CardHeader>
                                <CardContent>
                                    {info.current ? (
                                        <>
                                            <p className="text-2xl font-semibold text-[#111111]">
                                                TVAN {info.current.soNam} năm
                                            </p>
                                            <p className="text-xs text-[#787774] mt-1">
                                                {info.current.soNgay.toLocaleString('vi-VN')} ngày ·{' '}
                                                {info.tongSoLanGiaHan} lần gia hạn
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-[#787774]">Chưa từng gia hạn</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card animate={false}>
                                <CardHeader>
                                    <CardTitle>Hết hạn</CardTitle>
                                    <CalendarDaysIcon className="w-4 h-4 text-[#787774]" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-semibold text-[#111111]">
                                        {fmtDate(info.current?.ngayThuPhiDT)}
                                    </p>
                                    {info.current && (
                                        <Badge tone={info.current.conHan ? 'success' : 'danger'} className="mt-1.5">
                                            {info.current.conHan ? 'Còn hạn' : 'Đã hết hạn'}
                                        </Badge>
                                    )}
                                </CardContent>
                            </Card>

                            <Card animate={false}>
                                <CardHeader>
                                    <CardTitle>Số ngày còn lại</CardTitle>
                                    <BoltIcon className="w-4 h-4 text-[#787774]" />
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-semibold text-[#111111]">
                                        {info.current ? (
                                            <NumberCounter value={info.current.soNgayConLai} />
                                        ) : (
                                            '—'
                                        )}
                                    </p>
                                    <p className="text-xs text-[#787774] mt-1">tới ngày thu phí duy trì</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Gia hạn */}
                        <Card animate={false}>
                            <CardHeader>
                                <CardTitle>Gia hạn TVAN cho MST {info.mst}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {pkgTabs.length > 0 && (
                                    <VercelTabs items={pkgTabs} value={selectedPkg} onChange={setSelectedPkg} />
                                )}
                                {currentPkg && (
                                    <p className="text-xs text-[#787774]">
                                        {currentPkg.itemName} · {fmtMoney(currentPkg.itemPrice * renewQty)} ·{' '}
                                        {(currentPkg.soNgay * renewQty).toLocaleString('vi-VN')} ngày
                                        {renewQty > 1 &&
                                            ` (${currentPkg.soNam} năm × ${renewQty} = ${currentPkg.soNam * renewQty} năm)`}
                                        {' '}— hạn mới ={' '}
                                        <span className="font-medium text-[#111111]">
                                            hôm nay + {(currentPkg.soNgay * renewQty).toLocaleString('vi-VN')} ngày
                                        </span>
                                    </p>
                                )}
                                <div className="flex gap-2 items-end">
                                    <div className="w-28 shrink-0">
                                        <Input
                                            label="Số lượng"
                                            type="number"
                                            min={1}
                                            max={40}
                                            value={String(renewQty)}
                                            onChange={e =>
                                                setRenewQty(
                                                    Math.max(1, Math.min(40, Number(e.target.value) || 1)),
                                                )
                                            }
                                            hint="số năm (mặc định 1)"
                                        />
                                    </div>
                                    <Input
                                        label="OID hóa đơn đã ký (tùy chọn)"
                                        placeholder="Trống → ghi nhận NGOAI_HT"
                                        hint="Có OID → ngày đăng ký lấy theo ngày ký hóa đơn."
                                        value={oid}
                                        onChange={e => setOid(e.target.value)}
                                    />
                                    <Button
                                        className="shrink-0 mb-[22px]"
                                        onClick={() => setConfirmRenew(true)}
                                        disabled={!currentPkg}
                                    >
                                        <BoltIcon className="w-4 h-4" /> Kích hoạt gia hạn
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Lịch sử gia hạn + hủy */}
                        <Card animate={false}>
                            <CardHeader>
                                <CardTitle>Lịch sử gia hạn ({info.tongSoLanGiaHan})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {info.records.length === 0 ? (
                                    <div className="py-10 flex flex-col items-center text-[#787774]">
                                        <InboxIcon className="w-8 h-8 mb-2" />
                                        <p className="text-sm">Chưa có bản ghi gia hạn nào.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto -mx-5">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-[11px] uppercase tracking-wide text-[#787774] border-b border-[#E4E7EC]">
                                                    <th className="text-left font-medium px-5 py-2">ID</th>
                                                    <th className="text-left font-medium px-3 py-2">Gói</th>
                                                    <th className="text-left font-medium px-3 py-2">Ngày đăng ký</th>
                                                    <th className="text-left font-medium px-3 py-2">Ngày áp dụng</th>
                                                    <th className="text-left font-medium px-3 py-2">Hết hạn</th>
                                                    <th className="text-left font-medium px-3 py-2">Trạng thái</th>
                                                    <th className="text-right font-medium px-5 py-2">Hủy</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {info.records.map((r, i) => (
                                                    <motion.tr
                                                        key={r.id}
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.04 }}
                                                        className="border-b border-[#F1F0EC] hover:bg-[#FAFAF8]"
                                                    >
                                                        <td className="px-5 py-2.5 text-[#787774]">{r.id}</td>
                                                        <td className="px-3 py-2.5">
                                                            <Badge tone="info">
                                                                {r.soNam} năm · {r.soNgay} ngày
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-2.5">{fmtDate(r.ngayDangKy)}</td>
                                                        <td className="px-3 py-2.5">{fmtDate(r.ngayApDung)}</td>
                                                        <td className="px-3 py-2.5 font-medium text-[#111111]">
                                                            {fmtDate(r.ngayThuPhiDT)}
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <Badge tone={r.conHan ? 'success' : 'danger'}>
                                                                {r.conHan ? `Còn ${r.soNgayConLai} ngày` : 'Hết hạn'}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-5 py-2.5 text-right">
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => setCancelTarget(r)}
                                                            >
                                                                <TrashIcon className="w-3.5 h-3.5" /> Hủy
                                                            </Button>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm gia hạn */}
            <ConfirmDialog
                open={confirmRenew}
                title="Xác nhận gia hạn TVAN"
                description={
                    currentPkg && info ? (
                        <span>
                            Gia hạn <b>{currentPkg.soNam * renewQty} năm</b> ({currentPkg.itemName}
                            {renewQty > 1 ? ` × ${renewQty}` : ''}) cho MST <b>{info.mst}</b>.
                            <br />
                            Hạn mới = hôm nay + {(currentPkg.soNgay * renewQty).toLocaleString('vi-VN')} ngày.
                            {oid.trim() ? (
                                <>
                                    <br />
                                    Phiếu đăng ký: <b>{oid.trim()}</b>
                                </>
                            ) : (
                                <>
                                    <br />
                                    Không có OID — ghi nhận <b>NGOAI_HT</b>.
                                </>
                            )}
                        </span>
                    ) : undefined
                }
                confirmText="Gia hạn"
                loading={renewing}
                onConfirm={handleRenew}
                onClose={() => setConfirmRenew(false)}
            />

            {/* Confirm hủy */}
            <ConfirmDialog
                open={!!cancelTarget}
                tone="danger"
                title="Bạn có chắc chắn muốn xóa gia hạn?"
                description={
                    cancelTarget ? (
                        <span>
                            Bản ghi <b>#{cancelTarget.id}</b> — gói {cancelTarget.soNam} năm, hết hạn{' '}
                            {fmtDate(cancelTarget.ngayThuPhiDT)}. Hành động này không hoàn tác được.
                        </span>
                    ) : undefined
                }
                confirmText="Xóa gia hạn"
                loading={canceling}
                onConfirm={handleCancel}
                onClose={() => setCancelTarget(null)}
            />
        </div>
    );
};

export default AdminTvan;
