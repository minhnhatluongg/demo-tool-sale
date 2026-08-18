import api from './apiClient';

/* ─── DTO types từ BE ───────────────────────────────────────────────────── */

export interface AdminListedContract {
    OID?: string;
    oid?: string;
    CusName?: string;
    cusName?: string;
    CusTax?: string;
    cusTax?: string;
    SaleEmID?: string;
    saleEmID?: string;
    SaleFullName?: string;
    saleFullName?: string;
    Crt_Date?: string;
    crt_Date?: string;
    SignNumb?: number;
    signNumb?: number;
    CurrSignNumb?: number;
    currSignNumb?: number;
    Sum_Amnt?: number;
    sum_Amnt?: number;
    SampleID?: string;
    sampleID?: string;
    Descrip?: string;
    descrip?: string;
    // Trường khác — keep open
    [key: string]: any;
}

export interface AdminContractsPage {
    data?: AdminListedContract[];
    total?: number;
    page?: number;
    pageSize?: number;
    [key: string]: any;
}

export interface AdminLogFileItem {
    category?: string;
    fileName?: string;
    sizeBytes?: number;
    sizeKB?: number;
    modified?: string;
    [key: string]: any;
}

/* ─── Listing ───────────────────────────────────────────────────────────── */

// listContract_v26 — endpoint dùng cho cả Sale & Admin, BE quyết view scope theo Grp_List
export const listContractV26 = async (params: {
    frmDate?: string;
    toDate?: string;
    oidSearch?: string;
    page?: number;
    pageSize?: number;
}) => {
    const res = await api.get('/Econtract/listContract_v26', { params });
    return res.data;
};

// list-paged — Admin-only (ViewAll = true)
export const adminListPaged = async (params: {
    fromDate?: string;
    toDate?: string;
    filterSaleEmID?: string; // null | 'me' | userCode
    searchKeyword?: string;
    statusFilter?: number;
    page?: number;
    pageSize?: number;
}) => {
    const res = await api.get('/admin/econtract/list-paged', { params });
    return res.data;
};

export const adminGetSummary = async (oid: string) => {
    const encoded = encodeURIComponent(oid);
    const res = await api.get(`/admin/econtract/summary/${encoded}`);
    return res.data;
};

/* ─── Trình ký (Propose Sign) ────────────────────────────────────────────── */

export const econtractProposeSign = async (oid: string) => {
    const res = await api.post('/Econtract/propose-sign', {
        oid,
        appvMess: 'Trình Ký',
        sampleID: '0783',
    });
    return res.data;
};

/* ─── Bypass (auto trình ký / nâng job) — chỉ Admin ─────────────────────── */

export const adminBypassCapTk = async (oid: string) => {
    const res = await api.post('/admin/econtract/bypass/captk', null, { params: { oid } });
    return res.data;
};

export const adminBypassPhatHanh = async (oid: string) => {
    const res = await api.post('/admin/econtract/bypass/phat-hanh-hoa-don', null, { params: { oid } });
    return res.data;
};

export const adminBypassXuatHoaDon = async (oid: string) => {
    const res = await api.post('/admin/econtract/bypass/xuat-hoa-don-hddt', null, { params: { oid } });
    return res.data;
};

/* ─── Unsign / Rút trình ký (vẫn dùng controller Econtract thường) ──────── */

export const econtractUnsign = async (req: {
    oid: string;
    requestedBy: string;
    fullName: string;
    role: string;
    reason: string;
}) => {
    const res = await api.post('/Econtract/unsign', req);
    return res.data;
};

export const econtractRutTrinhKy = async (req: { OID: string; Reason: string; RequestedBy?: string }) => {
    const res = await api.post('/Econtract/rut-trinh-ky', req);
    return res.data;
};

/* ─── Sales Hierarchy (Cây ASM) ─────────────────────────────────────────── */

export interface SalesHierarchyNode {
    id: string;
    name: string;
    level: string;
    sortID: string;
    isGroup: boolean;
    loginName: string;
    children: SalesHierarchyNode[];
}

export const getSalesHierarchy = async (managerId: string, isManager: boolean = false) => {
    const res = await api.get(`/SalesHierarchy/managers/${encodeURIComponent(managerId)}`, {
        params: { isManager },
    });
    return res.data;
};

export const adminLogListFiles = async (params: { category?: string; date?: string }) => {
    const res = await api.get('/admin/logs/files', { params });
    return res.data;
};

export const adminLogReadFile = async (params: {
    category: string;
    fileName: string;
    page?: number;
    pageSize?: number;
}) => {
    const res = await api.get('/admin/logs/read', { params });
    return res.data;
};

export const adminLogSearch = async (params: {
    category: string;
    fileName: string;
    keyword: string;
    maxLines?: number;
}) => {
    const res = await api.get('/admin/logs/search', { params });
    return res.data;
};

/* ─── TVAN Expiring Soon ────────────────────────────────────────────────── */

export interface TvanRenewalItem {
    oid?: string;
    mst?: string;
    cusName?: string;
    saleCode?: string;
    saleFullName?: string;
    expiryDate?: string;
    daysRemaining?: number;
    rangeKey?: string;
    packageName?: string;
    amount?: number;
    [key: string]: any;
}

export const getTvanExpiringSoon = async (params: {
    daysBeforeExpiry?: number;
    includeExpired?: boolean;
    mst?: string;
    saleCode?: string;
    keyword?: string;
    rangeKey?: string;
    page?: number;
    size?: number;
}) => {
    const res = await api.get('/tvan-renewals/expiring-soon', { params });
    return res.data;
};

/* ─── Cert Expire (Chứng thư số sắp hết hạn) ──────────────────────────── */

export interface CertExpireItem {
    certSubjectName?: string;
    certSerialNumber?: string;
    certNotAfterDate?: string;
    taxnumber?: string;
    merchantName?: string;
    tel1?: string;
    tel2?: string;
    tel3?: string;
    email1?: string | null;
    email2?: string | null;
    email3?: string | null;
    serverKey?: string;
    saleID?: string;
    saleEmail?: string | null;
    saleFullName?: string | null;
    saleDName?: string | null;
    saleLoginName?: string | null;
    [key: string]: any;
}

export const getCertExpire = async (params: {
    page?: number;
    pageSize?: number;
    searchKeyword?: string;
}) => {
    const res = await api.get('/RptUsed/cert-expire', { params });
    return res.data;
};

/* ─── Low-remaining Invoice (Số lượng hóa đơn sắp/đã hết) ──────────────── */

export interface LowRemainingInvItem {
    taxnumber?: string;
    merchantName?: string;
    sampleSign?: string;   // mẫu số
    invcSign?: string;     // ký hiệu
    invcTotal?: number;    // tổng số hóa đơn đã đăng ký
    invcUsed?: number;     // đã dùng
    invcRemain?: number;   // còn lại
    tel1?: string;
    tel2?: string;
    tel3?: string;
    email1?: string | null;
    email2?: string | null;
    email3?: string | null;
    saleFullName?: string | null;
    saleLoginName?: string | null;
    [key: string]: any;
}

export const getLowRemainingInv = async (params: {
    page?: number;
    pageSize?: number;
    searchKeyword?: string;
}) => {
    const res = await api.get('/RptUsed/low-remaining-inv', { params });
    return res.data;
};
