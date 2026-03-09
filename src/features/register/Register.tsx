import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRegister } from './hooks/useRegister';
import AccountCheckSection from './components/AccountCheckSection';
import CompanyInfoForm from './components/CompanyInfoForm';
import ProductSelection from './components/ProductSelection';
import OrderTypeSelector from './components/OrderTypeSelector';
import OldContractModal from './components/OldContractModal';
import CodeValidationStep from './components/CodeValidationStep';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Dialog } from '@headlessui/react';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { user } = useAuth();
    const [openConfirm, setOpenConfirm] = useState(false);
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);

    const {
        form,
        setForm,
        products,
        setProducts,
        hasAccount,
        serverInfo,
        loading,
        loadingCheck,
        isOwner,
        orderType,
        setOrderType,
        oldOID,
        setOldOID,
        refeContractDate,
        setRefeContractDate,
        oldContractList,
        loadingOldContracts,
        loadOldContracts,
        checkAccount,
        submitRegister,
        codeValidated,
        validateRegistrationCode,
    } = useRegister();

    // Set userCode from logged in user
    useEffect(() => {
        if (user?.userCode) {
            setForm(prev => ({ ...prev, userCode: user.userCode }));
        }
    }, [user, setForm]);

    const handleFormChange = (field: string, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleSelectOldContract = (contract: any) => {
        setOldOID(contract.oid);
        if (contract.ngayTaoHopDong) {
            // Convert to YYYY-MM-DD
            setRefeContractDate(contract.ngayTaoHopDong.split('T')[0]);
        }
    };

    const handleCodeValidation = async (code: string, userInfo: any) => {
        await validateRegistrationCode(code);
    };

    const handleSubmit = async () => {
        setOpenConfirm(false);
        try {
            await submitRegister();
            // Có thể navigate về dashboard hoặc trang khác sau khi thành công
        } catch (error) {
            // Error đã được handle trong hook
        }
    };

    // Show code validation step if code not yet validated
    if (!codeValidated) {
        return (
            <CodeValidationStep
                onValidationSuccess={handleCodeValidation}
                loading={loadingCheck}
            />
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
            }`}>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className={`rounded-xl shadow-lg p-6 mb-8 ${isDark
                    ? 'bg-gradient-to-r from-blue-900 to-indigo-900'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Đăng ký dịch vụ
                            </h1>
                            <p className="text-blue-100 text-sm">
                                Tạo đơn hàng và cấp tài khoản cho khách hàng mới
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Quay lại
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`rounded-xl shadow-lg p-8 ${isDark ? 'bg-slate-800' : 'bg-white'
                    }`}>
                    <div className="space-y-8">
                        {/* Hướng dẫn */}
                        <div className={`border-l-4 p-4 rounded-r-lg ${isDark
                            ? 'border-blue-600 bg-blue-900/20'
                            : 'border-blue-400 bg-blue-50'
                            }`}>
                            <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-400' : 'text-blue-800'
                                }`}>
                                📋 Hướng dẫn
                            </h3>
                            <ol className={`list-decimal list-inside text-sm space-y-1.5 ${isDark ? 'text-gray-300' : 'text-blue-700'
                                }`}>
                                <li>Nhập <strong>MST/CCCD</strong> → Bấm <strong>"Kiểm tra tài khoản"</strong> (bắt buộc)</li>
                                <li>Nếu khách hàng <strong>chưa có tài khoản</strong> hoặc <strong>bạn là chủ sở hữu</strong>, điền đầy đủ thông tin công ty</li>
                                <li>Bấm <strong>"Chọn sản phẩm"</strong> để chọn gói dịch vụ</li>
                                <li>Nhập <strong>Mẫu số</strong> (VD: 01GTKT0/001) và <strong>Ký hiệu</strong> (VD: AA/24E)</li>
                                <li>Bấm <strong>"Tạo đơn + Cấp TK"</strong> để hoàn tất</li>
                            </ol>
                        </div>

                        {/* Account Check */}
                        <AccountCheckSection
                            mst={form.mst}
                            onMstChange={(value) => handleFormChange('mst', value)}
                            onCheckAccount={checkAccount}
                            loadingCheck={loadingCheck}
                            hasAccount={hasAccount}
                            serverInfo={serverInfo}
                        />

                        {/* Order Type Selector - Only show if hasAccount and isOwner */}
                        {hasAccount === true && isOwner === true && (
                            <div className="animate-fade-in">
                                <OrderTypeSelector
                                    orderType={orderType}
                                    onOrderTypeChange={setOrderType}
                                    oldOID={oldOID}
                                    onOldOIDChange={setOldOID}
                                    refeContractDate={refeContractDate}
                                    onRefeContractDateChange={setRefeContractDate}
                                    onOpenContractModal={() => setIsContractModalOpen(true)}
                                />
                            </div>
                        )}

                        {/* Old Contract Modal */}
                        <OldContractModal
                            isOpen={isContractModalOpen}
                            onClose={() => setIsContractModalOpen(false)}
                            contracts={oldContractList}
                            loading={loadingOldContracts}
                            onLoadContracts={loadOldContracts}
                            onSelectContract={handleSelectOldContract}
                        />

                        {/* Company Info Form - Only show if isOwner is true */}
                        {isOwner === true && (
                            <div className="animate-fade-in">
                                <CompanyInfoForm
                                    form={form}
                                    onChange={handleFormChange}
                                />
                            </div>
                        )}

                        {/* Product Selection - Only show if isOwner is true */}
                        {isOwner === true && (
                            <div className="animate-fade-in">
                                <ProductSelection
                                    products={products}
                                    onProductsChange={setProducts}
                                />
                            </div>
                        )}

                        {/* Submit Button */}
                        {isOwner === true && (
                            <div className="flex justify-end gap-4 pt-6 border-t">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${isDark
                                        ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                        }`}
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => setOpenConfirm(true)}
                                    disabled={loading}
                                    className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
                                        }`}
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
                                            <CheckCircleIcon className="w-5 h-5" />
                                            {hasAccount === true
                                                ? 'Tạo hợp đồng'
                                                : 'Tạo hợp đồng + Cấp TK'
                                            }
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <Dialog open={openConfirm} onClose={() => setOpenConfirm(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className={`max-w-md w-full rounded-xl shadow-2xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'
                        }`}>
                        <Dialog.Title className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'
                            }`}>
                            {hasAccount === true
                                ? `Xác nhận tạo hợp đồng ${orderType === 1 ? 'gia hạn' : orderType === 2 ? 'cấp bù' : 'mới'}`
                                : 'Xác nhận tạo đơn'
                            }
                        </Dialog.Title>
                        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {hasAccount === true
                                ? `Bạn có chắc chắn muốn tạo hợp đồng ${orderType === 1 ? 'gia hạn' : orderType === 2 ? 'cấp bù' : 'mới'} cho khách hàng này?`
                                : 'Bạn có chắc chắn muốn tạo đơn hàng và cấp tài khoản cho khách hàng này?'
                            }
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setOpenConfirm(false)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark
                                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                    }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </div>
    );
};

export default Register;
