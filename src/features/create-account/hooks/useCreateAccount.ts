import { useState } from 'react';
import toast from 'react-hot-toast';
import {
    checkServer,
    getCompanyInfoByMst,
    capTaiKhoan,
    CheckServerResponse,
    CreateAccountRequestPayload,
    CreateAccountResponse,
    TaxFullInfoForAccount,
} from '../../../api/capTaiKhoanService';

export interface CreateAccountForm {
    maSoThue: string;
    cmnD_CCCD: string;
    tenCongTy: string;
    diaChi: string;
    soTaiKhoanNH: string;
    tenNganHang: string;
    soDienThoai: string;
    uyQuyen: string;
    email: string;
    website: string;
    allowUpdate: '0' | '1';
}

const emptyForm: CreateAccountForm = {
    maSoThue: '',
    cmnD_CCCD: '',
    tenCongTy: '',
    diaChi: '',
    soTaiKhoanNH: '',
    tenNganHang: '',
    soDienThoai: '',
    uyQuyen: '',
    email: '',
    website: '',
    allowUpdate: '0',
};

export const useCreateAccount = () => {
    const [form, setForm] = useState<CreateAccountForm>(emptyForm);

    const [checking, setChecking] = useState(false);
    const [checked, setChecked] = useState<CheckServerResponse | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<CreateAccountResponse | null>(null);

    const updateField = <K extends keyof CreateAccountForm>(key: K, value: CreateAccountForm[K]) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const resetAll = () => {
        setForm(emptyForm);
        setChecked(null);
        setResult(null);
    };

    /**
     * Bước 1+2:
     *  - Gọi /CapTaiKhoan/check-server → biết MST đã có TK chưa.
     *  - Sau đó dù có/chưa có, vẫn gọi /Tax/get-full-info-by-mst để fill form.
     */
    const checkAndFill = async () => {
        // Quan trọng: GIỮ NGUYÊN dấu '-' khi gửi BE.
        // SP bos_ChkServerSidesMST query bằng MST dạng '0312303803-995' (chi nhánh) để trả ra
        // SideServer/INVnew/ERP đúng. Strip dấu '-' sẽ ra row sai.
        const mstForBE = form.maSoThue.trim();
        const cccd = form.cmnD_CCCD.trim().replace(/\D/g, '');

        if (!mstForBE) {
            toast.error('Vui lòng nhập MST!');
            return;
        }
        // Format hợp lệ: 10 số liền HOẶC 10-3 (vd 0312303803-995).
        const validFormat = /^\d{10}$/.test(mstForBE) || /^\d{10}-\d{3}$/.test(mstForBE);
        if (!validFormat) {
            toast.error(
                `MST phải có 10 chữ số hoặc dạng 10-3 (vd 0312303803-995). Đang nhập: "${mstForBE}".`
            );
            return;
        }
        // CCCD optional, nhưng nếu có phải đúng độ dài
        if (cccd && cccd.length !== 9 && cccd.length !== 12) {
            toast.error(`CCCD/CMND phải có 9 hoặc 12 chữ số (đang ${cccd.length}).`);
            return;
        }

        setChecking(true);
        setChecked(null);
        setResult(null);

        try {
            // 1. check-server — gửi nguyên MST có dấu '-' nếu là chi nhánh
            const check = await checkServer(mstForBE, form.cmnD_CCCD.trim());
            setChecked(check);

            if (!check.spReachable) {
                toast.error('Không kết nối được bosConfigure. Liên hệ kỹ thuật.');
                return;
            }

            if (check.isExistingCustomer) {
                toast.success(
                    `MST ${mstForBE} đã có tài khoản trên server ${check.sideServer}.`,
                    { duration: 4000 }
                );
            } else {
                toast.success('MST chưa có tài khoản — có thể cấp mới.');
            }

            // 2. get-full-info-by-mst để auto-fill (cả 2 case đều cần) — cũng giữ dấu '-'
            let info: TaxFullInfoForAccount | null = null;
            try {
                info = await getCompanyInfoByMst(mstForBE);
            } catch {
                /* swallow — không có info vẫn cho nhập tay */
            }

            if (info) {
                setForm(prev => ({
                    ...prev,
                    maSoThue: mstForBE,
                    cmnD_CCCD: info?.cusCMND_ID || prev.cmnD_CCCD,
                    tenCongTy: info?.sName || prev.tenCongTy,
                    diaChi: info?.address || prev.diaChi,
                    soDienThoai: info?.cusTel || prev.soDienThoai,
                    email: info?.cusEmail || prev.email,
                    website: info?.cusWebsite || prev.website,
                    soTaiKhoanNH: info?.cusBankNumber || prev.soTaiKhoanNH,
                    tenNganHang: info?.cusBankAddress || prev.tenNganHang,
                    uyQuyen: info?.cusPeople_Sign || prev.uyQuyen,
                }));
                toast.success('✅ Đã tự động fill thông tin từ database.');
            } else {
                toast('Không tìm thấy info công ty — nhập tay.', { icon: 'ℹ️' });
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || 'Lỗi khi kiểm tra MST');
        } finally {
            setChecking(false);
        }
    };

    /** Bước 3: submit */
    const submitCreateAccount = async () => {
        const errors = validate(form, checked);
        if (errors.length) {
            errors.forEach(err => toast.error(err));
            return;
        }

        setSubmitting(true);
        setResult(null);

        try {
            const payload: CreateAccountRequestPayload = {
                // Giữ nguyên format MST (có thể là '0312303803-995' với chi nhánh).
                // BE SP query dựa trên format này; không strip dấu '-'.
                maSoThue: form.maSoThue.trim(),
                cmnD_CCCD: form.cmnD_CCCD.trim() || undefined,
                tenCongTy: form.tenCongTy.trim(),
                diaChi: form.diaChi.trim() || undefined,
                soTaiKhoanNH: form.soTaiKhoanNH.trim() || undefined,
                tenNganHang: form.tenNganHang.trim() || undefined,
                soDienThoai: form.soDienThoai.trim() || undefined,
                uyQuyen: form.uyQuyen.trim() || undefined,
                email: form.email.trim() || undefined,
                website: form.website.trim() || undefined,
                allowUpdate: form.allowUpdate,
            };

            const res = await capTaiKhoan(payload);
            setResult(res);

            if (res.isSuccess) {
                toast.success(res.message || 'Cấp tài khoản thành công!', { duration: 4000 });
            } else {
                toast.error(res.message || 'Cấp tài khoản thất bại.', { duration: 5000 });
            }
        } catch (e: any) {
            const errMsg = e.response?.data?.message
                || e.response?.data?.errorDetail
                || e.message
                || 'Lỗi khi cấp tài khoản';
            toast.error(errMsg);
            setResult({
                isSuccess: false,
                message: errMsg,
                errorDetail: e.response?.data?.errorDetail
            });
        } finally {
            setSubmitting(false);
        }
    };

    return {
        form,
        setForm,
        updateField,
        resetAll,

        checking,
        checked,
        checkAndFill,

        submitting,
        result,
        submitCreateAccount,
    };
};

/* ──────────────────────────────────────────────────────────────────────── */
function validate(form: CreateAccountForm, checked: CheckServerResponse | null): string[] {
    const errs: string[] = [];
    const mst = form.maSoThue.trim();
    if (!mst) errs.push('MST không được để trống.');
    else if (!/^\d{10}$/.test(mst) && !/^\d{10}-\d{3}$/.test(mst))
        errs.push('MST phải 10 chữ số hoặc dạng 10-3 (vd 0312303803-995).');

    if (!form.tenCongTy.trim()) errs.push('Tên công ty không được để trống.');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        errs.push('Email không hợp lệ.');

    // Nếu MST đã có TK mà AllowUpdate = "0" → cảnh báo
    if (checked?.isExistingCustomer && form.allowUpdate === '0') {
        errs.push(
            'MST đã có tài khoản. Nếu muốn cập nhật, hãy bật "Cho phép cập nhật" (AllowUpdate = 1).'
        );
    }
    return errs;
}
