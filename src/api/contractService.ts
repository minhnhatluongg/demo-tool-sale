import api from './apiClient';

/**
 * Shape khớp với BE: ERP_Portal_RC.Application.DTOs.DashboardStatsDto.
 * Chỉ liệt kê các field FE đang dùng — phần còn lại để index signature nhận hết.
 */
export interface DashboardStats {
    // Tổng quát
    countAll: number;
    countAllSum: number;
    countAllDay: number;
    countAllMonth: number;
    countAllYear: number;

    // Theo trạng thái
    count0: number;            // Trình ký
    count101: number;          // Chờ kiểm tra
    count201: number;          // Chờ GĐ duyệt
    count301: number;          // HĐ đã duyệt
    countKHSign: number;       // KH đã ký
    countClose: number;        // HĐ đóng
    countPH: number;           // Phát hành hóa đơn

    // Theo user hiện tại
    countAlluser: number;
    count0user: number;
    count101user: number;
    count301user: number;
    countKHSignuser: number;
    countPHuser: number;

    // ... và các field khác từ BE
    [key: string]: number | string | undefined;
}

export interface CountContractResponse {
    econtract: DashboardStats;
}

/**
 * GET /api/Econtract/countContract?ismanager=false
 * Cần token (đã được apiClient gắn Bearer tự động).
 */
export const getContractDashboard = async (
    isManager: boolean = false
): Promise<DashboardStats | null> => {
    const res = await api.get('/Econtract/countContract', {
        params: { ismanager: isManager },
    });

    const payload = res.data;
    if (!payload || payload.success === false) {
        throw new Error(payload?.message || 'Không lấy được dữ liệu Dashboard');
    }

    const data = payload.data as CountContractResponse | undefined;
    return data?.econtract ?? null;
};
