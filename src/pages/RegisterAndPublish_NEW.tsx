import React, { useState } from "react";
import api from "../api/apiClient";
import { Dialog } from "@headlessui/react";
import toast, { Toaster } from "react-hot-toast";
import { FullInfoResponse, SelectedProduct } from "../types";
import ProductSelectionModal from "../components/ProductSelectionModal";
import { ContractOptions } from "../types";

export default function RegisterAndPublish() {
  // Step 1 states
  const [form, setForm] = useState({
    userCode: "",
    mst: "",
    invcSample: "",
    invcSign: "",
    // Thông tin công ty (cho khách mới nhập thủ công)
    cusName: "",
    cusAddress: "",
    cusEmail: "",
    cusTel: "",
    cusBankNo: "",
    cusBankTitle: "",
    cusWebsite: "",
    cusFax: "",
    cusCMND_ID: "",
    cusContactName: "",
    cusPosition: "Giám Đốc", // Mặc định là Giám Đốc nhưng có thể sửa
    description: "",
  });
  const [products, setProducts] = useState<SelectedProduct[]>([]);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [serverInfo, setServerInfo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [finalConfiguredXsltBase64, setFinalConfiguredXsltBase64] =
    useState("");
  const [finalXsltFileName, setFinalXsltFileName] = useState("");
  const [finalXmlData, setFinalXmlData] = useState(""); // Lưu XML từ API
  const [configuredXslt, setConfiguredXslt] = useState(""); // Lưu XSLT từ API
  const [contractList, setcontractList] = useState<ContractOptions[]>([]);
  const [selectedContract, setSelectedContract] =
    useState<ContractOptions | null>(null);
  // Step 2 states (độc lập)
  const [form2, setForm2] = useState({
    userCode: "",
    mst: "",
  });
  const [companyData2, setCompanyData2] = useState<FullInfoResponse | null>(
    null
  );
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [products2, setProducts2] = useState<SelectedProduct[]>([]);
  const [loading2, setLoading2] = useState(false);

  // Step 2 additional states
  const [logoBase64, setLogoBase64] = useState("");
  const [logoFileName, setLogoFileName] = useState("");
  const [backgroundBase64, setBackgroundBase64] = useState("");
  const [backgroundFileName, setBackgroundFileName] = useState("");
  const [xsltFile, setXsltFile] = useState<File | null>(null);
  const [xmlFile, setXmlFile] = useState<File | null>(null);

  // Điều chỉnh mẫu modal states
  const [isAdjustTemplateOpen, setIsAdjustTemplateOpen] = useState(false);
  const [adjustConfig, setAdjustConfig] = useState({
    email: false,
    fax: false,
    soDT: false,
    taiKhoanNganHang: false,
    website: false,
    songNgu: false,
    thayDoiVien: false,
    logoPos: { width: 0, height: 0, top: 0, left: 0 },
    backgroundPos: { width: 0, height: 0, top: 0, left: 0 },
    vienConfig: {
      selectedVien: "",
      doManh: 0,
    },
  });

  // Invoice template states
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedTemplateRawXslt, setSelectedTemplateRawXslt] = useState("");
  const [isTemplateConfirmed, setIsTemplateConfirmed] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingTemplateDetail, setLoadingTemplateDetail] = useState(false);
  const [isToKhaiLocked, setIsToKhaiLocked] = useState(false);

  // Invoice configuration checkboxes (without TT32 variants)
  const [invoiceConfig, setInvoiceConfig] = useState({
    toKhaiDaDuocCoQuanThueDuyet: true,
    hdvcnb: false, // Case đặc biệt - XSLT + XML riêng
    chungTuThue: false,
    coThuPhi: true, // Luôn luôn checked
    phaiAnhSoKyKy: true,
    guiMailTaiServer: true,
    thuNhapCaNhan: false, // Case đặc biệt - XSLT + XML riêng
    mauDaThueSuat: false, // Case đặc biệt - XSLT + XML riêng
    hangGuiDaiLy: false, // Case đặc biệt - XSLT + XML riêng
  });

  // State riêng cho hóa đơn đặc biệt (chỉ chọn 1)
  const [selectedSpecialInvoice, setSelectedSpecialInvoice] =
    useState<string>("");

  // Handler cho việc chọn hóa đơn đặc biệt (chỉ 1)
  const handleSpecialInvoiceSelect = (type: string) => {
    if (selectedSpecialInvoice === type) {
      // Nếu đang chọn thì bỏ chọn
      setSelectedSpecialInvoice("");
      setInvoiceConfig({
        ...invoiceConfig,
        hdvcnb: false,
        chungTuThue: false,
        thuNhapCaNhan: false,
        mauDaThueSuat: false,
        hangGuiDaiLy: false,
      });
    } else {
      // Chọn cái mới, bỏ cái cũ
      setSelectedSpecialInvoice(type);
      setInvoiceConfig({
        ...invoiceConfig,
        hdvcnb: type === "hdvcnb",
        chungTuThue: type === "chungTuThue",
        thuNhapCaNhan: type === "thuNhapCaNhan",
        mauDaThueSuat: type === "mauDaThueSuat",
        hangGuiDaiLy: type === "hangGuiDaiLy",
      });
    }
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
      const res = await api.get("/Account/check-account", {
        params: { mst },
      });
      const data = res.data?.data;
      setHasAccount(!!data?.hasAccount);
      setServerInfo(data?.serverName || "");
      if (data?.hasAccount)
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

  // --- Load thông tin công ty cho Step 2 ---
  const loadCompanyInfoStep2 = async () => {
    const mst = form2.mst.trim();
    if (!mst) {
      toast.error("Vui lòng nhập MST/CCCD!");
      return;
    }

    setLoadingCompanyInfo(true);
    try {
      // Gọi API để lấy thông tin công ty
      const res = await api.get("/tax/get-full-info-by-mst", {
        params: { mst },
      });
      const resData = res.data.data;
      console.log("📥 Full Info Response:", resData);

      if (resData && resData.contractRange) {
        const range = resData.contractRange;
        const mainPkg = resData.products?.find(
          (p: any) => p.itemUnitName === "Gói" || p.itemUnit === "Gói"
        );
        const pkgName = mainPkg ? mainPkg.itemName : "Gói dịch vụ";
        const contractObj: ContractOptions = {
          oid: range.oid,
          label: `${range.oid} - ${pkgName}`, // Label hiển thị
          invcFrm: Number(range.invcFrm),
          invcEnd: Number(range.invcEnd), // <--- Lấy chính xác số 150 từ API
          invcSample: range.invcSample,
          invcSign: range.invcSign,
        };
        setcontractList([contractObj]);
        setSelectedContract(contractObj);
        setCompanyData2((prev) => ({
          ...prev!,
          invcSample: range.invcSample,
          invcSign: range.invcSign,
        }));
      }

      if (res.data && res.data.success && res.data.data) {
        const data = res.data.data;
        console.log("🔍 Company Data Loaded:", {
          invcSample: data.invcSample,
          invcSign: data.invcSign,
          sName: data.sName,
          cusTax: data.cusTax,
        });
        setCompanyData2(data);

        // Load products vào state products2
        if (data.products && data.products.length > 0) {
          const mappedProducts = data.products.map((p: any) => {
            let displayCapacity = p.itemPerBox || 0;
            const isPackage = p.itemUnitName === "Gói" || p.itemUnit === "Gói";
            if (isPackage && data.contractRange) {
              displayCapacity =
                Number(data.contractRange.invcEnd) -
                Number(data.contractRange.invcFrm) +
                1;
            }
            return {
              itemID: p.itemID,
              itemName: p.itemName,
              itemUnit: p.itemUnit,
              itemUnitName: p.itemUnitName,
              itemPerBox: displayCapacity,
              itemPrice: p.itemPrice,
              Quantity: 1,
              invcFrm: p.invcFrm || 1,
              invcEnd:
                isPackage && data.contractRange
                  ? Number(data.contractRange.invcEnd)
                  : p.invcEnd || 1,
            };
          });
          setProducts2(mappedProducts);
          toast.success(`✅ Đã load ${mappedProducts.length} sản phẩm`);
        }

        // Set isToKhai và lock checkbox nếu cần
        if (data.isToKhai === true) {
          setInvoiceConfig((prev) => ({
            ...prev,
            toKhaiDaDuocCoQuanThueDuyet: true,
          }));
          setIsToKhaiLocked(true);
          toast("📌 Tờ khai đã được duyệt - không thể thay đổi cấu hình này", {
            duration: 3000,
            icon: "🔒",
            style: { background: "#DBEAFE", color: "#1E40AF" },
          });
        } else {
          setIsToKhaiLocked(false);
        }

        // Hiển thị thông tin mẫu số và ký hiệu nếu có
        if (data.invcSample || data.invcSign) {
          toast.success(
            `✅ Đã tải thông tin công ty!\n📋 Mẫu số: ${
              data.invcSample || "N/A"
            }\n🔖 Ký hiệu: ${data.invcSign || "N/A"}`,
            {
              duration: 4000,
              style: { maxWidth: "500px" },
            }
          );
        } else {
          toast.success("✅ Đã tải thông tin công ty!");
        }

        // Tự động load danh sách mẫu hóa đơn sau khi load thông tin công ty thành công
        loadInvoiceTemplates();
      } else {
        toast.error("Không tìm thấy thông tin công ty!");
      }
    } catch (e: any) {
      toast.error(
        e.response?.data?.message || "Lỗi khi tải thông tin công ty!"
      );
      console.error("Load company info error:", e);
    } finally {
      setLoadingCompanyInfo(false);
    }
  };

  // --- Load danh sách mẫu hóa đơn ---
  const loadInvoiceTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await api.get("/invoice/templates/all");

      if (res.data && res.data.success) {
        setAvailableTemplates(res.data.data || []);
        toast.success(`✅ Đã tải ${res.data.data?.length || 0} mẫu hóa đơn`);
      } else {
        setAvailableTemplates([]);
        toast.error("Không tải được danh sách mẫu!");
      }
    } catch (e: any) {
      console.error("Load templates error:", e);
      toast.error("Lỗi khi tải danh sách mẫu!");
      setAvailableTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // --- Load chi tiết mẫu hóa đơn khi chọn ---
  const loadTemplateDetail = async (templateId: string) => {
    if (!templateId) return;

    setLoadingTemplateDetail(true);
    try {
      const res = await api.get(`/invoice/templates/${templateId}`);

      if (res.data && res.data.success) {
        setSelectedTemplateRawXslt(res.data.rawXslt || "");
        toast.success("✅ Đã tải chi tiết mẫu");
      } else {
        toast.error("Không tải được chi tiết mẫu!");
        setSelectedTemplateRawXslt("");
      }
    } catch (e: any) {
      console.error("Load template detail error:", e);
      toast.error("Lỗi khi tải chi tiết mẫu!");
      setSelectedTemplateRawXslt("");
    } finally {
      setLoadingTemplateDetail(false);
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
    // Validation: Kiểm tra thông tin công ty bắt buộc
    if (!form.cusName.trim()) {
      toast.error("⚠️ Vui lòng nhập Tên công ty!");
      return;
    }
    if (!form.cusAddress.trim()) {
      toast.error("⚠️ Vui lòng nhập Địa chỉ!");
      return;
    }
    if (!form.cusEmail.trim()) {
      toast.error("⚠️ Vui lòng nhập Email!");
      return;
    }
    if (!form.cusTel.trim()) {
      toast.error("⚠️ Vui lòng nhập Số điện thoại!");
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
      // Tính invTo từ gói hóa đơn được chọn
      const packageProduct = products.find((p) => p.itemUnitName === "Gói");
      const calculatedInvTo = packageProduct ? packageProduct.itemPerBox : 0;

      // Payload từ form (khách mới) - Match BE format (camelCase)
      const payload = {
        cusTax: form.mst,
        cusName: form.cusName,
        cusAddress: form.cusAddress,
        cusEmail: form.cusEmail,
        cusTel: form.cusTel,
        cusBankNo: form.cusBankNo,
        cusBankTitle: form.cusBankTitle,
        cusWebsite: form.cusWebsite,
        cusFax: form.cusFax,
        userCode: form.userCode,
        userName: "",
        isOnline: 1,
        logoBase64: logoBase64,
        filelogo: logoFileName,
        backgroundBase64: backgroundBase64,
        fileBackground: backgroundFileName,
        cusCMND_ID: form.cusCMND_ID,
        cusContactName: form.cusContactName,
        cusPosition_BySign: form.cusPosition, // Lấy từ form, mặc định "Giám Đốc"
        cusLegalValue: "",
        invCusName: "",
        invCusAddress: "",
        invCusPhone: "",
        invCusEmail: "",
        description: form.description,
        invSample: form.invcSample,
        invSign: form.invcSign,
        invFrom: 1,
        invTo: calculatedInvTo,
        products:
          products.length > 0
            ? products.map((p) => {
                const isPackage = p.itemUnitName === "Gói";
                return {
                  productCode: p.itemID,
                  productName: p.itemName,
                  qty: p.Quantity,
                  uom: p.itemUnitName,
                  price: p.itemPrice,
                  vatRate: "0",
                  vatName: "Không VAT",
                  inv_name: form.invcSample,
                  inv_serial: form.invcSign,
                  inv_from: isPackage ? 1 : 0,
                  inv_to: isPackage ? p.itemPerBox : 0,
                };
              })
            : [
                {
                  productCode: "UN:0044",
                  productName: "Gói mua eHĐĐT",
                  qty: 1,
                  uom: "gói",
                  price: 0,
                  vatRate: "0",
                  vatName: "Không VAT",
                  inv_name: form.invcSample,
                  inv_serial: form.invcSign,
                  inv_from: 1,
                  inv_to: 0,
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

  // --- Helper: Build full payload với AdjustConfig (Match BE format) ---
  const buildFullPayload = async () => {
    if (!companyData2) {
      throw new Error("Vui lòng lấy thông tin công ty ở Step 2!");
    }

    // Kiểm tra selectedTemplate: Chỉ bắt buộc khi chọn "Mẫu Hóa Đơn" (mauDaThueSuat) hoặc chưa chọn loại nào
    // Các loại đặc biệt (HDVCNB, Chứng từ thuế, Hàng gửi đại lý, Thu nhập cá nhân) không cần selectedTemplate
    const isSpecialInvoice = [
      "hdvcnb",
      "chungTuThue",
      "hangGuiDaiLy",
      "thuNhapCaNhan",
    ].includes(selectedSpecialInvoice);
    if (!selectedTemplate && !isSpecialInvoice) {
      throw new Error("Vui lòng chọn mẫu hóa đơn trước!");
    }

    // Đọc file XSLT nếu có
    let xsltContent = "";
    if (xsltFile) {
      xsltContent = await xsltFile.text();
    }

    // Build AdjustConfig từ state adjustConfig (camelCase để match BE)
    const adjustConfigPayload = {
      isEmail: adjustConfig.email,
      isFax: adjustConfig.fax,
      isSoDT: adjustConfig.soDT,
      isTaiKhoanNganHang: adjustConfig.taiKhoanNganHang,
      isWebsite: adjustConfig.website,
      isSongNgu: adjustConfig.songNgu,
      isThayDoiVien: adjustConfig.thayDoiVien,
      vienConfig: {
        selectedVien: adjustConfig.vienConfig.selectedVien || "",
        doManh: adjustConfig.vienConfig.doManh || 0,
      },
      logoPos: {
        width: adjustConfig.logoPos.width || 0,
        height: adjustConfig.logoPos.height || 0,
        top: adjustConfig.logoPos.top || 0,
        left: adjustConfig.logoPos.left || 0,
      },
      backgroundPos: {
        width: adjustConfig.backgroundPos.width || 0,
        height: adjustConfig.backgroundPos.height || 0,
        top: adjustConfig.backgroundPos.top || 0,
        left: adjustConfig.backgroundPos.left || 0,
      },
    };

    // Payload match với BE format
    const payload = {
      templateId: parseInt(selectedTemplate) || 0,
      xmlDataId: 0,
      company: {
        sampleID: companyData2.invcSample || "",
        sampleSerial: companyData2.invcSign || "",
        logoBase64: logoBase64 || "",
        filelogo: logoFileName,
        backgroundBase64: backgroundBase64 || "",
        fileBackground: backgroundFileName,
        sName: companyData2.sName || "",
        tel: companyData2.cusTel || "",
        fax: companyData2.cusFax || "",
        address: companyData2.address || "",
        bankInfo: companyData2.cusBankAddress || "",
        website: companyData2.cusWebsite || "",
        email: companyData2.cusEmail || "",
        bankNumber: companyData2.cusBankNumber || "",
        bankAddress: companyData2.cusBankAddress || "",
        merchantID: companyData2.cusTax || "",
        personOfMerchant: companyData2.cusPeopleSign || "",
        saleID: form2.userCode || "",
      },
      config: {
        tokhaiApproved: invoiceConfig.toKhaiDaDuocCoQuanThueDuyet,
        isVCNB: invoiceConfig.hdvcnb,
        generateNumberOnSign: invoiceConfig.phaiAnhSoKyKy,
        sendMailAtServer: invoiceConfig.guiMailTaiServer,
        hasFee: invoiceConfig.coThuPhi,
        isTaxDocument: invoiceConfig.chungTuThue,
        isPersonalIncome: invoiceConfig.thuNhapCaNhan,
        isMultiVat: invoiceConfig.mauDaThueSuat,
        isHangGuiDaiLy: invoiceConfig.hangGuiDaiLy,
        adjustConfig: adjustConfigPayload,
        logoBase64: logoBase64 || "",
        backgroundBase64: backgroundBase64 || "",
        customCss: "",
        customXsltContent: xsltContent || "",
      },
      images: {
        logoBase64: logoBase64 || "",
        backgroundBase64: backgroundBase64 || "",
      },
      sampleData: {
        serial: companyData2.invcSign || "",
        pattern: companyData2.invcSample || "",
      },
    };

    return payload;
  };

  // --- Step 2: Xem hóa đơn mẫu ---
  const handleViewInvoice = async () => {
    setLoading2(true);

    try {
      const payload = await buildFullPayload();

      console.log("📄 Preview Payload:", payload);

      const res = await api.post("/InvoicePreview/view", payload);

      if (res.data) {
        // Mở trang mới với HTML được render
        const newWindow = window.open("", "_blank");
        if (newWindow) {
          newWindow.document.write(res.data);
          newWindow.document.close();
          toast.success("✅ Đã mở xem trước hóa đơn");
        } else {
          toast.error("⚠️ Không thể mở cửa sổ mới. Vui lòng cho phép popup!");
        }
      } else {
        toast.error("⚠️ Không có dữ liệu trả về");
      }
    } catch (e: any) {
      toast.error(e.message || "Lỗi khi xem hóa đơn");
    } finally {
      setLoading2(false);
    }
  };

  // --- Step 2: Xác nhận chọn mẫu (Generate XSLT) ---
  const handleConfirmTemplate = async () => {
    // Validate cơ bản
    if (!selectedTemplate && selectedSpecialInvoice === "mauDaThueSuat") {
      toast.error("Vui lòng chọn mẫu hóa đơn!");
      return;
    }

    setLoading2(true);

    try {
      // BƯỚC 1: Build payload để preview/generate
      const previewPayload = await buildFullPayload();
      console.log("📄 Generating XSLT Payload:", previewPayload);

      // BƯỚC 2: Gọi API CMS để lấy XSLT đã điền dữ liệu
      const confirmRes = await api.post(
        "/InvoicePreview/confirm-sample",
        previewPayload
      );

      if (!confirmRes.data || !confirmRes.data.configuredXslt) {
        toast.error("⚠️ Không nhận được nội dung XSLT từ server");
        return;
      } // BƯỚC 3: Xử lý kết quả trả về

      const { configuredXslt: xsltData, finalXmlData } = confirmRes.data;

      // Lưu dữ liệu thô để download
      setConfiguredXslt(xsltData || "");
      setFinalXmlData(finalXmlData || "");

      // Convert String XML sang Base64 (Hỗ trợ tiếng Việt UTF-8)
      const xsltBase64 = btoa(unescape(encodeURIComponent(xsltData)));

      // Tự tạo tên file (Do API confirm-sample hiện tại chưa trả về tên file)
      // Logic: Nếu chọn mẫu từ list thì lấy tên, nếu không thì đặt tên mặc định
      const selectedTemplateObj = availableTemplates.find(
        (t) => t.templateID === Number(selectedTemplate)
      );
      const templateCodeName = selectedTemplateObj
        ? selectedTemplateObj.templateCode
        : "Custom";
      const fileName = `${templateCodeName}_${
        companyData2?.invcSign || "Mau"
      }.xslt`;

      // BƯỚC 4: Lưu vào State để dành cho bước Phát Hành
      setFinalConfiguredXsltBase64(xsltBase64);
      setFinalXsltFileName(fileName);
      setIsTemplateConfirmed(true);

      console.log("✅ XSLT Generated:", fileName);
      toast.success(
        "✅ Đã tạo mẫu thành công! Có thể tải file XSLT/XML để config riêng."
      );
    } catch (e: any) {
      console.error("❌ Confirm Template Error:", e);
      toast.error(
        e.response?.data?.message || e.message || "Lỗi khi xác nhận mẫu"
      );
    } finally {
      setLoading2(false);
    }
  };

  // --- Download XSLT File ---
  const downloadXSLT = () => {
    if (!configuredXslt) {
      toast.error("⚠️ Chưa có dữ liệu XSLT để download!");
      return;
    }

    // Xóa \t và \n
    const cleanedXslt = configuredXslt.replace(/[\t\n]/g, "");

    const blob = new Blob([cleanedXslt], { type: "application/xslt+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = finalXsltFileName || "template.xslt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("✅ Đã tải file XSLT!");
  };

  // --- Download XML File ---
  const downloadXML = () => {
    if (!finalXmlData) {
      toast.error("⚠️ Chưa có dữ liệu XML để download!");
      return;
    }

    // Xóa \t và \n
    const cleanedXml = finalXmlData.replace(/[\t\n]/g, "");

    const blob = new Blob([cleanedXml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyData2?.invcSign || "invoice"}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("✅ Đã tải file XML!");
  };

  // --- Step 2: Phát hành mẫu ---
  // --- Step 2: Phát hành mẫu (Gửi sang Odoo) ---
  const submitPublish = async () => {
    // Validate: Bắt buộc phải Xác nhận mẫu trước
    if (!isTemplateConfirmed) {
      toast.error("⚠️ Vui lòng bấm nút 'Xác nhận mẫu' trước!");
      return;
    }

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
      // Lấy payload cơ bản
      const fullPayload = await buildFullPayload(); // Tính tổng số hóa đơn
      const publishPayload = {
        ...fullPayload,

        // Các thông tin bắt buộc cho Odoo
        cusTax: companyData2.cusTax,
        invSample: companyData2.invcSample,
        invSign: companyData2.invcSign,
        invFrom: selectedContract?.invcFrm,
        invTo: selectedContract?.invcEnd,
        oid: selectedContract?.oid,
        userCode: form2.userCode,
        cusName: companyData2.sName,
        cusAddress: companyData2.address,
        cusEmail: companyData2.cusEmail,
        cusTel: companyData2.cusTel,
        cusBankNo: companyData2.cusBankNumber,
        cusBankTitle: companyData2.cusBankAddress,
        cusWebsite: companyData2.cusWebsite,
        cusFax: companyData2.cusFax,
        cusContactName: companyData2.cusPeopleSign || "",
        cusPosition_BySign: companyData2.cusPosition || "Giám Đốc",
        description: companyData2.cusDes || "",

        // QUAN TRỌNG: Lấy XSLT từ State đã lưu ở bước Xác nhận mẫu
        configuredXsltBase64: finalConfiguredXsltBase64,
        xsltFileName: finalXsltFileName,

        // Đảm bảo có tên file ảnh
        logoFileName: logoFileName || "logo.png",
        backgroundFileName: backgroundFileName || "background.png",

        products: products2.map((p) => ({
          productCode: p.itemID,
          productName: p.itemName,
          uom: p.itemUnitName,
          qty: p.Quantity,
          price: p.itemPrice,
          vatRate: "8", // Gửi string "8"
          vatName: "VAT 8%",
        })),
      };

      console.log("🚀 Publish Payload (To Odoo):", publishPayload);

      const res = await api.post("/odoo/orders/confirm-sample", publishPayload);
      toast.success(
        `✅ ${res.data.message || "Phát hành mẫu thành công!"} | OID: ${
          res.data.oid || "N/A"
        }`
      );
    } catch (e: any) {
      console.error(e);
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
                <strong>"Kiểm tra tài khoản"</strong> (bắt buộc)
              </li>
              <li>
                <strong>Khách cũ:</strong> Bấm{" "}
                <strong>"🔍 Tìm hợp đồng"</strong> → Chọn OID →{" "}
                <strong>"📋 Lấy thông tin đầy đủ"</strong>
              </li>
              <li>
                <strong>Khách mới:</strong> Bấm{" "}
                <strong>"+ Chọn thêm gói"</strong> để chọn sản phẩm thủ công
              </li>
              <li>
                Nhập <strong>Mẫu số</strong> (VD: 01GTKT0/001) và{" "}
                <strong>Ký hiệu</strong> (VD: AA/24E) - bắt buộc
              </li>
              <li>
                Bấm <strong>"Tạo đơn + Cấp TK"</strong>
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

          {/* Thông tin công ty */}
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
                  value={form.mst}
                  onChange={(e) => setForm({ ...form, mst: e.target.value })}
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
                  value={form.cusCMND_ID}
                  onChange={(e) =>
                    setForm({ ...form, cusCMND_ID: e.target.value })
                  }
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
                  value={form.cusName}
                  onChange={(e) =>
                    setForm({ ...form, cusName: e.target.value })
                  }
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
                  value={form.cusAddress}
                  onChange={(e) =>
                    setForm({ ...form, cusAddress: e.target.value })
                  }
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
                  value={form.cusContactName}
                  onChange={(e) =>
                    setForm({ ...form, cusContactName: e.target.value })
                  }
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
                  value={form.cusPosition}
                  onChange={(e) =>
                    setForm({ ...form, cusPosition: e.target.value })
                  }
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
                  value={form.cusEmail}
                  onChange={(e) =>
                    setForm({ ...form, cusEmail: e.target.value })
                  }
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
                  value={form.cusTel}
                  onChange={(e) => setForm({ ...form, cusTel: e.target.value })}
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
                  value={form.cusWebsite}
                  onChange={(e) =>
                    setForm({ ...form, cusWebsite: e.target.value })
                  }
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
                  value={form.cusFax}
                  onChange={(e) => setForm({ ...form, cusFax: e.target.value })}
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
                  value={form.cusBankNo}
                  onChange={(e) =>
                    setForm({ ...form, cusBankNo: e.target.value })
                  }
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
                  value={form.cusBankTitle}
                  onChange={(e) =>
                    setForm({ ...form, cusBankTitle: e.target.value })
                  }
                  placeholder="Tên ngân hàng"
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Ghi chú
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Ghi chú thêm..."
                  rows={2}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Chọn gói dịch vụ */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-blue-800 flex items-center gap-2">
                📦 Gói dịch vụ
              </h3>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Chọn gói
              </button>
            </div>
            <div className="text-xs text-gray-600 mb-4 bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="mb-1">
                ℹ️ <strong>Lưu ý:</strong> Chỉ được chọn tối đa{" "}
                <strong className="text-blue-600">1 gói hóa đơn</strong> +{" "}
                <strong className="text-orange-600">1 dịch vụ</strong>
              </p>
              <p className="text-gray-500">
                → Có thể chọn: <strong>1 gói + 1 dịch vụ</strong> |{" "}
                <strong>Chỉ 1 gói</strong> | <strong>Chỉ 1 dịch vụ</strong>
              </p>
            </div>

            {products.length > 0 ? (
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
                    {products.map((p, idx) => {
                      // CHỈ dùng itemUnitName để phân loại display
                      const isPackage = p.itemUnitName === "Gói";
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-green-200 hover:bg-green-100 ${
                            isPackage ? "bg-blue-50" : "bg-orange-50"
                          }`}
                        >
                          <td className="py-2 px-2">{p.itemID}</td>
                          <td className="py-2 px-2">
                            {p.itemName}
                            {isPackage ? (
                              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                                Gói HĐ
                              </span>
                            ) : (
                              <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                                Dịch vụ
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {p.Quantity}
                          </td>
                          <td className="py-2 px-2 text-right">
                            {p.itemPrice.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-blue-600">
                            {p.itemPerBox > 0 ? p.itemPerBox : "-"}
                          </td>
                          <td className="py-2 px-2 text-right font-semibold">
                            {p.TotalAmount.toLocaleString()}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() =>
                                setProducts(
                                  products.filter((_, i) => i !== idx)
                                )
                              }
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
                      <td colSpan={5} className="py-2 px-2 text-right">
                        Tổng số hóa đơn:
                      </td>
                      <td className="py-2 px-2 text-right text-blue-700">
                        {products
                          .reduce(
                            (sum, p) =>
                              sum +
                              (p.itemPerBox > 0
                                ? p.itemPerBox * p.Quantity
                                : 0),
                            0
                          )
                          .toLocaleString()}{" "}
                        tờ
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-green-100 font-semibold">
                      <td colSpan={5} className="py-2 px-2 text-right">
                        Tổng tiền:
                      </td>
                      <td className="py-2 px-2 text-right text-green-700">
                        {products
                          .reduce((sum, p) => sum + p.TotalAmount, 0)
                          .toLocaleString()}{" "}
                        đ
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 text-center">
                <p className="text-gray-500 text-sm">
                  Chưa chọn gói dịch vụ nào. Vui lòng bấm{" "}
                  <strong>"Chọn gói"</strong> để thêm.
                </p>
              </div>
            )}
          </div>

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
              <li>
                Nhập MST và tải <strong>Thông tin công ty</strong> từ hệ thống
              </li>
              <li>
                Chọn <strong>Mẫu hóa đơn</strong> từ danh sách và xác nhận
              </li>
              <li>
                Upload <strong>Logo</strong>, <strong>Hình nền</strong>,{" "}
                <strong>XML mẫu</strong>, <strong>XSLT mẫu</strong> (tùy chọn)
              </li>
              <li>
                Chỉnh sửa <strong>Cấu hình hóa đơn</strong> bằng các checkbox
              </li>
              <li>Xem trước hóa đơn mẫu hoặc phát hành</li>
            </ul>
          </div>

          {/* Nhập MST để tải thông tin */}
          <div className="border border-blue-400 p-5 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">
              📋 Nhập MST/CCCD để tải thông tin khách hàng
            </h3>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <input
                  type="text"
                  value={form2.mst}
                  onChange={(e) => setForm2({ ...form2, mst: e.target.value })}
                  placeholder="Nhập MST hoặc CCCD"
                  className="w-full border rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      loadCompanyInfoStep2();
                    }
                  }}
                />
              </div>
              <button
                onClick={loadCompanyInfoStep2}
                disabled={loadingCompanyInfo || !form2.mst.trim()}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                {loadingCompanyInfo ? "Đang tải..." : "Tải thông tin"}
              </button>
            </div>
            {contractList.length > 0 && (
              <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    📦 Chọn Hợp đồng / OID
                  </label>
                  {selectedContract && (
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded">
                      Tổng số:{" "}
                      {selectedContract.invcEnd - selectedContract.invcFrm + 1}
                    </span>
                  )}
                </div>

                <select
                  value={selectedContract?.oid || ""}
                  onChange={(e) => {
                    const selected = contractList.find(
                      (c) => c.oid === e.target.value
                    );
                    if (selected) {
                      setSelectedContract(selected);
                      // Cập nhật lại Mẫu số/Ký hiệu trên form khi chọn OID khác
                      setCompanyData2((prev) => ({
                        ...prev!,
                        invcSample: selected.invcSample,
                        invcSign: selected.invcSign,
                      }));
                    }
                  }}
                  className="w-full border-2 border-indigo-300 rounded-md px-3 py-2 text-sm font-medium text-indigo-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {contractList.map((c) => (
                    <option key={c.oid} value={c.oid}>
                      {c.label} (Từ {c.invcFrm} ➝ Đến {c.invcEnd})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Form thông tin công ty (editable) */}
            {companyData2 && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  📝 Thông tin công ty
                  <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    Có thể chỉnh sửa
                  </span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* MST */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      MST/CCCD <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyData2.cusTax}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusTax: e.target.value,
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* CMND/ID */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      CMND/ID
                    </label>
                    <input
                      type="text"
                      value={companyData2.cusCMND_ID || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusCMND_ID: e.target.value,
                        })
                      }
                      placeholder="Nhập CMND/ID"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tên công ty */}
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Tên công ty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyData2.sName || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          sName: e.target.value,
                        })
                      }
                      placeholder="Nhập tên công ty"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Địa chỉ */}
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Địa chỉ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyData2.address || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          address: e.target.value,
                        })
                      }
                      placeholder="Nhập địa chỉ"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Người đại diện */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Người đại diện
                    </label>
                    <input
                      type="text"
                      value={companyData2.cusPeopleSign || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusPeopleSign: e.target.value,
                        })
                      }
                      placeholder="Tên người đại diện"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Chức vụ */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Chức vụ
                    </label>
                    <input
                      type="text"
                      value={companyData2.cusPosition || "Giám Đốc"}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusPosition: e.target.value,
                        })
                      }
                      placeholder="Giám Đốc"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={companyData2.cusEmail}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusEmail: e.target.value,
                        })
                      }
                      placeholder="example@email.com"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* SĐT */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      SĐT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={companyData2.cusTel}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusTel: e.target.value,
                        })
                      }
                      placeholder="0xxxxxxxxx"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Website
                    </label>
                    <input
                      type="url"
                      value={companyData2.cusWebsite || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusWebsite: e.target.value,
                        })
                      }
                      placeholder="https://example.com"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Fax */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Fax
                    </label>
                    <input
                      type="text"
                      value={companyData2.cusFax || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusFax: e.target.value,
                        })
                      }
                      placeholder="Số fax"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Số tài khoản */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      value={companyData2.cusBankNumber || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusBankNumber: e.target.value,
                        })
                      }
                      placeholder="Số tài khoản ngân hàng"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Ngân hàng */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Ngân hàng
                    </label>
                    <input
                      type="text"
                      value={companyData2.cusBankAddress || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusBankAddress: e.target.value,
                        })
                      }
                      placeholder="Tên ngân hàng"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Mẫu số */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <label className="text-sm font-semibold text-yellow-800 mb-1 block flex items-center gap-1">
                      📋 Mẫu số
                      {companyData2.invcSample && (
                        <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          Đã load
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={companyData2.invcSample || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          invcSample: e.target.value,
                        })
                      }
                      placeholder="VD: 01GTKT0/001"
                      className="w-full border-2 border-yellow-300 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                    />
                  </div>

                  {/* Ký hiệu */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <label className="text-sm font-semibold text-yellow-800 mb-1 block flex items-center gap-1">
                      🔖 Ký hiệu
                      {companyData2.invcSign && (
                        <span className="text-xs font-normal text-green-600 bg-green-100 px-2 py-0.5 rounded">
                          Đã load
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={companyData2.invcSign || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          invcSign: e.target.value,
                        })
                      }
                      placeholder="VD: C25TAB"
                      className="w-full border-2 border-yellow-300 rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white"
                    />
                  </div>

                  {/* Ghi chú/Mô tả */}
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Ghi chú/Mô tả
                    </label>
                    <textarea
                      value={companyData2.cusDes || ""}
                      onChange={(e) =>
                        setCompanyData2({
                          ...companyData2,
                          cusDes: e.target.value,
                        })
                      }
                      placeholder="Ghi chú thêm..."
                      rows={2}
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hiển thị danh sách sản phẩm */}
            {companyData2 && products2.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  📦 Danh sách sản phẩm ({products2.length})
                </h4>
                <div className="space-y-2">
                  {products2.map((product, index) => (
                    <div
                      key={product.itemID}
                      className="bg-white p-3 rounded border text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {product.itemName}
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Mã:</span>{" "}
                              {product.itemID}
                            </div>
                            <div>
                              <span className="font-medium">Đơn vị:</span>{" "}
                              {product.itemUnitName}
                            </div>
                            <div>
                              <span className="font-medium">Số lượng/hộp:</span>{" "}
                              {product.itemPerBox}
                            </div>
                            <div>
                              <span className="font-medium">Giá:</span>{" "}
                              {product.itemPrice.toLocaleString("vi-VN")} đ
                            </div>
                            <div>
                              <span className="font-medium">Từ số:</span>{" "}
                              {product.invcFrm}
                            </div>
                            <div>
                              <span className="font-medium">Đến số:</span>{" "}
                              {product.invcEnd}
                            </div>
                          </div>
                        </div>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========== CHỌN MẪU HÓA ĐƠN ========== */}
          {companyData2 && (
            <div className="border-t pt-6">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                📋 Mẫu hóa đơn
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Dropdown chọn mẫu */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Mẫu hiện có{" "}
                    {availableTemplates.length > 0 &&
                      `(${availableTemplates.length} mẫu)`}
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      const templateId = e.target.value;
                      setSelectedTemplate(templateId);
                      setIsTemplateConfirmed(false); // Reset confirm khi đổi mẫu
                      // Load chi tiết mẫu khi chọn
                      if (templateId) {
                        loadTemplateDetail(templateId);
                      } else {
                        setSelectedTemplateRawXslt("");
                      }
                    }}
                    disabled={
                      loadingTemplates ||
                      availableTemplates.length === 0 ||
                      loadingTemplateDetail ||
                      selectedSpecialInvoice !== "mauDaThueSuat"
                    }
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingTemplates
                        ? "⏳ Đang tải mẫu..."
                        : "-- Chọn mẫu --"}
                    </option>
                    {availableTemplates.map((template) => (
                      <option
                        key={template.templateID}
                        value={template.templateID}
                      >
                        {template.templateName || template.templateCode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Button Xem mẫu */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      window.open("http://mau.evat.vn/", "_blank");
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    👁️ Xem toàn bộ mẫu ở Web
                  </button>
                </div>
              </div>

              {/* Row 2: Buttons */}
              <div className="flex gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleConfirmTemplate}
                  disabled={
                    !selectedTemplate ||
                    selectedSpecialInvoice !== "mauDaThueSuat" ||
                    loading2
                  }
                  className={`px-5 py-2.5 text-white text-sm font-semibold rounded transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed ${
                    isTemplateConfirmed
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isTemplateConfirmed ? (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      ✅ Đã xác nhận mẫu
                    </>
                  ) : (
                    <>
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
                      Xác nhận [CHỌN] mẫu
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdjustTemplateOpen(true)}
                  disabled={
                    !selectedTemplate ||
                    selectedSpecialInvoice !== "mauDaThueSuat"
                  }
                  className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  🎨 Điều chỉnh mẫu
                </button>

                <button
                  type="button"
                  onClick={() => toast("Chức năng hiện/ẩn nút đang phát triển")}
                  disabled={
                    !selectedTemplate ||
                    selectedSpecialInvoice !== "mauDaThueSuat"
                  }
                  className="px-5 py-2.5 bg-gray-600 text-white text-sm font-semibold rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                  👁️ Hiện/Ẩn nút
                </button>

                {/* Download XSLT Button */}
                {isTemplateConfirmed && configuredXslt && (
                  <button
                    type="button"
                    onClick={downloadXSLT}
                    className="px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded hover:bg-orange-700 transition-colors flex items-center gap-2"
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    📥 Tải XSLT
                  </button>
                )}

                {/* Download XML Button */}
                {isTemplateConfirmed && finalXmlData && (
                  <button
                    type="button"
                    onClick={downloadXML}
                    className="px-5 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded hover:bg-teal-700 transition-colors flex items-center gap-2"
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    📥 Tải XML
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ========== CẤU HÌNH HÓA ĐƠN ========== */}
          <div className="border-t pt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              ⚙️ Cấu hình hóa đơn
            </h3>

            <div className="grid grid-cols-2 gap-6 text-sm">
              {/* Cột TRÁI: Config cơ bản - Không được bỏ tích */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="space-y-3">
                  <label
                    className={`flex items-center gap-2 p-2 rounded transition-colors ${
                      isToKhaiLocked
                        ? "bg-blue-100 border border-blue-300"
                        : "cursor-pointer hover:bg-blue-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={invoiceConfig.toKhaiDaDuocCoQuanThueDuyet}
                      onChange={(e) =>
                        setInvoiceConfig({
                          ...invoiceConfig,
                          toKhaiDaDuocCoQuanThueDuyet: e.target.checked,
                        })
                      }
                      disabled={isToKhaiLocked}
                      className="w-4 h-4 text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span
                      className={`${
                        isToKhaiLocked
                          ? "text-blue-700 font-medium"
                          : "text-gray-700"
                      }`}
                    >
                      Tờ khai đã được cơ quan thuế duyệt?{" "}
                      {isToKhaiLocked && "🔒"}
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-white">
                    <input
                      type="checkbox"
                      checked={invoiceConfig.phaiAnhSoKyKy}
                      disabled
                      className="w-4 h-4 text-blue-600 disabled:opacity-100"
                    />
                    <span className="text-gray-700">
                      Phát Sinh Số Sau Khi Ký
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-white">
                    <input
                      type="checkbox"
                      checked={invoiceConfig.guiMailTaiServer}
                      disabled
                      className="w-4 h-4 text-blue-600 disabled:opacity-100"
                    />
                    <span className="text-gray-700">Gửi Mail tại Server</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-white">
                    <input
                      type="checkbox"
                      checked={invoiceConfig.coThuPhi}
                      disabled
                      className="w-4 h-4 text-blue-600 disabled:opacity-100"
                    />
                    <span className="text-gray-700">Có thu phí</span>
                  </label>
                </div>
              </div>

              {/* Cột PHẢI: Hóa đơn đặc biệt - Chỉ chọn 1 */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-800 mb-3">
                  📋 Hóa đơn được cấu hình sẵn
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSpecialInvoice === "mauDaThueSuat"}
                      onChange={() =>
                        handleSpecialInvoiceSelect("mauDaThueSuat")
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">Mẫu Hóa Đơn</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSpecialInvoice === "hdvcnb"}
                      onChange={() => handleSpecialInvoiceSelect("hdvcnb")}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">
                      Hóa đơn vận chuyển nội bộ
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSpecialInvoice === "chungTuThue"}
                      onChange={() => handleSpecialInvoiceSelect("chungTuThue")}
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">
                      Chứng từ thuế khấu trừ
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedSpecialInvoice === "hangGuiDaiLy"}
                      onChange={() =>
                        handleSpecialInvoiceSelect("hangGuiDaiLy")
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">Hàng gửi đại lý</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Note cho user */}
            <div className="mt-3 text-xs text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="font-semibold mb-1">💡 Hướng dẫn:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Cột trái:</strong> Các cấu hình cơ bản, mặc định được
                  tích và không thể bỏ (trừ Tờ khai sẽ tự tích khi chạy API)
                </li>
                <li>
                  <strong>Cột phải:</strong> Chỉ chọn{" "}
                  <strong>1 loại duy nhất</strong>. Tích vào{" "}
                  <strong>"Mẫu Hóa Đơn"</strong> để chọn từ dropdown 116 mẫu ở
                  trên
                </li>
                <li>
                  • <strong>Mẫu Hóa Đơn</strong>: Chọn từ dropdown 116 mẫu có
                  sẵn
                </li>
                <li>
                  • <strong>HDVCNB</strong>: XML = einvoice_template_tax78_VCNB,
                  XSLT = VCNB_New
                </li>
                <li>
                  • <strong>Chứng từ thuế khấu trừ</strong>: XML =
                  sys_template_TNCN_ND70, XSLT = TNCN_70
                </li>
                <li>
                  • <strong>Hàng gửi đại lý</strong>: XML =
                  einvoice_template_tax78_HGDL, XSLT = HGDL_TT78
                </li>
              </ul>
            </div>
          </div>

          {/* ========== MẪU HÓA ĐƠN & TÙY CHỈNH ========== */}
          <div className="border-t pt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              🎨 Mẫu hóa đơn & Tùy chỉnh
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Logo công ty */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Logo công ty
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="logo-upload-step2"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoFileName(file.name);
                        const reader = new FileReader();
                        reader.onload = () => {
                          setLogoBase64(reader.result as string);
                          toast.success(`✅ Đã chọn logo: ${file.name}`);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="logo-upload-step2"
                    className="flex-1 cursor-pointer border-2 border-dashed border-yellow-300 bg-yellow-50 rounded-md px-4 py-2.5 text-sm text-center text-gray-700 hover:border-yellow-500 hover:bg-yellow-100 transition-all font-medium"
                  >
                    {logoBase64 ? "✅ Đã chọn logo" : "📁 Chọn logo"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (logoBase64) {
                        const win = window.open();
                        if (win) {
                          win.document.write(
                            `<img src="${logoBase64}" style="max-width:100%; height:auto;" />`
                          );
                        }
                      } else {
                        toast.error("Chưa chọn logo!");
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    👁️
                  </button>
                </div>
              </div>

              {/* Hình nền công ty */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Hình nền công ty
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="background-upload-step2"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBackgroundFileName(file.name);
                        const reader = new FileReader();
                        reader.onload = () => {
                          setBackgroundBase64(reader.result as string);
                          toast.success(`✅ Đã chọn hình nền: ${file.name}`);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="background-upload-step2"
                    className="flex-1 cursor-pointer border-2 border-dashed border-yellow-300 bg-yellow-50 rounded-md px-4 py-2.5 text-sm text-center text-gray-700 hover:border-yellow-500 hover:bg-yellow-100 transition-all font-medium"
                  >
                    {backgroundBase64
                      ? "✅ Đã chọn hình nền"
                      : "📁 Chọn hình nền"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (backgroundBase64) {
                        const win = window.open();
                        if (win) {
                          win.document.write(
                            `<img src="${backgroundBase64}" style="max-width:100%; height:auto;" />`
                          );
                        }
                      } else {
                        toast.error("Chưa chọn hình nền!");
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                  >
                    👁️
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* XML Mẫu (.xml) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  XML Mẫu (.xml)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".xml"
                    className="hidden"
                    id="xml-upload-step2"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setXmlFile(file);
                        toast.success(`✅ Đã chọn XML: ${file.name}`);
                      }
                    }}
                  />
                  <label
                    htmlFor="xml-upload-step2"
                    className="flex-1 cursor-pointer border-2 border-dashed border-purple-300 bg-purple-50 rounded-md px-4 py-2.5 text-sm text-center text-gray-700 hover:border-purple-500 hover:bg-purple-100 transition-all font-medium"
                  >
                    {xmlFile ? `✅ ${xmlFile.name}` : "📄 Chọn file XML"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (xmlFile) {
                        toast("Xem trước XML: " + xmlFile.name);
                      } else {
                        toast.error("Chưa chọn file XML!");
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                  >
                    👁️
                  </button>
                </div>
              </div>

              {/* XSLT Mẫu (.xslt) */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  XSLT Mẫu (.xslt)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".xslt,.xsl"
                    className="hidden"
                    id="xslt-upload-step2"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setXsltFile(file);
                        toast.success(`✅ Đã chọn XSLT: ${file.name}`);
                      }
                    }}
                  />
                  <label
                    htmlFor="xslt-upload-step2"
                    className="flex-1 cursor-pointer border-2 border-dashed border-purple-300 bg-purple-50 rounded-md px-4 py-2.5 text-sm text-center text-gray-700 hover:border-purple-500 hover:bg-purple-100 transition-all font-medium"
                  >
                    {xsltFile ? `✅ ${xsltFile.name}` : "📄 Chọn file XSLT"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (xsltFile) {
                        toast("Xem trước XSLT: " + xsltFile.name);
                      } else {
                        toast.error("Chưa chọn file XSLT!");
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition-colors"
                  >
                    👁️
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mã nhân viên Step 2 */}
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
          <div className="flex justify-center gap-3 pt-4 border-t flex-wrap">
            {/* Button 1: Xem hóa đơn mẫu */}
            <button
              onClick={handleViewInvoice}
              disabled={
                loading2 ||
                !companyData2 ||
                (selectedSpecialInvoice === "mauDaThueSuat" &&
                  !selectedTemplate) ||
                (selectedSpecialInvoice === "" && !selectedTemplate)
              }
              className="px-5 py-3 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
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
              {loading2 ? "Đang xử lý..." : "👁️ Xem hóa đơn mẫu"}
            </button>

            {/* Button 2: Xác nhận mẫu */}
            <button
              onClick={handleConfirmTemplate}
              disabled={
                loading2 ||
                !companyData2 ||
                (selectedSpecialInvoice === "mauDaThueSuat" &&
                  !selectedTemplate) ||
                (selectedSpecialInvoice === "" && !selectedTemplate)
              }
              className="px-5 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
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
              {loading2 ? "Đang xử lý..." : "✅ Xác nhận mẫu"}
            </button>

            {/* Button 3: Phát hành */}
            <button
              onClick={submitPublish}
              disabled={loading2 || !companyData2 || products2.length === 0}
              className="px-5 py-3 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-transform active:scale-95"
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
              {loading2 ? "Đang xử lý..." : "🚀 Phát hành mẫu"}
            </button>
          </div>

          {/* Thông tin payload AdjustConfig */}
          {adjustConfig.thayDoiVien && adjustConfig.vienConfig.selectedVien && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-xs font-medium text-purple-800 mb-1">
                🎨 Đã cấu hình điều chỉnh mẫu:
              </p>
              <div className="text-xs text-purple-700 space-y-0.5">
                <p>
                  ✓ Viền: {adjustConfig.vienConfig.selectedVien} (Độ mạnh:{" "}
                  {adjustConfig.vienConfig.doManh}%)
                </p>
                {adjustConfig.logoPos.width > 0 && (
                  <p>
                    ✓ Logo: {adjustConfig.logoPos.width}x
                    {adjustConfig.logoPos.height}px
                  </p>
                )}
                <p>
                  ✓ Hiển thị:{" "}
                  {[
                    adjustConfig.email && "Email",
                    adjustConfig.fax && "Fax",
                    adjustConfig.soDT && "SĐT",
                    adjustConfig.website && "Website",
                    adjustConfig.songNgu && "Song ngữ",
                    adjustConfig.taiKhoanNganHang && "TKNH",
                  ]
                    .filter(Boolean)
                    .join(", ") || "Mặc định"}
                </p>
              </div>
            </div>
          )}
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
              {form.cusName && (
                <>
                  <br />- <strong>Tên:</strong> {form.cusName}
                </>
              )}
              {form.cusContactName && (
                <>
                  <br />- <strong>Đại diện:</strong> {form.cusContactName} -{" "}
                  {form.cusPosition}
                </>
              )}
              <br />- <strong>Mẫu số:</strong> {form.invcSample}
              <br />- <strong>Ký hiệu:</strong> {form.invcSign}
              <br />- <strong>Số gói dịch vụ:</strong> {products.length}
              <br />- <strong>Tổng số hóa đơn:</strong>{" "}
              <span className="text-blue-600">
                {products
                  .reduce(
                    (sum, p) =>
                      sum + (p.itemPerBox > 0 ? p.itemPerBox * p.Quantity : 0),
                    0
                  )
                  .toLocaleString()}
              </span>{" "}
              tờ (từ {1} đến{" "}
              {products.reduce(
                (sum, p) =>
                  sum + (p.itemPerBox > 0 ? p.itemPerBox * p.Quantity : 0),
                0
              )}
              )
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

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onConfirm={(selectedProducts) => {
          console.log("=== VALIDATION START ===");
          console.log(
            "Selected products:",
            selectedProducts.map((p) => ({
              itemID: p.itemID,
              itemName: p.itemName,
              itemUnitName: p.itemUnitName,
              itemPerBox: p.itemPerBox,
            }))
          );

          // Phân loại theo itemUnitName (chính xác)
          const isPackage = (p: SelectedProduct) => p.itemUnitName === "Gói";
          const isService = (p: SelectedProduct) =>
            p.itemUnitName === "Dịch vụ";

          // Đếm số gói HĐ và dịch vụ hiện có trong giỏ
          const currentPackages = products.filter(isPackage);
          const currentServices = products.filter(isService);

          console.log("Current in cart:", {
            packages: currentPackages.map((p) => p.itemID),
            services: currentServices.map((p) => p.itemID),
          });

          // Đếm số gói HĐ và dịch vụ mới chọn
          const newPackages = selectedProducts.filter(isPackage);
          const newServices = selectedProducts.filter(isService);

          console.log("New selection:", {
            packages: newPackages.map((p) => p.itemID),
            services: newServices.map((p) => p.itemID),
          });

          // Kiểm tra tổng sau khi thêm
          const totalPackages = currentPackages.length + newPackages.length;
          const totalServices = currentServices.length + newServices.length;

          console.log("Total after merge:", {
            packages: totalPackages,
            services: totalServices,
          });

          // Validation: Chỉ cho phép tối đa 1 gói + 1 dịch vụ
          if (totalPackages > 1) {
            console.log("❌ REJECT: Too many packages");
            toast.error(
              `❌ Đã có ${currentPackages.length} gói rồi! Không thể thêm ${newPackages.length} gói nữa. Chỉ được chọn tối đa 1 gói.`
            );
            return;
          }

          if (totalServices > 1) {
            console.log("❌ REJECT: Too many services");
            toast.error(
              `❌ Đã có ${currentServices.length} dịch vụ rồi! Không thể thêm ${newServices.length} dịch vụ nữa. Chỉ được chọn tối đa 1 dịch vụ.`
            );
            return;
          }

          // Merge products: Thêm sản phẩm mới vào danh sách hiện có (không trùng)
          const existingIds = new Set(products.map((p) => p.itemID));
          const newProducts = selectedProducts.filter(
            (p) => !existingIds.has(p.itemID)
          );

          if (newProducts.length === 0) {
            console.log("⚠️ REJECT: Duplicate products");
            toast.error("⚠️ Các sản phẩm này đã được chọn rồi!");
            return;
          }

          console.log(
            "✅ ACCEPTED - Adding products:",
            newProducts.map((p) => p.itemID)
          );

          // Fix: Force itemPerBox = 0 cho dịch vụ (nếu backend trả về sai)
          const fixedProducts = newProducts.map((p) => {
            if (p.itemUnitName === "Dịch vụ") {
              return { ...p, itemPerBox: 0 };
            }
            return p;
          });

          setProducts([...products, ...fixedProducts]);
          setIsProductModalOpen(false);

          const pkgText =
            newPackages.length > 0 ? `${newPackages.length} gói HĐ` : "";
          const svcText =
            newServices.length > 0 ? `${newServices.length} dịch vụ` : "";
          const summary = [pkgText, svcText].filter(Boolean).join(" + ");

          toast.success(`✅ Đã thêm ${summary}`);
          console.log("=== VALIDATION END ===");
        }}
      />

      {/* Điều chỉnh mẫu Modal */}
      <Dialog
        open={isAdjustTemplateOpen}
        onClose={() => setIsAdjustTemplateOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-lg p-6 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Điều chỉnh mẫu
            </Dialog.Title>

            <div className="space-y-6">
              {/* Checkboxes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  📝 Cấu hình hiển thị
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={adjustConfig.email}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          email: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={adjustConfig.fax}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          fax: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Fax</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={adjustConfig.soDT}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          soDT: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Số ĐT</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={adjustConfig.taiKhoanNganHang}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          taiKhoanNganHang: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">
                      Tài khoản ngân hàng
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={adjustConfig.website}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          website: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Website</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={adjustConfig.songNgu}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          songNgu: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Song ngữ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={adjustConfig.thayDoiVien}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          thayDoiVien: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="text-sm text-gray-700">Thay đổi viền</span>
                  </label>
                </div>
              </div>

              {/* Logo Position */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  🖼️ Vị trí Logo
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Độ rộng (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.logoPos.width}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          logoPos: {
                            ...adjustConfig.logoPos,
                            width: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Chiều cao (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.logoPos.height}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          logoPos: {
                            ...adjustConfig.logoPos,
                            height: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Trên (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.logoPos.top}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          logoPos: {
                            ...adjustConfig.logoPos,
                            top: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Trái (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.logoPos.left}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          logoPos: {
                            ...adjustConfig.logoPos,
                            left: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Background Position */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  🎨 Vị trí Hình nền
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Độ rộng (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.backgroundPos.width}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          backgroundPos: {
                            ...adjustConfig.backgroundPos,
                            width: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Chiều cao (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.backgroundPos.height}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          backgroundPos: {
                            ...adjustConfig.backgroundPos,
                            height: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Trên (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.backgroundPos.top}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          backgroundPos: {
                            ...adjustConfig.backgroundPos,
                            top: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Trái (px)
                    </label>
                    <input
                      type="number"
                      value={adjustConfig.backgroundPos.left}
                      onChange={(e) =>
                        setAdjustConfig({
                          ...adjustConfig,
                          backgroundPos: {
                            ...adjustConfig.backgroundPos,
                            left: parseInt(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Border Selection - Chọn viền */}
              {adjustConfig.thayDoiVien && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    🖼️ Cấu hình Viền
                  </h4>
                  <div className="space-y-3">
                    {/* Button xem thư viện */}
                    <div>
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            "http://cdn.evat.vn/?token=phaith",
                            "_blank"
                          )
                        }
                        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2.5 rounded-md hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2 text-sm font-medium"
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
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        🎨 Xem Thư viện Viền
                      </button>
                    </div>

                    {/* Input nhập tên file viền */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Tên file viền
                        <span className="text-gray-500 ml-1">
                          (VD: 0317400198-xanhngocok-01.png)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={adjustConfig.vienConfig.selectedVien}
                        onChange={(e) =>
                          setAdjustConfig({
                            ...adjustConfig,
                            vienConfig: {
                              ...adjustConfig.vienConfig,
                              selectedVien: e.target.value,
                            },
                          })
                        }
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        placeholder="Nhập tên file viền từ thư viện..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Mở thư viện → Chọn viền → Copy tên file → Paste vào
                        đây
                      </p>
                    </div>

                    {/* Độ mạnh */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Độ mạnh (%)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={adjustConfig.vienConfig.doManh}
                          onChange={(e) =>
                            setAdjustConfig({
                              ...adjustConfig,
                              vienConfig: {
                                ...adjustConfig.vienConfig,
                                doManh: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={adjustConfig.vienConfig.doManh}
                          onChange={(e) =>
                            setAdjustConfig({
                              ...adjustConfig,
                              vienConfig: {
                                ...adjustConfig.vienConfig,
                                doManh: parseInt(e.target.value) || 0,
                              },
                            })
                          }
                          className="w-16 border rounded-md px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>

                    {/* Preview viền */}
                    {adjustConfig.vienConfig.selectedVien && (
                      <div className="mt-3 p-3 bg-white rounded border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-gray-700">
                            🖼️ Preview viền:
                          </p>
                          <span className="text-xs text-purple-600 font-medium">
                            {adjustConfig.vienConfig.selectedVien}
                          </span>
                        </div>
                        <div className="relative">
                          <img
                            src={`http://cdn.evat.vn/imgs/${adjustConfig.vienConfig.selectedVien}`}
                            alt="Preview viền"
                            className="w-full h-48 object-cover rounded"
                            style={{
                              borderWidth: "22px",
                              borderStyle: "solid",
                              borderImage: `url(http://cdn.evat.vn/imgs/${adjustConfig.vienConfig.selectedVien}) ${adjustConfig.vienConfig.doManh}% round`,
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const errorDiv =
                                target.nextElementSibling as HTMLElement;
                              if (errorDiv) errorDiv.style.display = "flex";
                            }}
                          />
                          <div className="hidden w-full h-48 bg-red-50 border-2 border-red-300 border-dashed rounded items-center justify-center">
                            <div className="text-center">
                              <p className="text-red-600 text-sm font-medium">
                                ⚠️ Không tìm thấy file viền
                              </p>
                              <p className="text-red-500 text-xs mt-1">
                                Vui lòng kiểm tra lại tên file
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Language Selection */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-green-800 mb-3">
                  🌐 Ngôn ngữ
                </h4>
                <select className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <button
                onClick={() => setIsAdjustTemplateOpen(false)}
                className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  // Build CSS content based on adjustConfig
                  let cssContent = "";

                  // Viền configuration
                  if (
                    adjustConfig.thayDoiVien &&
                    adjustConfig.vienConfig.selectedVien
                  ) {
                    const vienUrl = `http://cdn.evat.vn/imgs/${adjustConfig.vienConfig.selectedVien}`;
                    cssContent += `.vienhd,.page{border-spacing: 0px!important;border: 22px solid transparent!important;border-image: url('${vienUrl}') ${adjustConfig.vienConfig.doManh}% round!important;}`;
                  } else {
                    cssContent += ".vienhd,.page{}";
                  }

                  // Email
                  if (!adjustConfig.email) {
                    cssContent += "#_NBEmail{display: none;}";
                  } else {
                    cssContent += "#_NBEmail{}";
                  }

                  // Fax
                  if (!adjustConfig.fax) {
                    cssContent += "#_NBFax{display: none;}";
                  } else {
                    cssContent += "#_NBFax{}";
                  }

                  // Phone
                  if (!adjustConfig.soDT) {
                    cssContent += "#_NBSDT{display: none;}";
                  } else {
                    cssContent += "#_NBSDT{}";
                  }

                  // Bank
                  if (!adjustConfig.taiKhoanNganHang) {
                    cssContent += "#_NBSTK{display: none;}";
                  } else {
                    cssContent += "#_NBSTK{}";
                  }

                  // Website
                  if (!adjustConfig.website) {
                    cssContent += "#_NBWebsite{display: none;}";
                  } else {
                    cssContent += "#_NBWebsite{}";
                  }

                  // Song ngữ (English)
                  if (!adjustConfig.songNgu) {
                    cssContent += ".en{display: none;}";
                  } else {
                    cssContent += ".en{}";
                  }

                  // Logo position
                  if (adjustConfig.logoPos.width !== 0) {
                    cssContent += `.invoice_logo{width:${adjustConfig.logoPos.width}px}`;
                  }
                  if (adjustConfig.logoPos.top !== 0) {
                    cssContent += `.invoice_logo{top:${adjustConfig.logoPos.top}%}`;
                  }
                  if (adjustConfig.logoPos.left !== 0) {
                    cssContent += `.invoice_logo{left:${adjustConfig.logoPos.left}%}`;
                  }

                  // Background position
                  if (adjustConfig.backgroundPos.width !== 0) {
                    cssContent += `.invoice_background{width:${adjustConfig.backgroundPos.width}px}`;
                  }
                  if (adjustConfig.backgroundPos.top !== 0) {
                    cssContent += `.invoice_background{top:${adjustConfig.backgroundPos.top}%}`;
                  }

                  console.log("CSS Content:", cssContent);
                  console.log("Adjust Config:", adjustConfig);

                  // TODO: Send adjustConfig to BE
                  // Example: await api.post("/template/adjust-config", adjustConfig);

                  toast.success("✅ Đã lưu cấu hình điều chỉnh mẫu");
                  setIsAdjustTemplateOpen(false);
                }}
                className="px-5 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow"
              >
                Xác nhận
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
