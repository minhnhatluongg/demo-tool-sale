import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

interface CompanyInfoFormProps {
    form: {
        mst: string;
        cusName: string;
        cusAddress: string;
        cusEmail: string;
        cusTel: string;
        cusBankNo: string;
        cusBankTitle: string;
        cusWebsite: string;
        cusFax: string;
        cusCMND_ID: string;
        cusContactName: string;
        cusPosition: string;
        invcSample: string;
        invcSign: string;
        description: string;
    };
    onChange: (field: string, value: string) => void;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ form, onChange }) => {
    const { isDark } = useTheme();

    const inputClass = `w-full border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`;

    const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
        }`;

    return (
        <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-blue-50'
                }`}>
                <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-800'
                    }`}>
                    🏢 Thông tin công ty
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>
                            MST/CCCD <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.mst}
                            readOnly
                            className={`${inputClass} ${isDark ? 'bg-slate-800' : 'bg-gray-100'} cursor-not-allowed`}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>CMND/ID</label>
                        <input
                            type="text"
                            value={form.cusCMND_ID}
                            onChange={(e) => onChange('cusCMND_ID', e.target.value)}
                            placeholder="Nhập CMND/ID"
                            className={inputClass}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>
                            Tên công ty <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.cusName}
                            onChange={(e) => onChange('cusName', e.target.value)}
                            placeholder="Nhập tên công ty"
                            className={inputClass}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>
                            Địa chỉ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.cusAddress}
                            onChange={(e) => onChange('cusAddress', e.target.value)}
                            placeholder="Nhập địa chỉ"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Đại diện</label>
                        <input
                            type="text"
                            value={form.cusContactName}
                            onChange={(e) => onChange('cusContactName', e.target.value)}
                            placeholder="Tên người đại diện"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Chức vụ</label>
                        <input
                            type="text"
                            value={form.cusPosition}
                            onChange={(e) => onChange('cusPosition', e.target.value)}
                            placeholder="Giám Đốc"
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Thông tin liên hệ */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-green-50'
                }`}>
                <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-800'
                    }`}>
                    📞 Thông tin liên hệ
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={form.cusEmail}
                            onChange={(e) => onChange('cusEmail', e.target.value)}
                            placeholder="email@example.com"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Số điện thoại <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="tel"
                            value={form.cusTel}
                            onChange={(e) => onChange('cusTel', e.target.value)}
                            placeholder="0123456789"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Website</label>
                        <input
                            type="url"
                            value={form.cusWebsite}
                            onChange={(e) => onChange('cusWebsite', e.target.value)}
                            placeholder="https://example.com"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Fax</label>
                        <input
                            type="text"
                            value={form.cusFax}
                            onChange={(e) => onChange('cusFax', e.target.value)}
                            placeholder="Số fax"
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Thông tin ngân hàng */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-purple-50'
                }`}>
                <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-800'
                    }`}>
                    🏦 Thông tin ngân hàng
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Số tài khoản</label>
                        <input
                            type="text"
                            value={form.cusBankNo}
                            onChange={(e) => onChange('cusBankNo', e.target.value)}
                            placeholder="Nhập số tài khoản"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>Tên ngân hàng</label>
                        <input
                            type="text"
                            value={form.cusBankTitle}
                            onChange={(e) => onChange('cusBankTitle', e.target.value)}
                            placeholder="Tên ngân hàng"
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            {/* Thông tin hóa đơn */}
            <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-orange-50'
                }`}>
                <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-800'
                    }`}>
                    📋 Thông tin hóa đơn
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>
                            Mẫu số <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.invcSample}
                            onChange={(e) => onChange('invcSample', e.target.value)}
                            placeholder="VD: 1"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label className={labelClass}>
                            Ký hiệu <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.invcSign}
                            onChange={(e) => onChange('invcSign', e.target.value)}
                            placeholder="VD: C26TAB"
                            className={inputClass}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Ghi chú</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => onChange('description', e.target.value)}
                            placeholder="Nhập ghi chú (nếu có)"
                            rows={3}
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyInfoForm;
