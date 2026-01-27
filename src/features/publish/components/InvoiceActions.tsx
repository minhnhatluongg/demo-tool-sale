import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { Dialog } from '@headlessui/react';
import {
    EyeIcon,
    CheckCircleIcon,
    ArrowDownTrayIcon,
    RocketLaunchIcon,
    Cog6ToothIcon,
    XMarkIcon,
    ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

interface InvoiceActionsProps {
    onViewInvoice: () => void;
    onConfirmTemplate: () => void;
    onDownloadXSLT: () => void;
    onDownloadXML: () => void;
    onPublish: () => void;
    loading: boolean;
    isTemplateConfirmed: boolean;
    hasConfiguredXslt: boolean;
    hasXmlData: boolean;
    onLogoUpload?: (file: File) => void;
    onBackgroundUpload?: (file: File) => void;
    onXmlUpload?: (file: File) => void;
    onXsltUpload?: (file: File) => void;
    adjustConfig?: any;
    onAdjustConfigChange?: (config: any) => void;
    logoFileName?: string;
    backgroundFileName?: string;
    onRemoveLogo?: () => void;
    onRemoveBackground?: () => void;
    customerType?: 'new' | 'existing';
    onCustomerTypeChange?: (type: 'new' | 'existing') => void;
}

const InvoiceActions: React.FC<InvoiceActionsProps> = ({
    onViewInvoice,
    onConfirmTemplate,
    onDownloadXSLT,
    onDownloadXML,
    onPublish,
    loading,
    isTemplateConfirmed,
    hasConfiguredXslt,
    hasXmlData,
    onLogoUpload,
    onBackgroundUpload,
    onXmlUpload,
    onXsltUpload,
    adjustConfig,
    onAdjustConfigChange,
    logoFileName,
    backgroundFileName,
    onRemoveLogo,
    onRemoveBackground,
    customerType = 'new',
    onCustomerTypeChange,
}) => {
    const { isDark } = useTheme();
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isBorderLibraryOpen, setIsBorderLibraryOpen] = useState(false);
    const [xmlFileName, setXmlFileName] = useState('');
    const [xsltFileName, setXsltFileName] = useState('');

    // Available border images from CDN
    const availableBorders = [
        'vien1.png', 'vien2.png', 'vien3.png', 'vien4.png', 'vien5.png',
        'vien6.png', 'vien7.png', 'vien8.png', 'vien9.png', 'vien10.png',
        'vien11.png', 'vien12.png', 'vien13.png', 'vien14.png', 'vien15.png',
    ];

    const getButtonClass = (color: string, disabled: boolean = false) => {
        if (disabled) {
            return 'flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gray-400 cursor-not-allowed text-white';
        }

        const colorClasses = {
            cyan: 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800',
            blue: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
            indigo: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
            purple: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
            orange: 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800',
            green: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
        };

        return `flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]} text-white shadow-lg hover:shadow-xl transform hover:scale-105`;
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background' | 'xml' | 'xslt') => {
        const file = event.target.files?.[0];
        if (file) {
            switch (type) {
                case 'logo':
                    onLogoUpload?.(file);
                    break;
                case 'background':
                    onBackgroundUpload?.(file);
                    break;
                case 'xml':
                    onXmlUpload?.(file);
                    setXmlFileName(file.name);
                    break;
                case 'xslt':
                    onXsltUpload?.(file);
                    setXsltFileName(file.name);
                    break;
            }
        }
    };

    const handleAdjustChange = (field: string, value: any) => {
        if (onAdjustConfigChange && adjustConfig) {
            onAdjustConfigChange({
                ...adjustConfig,
                [field]: value,
            });
        }
    };

    const handlePositionChange = (type: 'logoPos' | 'backgroundPos', field: string, value: number) => {
        if (onAdjustConfigChange && adjustConfig) {
            onAdjustConfigChange({
                ...adjustConfig,
                [type]: {
                    ...adjustConfig[type],
                    [field]: value,
                },
            });
        }
    };

    return (
        <>
            <div className={`p-6 rounded-lg border ${isDark
                ? 'bg-slate-800/50 border-green-700'
                : 'bg-green-50 border-green-200'
                }`}>
                <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-green-400' : 'text-green-800'
                    }`}>
                    🎬 Thao tác
                </h3>

                {/* Customer Type Selection */}
                <div className={`mb-6 p-4 rounded-lg border-2 ${isDark
                    ? 'bg-slate-700/50 border-blue-600'
                    : 'bg-blue-50 border-blue-300'
                    }`}>
                    <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                        👤 Loại khách hàng
                    </label>
                    <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="customerType"
                                value="new"
                                checked={customerType === 'new'}
                                onChange={() => onCustomerTypeChange?.('new')}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`text-sm font-medium group-hover:text-blue-600 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-700'
                                }`}>
                                🆕 Khách hàng mới (SampleID = NEW)
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="customerType"
                                value="existing"
                                checked={customerType === 'existing'}
                                onChange={() => onCustomerTypeChange?.('existing')}
                                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className={`text-sm font-medium group-hover:text-blue-600 transition-colors ${isDark ? 'text-gray-200' : 'text-gray-700'
                                }`}>
                                👥 Khách hàng cũ (SampleID = TemplateID)
                            </span>
                        </label>
                    </div>
                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        💡 Chọn "Khách hàng mới" nếu đây là lần đầu phát hành mẫu, hoặc "Khách hàng cũ" nếu đổi mẫu.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Config Template Button */}
                    <button
                        onClick={() => setIsConfigOpen(true)}
                        className={getButtonClass('cyan', false)}
                    >
                        <Cog6ToothIcon className="w-5 h-5" />
                        Cấu hình mẫu
                    </button>

                    {/* View Invoice */}
                    <button
                        onClick={onViewInvoice}
                        disabled={loading}
                        className={getButtonClass('blue', loading)}
                    >
                        <EyeIcon className="w-5 h-5" />
                        Xem trước
                    </button>

                    {/* Confirm Template */}
                    <button
                        onClick={onConfirmTemplate}
                        disabled={loading || isTemplateConfirmed}
                        className={getButtonClass('indigo', loading || isTemplateConfirmed)}
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        {isTemplateConfirmed ? '✓ Đã xác nhận' : 'Xác nhận mẫu'}
                    </button>

                    {/* Download XSLT */}
                    <button
                        onClick={onDownloadXSLT}
                        disabled={!hasConfiguredXslt}
                        className={getButtonClass('purple', !hasConfiguredXslt)}
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Tải XSLT
                    </button>

                    {/* Download XML */}
                    <button
                        onClick={onDownloadXML}
                        disabled={!hasXmlData}
                        className={getButtonClass('orange', !hasXmlData)}
                    >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Tải XML
                    </button>

                    {/* Publish */}
                    <button
                        onClick={onPublish}
                        disabled={loading || !isTemplateConfirmed}
                        className={`md:col-span-1 ${getButtonClass('green', loading || !isTemplateConfirmed)}`}
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <RocketLaunchIcon className="w-5 h-5" />
                                Phát hành mẫu
                            </>
                        )}
                    </button>
                </div>

                {/* Status Messages */}
                {isTemplateConfirmed && (
                    <div className={`mt-4 p-3 rounded-lg border ${isDark
                        ? 'bg-green-900/30 border-green-700'
                        : 'bg-green-100 border-green-300'
                        }`}>
                        <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-700'
                            }`}>
                            <CheckCircleIcon className="w-5 h-5" />
                            Mẫu đã được xác nhận. Bạn có thể tải file XSLT/XML hoặc phát hành ngay.
                        </p>
                    </div>
                )}

                {!isTemplateConfirmed && (
                    <div className={`mt-4 p-3 rounded-lg border ${isDark
                        ? 'bg-yellow-900/30 border-yellow-700'
                        : 'bg-yellow-100 border-yellow-300'
                        }`}>
                        <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-700'
                            }`}>
                            💡 Vui lòng bấm "Xác nhận mẫu" trước khi phát hành.
                        </p>
                    </div>
                )}
            </div>

            {/* Configuration Modal */}
            <Dialog
                open={isConfigOpen}
                onClose={() => setIsConfigOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
                    <Dialog.Panel className={`mx-auto max-w-4xl w-full rounded-xl shadow-2xl my-8 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
                        }`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'
                            }`}>
                            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                                <Cog6ToothIcon className="w-6 h-6 text-cyan-500" />
                                Cấu hình mẫu hóa đơn
                            </Dialog.Title>
                            <button
                                onClick={() => setIsConfigOpen(false)}
                                className={`p-2 rounded-lg transition-colors ${isDark
                                    ? 'hover:bg-slate-700 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Images Section */}
                            <div>
                                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-700'
                                    }`}>
                                    🖼️ Hình ảnh
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Logo Upload */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            Logo công ty
                                        </label>
                                        {logoFileName ? (
                                            <div className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-300'
                                                }`}>
                                                <span className="text-sm truncate flex-1">{logoFileName}</span>
                                                <button
                                                    onClick={onRemoveLogo}
                                                    className="ml-2 p-1 rounded hover:bg-red-500 text-red-500 hover:text-white transition-colors"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDark
                                                ? 'border-slate-600 hover:border-blue-500 bg-slate-700/50 hover:bg-slate-700'
                                                : 'border-gray-300 hover:border-blue-500 bg-gray-50 hover:bg-gray-100'
                                                }`}>
                                                <ArrowUpTrayIcon className="w-5 h-5" />
                                                <span className="text-sm font-medium">Tải lên Logo</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}

                                        {/* Logo Position Controls */}
                                        {adjustConfig && (
                                            <div className="mt-3 space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-500">Width (px)</label>
                                                        <input
                                                            type="number"
                                                            value={adjustConfig.logoPos?.width || 0}
                                                            onChange={(e) => handlePositionChange('logoPos', 'width', Number(e.target.value))}
                                                            className={`w-full px-2 py-1 text-sm rounded border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Height (px)</label>
                                                        <input
                                                            type="number"
                                                            value={adjustConfig.logoPos?.height || 0}
                                                            onChange={(e) => handlePositionChange('logoPos', 'height', Number(e.target.value))}
                                                            className={`w-full px-2 py-1 text-sm rounded border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Top (%)</label>
                                                        <input
                                                            type="number"
                                                            value={adjustConfig.logoPos?.top || 0}
                                                            onChange={(e) => handlePositionChange('logoPos', 'top', Number(e.target.value))}
                                                            className={`w-full px-2 py-1 text-sm rounded border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Left (%)</label>
                                                        <input
                                                            type="number"
                                                            value={adjustConfig.logoPos?.left || 0}
                                                            onChange={(e) => handlePositionChange('logoPos', 'left', Number(e.target.value))}
                                                            className={`w-full px-2 py-1 text-sm rounded border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Background Upload */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            Background
                                        </label>
                                        {backgroundFileName ? (
                                            <div className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-300'
                                                }`}>
                                                <span className="text-sm truncate flex-1">{backgroundFileName}</span>
                                                <button
                                                    onClick={onRemoveBackground}
                                                    className="ml-2 p-1 rounded hover:bg-red-500 text-red-500 hover:text-white transition-colors"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDark
                                                ? 'border-slate-600 hover:border-purple-500 bg-slate-700/50 hover:bg-slate-700'
                                                : 'border-gray-300 hover:border-purple-500 bg-gray-50 hover:bg-gray-100'
                                                }`}>
                                                <ArrowUpTrayIcon className="w-5 h-5" />
                                                <span className="text-sm font-medium">Tải lên Background</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileUpload(e, 'background')}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}

                                        {/* Background Position Controls */}
                                        {adjustConfig && (
                                            <div className="mt-3 space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="text-xs text-gray-500">Width (px)</label>
                                                        <input
                                                            type="number"
                                                            value={adjustConfig.backgroundPos?.width || 0}
                                                            onChange={(e) => handlePositionChange('backgroundPos', 'width', Number(e.target.value))}
                                                            className={`w-full px-2 py-1 text-sm rounded border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                                                                }`}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500">Top (%)</label>
                                                        <input
                                                            type="number"
                                                            value={adjustConfig.backgroundPos?.top || 0}
                                                            onChange={(e) => handlePositionChange('backgroundPos', 'top', Number(e.target.value))}
                                                            className={`w-full px-2 py-1 text-sm rounded border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Visibility Toggles */}
                            {adjustConfig && (
                                <div>
                                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-700'
                                        }`}>
                                        👁️ Ẩn/Hiện thông tin
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { key: 'email', label: 'Email' },
                                            { key: 'fax', label: 'Fax' },
                                            { key: 'soDT', label: 'Số điện thoại' },
                                            { key: 'taiKhoanNganHang', label: 'Tài khoản ngân hàng' },
                                            { key: 'website', label: 'Website' },
                                            { key: 'songNgu', label: 'Song ngữ (EN)' },
                                        ].map((item) => (
                                            <label key={item.key} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-50 hover:bg-gray-100'
                                                }`}>
                                                <input
                                                    type="checkbox"
                                                    checked={adjustConfig[item.key] || false}
                                                    onChange={(e) => handleAdjustChange(item.key, e.target.checked)}
                                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                                />
                                                <span className="text-sm">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Border Configuration */}
                            {adjustConfig && (
                                <div>
                                    <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-700'
                                        }`}>
                                        🖼️ Cấu hình viền
                                    </h3>
                                    <div className="space-y-3">
                                        <label className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-50 hover:bg-gray-100'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                checked={adjustConfig.thayDoiVien || false}
                                                onChange={(e) => handleAdjustChange('thayDoiVien', e.target.checked)}
                                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                            />
                                            <span className="text-sm font-medium">Sử dụng viền tùy chỉnh</span>
                                        </label>

                                        {adjustConfig.thayDoiVien && (
                                            <div className="space-y-4 pl-6">
                                                {/* Border Selection */}
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">Tên viền</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={adjustConfig.vienConfig?.selectedVien || ''}
                                                                onChange={(e) => handleAdjustChange('vienConfig', {
                                                                    ...adjustConfig.vienConfig,
                                                                    selectedVien: e.target.value
                                                                })}
                                                                placeholder="vd: vien1.png"
                                                                className={`flex-1 px-3 py-2 text-sm rounded border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-300'
                                                                    }`}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsBorderLibraryOpen(true)}
                                                                className={`px-4 py-2 text-sm rounded font-medium transition-colors ${isDark
                                                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                                                                    }`}
                                                            >
                                                                📚 Chọn từ thư viện
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 mb-1 block">Độ mạnh: {adjustConfig.vienConfig?.doManh || 0}%</label>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            value={adjustConfig.vienConfig?.doManh || 0}
                                                            onChange={(e) => handleAdjustChange('vienConfig', {
                                                                ...adjustConfig.vienConfig,
                                                                doManh: Number(e.target.value)
                                                            })}
                                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Border Preview */}
                                                {adjustConfig.vienConfig?.selectedVien && (
                                                    <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                                                        <label className="text-xs text-gray-500 mb-2 block">Preview viền:</label>
                                                        <div
                                                            className="w-full h-32 rounded"
                                                            style={{
                                                                borderSpacing: '0px',
                                                                border: '22px solid transparent',
                                                                borderImage: `url('http://cdn.evat.vn/imgs/${adjustConfig.vienConfig.selectedVien}') ${adjustConfig.vienConfig.doManh || 0}% round`,
                                                                background: isDark ? '#1e293b' : '#ffffff',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            <span className="text-sm text-gray-500">Mẫu viền hóa đơn</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Template Files Section */}
                            <div>
                                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-700'
                                    }`}>
                                    📄 File mẫu (Nếu công ty đã có sẵn)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* XML Upload */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            File XML
                                        </label>
                                        {xmlFileName ? (
                                            <div className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-300'
                                                }`}>
                                                <span className="text-sm truncate flex-1">{xmlFileName}</span>
                                                <button
                                                    onClick={() => setXmlFileName('')}
                                                    className="ml-2 p-1 rounded hover:bg-red-500 text-red-500 hover:text-white transition-colors"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDark
                                                ? 'border-slate-600 hover:border-orange-500 bg-slate-700/50 hover:bg-slate-700'
                                                : 'border-gray-300 hover:border-orange-500 bg-gray-50 hover:bg-gray-100'
                                                }`}>
                                                <ArrowUpTrayIcon className="w-5 h-5" />
                                                <span className="text-sm font-medium">Tải lên XML</span>
                                                <input
                                                    type="file"
                                                    accept=".xml"
                                                    onChange={(e) => handleFileUpload(e, 'xml')}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {/* XSLT Upload */}
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            File XSLT
                                        </label>
                                        {xsltFileName ? (
                                            <div className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-300'
                                                }`}>
                                                <span className="text-sm truncate flex-1">{xsltFileName}</span>
                                                <button
                                                    onClick={() => setXsltFileName('')}
                                                    className="ml-2 p-1 rounded hover:bg-red-500 text-red-500 hover:text-white transition-colors"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDark
                                                ? 'border-slate-600 hover:border-indigo-500 bg-slate-700/50 hover:bg-slate-700'
                                                : 'border-gray-300 hover:border-indigo-500 bg-gray-50 hover:bg-gray-100'
                                                }`}>
                                                <ArrowUpTrayIcon className="w-5 h-5" />
                                                <span className="text-sm font-medium">Tải lên XSLT</span>
                                                <input
                                                    type="file"
                                                    accept=".xslt,.xsl"
                                                    onChange={(e) => handleFileUpload(e, 'xslt')}
                                                    className="hidden"
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Info Note */}
                            <div className={`p-4 rounded-lg border ${isDark
                                ? 'bg-blue-900/20 border-blue-700'
                                : 'bg-blue-50 border-blue-200'
                                }`}>
                                <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                                    💡 <strong>Lưu ý:</strong> Tất cả cấu hình sẽ được áp dụng khi xem trước và phát hành mẫu hóa đơn.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={`flex justify-end gap-3 p-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'
                            }`}>
                            <button
                                onClick={() => setIsConfigOpen(false)}
                                className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${isDark
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                    }`}
                            >
                                Đóng
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>

            {/* Border Library Modal */}
            <Dialog
                open={isBorderLibraryOpen}
                onClose={() => setIsBorderLibraryOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className={`mx-auto max-w-6xl w-full h-[80vh] rounded-xl shadow-2xl ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'
                        }`}>
                        <div className="flex flex-col h-full">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
                                <Dialog.Title className="text-2xl font-bold flex items-center gap-2">
                                    🖼️ Thư viện viền hóa đơn
                                </Dialog.Title>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Click vào viền để chọn, tên file sẽ tự động được lấy
                                </p>
                            </div>

                            {/* CDN Gallery Iframe */}
                            <div className="flex-1 p-6 overflow-hidden">
                                <iframe
                                    src="https://cdn.evat.vn/?token=phatht#gallery-9"
                                    className="w-full h-full rounded-lg border-2 border-gray-300 dark:border-slate-600"
                                    title="Border Gallery"
                                    sandbox="allow-same-origin allow-scripts"
                                    id="border-gallery-iframe"
                                />
                            </div>

                            {/* Footer with Input and Confirm Button */}
                            <div className="p-6 border-t border-gray-200 dark:border-slate-700">
                                <div className="space-y-4">
                                    {/* Manual Input */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                                            Nhập tên file viền (ví dụ: vien1.png hoặc ANNGUYEN.png)
                                        </label>
                                        <input
                                            type="text"
                                            value={adjustConfig?.vienConfig?.selectedVien || ''}
                                            onChange={(e) => handleAdjustChange('vienConfig', {
                                                ...adjustConfig?.vienConfig,
                                                selectedVien: e.target.value
                                            })}
                                            placeholder="Nhập tên file từ gallery..."
                                            className={`w-full px-4 py-2.5 rounded-lg border-2 transition-colors ${isDark
                                                ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-orange-500'
                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500'
                                                } focus:outline-none`}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-between items-center">
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {adjustConfig?.vienConfig?.selectedVien ? (
                                                <span className="flex items-center gap-2">
                                                    ✅ Đã chọn: <strong className="text-orange-600 dark:text-orange-400">{adjustConfig.vienConfig.selectedVien}</strong>
                                                </span>
                                            ) : (
                                                <span>💡 Click vào ảnh trong gallery để xem tên file</span>
                                            )}
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsBorderLibraryOpen(false)}
                                                className={`px-5 py-2.5 rounded-lg font-semibold transition-colors ${isDark
                                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                                    }`}
                                            >
                                                Đóng
                                            </button>
                                            {adjustConfig?.vienConfig?.selectedVien && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsBorderLibraryOpen(false);
                                                    }}
                                                    className="px-5 py-2.5 rounded-lg font-semibold transition-colors bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl"
                                                >
                                                    ✓ Xác nhận
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </>
    );
};

export default InvoiceActions;
