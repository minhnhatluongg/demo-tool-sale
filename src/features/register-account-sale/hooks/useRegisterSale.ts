import { useState, useEffect } from 'react';
import { Form, message } from 'antd';

export const useRegisterSale = (visible: boolean, onClose: () => void) => {
    const [form] = Form.useForm();
    const [isCreateAccount, setIsCreateAccount] = useState(false);
    const [treeData, setTreeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Logic xử lý đệ quy cho cây dữ liệu
    const mapTreeData = (data: any[]): any[] => {
        return data.map((item) => ({
            title: item.name,
            value: item.id,
            key: item.id,
            children: item.children ? mapTreeData(item.children) : []
        }));
    };

    // Load dữ liệu phân cấp
    useEffect(() => {
        const fetchHierarchy = async () => {
            try {
                const response = await fetch("https://localhost:7112/api/SalesHierarchy/managers/21:000?isManager=false");
                const result = await response.json();
                if (result.success) {
                    setTreeData(mapTreeData(result.data));
                }
            } catch (error) {
                message.error("Không thể tải danh sách quản lý");
            }
        };
        if (visible) fetchHierarchy();
    }, [visible]);

    // Xử lý gửi form
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            // Map form fields to API format
            const payload = {
                fullName: values.fullName,
                email: values.email,
                managerEmplID: values.parentID, // Map parentID → managerEmplID
                soCMND: values.soCMND,
                isCreateAccount: values.isCreateAccount || false,
                ...(values.isCreateAccount && {
                    loginName: values.loginName,
                    password: values.password
                })
            };

            console.log('Payload gửi đi:', payload); // Debug log

            const response = await fetch("api/SaleHierarchy/register", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();
            if (resData.success) {
                message.success("Đăng ký thành công!");
                form.resetFields();
                onClose();
            } else {
                message.error(resData.message || "Có lỗi xảy ra");
            }
        } catch (error) {
            console.error("Validate failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        treeData,
        isCreateAccount,
        setIsCreateAccount,
        handleSubmit,
        loading
    };
};