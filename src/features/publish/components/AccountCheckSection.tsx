import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

interface AccountCheckSectionProps {
    mst: string;
    userCode: string;
    onMstChange: (value: string) => void;
    onUserCodeChange: (value: string) => void;
    onLoadInfo: () => void;
    loading: boolean;
    companyData: any;
    isOwner: boolean;
    ownerUserCode: string;
}

const AccountCheckSection: React.FC<AccountCheckSectionProps> = ({
    mst,
    userCode,
    onMstChange,
    onUserCodeChange,
    onLoadInfo,
    loading,
    companyData,
    isOwner,
    ownerUserCode,
}) => {
    const { isDark } = useTheme();

    return (
        <div className={`border rounded-lg p-6 ${isDark
                ? 'border-purple-700 bg-purple-900/20'
                : 'border-purple-400 bg-purple-50'
            }`}>
            <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🔍</span>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-purple-400' : 'text-purple-800'
                    }`}>
                    Tìm kiếm thông tin công ty
                </h3>
            </div>

            <div className="flex gap-4 mb-4">
                <div className="flex-1">
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
                                ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-purple-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                            } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                    />
                </div>

                <div className="flex items-end">
                    <button
                        onClick={onLoadInfo}
                        disabled={loading || !mst || !userCode}
                        className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap ${loading || !mst || !userCode
                                ? 'bg-gray-400 cursor-not-allowed text-white'
                                : isDark
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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

            {/* Ownership Warning */}
            {companyData && !isOwner && (
                <div className={`mt-4 p-4 rounded-lg border-l-4 animate-fade-in ${isDark ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'
                    }`}>
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className={`text-sm leading-5 font-medium ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                                ⚠️ Cảnh báo quyền sở hữu
                            </h3>
                            <div className={`mt-2 text-sm leading-5 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                                <p>
                                    Mã số thuế này hiện đang được quản lý bởi nhân viên <strong>{ownerUserCode}</strong>.
                                    <br />
                                    Bạn không có quyền thực hiện phát hành mẫu cho khách hàng này.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountCheckSection;
