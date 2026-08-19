import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { usePublish } from './hooks/usePublish';
import AccountCheckSection from './components/AccountCheckSection';
import CompanyInfoDisplay from './components/CompanyInfoDisplay';
import TemplateSelector from './components/TemplateSelector';
import InvoiceActions from './components/InvoiceActions';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const Publish: React.FC = () => {
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const { user } = useAuth();

    const {
        form,
        setForm,
        companyData,
        contractList,
        selectedContract,
        setSelectedContract,
        loadingCompanyInfo,
        loading,
        availableTemplates,
        selectedTemplate,
        setSelectedTemplate,
        loadingTemplates,
        isTemplateConfirmed,
        isToKhaiLocked,
        invoiceConfig,
        setInvoiceConfig,
        selectedSpecialInvoice,
        invoiceTypes,
        selectedFactorId,
        setSelectedFactorId,
        handleSpecialInvoiceSelect,
        loadCompanyInfo,
        handleViewInvoice,
        handleConfirmTemplate,
        downloadXSLT,
        downloadXML,
        submitPublish,
        isOwner,
        ownerUserCode,
        updateCompanyData,
        handleLogoUpload,
        handleBackgroundUpload,
        handleXmlUpload,
        handleXsltUpload,
        handleRemoveLogo,
        handleRemoveBackground,
        adjustConfig,
        setAdjustConfig,
        logoFileName,
        backgroundFileName,
    } = usePublish();

    // Set userCode from logged in user
    useEffect(() => {
        if (user?.userCode) {
            setForm(prev => ({ ...prev, userCode: user.userCode }));
        }
    }, [user, setForm]);

    const handleFormChange = (field: string, value: string) => {
        setForm({ ...form, [field]: value });
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${isDark
            ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
            : 'bg-gradient-to-br from-purple-50 via-white to-blue-50'
            }`}>
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className={`rounded-xl shadow-lg p-6 mb-8 ${isDark
                    ? 'bg-gradient-to-r from-purple-900 to-indigo-900'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Phát hành mẫu hóa đơn
                            </h1>
                            <p className="text-purple-100 text-sm">
                                Chọn mẫu hóa đơn và phát hành cho khách hàng đã có tài khoản
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
                            ? 'border-purple-600 bg-purple-900/20'
                            : 'border-purple-400 bg-purple-50'
                            }`}>
                            <h3 className={`font-semibold mb-2 ${isDark ? 'text-purple-400' : 'text-purple-800'
                                }`}>
                                📋 Hướng dẫn
                            </h3>
                            <ol className={`list-decimal list-inside text-sm space-y-1.5 ${isDark ? 'text-gray-300' : 'text-purple-700'
                                }`}>
                                <li>Nhập <strong>MST/CCCD</strong> và <strong>Mã nhân viên</strong> → Bấm <strong>"Lấy thông tin"</strong></li>
                                <li>Chọn <strong>Mẫu hóa đơn</strong> từ danh sách hoặc chọn loại đặc biệt</li>
                                <li>Cấu hình các tùy chọn hóa đơn (nếu cần)</li>
                                <li>Bấm <strong>"Xem trước"</strong> để kiểm tra mẫu</li>
                                <li>Bấm <strong>"Xác nhận mẫu"</strong> để tạo file XSLT/XML</li>
                                <li>Bấm <strong>"Phát hành mẫu"</strong> để hoàn tất</li>
                            </ol>
                        </div>

                        {/* Account Check Section */}
                        <AccountCheckSection
                            mst={form.mst}
                            userCode={form.userCode}
                            onMstChange={(value) => handleFormChange('mst', value)}
                            onUserCodeChange={(value) => handleFormChange('userCode', value)}
                            onLoadInfo={loadCompanyInfo}
                            loading={loadingCompanyInfo}
                            companyData={companyData}
                            isOwner={isOwner}
                            ownerUserCode={ownerUserCode}
                        />

                        {/* Company Info Display */}
                        {companyData && isOwner && (
                            <div className="animate-fade-in">
                                <CompanyInfoDisplay
                                    companyData={companyData}
                                    contractList={contractList}
                                    selectedContract={selectedContract}
                                    onContractChange={setSelectedContract}
                                    onDataUpdate={updateCompanyData}
                                />
                            </div>
                        )}

                        {/* Template Selector */}
                        {companyData && isOwner && (
                            <div className="animate-fade-in">
                                <TemplateSelector
                                    availableTemplates={availableTemplates}
                                    selectedTemplate={selectedTemplate}
                                    onTemplateChange={setSelectedTemplate}
                                    loadingTemplates={loadingTemplates}
                                    invoiceConfig={invoiceConfig}
                                    onConfigChange={setInvoiceConfig}
                                    selectedSpecialInvoice={selectedSpecialInvoice}
                                    onSpecialInvoiceSelect={handleSpecialInvoiceSelect}
                                    isToKhaiLocked={isToKhaiLocked}
                                    invoiceTypes={invoiceTypes}
                                    selectedFactorId={selectedFactorId}
                                    onFactorIdChange={setSelectedFactorId}
                                />
                            </div>
                        )}

                        {/* Invoice Actions */}
                        {companyData && isOwner && (selectedTemplate || selectedSpecialInvoice) && (
                            <div className="animate-fade-in">
                                <InvoiceActions
                                    onViewInvoice={handleViewInvoice}
                                    onConfirmTemplate={handleConfirmTemplate}
                                    onDownloadXSLT={downloadXSLT}
                                    onDownloadXML={downloadXML}
                                    onPublish={submitPublish}
                                    loading={loading}
                                    isTemplateConfirmed={isTemplateConfirmed}
                                    hasConfiguredXslt={!!isTemplateConfirmed}
                                    hasXmlData={!!isTemplateConfirmed}
                                    onLogoUpload={handleLogoUpload}
                                    onBackgroundUpload={handleBackgroundUpload}
                                    onXmlUpload={handleXmlUpload}
                                    onXsltUpload={handleXsltUpload}
                                    onRemoveLogo={handleRemoveLogo}
                                    onRemoveBackground={handleRemoveBackground}
                                    adjustConfig={adjustConfig}
                                    onAdjustConfigChange={setAdjustConfig}
                                    logoFileName={logoFileName}
                                    backgroundFileName={backgroundFileName}
                                />
                            </div>
                        )}

                        {/* Empty State */}
                        {!companyData && (
                            <div className={`text-center py-12 border-2 border-dashed rounded-lg ${isDark
                                ? 'border-slate-600 text-gray-400'
                                : 'border-gray-300 text-gray-500'
                                }`}>
                                <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm">Nhập MST/CCCD và bấm "Lấy thông tin" để bắt đầu</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Publish;
