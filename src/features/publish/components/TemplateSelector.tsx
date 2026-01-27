import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { DocumentCheckIcon } from '@heroicons/react/24/outline';

interface TemplateSelectorProps {
    availableTemplates: any[];
    selectedTemplate: string;
    onTemplateChange: (templateId: string) => void;
    loadingTemplates: boolean;
    invoiceConfig: {
        toKhaiDaDuocCoQuanThueDuyet: boolean;
        hdvcnb: boolean;
        chungTuThue: boolean;
        coThuPhi: boolean;
        phaiAnhSoKyKy: boolean;
        guiMailTaiServer: boolean;
        thuNhapCaNhan: boolean;
        mauDaThueSuat: boolean;
        hangGuiDaiLy: boolean;
    };
    onConfigChange: (config: any) => void;
    selectedSpecialInvoice: string;
    onSpecialInvoiceSelect: (type: string) => void;
    isToKhaiLocked: boolean;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    availableTemplates,
    selectedTemplate,
    onTemplateChange,
    loadingTemplates,
    invoiceConfig,
    onConfigChange,
    selectedSpecialInvoice,
    onSpecialInvoiceSelect,
    isToKhaiLocked,
}) => {
    const { isDark } = useTheme();

    const specialInvoiceTypes = [
        { id: 'hoadonvat', label: 'Hóa Đơn VAT', color: 'purple' },
        { id: 'hdvcnb', label: 'Hóa đơn VCNB', color: 'blue' },
    ];

    return (
        <div className="space-y-6">
            {/* Template Selection */}
            <div className={`p-6 rounded-lg border ${isDark
                ? 'bg-slate-800/50 border-indigo-700'
                : 'bg-indigo-50 border-indigo-200'
                }`}>
                <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-800'
                    }`}>
                    <DocumentCheckIcon className="w-5 h-5" />
                    Chọn mẫu hóa đơn
                </h3>

                {loadingTemplates ? (
                    <div className="text-center py-8">
                        <svg className="animate-spin h-8 w-8 mx-auto text-indigo-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Đang tải danh sách mẫu...
                        </p>
                    </div>
                ) : (
                    <select
                        value={selectedTemplate}
                        onChange={(e) => onTemplateChange(e.target.value)}
                        className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
                            ? 'bg-slate-700 border-slate-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                    >
                        <option value="">-- Chọn mẫu hóa đơn --</option>
                        {availableTemplates.map((template) => (
                            <option key={template.templateID} value={template.templateID}>
                                {template.templateCode} - {template.templateName}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* Special Invoice Types */}
            <div className={`p-6 rounded-lg border ${isDark
                ? 'bg-slate-800/50 border-orange-700'
                : 'bg-orange-50 border-orange-200'
                }`}>
                <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-orange-400' : 'text-orange-800'
                    }`}>
                    🎯 Loại hóa đơn đặc biệt (chọn 1)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    {specialInvoiceTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => onSpecialInvoiceSelect(type.id)}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 text-left ${selectedSpecialInvoice === type.id
                                ? isDark
                                    ? `border-${type.color}-500 bg-${type.color}-900/30`
                                    : `border-${type.color}-500 bg-${type.color}-100`
                                : isDark
                                    ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                                    : 'border-gray-300 bg-white hover:border-gray-400'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedSpecialInvoice === type.id
                                    ? `border-${type.color}-500`
                                    : isDark ? 'border-slate-500' : 'border-gray-400'
                                    }`}>
                                    {selectedSpecialInvoice === type.id && (
                                        <div className={`w-2 h-2 rounded-full bg-${type.color}-500`} />
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'
                                    }`}>
                                    {type.label}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoice Configuration */}
            <div className={`p-6 rounded-lg border ${isDark
                ? 'bg-slate-800/50 border-blue-700'
                : 'bg-blue-50 border-blue-200'
                }`}>
                <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-blue-400' : 'text-blue-800'
                    }`}>
                    ⚙️ Cấu hình hóa đơn
                </h3>

                <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-blue-100/50'
                        } ${isToKhaiLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                            type="checkbox"
                            checked={invoiceConfig.toKhaiDaDuocCoQuanThueDuyet}
                            onChange={(e) => !isToKhaiLocked && onConfigChange({
                                ...invoiceConfig,
                                toKhaiDaDuocCoQuanThueDuyet: e.target.checked
                            })}
                            disabled={isToKhaiLocked}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Tờ khai đã được cơ quan thuế duyệt {isToKhaiLocked && '🔒'}
                        </span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-blue-100/50'
                        }`}>
                        <input
                            type="checkbox"
                            checked={invoiceConfig.phaiAnhSoKyKy}
                            onChange={(e) => onConfigChange({
                                ...invoiceConfig,
                                phaiAnhSoKyKy: e.target.checked
                            })}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Phải ấn số ký ký
                        </span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-blue-100/50'
                        }`}>
                        <input
                            type="checkbox"
                            checked={invoiceConfig.guiMailTaiServer}
                            onChange={(e) => onConfigChange({
                                ...invoiceConfig,
                                guiMailTaiServer: e.target.checked
                            })}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            Gửi mail tại server
                        </span>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-lg cursor-not-allowed opacity-50 ${isDark ? 'bg-slate-700/30' : 'bg-gray-100'
                        }`}>
                        <input
                            type="checkbox"
                            checked={invoiceConfig.coThuPhi}
                            disabled
                            className="w-5 h-5 rounded border-gray-300 text-blue-600"
                        />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Có thu phí (luôn bật)
                        </span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default TemplateSelector;
