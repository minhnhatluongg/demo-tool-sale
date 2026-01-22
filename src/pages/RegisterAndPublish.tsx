import React, { useState, useEffect } from "react";
import CompanyInfoLayout from "../components/CompanyInfoLayout";
import api from "../api/apiClient";
import { Dialog } from "@headlessui/react";
import toast, { Toaster } from "react-hot-toast";
import { FullInfoResponse, SelectedProduct } from "../types";
import PreviewInvoiceModal from "../components/PreviewInvoiceModal";
import ProductSelectionModal from "../components/ProductSelectionModal";
import { templateApi, Template } from "../api/templateApi";

export default function RegisterAndPublish() {
  // Step 1 states
  const [form, setForm] = useState({
    userCode: "",
    mst: "",
    invcSample: "",
    invcSign: "",
  });
  const [companyData, setCompanyData] = useState<FullInfoResponse | null>(null);
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [serverInfo, setServerInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Step 2 states (độc lập)
  const [form2, setForm2] = useState({
    userCode: "",
    mst: "",
  });
  const [companyData2, setCompanyData2] = useState<FullInfoResponse | null>(
    null
  );
  const [products2, setProducts2] = useState<SelectedProduct[]>([]);
  const [loading2, setLoading2] = useState(false);
  const [previewXML, setPreviewXML] = useState<string>("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Checkbox states for Step 2
  const [checkboxes, setCheckboxes] = useState({
    toKhaiDaDuocCoQuanThueDuyet: true,
    hdBH: false,
    mauDaThueSuat: false,
    mauTT32ChuanMoi: false,
    suDungDuLieuMauDeXem: false,
    chungTuThue: false,
    hdvcnb: false,
    hdVAT: true,
    mauChuyenDoiTT32: false,
    nhapGiaTruocVAT: false,
    phaiAnhSoKyKy: true,
    temVe: false,
    kyTaiMayKhach: true,
    mauTT32Cu: false,
    coThuPhi: false,
    guiMailTaiServer: true,
  });

  // Additional states for Step 2
  const [isConfirmSample, setIsConfirmSample] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState("");
  const [selectedTemplateCode, setSelectedTemplateCode] = useState("");
  const [logoBase64, setLogoBase64] = useState("");
  const [backgroundBase64, setBackgroundBase64] = useState("");

  // Templates list
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load templates khi component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load danh sách mẫu từ API
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await templateApi.getTemplates(); // Có thể filter theo invoiceType nếu cần
      setTemplates(data);
      console.log(`✅ Đã tải ${data.length} mẫu hóa đơn`);
    } catch (error: any) {
      console.error("Error loading templates:", error);
      toast.error("Lỗi tải danh sách mẫu!");
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Step 1 callback
  const handleDataLoaded = (
    data: FullInfoResponse,
    selectedProducts: SelectedProduct[],
    _currentRemaining: number
  ) => {
    setCompanyData(data);
    setProducts(selectedProducts);
  };

  // Step 2 callback (độc lập)
  const handleDataLoaded2 = (
    data: FullInfoResponse,
    selectedProducts: SelectedProduct[],
    _currentRemaining: number
  ) => {
    setCompanyData2(data);
    setProducts2(selectedProducts);
  };

  // --- Check tài khoản EVAT ---
  const checkAccount = async () => {
    const mst = form.mst.trim();
    if (!mst) {
      toast.error("Vui lòng nhập mã số thuế để kiểm tra.");
      return;
    }

    setLoadingCheck(true);
    try {
      const res = await api.get("/Win/check-account", {
        params: { mst },
      });
      const data = res.data?.data;
      setHasAccount(res.data.hasAccount);
      setServerInfo(data?.serverName || "");
      if (res.data.hasAccount)
        toast(`KH đã có tài khoản EVAT (${data.serverName})`, {
          icon: "⚠️",
          style: { background: "#FEF3C7", color: "#92400E" },
        });
      else
        toast.success(
          "Khách hàng chưa có tài khoản, có thể cấp TK hoặc tạo đơn."
        );
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoadingCheck(false);
    }
  };

  // --- Xác nhận trước khi tạo đơn + cấp TK (Step 1) ---
  const handleConfirmCreateFull = () => {
    if (hasAccount === null) {
      toast.error("Vui lòng kiểm tra tài khoản trước khi tạo đơn!");
      return;
    }
    if (hasAccount === true) {
      toast("Khách hàng đã có tài khoản, không thể tạo đơn mới.", {
        icon: "⚠️",
        style: { background: "#FEF3C7", color: "#92400E" },
      });
      return;
    }
    if (!form.mst.trim()) {
      toast.error("Vui lòng nhập MST/CCCD!");
      return;
    }
    if (!form.invcSample.trim()) {
      toast.error("Vui lòng nhập Mẫu số!");
      return;
    }
    if (!form.invcSign.trim()) {
      toast.error("Vui lòng nhập Ký hiệu!");
      return;
    }
    if (products.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 gói dịch vụ!");
      return;
    }
    setOpenConfirm(true);
  };

  // --- Step 1: Tạo đơn + cấp TK ---
  const submitStep1 = async () => {
    setOpenConfirm(false);

    setLoading(true);
    try {
      // Payload match BE format (camelCase)
      const payload = {
        cusTax: form.mst,
        cusName: companyData?.sName || "",
        cusAddress: companyData?.address || "",
        cusEmail: companyData?.cusEmail || "",
        cusTel: companyData?.cusTel || "",
        cusFax: companyData?.cusFax || "",
        cusWebsite: companyData?.cusWebsite || "",
        cusBankNo: companyData?.cusBankNumber || "",
        cusBankTitle: companyData?.cusBankAddress || "",
        userCode: form.userCode,
        userName: "",
        isOnline: 1,
        cusCMND_ID: companyData?.cusCMND_ID || "",
        cusContactName: companyData?.cusPeopleSign || "",
        cusPosition_BySign: "Giám Đốc",
        cusLegalValue: "",
        invCusName: "",
        invCusAddress: "",
        invCusPhone: "",
        invCusEmail: "",
        description: "",
        invSample: form.invcSample,
        invSign: form.invcSign,
        invFrom: 1,
        invTo: 0,
        products:
          products.length > 0
            ? products.map((p) => ({
              productCode: p.itemID,
              productName: p.itemName,
              qty: p.Quantity,
              uom: p.itemUnitName,
              price: p.itemPrice,
              vatRate: "0%",
              vatName: "Không VAT",
            }))
            : [
              {
                productCode: "UN:0044",
                productName: "Gói mua eHĐĐT",
                qty: 1,
                uom: "gói",
                price: 0,
                vatRate: "0%",
                vatName: "Không VAT",
              },
            ],
      };
      const res = await api.post("/odoo/orders/createFull", payload);
      toast.success(`✅ ${res.data.message} (OID: ${res.data.oid})`);
      setHasAccount(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Step 2: Xem hóa đơn mẫu ---
  const handleViewInvoice = async () => {
    // Validation theo XemHoaDon() trong full-be.txt
    if (!companyData2) {
      toast.error("Vui lòng tải thông tin công ty trước!");
      return;
    }

    // Kiểm tra ký hiệu có chứa ký tự tiếng Việt (ContainsUnicodeCharacter)
    const vietnameseRegex =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
    if (companyData2.invcSign && vietnameseRegex.test(companyData2.invcSign)) {
      toast.error("Ký hiệu hóa đơn có chứa chữ Tiếng Việt!");
      return;
    }

    // Kiểm tra đã chọn mẫu chưa
    if (!isConfirmSample && !selectedTemplateCode) {
      toast.error("Bạn chưa xác nhận [CHỌN] mẫu!");
      return;
    }

    setLoading2(true);

    try {
      // Xác định loại XML dựa vào checkbox (theo logic trong XemHoaDon)
      let xmlType = "default";
      if (checkboxes.hdvcnb) xmlType = "vcnb";
      else if (checkboxes.chungTuThue) xmlType = "ctt";
      else if (checkboxes.mauTT32Cu) xmlType = "tt32";
      else if (checkboxes.mauTT32ChuanMoi) xmlType = "tt32new";

      const payload = {
        CusTax: companyData2.cusTax,
        CusName: companyData2.sName,
        CusAddress: companyData2.address,
        CusEmail: companyData2.cusEmail,
        CusTel: companyData2.cusTel,
        CusBankNo: companyData2.cusBankNumber,
        CusBankTitle: companyData2.cusBankAddress,
        CusWebsite: companyData2.cusWebsite,
        CusFax: companyData2.cusFax,
        InvSample: companyData2.invcSample,
        InvSign: companyData2.invcSign,
        InvoiceType: checkboxes.hdVAT
          ? "HĐ VAT"
          : checkboxes.hdvcnb
            ? "HDVCNB"
            : "HĐ VAT",
        IsConvert: checkboxes.mauChuyenDoiTT32,
        XmlType: xmlType,
        Checkboxes: checkboxes,
        TemplateCode: selectedTemplateCode, // Gửi templateCode thay vì sampleId
        LogoBase64: logoBase64,
        BackgroundBase64: backgroundBase64,
      };

      const res = await templateApi.previewInvoice(payload);

      if (res.data && res.data.success) {
        if (res.data.htmlUrl) {
          // Mở HTML trong tab mới (như Process.Start trong C#)
          window.open(res.data.htmlUrl, "_blank");
          toast.success("✅ Đã tạo bản xem trước hóa đơn!");
        } else if (res.data.xmlContent) {
          setPreviewXML(res.data.xmlContent);
          setIsPreviewOpen(true);
          toast.success("✅ Xem trước thành công");
        } else {
          toast.error("⚠️ Không có dữ liệu trả về");
        }
      } else {
        toast.error(res.data?.message || "⚠️ Lỗi khi tạo xem trước");
      }
    } catch (e: any) {
      console.error("Preview error:", e);
      toast.error(
        "Lỗi xem hóa đơn: " + (e.response?.data?.message || e.message)
      );
    } finally {
      setLoading2(false);
    }
  };

  // --- Step 2: Phát hành mẫu ---
  const submitPublish = async () => {
    if (!companyData2) {
      toast.error("Vui lòng lấy thông tin công ty ở Step 2!");
      return;
    }

    if (products2.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 sản phẩm!");
      return;
    }

    setLoading2(true);
    try {
      const payload = {
        CusTax: companyData2.cusTax,
        InvSample: companyData2.invcSample,
        InvSign: companyData2.invcSign,
        InvFrom: 0,
        InvTo: 0,
        UserCode: form2.userCode,
        CusName: companyData2.sName,
        CusAddress: companyData2.address,
        CusEmail: companyData2.cusEmail,
        CusTel: companyData2.cusTel,
        CusBankNo: companyData2.cusBankNumber,
        CusBankTitle: companyData2.cusBankAddress,
        CusWebsite: companyData2.cusWebsite,
        CusFax: companyData2.cusFax,
        Products: products2.map((p) => ({
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
      toast.success(`✅ ${res.data.message} | OID: ${res.data.OID}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setLoading2(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-8 relative">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg -mx-6 -mt-6 mb-8">
        <h1 className="text-2xl font-bold mb-2">
          Khách hàng WT - Quy trình 2 Bước
        </h1>
        <p className="text-blue-100 text-sm">
          Có thể thực hiện riêng biệt: Bước 1 tạo đơn + cấp TK, Bước 2 phát hành
          mẫu sau
        </p>
      </div>

      {/* ========== STEP 1: GHI NHẬN DỊCH VỤ ========== */}
      <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-900">
              Step 1: Ghi nhận dịch vụ
            </h2>
            <p className="text-sm text-blue-700">
              Tạo đơn hàng + Cấp tài khoản
            </p>
          </div>
        </div>

        <div className="space-y-6 bg-white rounded-lg p-6">
          {/* Hướng dẫn */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <ol className="list-decimal list-inside text-xs text-blue-800 space-y-1.5">
              <li>
                Nhập <strong>MST/CCCD</strong> → Bấm{" "}
                <strong>"Kiểm tra tài khoản"</strong>
              </li>
              <li>
                <strong>MST mới</strong>: Bấm <strong>"🔍 Tìm hợp đồng"</strong>{" "}
                → Chọn OID → <strong>"📋 Lấy thông tin"</strong>
              </li>
              <li>
                Nhập <strong>Mẫu số</strong> (VD: 01GTKT0/001) và{" "}
                <strong>Ký hiệu</strong> (VD: AA/24E)
              </li>
              <li>
                Bấm <strong>"Tạo đơn + Cấp TK"</strong> để hoàn tất Step 1
              </li>
            </ol>
          </div>

          {/* Nhập MST */}
          <div className="border border-red-400 p-4 bg-red-50 rounded">
            <p className="text-red-600 text-sm font-medium mb-3">
              *MST/CCCD bắt buộc nhập trước khi kiểm tra tài khoản
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mã số thuế / CCCD
                </label>
                <input
                  type="text"
                  value={form.mst}
                  onChange={(e) => setForm({ ...form, mst: e.target.value })}
                  placeholder="Nhập MST hoặc CCCD"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={checkAccount}
                disabled={loadingCheck || !form.mst}
                className="px-5 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loadingCheck ? "Đang kiểm tra..." : "Kiểm tra tài khoản"}
              </button>
            </div>

            {/* Hiển thị trạng thái tài khoản */}
            {hasAccount !== null && (
              <div className="mt-3">
                {hasAccount ? (
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-600 text-lg">⚠️</span>
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">
                          Khách hàng ĐÃ CÓ tài khoản EVAT
                        </p>
                        {serverInfo && (
                          <p className="text-xs text-yellow-700 mt-1">
                            Server: <strong>{serverInfo}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-300 rounded p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 text-lg">✅</span>
                      <p className="text-sm font-semibold text-green-800">
                        Khách hàng CHƯA CÓ tài khoản - Có thể cấp TK hoặc tạo
                        đơn
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Thông tin công ty đầy đủ */}
          <CompanyInfoLayout
            loaiCap={0}
            onDataLoaded={handleDataLoaded}
            readonlyProducts={false}
            hideCheckboxes={true}
          />

          {/* Mẫu số, Ký hiệu, Mã nhân viên */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Mẫu số <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.invcSample}
                  onChange={(e) =>
                    setForm({ ...form, invcSample: e.target.value })
                  }
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
                  value={form.invcSign}
                  onChange={(e) =>
                    setForm({ ...form, invcSign: e.target.value })
                  }
                  placeholder="VD: AA/24E"
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
                  onChange={(e) =>
                    setForm({ ...form, userCode: e.target.value })
                  }
                  placeholder="Nhập mã NVKD"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Button */}
          <div className="flex justify-center pt-4 border-t">
            <button
              onClick={handleConfirmCreateFull}
              disabled={
                loading ||
                hasAccount === true ||
                hasAccount === null ||
                !form.invcSample.trim() ||
                !form.invcSign.trim() ||
                !form.mst.trim()
              }
              className="px-8 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
            >
              {loading ? "Đang xử lý..." : "Tạo đơn + Cấp TK"}
            </button>
          </div>
        </div>
      </div>

      {/* ========== STEP 2: XỬ LÝ PHÁT HÀNH ========== */}
      <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg">
            2
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-900">
              Step 2: Xử lý phát hành
            </h2>
            <p className="text-sm text-green-700">
              Phát hành mẫu hóa đơn (có thể làm sau)
            </p>
          </div>
        </div>

        <div className="space-y-6 bg-white rounded-lg p-6">
          {/* Hướng dẫn */}
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <ul className="list-disc list-inside text-xs text-green-800 space-y-1">
              <li>
                Bước này <strong>KHÔNG BẮT BUỘC</strong> phải làm ngay sau Step
                1
              </li>
              <li>Nhập MST để tải thông tin khách hàng cũ</li>
              <li>Chọn mẫu hóa đơn, upload logo, chỉnh sửa cấu hình</li>
              <li>Xem trước hóa đơn mẫu hoặc gửi đề xuất phát hành</li>
            </ul>
          </div>

          {/* Nhập MST để load thông tin */}
          <div className="border border-blue-400 p-4 bg-blue-50 rounded">
            <p className="text-blue-600 text-sm font-medium mb-3">
              Nhập MST/CCCD để tải thông tin khách hàng
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <input
                  type="text"
                  value={form2.mst || ""}
                  onChange={(e) => setForm2({ ...form2, mst: e.target.value })}
                  placeholder="Nhập MST hoặc CCCD"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  // TODO: Load customer info by MST
                  toast("Chức năng tải thông tin đang phát triển");
                }}
                disabled={loading2}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
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
                Tải thông tin
              </button>
            </div>

            {companyData2 && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm">
                  <strong>Tên:</strong> {companyData2.sName}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {companyData2.cusEmail}
                </p>
                <p className="text-sm">
                  <strong>Địa chỉ:</strong> {companyData2.address}
                </p>
              </div>
            )}
          </div>

          {/* ========== THÊM OPTIONS GIỐNG TOOL ========== */}

          {/* Chọn mẫu hóa đơn & Logo */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              🎨 Mẫu hóa đơn & Tùy chỉnh
            </h3>

            <div className="grid grid-cols-3 gap-4">
              {/* Chọn mẫu */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Mẫu hiện có{" "}
                  {templates.length > 0 && `(${templates.length} mẫu)`}
                </label>
                <select
                  value={selectedTemplateCode}
                  onChange={(e) => {
                    setSelectedTemplateCode(e.target.value);
                    setIsConfirmSample(false); // Reset confirm khi đổi mẫu
                  }}
                  disabled={loadingTemplates}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingTemplates ? "⏳ Đang tải mẫu..." : "-- Chọn mẫu --"}
                  </option>
                  {templates.map((t) => (
                    <option key={t.templateID} value={t.templateCode}>
                      {t.templateName}
                    </option>
                  ))}
                </select>

                {/* Preview thumbnail nếu có */}
                {selectedTemplateCode &&
                  templates.find((t) => t.templateCode === selectedTemplateCode)
                    ?.previewImage && (
                    <div className="mt-2 border rounded p-2 bg-white">
                      <p className="text-xs text-gray-600 mb-1">Preview:</p>
                      <img
                        src={
                          templates.find(
                            (t) => t.templateCode === selectedTemplateCode
                          )?.previewImage
                        }
                        alt="Template Preview"
                        className="w-full h-auto border rounded"
                      />
                    </div>
                  )}
              </div>

              {/* Button xem mẫu */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => toast("Chức năng xem mẫu đang phát triển")}
                  className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors"
                >
                  👁️ Xem mẫu
                </button>
              </div>

              {/* Button chỉnh sửa mẫu */}
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() =>
                    toast("Chức năng chỉnh sửa mẫu đang phát triển")
                  }
                  className="w-full px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded hover:bg-orange-700 transition-colors"
                >
                  ✏️ Chỉnh sửa mẫu
                </button>
              </div>
            </div>

            {/* Upload Logo & XML Mẫu */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Logo công ty
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = reader.result as string;
                          setLogoBase64(base64);
                          toast.success(`✅ Đã chọn logo: ${file.name}`);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="logo-upload"
                    className="flex-1 cursor-pointer border-2 border-dashed rounded-md px-3 py-2 text-sm text-center text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    📁 Chọn logo
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (logoBase64) {
                        // Mở preview logo trong tab mới
                        const win = window.open();
                        if (win) {
                          win.document.write(
                            `<img src="${logoBase64}" style="max-width:100%; height:auto;" />`
                          );
                        }
                      } else {
                        toast("Chưa có logo!");
                      }
                    }}
                    disabled={!logoBase64}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    👁️
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  XML Mẫu (.xslt)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".xml,.xslt"
                    className="hidden"
                    id="xml-upload"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        toast.success(`Đã chọn: ${e.target.files[0].name}`);
                      }
                    }}
                  />
                  <label
                    htmlFor="xml-upload"
                    className="flex-1 cursor-pointer border-2 border-dashed rounded-md px-3 py-2 text-sm text-center text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    📄 Chọn file XML
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      toast("Chức năng preview XML đang phát triển")
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
                  >
                    👁️
                  </button>
                </div>
              </div>
            </div>

            {/* Các button bổ sung */}
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  if (!selectedTemplateCode) {
                    toast.error("Vui lòng chọn mẫu từ dropdown!");
                    return;
                  }
                  setIsConfirmSample(true);
                  const templateName = templates.find(
                    (t) => t.templateCode === selectedTemplateCode
                  )?.templateName;
                  toast.success(`✅ Đã xác nhận: ${templateName}`);
                }}
                disabled={!selectedTemplateCode}
                className={`px-4 py-2 text-white text-sm font-medium rounded transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed ${isConfirmSample
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700"
                  }`}
              >
                {isConfirmSample
                  ? "✅ Đã xác nhận mẫu"
                  : "✅ Xác nhận [CHỌN] mẫu"}
              </button>

              <button
                type="button"
                onClick={() =>
                  toast("Chức năng điều chỉnh mẫu đang phát triển")
                }
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                🎨 Điều chỉnh mẫu
              </button>

              <button
                type="button"
                onClick={() => toast("Chức năng hiện/ẩn nút đang phát triển")}
                className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                👁️ Hiện/Ẩn nút
              </button>
            </div>
          </div>

          {/* Cấu hình hóa đơn (Checkboxes) */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              ⚙️ Cấu hình hóa đơn
            </h3>
            <div className="grid grid-cols-3 gap-x-8 gap-y-3 bg-gray-50 p-4 rounded-md text-sm">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.toKhaiDaDuocCoQuanThueDuyet}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      toKhaiDaDuocCoQuanThueDuyet: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Tờ khai đã được cơ quan thuế duyệt?</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.hdvcnb}
                  onChange={(e) =>
                    setCheckboxes({ ...checkboxes, hdvcnb: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span>HDVCNB</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.temVe}
                  onChange={(e) =>
                    setCheckboxes({ ...checkboxes, temVe: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span>Tem - Vé</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.hdBH}
                  onChange={(e) =>
                    setCheckboxes({ ...checkboxes, hdBH: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span>HĐ BH</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.hdVAT}
                  onChange={(e) =>
                    setCheckboxes({ ...checkboxes, hdVAT: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span>HĐ VAT</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.kyTaiMayKhach}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      kyTaiMayKhach: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Ký tại máy khách</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.mauDaThueSuat}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      mauDaThueSuat: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Mẫu đã thuế suất</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.nhapGiaTruocVAT}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      nhapGiaTruocVAT: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Nhập giá trước VAT</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.coThuPhi}
                  onChange={(e) =>
                    setCheckboxes({ ...checkboxes, coThuPhi: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span>Có thu phí</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.suDungDuLieuMauDeXem}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      suDungDuLieuMauDeXem: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Sử dụng dữ liệu mẫu để xem</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.phaiAnhSoKyKy}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      phaiAnhSoKyKy: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Phải ảnh số ký ký</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.guiMailTaiServer}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      guiMailTaiServer: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Gửi Mail tại Server</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkboxes.chungTuThue}
                  onChange={(e) =>
                    setCheckboxes({
                      ...checkboxes,
                      chungTuThue: e.target.checked,
                    })
                  }
                  className="w-4 h-4"
                />
                <span>Chứng từ thuế</span>
              </label>
            </div>
          </div>

          {/* Mã nhân viên */}
          <div className="border-t pt-4">
            <div className="max-w-xs">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Mã nhân viên
              </label>
              <input
                type="text"
                value={form2.userCode}
                onChange={(e) =>
                  setForm2({ ...form2, userCode: e.target.value })
                }
                placeholder="Nhập mã NVKD"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Action Buttons Step 2 */}
          <div className="flex justify-center gap-4 pt-4 border-t">
            <button
              onClick={handleViewInvoice}
              disabled={loading2 || !companyData2}
              className="px-6 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {loading2 ? "Đang xử lý..." : "Xem hóa đơn mẫu"}
            </button>

            <button
              onClick={submitPublish}
              disabled={loading2 || !companyData2 || products2.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {loading2 ? "Đang xử lý..." : "Phát hành [Chuẩn đầu mẫu]"}
            </button>
          </div>
        </div>
      </div>

      {/* Popup xác nhận Step 1 */}
      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
            <Dialog.Title className="text-lg font-semibold text-gray-800">
              Xác nhận tạo đơn + cấp tài khoản
            </Dialog.Title>
            <p className="mt-2 text-sm text-gray-600">
              Hệ thống sẽ tạo hợp đồng mới và cấp tài khoản EVAT cho:
              <br />- <strong>MST:</strong> {form.mst}
              {companyData?.sName && (
                <>
                  <br />- <strong>Tên:</strong> {companyData.sName}
                </>
              )}
              <br />- <strong>Mẫu số:</strong> {form.invcSample}
              <br />- <strong>Ký hiệu:</strong> {form.invcSign}
              <br />- <strong>Số gói dịch vụ:</strong> {products.length}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpenConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Hủy
              </button>
              <button
                onClick={submitStep1}
                className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-md hover:bg-green-700 shadow"
              >
                Xác nhận
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Product Selection Modal Step 1 */}
      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onConfirm={(selectedProducts) => {
          setProducts(selectedProducts);
          setShowProductModal(false);
          toast.success(`✅ Đã chọn ${selectedProducts.length} gói dịch vụ`);
        }}
      />

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
