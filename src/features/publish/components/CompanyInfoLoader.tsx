import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { FullInfoResponse, ContractOptions } from '../../../types';
import { BuildingOfficeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface CompanyInfoLoaderProps {
    mst: string;
    userCode: string;
    onMstChange: (value: string) => void;
    onUserCodeChange: (value: string) => void;
    onLoadInfo: () => void;
    loading: boolean;
    companyData: FullInfoResponse | null;
    contractList: ContractOptions[];
    selectedContract: ContractOptions | null;
    onContractChange: (contract: ContractOptions) => void;
}

const CompanyInfoLoader: React.FC<CompanyInfoLoaderProps> = ({
    mst,
    userCode,
    onMstChange,
    onUserCodeChange,
    onLoadInfo,
    loading,
    companyData,
    contractList,
    selectedContract,
    onContractChange,
}) => {
    const { isDark } = useTheme();

    return (
        <div className="space-y-6">
            {/* Input Section */}
            <div className={`p-6 rounded-lg border ${isDark
                    ? 'bg-slate-800/50 border-blue-700'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                <h3 className={`text-base font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-blue-400' : 'text-blue-800'
                    }`}>
                    🔍 Tìm kiếm thông tin công ty
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            MST/CCCD <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={mst}
                            onChange={(e) => onMstChange(e.target.value)}
                            placeholder="Nhập MST hoặc CCCD"
                            className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
                                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                    </div>

                    {/* <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            Mã nhân viên
                        </label>
                        <input
                            type="text"
                            value={userCode}
                            onChange={(e) => onUserCodeChange(e.target.value)}
                            placeholder="Nhập mã NV"
                            className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
                                    ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                                } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        />
                    </div> */}

                    <div className="flex items-end">
                        <button
                            onClick={onLoadInfo}
                            disabled={loading || !mst}
                            className={`w-full px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${loading || !mst
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang tải...
                                </span>
                            ) : (
                                "📋 Lấy thông tin"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Company Info Display */}
            {companyData && (
                <div className="animate-fade-in space-y-4">
                    {/* Company Details */}
                    <div className={`p-6 rounded-lg border ${isDark
                            ? 'bg-slate-800/50 border-green-700'
                            : 'bg-green-50 border-green-200'
                        }`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-green-900/50' : 'bg-green-100'
                                }`}>
                                <BuildingOfficeIcon className={`w-6 h-6 ${isDark ? 'text-green-400' : 'text-green-600'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-lg font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-800'
                                    }`}>
                                    {companyData.sName || "N/A"}
                                </h4>
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    <div>
                                        <span className="font-medium">MST:</span> {companyData.cusTax || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Email:</span> {companyData.cusEmail || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">SĐT:</span> {companyData.cusTel || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Website:</span> {companyData.cusWebsite || "N/A"}
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="font-medium">Địa chỉ:</span> {companyData.address || "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Info */}
                    <div className={`p-6 rounded-lg border ${isDark
                            ? 'bg-slate-800/50 border-purple-700'
                            : 'bg-purple-50 border-purple-200'
                        }`}>
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/50' : 'bg-purple-100'
                                }`}>
                                <DocumentTextIcon className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-base font-semibold mb-3 ${isDark ? 'text-purple-400' : 'text-purple-800'
                                    }`}>
                                    Thông tin hóa đơn
                                </h4>
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    <div>
                                        <span className="font-medium">Mẫu số:</span> {companyData.invcSample || "N/A"}
                                    </div>
                                    <div>
                                        <span className="font-medium">Ký hiệu:</span> {companyData.invcSign || "N/A"}
                                    </div>
                                </div>

                                {/* Contract Selection */}
                                {contractList.length > 0 && (
                                    <div className="mt-4">
                                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            Chọn hợp đồng
                                        </label>
                                        <select
                                            value={selectedContract?.oid || ""}
                                            onChange={(e) => {
                                                const contract = contractList.find(c => c.oid === e.target.value);
                                                if (contract) onContractChange(contract);
                                            }}
                                            className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
                                                    ? 'bg-slate-700 border-slate-600 text-white'
                                                    : 'bg-white border-gray-300 text-gray-900'
                                                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                                        >
                                            {contractList.map((contract) => (
                                                <option key={contract.oid} value={contract.oid}>
                                                    {contract.label} (Từ {contract.invcFrm} đến {contract.invcEnd})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyInfoLoader;
