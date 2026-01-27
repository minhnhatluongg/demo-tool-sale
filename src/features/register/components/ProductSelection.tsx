import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { SelectedProduct } from '../../../types';
import ProductSelectionModal from '../../../components/ProductSelectionModal';
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProductSelectionProps {
    products: SelectedProduct[];
    onProductsChange: (products: SelectedProduct[]) => void;
}

const ProductSelection: React.FC<ProductSelectionProps> = ({ products, onProductsChange }) => {
    const { isDark } = useTheme();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleRemoveProduct = (index: number) => {
        const newProducts = products.filter((_, i) => i !== index);
        onProductsChange(newProducts);
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        const newProducts = [...products];
        newProducts[index].Quantity = Math.max(1, quantity);
        onProductsChange(newProducts);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    const totalAmount = products.reduce((sum, p) => sum + (p.itemPrice * p.Quantity), 0);

    return (
        <div className={`p-6 rounded-lg ${isDark ? 'bg-slate-800/50' : 'bg-indigo-50'
            }`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className={`text-base font-semibold flex items-center gap-2 ${isDark ? 'text-indigo-400' : 'text-indigo-800'
                    }`}>
                    📦 Sản phẩm & Dịch vụ
                </h3>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isDark
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        } shadow-lg hover:shadow-xl`}
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    Chọn sản phẩm
                </button>
            </div>

            {products.length === 0 ? (
                <div className={`text-center py-12 border-2 border-dashed rounded-lg ${isDark
                    ? 'border-slate-600 text-gray-400'
                    : 'border-gray-300 text-gray-500'
                    }`}>
                    <PlusCircleIcon className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Chưa có sản phẩm nào được chọn</p>
                    <p className="text-xs mt-1">Click "Chọn sản phẩm" để thêm</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {products.map((product, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border transition-all duration-200 ${isDark
                                ? 'bg-slate-700 border-slate-600 hover:border-indigo-500'
                                : 'bg-white border-gray-200 hover:border-indigo-400'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${product.itemUnitName === 'Gói'
                                            ? isDark ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                                            : isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {product.itemUnitName}
                                        </span>
                                        <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'
                                            }`}>
                                            {product.itemName}
                                        </h4>
                                    </div>

                                    <div className={`text-sm space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        <p>Mã: <span className="font-mono">{product.itemID}</span></p>
                                        <p>Đơn giá: <span className="font-semibold">{formatCurrency(product.itemPrice)}</span></p>
                                        {product.itemUnitName === 'Gói' && (
                                            <p>Số lượng hóa đơn: <span className="font-semibold">{product.itemPerBox}</span></p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'
                                            }`}>
                                            SL:
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={product.Quantity}
                                            onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                                            className={`w-20 border rounded-lg px-3 py-1.5 text-sm text-center ${isDark
                                                ? 'bg-slate-600 border-slate-500 text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                                } focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleRemoveProduct(index)}
                                        className={`p-2 rounded-lg transition-colors ${isDark
                                            ? 'hover:bg-red-900/50 text-red-400 hover:text-red-300'
                                            : 'hover:bg-red-50 text-red-600 hover:text-red-700'
                                            }`}
                                        title="Xóa sản phẩm"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className={`mt-3 pt-3 border-t flex justify-between items-center ${isDark ? 'border-slate-600' : 'border-gray-200'
                                }`}>
                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Thành tiền:
                                </span>
                                <span className={`text-lg font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'
                                    }`}>
                                    {formatCurrency(product.itemPrice * product.Quantity)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Tổng cộng */}
                    <div className={`p-4 rounded-lg border-2 ${isDark
                        ? 'bg-indigo-900/30 border-indigo-700'
                        : 'bg-indigo-100 border-indigo-300'
                        }`}>
                        <div className="flex justify-between items-center">
                            <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'
                                }`}>
                                Tổng cộng:
                            </span>
                            <span className={`text-2xl font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-600'
                                }`}>
                                {formatCurrency(totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Selection Modal */}
            <ProductSelectionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={(selectedProducts) => {
                    onProductsChange(selectedProducts);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
};

export default ProductSelection;
