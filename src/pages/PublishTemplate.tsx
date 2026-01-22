import React, { useState } from "react";
import FormField from "../components/FormField";
import CompanyInfoLayout from "../components/CompanyInfoLayout";
import PreviewInvoiceModal from "../components/PreviewInvoiceModal";
import api from "../api/apiClient";
import { FullInfoResponse, SelectedProduct } from "../types";

export default function PublishTemplate() {
  const [form, setForm] = useState({ 
    invFrom: "",
    invTo: "",
    userCode: "",
  });
  
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState<FullInfoResponse | null>(null);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [previewXML, setPreviewXML] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDataLoaded = (data: FullInfoResponse, selectedProducts: SelectedProduct[], _currentRemaining: number) => {
    setCompanyData(data);
    setProducts(selectedProducts);
  };

  const submitPublish = async () => {
    if (!companyData) {
      setMsg("❌ Vui lòng lấy thông tin công ty trước!");
      return;
    }

    if (products.length === 0) {
      setMsg("❌ Vui lòng chọn ít nhất 1 sản phẩm!");
      return;
    }
    
    setLoading(true);
    setMsg("");
    try {
      const payload = {
        CusTax: companyData.cusTax,
        InvSample: companyData.invcSample,
        InvSign: companyData.invcSign,
        InvFrom: parseInt(form.invFrom) || 0,
        InvTo: parseInt(form.invTo) || 0,
        UserCode: form.userCode,
        CusName: companyData.sName,
        CusAddress: companyData.address,
        CusEmail: companyData.cusEmail,
        CusTel: companyData.cusTel,
        CusContactName: "",
        CusContactJob: "",
        CusBankNo: companyData.cusBankNumber,
        CusBankTitle: companyData.cusBankAddress,
        CusWebsite: companyData.cusWebsite,
        CusFax: companyData.cusFax,
        CusCMND_ID: companyData.cusCMND_ID,
        Description: "",
        Products: products.map(p => ({
          ProductCode: p.itemID,
          ProductName: p.itemName,
          Uom: p.itemUnitName,
          Qty: p.Quantity,
          Price: p.itemPrice,
          VatRate: "8%",
          VatName: "VAT 8%",
        })),
      };
      
      const res = await api.post("/odoo/orders/create", payload);
      setMsg(`✅ ${res.data.message} | OID: ${res.data.OID}`);
    } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async () => {
    if (!companyData) {
      setMsg("❌ Vui lòng lấy thông tin công ty trước!");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const payload = {
        CusTax: companyData.cusTax,
        CusName: companyData.sName,
        CusAddress: companyData.address,
        CusEmail: companyData.cusEmail,
        CusTel: companyData.cusTel,
        CusBankNo: companyData.cusBankNumber,
        CusBankTitle: companyData.cusBankAddress,
        CusWebsite: companyData.cusWebsite,
        CusFax: companyData.cusFax,
        InvSample: companyData.invcSample,
        InvSign: companyData.invcSign,
        InvoiceType: "HĐ VAT",
        IsConvert: false,
      };

      const res = await api.post("/odoo/orders/preview-invoice", payload);
      
      if (res.data && res.data.success && res.data.xmlContent) {
        setPreviewXML(res.data.xmlContent);
        setIsPreviewOpen(true);
        setMsg("✅ Xem trước thành công");
      } else {
        setMsg("⚠️ Không có dữ liệu XML trả về");
      }
          } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.message || e.message}`);
          } finally {
            setLoading(false);
          }
        };

  const handleSendInvoice = async () => {
    if (!companyData) {
      setMsg("❌ Vui lòng lấy thông tin công ty trước!");
      return;
    }
    
    if (products.length === 0) {
      setMsg("❌ Vui lòng chọn ít nhất 1 sản phẩm!");
        return;
      }

    setLoading(true);
    setMsg("");

    try {
      const payload = {
        CusTax: companyData.cusTax,
        InvSample: companyData.invcSample,
        InvSign: companyData.invcSign,
        InvFrom: parseInt(form.invFrom) || 0,
        InvTo: parseInt(form.invTo) || 0,
        UserCode: form.userCode,
        CusName: companyData.sName,
        CusAddress: companyData.address,
        CusEmail: companyData.cusEmail,
        CusTel: companyData.cusTel,
        CusBankNo: companyData.cusBankNumber,
        CusBankTitle: companyData.cusBankAddress,
        CusWebsite: companyData.cusWebsite,
        CusFax: companyData.cusFax,
        Products: products.map(p => ({
          ProductCode: p.itemID,
          ProductName: p.itemName,
          Uom: p.itemUnitName,
          Qty: p.Quantity,
          Price: p.itemPrice,
          VatRate: "8%",
          VatName: "VAT 8%",
        })),
      };
      
      const res = await api.post("/odoo/orders/send-hoadon", payload);
      setMsg(`✅ ${res.data.message}`);
    } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <CompanyInfoLayout 
        loaiCap={1}
        onDataLoaded={handleDataLoaded}
        readonlyProducts={true}
        hideCheckboxes={true}
      />

      {/* Additional Fields */}
      <div className="border-t pt-4 mb-4">
        <div className="max-w-xs">
          <FormField 
            label="Mã nhân viên" 
            value={form.userCode} 
            onChange={e => setForm({ ...form, userCode: e.target.value })} 
            placeholder="Nhập mã NVKD"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4 border-t">
        <button 
          onClick={handleViewInvoice}
          disabled={loading || !companyData}
          className="px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {loading ? "Đang xử lý..." : "Xem hóa đơn mẫu"}
        </button>

        <button 
          onClick={handleSendInvoice}
          disabled={loading || !companyData || products.length === 0}
          className="px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {loading ? "Đang xử lý..." : "Gửi hóa đơn"}
        </button>

        <button 
          onClick={submitPublish}
          disabled={loading || !companyData || products.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {loading ? "Đang xử lý..." : "Phát hành [Chuẩn đầu mẫu]"}
        </button>
      </div>

      {/* Result Message */}
      {msg && (
        <div className={`mt-4 p-3 rounded ${msg.includes('❌') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <p className="text-sm">{msg}</p>
        </div>
      )}
      
      {/* Preview Modal */}
      <PreviewInvoiceModal
        isOpen={isPreviewOpen}
        xmlContent={previewXML}
        invoiceType="HĐ VAT"
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
