import React from 'react';
import { Dialog } from '@headlessui/react';
import { useTheme } from '../../../contexts/ThemeContext';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface OldContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    contracts: any[];
    loading: boolean;
    onSelectContract: (contract: any) => void;
    onLoadContracts: () => void;
}

const OldContractModal: React.FC<OldContractModalProps> = ({
    isOpen,
    onClose,
    contracts,
    loading,
    onSelectContract,
    onLoadContracts,
}) => {
    const { isDark } = useTheme();

    const handleSelectContract = (contract: any) => {
        onSelectContract(contract);
        onClose();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className={`w-full max-w-4xl rounded-xl shadow-2xl ${isDark ? 'bg-slate-800' : 'bg-white'
                    }`}>
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'
                        }`}>
                        <Dialog.Title className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                            Chọn hợp đồng cũ
                        </Dialog.Title>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDark
                                    ? 'hover:bg-slate-700 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search Button */}
                    <div className="p-6 border-b">
                        <button
                            onClick={onLoadContracts}
                            disabled={loading}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${loading
                                    ? 'bg-gray-400 cursor-not-allowed text-white'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Đang tìm kiếm...
                                </>
                            ) : (
                                <>
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                    Tìm kiếm hợp đồng cũ
                                </>
                            )}
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[500px] overflow-y-auto">
                        {contracts.length === 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-sm">
                                    {loading ? 'Đang tải...' : 'Chưa có dữ liệu. Bấm "Tìm kiếm hợp đồng cũ" để tải danh sách.'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {contracts.map((contract, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSelectContract(contract)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${isDark
                                                ? 'border-slate-600 bg-slate-700/50 hover:border-blue-500 hover:bg-slate-700'
                                                : 'border-gray-300 bg-white hover:border-blue-500 hover:bg-blue-50'
                                            }`}
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                    OID
                                                </div>
                                                <div className={`font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'
                                                    }`}>
                                                    {contract.oid}
                                                </div>
                                            </div>
                                            <div>
                                                <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                    Ngày tạo HĐ
                                                </div>
                                                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'
                                                    }`}>
                                                    {formatDate(contract.ngayTaoHopDong)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                    Mẫu số / Ký hiệu
                                                </div>
                                                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    {contract.mauSo} {contract.kyHieu ? `/ ${contract.kyHieu}` : ''}
                                                </div>
                                            </div>
                                            <div>
                                                <div className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'
                                                    }`}>
                                                    Từ số - Đến số
                                                </div>
                                                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'
                                                    }`}>
                                                    {contract.tuSo?.toLocaleString()} - {contract.denSo?.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`p-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'
                        }`}>
                        <button
                            onClick={onClose}
                            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${isDark
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                }`}
                        >
                            Đóng
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default OldContractModal;
