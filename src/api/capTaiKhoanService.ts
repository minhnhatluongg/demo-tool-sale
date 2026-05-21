import api from './apiClient';

/* ──────────────────────────────────────────────────────────────────────── *
 * Shape khớp với BE:
 *  - GET  /api/CapTaiKhoan/check-server/{mst}?cccd=...   → CheckServerResponseDto
 *  - GET  /api/Tax/get-full-info-by-mst?mst=...&loaiCap=0 → TaxFullInfoDto (ApiResponse<T>)
 *  - POST /api/CapTaiKhoan/cap-tai-khoan                 → CreateAccountResponseDto
 * ──────────────────────────────────────────────────────────────────────── */

export interface CheckServerResponse {
    mst: string;
    isExistingCustomer: boolean;
    sideServer: string;
    iNVnew: string;     // CamelCase serialize của INVnew
    INVnew?: string;    // fallback nếu BE serialize PascalCase
    tvan: string;
    erp: string;
    server234_OK: boolean;
    spReachable: boolean;
}

export interface TaxFullInfoForAccount {
    cusTax?: string;
    cusCMND_ID?: string;
    sName?: string;          // Tên công ty
    address?: string;        // Địa chỉ
    cusEmail?: string;
    cusTel?: string;
    cusWebsite?: string;
    cusBankNumber?: string;
    cusBankAddress?: string; // Tên ngân hàng
    cusPeople_Sign?: string; // Người ủy quyền
    isToKhai?: boolean;
}

export interface CreateAccountRequestPayload {
    maSoThue: string;
    cmnD_CCCD?: string;     // BE field `CMND_CCCD` → camelCase serialize thành cmnD_CCCD
    tenCongTy: string;
    diaChi?: string;
    soTaiKhoanNH?: string;
    tenNganHang?: string;
    soDienThoai?: string;
    uyQuyen?: string;
    email?: string;
    website?: string;
    allowUpdate?: string; // "0" | "1"
}

export interface CreateAccountResponse {
    isSuccess: boolean;
    message: string;
    checkOK?: boolean;
    databaseOK?: boolean;
    webAppOK?: boolean;
    windowsAppOK?: boolean;
    webAppError?: string;
    errorDetail?: string;
}

/* ──────────────────────────────────────────────────────────────────────── */

/** Bước 1: check MST đã có TK chưa */
export const checkServer = async (mst: string, cccd?: string): Promise<CheckServerResponse> => {
    const res = await api.get(`/CapTaiKhoan/check-server/${encodeURIComponent(mst.trim())}`, {
        params: { cccd: cccd ?? '' }
    });
    return res.data as CheckServerResponse;
};

/** Bước 2: lấy thông tin công ty theo MST để fill form */
export const getCompanyInfoByMst = async (mst: string): Promise<TaxFullInfoForAccount | null> => {
    const res = await api.get('/Tax/get-full-info-by-mst', {
        params: { mst: mst.trim(), loaiCap: 0 }
    });
    const payload = res.data;
    if (!payload || payload.success === false) return null;
    return (payload.data ?? payload) as TaxFullInfoForAccount;
};

/** Bước 3: submit cấp TK */
export const capTaiKhoan = async (
    payload: CreateAccountRequestPayload
): Promise<CreateAccountResponse> => {
    const res = await api.post('/CapTaiKhoan/cap-tai-khoan', payload);
    return res.data as CreateAccountResponse;
};
