import React, { useMemo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCreateAccount } from './hooks/useCreateAccount';
import {
    BuildingOffice2Icon,
    IdentificationIcon,
    MagnifyingGlassIcon,
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
    isDark: boolean;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
    maxLength?: number;
    error?: string;
    autoFocus?: boolean;
}

const Field: React.FC<FieldProps> = React.memo(
    ({ label, icon: Icon, value, onChange, placeholder, type = 'text', required, isDark, inputMode, maxLength, error, autoFocus }) => {
        const inputCls = `w-full px-4 py-2.5 rounded-lg border transition-all focus:outline-none focus:ring-2 ${
            isDark
                ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
        } ${error ? '!border-rose-500 focus:!ring-rose-500' : ''}`;

        const labelCls = `block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-200' : 'text-gray-700'}`;

        return (
            <div>
                <label className={labelCls}>
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                    {Icon && (
                        <Icon
                            className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                                isDark ? 'text-gray-400' : 'text-gray-400'
                            }`}
                        />
                    )}
                    <input
                        type={type}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className={`${inputCls} ${Icon ? 'pl-10' : ''}`}
                        inputMode={inputMode}
                        maxLength={maxLength}
                        autoFocus={autoFocus}
                    />
                </div>
                {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
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

/* ──────────────────────────────────────────────────────────────────────── */

const CreateAccount: React.FC = () => {
    const { isDark } = useTheme();
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

    const canCheck =
        !checking
        && isValidMstDisplay(form.maSoThue)
        && isValidCccdLength(form.cmnD_CCCD);

    /* ─── Status badge sau check ──────────────────────────────────────── */
    const renderCheckBadge = () => {
        if (!checked) return null;
        if (!checked.spReachable) {
            return (
                <div
                    className={`flex items-start gap-3 rounded-xl p-4 border-l-4 ${
                        isDark
                            ? 'bg-red-900/30 border-red-500 text-red-200'
                            : 'bg-red-50 border-red-500 text-red-800'
                    }`}
                >
                    <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Không kết nối được bosConfigure</p>
                        <p className="text-sm mt-1">Liên hệ kỹ thuật để kiểm tra.</p>
                    </div>
                </div>
            );
        }
        if (checked.isExistingCustomer) {
            return (
                <div
                    className={`flex items-start gap-3 rounded-xl p-4 border-l-4 ${
                        isDark
                            ? 'bg-amber-900/30 border-amber-500 text-amber-100'
                            : 'bg-amber-50 border-amber-500 text-amber-800'
                    }`}
                >
                    <InformationCircleIcon className="w-5 h-5 mt-0.5 shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold">MST đã có tài khoản</p>
                        <p>
                            Server hiện tại: <strong>{checked.sideServer}</strong>. Nếu muốn cập nhật
                            thông tin, bật <em>"Cho phép cập nhật"</em> dưới đây.
                        </p>
                    </div>
                </div>
            );
        }
        return (
            <div
                className={`flex items-start gap-3 rounded-xl p-4 border-l-4 ${
                    isDark
                        ? 'bg-emerald-900/30 border-emerald-500 text-emerald-100'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-800'
                }`}
            >
                <CheckCircleIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="text-sm">
                    <p className="font-semibold">MST chưa có tài khoản — có thể cấp mới</p>
                    <p>
                        Server cấp TK: <strong>{checked.iNVnew || checked.INVnew}</strong>
                    </p>
                </div>
            </div>
        );
    };

    /* ─── Result panel ─────────────────────────────────────────────────── */
    const renderResult = () => {
        if (!result) return null;
        const ok = result.isSuccess;
        return (
            <div
                className={`rounded-xl p-5 border-l-4 ${
                    ok
                        ? isDark
                            ? 'bg-emerald-900/30 border-emerald-500'
                            : 'bg-emerald-50 border-emerald-500'
                        : isDark
                        ? 'bg-red-900/30 border-red-500'
                        : 'bg-red-50 border-red-500'
                }`}
            >
                <p className={`font-semibold ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    {ok ? '✅ Cấp tài khoản thành công' : '❌ Cấp tài khoản thất bại'}
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {result.message}
                </p>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <Step label="Check"     ok={!!result.checkOK} isDark={isDark} />
                    <Step label="Database"  ok={!!result.databaseOK} isDark={isDark} />
                    <Step label="WebApp"    ok={!!result.webAppOK} isDark={isDark} />
                    <Step label="WinApp"    ok={!!result.windowsAppOK} isDark={isDark} />
                </div>
                {result.errorDetail && (
                    <pre
                        className={`mt-3 text-xs whitespace-pre-wrap rounded p-2 ${
                            isDark ? 'bg-slate-900 text-red-200' : 'bg-white text-red-700'
                        }`}
                    >
                        {result.errorDetail}
                    </pre>
                )}
            </div>
        );
    };

    /* ─── Render ──────────────────────────────────────────────────────── */
    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 shadow">
                    <BuildingOffice2Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        Cấp tài khoản WinInvoice
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Nhập MST → hệ thống tự kiểm tra và fill thông tin từ database.
                    </p>
                </div>
            </div>

            {/* Step 1: MST */}
            <div
                className={`rounded-2xl shadow-md p-6 mb-6 ${
                    isDark ? 'bg-slate-800' : 'bg-white'
                }`}
            >
                <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                    Bước 1 — Kiểm tra MST
                </p>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_240px_auto] gap-3 items-start">
                    <Field
                        isDark={isDark}
                        label="Mã số thuế"
                        icon={IdentificationIcon}
                        value={form.maSoThue}
                        onChange={(v) => updateField('maSoThue', formatMstInput(v))}
                        placeholder="VD: 0312303803 hoặc 0312303803-995"
                        required
                        inputMode="numeric"
                        maxLength={14}
                        error={mstError}
                    />
                    <Field
                        isDark={isDark}
                        label="CMND/CCCD (nếu có)"
                        icon={IdentificationIcon}
                        value={form.cmnD_CCCD}
                        onChange={(v) => updateField('cmnD_CCCD', onlyDigits(v))}
                        placeholder="9 hoặc 12 chữ số"
                        inputMode="numeric"
                        maxLength={12}
                        error={cccdError}
                    />
                    <div className="pt-7">
                        <button
                            onClick={checkAndFill}
                            disabled={!canCheck}
                            className="h-[42px] px-5 rounded-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow"
                            title={
                                !isValidMstDisplay(form.maSoThue)
                                    ? 'MST phải đủ 10 chữ số hoặc 10-3 (chi nhánh)'
                                    : !isValidCccdLength(form.cmnD_CCCD)
                                    ? 'CCCD/CMND phải đủ 9 hoặc 12 chữ số'
                                    : 'Kiểm tra trạng thái MST trên bosConfigure'
                            }
                        >
                            {checking ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                    Đang kiểm tra...
                                </>
                            ) : (
                                <>
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                    Kiểm tra & Fill
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {checked && <div className="mt-4">{renderCheckBadge()}</div>}
            </div>

            {/* Step 2: Form fill */}
            <div
                className={`rounded-2xl shadow-md p-6 mb-6 ${
                    isDark ? 'bg-slate-800' : 'bg-white'
                }`}
            >
                <p
                    className={`text-sm font-semibold mb-4 ${
                        isDark ? 'text-indigo-300' : 'text-indigo-600'
                    }`}
                >
                    Bước 2 — Thông tin công ty (đã auto-fill từ database, có thể chỉnh)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <Field
                            isDark={isDark}
                            label="Tên công ty"
                            icon={BuildingOffice2Icon}
                            value={form.tenCongTy}
                            onChange={(v) => updateField('tenCongTy', v)}
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Field
                            isDark={isDark}
                            label="Địa chỉ"
                            value={form.diaChi}
                            onChange={(v) => updateField('diaChi', v)}
                        />
                    </div>
                    <Field
                        isDark={isDark}
                        label="Email"
                        icon={EnvelopeIcon}
                        value={form.email}
                        onChange={(v) => updateField('email', v)}
                        type="email"
                    />
                    <Field
                        isDark={isDark}
                        label="Số điện thoại"
                        icon={PhoneIcon}
                        value={form.soDienThoai}
                        onChange={(v) => updateField('soDienThoai', onlyDigits(v))}
                        inputMode="tel"
                        maxLength={15}
                    />
                    <Field
                        isDark={isDark}
                        label="Website"
                        icon={GlobeAltIcon}
                        value={form.website}
                        onChange={(v) => updateField('website', v)}
                    />
                    <Field
                        isDark={isDark}
                        label="Người ủy quyền / Fax"
                        icon={UserIcon}
                        value={form.uyQuyen}
                        onChange={(v) => updateField('uyQuyen', v)}
                    />
                    <Field
                        isDark={isDark}
                        label="Số tài khoản NH"
                        icon={BanknotesIcon}
                        value={form.soTaiKhoanNH}
                        onChange={(v) => updateField('soTaiKhoanNH', onlyDigits(v))}
                        inputMode="numeric"
                    />
                    <Field
                        isDark={isDark}
                        label="Tên ngân hàng"
                        value={form.tenNganHang}
                        onChange={(v) => updateField('tenNganHang', v)}
                    />
                </div>

                {/* AllowUpdate */}
                <label
                    className={`flex items-center gap-3 mt-5 px-4 py-3 rounded-lg border cursor-pointer ${
                        isDark
                            ? 'bg-slate-700/40 border-slate-600 text-gray-200'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                >
                    <input
                        type="checkbox"
                        checked={form.allowUpdate === '1'}
                        onChange={(e) => updateField('allowUpdate', e.target.checked ? '1' : '0')}
                        className="w-5 h-5 accent-indigo-600"
                    />
                    <span className="text-sm">
                        <strong>Cho phép cập nhật</strong> nếu MST đã có tài khoản
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                            {' '}
                            (AllowUpdate = 1)
                        </span>
                    </span>
                </label>
            </div>

            {/* Step 3: Submit
             * Ẩn nút "Cấp tài khoản" nếu MST đã có TK và user chưa bật AllowUpdate.
             *  - Trước khi check        → hiện nút (user có thể check trước/sau, tùy luồng)
             *  - Sau khi check, NEW     → hiện nút (cấp mới)
             *  - Sau khi check, EXISTED → ẩn nút, chỉ hiển thị notice; bật AllowUpdate=1 thì nút hiện lại với label "Cập nhật tài khoản"
             */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                {(() => {
                    const isExisted = !!checked?.isExistingCustomer;
                    const allowUpdate = form.allowUpdate === '1';
                    const hideSubmit = isExisted && !allowUpdate;

                    if (hideSubmit) {
                        return (
                            <div
                                className={`flex-1 min-w-[280px] flex items-start gap-3 rounded-xl px-4 py-3 border-l-4 ${
                                    isDark
                                        ? 'bg-amber-900/30 border-amber-500 text-amber-100'
                                        : 'bg-amber-50 border-amber-500 text-amber-800'
                                }`}
                            >
                                <InformationCircleIcon className="w-5 h-5 mt-0.5 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold">MST đã có tài khoản — không cần cấp mới.</p>
                                    <p>
                                        Nếu muốn cập nhật lại thông tin, hãy bật{' '}
                                        <em>"Cho phép cập nhật"</em> bên trên rồi bấm "Cập nhật tài khoản".
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    const label = isExisted && allowUpdate ? 'Cập nhật tài khoản' : 'Cấp tài khoản';
                    return (
                        <button
                            onClick={submitCreateAccount}
                            disabled={submitting || !isValidMstDisplay(form.maSoThue) || !form.tenCongTy}
                            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow"
                        >
                            {submitting ? (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                    Đang {isExisted && allowUpdate ? 'cập nhật' : 'cấp'}...
                                </>
                            ) : (
                                <>
                                    <PaperAirplaneIcon className="w-5 h-5" />
                                    {label}
                                </>
                            )}
                        </button>
                    );
                })()}
                <button
                    onClick={resetAll}
                    className={`px-4 py-2.5 rounded-lg font-medium transition ${
                        isDark
                            ? 'bg-slate-700 text-gray-200 hover:bg-slate-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Làm mới form
                </button>
            </div>

            {renderResult()}
        </div>
    );
};

const Step = ({
    label,
    ok,
    isDark,
}: {
    label: string;
    ok: boolean;
    isDark: boolean;
}) => (
    <div
        className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded ${
            ok
                ? isDark
                    ? 'bg-emerald-900/50 text-emerald-300'
                    : 'bg-emerald-100 text-emerald-700'
                : isDark
                ? 'bg-slate-700 text-gray-400'
                : 'bg-gray-100 text-gray-500'
        }`}
    >
        <span className="font-semibold">{ok ? '✓' : '○'}</span>
        <span>{label}</span>
    </div>
);

export default CreateAccount;
