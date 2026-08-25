import api from './apiClient';

/*
 * Email LOẠI TRỪ khỏi cảnh báo hết hạn dịch vụ
 * (bảng [BosEVAT].[dbo].[RPT_PendingCompnyEmail], API api/admin/pending-company-emails).
 * CHỈ ADMIN (JWT + Admin:AllowedUserCodes / AdminAuthFilter) — thêm/sửa/xóa email
 * không muốn nhận cảnh báo, theo từng loại dịch vụ hoặc tất cả.
 */

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    statusCode: number;
    meta?: Record<string, any> | null;
    errors?: string[] | null;
}

export interface PendingEmail {
    pid: number;
    taxnumber: string;
    description: string | null;
    partyCode: string | null;
    email: string;
    serviceType: string;
}

export interface CreatePendingEmailBody {
    taxnumber: string;
    email: string;
    serviceType: string;
    partyCode?: string;
    description?: string;
}

/** Loại dịch vụ cho dropdown. "%" = áp cho tất cả dịch vụ. */
export const SERVICE_TYPE_OPTIONS: { value: string; label: string }[] = [
    { value: 'TVAN', label: 'TVAN' },
    { value: 'HDDT', label: 'Hóa đơn điện tử (HDDT)' },
    { value: 'HDDT_MAUVAO', label: 'HĐĐT mẫu vào (HDDT_MAUVAO)' },
    { value: 'CKS', label: 'Chữ ký số (CKS)' },
    { value: 'KKTHUE', label: 'Kê khai thuế (KKTHUE)' },
    { value: '%', label: 'Tất cả dịch vụ (%)' },
];

/** Nhãn hiển thị gọn cho 1 giá trị ServiceType. */
export const serviceTypeLabel = (v: string): string => {
    if (v === '%') return 'Tất cả (%)';
    const found = SERVICE_TYPE_OPTIONS.find((o) => o.value === v);
    return found ? found.value : v;
};

/** Danh sách email loại trừ (lọc + phân trang). */
export const getPendingEmails = async (params: {
    taxnumber?: string;
    email?: string;
    serviceType?: string;
    page?: number;
    pageSize?: number;
}): Promise<ApiResponse<PendingEmail[]>> => {
    const res = await api.get('/admin/pending-company-emails', {
        params: {
            taxnumber: params.taxnumber?.trim() || undefined,
            email: params.email?.trim() || undefined,
            serviceType: params.serviceType || undefined,
            page: params.page ?? 1,
            pageSize: params.pageSize ?? 20,
        },
    });
    return res.data;
};

/** Thêm 1 email loại trừ. */
export const createPendingEmail = async (
    body: CreatePendingEmailBody
): Promise<ApiResponse<{ pid: number }>> => {
    const res = await api.post('/admin/pending-company-emails', body);
    return res.data;
};

/** Sửa 1 email loại trừ theo PID. */
export const updatePendingEmail = async (
    pid: number,
    body: CreatePendingEmailBody
): Promise<ApiResponse<null>> => {
    const res = await api.put(`/admin/pending-company-emails/${pid}`, body);
    return res.data;
};

/** Xóa 1 email loại trừ theo PID. */
export const deletePendingEmail = async (
    pid: number
): Promise<ApiResponse<null>> => {
    const res = await api.delete(`/admin/pending-company-emails/${pid}`);
    return res.data;
};
