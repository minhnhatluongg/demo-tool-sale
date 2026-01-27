import { useState } from 'react';
import api from '../../../api/apiClient';
import toast from 'react-hot-toast';
import { FullInfoResponse, SelectedProduct, ContractOptions } from '../../../types';

export const usePublish = () => {
    const [form, setForm] = useState({
        userCode: "",
        mst: "",
    });

    const [companyData, setCompanyData] = useState<FullInfoResponse | null>(null);
    const [products, setProducts] = useState<SelectedProduct[]>([]);
    const [contractList, setContractList] = useState<ContractOptions[]>([]);
    const [selectedContract, setSelectedContract] = useState<ContractOptions | null>(null);

    const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
    const [loading, setLoading] = useState(false);

    // Template states
    const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [loadingTemplateDetail, setLoadingTemplateDetail] = useState(false);
    const [isTemplateConfirmed, setIsTemplateConfirmed] = useState(false);
    const [isToKhaiLocked, setIsToKhaiLocked] = useState(false);

    // File states
    const [logoBase64, setLogoBase64] = useState("");
    const [logoFileName, setLogoFileName] = useState("");
    const [backgroundBase64, setBackgroundBase64] = useState("");
    const [backgroundFileName, setBackgroundFileName] = useState("");
    const [xsltFile, setXsltFile] = useState<File | null>(null);
    const [xmlFile, setXmlFile] = useState<File | null>(null);

    // Generated files
    const [configuredXslt, setConfiguredXslt] = useState("");
    const [finalXmlData, setFinalXmlData] = useState("");
    const [finalConfiguredXsltBase64, setFinalConfiguredXsltBase64] = useState("");
    const [finalXsltFileName, setFinalXsltFileName] = useState("");
    const [finalXmlFileName, setFinalXmlFileName] = useState("");

    // Invoice configuration
    const [invoiceConfig, setInvoiceConfig] = useState({
        toKhaiDaDuocCoQuanThueDuyet: true,
        hdvcnb: false,
        chungTuThue: false,
        coThuPhi: true,
        phaiAnhSoKyKy: true,
        guiMailTaiServer: true,
        thuNhapCaNhan: false,
        mauDaThueSuat: false,
        hangGuiDaiLy: false,
    });

    const [selectedSpecialInvoice, setSelectedSpecialInvoice] = useState<string>("");

    const [isOwner, setIsOwner] = useState(true);
    const [ownerUserCode, setOwnerUserCode] = useState("");

    // Customer type: 'new' or 'existing'
    const [customerType, setCustomerType] = useState<'new' | 'existing'>('new');


    // Adjust config
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

    // Handler cho việc chọn hóa đơn đặc biệt (chỉ 1)
    const handleSpecialInvoiceSelect = (type: string) => {
        if (selectedSpecialInvoice === type) {
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

    // Load thông tin công ty
    const loadCompanyInfo = async () => {
        const mst = form.mst.trim();
        if (!mst) {
            toast.error("Vui lòng nhập MST/CCCD!");
            return;
        }

        setLoadingCompanyInfo(true);
        try {
            const res = await api.get("/tax/get-full-info-by-mst", { params: { mst } });
            const resData = res.data.data;
            let localIsOwner = true;

            if (resData && resData.contractRange) {
                const crtUser = resData.contractRange.crt_User || "";
                setOwnerUserCode(crtUser);

                if (crtUser && form.userCode && crtUser.trim().toLowerCase() !== form.userCode.trim().toLowerCase()) {
                    localIsOwner = false;
                    setIsOwner(false);
                    toast.error(`⚠️ MST này thuộc quyền quản lý của user: ${crtUser}. Bạn không có quyền phát hành mẫu!`, { duration: 5000 });
                } else {
                    setIsOwner(true);
                }
            }

            if (resData && resData.contractRange) {
                const range = resData.contractRange;
                const mainPkg = resData.products?.find(
                    (p: any) => p.itemUnitName === "Gói" || p.itemUnit === "Gói"
                );
                const pkgName = mainPkg ? mainPkg.itemName : "Gói dịch vụ";
                const contractObj: ContractOptions = {
                    oid: range.oid,
                    label: `${range.oid} - ${pkgName}`,
                    invcFrm: Number(range.invcFrm),
                    invcEnd: Number(range.invcEnd),
                    invcSample: range.invcSample,
                    invcSign: range.invcSign,
                };
                setContractList([contractObj]);
                setSelectedContract(contractObj);
                setCompanyData((prev) => ({
                    ...prev!,
                    invcSample: range.invcSample,
                    invcSign: range.invcSign,
                }));
            }

            if (res.data && res.data.success && res.data.data) {
                const data = res.data.data;
                setCompanyData(data);

                // Load products
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
                    setProducts(mappedProducts);
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

                if (data.invcSample || data.invcSign) {
                    toast.success(
                        `✅ Đã tải thông tin công ty!\n📋 Mẫu số: ${data.invcSample || "N/A"}\n🔖 Ký hiệu: ${data.invcSign || "N/A"}`,
                        { duration: 4000, style: { maxWidth: "500px" } }
                    );
                } else {
                    toast.success("✅ Đã tải thông tin công ty!");
                }

                // Tự động load danh sách mẫu hóa đơn và danh sách hợp đồng
                if (localIsOwner) {
                    loadInvoiceTemplates();

                    // Load danh sách hợp đồng
                    try {
                        const contractRes = await api.get("/Tax/get-oid-list-by-mst", {
                            params: { mst }
                        });

                        if (contractRes.data?.success && contractRes.data?.data) {
                            const contracts = contractRes.data.data.map((contract: any) => ({
                                oid: contract.oid,
                                label: `${contract.oid} - ${contract.kyHieu || 'N/A'}`,
                                invcFrm: contract.tuSo,
                                invcEnd: contract.denSo,
                                invcSample: contract.mauSo,
                                invcSign: contract.kyHieu,
                                ngayTaoHopDong: contract.ngayTaoHopDong,
                            }));

                            setContractList(contracts);

                            // Auto-select first contract if available
                            if (contracts.length > 0) {
                                setSelectedContract(contracts[0]);
                            }

                            toast.success(`📋 Đã tải ${contracts.length} hợp đồng`);
                        }
                    } catch (contractError: any) {
                        console.error("Error loading contracts:", contractError);
                        toast.error("Không thể tải danh sách hợp đồng");
                    }
                }
            } else {
                toast.error("Không tìm thấy thông tin công ty!");
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Lỗi khi tải thông tin công ty!");
        } finally {
            setLoadingCompanyInfo(false);
        }
    };

    // Update company data
    const updateCompanyData = (updatedData: Partial<FullInfoResponse>) => {
        if (companyData) {
            setCompanyData({ ...companyData, ...updatedData });
            toast.success("✅ Đã cập nhật thông tin!");
        }
    };

    // Handle logo upload
    const handleLogoUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Keep full data URI: data:image/png;base64,iVBORw0KG...
            setLogoBase64(base64);
            setLogoFileName(file.name);
            toast.success(`✅ Đã tải logo: ${file.name}`);
        };
        reader.readAsDataURL(file);
    };

    // Handle background upload
    const handleBackgroundUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            // Keep full data URI: data:image/png;base64,iVBORw0KG...
            setBackgroundBase64(base64);
            setBackgroundFileName(file.name);
            toast.success(`✅ Đã tải background: ${file.name}`);
        };
        reader.readAsDataURL(file);
    };

    // Handle XML upload
    const handleXmlUpload = (file: File) => {
        setXmlFile(file);
        toast.success(`✅ Đã tải file XML: ${file.name}`);
    };

    // Handle XSLT upload
    const handleXsltUpload = (file: File) => {
        setXsltFile(file);
        toast.success(`✅ Đã tải file XSLT: ${file.name}`);
    };

    // Remove logo
    const handleRemoveLogo = () => {
        setLogoBase64('');
        setLogoFileName('');
        toast.success('✅ Đã xóa logo');
    };

    // Remove background
    const handleRemoveBackground = () => {
        setBackgroundBase64('');
        setBackgroundFileName('');
        toast.success('✅ Đã xóa background');
    };

    // Load danh sách mẫu hóa đơn
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
            toast.error("Lỗi khi tải danh sách mẫu!");
            setAvailableTemplates([]);
        } finally {
            setLoadingTemplates(false);
        }
    };

    // Build payload
    const buildFullPayload = async () => {
        if (!companyData) {
            throw new Error("Vui lòng lấy thông tin công ty trước!");
        }

        const isSpecialInvoice = ["hdvcnb", "chungTuThue", "hangGuiDaiLy", "thuNhapCaNhan"].includes(selectedSpecialInvoice);
        if (!selectedTemplate && !isSpecialInvoice) {
            throw new Error("Vui lòng chọn mẫu hóa đơn trước!");
        }

        let xsltContent = "";
        if (xsltFile) {
            xsltContent = await xsltFile.text();
        }

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

        const payload = {
            templateId: parseInt(selectedTemplate) || 0,
            xmlDataId: 0,
            company: {
                sampleID: companyData.invcSample || "",
                sampleSerial: companyData.invcSign || "",
                logoBase64: logoBase64 || "",
                filelogo: logoFileName,
                backgroundBase64: backgroundBase64 || "",
                fileBackground: backgroundFileName,
                sName: companyData.sName || "",
                tel: companyData.cusTel || "",
                fax: companyData.cusFax || "",
                address: companyData.address || "",
                bankInfo: companyData.cusBankAddress || "",
                website: companyData.cusWebsite || "",
                email: companyData.cusEmail || "",
                bankNumber: companyData.cusBankNumber || "",
                bankAddress: companyData.cusBankAddress || "",
                merchantID: companyData.cusTax || "",
                personOfMerchant: companyData.cusPeopleSign || "",
                saleID: form.userCode || "",
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
                customXsltContent: xsltContent || "",
            },
            images: {
                logoBase64: logoBase64 || "",
                backgroundBase64: backgroundBase64 || "",
            },
            sampleData: {
                serial: selectedContract?.invcSign || companyData.invcSign || "",
                pattern: selectedContract?.invcSample || companyData.invcSample || "",
            },
        };

        return payload;
    };

    // Xem hóa đơn mẫu
    const handleViewInvoice = async () => {
        setLoading(true);
        try {
            const payload = await buildFullPayload();
            const res = await api.post("/InvoicePreview/view", payload);

            if (res.data) {
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
            setLoading(false);
        }
    };

    // Xác nhận mẫu
    const handleConfirmTemplate = async () => {
        if (!selectedTemplate && selectedSpecialInvoice === "mauDaThueSuat") {
            toast.error("Vui lòng chọn mẫu hóa đơn!");
            return;
        }

        setLoading(true);
        try {
            const previewPayload = await buildFullPayload();
            const confirmRes = await api.post("/InvoicePreview/confirm-sample", previewPayload);

            if (!confirmRes.data || !confirmRes.data.configuredXslt) {
                toast.error("⚠️ Không nhận được nội dung XSLT từ server");
                return;
            }

            const {
                configuredXslt: xsltData,
                finalXmlData,
                xsltFileName,  // Tên file XSLT từ backend
                xmlFileName    // Tên file XML từ backend
            } = confirmRes.data;

            setConfiguredXslt(xsltData || "");
            setFinalXmlData(finalXmlData || "");

            const xsltBase64 = btoa(unescape(encodeURIComponent(xsltData)));

            // Sử dụng tên file từ backend hoặc fallback
            const finalXsltName = xsltFileName || `${companyData?.invcSign || "Mau"}.xslt`;
            const finalXmlName = xmlFileName || `${companyData?.invcSign || "invoice"}.xml`;

            setFinalConfiguredXsltBase64(xsltBase64);
            setFinalXsltFileName(finalXsltName);
            setFinalXmlFileName(finalXmlName);
            setIsTemplateConfirmed(true);

            toast.success("✅ Đã tạo mẫu thành công! Có thể tải file XSLT/XML đã config.");
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message || "Lỗi khi xác nhận mẫu");
        } finally {
            setLoading(false);
        }
    };

    // Download XSLT
    const downloadXSLT = () => {
        if (!configuredXslt) {
            toast.error("⚠️ Chưa có dữ liệu XSLT để download!");
            return;
        }

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

    // Download XML
    const downloadXML = () => {
        if (!finalXmlData) {
            toast.error("⚠️ Chưa có dữ liệu XML để download!");
            return;
        }

        const cleanedXml = finalXmlData.replace(/[\t\n]/g, "");
        const blob = new Blob([cleanedXml], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Sử dụng tên file từ backend hoặc fallback
        a.download = finalXmlFileName || `${companyData?.invcSign || "invoice"}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(`✅ Đã tải file ${finalXmlFileName || 'XML'}!`);
    };

    // Phát hành mẫu
    const submitPublish = async () => {
        if (!isTemplateConfirmed) {
            toast.error("⚠️ Vui lòng bấm nút 'Xác nhận mẫu' trước!");
            return;
        }

        if (!companyData) {
            toast.error("Vui lòng lấy thông tin công ty!");
            return;
        }

        // Quick publish không cần chọn sản phẩm
        // Products validation removed


        setLoading(true);
        try {
            // Xác định factorId dựa trên loại hóa đơn
            let factorId = "EXPOR_GOODSINVC"; // Mặc định: hóa đơn thường
            if (invoiceConfig.hdvcnb) {
                factorId = "EXPOR_INVCVCNB"; // Hóa đơn VCNB
            }

            // Xác định sampleId dựa trên loại khách hàng
            const sampleId = customerType === 'new' ? 'NEW' : selectedTemplate;

            // Clean và encode configuredXslt
            const cleanedXslt = configuredXslt.replace(/[\t\n]/g, "");
            const xsltBase64 = btoa(unescape(encodeURIComponent(cleanedXslt)));

            // Build payload theo đúng schema backend
            const publishPayload = {
                templateId: Number(selectedTemplate) || 0,
                xmlDataId: 0,

                company: {
                    sampleID: selectedContract?.invcSample || companyData.invcSample || "",
                    sampleSerial: selectedContract?.invcSign || companyData.invcSign || "",
                    logoBase64: logoBase64 || "",
                    filelogo: logoFileName || "logo.png",
                    backgroundBase64: backgroundBase64 || "",
                    fileBackground: backgroundFileName || "background.png",
                    sName: companyData.sName || "",
                    tel: companyData.cusTel || "",
                    fax: companyData.cusFax || "",
                    address: companyData.address || "",
                    bankInfo: companyData.cusBankAddress || "",
                    website: companyData.cusWebsite || "",
                    email: companyData.cusEmail || "",
                    bankNumber: companyData.cusBankNumber || "",
                    bankAddress: companyData.cusBankAddress || "",
                    merchantID: companyData.cusTax || "",
                    personOfMerchant: companyData.cusPeopleSign || "",
                    saleID: form.userCode || "",
                    description: companyData.cusDes || "",
                    cmnd: ""
                },

                config: {
                    cksIsSignServerProcess: invoiceConfig.phaiAnhSoKyKy || false,
                    tokhaiApproved: invoiceConfig.toKhaiDaDuocCoQuanThueDuyet || false,
                    isVCNB: invoiceConfig.hdvcnb || false,
                    isTemVe: false,
                    isHDBH: false,
                    isHDVAT: false,
                    signAtClient: invoiceConfig.phaiAnhSoKyKy || false,
                    isMultiVat: invoiceConfig.mauDaThueSuat || false,
                    generateNumberOnSign: false,
                    sendMailAtServer: invoiceConfig.guiMailTaiServer || false,
                    priceBeforeVat: false,
                    hasFee: invoiceConfig.coThuPhi || false,
                    isTaxDocument: invoiceConfig.chungTuThue || false,
                    isHangGuiDaiLy: invoiceConfig.hangGuiDaiLy || false,
                    useSampleData: true,

                    adjustConfig: {
                        isEmail: adjustConfig.email || false,
                        isFax: adjustConfig.fax || false,
                        isSoDT: adjustConfig.soDT || false,
                        isTaiKhoanNganHang: adjustConfig.taiKhoanNganHang || false,
                        isWebsite: adjustConfig.website || false,
                        isSongNgu: adjustConfig.songNgu || false,
                        isThayDoiVien: adjustConfig.thayDoiVien || false,
                        vienConfig: {
                            selectedVien: adjustConfig.vienConfig?.selectedVien || "",
                            doManh: adjustConfig.vienConfig?.doManh || 0
                        },
                        logoPos: {
                            width: adjustConfig.logoPos?.width || 0,
                            height: adjustConfig.logoPos?.height || 0,
                            top: adjustConfig.logoPos?.top || 0,
                            left: adjustConfig.logoPos?.left || 0
                        },
                        backgroundPos: {
                            width: adjustConfig.backgroundPos?.width || 0,
                            height: adjustConfig.backgroundPos?.height || 0,
                            top: adjustConfig.backgroundPos?.top || 0,
                            left: adjustConfig.backgroundPos?.left || 0
                        }
                    },

                    logoBase64: logoBase64 || "",
                    backgroundBase64: backgroundBase64 || "",
                    customCss: "",
                    customXsltContent: xsltFile ? await xsltFile.text() : ""
                },

                sampleData: {
                    serial: selectedContract?.invcSign || companyData.invcSign || "",
                    pattern: selectedContract?.invcSample || companyData.invcSample || "",
                    invc_Frm: String(selectedContract?.invcFrm || 1),
                    invc_End: String(selectedContract?.invcEnd || 0)
                },

                oid: selectedContract?.oid || "",
                cusPosition_BySign: companyData.cusPosition || "Giám Đốc",
                configuredXsltBase64: xsltBase64,
                logoBase64: logoBase64 || "",
                backgroundBase64: backgroundBase64 || "",
                xsltFileName: finalXsltFileName || "template.xslt",
                logoFileName: logoFileName || "logo.png",
                backgroundFileName: backgroundFileName || "background.png",
                invFrom: selectedContract?.invcFrm || 1,
                invTo: selectedContract?.invcEnd || 0,
                invSample: selectedContract?.invcSample || companyData.invcSample || "",
                invSign: selectedContract?.invcSign || companyData.invcSign || "",

                // Thêm 3 trường mới
                customerType: customerType,  // 'new' hoặc 'existing'
                sampleId: sampleId,          // 'NEW' hoặc templateId
                factorId: factorId           // 'EXPOR_GOODSINVC' hoặc 'EXPOR_INVCVCNB'
            };

            console.log("📤 Quick Publish Payload:", publishPayload);

            const res = await api.post("/odoo/orders/quick-publish", publishPayload);
            toast.success(
                `✅ ${res.data.message || "Phát hành mẫu thành công!"} | TraceId: ${res.data.traceId || "N/A"}`
            );

            return res.data;
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message);
            throw e;
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        setForm,
        companyData,
        products,
        contractList,
        selectedContract,
        setSelectedContract,
        loadingCompanyInfo,
        loading,
        availableTemplates,
        selectedTemplate,
        setSelectedTemplate,
        loadingTemplates,
        loadingTemplateDetail,
        isTemplateConfirmed,
        isToKhaiLocked,
        logoBase64,
        setLogoBase64,
        logoFileName,
        setLogoFileName,
        backgroundBase64,
        setBackgroundBase64,
        backgroundFileName,
        setBackgroundFileName,
        xsltFile,
        setXsltFile,
        xmlFile,
        setXmlFile,
        invoiceConfig,
        setInvoiceConfig,
        selectedSpecialInvoice,
        adjustConfig,
        setAdjustConfig,
        handleSpecialInvoiceSelect,
        loadCompanyInfo,
        loadInvoiceTemplates,
        handleViewInvoice,
        handleConfirmTemplate,
        downloadXSLT,
        downloadXML,
        submitPublish,
        isOwner,
        ownerUserCode,
        customerType,
        setCustomerType,
        updateCompanyData,
        handleLogoUpload,
        handleBackgroundUpload,
        handleXmlUpload,
        handleXsltUpload,
        handleRemoveLogo,
        handleRemoveBackground,
    };
};
