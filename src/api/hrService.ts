import api from './apiClient';

/* ─── DTO types từ BE (api/hr) ───────────────────────────────────────────── */

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    statusCode: number;
    /** Khi validate hỏng, BE trả về TẤT CẢ lỗi ở đây (message chỉ là dòng tóm tắt). */
    errors?: string[] | null;
}

export interface CatalogItem {
    code: string;
    name: string;
}

/**
 * Cấp trong cây ASM.
 * `depth` = số cột ≠ '%' trong HmrWorkingProcess (ClnID_Mng, ClnID_MngOffice, ZoneID, Sup, TeamID).
 * 0 = MNG (GĐ kênh) … 5 = TDV/CTV (node lá).
 */
export interface AsmLevel {
    code: string;          // MNG | GDVP | ASM | SUP | TEAM | TDV
    name: string;
    depth: number;
    suggestedPcID: string;
}

export interface HrCatalogs {
    channels: CatalogItem[];
    departments: CatalogItem[];
    positions: CatalogItem[];
    positionControls: CatalogItem[];
    asmLevels: AsmLevel[];
}

export interface GroupListItem {
    grpCode: string;
    postName: string;
    jobsName: string;
    levelName: string;
    siteID: string;
    userCount: number;
    menuCount: number;
}

export interface GroupMenu {
    menuID: string;
    menuDscpt: string;
    accsForm: string | null;
}

export interface GroupAction {
    variantID: string;
    descrip: string;
    /** ⚠️ true = bit này là ĐIỀU CẤM, không phải quyền được cấp. Hiển thị đỏ. */
    isRestriction: boolean;
}

export interface GroupDataScope {
    conditionsID: string;
    descrip: string;
}

export interface GroupPermissions {
    grpCode: string;
    menuCount: number;
    menus: GroupMenu[];
    actions: GroupAction[];
    dataScopes: GroupDataScope[];
    /** Số ngày dữ liệu được xem. -1 = không giới hạn. */
    viewNumb: number;
}

export interface CreateEmployeeRequest {
    fullName: string;
    email?: string;
    phone?: string;
    soCMND?: string;

    clnID?: string;
    did?: string;
    psID?: string;
    pcID?: string;

    managerEmplID?: string;
    /** MNG | GDVP | ASM | SUP | TEAM | TDV — phải THẤP HƠN cấp của sếp. */
    asmLevel: string;

    createAccount: boolean;
    loginName?: string;
    password?: string;
    osLogin?: string[];        // ERP | FIN | TEST | WEB
    systemRights?: string[];   // SystemUser | SystemLogin_WebApp | …

    grpCodes?: string[];
}

export interface AsmColumns {
    clnID: string;
    clnID_Mng: string;
    clnID_MngOffice: string;
    zoneID: string;
    sup: string;
    teamID: string;
}

export interface CreateEmployeeResult {
    employeeID: string;
    wfID: string;
    asmLevel: string;
    asmDepth: number;
    asmColumns: AsmColumns;
    accountCreated: boolean;
    loginName: string | null;
    assignedGroups: string[];
    warnings: string[];
}

/* ─── Calls ──────────────────────────────────────────────────────────────── */

/** Danh mục cho dropdown: kênh, phòng ban, chức danh, cấp quản lý, các cấp ASM. */
export const getHrCatalogs = async (): Promise<ApiResponse<HrCatalogs>> => {
    const res = await api.get('/hr/catalogs');
    return res.data;
};

/** Danh sách nhóm quyền (bosGroup). */
export const getHrGroups = async (params?: {
    siteId?: string;
    keyword?: string;
}): Promise<ApiResponse<GroupListItem[]>> => {
    const res = await api.get('/hr/groups', { params });
    return res.data;
};

/** Giải mã quyền của 1 nhóm: menu nào, hành động nào (chú ý isRestriction), lọc dữ liệu chiều nào. */
export const getHrGroupPermissions = async (grpCode: string): Promise<ApiResponse<GroupPermissions>> => {
    const res = await api.get(`/hr/groups/${encodeURIComponent(grpCode)}/permissions`);
    return res.data;
};

/** Tạo nhân viên đầy đủ: hồ sơ + vị trí cây ASM + tài khoản + nhóm quyền. */
export const createHrEmployee = async (
    body: CreateEmployeeRequest,
): Promise<ApiResponse<CreateEmployeeResult>> => {
    const res = await api.post('/hr/employees', body);
    return res.data;
};

/* ─── Tiện ích cây ASM ───────────────────────────────────────────────────── */

/**
 * Độ sâu của một node trong cây ASM, suy từ LEVEL_VAL mà SP trả về.
 * Dùng để chặn client-side: cấp cần tạo phải THẤP HƠN cấp của sếp.
 */
export const asmDepthOfLevelVal = (levelVal: string): number => {
    const v = (levelVal || '').trim().toUpperCase();
    if (v.startsWith('MNG')) return 0;
    if (v.startsWith('GĐVP') || v.startsWith('GDVP')) return 1;
    if (v.startsWith('ASM')) return 2;
    if (v.startsWith('SUP')) return 3;
    if (v.startsWith('TEAM')) return 4;
    return 5; // TDV/CTV
};
