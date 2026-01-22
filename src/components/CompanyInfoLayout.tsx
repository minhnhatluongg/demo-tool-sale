import React, { useState } from "react";
import FormField from "./FormField";
import api from "../api/apiClient";
import ProductSelectionModal from "./ProductSelectionModal";
import { SelectedProduct, FullInfoResponse, OIDInfo } from "../types";

interface CompanyInfoLayoutProps {
  loaiCap: 0 | 1 | 2; // 0: Đăng ký TK, 1: Phát hành mẫu, 2: Gia hạn
  onDataLoaded?: (
    data: FullInfoResponse,
    products: SelectedProduct[],
    currentSampleRemaining: number
  ) => void;
  readonlyProducts?: boolean; // Nếu true thì không cho xóa/chỉnh sửa sản phẩm
  hideCheckboxes?: boolean; // Ẩn phần cấu hình hóa đơn
}

export default function CompanyInfoLayout({
  loaiCap,
  onDataLoaded,
  readonlyProducts = false,
  hideCheckboxes = false,
}: CompanyInfoLayoutProps) {
  const [form, setForm] = useState({
    cusTax: "",
    cusCMND_ID: "",
    cusName: "",
    cusAddress: "",
    cusEmail: "",
    cusTel: "",
    cusContactName: "",
    cusContactJob: "Giám Đốc",
    cusBankNo: "",
    cusBankTitle: "",
    cusWebsite: "",
    cusFax: "",
    description: "",

    // Checkboxes
    isHDVCNB: false,
    isTemVe: false,
    isHDBH: false,
    isHDVAT: true,
    isKyTaiMayKhach: true,
    isMauDaThueSuat: false,
    isMauChuyenDoi: false,
    isMauTT32Old: false,
    isMauTT32New: false,
    isNhapGiaTruocVAT: false,
    isCsThuPhi: false,
    isSuDungDuLieuMauDeXem: false,
    isPhaiAnhSoKhiKy: true,
    isGuiMailTaiServer: true,
    isChungTuThue: false,
  });

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [isNewCustomer, setIsNewCustomer] = useState<boolean | null>(null);
  const [fullInfoData, setFullInfoData] = useState<FullInfoResponse | null>(
    null
  );
  const [selectedSampleIndex, setSelectedSampleIndex] = useState<number>(0);
  const [oidList, setOidList] = useState<OIDInfo[]>([]);
  const [selectedOID, setSelectedOID] = useState<string>("");

  const handleCheckbox = (field: string) => {
    setForm({ ...form, [field]: !form[field as keyof typeof form] });
  };

  const handleGetOIDList = async () => {
    if (!form.cusTax) {
      setMsg("❌ Vui lòng nhập MST/CCCD trước!");
      return;
    }

    setLoading(true);
    setMsg("");
    setOidList([]);
    setSelectedOID("");

    try {
      const res = await api.get("/tax/get-oid-list-by-mst", {
        params: { mst: form.cusTax },
      });

      if (res.data.success && res.data.data && res.data.data.length > 0) {
        setOidList(res.data.data);
        // Tự động chọn OID đầu tiên
        const firstOID = res.data.data[0].oid;
        setSelectedOID(firstOID);
        setMsg(
          `✅ Tìm thấy ${res.data.data.length} hợp đồng. Vui lòng chọn OID để xem chi tiết.`
        );
      } else {
        setMsg("⚠️ Không tìm thấy hợp đồng nào cho MST này");
      }
    } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCompanyInfo = async () => {
    if (!selectedOID) {
      setMsg("❌ Vui lòng chọn OID trước!");
      return;
    }

    setLoading(true);
    setMsg("");
    try {
      const res = await api.get("/tax/get-full-info-by-oid", {
        params: { oid: selectedOID },
      });

      if (res.data.success && res.data.data) {
        const data: FullInfoResponse = res.data.data;
        console.log("Company info data:", data);

        // Store full API response
        setFullInfoData(data);

        // Automatically select the sample with remaining invoices (invcRemn > 0)
        // This fixes the issue where it was always selecting the first sample
        let bestSampleIndex = 0;
        if (data.samples && data.samples.length > 0) {
          // Find the sample with the highest remaining invoices
          let maxRemaining = -1;
          data.samples.forEach((sample, idx) => {
            if (sample.invcRemn > maxRemaining) {
              maxRemaining = sample.invcRemn;
              bestSampleIndex = idx;
            }
          });
          setSelectedSampleIndex(bestSampleIndex);
          console.log(
            `Auto-selected sample: ${data.samples[bestSampleIndex].govInvcSign} with ${data.samples[bestSampleIndex].invcRemn} remaining invoices`
          );
        }

        setForm({
          ...form,
          cusTax: data.cusTax || form.cusTax,
          cusName: data.sName || "",
          cusAddress: data.address || "",
          cusEmail: data.cusEmail || "",
          cusTel: data.cusTel || "",
          cusBankNo: data.cusBankNumber || "",
          cusBankTitle: data.cusBankAddress || "",
          cusWebsite: data.cusWebsite || "",
          cusFax: data.cusFax || "",
          cusCMND_ID: data.cusCMND_ID || "",
          cusContactName: (data as any).cusPeople_Sign || "",
        });

        // Auto-populate products from API
        if (data.products && data.products.length > 0) {
          const autoProducts = data.products.map((p) => ({
            ...p,
            Quantity: 1,
            TotalAmount: p.itemPrice,
          }));
          setSelectedProducts(autoProducts);

          // Get current sample remaining count from the selected sample
          const currentRemaining =
            data.samples && data.samples.length > 0
              ? data.samples[bestSampleIndex].invcRemn
              : 0;

          // Callback to parent with data
          if (onDataLoaded) {
            onDataLoaded(data, autoProducts, currentRemaining);
          }
        }

        // Check if customer is new based on OID
        const isNew = !data.oid;
        setIsNewCustomer(isNew);

        setMsg(
          `✅ Đã tải thông tin công ty. ${
            isNew ? "Khách hàng MỚI" : "Khách hàng CŨ (OID: " + data.oid + ")"
          }`
        );
      } else {
        setMsg("⚠️ " + (res.data.message || "Không tìm thấy thông tin"));
      }
    } catch (e: any) {
      setMsg(`❌ ${e.response?.data?.message || e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleProductConfirm = (products: SelectedProduct[]) => {
    setSelectedProducts(products);
    if (products.length > 0) {
      setMsg(`✅ Đã chọn ${products.length} sản phẩm`);
      if (onDataLoaded) {
        // Với khách mới (không có fullInfoData), vẫn phải gọi callback
        const currentRemaining =
          fullInfoData?.samples && fullInfoData.samples.length > 0
            ? fullInfoData.samples[selectedSampleIndex].invcRemn
            : 0;
        const dataToSend = fullInfoData || {
          cusTax: form.cusTax,
          cusCMND_ID: form.cusCMND_ID || null,
          cusEmail: form.cusEmail,
          cusTel: form.cusTel,
          cusBankNumber: form.cusBankNo,
          cusBankAddress: form.cusBankTitle,
          cusFax: form.cusFax,
          cusWebsite: form.cusWebsite,
          sName: form.cusName,
          address: form.cusAddress,
          merchantID: "",
          oid: null,
          invcSample: null,
          invcSign: null,
          contractRange: null,
          samples: [],
          products: [],
        };
        onDataLoaded(dataToSend, products, currentRemaining);
      }
    }
  };

  const handleOpenProductModal = () => {
    if (readonlyProducts) return;
    setIsProductModalOpen(true);
  };

  const handleQuantityChange = (itemID: string, newQty: number) => {
    if (readonlyProducts) return;

    const updated = selectedProducts.map((p) =>
      p.itemID === itemID
        ? { ...p, Quantity: newQty, TotalAmount: (p.itemPrice || 0) * newQty }
        : p
    );
    setSelectedProducts(updated);

    if (onDataLoaded) {
      const currentRemaining =
        fullInfoData?.samples && fullInfoData.samples.length > 0
          ? fullInfoData.samples[selectedSampleIndex].invcRemn
          : 0;
      const dataToSend = fullInfoData || {
        cusTax: form.cusTax,
        cusCMND_ID: form.cusCMND_ID || null,
        cusEmail: form.cusEmail,
        cusTel: form.cusTel,
        cusBankNumber: form.cusBankNo,
        cusBankAddress: form.cusBankTitle,
        cusFax: form.cusFax,
        cusWebsite: form.cusWebsite,
        sName: form.cusName,
        address: form.cusAddress,
        merchantID: "",
        oid: null,
        invcSample: null,
        invcSign: null,
        contractRange: null,
        samples: [],
        products: [],
      };
      onDataLoaded(dataToSend, updated, currentRemaining);
    }
  };

  const handleRemoveProduct = (itemID: string) => {
    if (readonlyProducts) return;

    const updated = selectedProducts.filter((p) => p.itemID !== itemID);
    setSelectedProducts(updated);

    if (onDataLoaded) {
      const currentRemaining =
        fullInfoData?.samples && fullInfoData.samples.length > 0
          ? fullInfoData.samples[selectedSampleIndex].invcRemn
          : 0;
      const dataToSend = fullInfoData || {
        cusTax: form.cusTax,
        cusCMND_ID: form.cusCMND_ID || null,
        cusEmail: form.cusEmail,
        cusTel: form.cusTel,
        cusBankNumber: form.cusBankNo,
        cusBankAddress: form.cusBankTitle,
        cusFax: form.cusFax,
        cusWebsite: form.cusWebsite,
        sName: form.cusName,
        address: form.cusAddress,
        merchantID: "",
        oid: null,
        invcSample: null,
        invcSign: null,
        contractRange: null,
        samples: [],
        products: [],
      };
      onDataLoaded(dataToSend, updated, currentRemaining);
    }
  };

  return (
    <div>
      {/* Header Info */}
      <div className="border border-red-400 p-4 mb-4 bg-red-50 rounded">
        <p className="text-red-600 text-sm font-medium mb-3">
          *MST/CCCD bắt buộc nhập trước khi lấy thông tin
        </p>
        <div className="grid grid-cols-4 gap-3">
          <FormField
            label="MST/CCCD"
            value={form.cusTax}
            onChange={(e) => {
              setForm({ ...form, cusTax: e.target.value });
              // Reset OID list khi thay đổi MST
              setOidList([]);
              setSelectedOID("");
            }}
            placeholder="Nhập MST hoặc CCCD"
          />
          <div className="col-span-3 flex gap-2 items-end">
            <button
              type="button"
              onClick={handleGetOIDList}
              disabled={loading || !form.cusTax}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "⏳ Đang tải..." : "🔍 Tìm hợp đồng"}
            </button>
          </div>
        </div>

        {/* OID Selection */}
        {oidList.length > 0 && (
          <div className="mt-3 p-3 bg-white rounded border border-blue-300">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Chọn hợp đồng (OID) - Tìm thấy {oidList.length} hợp đồng:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select
                  value={selectedOID}
                  onChange={(e) => setSelectedOID(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn OID --</option>
                  {oidList.map((oid) => (
                    <option key={oid.oid} value={oid.oid}>
                      {oid.oid}{" "}
                      {oid.invcSign
                        ? `- ${oid.invcSign}/${oid.invcSample}`
                        : ""}{" "}
                      ({new Date(oid.createdAt).toLocaleDateString("vi-VN")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGetCompanyInfo}
                  disabled={loading || !selectedOID}
                  className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "⏳ Đang tải..." : "📋 Lấy thông tin đầy đủ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Status Badge */}
        {isNewCustomer !== null && fullInfoData && (
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                isNewCustomer
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-blue-100 text-blue-700 border border-blue-300"
              }`}
            >
              {isNewCustomer ? "🆕 Khách hàng MỚI" : "👤 Khách hàng CŨ"}
            </span>
            {fullInfoData.oid && (
              <span className="text-xs text-gray-600">
                <strong>OID:</strong> {fullInfoData.oid}
              </span>
            )}
            {fullInfoData.merchantID && (
              <span className="text-xs text-gray-600">
                <strong>Merchant ID:</strong> {fullInfoData.merchantID}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Samples Info */}
      {fullInfoData &&
        fullInfoData.samples &&
        fullInfoData.samples.length > 0 && (
          <div className="border p-4 mb-4 rounded bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              📋 Thông tin mẫu hóa đơn
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Chọn mẫu
                </label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedSampleIndex}
                  onChange={(e) =>
                    setSelectedSampleIndex(Number(e.target.value))
                  }
                >
                  {fullInfoData.samples.map((sample, idx) => (
                    <option key={sample.sampleID} value={idx}>
                      {sample.govInvcSign} - {sample.sampleCode}
                    </option>
                  ))}
                </select>
              </div>
              <FormField
                label="Mã mẫu"
                value={
                  fullInfoData.samples[selectedSampleIndex]?.sampleCode || ""
                }
                onChange={() => {}}
                disabled
              />
              <FormField
                label="Ký hiệu"
                value={
                  fullInfoData.samples[selectedSampleIndex]?.govInvcSign || ""
                }
                onChange={() => {}}
                disabled
              />
              <FormField
                label="Số HD còn lại"
                value={
                  fullInfoData.samples[
                    selectedSampleIndex
                  ]?.invcRemn?.toString() || "0"
                }
                onChange={() => {}}
                disabled
              />
            </div>

            {/* Contract Range Info */}
            {fullInfoData.contractRange && (
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                <h4 className="text-xs font-semibold text-blue-800 mb-2">
                  Thông tin hợp đồng
                </h4>
                <div className="grid grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-gray-600">OID:</span>
                    <p className="font-medium">
                      {fullInfoData.contractRange.oid}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Mẫu số:</span>
                    <p className="font-medium">
                      {fullInfoData.contractRange.invcSample}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ký hiệu:</span>
                    <p className="font-medium">
                      {fullInfoData.contractRange.invcSign}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Từ số:</span>
                    <p className="font-medium">
                      {fullInfoData.contractRange.invcFrm}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Đến số:</span>
                    <p className="font-medium">
                      {fullInfoData.contractRange.invcEnd}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Checkboxes */}
      {!hideCheckboxes && (
        <div className="border p-4 mb-4 rounded">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            ⚙️ Cấu hình hóa đơn
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isKyTaiMayKhach}
                onChange={() => handleCheckbox("isKyTaiMayKhach")}
                id="toKhai"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="toKhai" className="text-sm">
                Tờ khai đã được cơ quan thuế duyệt?
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isHDVCNB}
                onChange={() => handleCheckbox("isHDVCNB")}
                id="hdvcnb"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="hdvcnb" className="text-sm">
                HDVCNB
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isTemVe}
                onChange={() => handleCheckbox("isTemVe")}
                id="temve"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="temve" className="text-sm">
                Tem - Vé
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isHDBH}
                onChange={() => handleCheckbox("isHDBH")}
                id="hdbh"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="hdbh" className="text-sm">
                HĐ BH
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isHDVAT}
                onChange={() => handleCheckbox("isHDVAT")}
                id="hdvat"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="hdvat" className="text-sm">
                HĐ VAT
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isKyTaiMayKhach}
                onChange={() => handleCheckbox("isKyTaiMayKhach")}
                id="kytaimaykhach"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="kytaimaykhach" className="text-sm">
                Ký tại máy khách
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isMauDaThueSuat}
                onChange={() => handleCheckbox("isMauDaThueSuat")}
                id="maudatshuesuat"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="maudatshuesuat" className="text-sm">
                Mẫu đa thuế suất
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isMauChuyenDoi}
                onChange={() => handleCheckbox("isMauChuyenDoi")}
                id="mauchuyendoi"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="mauchuyendoi" className="text-sm">
                Mẫu chuyển đổi (TT32)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isMauTT32Old}
                onChange={() => handleCheckbox("isMauTT32Old")}
                id="mautt32cu"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="mautt32cu" className="text-sm">
                Mẫu TT 32 (cũ)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isMauTT32New}
                onChange={() => handleCheckbox("isMauTT32New")}
                id="mautt32chuanmoi"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="mautt32chuanmoi" className="text-sm">
                Mẫu TT 32 (chuẩn mới)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isNhapGiaTruocVAT}
                onChange={() => handleCheckbox("isNhapGiaTruocVAT")}
                id="nhapgiatruocvat"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="nhapgiatruocvat" className="text-sm">
                Nhập giá trước VAT
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isCsThuPhi}
                onChange={() => handleCheckbox("isCsThuPhi")}
                id="csthuphi"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="csthuphi" className="text-sm">
                Có thu phí
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isSuDungDuLieuMauDeXem}
                onChange={() => handleCheckbox("isSuDungDuLieuMauDeXem")}
                id="sudungdulieumaude"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="sudungdulieumaude" className="text-sm">
                Sử dụng dữ liệu mẫu để xem
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isPhaiAnhSoKhiKy}
                onChange={() => handleCheckbox("isPhaiAnhSoKhiKy")}
                id="phaiansokhiky"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="phaiansokhiky" className="text-sm">
                Phải ảnh số khi ký
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isGuiMailTaiServer}
                onChange={() => handleCheckbox("isGuiMailTaiServer")}
                id="guimailtaiserver"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="guimailtaiserver" className="text-sm">
                Gửi Mail tại Server
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={form.isChungTuThue}
                onChange={() => handleCheckbox("isChungTuThue")}
                id="chungtuthue"
                className="w-4 h-4 mr-2"
              />
              <label htmlFor="chungtuthue" className="text-sm">
                Chứng từ thuế
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Company Details */}
      <div className="border p-4 mb-4 rounded bg-blue-50">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          🏢 Thông tin công ty
        </h3>

        <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded">
          <FormField
            label="MST/CCCD"
            value={form.cusTax}
            onChange={(e) => setForm({ ...form, cusTax: e.target.value })}
          />
          <FormField
            label="CMND/ID"
            value={form.cusCMND_ID}
            onChange={(e) => setForm({ ...form, cusCMND_ID: e.target.value })}
          />
          <div className="col-span-2">
            <FormField
              label="Tên công ty"
              value={form.cusName}
              onChange={(e) => setForm({ ...form, cusName: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <FormField
              label="Địa chỉ"
              value={form.cusAddress}
              onChange={(e) => setForm({ ...form, cusAddress: e.target.value })}
            />
          </div>
          <FormField
            label="Đại diện"
            value={form.cusContactName}
            onChange={(e) =>
              setForm({ ...form, cusContactName: e.target.value })
            }
          />
          <FormField
            label="Chức vụ"
            value={form.cusContactJob}
            onChange={(e) =>
              setForm({ ...form, cusContactJob: e.target.value })
            }
          />
          <FormField
            label="Email"
            value={form.cusEmail}
            onChange={(e) => setForm({ ...form, cusEmail: e.target.value })}
          />
          <FormField
            label="SĐT"
            value={form.cusTel}
            onChange={(e) => setForm({ ...form, cusTel: e.target.value })}
          />
          <FormField
            label="Website"
            value={form.cusWebsite}
            onChange={(e) => setForm({ ...form, cusWebsite: e.target.value })}
          />
          <FormField
            label="Fax"
            value={form.cusFax}
            onChange={(e) => setForm({ ...form, cusFax: e.target.value })}
          />
          <FormField
            label="Số tài khoản"
            value={form.cusBankNo}
            onChange={(e) => setForm({ ...form, cusBankNo: e.target.value })}
          />
          <FormField
            label="Ngân hàng"
            value={form.cusBankTitle}
            onChange={(e) => setForm({ ...form, cusBankTitle: e.target.value })}
          />
          <div className="col-span-2">
            <FormField
              label="Ghi chú"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>
        </div>

        {/* Products Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">
              📦 Danh sách sản phẩm/dịch vụ
            </label>
            {!readonlyProducts && (
              <button
                type="button"
                onClick={handleOpenProductModal}
                className="px-4 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
              >
                + Chọn thêm gói
              </button>
            )}
          </div>

          {selectedProducts.length === 0 ? (
            <div className="border-2 border-dashed rounded p-6 text-center text-gray-500 text-sm bg-white">
              <p className="mb-1">Chưa có sản phẩm nào</p>
              <p className="text-xs text-gray-400">
                {readonlyProducts
                  ? "Sản phẩm sẽ tự động được thêm khi lấy thông tin"
                  : "Sản phẩm sẽ tự động được thêm khi lấy thông tin hoặc bạn có thể chọn thủ công"}
              </p>
            </div>
          ) : (
            <div className="border rounded overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border p-2 text-left w-24">Mã SP</th>
                    <th className="border p-2 text-left">
                      Tên sản phẩm/dịch vụ
                    </th>
                    <th className="border p-2 text-center w-24">Đơn vị</th>
                    <th className="border p-2 text-center w-20">SL</th>
                    <th className="border p-2 text-right w-32">Đơn giá</th>
                    <th className="border p-2 text-right w-32">Thành tiền</th>
                    {!readonlyProducts && (
                      <th className="border p-2 text-center w-16">Xóa</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {selectedProducts.map((product) => (
                    <tr key={product.itemID} className="hover:bg-gray-50">
                      <td className="border p-2 text-xs">{product.itemID}</td>
                      <td className="border p-2">{product.itemName}</td>
                      <td className="border p-2 text-center text-xs">
                        {product.itemUnitName}
                      </td>
                      <td className="border p-2 text-center">
                        {readonlyProducts ? (
                          <span>{product.Quantity}</span>
                        ) : (
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
                            className="w-full border rounded px-2 py-1 text-center"
                          />
                        )}
                      </td>
                      <td className="border p-2 text-right">
                        {(product.itemPrice || 0).toLocaleString()} đ
                      </td>
                      <td className="border p-2 text-right font-medium">
                        {(product.TotalAmount || 0).toLocaleString()} đ
                      </td>
                      {!readonlyProducts && (
                        <td className="border p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(product.itemID)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={5} className="border p-2 text-right">
                      Tổng cộng:
                    </td>
                    <td className="border p-2 text-right text-blue-700">
                      {selectedProducts
                        .reduce((sum, p) => sum + p.TotalAmount, 0)
                        .toLocaleString()}{" "}
                      đ
                    </td>
                    {!readonlyProducts && <td className="border p-2"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Result Message */}
      {msg && (
        <div
          className={`mt-4 p-3 rounded ${
            msg.includes("❌")
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          <p className="text-sm">{msg}</p>
        </div>
      )}

      {/* Product Selection Modal */}
      {!readonlyProducts && (
        <ProductSelectionModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onConfirm={handleProductConfirm}
        />
      )}
    </div>
  );
}
