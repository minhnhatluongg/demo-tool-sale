import React, { useState } from "react";
import FormField from "../components/FormField";
import api from "../api/apiClient";
import {
  RenewContractRequest,
  RenewContractResponse,
  RenewContractProduct,
  SelectedProduct,
  ContractInfo,
  OIDInfo,
} from "../types";

interface ContractFullInfo {
  cusTax: string;
  cusCMND_ID: string;
  cusEmail: string;
  cusTel: string;
  cusBankNumber: string;
  cusBankAddress: string;
  cusFax: string;
  cusWebsite: string;
  sName: string;
  address: string;
  merchantID: string;
  oid: string;
  invcSample: string;
  invcSign: string;
  oDate?: string;
  descrip?: string;
  cusPeople_Sign?: string;
  contractRange?: {
    oid: string;
    invcSample: string;
    invcSign: string;
    invcFrm: number;
    invcEnd: number;
    crt_User: string;
  };
  samples: any[];
  products: any[];
}

export default function RenewContract() {
  // Form state
  const [cusTax, setCusTax] = useState("");
  const [saleEmID, setSaleEmID] = useState("");

  // OID Selection
  const [oidList, setOidList] = useState<OIDInfo[]>([]);
  const [selectedOID, setSelectedOID] = useState("");

  // Company data from API
  const [companyData, setCompanyData] = useState<ContractFullInfo | null>(null);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [currentInvcRemn, setCurrentInvcRemn] = useState<number>(0); // Số HD còn lại từ sample
  const [availableSamples, setAvailableSamples] = useState<any[]>([]); // Danh sách samples từ API
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0); // Sample đang chọn

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingOIDs, setLoadingOIDs] = useState(false);
  const [loadingContract, setLoadingContract] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [msg, setMsg] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);

  // Additional form fields
  const [additionalInfo, setAdditionalInfo] = useState({
    cusPeopleSign: "",
    cusPositionBySign: "Giám Đốc",
    descriptCus: "",
    dateBusLicence: new Date().toISOString().split("T")[0],
    refeContractDate: new Date().toISOString().split("T")[0],
    invFrom: "",
    invTo: "",
  });
  const [isEditingInvoiceRange, setIsEditingInvoiceRange] = useState(false); // Cho phép edit Từ số/Đến số

  // Step 1: Fetch list of OIDs by MST
  const handleFetchOIDList = async () => {
    if (!cusTax.trim()) {
      setMsg("❌ Vui lòng nhập Mã số thuế!");
      return;
    }

    setLoadingOIDs(true);
    setMsg("");
    setOidList([]);
    setSelectedOID("");
    setCompanyData(null);
    setContractInfo(null);
    setSelectedProducts([]);

    try {
      const res = await api.get(
        `/tax/get-oid-list-by-mst?mst=${cusTax.trim()}`
      );

      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setOidList(res.data.data);
        setMsg(`✅ Tìm thấy ${res.data.data.length} hợp đồng!`);
      } else {
        setMsg("❌ Không tìm thấy hợp đồng nào cho MST này!");
        setOidList([]);
      }
    } catch (e: any) {
      setMsg(
        `❌ ${
          e.response?.data?.message ||
          e.message ||
          "Lỗi khi tải danh sách hợp đồng"
        }`
      );
      setOidList([]);
    } finally {
      setLoadingOIDs(false);
    }
  };

  // Step 2: Fetch full contract info by selected OID
  const handleLoadContractByOID = async (oid: string) => {
    if (!oid) return;

    setLoadingContract(true);
    setMsg("");
    setSelectedOID(oid);

    try {
      const res = await api.get(`/tax/get-full-info-by-oid?oid=${oid}`);

      if (res.data.success && res.data.data) {
        const data: ContractFullInfo = res.data.data;
        setCompanyData(data);

        // Auto-fill fields
        setAdditionalInfo((prev) => ({
          ...prev,
          cusPeopleSign: data.cusPeople_Sign || "",
          descriptCus: data.descrip || "",
        }));

        // Store all samples from API
        setAvailableSamples(data.samples || []);

        // Find sample with highest invcRemn (remaining invoices)
        let bestIndex = 0;
        let maxRemaining = -1;
        if (data.samples && data.samples.length > 0) {
          data.samples.forEach((sample: any, idx: number) => {
            if (sample.invcRemn > maxRemaining) {
              maxRemaining = sample.invcRemn;
              bestIndex = idx;
            }
          });
          setSelectedSampleIndex(bestIndex);
        }

        const selectedSample = data.samples && data.samples[bestIndex];

        // Tìm invcEnd từ products (số cuối của HĐ)
        let maxInvcEnd = 0;
        if (data.products && data.products.length > 0) {
          console.log('🔍 Checking products for invcEnd:', data.products);
          data.products.forEach((product: any) => {
            console.log(`  Product ${product.itemID}: invcEnd=${product.invcEnd}`);
            if (product.invcEnd && product.invcEnd > maxInvcEnd) {
              maxInvcEnd = product.invcEnd;
            }
          });
          console.log(`📊 Max invcEnd from products: ${maxInvcEnd}`);
        }

        // Set contract information from contractRange OR from selected sample
        if (data.contractRange) {
          console.log('📋 contractRange:', data.contractRange);
          const invcEnd = data.contractRange.invcEnd || maxInvcEnd;
          console.log(`✅ Using invcEnd: ${invcEnd} (contractRange: ${data.contractRange.invcEnd}, maxInvcEnd: ${maxInvcEnd})`);
          setContractInfo({
            oid: data.oid,
            cusName: data.sName,
            cusTax: data.cusTax,
            cusAddress: data.address,
            oDate: data.oDate || "",
            invcSample: data.contractRange.invcSample,
            invcSign: data.contractRange.invcSign,
            invcRemn: invcEnd, // Lưu invcEnd vào đây
          });
          setCurrentInvcRemn(invcEnd); // Dùng invcEnd thay vì invcRemn
          console.log(`✅ Chọn sample: ${data.contractRange.invcSign}, invcEnd: ${invcEnd}`);
        } else if (selectedSample) {
          // Dùng maxInvcEnd từ products nếu có, nếu không thì dùng invcRemn
          const invcEnd = maxInvcEnd > 0 ? maxInvcEnd : selectedSample.invcRemn;
          console.log(`✅ Using invcEnd from sample: ${invcEnd} (maxInvcEnd: ${maxInvcEnd}, invcRemn: ${selectedSample.invcRemn})`);
          setContractInfo({
            oid: data.oid || "",
            cusName: data.sName,
            cusTax: data.cusTax,
            cusAddress: data.address,
            oDate: data.oDate || "",
            invcSample: selectedSample.sampleCode,
            invcSign: selectedSample.govInvcSign,
            invcRemn: invcEnd, // Lưu invcEnd
          });
          setCurrentInvcRemn(invcEnd); // Dùng invcEnd
          console.log(
            `✅ Chọn sample: ${selectedSample.govInvcSign}, invcEnd: ${invcEnd}, invcRemn: ${selectedSample.invcRemn} HD`
          );
        }

        // Load available products
        await handleLoadProducts();

        setMsg("✅ Đã tải thông tin hợp đồng thành công!");
      } else {
        setMsg("❌ Không tải được thông tin hợp đồng!");
      }
    } catch (e: any) {
      setMsg(
        `❌ ${
          e.response?.data?.message ||
          e.message ||
          "Lỗi khi tải thông tin hợp đồng"
        }`
      );
      setCompanyData(null);
      setContractInfo(null);
    } finally {
      setLoadingContract(false);
    }
  };

  // Load available products (both invoice packages and TVAN)
  const handleLoadProducts = async () => {
    setLoadingProducts(true);
    try {
      // Load cả gói hóa đơn (onlyTVAN=0) và gói TVAN (onlyTVAN=1)
      const [invoiceRes, tvanRes] = await Promise.all([
        api.get("/odoo/orders/get-products?onlyTVAN=0"),
        api.get("/odoo/orders/get-products?onlyTVAN=1"),
      ]);

      const invoiceProducts = invoiceRes.data.success
        ? invoiceRes.data.data
        : [];
      const tvanProducts = tvanRes.data.success ? tvanRes.data.data : [];

      // Merge và đánh dấu loại sản phẩm
      const allProducts = [
        ...invoiceProducts.map((p: any) => ({
          ...p,
          productCategory: "INVOICE",
        })),
        ...tvanProducts.map((p: any) => ({ ...p, productCategory: "TVAN" })),
      ];

      setAvailableProducts(allProducts);
    } catch (e: any) {
      console.error("Error loading products:", e);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle product selection with validation
  const handleProductSelect = (
    product: SelectedProduct & { productCategory?: string }
  ) => {
    const exists = selectedProducts.find((p) => p.itemID === product.itemID);

    if (exists) {
      // Bỏ chọn
      setSelectedProducts(
        selectedProducts.filter((p) => p.itemID !== product.itemID)
      );
    } else {
      // Kiểm tra nghiệp vụ: Chỉ cho chọn TỐI ĐA 1 gói hóa đơn
      const currentInvoiceCount = selectedProducts.filter(
        (p: any) => p.productCategory === "INVOICE"
      ).length;

      if (product.productCategory === "INVOICE" && currentInvoiceCount >= 1) {
        setMsg(
          "❌ Chỉ được chọn tối đa 1 gói hóa đơn! Bạn có thể chọn thêm gói TVAN."
        );
        return;
      }

      setSelectedProducts([...selectedProducts, product]);
      setMsg(""); // Clear message
    }
  };

  // Handle quantity change
  const handleQuantityChange = (itemID: string, quantity: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) =>
        p.itemID === itemID
          ? { ...p, Quantity: quantity, TotalAmount: p.itemPrice * quantity }
          : p
      )
    );
  };

  // Handle sample change
  const handleSampleChange = (newIndex: number) => {
    setSelectedSampleIndex(newIndex);
    const newSample = availableSamples[newIndex];
    if (newSample && contractInfo && companyData) {
      // Tìm invcEnd từ products tương ứng với sample này
      let invcEnd = 0;
      if (companyData.products && companyData.products.length > 0) {
        const matchingProduct = companyData.products.find((p: any) => 
          p.invcEnd && p.invcEnd > 0
        );
        invcEnd = matchingProduct ? matchingProduct.invcEnd : newSample.invcRemn;
      } else {
        invcEnd = newSample.invcRemn;
      }
      
      setContractInfo({
        ...contractInfo,
        invcSample: newSample.sampleCode,
        invcSign: newSample.govInvcSign,
        invcRemn: invcEnd, // Dùng invcEnd
      });
      setCurrentInvcRemn(invcEnd);
      console.log(`🔄 Đổi sang sample: ${newSample.govInvcSign}, invcEnd: ${invcEnd}, invcRemn: ${newSample.invcRemn} HD`);
    }
  };

  // Calculate invoice range when products change
  React.useEffect(() => {
    if (selectedProducts.length > 0 && currentInvcRemn >= 0) {
      const totalInvoices = selectedProducts.reduce((sum, p) => {
        return sum + (p.itemPerBox || 0) * (p.Quantity || 1);
      }, 0);

      // Từ số = invcEnd + 1
      // Đến số = invcEnd + tổng số tờ hóa đơn
      setAdditionalInfo((prev) => ({
        ...prev,
        invFrom: (currentInvcRemn + 1).toString(),
        invTo: (currentInvcRemn + totalInvoices).toString(),
      }));
    }
  }, [selectedProducts, currentInvcRemn]);

  // Submit extend invoice range (Thêm số)
  const handleExtendInvoiceRange = async () => {
    if (!companyData || !contractInfo) {
      setMsg("❌ Vui lòng tải thông tin công ty trước!");
      return;
    }

    if (selectedProducts.length === 0) {
      setMsg("❌ Vui lòng chọn ít nhất một sản phẩm!");
      return;
    }

    if (!saleEmID.trim()) {
      setMsg("❌ Vui lòng nhập Mã nhân viên!");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const payload = {
        TaxCode: companyData.cusTax,
        InvSample: contractInfo.invcSample,
        InvSign: contractInfo.invcSign,
        OldToNo: contractInfo.invcRemn,
        NewToNo: parseInt(additionalInfo.invTo) || 0,
        UserName: saleEmID.trim(),
        Products: selectedProducts.map((p) => ({
          ProductCode: p.itemID,
          ProductName: p.itemName,
          Uom: p.itemUnitName,
          Qty: p.Quantity,
          Price: p.itemPrice,
          VatRate: "8%",
          VatName: "VAT 8%",
        })),
      };

      const res = await api.post("/odoo/orders/extendRange", payload);
      setMsg(`✅ ${res.data.message || "Thêm số thành công!"}`);

      // Reset after success
      setTimeout(() => {
        resetForm();
      }, 3000);
    } catch (e: any) {
      const errorMsg =
        e.response?.data?.message || e.message || "Lỗi khi thêm số hóa đơn";
      setMsg(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Submit contract renewal (Vào Odoo)
  const handleSubmitRenewal = async () => {
    if (!companyData || !contractInfo) {
      setMsg("❌ Vui lòng tải thông tin công ty trước!");
      return;
    }

    if (selectedProducts.length === 0) {
      setMsg("❌ Vui lòng chọn ít nhất một sản phẩm!");
      return;
    }

    if (!saleEmID.trim()) {
      setMsg("❌ Vui lòng nhập Mã nhân viên!");
      return;
    }

    if (!additionalInfo.cusPeopleSign.trim()) {
      setMsg("❌ Vui lòng nhập Người ký hợp đồng!");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      // Build request payload matching backend model
      const products: RenewContractProduct[] = selectedProducts.map((p) => ({
        ItemID: p.itemID,
        ItemName: p.itemName,
        ItemUnit: p.itemUnit || "",
        ItemUnitName: p.itemUnitName,
        ItemPrice: p.itemPrice,
        ItemQtty: p.Quantity || 1,
        VAT_Rate: 8, // Default 8% VAT
        Sum_Amnt: p.TotalAmount || p.itemPrice,
        ItemPerBox: p.itemPerBox,
        InvcSample: contractInfo.invcSample,
        InvcSign: contractInfo.invcSign,
        InvcFrm: parseInt(additionalInfo.invFrom) || 1,
        InvcEnd: parseInt(additionalInfo.invTo) || 1,
      }));

      const payload: RenewContractRequest = {
        CusName: companyData.sName,
        CusAddress: companyData.address,
        CusTax: companyData.cusTax,
        CusCMND_ID: companyData.cusCMND_ID || "",
        CusTel: companyData.cusTel || "",
        CusEmail: companyData.cusEmail || "",
        CusPeopleSign: additionalInfo.cusPeopleSign,
        CusPositionBySign: additionalInfo.cusPositionBySign,
        CusBankNumber: companyData.cusBankNumber || "",
        CusBankAddress: companyData.cusBankAddress || "",
        CusFax: companyData.cusFax || "",
        CusWebsite: companyData.cusWebsite || "",
        DescriptCus: additionalInfo.descriptCus,
        SampleID: `${contractInfo.invcSample} - 1 - ${contractInfo.invcSign}`, // Format: "34950 - 1 - C25TSA"
        OIDContract: selectedOID, // Lấy từ OID đã chọn, không phải từ API (vì API trả null)
        DateBusLicence: additionalInfo.dateBusLicence,
        RefeContractDate: additionalInfo.refeContractDate,
        SaleEmID: saleEmID.trim(),
        InvcSample: contractInfo.invcSample,
        InvcSign: contractInfo.invcSign,
        InvFrom: parseInt(additionalInfo.invFrom) || 1,
        InvTo: parseInt(additionalInfo.invTo) || 1,
        InvcRemn: currentInvcRemn, // Số HD còn lại hiện tại
        CmpnTax: "0312303803", // WIN TECH SOLUTION tax code
        Products: products,
      };

      const res = await api.post<RenewContractResponse>(
        "/contracts/create-renew",
        payload
      );

      if (res.data.success) {
        setMsg(
          `✅ ${res.data.message}\n🔖 Mã HĐ mới: ${res.data.newOID}\n📋 Mã Job: ${res.data.jobOid}`
        );

        // Reset form after success
        setTimeout(() => {
          resetForm();
        }, 3000);
      } else {
        setMsg(`❌ ${res.data.message}`);
      }
    } catch (e: any) {
      const errorMsg =
        e.response?.data?.message ||
        e.message ||
        "Lỗi khi tạo hợp đồng gia hạn";
      setMsg(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCusTax("");
    setSaleEmID("");
    setOidList([]);
    setSelectedOID("");
    setCompanyData(null);
    setContractInfo(null);
    setSelectedProducts([]);
    setAdditionalInfo({
      cusPeopleSign: "",
      cusPositionBySign: "Giám Đốc",
      descriptCus: "",
      dateBusLicence: new Date().toISOString().split("T")[0],
      refeContractDate: new Date().toISOString().split("T")[0],
      invFrom: "",
      invTo: "",
    });
    setMsg("");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        🔄 Gia Hạn Hợp Đồng (Thêm Số Hóa Đơn)
      </h2>

      {/* Step 1: Enter Tax Code */}
      <div className="border rounded-lg p-4 mb-6 bg-blue-50">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          📝 Bước 1: Nhập Mã Số Thuế
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <FormField
              label="Mã số thuế (MST)"
              value={cusTax}
              onChange={(e) => setCusTax(e.target.value)}
              placeholder="Nhập MST (VD: 0123456789)"
            />
          </div>
          <button
            onClick={handleFetchOIDList}
            disabled={loadingOIDs}
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed h-10 transition-colors"
          >
            {loadingOIDs ? "Đang tải..." : "🔍 Lấy danh sách HĐ"}
          </button>
        </div>
      </div>

      {/* Step 1.5: Select OID from list */}
      {oidList.length > 0 && (
        <div className="border rounded-lg p-4 mb-6 bg-purple-50">
          <h3 className="text-lg font-semibold text-purple-800 mb-3">
            📋 Bước 2: Chọn Hợp Đồng
          </h3>
          <div className="space-y-2">
            {oidList.map((item) => (
              <div
                key={item.oid}
                className={`p-3 border rounded cursor-pointer transition-all ${
                  selectedOID === item.oid
                    ? "bg-purple-200 border-purple-500 shadow-md"
                    : "bg-white hover:bg-purple-100 border-gray-300"
                }`}
                onClick={() => handleLoadContractByOID(item.oid)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {item.oid}
                      {selectedOID === item.oid && (
                        <span className="ml-2 text-purple-600">✓ Đã chọn</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Ngày tạo: {item.createdAt} | Mẫu: {item.invcSign} | Ký
                      hiệu: {item.invcSample}
                    </p>
                  </div>
                  {loadingContract && selectedOID === item.oid && (
                    <div className="ml-3">
                      <svg
                        className="animate-spin h-5 w-5 text-purple-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Display Company Info & Contract */}
      {companyData && contractInfo && (
        <div className="border rounded-lg p-4 mb-6 bg-green-50">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            ✅ Bước 3: Thông Tin Hợp Đồng Hiện Tại
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-gray-500">Tên công ty</p>
              <p className="font-semibold text-gray-800">{companyData.sName}</p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-gray-500">Mã số thuế</p>
              <p className="font-semibold text-gray-800">
                {companyData.cusTax}
              </p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-gray-500">Địa chỉ</p>
              <p className="font-semibold text-gray-800 text-sm">
                {companyData.address}
              </p>
            </div>
            <div className="bg-white p-3 rounded border">
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-gray-800">
                {companyData.cusEmail}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <h4 className="font-semibold text-yellow-800 mb-3">
              📄 Hợp đồng gốc
            </h4>
            
            {/* Sample Selector */}
            {availableSamples.length > 1 && (
              <div className="mb-3 p-2 bg-white rounded border border-yellow-300">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Chọn mẫu hóa đơn ({availableSamples.length} mẫu):
                </label>
                <select
                  value={selectedSampleIndex}
                  onChange={(e) => handleSampleChange(Number(e.target.value))}
                  className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  {availableSamples.map((sample, idx) => (
                    <option key={sample.sampleID} value={idx}>
                      {sample.govInvcSign} ({sample.sampleCode}) - Còn lại {sample.invcRemn} Số Hóa Đơn
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Mã HĐ:</p>
                <p className="font-semibold">{selectedOID}</p>
              </div>
              <div>
                <p className="text-gray-600">Mẫu HĐ:</p>
                <p className="font-semibold">{contractInfo.invcSample}</p>
              </div>
              <div>
                <p className="text-gray-600">Ký hiệu:</p>
                <p className="font-semibold">{contractInfo.invcSign}</p>
              </div>
              <div>
                <p className="text-gray-600">Số HĐ hiện tại:</p>
                <p className="font-semibold text-red-600">
                  1 - {contractInfo.invcRemn}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Select Products */}
      {companyData && (
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📦 Bước 4: Chọn Gói Sản Phẩm
          </h3>

          <button
            onClick={() => setShowProductModal(true)}
            className="mb-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            ➕ Chọn sản phẩm
          </button>

          {selectedProducts.length > 0 && (
            <div className="space-y-2">
              {selectedProducts.map((product) => (
                <div
                  key={product.itemID}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded border"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">
                      {product.itemName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Mã: {product.itemID} | Đơn vị: {product.itemUnitName} |
                      Giá: {product.itemPrice.toLocaleString("vi-VN")} VNĐ |
                      HĐ/gói: {product.itemPerBox}
                    </p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={product.Quantity}
                    onChange={(e) =>
                      handleQuantityChange(
                        product.itemID,
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-20 border rounded px-2 py-1 text-center"
                  />
                  <button
                    onClick={() => handleProductSelect(product)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
                <p className="text-sm font-semibold text-blue-800">
                  📊 Tổng số HĐ gia hạn:{" "}
                  {selectedProducts.reduce(
                    (sum, p) => sum + (p.itemPerBox || 0) * (p.Quantity || 1),
                    0
                  )}{" "}
                  HĐ
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Additional Information */}
      {companyData && selectedProducts.length > 0 && (
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            📋 Bước 5: Thông Tin Bổ Sung
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField
              label="Người ký hợp đồng *"
              value={additionalInfo.cusPeopleSign}
              onChange={(e) =>
                setAdditionalInfo({
                  ...additionalInfo,
                  cusPeopleSign: e.target.value,
                })
              }
              placeholder="Nhập tên người ký"
            />
            <FormField
              label="Chức vụ"
              value={additionalInfo.cusPositionBySign}
              onChange={(e) =>
                setAdditionalInfo({
                  ...additionalInfo,
                  cusPositionBySign: e.target.value,
                })
              }
              placeholder="Giám Đốc"
            />
            <FormField
              label="Mã nhân viên kinh doanh *"
              value={saleEmID}
              onChange={(e) => setSaleEmID(e.target.value)}
              placeholder="Nhập mã NVKD (VD: 000001)"
            />
            <FormField
              label="Ngày cấp GPKD"
              type="date"
              value={additionalInfo.dateBusLicence}
              onChange={(e) =>
                setAdditionalInfo({
                  ...additionalInfo,
                  dateBusLicence: e.target.value,
                })
              }
            />
            <FormField
              label="Ngày tham chiếu HĐ"
              type="date"
              value={additionalInfo.refeContractDate}
              onChange={(e) =>
                setAdditionalInfo({
                  ...additionalInfo,
                  refeContractDate: e.target.value,
                })
              }
            />
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Mô tả
            </label>
            <textarea
              value={additionalInfo.descriptCus}
              onChange={(e) =>
                setAdditionalInfo({
                  ...additionalInfo,
                  descriptCus: e.target.value,
                })
              }
              placeholder="Nhập mô tả hợp đồng..."
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-green-800">
                📊 Phạm vi số hóa đơn mới
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingInvoiceRange(!isEditingInvoiceRange)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  isEditingInvoiceRange
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-blue-600 border border-blue-300 hover:bg-blue-50"
                }`}
              >
                {isEditingInvoiceRange ? "✓ Xong" : "✏️ Chỉnh sửa"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Từ số"
                value={additionalInfo.invFrom}
                onChange={(e) =>
                  setAdditionalInfo({
                    ...additionalInfo,
                    invFrom: e.target.value,
                  })
                }
                placeholder="Tự động tính"
                disabled={!isEditingInvoiceRange}
              />
              <FormField
                label="Đến số"
                value={additionalInfo.invTo}
                onChange={(e) =>
                  setAdditionalInfo({
                    ...additionalInfo,
                    invTo: e.target.value,
                  })
                }
                placeholder="Tự động tính"
                disabled={!isEditingInvoiceRange}
              />
            </div>
            {currentInvcRemn > 0 && (
              <p className="text-xs text-gray-600 mt-2">
                💡 <strong>Công thức:</strong> Từ số = InvcEnd({currentInvcRemn}) + 1 ={" "}
                {currentInvcRemn + 1} | Đến số = InvcEnd({currentInvcRemn}) + Tổng số tờ HĐ
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {companyData && selectedProducts.length > 0 && (
        <div className="flex justify-center gap-3 pt-4 border-t">
          <button
            onClick={resetForm}
            className="px-6 py-3 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition-colors"
          >
            🔄 Làm mới
          </button>
          <button
            onClick={handleExtendInvoiceRange}
            disabled={loading}
            className="px-8 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            {loading ? "Đang xử lý..." : "📊 Thêm số"}
          </button>
          <button
            onClick={handleSubmitRenewal}
            disabled={loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {loading ? "Đang xử lý..." : "🌐 Vào Odoo"}
          </button>
        </div>
      )}

      {/* Result Message */}
      {msg && (
        <div
          className={`mt-6 p-4 rounded-lg ${
            msg.includes("❌")
              ? "bg-red-100 text-red-700 border border-red-300"
              : "bg-green-100 text-green-700 border border-green-300"
          }`}
        >
          <p className="text-sm whitespace-pre-line font-medium">{msg}</p>
        </div>
      )}

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-gray-800">
                  📦 Danh sách sản phẩm
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm theo mã gói hoặc tên gói..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full border rounded-md px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute right-3 top-2.5 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-xs text-yellow-800">
                    ⚠️ <strong>Quy tắc:</strong> Chỉ được chọn{" "}
                    <strong>TỐI ĐA 1 gói Hóa đơn</strong>, nhưng có thể chọn
                    nhiều gói TVAN kèm theo.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="overflow-y-auto flex-1"
              style={{ maxHeight: "calc(85vh - 280px)" }}
            >
              {loadingProducts ? (
                <div className="flex justify-center items-center py-8">
                  <svg
                    className="animate-spin h-8 w-8 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : (
                <div className="relative">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100 sticky top-0 z-10">
                      <tr>
                        <th className="p-2 text-left w-10 border-b-2 border-gray-300">
                          <input type="checkbox" className="w-4 h-4" />
                        </th>
                        <th className="p-2 text-left border-b-2 border-gray-300">
                          Loại
                        </th>
                        <th className="p-2 text-left border-b-2 border-gray-300">
                          Mã gói
                        </th>
                        <th className="p-2 text-left border-b-2 border-gray-300">
                          Đơn vị
                        </th>
                        <th className="p-2 text-left border-b-2 border-gray-300">
                          Tên gói
                        </th>
                        <th className="p-2 text-center border-b-2 border-gray-300">
                          Tồ hóa đơn
                        </th>
                        <th className="p-2 text-center border-b-2 border-gray-300">
                          Số lượng
                        </th>
                        <th className="p-2 text-right border-b-2 border-gray-300">
                          Thành tiền
                        </th>
                        <th className="p-2 text-center border-b-2 border-gray-300">
                          VAT
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableProducts
                        .filter(
                          (p) =>
                            !searchProduct ||
                            p.itemID
                              ?.toLowerCase()
                              .includes(searchProduct.toLowerCase()) ||
                            p.itemName
                              ?.toLowerCase()
                              .includes(searchProduct.toLowerCase())
                        )
                        .map((product: any) => {
                          const isSelected = selectedProducts.some(
                            (p) => p.itemID === product.itemID
                          );
                          const selectedProd = selectedProducts.find(
                            (p) => p.itemID === product.itemID
                          );

                          const isInvoiceProduct =
                            product.productCategory === "INVOICE";
                          const isTvanProduct =
                            product.productCategory === "TVAN";

                          return (
                            <tr
                              key={`${product.itemID}-${product.productCategory}`}
                              className={`border-b hover:bg-gray-50 ${
                                isSelected ? "bg-blue-50" : ""
                              }`}
                            >
                              <td className="p-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    const selectedProduct: any = {
                                      itemID: product.itemID,
                                      itemName: product.itemName,
                                      itemUnit: product.itemUnit,
                                      itemUnitName:
                                        product.itemUnitName || "Gói",
                                      itemPerBox: product.itemPerBox || 0,
                                      itemPrice: product.itemPrice || 0,
                                      Quantity: 1,
                                      TotalAmount: product.itemPrice || 0,
                                      productCategory: product.productCategory,
                                    };
                                    handleProductSelect(selectedProduct);
                                  }}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="p-2">
                                {isInvoiceProduct && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                    HĐ
                                  </span>
                                )}
                                {isTvanProduct && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                                    TVAN
                                  </span>
                                )}
                              </td>
                              <td className="p-2 font-mono text-blue-600">
                                {product.itemID}
                              </td>
                              <td className="p-2">
                                {product.itemUnitName || "Gói"}
                              </td>
                              <td className="p-2 font-medium whitespace-pre-line">
                                {product.itemName}
                              </td>
                              <td className="p-2 text-center text-orange-600 font-semibold">
                                {(product.itemPerBox || 0).toLocaleString()}
                              </td>
                              <td className="p-2 text-center">
                                {isSelected ? (
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedProd?.Quantity || 1}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        product.itemID,
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                    className="w-16 border rounded px-2 py-1 text-center"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                ) : (
                                  <span className="text-gray-400">1</span>
                                )}
                              </td>
                              <td className="p-2 text-right font-semibold">
                                {isSelected
                                  ? (
                                      selectedProd?.TotalAmount || 0
                                    ).toLocaleString("vi-VN")
                                  : (product.itemPrice || 0).toLocaleString(
                                      "vi-VN"
                                    )}
                              </td>
                              <td className="p-2 text-center text-gray-600">
                                {product.vaT_Rate}%
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loadingProducts && availableProducts.length === 0 && (
                <div className="p-8 text-center">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-300 mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <p className="text-gray-500">Không có sản phẩm nào</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-semibold text-gray-700">
                      📦 Đã chọn:{" "}
                      <span className="text-blue-600">
                        {selectedProducts.length}
                      </span>{" "}
                      sản phẩm
                    </span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-gray-500">
                      Tổng:{" "}
                      <span className="font-semibold text-gray-700">
                        {availableProducts.length}
                      </span>{" "}
                      sản phẩm
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-600">
                      💰 Tổng tiền:{" "}
                      {selectedProducts
                        .reduce((sum, p) => sum + (p.TotalAmount || 0), 0)
                        .toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="font-semibold text-orange-600">
                      📊 Tổng HĐ:{" "}
                      {selectedProducts
                        .reduce(
                          (sum, p) =>
                            sum + (p.itemPerBox || 0) * (p.Quantity || 1),
                          0
                        )
                        .toLocaleString()}{" "}
                      HĐ
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
