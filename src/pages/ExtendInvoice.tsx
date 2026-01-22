import React, { useState } from "react";
import FormField from "../components/FormField";
import api from "../api/apiClient";
import { SelectedProduct, Product } from "../types";
import { toast } from "react-hot-toast";

interface OIDItem {
  oid: string;
  cusTax: string;
  createdAt: string;
  invcSample: string;
}

interface CompanyInfo {
  cusTax: string;
  cusCMND_ID: string;
  sName: string;
  address: string;
  cusTel: string;
  cusEmail: string;
  cusFax: string;
  cusWebsite: string;
  cusBankAddress: string;
  cusBankNumber: string;
  CusContactName: string;
  cusPosition: string;
  cusPeopleSign: string;
  cusNote: string;
  products: Product[];
}

export default function ExtendInvoice() {
  const [mst, setMst] = useState("");
  const [oidList, setOidList] = useState<OIDItem[]>([]);
  const [selectedOID, setSelectedOID] = useState("");
  const [loadingOIDs, setLoadingOIDs] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    cusTax: "",
    cusCMND_ID: "",
    sName: "",
    address: "",
    cusTel: "",
    cusEmail: "",
    cusFax: "",
    cusWebsite: "",
    cusBankAddress: "",
    cusBankNumber: "",
    CusContactName: "",
    cusPosition: "",
    cusPeopleSign: "",
    cusNote: "",
    products: [],
  });
  
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
  
  // Modal chọn gói
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [form, setForm] = useState({
    invSample: "",
    invSign: "",
    invFrom: "",
    invTo: "",
    userCode: "",
  });
  
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Load danh sách OID theo MST
  const loadOIDList = async () => {
    if (!mst.trim()) {
      toast.error("Vui lòng nhập MST/CCCD!");
      return;
    }

    setLoadingOIDs(true);
    setMsg("");
    setOidList([]);
    setSelectedOID("");
    setCompanyInfo({
      cusTax: "",
      cusCMND_ID: "",
      sName: "",
      address: "",
      cusTel: "",
      cusEmail: "",
      cusFax: "",
      cusWebsite: "",
      cusBankAddress: "",
      cusBankNumber: "",
      CusContactName: "",
      cusPosition: "",
      cusPeopleSign: "",
      cusNote: "",
      products: [],
    });
    
    try {
      const res = await api.get(`/tax/get-oid-list-by-mst?mst=${encodeURIComponent(mst)}`);
      
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setOidList(res.data.data);
        toast.success(`Tìm thấy ${res.data.data.length} hợp đồng`);
      } else {
        setMsg("❌ Không tìm thấy hợp đồng nào!");
      }
    } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.message || "Lỗi khi tải danh sách OID"}`);
    } finally {
      setLoadingOIDs(false);
    }
  };

  // Load thông tin chi tiết khi chọn OID
  const loadInfoByOID = async (oid: string) => {
    if (!oid) return;

    setLoadingInfo(true);
    setMsg("");
    
    try {
      const res = await api.get(`/tax/get-full-info-by-oid?oid=${encodeURIComponent(oid)}`);
      // API có thể trả về res.data hoặc res.data.data
      const data = res.data.data || res.data;
      
      console.log("Full API Response:", res.data);
      console.log("Data extracted:", data);
      
      setCompanyInfo({
        cusTax: data.cusTax || "",
        cusCMND_ID: data.cusCMND_ID || data.cusCMND_id || "",
        sName: data.sName || "",
        address: data.address || "",
        cusTel: data.cusTel || "",
        cusEmail: data.cusEmail || "",
        cusFax: data.cusFax || "",
        cusWebsite: data.cusWebsite || "",
        cusBankAddress: data.cusBankAddress || "",
        cusBankNumber: data.cusBankNumber || "",
        CusContactName: data.CusContactName || data.cusContactName || "",
        cusPosition: data.cusPosition || "",
        cusPeopleSign: data.cusPeopleSign || data.cusPeople_Sign || "",
        cusNote: "",
        products: [],
      });
      
      // Không load gói cũ - user sẽ chọn gói mới
      setSelectedProducts([]);
      
      toast.success("Đã load thông tin hợp đồng!");
    } catch (e: any) {
      console.error("Error loading OID info:", e);
      setMsg(`❌ ${e.response?.data?.message || "Lỗi khi tải thông tin hợp đồng"}`);
      toast.error("Không thể tải thông tin hợp đồng!");
    } finally {
      setLoadingInfo(false);
    }
  };

  // Load products từ API
  const handleLoadProducts = async () => {
    setLoadingProducts(true);
    try {
      const [invoiceRes, tvanRes] = await Promise.all([
        api.get("/odoo/orders/get-products?onlyTVAN=0"),
        api.get("/odoo/orders/get-products?onlyTVAN=1"),
      ]);

      const invoiceProducts = invoiceRes.data.success ? invoiceRes.data.data : [];
      const tvanProducts = tvanRes.data.success ? tvanRes.data.data : [];

      const allProducts = [
        ...invoiceProducts.map((p: any) => ({ ...p, productCategory: "INVOICE" })),
        ...tvanProducts.map((p: any) => ({ ...p, productCategory: "TVAN" })),
      ];

      setAvailableProducts(allProducts);
      setIsProductModalOpen(true);
    } catch (e: any) {
      console.error("Error loading products:", e);
      toast.error("Không thể tải danh sách sản phẩm!");
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle chọn sản phẩm với validation
  const handleProductSelect = (product: any) => {
    const exists = selectedProducts.find((p) => p.itemID === product.itemID);

    if (exists) {
      setSelectedProducts(selectedProducts.filter((p) => p.itemID !== product.itemID));
    } else {
      // Kiểm tra nghiệp vụ: Chỉ cho chọn TỐI ĐA 1 gói hóa đơn
      const currentInvoiceCount = selectedProducts.filter((p: any) => p.productCategory === "INVOICE").length;

      if (product.productCategory === "INVOICE" && currentInvoiceCount >= 1) {
        toast.error("❌ Chỉ được chọn tối đa 1 gói hóa đơn! Bạn có thể chọn thêm gói TVAN.");
        return;
      }

      setSelectedProducts([
        ...selectedProducts,
        {
          ...product,
          Quantity: 1,
          TotalAmount: product.itemPrice || 0,
        },
      ]);
    }
  };

  // Cập nhật số lượng
  const handleQuantityChange = (itemID: string, quantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.itemID === itemID
          ? { ...p, Quantity: quantity, TotalAmount: (p.itemPrice || 0) * quantity }
          : p
      )
    );
  };

  // Xóa sản phẩm
  const handleRemoveProduct = (index: number) => {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const submitExtend = async () => {
    if (!selectedOID) {
      setMsg("❌ Vui lòng chọn OID!");
      return;
    }

    if (!companyInfo.cusTax) {
      setMsg("❌ Vui lòng tải thông tin hợp đồng trước!");
      return;
    }

    if (!form.invSample || !form.invSign) {
      setMsg("❌ Vui lòng nhập mẫu số và ký hiệu!");
      return;
    }

    if (!form.invFrom || !form.invTo) {
      setMsg("❌ Vui lòng nhập từ số và đến số!");
      return;
    }

    const fromNum = parseInt(form.invFrom);
    const toNum = parseInt(form.invTo);
    if (isNaN(fromNum) || isNaN(toNum) || toNum <= fromNum) {
      setMsg("❌ Số đến phải lớn hơn số từ!");
      return;
    }

    if (selectedProducts.length === 0) {
      setMsg("❌ Vui lòng chọn ít nhất 1 sản phẩm!");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const payload = {
        cusTax: companyInfo.cusTax,
        cusCMND_ID: companyInfo.cusCMND_ID,
        cusName: companyInfo.sName,
        cusAddress: companyInfo.address,
        cusTel: companyInfo.cusTel,
        cusEmail: companyInfo.cusEmail,
        cusFax: companyInfo.cusFax,
        cusWebsite: companyInfo.cusWebsite,
        cusBankTitle: companyInfo.cusBankAddress,
        cusBankNo: companyInfo.cusBankNumber,
        cusContactName: companyInfo.CusContactName,
        cusPosition_BySign: companyInfo.cusPosition,
        cusLegalValue: companyInfo.cusPeopleSign,
        userCode: form.userCode,
        userName: form.userCode,
        orderType: 1, // ✅ Gia hạn
        oldOID: selectedOID, // ✅ OID hợp đồng cũ
        refeContractDate: new Date().toISOString(), // ✅ Ngày tạo HĐ hiện tại
        isOnline: 1, // ✅ Đơn online
        description: companyInfo.cusNote || `Gia hạn từ ${selectedOID}`,
        invSample: form.invSample,
        invSign: form.invSign,
        invFrom: fromNum,
        invTo: toNum,
        Products: selectedProducts.map(p => ({
          productCode: p.itemID,
          productName: p.itemName,
          uom: p.itemUnitName || "Cái",
          price: p.itemPrice || 0,
          qty: p.Quantity || 1,
          vatRate: "8%",
          vatName: "VAT 8%",
        })),
      };

      const res = await api.post("/odoo/orders/create-order", payload);
      setMsg(`✅ ${res.data.message || "Gia hạn thành công!"}`);
      toast.success("Gia hạn thành công!");
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message;
      setMsg(`❌ ${errorMsg}`);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-6">🔄 Gia hạn hóa đơn</h2>

      {/* Bước 1: Nhập MST và Load OID */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-3">📋 Bước 1: Nhập MST/CCCD</h3>
        <div className="flex gap-3">
          <FormField 
            label="" 
            value={mst} 
            onChange={e => setMst(e.target.value)} 
            placeholder="Nhập MST hoặc CCCD"
          />
          <button
            onClick={loadOIDList}
            disabled={loadingOIDs}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loadingOIDs ? "⏳ Đang tải..." : "🔍 Tìm hợp đồng"}
          </button>
        </div>
      </div>

      {/* Bước 2: Chọn OID */}
      {oidList.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded p-4 mb-4">
          <h3 className="text-sm font-semibold text-purple-800 mb-3">📑 Bước 2: Chọn hợp đồng cần gia hạn</h3>
          <select
            value={selectedOID}
            onChange={e => {
              setSelectedOID(e.target.value);
              loadInfoByOID(e.target.value);
            }}
            disabled={loadingInfo}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">-- Chọn OID --</option>
            {oidList.map((item, idx) => (
              <option key={idx} value={item.oid}>
                {item.oid} (Tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')})
              </option>
            ))}
          </select>
          {loadingInfo && (
            <p className="text-xs text-purple-600 mt-2">⏳ Đang tải thông tin hợp đồng...</p>
          )}
        </div>
      )}

      {/* Thông tin công ty */}
      {companyInfo.cusTax && (
        <div className="border-t pt-6">
          <h3 className="text-base font-semibold text-blue-800 mb-4 flex items-center gap-2">
            🏢 Thông tin công ty
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4 bg-blue-50 p-4 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                MST/CCCD <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyInfo.cusTax}
                onChange={e => setCompanyInfo({ ...companyInfo, cusTax: e.target.value })}
                placeholder="Nhập MST/CCCD"
                className="w-full border rounded-md px-3 py-2 text-sm bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                readOnly
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                CMND/ID
              </label>
              <input
                type="text"
                value={companyInfo.cusCMND_ID}
                onChange={e => setCompanyInfo({ ...companyInfo, cusCMND_ID: e.target.value })}
                placeholder="Nhập CMND/ID"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tên công ty <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyInfo.sName}
                onChange={e => setCompanyInfo({ ...companyInfo, sName: e.target.value })}
                placeholder="Nhập tên công ty"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Địa chỉ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyInfo.address}
                onChange={e => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                placeholder="Nhập địa chỉ"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Đại diện
              </label>
              <input
                type="text"
                value={companyInfo.CusContactName}
                onChange={e => setCompanyInfo({ ...companyInfo, CusContactName: e.target.value })}
                placeholder="Tên người đại diện"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Chức vụ
              </label>
              <input
                type="text"
                value={companyInfo.cusPosition}
                onChange={e => setCompanyInfo({ ...companyInfo, cusPosition: e.target.value })}
                placeholder="Giám Đốc"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={companyInfo.cusEmail}
                onChange={e => setCompanyInfo({ ...companyInfo, cusEmail: e.target.value })}
                placeholder="example@email.com"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                SĐT <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={companyInfo.cusTel}
                onChange={e => setCompanyInfo({ ...companyInfo, cusTel: e.target.value })}
                placeholder="0xxxxxxxxx"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Website
              </label>
              <input
                type="url"
                value={companyInfo.cusWebsite}
                onChange={e => setCompanyInfo({ ...companyInfo, cusWebsite: e.target.value })}
                placeholder="https://example.com"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Fax
              </label>
              <input
                type="text"
                value={companyInfo.cusFax}
                onChange={e => setCompanyInfo({ ...companyInfo, cusFax: e.target.value })}
                placeholder="Số fax"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Số tài khoản
              </label>
              <input
                type="text"
                value={companyInfo.cusBankNumber}
                onChange={e => setCompanyInfo({ ...companyInfo, cusBankNumber: e.target.value })}
                placeholder="Số tài khoản ngân hàng"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Ngân hàng
              </label>
              <input
                type="text"
                value={companyInfo.cusBankAddress}
                onChange={e => setCompanyInfo({ ...companyInfo, cusBankAddress: e.target.value })}
                placeholder="Tên ngân hàng"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Ghi chú
              </label>
              <textarea
                value={companyInfo.cusNote}
                onChange={e => setCompanyInfo({ ...companyInfo, cusNote: e.target.value })}
                placeholder="Ghi chú thêm..."
                rows={2}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chọn gói sản phẩm */}
      {companyInfo.cusTax && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-blue-800 flex items-center gap-2">
              📦 Gói dịch vụ
            </h3>
            <button
              onClick={handleLoadProducts}
              disabled={loadingProducts}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {loadingProducts ? "⏳ Đang tải..." : "Chọn gói"}
          </button>
          </div>
          <div className="text-xs text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 rounded p-2">
            <p className="mb-1">
              ℹ️ <strong>Lưu ý:</strong> Chỉ được chọn tối đa <strong className="text-blue-600">1 gói hóa đơn</strong> + <strong className="text-orange-600">1 dịch vụ</strong>
            </p>
            <p className="text-gray-500">
              → Có thể chọn: <strong>1 gói + 1 dịch vụ</strong> | <strong>Chỉ 1 gói</strong> | <strong>Chỉ 1 dịch vụ</strong>
            </p>
          </div>

          {selectedProducts.length > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-green-300">
                    <th className="text-left py-2 px-2">Mã SP</th>
                    <th className="text-left py-2 px-2">Tên sản phẩm</th>
                    <th className="text-center py-2 px-2">SL</th>
                    <th className="text-right py-2 px-2">Đơn giá</th>
                    <th className="text-center py-2 px-2">Tờ HĐ</th>
                    <th className="text-right py-2 px-2">Thành tiền</th>
                    <th className="text-center py-2 px-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((p, idx) => {
                    const isPackage = p.itemUnitName === "Gói";
                    return (
                      <tr key={idx} className={`border-b border-green-200 hover:bg-green-100 ${isPackage ? "bg-blue-50" : "bg-orange-50"}`}>
                        <td className="py-2 px-2">{p.itemID}</td>
                        <td className="py-2 px-2">
                          {p.itemName}
                          {isPackage ? (
                            <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Gói HĐ</span>
                          ) : (
                            <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">Dịch vụ</span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={p.Quantity}
                            onChange={(e) => handleQuantityChange(p.itemID, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="py-2 px-2 text-right">{(p.itemPrice || 0).toLocaleString()}</td>
                        <td className="py-2 px-2 text-center font-semibold text-blue-600">
                          {p.itemPerBox > 0 ? p.itemPerBox : "-"}
                        </td>
                        <td className="py-2 px-2 text-right font-semibold">{p.TotalAmount.toLocaleString()}</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleRemoveProduct(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ❌
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-green-100 font-semibold">
                    <td colSpan={5} className="py-2 px-2 text-right">Tổng số hóa đơn:</td>
                    <td className="py-2 px-2 text-right text-blue-700">
                      {selectedProducts.reduce((sum, p) => sum + (p.itemPerBox > 0 ? p.itemPerBox * p.Quantity : 0), 0).toLocaleString()} tờ
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-green-100 font-semibold">
                    <td colSpan={5} className="py-2 px-2 text-right">Tổng tiền:</td>
                    <td className="py-2 px-2 text-right text-green-700">
                      {selectedProducts.reduce((sum, p) => sum + p.TotalAmount, 0).toLocaleString()} đ
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center">
              <p className="text-gray-500 text-sm">
                Chưa chọn gói dịch vụ nào. Vui lòng bấm <strong>"Chọn gói"</strong> để thêm.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mẫu số, Ký hiệu, Từ số, Đến số, Mã nhân viên */}
      {selectedProducts.length > 0 && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Mẫu số <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.invSample}
                onChange={e => setForm({ ...form, invSample: e.target.value })}
                placeholder="VD: 01GTKT0/001"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Ký hiệu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.invSign}
                onChange={e => setForm({ ...form, invSign: e.target.value })}
                placeholder="VD: AA/24E"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Từ số <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
              value={form.invFrom} 
              onChange={e => setForm({ ...form, invFrom: e.target.value })} 
                placeholder="VD: 1"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Đến số <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
              value={form.invTo} 
              onChange={e => setForm({ ...form, invTo: e.target.value })} 
                placeholder="VD: 1000"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Mã nhân viên
              </label>
              <input
                type="text"
            value={form.userCode} 
            onChange={e => setForm({ ...form, userCode: e.target.value })} 
            placeholder="Nhập mã NVKD"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
        </div>
      )}

      {/* Action Button */}
      {selectedProducts.length > 0 && (
        <div className="flex justify-center pt-6 border-t mt-6">
        <button 
          onClick={submitExtend} 
            disabled={loading}
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-3 shadow-xl transition-all active:scale-95"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
            {loading ? "⏳ Đang xử lý..." : "Tạo đơn gia hạn"}
        </button>
      </div>
      )}

      {/* Result Message */}
      {msg && (
        <div className={`mt-4 p-4 rounded-lg ${msg.includes('❌') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
          <p className="text-sm font-medium">{msg}</p>
        </div>
      )}

      {/* Modal chọn gói */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold">📦 Chọn gói dịch vụ</h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  ℹ️ <strong>Lưu ý:</strong> Chỉ được chọn tối đa <strong>1 gói hóa đơn</strong> và <strong>1 dịch vụ</strong>.
                </p>
              </div>

              {/* Gói Hóa Đơn */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3 text-blue-700">📄 Gói Hóa Đơn</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableProducts
                    .filter((p: any) => p.productCategory === "INVOICE")
                    .map((product: any) => {
                      const isSelected = selectedProducts.some((p) => p.itemID === product.itemID);
                      return (
                        <div
                          key={product.itemID}
                          onClick={() => handleProductSelect(product)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-blue-50 border-blue-500 shadow-md"
                              : "bg-white border-gray-300 hover:border-blue-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-sm">{product.itemName}</h5>
                            {isSelected && <span className="text-blue-600 text-xl">✓</span>}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{product.itemID}</p>
                          <div className="text-sm">
                            <p className="text-green-600 font-semibold">
                              {product.itemPrice?.toLocaleString()} đ
                            </p>
                            {product.itemPerBox > 0 && (
                              <p className="text-gray-500 text-xs">
                                {product.itemPerBox.toLocaleString()} tờ/hộp
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Gói TVAN */}
              <div>
                <h4 className="font-semibold text-lg mb-3 text-green-700">🔐 Gói Dịch Vụ</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableProducts
                    .filter((p: any) => p.productCategory === "TVAN")
                    .map((product: any) => {
                      const isSelected = selectedProducts.some((p) => p.itemID === product.itemID);
                      return (
                        <div
                          key={product.itemID}
                          onClick={() => handleProductSelect(product)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected
                              ? "bg-green-50 border-green-500 shadow-md"
                              : "bg-white border-gray-300 hover:border-green-300 hover:shadow-sm"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-semibold text-sm">{product.itemName}</h5>
                            {isSelected && <span className="text-green-600 text-xl">✓</span>}
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{product.itemID}</p>
                          <div className="text-sm">
                            <p className="text-green-600 font-semibold">
                              {product.itemPrice?.toLocaleString()} đ
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Đã chọn: <strong>{selectedProducts.length}</strong> gói
              </p>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
