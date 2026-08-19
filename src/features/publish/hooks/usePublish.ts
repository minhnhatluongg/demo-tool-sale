import { useState, useEffect } from 'react';
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

    // Loại hóa đơn (FactorID) — quyết định loại hóa đơn hiển thị: GTGT, máy tính tiền, PXK, tem-vé, TNCN...
    // Danh sách load động từ bosConfigure..bosFactors qua API.
    const [invoiceTypes, setInvoiceTypes] = useState<{ factorId: string; name: string }[]>([]);
    const [selectedFactorId, setSelectedFactorId] = useState<string>("EXPOR_GOODSINVC");

    const [isOwner, setIsOwner] = useState(true);
    const [ownerUserCode, setOwnerUserCode] = useState("");


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

    // Map cấu hình BE dò được (AdjustConfigDto, camelCase) → state checkbox của FE.
    // Đảm bảo "hiển thị SĐT thì tick, không hiển thị thì bỏ tick" đúng theo NỘI DUNG mẫu.
    const applyDetectedConfig = (detected: any) => {
        if (!detected) return;
        setAdjustConfig((prev) => ({
            ...prev,
            email: !!detected.isEmail,
            fax: !!detected.isFax,
            soDT: !!detected.isSoDT,
            taiKhoanNganHang: !!detected.isTaiKhoanNganHang,
            website: !!detected.isWebsite,
            songNgu: !!detected.isSongNgu,
            thayDoiVien: !!detected.isThayDoiVien,
            vienConfig: {
                selectedVien: detected.vienConfig?.selectedVien ?? prev.vienConfig.selectedVien ?? "",
                doManh: detected.vienConfig?.doManh ?? prev.vienConfig.doManh ?? 0,
            },
        }));
    };

    // Load danh sách loại hóa đơn (FactorID) từ bosFactors 1 lần khi mở trang.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await api.get("/InvoicePreview/invoice-types");
                const list = (res.data || []).map((x: any) => ({
                    factorId: x.factorId ?? x.FactorId,
                    name: x.name ?? x.Name,
                }));
                if (!cancelled && list.length) setInvoiceTypes(list);
            } catch {
                // Không chặn flow nếu API danh mục lỗi — vẫn publish được với mặc định GTGT
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Đồng bộ ngược: khi tick "Hóa đơn VCNB" ở nhóm loại đặc biệt thì chọn luôn FactorID VCNB cho tiện.
    useEffect(() => {
        if (invoiceConfig.hdvcnb) setSelectedFactorId("EXPOR_INVCVCNB");
        else if (selectedFactorId === "EXPOR_INVCVCNB") setSelectedFactorId("EXPOR_GOODSINVC");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceConfig.hdvcnb]);

    // Khi chọn mẫu (TemplateId) → đọc cấu hình ẩn/hiện + viền trực tiếp từ file mẫu để tick chính xác.
    useEffect(() => {
        const id = parseInt(selectedTemplate);
        if (!id) return;

        let cancelled = false;
        (async () => {
            try {
                const res = await api.get(`/invoice/templates/${id}`);
                const detected = res.data?.data?.detectedConfig;
                if (!cancelled && detected) {
                    applyDetectedConfig(detected);
                    toast.success("👁️ Đã đọc cấu hình ẩn/hiện từ mẫu");
                }
            } catch {
                // Không chặn flow nếu dò cấu hình lỗi
            }
        })();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTemplate]);

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

    // Handle XSLT upload — đọc luôn cấu hình ẩn/hiện + viền từ file để tick checkbox chính xác.
    const handleXsltUpload = async (file: File) => {
        setXsltFile(file);
        toast.success(`✅ Đã tải file XSLT: ${file.name}`);
        try {
            const text = await file.text();
            const res = await api.post("/invoice/templates/detect-config", { rawXslt: text });
            const detected = res.data?.data;
            if (detected) {
                applyDetectedConfig(detected);
                toast.success("👁️ Đã đọc cấu hình ẩn/hiện từ file XSLT");
            }
        } catch {
            // Không chặn flow nếu dò cấu hình lỗi
        }
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
    // BE: ERP_Portal_RC.InvoicePreviewController.ViewInvoicePreview
    // POST /api/InvoicePreview/view  → trả về text/html
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
    // BE: ERP_Portal_RC.InvoicePreviewController.ConfirmSampleAndGetFiles
    // POST /api/InvoicePreview/confirm-sample → trả về JSON { configuredXslt, finalXmlData, xsltFileName, xmlFileName }
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

        // KHÔNG xóa \t\n: XSLT chứa <script><![CDATA[...]]> — mất xuống dòng sẽ phá JavaScript
        // (comment // nuốt cả script ⇒ mất viền & phân trang). Giữ nguyên nội dung từ BE.
        const blob = new Blob([configuredXslt], { type: "application/xslt+xml" });
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
            // Loại hóa đơn do người dùng chọn ở dropdown (12 loại từ bosFactors).
            // Nếu tick VCNB thì ưu tiên VCNB để khớp mẫu đặc biệt.
            let factorId = selectedFactorId || "EXPOR_GOODSINVC";
            if (invoiceConfig.hdvcnb) {
                factorId = "EXPOR_INVCVCNB";
            }

            // 🔧 FIX: Luôn sử dụng 'NEW' cho sampleId (không còn chọn loại khách hàng)
            const sampleId = 'NEW';
            console.log(`🔍 sampleId: ${sampleId} (Always NEW)`);

            // QUAN TRỌNG: KHÔNG xóa \t\n. XSLT có <script><![CDATA[...]]>; bỏ xuống dòng sẽ
            // biến cả script thành 1 dòng → các comment "//" nuốt hết phần sau → JS chết →
            // mất class 'vienhd' (mất viền) & mất phân trang khi sang hệ thống hóa đơn.
            // Dùng đúng base64 đã tạo ở bước "Xác nhận mẫu" (giữ nguyên 100% nội dung BE trả về).
            const xsltBase64 = finalConfiguredXsltBase64 || btoa(unescape(encodeURIComponent(configuredXslt)));

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

                // Thêm 2 trường mới (customerType đã bỏ)
                sampleId: sampleId,          // Luôn là 'NEW'
                factorId: factorId           // 'EXPOR_GOODSINVC' hoặc 'EXPOR_INVCVCNB'
            };

            console.log("📤 Quick Publish Payload:", publishPayload);

            // BE: ERP_Portal_RC.InvoicePreviewController.QuickPublish
            // POST /api/InvoicePreview/quick-publish
            const res = await api.post("/InvoicePreview/quick-publish", publishPayload);
            toast.success(
                `✅ ${res.data.message || res.data.Message || "Phát hành mẫu thành công!"} | TraceId: ${res.data.traceId || res.data.TraceId || "N/A"}`
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
        invoiceTypes,
        selectedFactorId,
        setSelectedFactorId,
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
        updateCompanyData,
        handleLogoUpload,
        handleBackgroundUpload,
        handleXmlUpload,
        handleXsltUpload,
        handleRemoveLogo,
        handleRemoveBackground,
    };
};
