import api from './apiClient';

/* ─── DTO types từ BE (api/admin/econtract/reconcile) ──────────────────── */

export interface ReconcileMasterRow {
    oid: string;
    oDate: string;
    crt_Date?: string | null;
    saleEmID?: string | null;
    /** Tên Sale (bosUser.FullName theo UserCode) */
    saleName?: string | null;
    cusName?: string | null;
    cusTax?: string | null;
    cusCMND_ID?: string | null;
    cusAddress?: string | null;
    sampleID?: string | null;
    /** % VAT (tu chi tiet) */
    vaT_Rate: number;
    /** Tong tien DA GOM VAT = SUM(ItemPrice x Qtty) tu chi tiet */
    sum_Amnt: number;
    isGiaHan?: boolean | null;
    isCapBu?: boolean | null;
    /** Ngày KẾ TOÁN ký (301) — null nếu chưa */
    ngayKeToanKy?: string | null;
    /** Ngày KHÁCH ký (501) — null nếu chưa */
    ngayKhachKy?: string | null;
    currSignNumb: number;
    daDoiSoat: boolean;
    ngayDoiSoat?: string | null;
    nguoiDoiSoat?: string | null;
    ghiChuDoiSoat?: string | null;
}

export interface ReconcileSummary {
    soHopDong: number;
    tongTien: number;
    soDaDoiSoat: number;
    soChuaDoiSoat: number;
}

export interface ReconcileData {
    masters: ReconcileMasterRow[];
    details: unknown[];
    summary: ReconcileSummary;
}

export interface ReconcileCheckResult {
    party: string;
    soHopDongGui: number;
    soHopDongThayDoi: number;
}

export interface ReconcileImportResult {
    party: string;
    tongOidDocDuoc: number;
    soHopLe: number;
    soKhongTonTai: number;
    soDanhDauMoi: number;
    soDaDanhDauTruoc: number;
    oidKhongTonTai: string[];
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    statusCode: number;
}

export interface ReconcileFilter {
    frmDate?: string;
    toDate?: string;
    party: string;
    onlyUnchecked?: boolean;
    search?: string;
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

/** Tải blob về máy với tên file cho trước. */
const saveBlob = (blob: Blob, fileName: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

/* ─── Calls ─────────────────────────────────────────────────────────────── */

/** Dữ liệu đối soát (JSON) — danh sách HĐ + trạng thái đã/chưa đối soát theo party. */
export const getReconcileData = async (f: ReconcileFilter): Promise<ApiResponse<ReconcileData>> => {
    const res = await api.get('/admin/econtract/reconcile/data', { params: f });
    return res.data;
};

/** Tải file Excel đối soát 2 sheet (HopDong + ChiTiet). */
export const downloadReconcileExcel = async (f: ReconcileFilter): Promise<void> => {
    const res = await api.get('/admin/econtract/reconcile/export-excel', {
        params: f,
        responseType: 'blob',
    });
    saveBlob(res.data, `DoiSoat_${f.party}_${f.frmDate || ''}_${f.toDate || ''}.xlsx`);
};

/** Đánh dấu các HĐ đã đối soát (idempotent). */
export const checkReconcile = async (body: {
    oids: string[];
    party: string;
    note?: string;
}): Promise<ApiResponse<ReconcileCheckResult>> => {
    const res = await api.post('/admin/econtract/reconcile/check', body);
    return res.data;
};

/** Bỏ đánh dấu đối soát. */
export const uncheckReconcile = async (body: {
    oids: string[];
    party: string;
}): Promise<ApiResponse<ReconcileCheckResult>> => {
    const res = await api.post('/admin/econtract/reconcile/uncheck', body);
    return res.data;
};

/** Tải template Excel import OID. */
export const downloadImportTemplate = async (): Promise<void> => {
    const res = await api.get('/admin/econtract/reconcile/import-template', { responseType: 'blob' });
    saveBlob(res.data, 'Template_DoiSoat_ImportOID.xlsx');
};

/** Import file Excel danh sách OID → đánh dấu hàng loạt. */
export const importReconcileFile = async (
    file: File,
    party: string,
    note?: string,
): Promise<ApiResponse<ReconcileImportResult>> => {
    const form = new FormData();
    form.append('file', file);
    form.append('party', party);
    if (note) form.append('note', note);
    const res = await api.post('/admin/econtract/reconcile/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};
