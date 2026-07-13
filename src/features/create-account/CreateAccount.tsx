import React, { useMemo } from 'react';
import { useCreateAccount } from './hooks/useCreateAccount';
import {
    BuildingOffice2Icon,
    IdentificationIcon,
    PaperAirplaneIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    EnvelopeIcon,
    PhoneIcon,
    GlobeAltIcon,
    BanknotesIcon,
    UserIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

/* ──────────────────────────────────────────────────────────────────────── *
 *  Field component PHẢI ở ngoài CreateAccount.
 *  Nếu khai trong body, mỗi keystroke React tái tạo function tham chiếu mới
 *  → unmount/remount <input> → mất focus sau mỗi ký tự.
 * ──────────────────────────────────────────────────────────────────────── */
interface FieldProps {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    maxLength?: number;
    error?: string;
    autoFocus?: boolean;
}

const Field: React.FC<FieldProps> = React.memo(
    ({ label, icon: Icon, value, onChange, placeholder, type = 'text', required, inputMode, maxLength, error, autoFocus }) => {
        return (
            <div>
                <label className="block text-xs font-medium text-[#2F3437] mb-1.5">
                    {label} {required && <span className="text-[#9F2F2D]">*</span>}
                </label>
                <div className="relative">
                    {Icon && (
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a8a6a1]" />
                    )}
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`w-full px-3 py-2 rounded-md bg-white border text-sm text-[#2F3437] placeholder:text-[#a8a6a1] focus:outline-none transition-colors duration-200 ${
                            Icon ? 'pl-9' : ''
                        } ${
                            error
                                ? 'border-[#d98b88] focus:border-[#9F2F2D]'
                                : 'border-[#EAEAEA] focus:border-[#111111]'
                        }`}
                        inputMode={inputMode}
                        maxLength={maxLength}
                        autoFocus={autoFocus}
                    />
                </div>
                {error && <p className="mt-1.5 text-xs text-[#9F2F2D]">{error}</p>}
            </div>
        );
    }
);
Field.displayName = 'Field';

/* ──────────────────────────────────────────────────────────────────────── *
 *  Helpers: validate MST/CCCD
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * MST VN hợp lệ (hiển thị):
 *   - 10 chữ số           (DN)            VD: 0312303803
 *   - 10 chữ số + "-" + 3 chữ số (chi nhánh) VD: 0312303803-995
 *
 * BE nhận MST đã bỏ dấu '-' (10 hoặc 13 số).
 */
const MST_RE_FULL = /^\d{10}(-\d{3})?$/;
const isValidMstDisplay = (mst: string) => MST_RE_FULL.test(mst);
/** strip → chỉ digit, dùng để gửi xuống BE và lưu store */
const stripDash = (s: string) => s.replace(/-/g, '');

/**
 * Chuẩn hoá user input cho ô MST: chỉ giữ digit + dấu '-'; tự chèn '-' sau 10 số nếu user gõ tiếp.
 * Ví dụ: '0312303803995' → '0312303803-995'; '0312303803-995' giữ nguyên.
 */
const formatMstInput = (raw: string): string => {
    // Chỉ giữ digit, tối đa 13 số
    const digits = raw.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 10) return digits;
    return `${digits.slice(0, 10)}-${digits.slice(10)}`;
};

/** CCCD/CMND: 9 số (CMND cũ) hoặc 12 số (CCCD mới) */
const CCCD_LENGTHS = [9, 12];
const isValidCccdLength = (cccd: string) => cccd === '' || CCCD_LENGTHS.includes(cccd.length);

/** Chỉ giữ chữ số */
const onlyDigits = (s: string) => s.replace(/\D/g, '');

/* ─── Notice (info / success / warning / error) — pastel, hairline ─────── */

type NoticeTone = 'success' | 'warning' | 'error';

const noticeTone: Record<NoticeTone, { bg: string; fg: string; Icon: React.ComponentType<{ className?: string }> }> = {
    success: { bg: 'bg-[#EDF3EC]', fg: 'text-[#346538]', Icon: CheckCircleIcon },
    warning: { bg: 'bg-[#FBF3DB]', fg: 'text-[#956400]', Icon: InformationCircleIcon },
    error:   { bg: 'bg-[#FDEBEC]', fg: 'text-[#9F2F2D]', Icon: ExclamationTriangleIcon },
};

