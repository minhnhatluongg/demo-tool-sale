import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { FullInfoResponse, ContractOptions } from '../../../types';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface CompanyInfoDisplayProps {
    companyData: FullInfoResponse;
    contractList: ContractOptions[];
    selectedContract: ContractOptions | null;
    onContractChange: (contract: ContractOptions) => void;
    onDataUpdate?: (updatedData: Partial<FullInfoResponse>) => void;
}

const CompanyInfoDisplay: React.FC<CompanyInfoDisplayProps> = ({
    companyData,
    contractList,
    selectedContract,
    onContractChange,
    onDataUpdate,
}) => {
    const { isDark } = useTheme();
    const [editingSection, setEditingSection] = useState<string | null>(null);
    const [editedData, setEditedData] = useState<Partial<FullInfoResponse>>({});

    const labelClass = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`;
    const valueClass = `text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`;
    const inputClass = `w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isDark
            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`;

    const handleEdit = (section: string) => {
        setEditingSection(section);
        setEditedData({ ...companyData });
    };

    const handleSave = () => {
        if (onDataUpdate) {
            onDataUpdate(editedData);
        }
        setEditingSection(null);
    };

    const handleCancel = () => {
        setEditingSection(null);
        setEditedData({});
    };

    const handleChange = (field: keyof FullInfoResponse, value: string) => {
        setEditedData(prev => ({ ...prev, [field]: value }));
    };

    const renderEditButtons = (section: string, color: string) => {
        if (editingSection === section) {
            return (
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark
                                ? `bg-${color}-600 hover:bg-${color}-700 text-white`
                                : `bg-${color}-100 hover:bg-${color}-200 text-${color}-700`
                            }`}
                    >
                        <CheckIcon className="w-3.5 h-3.5" />
                        Lưu
                    </button>
                    <button
                        onClick={handleCancel}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark
                                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                    >
                        <XMarkIcon className="w-3.5 h-3.5" />
                        Hủy
                    </button>
                </div>
            );
        }
        return (
            <button
                onClick={() => handleEdit(section)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDark
                        ? `bg-${color}-600 hover:bg-${color}-700 text-white`
                        : `bg-${color}-100 hover:bg-${color}-200 text-${color}-700`
                    }`}
            >
                <PencilIcon className="w-3.5 h-3.5" />
                Sửa
            </button>
        );
    };

    return (
        <div className="space-y-6">
            {/* Thông tin cơ bản */}
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-800'
                        }`}>
                        🏢 Thông tin công ty
                    </h3>
                    {renderEditButtons('company', 'blue')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>MST/CCCD</label>
                        {editingSection === 'company' ? (
                            <input
                                type="text"
                                value={editedData.cusTax || ''}
                                onChange={(e) => handleChange('cusTax', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusTax || ''}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>CCCD/ID</label>
                        {editingSection === 'company' ? (
                            <input
                                type="text"
                                value={editedData.cusCMND_ID || ''}
                                onChange={(e) => handleChange('cusCMND_ID', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusCMND_ID || ''}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Tên công ty</label>
                        {editingSection === 'company' ? (
                            <input
                                type="text"
                                value={editedData.sName || ''}
                                onChange={(e) => handleChange('sName', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.sName || ''}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Địa chỉ</label>
                        {editingSection === 'company' ? (
                            <input
                                type="text"
                                value={editedData.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.address || ''}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Đại diện</label>
                        {editingSection === 'company' ? (
                            <input
                                type="text"
                                value={editedData.cusPeople_Sign || ''}
                                onChange={(e) => handleChange('cusPeople_Sign', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusPeople_Sign || ''}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Chức vụ</label>
                        {editingSection === 'company' ? (
                            <input
                                type="text"
                                value={editedData.cusPosition || 'Giám Đốc'}
                                onChange={(e) => handleChange('cusPosition', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusPosition || 'Giám Đốc'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Thông tin liên hệ */}
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-green-50 border-green-200'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-green-400' : 'text-green-800'
                        }`}>
                        📞 Thông tin liên hệ
                    </h3>
                    {renderEditButtons('contact', 'green')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Email</label>
                        {editingSection === 'contact' ? (
                            <input
                                type="email"
                                value={editedData.cusEmail || ''}
                                onChange={(e) => handleChange('cusEmail', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusEmail || 'N/A'}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Số điện thoại</label>
                        {editingSection === 'contact' ? (
                            <input
                                type="tel"
                                value={editedData.cusTel || ''}
                                onChange={(e) => handleChange('cusTel', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusTel || 'N/A'}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Website</label>
                        {editingSection === 'contact' ? (
                            <input
                                type="url"
                                value={editedData.cusWebsite || ''}
                                onChange={(e) => handleChange('cusWebsite', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusWebsite || 'N/A'}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Fax</label>
                        {editingSection === 'contact' ? (
                            <input
                                type="text"
                                value={editedData.cusFax || ''}
                                onChange={(e) => handleChange('cusFax', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusFax || 'N/A'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Thông tin ngân hàng */}
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-purple-50 border-purple-200'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-purple-400' : 'text-purple-800'
                        }`}>
                        🏦 Thông tin ngân hàng
                    </h3>
                    {renderEditButtons('bank', 'purple')}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Số tài khoản</label>
                        {editingSection === 'bank' ? (
                            <input
                                type="text"
                                value={editedData.cusBankNumber || ''}
                                onChange={(e) => handleChange('cusBankNumber', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusBankNumber || 'N/A'}</p>
                        )}
                    </div>

                    <div>
                        <label className={labelClass}>Tên ngân hàng</label>
                        {editingSection === 'bank' ? (
                            <input
                                type="text"
                                value={editedData.cusBankAddress || ''}
                                onChange={(e) => handleChange('cusBankAddress', e.target.value)}
                                className={inputClass}
                            />
                        ) : (
                            <p className={valueClass}>{companyData.cusBankAddress || 'N/A'}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Thông tin hóa đơn - Contract Selection */}
            <div className={`p-6 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-orange-50 border-orange-200'
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-orange-400' : 'text-orange-800'
                        }`}>
                        📋 Chọn hợp đồng
                    </h3>
                </div>

                {/* Contract Selection Dropdown */}
                {contractList && contractList.length > 0 && (
                    <div className="mb-4">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Chọn hợp đồng <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedContract?.oid || ''}
                            onChange={(e) => {
                                const contract = contractList.find(c => c.oid === e.target.value);
                                if (contract) onContractChange(contract);
                            }}
                            className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
                                    ? 'bg-slate-700 border-slate-600 text-white focus:border-orange-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500'
                                } focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                        >
                            <option value="">-- Chọn hợp đồng --</option>
                            {contractList.map((contract) => (
                                <option key={contract.oid} value={contract.oid}>
                                    {contract.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Display selected contract details */}
                {selectedContract && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Từ số</label>
                            <p className={valueClass}>{selectedContract.invcFrm || 'N/A'}</p>
                        </div>

                        <div>
                            <label className={labelClass}>Đến số</label>
                            <p className={valueClass}>{selectedContract.invcEnd || 'N/A'}</p>
                        </div>

                        <div>
                            <label className={labelClass}>Mẫu số</label>
                            <p className={valueClass}>{selectedContract.invcSample || 'N/A'}</p>
                        </div>

                        <div>
                            <label className={labelClass}>Ký hiệu</label>
                            <p className={valueClass}>{selectedContract.invcSign || 'N/A'}</p>
                        </div>
                    </div>
                )}

                {/* Fallback if no contracts available but contractRange exists */}
                {(!contractList || contractList.length === 0) && companyData.contractRange && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Từ số</label>
                            <p className={valueClass}>{companyData.contractRange.invcFrm || 'N/A'}</p>
                        </div>

                        <div>
                            <label className={labelClass}>Đến số</label>
                            <p className={valueClass}>{companyData.contractRange.invcEnd || 'N/A'}</p>
                        </div>

                        <div>
                            <label className={labelClass}>Mẫu số</label>
                            <p className={valueClass}>{companyData.contractRange.invcSample || companyData.invcSample || 'N/A'}</p>
                        </div>

                        <div>
                            <label className={labelClass}>Ký hiệu</label>
                            <p className={valueClass}>{companyData.contractRange.invcSign || companyData.invcSign || 'N/A'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyInfoDisplay;
