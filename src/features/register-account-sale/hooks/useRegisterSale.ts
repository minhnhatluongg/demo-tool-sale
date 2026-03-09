import { useState, useEffect } from 'react';
import { Form, message } from 'antd';
import technicalApi from '../../../api/technicalApi';

export const useRegisterSale = (visible: boolean, onClose: () => void, initialCode?: string) => {
    const [form] = Form.useForm();
    const [isCreateAccount, setIsCreateAccount] = useState(false);
    const [treeData, setTreeData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [codeValidated, setCodeValidated] = useState(false);

    // Logic xử lý đệ quy cho cây dữ liệu
    const mapTreeData = (data: any[]): any[] => {
        return data.map((item) => ({
            title: item.name,
            value: item.id,
            key: item.id,
            children: item.children ? mapTreeData(item.children) : []
        }));
    };

    // Validate registration code khi form thay đổi
    const handleCodeChange = async (code: string) => {
        if (!code || code.trim().length < 5) {
            setCodeValidated(false);
            setTreeData([]);
            return;
        }

        try {
            const response = await technicalApi.get(`/TechnicalUser/validate-registration-code/${code.trim()}`);

            if (response.data.success) {
                setCodeValidated(true);
                message.success('✅ Mã hợp lệ!');

                // Load hierarchy tree sau khi code hợp lệ
                const hierarchyResponse = await fetch("https://api-erprc.win-tech.vn/api/SalesHierarchy/managers/21:000?isManager=false");
                const result = await hierarchyResponse.json();
                if (result.success) {
                    setTreeData(mapTreeData(result.data));
                }

                // Pre-fill form nếu có thông tin từ code
                if (response.data.data?.userInfo) {
                    const userInfo = response.data.data.userInfo;
                    form.setFieldsValue({
                        fullName: userInfo.fullName || '',
                        email: userInfo.email || '',
                    });
                }
            } else {
                setCodeValidated(false);
                setTreeData([]);
                message.error(response.data.message || 'Mã không hợp lệ');
            }
        } catch (error) {
            setCodeValidated(false);
            setTreeData([]);
            message.error('Mã không hợp lệ hoặc đã hết hạn');
        }
    };

    // Reset khi đóng modal; tự điền và validate code nếu có initialCode
    useEffect(() => {
        if (!visible) {
            setCodeValidated(false);
            setTreeData([]);
            form.resetFields();
        } else if (visible && initialCode) {
            form.setFieldValue('registrationCode', initialCode);
            handleCodeChange(initialCode);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, form, initialCode]);

    // Xử lý gửi form
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (!codeValidated) {
                message.error('Vui lòng nhập mã đăng ký hợp lệ trước!');
                return;
            }

            setLoading(true);

            // Map form fields to API format
            const payload = {
                fullName: values.fullName,
                email: values.email,
                managerEmplID: values.parentID,
                soCMND: values.soCMND,
                registrationCode: values.registrationCode,
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
                setCodeValidated(false);
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
        codeValidated,
        handleCodeChange
    };
};