const Notice: React.FC<{ tone: NoticeTone; title: string; children?: React.ReactNode }> = ({ tone, title, children }) => {
    const t = noticeTone[tone];
    return (
        <div className={`flex items-start gap-3 rounded-md p-4 ${t.bg}`}>
            <t.Icon className={`w-5 h-5 mt-0.5 shrink-0 ${t.fg}`} />
            <div className="text-sm min-w-0">
                <p className={`font-medium ${t.fg}`}>{title}</p>
                {children && <div className="text-[#5f5e5b] mt-0.5">{children}</div>}
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────────────── */

const CreateAccount: React.FC = () => {
    const {
        form,
        updateField,
        resetAll,
        checking,
        checked,
        checkAndFill,
        submitting,
        result,
        submitCreateAccount,
    } = useCreateAccount();

    /* Lỗi MST/CCCD tính realtime */
    const mstError = useMemo(() => {
        if (form.maSoThue.length === 0) return undefined;
        if (!isValidMstDisplay(form.maSoThue)) {
            const digits = stripDash(form.maSoThue).length;
            return `MST phải có 10 hoặc 13 chữ số (đang ${digits} số). Định dạng chi nhánh: 0312303803-995.`;
        }
        return undefined;
    }, [form.maSoThue]);

    const cccdError = useMemo(() => {
        if (!form.cmnD_CCCD) return undefined;
        if (!isValidCccdLength(form.cmnD_CCCD))
            return `CCCD/CMND phải có 9 hoặc 12 chữ số (đang ${form.cmnD_CCCD.length} số).`;
        return undefined;
    }, [form.cmnD_CCCD]);

    // Cho phép kiểm tra khi có MST hợp lệ HOẶC CCCD/CMND đủ độ dài (9/12 số).
    const canCheck =
        !checking
        && (isValidMstDisplay(form.maSoThue) || CCCD_LENGTHS.includes(form.cmnD_CCCD.length))
        && isValidCccdLength(form.cmnD_CCCD);

    /* ─── Status badge sau check ──────────────────────────────────────── */
    const renderCheckBadge = () => {
        if (!checked) return null;
        if (!checked.spReachable) {
            return (
                <Notice tone="error" title="Không kết nối được bosConfigure">
                    <p>Liên hệ kỹ thuật để kiểm tra.</p>
                </Notice>
            );
        }
        if (checked.isExistingCustomer) {
            return (
                <Notice tone="warning" title="MST đã có tài khoản">
                    <p>
                        Server hiện tại: <strong className="text-[#2F3437]">{checked.sideServer}</strong>.
                        Nếu muốn cập nhật thông tin, bật «Cho phép cập nhật» dưới đây.
                    </p>
                </Notice>
            );
        }
        return (
            <Notice tone="success" title="MST chưa có tài khoản — có thể cấp mới">
                <p>
                    Server cấp TK: <strong className="text-[#2F3437]">{checked.iNVnew || checked.INVnew}</strong>
                </p>
            </Notice>
        );
    };

    /* ─── Result panel ─────────────────────────────────────────────────── */
    const renderResult = () => {
        if (!result) return null;
        const ok = result.isSuccess;
        return (
            <div className={`rounded-md p-5 ${ok ? 'bg-[#EDF3EC]' : 'bg-[#FDEBEC]'}`}>
                <p className={`font-medium flex items-center gap-2 ${ok ? 'text-[#346538]' : 'text-[#9F2F2D]'}`}>
                    {ok ? <CheckCircleIcon className="w-5 h-5" /> : <ExclamationTriangleIcon className="w-5 h-5" />}
                    {ok ? 'Cấp tài khoản thành công' : 'Cấp tài khoản thất bại'}
                </p>
                <p className="text-sm mt-1.5 text-[#5f5e5b]">
                    {result.message}
                </p>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <Step label="Check"     ok={!!result.checkOK} />
                    <Step label="Database"  ok={!!result.databaseOK} />
                    <Step label="WebApp"    ok={!!result.webAppOK} />
                    <Step label="WinApp"    ok={!!result.windowsAppOK} />
                </div>
                {result.errorDetail && (
                    <pre className="mt-3 text-xs whitespace-pre-wrap rounded-md p-3 bg-white border border-[#EAEAEA] text-[#9F2F2D] font-mono overflow-x-auto">
                        {result.errorDetail}
                    </pre>
                )}
            </div>
        );
    };

    /* ─── Render ──────────────────────────────────────────────────────── */
    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="pb-6 mb-6 border-b border-[#EAEAEA]">
                <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight text-[#111111]">
                    Cấp tài khoản WinInvoice
                </h1>
                <p className="text-sm text-[#787774] mt-1 max-w-[65ch]">
                    Nhập MST, hệ thống tự kiểm tra và điền thông tin từ database.
                </p>
            </div>

            {/* Step 1: MST */}
            <div className="rounded-lg bg-white border border-[#EAEAEA] p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-semibold flex items-center justify-center">1</span>
                    <p className="text-sm font-medium text-[#111111]">Kiểm tra MST</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-3 items-start">
                    <Field
                        label="Mã số thuế (hoặc CCCD)"
                        icon={IdentificationIcon}
                        value={form.maSoThue}
                        onChange={(v) => updateField('maSoThue', formatMstInput(v))}
                        placeholder="0312303803 hoặc 0312303803-995"
                        inputMode="numeric"
                        maxLength={14}
                        error={mstError}
                    />
                    <Field
                        label="CMND/CCCD"
                        icon={IdentificationIcon}
                        value={form.cmnD_CCCD}
                        onChange={(v) => updateField('cmnD_CCCD', onlyDigits(v))}
                        placeholder="9 hoặc 12 chữ số"
                        inputMode="numeric"
                        maxLength={12}
                        error={cccdError}
                    />
                    <div className="pt-[26px]">
                        <button
                            onClick={checkAndFill}
                            disabled={!canCheck}
                            className="h-[38px] px-4 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 whitespace-nowrap"
                            title={
                                !canCheck
                                    ? 'Nhập MST (10 số hoặc 10-3) HOẶC CCCD/CMND (9 hoặc 12 số) để kiểm tra'
                                    : 'Kiểm tra trạng thái trên bosConfigure'
                            }
                        >
                            {checking ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    Đang kiểm tra
                                </>
                            ) : (
                                <>
                                    <MagnifyingGlassIcon className="w-4 h-4" />
                                    Kiểm tra và điền
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {checked && <div className="mt-4">{renderCheckBadge()}</div>}
            </div>

            {/* Step 2: Form fill */}
            <div className="rounded-lg bg-white border border-[#EAEAEA] p-6 mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-semibold flex items-center justify-center">2</span>
                    <p className="text-sm font-medium text-[#111111]">Thông tin công ty</p>
                    <span className="text-xs text-[#787774]">đã tự điền từ database, có thể chỉnh</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Field
                            label="Tên công ty"
                            icon={BuildingOffice2Icon}
                            value={form.tenCongTy}
                            onChange={(v) => updateField('tenCongTy', v)}
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Field
                            label="Địa chỉ"
                            value={form.diaChi}
                            onChange={(v) => updateField('diaChi', v)}
                        />
                    </div>
                    <Field
                        label="Email"
                        icon={EnvelopeIcon}
                        value={form.email}
                        onChange={(v) => updateField('email', v)}
                        type="email"
                    />
                    <Field
                        label="Số điện thoại"
                        icon={PhoneIcon}
                        value={form.soDienThoai}
                        onChange={(v) => updateField('soDienThoai', onlyDigits(v))}
                        inputMode="tel"
                        maxLength={15}
                    />
                    <Field
                        label="Website"
                        icon={GlobeAltIcon}
                        value={form.website}
                        onChange={(v) => updateField('website', v)}
                    />
                    <Field
                        label="Người ủy quyền / Fax"
                        icon={UserIcon}
                        value={form.uyQuyen}
                        onChange={(v) => updateField('uyQuyen', v)}
                    />
                    <Field
                        label="Số tài khoản NH"
                        icon={BanknotesIcon}
                        value={form.soTaiKhoanNH}
                        onChange={(v) => updateField('soTaiKhoanNH', onlyDigits(v))}
                        inputMode="numeric"
                    />
                    <Field
                        label="Tên ngân hàng"
                        value={form.tenNganHang}
                        onChange={(v) => updateField('tenNganHang', v)}
                    />
                </div>

                {/* AllowUpdate */}
                <label className="flex items-center gap-3 mt-5 px-4 py-3 rounded-md bg-[#F7F6F3] border border-[#EAEAEA] cursor-pointer hover:bg-[#F1F0EC] transition-colors duration-150">
                    <input
                        type="checkbox"
                        checked={form.allowUpdate === '1'}
                        onChange={(e) => updateField('allowUpdate', e.target.checked ? '1' : '0')}
                        className="w-4 h-4 accent-[#111111]"
                    />
                    <span className="text-sm text-[#2F3437]">
                        <span className="font-medium">Cho phép cập nhật</span> nếu MST đã có tài khoản
                        <span className="text-[#787774]"> (AllowUpdate = 1)</span>
                    </span>
                </label>
            </div>

            {/* Step 3: Submit
             * Ẩn nút "Cấp tài khoản" nếu MST đã có TK và user chưa bật AllowUpdate.
             *  - Trước khi check        → hiện nút (user có thể check trước/sau, tùy luồng)
             *  - Sau khi check, NEW     → hiện nút (cấp mới)
             *  - Sau khi check, EXISTED → ẩn nút, chỉ hiển thị notice; bật AllowUpdate=1 thì nút hiện lại với label "Cập nhật tài khoản"
             */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                {(() => {
                    const isExisted = !!checked?.isExistingCustomer;
                    const allowUpdate = form.allowUpdate === '1';
                    const hideSubmit = isExisted && !allowUpdate;

                    if (hideSubmit) {
                        return (
                            <div className="flex-1 min-w-[280px]">
                                <Notice tone="warning" title="MST đã có tài khoản — không cần cấp mới.">
                                    <p>
                                        Nếu muốn cập nhật lại thông tin, hãy bật «Cho phép cập nhật» bên trên
                                        rồi bấm «Cập nhật tài khoản».
                                    </p>
                                </Notice>
                            </div>
                        );
                    }

                    const label = isExisted && allowUpdate ? 'Cập nhật tài khoản' : 'Cấp tài khoản';
                    return (
                        <button
                            onClick={submitCreateAccount}
                            disabled={
                                submitting
                                || (!isValidMstDisplay(form.maSoThue) && !CCCD_LENGTHS.includes(form.cmnD_CCCD.length))
                                || !form.tenCongTy
                            }
                            className="px-5 py-2.5 rounded-md text-sm font-medium bg-[#111111] text-white hover:bg-[#333333] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
                        >
                            {submitting ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    Đang {isExisted && allowUpdate ? 'cập nhật' : 'cấp'}
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                    {label}
                                </>
                            )}
                        </button>
                    );
                })()}
                <button
                    onClick={resetAll}
                    className="px-4 py-2.5 rounded-md text-sm text-[#5f5e5b] bg-white border border-[#EAEAEA] hover:bg-[#F7F6F3] hover:text-[#111111] active:scale-[0.98] transition-all duration-200"
                >
                    Làm mới form
                </button>
            </div>

            {renderResult()}
        </div>
    );
};

const Step = ({ label, ok }: { label: string; ok: boolean }) => (
    <div
        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md ${
            ok ? 'bg-white text-[#346538] border border-[#cfdecd]' : 'bg-white/60 text-[#a8a6a1] border border-[#EAEAEA]'
        }`}
    >
        {ok
            ? <CheckCircleIcon className="w-3.5 h-3.5" />
            : <span className="w-3.5 h-3.5 rounded-full border border-[#d4d2cc] inline-block" />}
        <span className="font-medium">{label}</span>
    </div>
);

export default CreateAccount;
