import api from './apiClient';

/* ─── DTO types từ BE (api/admin/tvan) ─────────────────────────────────── */

export interface TvanExtension {
    id: number;
    cmpnTaxNumber: string;
    ngayDangKy: string;
    ngayApDung: string;
    /** Ngày hết hạn / ngày thu phí duy trì tiếp theo */
    ngayThuPhiDT: string;
    soNgay: number;
    /** Gói TVAN mấy năm (1/2/3) */
    soNam: number;
    conHan: boolean;
    soNgayConLai: number;
}

export interface TvanInfo {
    mst: string;
    current: TvanExtension | null;
    records: TvanExtension[];
    tongSoLanGiaHan: number;
}

export interface TvanPackage {
    itemID: string;
    itemName: string;
    itemPrice: number;
    soNgay: number;
    soNam: number;
}

export interface TvanRenewResult {
    mst: string;
    packageItemId: string;
    packageName: string;
    itemPrice: number;
    soNgay: number;
    soNam: number;
    phieuDangKy: string;
    ngayDangKy: string;
    ngayThuPhiDTMoi: string;
    infoSauGiaHan: TvanInfo | null;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    statusCode: number;
}

/* ─── Calls ─────────────────────────────────────────────────────────────── */

/** Thông tin TVAN của MST — xem TRƯỚC khi gia hạn (gói mấy năm, hết hạn khi nào). */
export const getTvanInfo = async (mst: string): Promise<ApiResponse<TvanInfo>> => {
    const res = await api.get(`/admin/tvan/info/${encodeURIComponent(mst.trim())}`);
    return res.data;
};

/** 4 gói TVAN có thể gia hạn (giá server-side). */
export const getTvanPackages = async (): Promise<ApiResponse<TvanPackage[]>> => {
    const res = await api.get('/admin/tvan/packages');
    return res.data;
};

/** Gia hạn TVAN. oid tùy chọn — trống thì BE ghi nhận "NGOAI_HT". */
export const renewTvan = async (body: {
    mst: string;
    oid?: string | null;
    packageItemId: string;
    /** Số lượng = số lần nhân gói (mặc định 1). VD gói 1 năm + quantity=4 → 4 năm. */
    quantity?: number;
}): Promise<ApiResponse<TvanRenewResult>> => {
    const res = await api.post('/admin/tvan/renew', body);
    return res.data;
};

/** Hủy 1 bản ghi gia hạn (id lấy từ records[].id của getTvanInfo). */
export const cancelTvan = async (body: { id: number; mst: string }): Promise<ApiResponse<TvanInfo>> => {
    const res = await api.post('/admin/tvan/cancel', body);
    return res.data;
};

/** Đồng bộ / scan thời hạn thu phí TVAN toàn hệ thống (có thể chạy lâu). */
export const syncTvan = async (): Promise<ApiResponse<object>> => {
    const res = await api.post('/admin/tvan/sync');
    return res.data;
};
