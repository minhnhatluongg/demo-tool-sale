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

    // Load hierarchy tree khi modal mở
    const loadHierarchyTree = async () => {
        try {
            const hierarchyResponse = await fetch(
                "https://api-erprc.win-tech.vn/api/SalesHierarchy/managers/21:000?isManager=false"
            );
            const result = await hierarchyResponse.json();
            if (result.success) {
                setTreeData(mapTreeData(result.data));
            }
        } catch (error) {
            console.error('Load hierarchy failed:', error);
        }
    };

    // Reset khi đóng modal; load cây cấp quản lý khi mở
    useEffect(() => {
        if (!visible) {
            setTreeData([]);
            form.resetFields();
        } else {
            loadHierarchyTree();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, form]);

    // Xử lý gửi form
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            setLoading(true);

            // Map form fields to API format
            const payload = {
                fullName: values.fullName,
                email: values.email,
                managerEmplID: values.parentID,
                soCMND: values.soCMND,
                isCreateAccount: values.isCreateAccount || false,
                ...(values.isCreateAccount && {
                    loginName: values.loginName,
                    password: values.password
                })
            };
            const response = await fetch("https://api-erprc.win-tech.vn/api/SalesHierarchy/register", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const resData = await response.json();
            if (resData.success) {
                message.success(resData.message || "Đăng ký thành công!");
                form.resetFields();
                setTreeData([]);
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
        loading,
    };
};
