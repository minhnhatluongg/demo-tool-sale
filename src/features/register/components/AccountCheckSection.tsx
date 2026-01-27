import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';

interface AccountCheckSectionProps {
    mst: string;
    onMstChange: (value: string) => void;
    onCheckAccount: () => void;
    loadingCheck: boolean;
    hasAccount: boolean | null;
    serverInfo: string;
}

const AccountCheckSection: React.FC<AccountCheckSectionProps> = ({
    mst,
    onMstChange,
    onCheckAccount,
    loadingCheck,
    hasAccount,
    serverInfo,
}) => {
    const { isDark } = useTheme();

    return (
        <div className={`border rounded-lg p-6 ${isDark
                ? 'border-red-700 bg-red-900/20'
                : 'border-red-400 bg-red-50'
            }`}>
            <p className={`text-sm font-medium mb-4 ${isDark ? 'text-red-400' : 'text-red-600'
                }`}>
                *MST/CCCD bắt buộc nhập trước khi kiểm tra tài khoản
            </p>

            <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[250px]">
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                        Mã số thuế / CCCD
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

                <button
                    onClick={onCheckAccount}
                    disabled={loadingCheck || !mst}
                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${loadingCheck || !mst
                            ? 'bg-gray-400 cursor-not-allowed'
                            : isDark
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl'
                        }`}
                >
                    {loadingCheck ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Đang kiểm tra...
                        </span>
                    ) : (
                        "Kiểm tra tài khoản"
                    )}
                </button>
            </div>

            {/* Hiển thị trạng thái tài khoản */}
            {hasAccount !== null && (
                <div className="mt-4 animate-fade-in">
                    {hasAccount ? (
                        <div className={`border rounded-lg p-4 ${isDark
                                ? 'bg-yellow-900/30 border-yellow-700'
                                : 'bg-yellow-50 border-yellow-300'
                            }`}>
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-800'
                                        }`}>
                                        Khách hàng ĐÃ CÓ tài khoản EVAT
                                    </p>
                                    {serverInfo && (
                                        <p className={`text-xs mt-1 ${isDark ? 'text-yellow-500' : 'text-yellow-700'
                                            }`}>
                                            Server: <strong>{serverInfo}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className={`border rounded-lg p-4 ${isDark
                                ? 'bg-green-900/30 border-green-700'
                                : 'bg-green-50 border-green-300'
                            }`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">✅</span>
                                <p className={`text-sm font-semibold ${isDark ? 'text-green-400' : 'text-green-800'
                                    }`}>
                                    Khách hàng CHƯA CÓ tài khoản - Có thể cấp TK hoặc tạo đơn
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AccountCheckSection;
