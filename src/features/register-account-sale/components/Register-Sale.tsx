import React from 'react';
import { Modal, Form, Input, Checkbox, TreeSelect, ConfigProvider, theme } from 'antd';
import { useRegisterSale } from '../hooks/useRegisterSale';
import { SearchOutlined, UserOutlined, MailOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';

interface RegisterSaleProps {
    visible: boolean;
    onClose: () => void;
}

const RegisterSaleModal: React.FC<RegisterSaleProps> = ({ visible, onClose }) => {
    const {
        form,
        treeData,
        isCreateAccount,
        setIsCreateAccount,
        handleSubmit,
        loading
    } = useRegisterSale(visible, onClose);

    const { isDark } = useTheme();

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#6366f1',
                    borderRadius: 12,
                    colorBgContainer: isDark ? '#1e293b' : '#ffffff',
                    colorBorder: isDark ? '#475569' : '#d1d5db',
                    colorText: isDark ? '#f1f5f9' : '#1f2937',
                    colorTextSecondary: isDark ? '#cbd5e1' : '#6b7280',
                    colorTextPlaceholder: isDark ? '#64748b' : '#9ca3af',
                },
                components: {
                    Modal: {
                        contentBg: isDark ? '#1e293b' : '#ffffff',
                        headerBg: isDark ? '#1e293b' : '#ffffff',
                        footerBg: isDark ? '#1e293b' : '#ffffff',
                    },
                    Input: {
                        colorBgContainer: isDark ? '#334155' : '#ffffff',
                        colorBorder: isDark ? '#475569' : '#d1d5db',
                        colorText: isDark ? '#f1f5f9' : '#1f2937',
                        colorTextPlaceholder: isDark ? '#94a3b8' : '#9ca3af',
                    },
                    Select: {
                        colorBgContainer: isDark ? '#334155' : '#ffffff',
                        colorBorder: isDark ? '#475569' : '#d1d5db',
                        colorText: isDark ? '#f1f5f9' : '#1f2937',
                        colorTextPlaceholder: isDark ? '#94a3b8' : '#9ca3af',
                    },
                    Checkbox: {
                        colorBgContainer: isDark ? '#334155' : '#ffffff',
                        colorBorder: isDark ? '#475569' : '#d1d5db',
                    },
                },
            }}
        >
            <Modal
                title={
                    <div style={{ textAlign: 'center' }}>
                        <span style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            ĐĂNG KÝ NHÂN SỰ MỚI
                        </span>
                    </div>
                }
                open={visible}
                onOk={handleSubmit}
                onCancel={onClose}
                confirmLoading={loading}
                width={650}
                destroyOnHidden
                centered
                okText="Đăng ký"
                cancelText="Hủy"
                okButtonProps={{
                    style: {
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        border: 'none',
                        height: '44px',
                        fontWeight: 600,
                        borderRadius: '12px',
                    }
                }}
                cancelButtonProps={{
                    style: {
                        height: '44px',
                        fontWeight: 600,
                        borderRadius: '12px',
                    }
                }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ isCreateAccount: false }}
                >
                    <Form.Item
                        name="fullName"
                        label={
                            <span style={{ color: isDark ? '#f1f5f9' : '#1f2937', fontWeight: 500 }}>
                                <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>
                                Họ và tên
                            </span>
                        }
                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Nhập đầy đủ họ tên"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label={
                            <span style={{ color: isDark ? '#f1f5f9' : '#1f2937', fontWeight: 500 }}>
                                <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>
                                Email
                            </span>
                        }
                        rules={[
                            { required: true, message: 'Vui lòng nhập email' },
                            { type: 'email', message: 'Email không hợp lệ' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined />}
                            placeholder="example@gmail.com"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        name="soCMND"
                        label={
                            <span style={{ color: isDark ? '#f1f5f9' : '#1f2937', fontWeight: 500 }}>
                                <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>
                                Số CCCD/CMND
                            </span>
                        }
                        rules={[
                            { required: true, message: 'Vui lòng nhập số CCCD/CMND' },
                            { pattern: /^[0-9]{9,12}$/, message: 'Số CCCD/CMND phải từ 9-12 chữ số' }
                        ]}
                    >
                        <Input
                            prefix={<UserOutlined />}
                            placeholder="Nhập số CCCD/CMND"
                            size="large"
                            maxLength={12}
                        />
                    </Form.Item>

                    <Form.Item
                        name="parentID"
                        label={
                            <span style={{ color: isDark ? '#f1f5f9' : '#1f2937', fontWeight: 500 }}>
                                <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>
                                Cấp quản lý trực tiếp
                            </span>
                        }
                        rules={[{ required: true, message: 'Vui lòng chọn cấp quản lý' }]}
                    >
                        <TreeSelect
                            showSearch
                            treeData={treeData}
                            placeholder="Tìm kiếm và chọn cấp trên..."
                            treeDefaultExpandAll={false}
                            size="large"
                            suffixIcon={<SearchOutlined />}
                            filterTreeNode={(input, treeNode) => {
                                const title = treeNode.title as string;
                                return title.toLowerCase().includes(input.toLowerCase());
                            }}
                        />
                    </Form.Item>

                    <Form.Item name="isCreateAccount" valuePropName="checked" style={{ marginBottom: '24px' }}>
                        <Checkbox
                            onChange={(e) => setIsCreateAccount(e.target.checked)}
                            style={{
                                color: isDark ? '#f1f5f9' : '#1f2937',
                                fontWeight: 500,
                                fontSize: '15px'
                            }}
                        >
                            <TeamOutlined style={{ marginRight: 8 }} />
                            Tạo tài khoản ERP cho nhân sự này
                        </Checkbox>
                    </Form.Item>

                    {isCreateAccount && (
                        <div style={{
                            background: isDark
                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
                                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                            border: `2px solid ${isDark ? '#6366f1' : '#c7d2fe'}`,
                            borderRadius: '16px',
                            padding: '24px',
                            marginTop: '16px',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '20px',
                                paddingBottom: '16px',
                                borderBottom: `1px solid ${isDark ? '#475569' : '#e5e7eb'}`,
                            }}>
                                <LockOutlined style={{ fontSize: '18px', color: '#6366f1' }} />
                                <span style={{
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    color: isDark ? '#f1f5f9' : '#1f2937',
                                }}>
                                    Thông tin đăng nhập
                                </span>
                            </div>

                            <Form.Item
                                name="loginName"
                                label={
                                    <span style={{ color: isDark ? '#f1f5f9' : '#1f2937', fontWeight: 600 }}>
                                        <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>
                                        Tên đăng nhập
                                    </span>
                                }
                                rules={[
                                    { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                                    { min: 5, message: 'Tên đăng nhập phải có ít nhất 5 ký tự' }
                                ]}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder="Tối thiểu 5 ký tự"
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                label={
                                    <span style={{ color: isDark ? '#f1f5f9' : '#1f2937', fontWeight: 600 }}>
                                        <span style={{ color: '#ef4444', marginRight: '4px' }}>*</span>
                                        Mật khẩu
                                    </span>
                                }
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="Tối thiểu 6 ký tự"
                                    size="large"
                                />
                            </Form.Item>
                        </div>
                    )}
                </Form>
            </Modal>
        </ConfigProvider>
    );
};

export default RegisterSaleModal;