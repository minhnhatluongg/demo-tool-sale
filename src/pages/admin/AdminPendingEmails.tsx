import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    PlusIcon,
    TrashIcon,
    PencilSquareIcon,
    MagnifyingGlassIcon,
    NoSymbolIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import {
    getPendingEmails,
    createPendingEmail,
    updatePendingEmail,
    deletePendingEmail,
    serviceTypeLabel,
    SERVICE_TYPE_OPTIONS,
    PendingEmail,
} from '../../api/pendingEmailService';

const PAGE_SIZE = 20;

const inputCls =
    'w-full h-9 px-3 rounded-md border border-[#E4E7EC] bg-white text-sm text-[#2F3437] focus:outline-none focus:border-[#111111] transition-colors';
const selectCls = inputCls + ' pr-8';
const btnDark =
    'inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[#111111] text-white text-sm font-medium hover:bg-[#2b2b2b] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const btnLight =
    'inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-[#E4E7EC] bg-white text-sm text-[#2F3437] hover:bg-[#F1F0EC] active:scale-[0.98] transition-all disabled:opacity-50';

const emptyForm = {
    taxnumber: '',
    email: '',
    serviceType: 'TVAN',
    partyCode: '',
    description: '',
};

const AdminPendingEmails: React.FC = () => {
    const [items, setItems] = useState<PendingEmail[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Bộ lọc
    const [fTax, setFTax] = useState('');
    const [fEmail, setFEmail] = useState('');
    const [fService, setFService] = useState('');

    // Form thêm mới
    const [form, setForm] = useState({ ...emptyForm });

    // Sửa (modal)
    const [editing, setEditing] = useState<PendingEmail | null>(null);
    const [editForm, setEditForm] = useState({ ...emptyForm });
    const [editSaving, setEditSaving] = useState(false);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const load = useCallback(async (pageArg = 1) => {
        setLoading(true);
        try {
            const res = await getPendingEmails({
                taxnumber: fTax,
                email: fEmail,
                serviceType: fService,
                page: pageArg,
                pageSize: PAGE_SIZE,
            });
            setItems(res.data || []);
            setTotal(Number(res.meta?.totalCount ?? (res.data?.length || 0)));
            setPage(pageArg);
        } catch (e: any) {
            toast.error(
                e?.response?.data?.message || e?.message || 'Không tải được danh sách'
            );
            setItems([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [fTax, fEmail, fService]);

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onAdd = async () => {
        if (!form.taxnumber.trim()) return toast.error('Nhập Mã số thuế');
        if (!form.email.trim()) return toast.error('Nhập Email');
        if (!form.serviceType) return toast.error('Chọn loại dịch vụ');
        setSaving(true);
        try {
            await createPendingEmail({
                taxnumber: form.taxnumber.trim(),
                email: form.email.trim(),
                serviceType: form.serviceType,
                partyCode: form.partyCode.trim() || undefined,
                description: form.description.trim() || undefined,
            });
            toast.success('Đã thêm email loại trừ');
            setForm({ ...emptyForm });
            await load(1);
        } catch (e: any) {
            toast.error(
                e?.response?.data?.message || e?.message || 'Thêm thất bại'
            );
        } finally {
            setSaving(false);
        }
    };

    const openEdit = (row: PendingEmail) => {
        setEditing(row);
        setEditForm({
            taxnumber: row.taxnumber,
            email: row.email,
            serviceType: row.serviceType,
            partyCode: row.partyCode || '',
            description: row.description || '',
        });
    };

    const onUpdate = async () => {
        if (!editing) return;
        if (!editForm.taxnumber.trim()) return toast.error('Nhập Mã số thuế');
        if (!editForm.email.trim()) return toast.error('Nhập Email');
        if (!editForm.serviceType) return toast.error('Chọn loại dịch vụ');
        setEditSaving(true);
        try {
            await updatePendingEmail(editing.pid, {
                taxnumber: editForm.taxnumber.trim(),
                email: editForm.email.trim(),
                serviceType: editForm.serviceType,
                partyCode: editForm.partyCode.trim() || undefined,
                description: editForm.description.trim() || undefined,
            });
            toast.success('Đã cập nhật');
            setEditing(null);
            await load(page);
        } catch (e: any) {
            toast.error(
                e?.response?.data?.message || e?.message || 'Cập nhật thất bại'
            );
        } finally {
            setEditSaving(false);
        }
    };

    const onDelete = async (row: PendingEmail) => {
        if (
            !window.confirm(
                `Xóa email "${row.email}" (MST ${row.taxnumber} · ${serviceTypeLabel(
                    row.serviceType
                )}) khỏi danh sách loại trừ?`
            )
        )
            return;
        try {
            await deletePendingEmail(row.pid);
            toast.success('Đã xóa');
            // Nếu xóa dòng cuối của trang → lùi 1 trang.
            const nextPage = items.length === 1 && page > 1 ? page - 1 : page;
            await load(nextPage);
        } catch (e: any) {
            toast.error(
                e?.response?.data?.message || e?.message || 'Xóa thất bại'
            );
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-[#111111]">
                    <NoSymbolIcon className="w-6 h-6" strokeWidth={1.8} />
                    <h1 className="text-xl font-semibold tracking-tight">
                        Email loại trừ cảnh báo hết hạn
                    </h1>
                </div>
                <p className="text-sm text-[#787774] mt-1">
                    Thêm các email <b>KHÔNG</b> muốn nhận cảnh báo hết hạn dịch vụ, theo
                    từng loại dịch vụ hoặc tất cả (%). Khóa chống trùng: MST + Dịch vụ + Email.
                </p>
            </div>

            {/* Form thêm mới */}
            <div className="bg-white border border-[#E4E7EC] rounded-lg p-4 mb-5">
                <p className="text-[13px] font-semibold text-[#111111] mb-3">
                    Thêm email loại trừ
                </p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-1">
                        <label className="block text-xs text-[#787774] mb-1">Mã số thuế *</label>
                        <input
                            className={inputCls}
                            value={form.taxnumber}
                            onChange={(e) => setForm({ ...form, taxnumber: e.target.value })}
                            placeholder="VD: 0312345678"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs text-[#787774] mb-1">Email *</label>
                        <input
                            className={inputCls}
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="ketoan@congty.vn"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-[#787774] mb-1">Loại dịch vụ *</label>
                        <select
                            className={selectCls}
                            value={form.serviceType}
                            onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                        >
                            {SERVICE_TYPE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-xs text-[#787774] mb-1">Mã KH (tùy chọn)</label>
                        <input
                            className={inputCls}
                            value={form.partyCode}
                            onChange={(e) => setForm({ ...form, partyCode: e.target.value })}
                            placeholder="PartyCode"
                        />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                        <button className={btnDark + ' w-full justify-center'} onClick={onAdd} disabled={saving}>
                            <PlusIcon className="w-4 h-4" /> {saving ? 'Đang lưu…' : 'Thêm'}
                        </button>
                    </div>
                    <div className="md:col-span-6">
                        <label className="block text-xs text-[#787774] mb-1">Ghi chú (tùy chọn)</label>
                        <input
                            className={inputCls}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Lý do loại trừ…"
                        />
                    </div>
                </div>
            </div>

            {/* Bộ lọc */}
            <div className="flex flex-wrap items-end gap-3 mb-3">
                <div>
                    <label className="block text-xs text-[#787774] mb-1">MST</label>
                    <input
                        className={inputCls + ' w-44'}
                        value={fTax}
                        onChange={(e) => setFTax(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && load(1)}
                        placeholder="Lọc theo MST"
                    />
                </div>
                <div>
                    <label className="block text-xs text-[#787774] mb-1">Email</label>
                    <input
                        className={inputCls + ' w-56'}
                        value={fEmail}
                        onChange={(e) => setFEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && load(1)}
                        placeholder="Lọc theo email"
                    />
                </div>
                <div>
                    <label className="block text-xs text-[#787774] mb-1">Loại dịch vụ</label>
                    <select
                        className={selectCls + ' w-52'}
                        value={fService}
                        onChange={(e) => setFService(e.target.value)}
                    >
                        <option value="">Tất cả loại</option>
                        {SERVICE_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button className={btnLight} onClick={() => load(1)}>
                    <MagnifyingGlassIcon className="w-4 h-4" /> Lọc
                </button>
            </div>

            {/* Bảng */}
            <div className="bg-white border border-[#E4E7EC] rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[11px] uppercase tracking-wide text-[#787774] border-b border-[#E4E7EC]">
                                <th className="px-4 py-3">MST</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Dịch vụ</th>
                                <th className="px-4 py-3">Mã KH</th>
                                <th className="px-4 py-3">Ghi chú</th>
                                <th className="px-4 py-3 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-[#787774]">
                                        Đang tải…
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-10 text-center text-[#787774]">
                                        Chưa có email loại trừ nào.
                                    </td>
                                </tr>
                            ) : (
                                items.map((row) => (
                                    <tr key={row.pid} className="border-b border-[#F0F1F3] hover:bg-[#FAFAFA]">
                                        <td className="px-4 py-3 font-medium text-[#111111]">{row.taxnumber}</td>
                                        <td className="px-4 py-3">{row.email}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block px-2 py-0.5 rounded-md text-xs bg-[#F1F0EC] text-[#5f5e5b]">
                                                {serviceTypeLabel(row.serviceType)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#5f5e5b]">{row.partyCode || '—'}</td>
                                        <td className="px-4 py-3 text-[#5f5e5b] max-w-xs truncate" title={row.description || ''}>
                                            {row.description || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[#1F6C9F] hover:bg-[#E1F3FE] transition-colors"
                                                    title="Sửa"
                                                    onClick={() => openEdit(row)}
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-[#9F2F2D] hover:bg-[#FDEBEC] transition-colors"
                                                    title="Xóa"
                                                    onClick={() => onDelete(row)}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#E4E7EC]">
                    <span className="text-xs text-[#787774]">
                        Tổng {total} dòng · Trang {page}/{totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            className={btnLight + ' h-8 px-3'}
                            disabled={page <= 1 || loading}
                            onClick={() => load(page - 1)}
                        >
                            ← Trước
                        </button>
                        <button
                            className={btnLight + ' h-8 px-3'}
                            disabled={page >= totalPages || loading}
                            onClick={() => load(page + 1)}
                        >
                            Sau →
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Sửa */}
            {editing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
                    onClick={() => !editSaving && setEditing(null)}
                >
                    <div
                        className="w-full max-w-lg bg-white rounded-lg border border-[#E4E7EC] shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E7EC]">
                            <p className="text-sm font-semibold text-[#111111]">
                                Sửa email loại trừ · PID {editing.pid}
                            </p>
                            <button
                                className="text-[#787774] hover:text-[#111111]"
                                onClick={() => !editSaving && setEditing(null)}
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div>
                                <label className="block text-xs text-[#787774] mb-1">Mã số thuế *</label>
                                <input
                                    className={inputCls}
                                    value={editForm.taxnumber}
                                    onChange={(e) => setEditForm({ ...editForm, taxnumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-[#787774] mb-1">Email *</label>
                                <input
                                    className={inputCls}
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-[#787774] mb-1">Loại dịch vụ *</label>
                                    <select
                                        className={selectCls}
                                        value={editForm.serviceType}
                                        onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })}
                                    >
                                        {SERVICE_TYPE_OPTIONS.map((o) => (
                                            <option key={o.value} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#787774] mb-1">Mã KH (tùy chọn)</label>
                                    <input
                                        className={inputCls}
                                        value={editForm.partyCode}
                                        onChange={(e) => setEditForm({ ...editForm, partyCode: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-[#787774] mb-1">Ghi chú (tùy chọn)</label>
                                <input
                                    className={inputCls}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E4E7EC]">
                            <button
                                className={btnLight}
                                onClick={() => setEditing(null)}
                                disabled={editSaving}
                            >
                                Hủy
                            </button>
                            <button className={btnDark} onClick={onUpdate} disabled={editSaving}>
                                {editSaving ? 'Đang lưu…' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPendingEmails;
