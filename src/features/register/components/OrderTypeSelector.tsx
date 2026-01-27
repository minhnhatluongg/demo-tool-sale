import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface OrderTypeSelectorProps {
    orderType: number;
    onOrderTypeChange: (type: number) => void;
    oldOID: string;
    onOldOIDChange: (value: string) => void;
    refeContractDate: string;
    onRefeContractDateChange: (value: string) => void;
    onOpenContractModal: () => void;
}

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
    orderType,
    onOrderTypeChange,
    oldOID,
    onOldOIDChange,
    refeContractDate,
    onRefeContractDateChange,
    onOpenContractModal,
}) => {
    const { isDark } = useTheme();

    const orderTypes = [
        { id: 0, label: 'Hợp đồng cơ bản', description: 'Tạo hợp đồng mới' },
        { id: 1, label: 'Gia hạn', description: 'Gia hạn hợp đồng cũ' },
        { id: 2, label: 'Cấp bù', description: 'Cấp bù hóa đơn' },
    ];

    return (
        <div className={`p-6 rounded-lg border ${isDark
            ? 'bg-slate-800/50 border-purple-700'
            : 'bg-purple-50 border-purple-200'
            }`}>
            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-purple-400' : 'text-purple-800'
                }`}>
                📋 Loại hợp đồng
            </h3>

            {/* Order Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {orderTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => onOrderTypeChange(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${orderType === type.id
                            ? isDark
                                ? 'border-purple-500 bg-purple-900/30'
                                : 'border-purple-500 bg-purple-100'
                            : isDark
                                ? 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${orderType === type.id
                                ? 'border-purple-500'
                                : isDark ? 'border-slate-500' : 'border-gray-400'
                                }`}>
                                {orderType === type.id && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-800'
                                    }`}>
                                    {type.label}
                                </div>
                                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    {type.description}
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Additional Fields for Gia hạn/Cấp bù */}
            {(orderType === 1 || orderType === 2) && (
                <div className="animate-fade-in space-y-4 mt-6 pt-6 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                OID hợp đồng cũ <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={oldOID}
                                    onChange={(e) => onOldOIDChange(e.target.value)}
                                    placeholder="VD: 000038/241228:110516592"
                                    className={`flex-1 border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
                                            ? 'bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-purple-500'
                                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
                                        } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                                />
                                <button
                                    onClick={onOpenContractModal}
                                    className={`px-3 py-2 rounded-lg transition-colors ${isDark
                                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                            : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                                        }`}
                                    title="Tìm kiếm hợp đồng cũ"
                                >
                                    <MagnifyingGlassIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Ngày hợp đồng cũ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={refeContractDate}
                                onChange={(e) => onRefeContractDateChange(e.target.value)}
                                className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors ${isDark
                                    ? 'bg-slate-700 border-slate-600 text-white focus:border-purple-500'
                                    : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                                    } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                            />
                        </div>
                    </div>

                    <div className={`p-3 rounded-lg border ${isDark
                        ? 'bg-yellow-900/20 border-yellow-700'
                        : 'bg-yellow-50 border-yellow-300'
                        }`}>
                        <p className={`text-sm ${isDark ? 'text-yellow-400' : 'text-yellow-700'
                            }`}>
                            💡 Vui lòng nhập đầy đủ OID và ngày hợp đồng cũ để {orderType === 1 ? 'gia hạn' : 'cấp bù'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTypeSelector;
