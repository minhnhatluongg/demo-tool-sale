import api from './apiClient';

/*
 * Kiểm soát công nợ Sale — kênh NỘI BỘ (api/admin/sale-debt).
 *
 * Xác thực bằng JWT + Admin:AllowedUserCodes, KHÔNG dùng API key.
 * Key X-SaleDebt-Key là của đối tác Khánh Linh (kênh api/SaleDebtControl) —
 * tuyệt đối không nhúng vào FE vì bundle trình duyệt ai cũng đọc được.
 *
 * Cả hai kênh đọc/ghi cùng một cột bosUser.PermissionLevels.
 */

/* ─── Bậc công nợ ───────────────────────────────────────────────────────── */

export enum SaleDebtLevel {
    Normal = 0,
    Reminder = 1,
    Warning = 2,
    Restricted = 3,
    Locked = 4,
}

/** Nghiệp vụ bị kiểm soát — khớp enum SaleBusinessAction bên BE. */
export type SaleBusinessAction =
    | 'CreateOrder'
    | 'CreateContract'
    | 'ExtendContract'
    | 'IssueRequest';

export const ACTION_LABELS: Record<SaleBusinessAction, string> = {
    CreateOrder: 'Tạo đơn hàng',
    CreateContract: 'Tạo hợp đồng',
    ExtendContract: 'Gia hạn hợp đồng',
    IssueRequest: 'Gửi yêu cầu phát hành',
};

/* ─── DTO types từ BE ───────────────────────────────────────────────────── */

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    statusCode: number;
}

export interface SaleDebtLevelOption {
    value: number;
    code: string;
    name: string;
    description: string;
    requiresConfirmation: boolean;
    blockedActions: SaleBusinessAction[];
}

export interface SalePermissionLevel {
    userCode: string;
    loginName: string | null;
    fullName: string | null;
    email: string | null;
    isAcctive: boolean;
    /** true = tài khoản đã bị đánh dấu xóa trong bosUser. */
    isDelete: boolean;

    level: number;
    levelCode: string;
    levelName: string;
    levelDescription: string;

    /** Giá trị thô trong DB. Chuỗi rỗng = chưa từng thiết lập (hiểu là bậc 0). */
    rawValue: string | null;

    requiresConfirmation: boolean;
    notice: string;
    blockedActions: SaleBusinessAction[];

    canCreateOrder: boolean;
    canCreateContract: boolean;
    canExtendContract: boolean;
    canIssueRequest: boolean;

    chgeUser: string | null;
    chgeDate: string | null;
}

export interface SaleDebtSummaryItem {
    level: number;
    code: string;
    name: string;
    description: string;
    count: number;
    percent: number;
    isBlocking: boolean;
    blockedActions: SaleBusinessAction[];
}

export interface SaleDebtSummary {
    total: number;
    blocked: number;
    warned: number;
    normal: number;
    onlyActive: boolean;
    generatedAt: string;
    levels: SaleDebtSummaryItem[];
}

/* ─── Calls ─────────────────────────────────────────────────────────────── */

/*
 * Mặc định LẤY HẾT: onlyActive = false, includeDeleted = true.
 * Tổng số khi đó khớp đúng `SELECT COUNT(*) FROM bosConfigure.dbo.bosUser`,
 * tiện đối chiếu bằng SQL. Truyền tham số nếu cần thu hẹp.
 */

/** Tổng hợp: mỗi bậc đang có bao nhiêu tài khoản. Luôn đủ 5 bậc. */
export const getSaleDebtSummary = async (
    onlyActive = false,
    includeDeleted = true
): Promise<ApiResponse<SaleDebtSummary>> => {
    const res = await api.get('/admin/sale-debt/summary', { params: { onlyActive, includeDeleted } });
    return res.data;
};

/** Danh sách tài khoản kèm bậc hiện tại. */
export const getSaleDebtList = async (params: {
    keyword?: string;
    level?: number | null;
    onlyActive?: boolean;
    includeDeleted?: boolean;
}): Promise<ApiResponse<SalePermissionLevel[]>> => {
    const res = await api.get('/admin/sale-debt', {
        params: {
            keyword: params.keyword?.trim() || undefined,
            level: params.level ?? undefined,
            onlyActive: params.onlyActive ?? false,
            includeDeleted: params.includeDeleted ?? true,
        },
    });
    return res.data;
};

/** Danh mục 5 bậc — đổ combobox, không hardcode ở FE. */
export const getSaleDebtLevels = async (): Promise<ApiResponse<SaleDebtLevelOption[]>> => {
    const res = await api.get('/admin/sale-debt/levels');
    return res.data;
};

/** Bậc của một tài khoản. */
export const getSaleDebtByUserCode = async (
    userCode: string
): Promise<ApiResponse<SalePermissionLevel>> => {
    const res = await api.get(`/admin/sale-debt/${encodeURIComponent(userCode)}`);
    return res.data;
};

/** Điều chỉnh bậc. BE chặn tự chỉnh cho chính mình (403). */
export const updateSaleDebtLevel = async (
    userCode: string,
    body: { level: number; reason?: string }
): Promise<ApiResponse<SalePermissionLevel>> => {
    const res = await api.put(`/admin/sale-debt/${encodeURIComponent(userCode)}/level`, body);
    return res.data;
};

/* ─── UI helpers ────────────────────────────────────────────────────────── */

export type LevelTone = 'red' | 'blue' | 'green' | 'yellow' | 'neutral';

/** Màu theo bậc — dùng chung cho KPI card, badge và bảng để nhìn là biết ngay. */
export const levelTone = (level: number): LevelTone => {
    switch (level) {
        case SaleDebtLevel.Normal: return 'green';
        case SaleDebtLevel.Reminder: return 'blue';
        case SaleDebtLevel.Warning: return 'yellow';
        case SaleDebtLevel.Restricted: return 'red';
        case SaleDebtLevel.Locked: return 'red';
        default: return 'neutral';
    }
};

export const TONE_PASTEL: Record<LevelTone, { bg: string; fg: string }> = {
    red: { bg: '#FDEBEC', fg: '#9F2F2D' },
    blue: { bg: '#E1F3FE', fg: '#1F6C9F' },
    green: { bg: '#EDF3EC', fg: '#346538' },
    yellow: { bg: '#FBF3DB', fg: '#956400' },
    neutral: { bg: '#F1F0EC', fg: '#5f5e5b' },
};

/** true = bậc này đang chặn ít nhất một nghiệp vụ. */
export const isBlockingLevel = (level: number) =>
    level >= SaleDebtLevel.Restricted;
