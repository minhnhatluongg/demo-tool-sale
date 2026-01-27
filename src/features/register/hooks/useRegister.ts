import { useState } from 'react';
import api from '../../../api/apiClient';
import toast from 'react-hot-toast';
import { SelectedProduct } from '../../../types';

export const useRegister = () => {
    const [form, setForm] = useState({
        userCode: "",
        mst: "",
        invcSample: "",
        invcSign: "",
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
        cusPosition: "Giám Đốc",
        description: "",
    });

    const [products, setProducts] = useState<SelectedProduct[]>([]);
    const [hasAccount, setHasAccount] = useState<boolean | null>(null);
    const [serverInfo, setServerInfo] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [loadingCheck, setLoadingCheck] = useState(false);
    const [logoBase64, setLogoBase64] = useState("");
    const [logoFileName, setLogoFileName] = useState("");
    const [backgroundBase64, setBackgroundBase64] = useState("");
    const [backgroundFileName, setBackgroundFileName] = useState("");
    const [isOwner, setIsOwner] = useState<boolean | null>(null);
    const [ownerUserCode, setOwnerUserCode] = useState<string>("");

    // Order type fields
    const [orderType, setOrderType] = useState<number>(0); // 0: mới, 1: gia hạn, 2: cấp bù
    const [oldOID, setOldOID] = useState<string>("");
    const [refeContractDate, setRefeContractDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [oldContractList, setOldContractList] = useState<any[]>([]);
    const [loadingOldContracts, setLoadingOldContracts] = useState(false);

    // Load old contracts
    const loadOldContracts = async () => {
        const mst = form.mst.trim();
        if (!mst) {
            toast.error("Vui lòng nhập MST trước!");
            return;
        }

        setLoadingOldContracts(true);
        try {
            const res = await api.get("/Tax/get-oid-list-by-mst", { params: { mst } });
            if (res.data?.success && res.data?.data) {
                setOldContractList(res.data.data);
                if (res.data.data.length === 0) {
                    toast("Không tìm thấy hợp đồng cũ nào.", { icon: "ℹ️" });
                }
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || "Lỗi khi tải danh sách hợp đồng");
        } finally {
            setLoadingOldContracts(false);
        }
    };

    // Check tài khoản EVAT
    const checkAccount = async () => {
        const mst = form.mst.trim();
        if (!mst) {
            toast.error("Vui lòng nhập mã số thuế để kiểm tra.");
            return;
        }

        setLoadingCheck(true);
        try {
            const res = await api.get("/Win/check-account", { params: { mst } });
            const data = res.data?.data;
            setHasAccount(res.data.hasAccount);
            setServerInfo(data?.serverName || "");

            if (res.data.hasAccount) {
                // Có tài khoản -> gọi API lấy thông tin đầy đủ
                try {
                    const fullInfoRes = await api.get("/Tax/get-full-info-by-mst", {
                        params: { mst, loaiCap: 0 }
                    });

                    if (fullInfoRes.data?.success && fullInfoRes.data?.data) {
                        const fullData = fullInfoRes.data.data;
                        const crtUser = fullData.contractRange?.crt_User || "";
                        setOwnerUserCode(crtUser);

                        // So sánh với userCode hiện tại
                        if (crtUser === form.userCode) {
                            // Là chủ sở hữu -> cho phép tạo đơn mới
                            setIsOwner(true);

                            // Load thông tin vào form
                            setForm(prev => ({
                                ...prev,
                                cusName: fullData.sName || prev.cusName,
                                cusContactName: fullData.cusPeople_Sign || "",
                                cusAddress: fullData.address || prev.cusAddress,
                                cusEmail: fullData.cusEmail || prev.cusEmail,
                                cusTel: fullData.cusTel || prev.cusTel,
                                cusBankNo: fullData.cusBankNumber || "",
                                cusBankTitle: fullData.cusBankAddress || "",
                                cusWebsite: fullData.cusWebsite || "",
                            }));
                            toast.success(`✅ Đã tải thông tin khách hàng. Bạn có quyền tạo đơn mới cho MST này.`);
                        } else {
                            // Không phải chủ sở hữu
                            setIsOwner(false);
                            toast.error(
                                `⚠️ MST này đã được SALE khác (${crtUser}) lên đơn. Vui lòng liên hệ kỹ thuật kiểm tra.`,
                                { duration: 6000 }
                            );
                        }
                    }
                } catch (fullInfoError: any) {
                    console.error("Error loading full info:", fullInfoError);
                    toast.error("Lỗi khi tải thông tin chi tiết khách hàng.");
                }
            } else {
                setIsOwner(true);
                toast.success("Khách hàng chưa có tài khoản, có thể cấp TK hoặc tạo đơn.");
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.message);
        } finally {
            setLoadingCheck(false);
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        if (hasAccount === null) {
            toast.error("Vui lòng kiểm tra tài khoản trước khi tạo đơn!");
            return false;
        }

        // Kiểm tra quyền sở hữu
        if (hasAccount === true && isOwner === false) {
            toast.error(`⚠️ MST này đã được SALE khác (${ownerUserCode}) lên đơn. Vui lòng liên hệ kỹ thuật kiểm tra.`, {
                duration: 6000
            });
            return false;
        }

        if (!form.mst.trim()) {
            toast.error("Vui lòng nhập MST/CCCD!");
            return false;
        }
        if (!form.cusName.trim()) {
            toast.error("⚠️ Vui lòng nhập Tên công ty!");
            return false;
        }
        if (!form.cusAddress.trim()) {
            toast.error("⚠️ Vui lòng nhập Địa chỉ!");
            return false;
        }
        if (!form.cusEmail.trim()) {
            toast.error("⚠️ Vui lòng nhập Email!");
            return false;
        }
        if (!form.cusTel.trim()) {
            toast.error("⚠️ Vui lòng nhập Số điện thoại!");
            return false;
        }
        if (!form.invcSample.trim()) {
            toast.error("Vui lòng nhập Mẫu số!");
            return false;
        }
        if (!form.invcSign.trim()) {
            toast.error("Vui lòng nhập Ký hiệu!");
            return false;
        }
        if (products.length === 0) {
            toast.error("Vui lòng chọn ít nhất 1 gói !");
            return false;
        }

        // Validate orderType fields
        if (orderType === 1 || orderType === 2) {
            if (!oldOID.trim()) {
                toast.error(`⚠️ Vui lòng nhập OID hợp đồng cũ cho ${orderType === 1 ? 'gia hạn' : 'cấp bù'}!`);
                return false;
            }
            if (!refeContractDate) {
                toast.error("⚠️ Vui lòng chọn ngày hợp đồng cũ!");
                return false;
            }
        }

        return true;
    };

    // Submit đăng ký
    const submitRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const packageProduct = products.find((p) => p.itemUnitName === "Gói");
            const calculatedInvTo = packageProduct ? packageProduct.itemPerBox : 0;

            const payload = {
                // Order type fields
                orderType: orderType,
                oldOID: (orderType === 1 || orderType === 2) ? oldOID : "",
                refeContractDate: (orderType === 1 || orderType === 2) ? new Date(refeContractDate).toISOString() : new Date().toISOString(),
                isOnline: 1,

                // Customer info
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
                logoBase64: logoBase64,
                filelogo: logoFileName,
                backgroundBase64: backgroundBase64,
                fileBackground: backgroundFileName,
                cusCMND_ID: form.cusCMND_ID,
                cusContactName: form.cusContactName,
                cusPosition_BySign: form.cusPosition,
                cusLegalValue: "",
                invCusName: "",
                invCusAddress: "",
                invCusPhone: "",
                invCusEmail: "",
                description: form.description,

                // Invoice info
                invSample: form.invcSample,
                invSign: form.invcSign,
                invFrom: 1,
                invTo: calculatedInvTo,

                // Products
                products: products.length > 0
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
                    : [{
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
                    }],
            };

            const res = await api.post("/odoo/orders/createFull", payload);
            toast.success(`✅ ${res.data.message} (OID: ${res.data.oid})`);
            setHasAccount(true);

            // Reset form sau khi thành công
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
        products,
        setProducts,
        hasAccount,
        serverInfo,
        loading,
        loadingCheck,
        logoBase64,
        setLogoBase64,
        logoFileName,
        setLogoFileName,
        backgroundBase64,
        setBackgroundBase64,
        backgroundFileName,
        setBackgroundFileName,
        isOwner,
        ownerUserCode,
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
    };
};
