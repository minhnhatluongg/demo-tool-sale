import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import technicalApi from "../api/technicalApi";
import {
    KeyIcon,
    ArrowRightOnRectangleIcon,
    ClipboardDocumentIcon,
    CheckCircleIcon,
    UserCircleIcon,
    SparklesIcon,
} from "@heroicons/react/24/solid";

interface GenerateCodeRequest {
    fullName: string;
    phoneNumber: string;
    email: string;
    companyName?: string;
    taxCode?: string;
}

interface GenerateCodeResponse {
    success: boolean;
    message: string;
    data: {
        registrationCode: string;
        expiresAt: string;
        userInfo: {
            fullName: string;
            email: string;
            phoneNumber: string;
        };
    };
    statusCode: number;
}

export default function TechnicalDashboard() {
    const navigate = useNavigate();
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedCode, setGeneratedCode] = useState("");
    const [myCodes, setMyCodes] = useState<any[]>([]);
    const [loadingCodes, setLoadingCodes] = useState(false);
    const [formData, setFormData] = useState<GenerateCodeRequest>({
        fullName: "",
        phoneNumber: "",
        email: "",
        companyName: "",
        taxCode: "",
    });

    useEffect(() => {
        const token = localStorage.getItem("technical_access_token");
        if (!token) {
            navigate("/technical/login");
            return;
        }

        const name = localStorage.getItem("technical_user_name") || "Kỹ thuật viên";
        setUserName(name);

        // Load my codes on mount
        fetchMyCodes();
    }, [navigate]);

    const fetchMyCodes = async () => {
        setLoadingCodes(true);
        try {
            const response = await technicalApi.get("/TechnicalUser/my-codes");
            if (response.data.success) {
                setMyCodes(response.data.data || []);
            }
        } catch (error: any) {
            console.error("Error fetching codes:", error);
        } finally {
            setLoadingCodes(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("technical_access_token");
        localStorage.removeItem("technical_refresh_token");
        localStorage.removeItem("technical_user_name");
        localStorage.removeItem("technical_username");
        toast.success("Đã đăng xuất");
        navigate("/technical/login");
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleGenerateCode = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.fullName || !formData.phoneNumber || !formData.email) {
            toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.error("Email không hợp lệ");
            return;
        }

        // Validate phone number
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(formData.phoneNumber)) {
            toast.error("Số điện thoại không hợp lệ (10-11 số)");
            return;
        }

        setLoading(true);

        try {
            const response = await technicalApi.post<GenerateCodeResponse>(
                "/TechnicalUser/generate-code",
                formData
            );

            if (response.data.success) {
                setGeneratedCode(response.data.data.registrationCode);
                toast.success("Tạo mã thành công!");

                // Reload my codes list
                fetchMyCodes();

                // Reset form
                setFormData({
                    fullName: "",
                    phoneNumber: "",
                    email: "",
                    companyName: "",
                    taxCode: "",
                });
            } else {
                toast.error(response.data.message || "Tạo mã thất bại");
            }
        } catch (error: any) {
            console.error("Generate code error:", error);
            toast.error(error.response?.data?.message || "Tạo mã thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCode);
        toast.success("Đã sao chép mã!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Header */}
            <div className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <SparklesIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Technical Portal</h1>
                                <p className="text-xs text-purple-200">Code Generator System</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                                <UserCircleIcon className="w-5 h-5 text-purple-300" />
                                <span className="text-sm font-medium text-white">{userName}</span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg border border-red-400/30 transition-all transform hover:scale-105"
                            >
                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                <span className="text-sm font-medium">Đăng xuất</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Generate Code Form */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <KeyIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Generate Code</h2>
                                <p className="text-sm text-purple-200">Tạo mã kích hoạt cho khách hàng</p>
                            </div>
                        </div>

                        <form onSubmit={handleGenerateCode} className="space-y-5">
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-purple-100 mb-2">
                                    Họ và tên <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                                    placeholder="Nhập họ tên khách hàng"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="phoneNumber" className="block text-sm font-medium text-purple-100 mb-2">
                                    Số điện thoại <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    type="tel"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                                    placeholder="0912345678"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-purple-100 mb-2">
                                    Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                                    placeholder="example@company.com"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-purple-100 mb-2">
                                    Tên công ty
                                </label>
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                                    placeholder="(Tùy chọn)"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label htmlFor="taxCode" className="block text-sm font-medium text-purple-100 mb-2">
                                    Mã số thuế
                                </label>
                                <input
                                    id="taxCode"
                                    name="taxCode"
                                    type="text"
                                    value={formData.taxCode}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm transition-all"
                                    placeholder="(Tùy chọn)"
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang tạo mã...
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center">
                                        <KeyIcon className="w-5 h-5 mr-2" />
                                        Tạo mã kích hoạt
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Generated Code Display */}
                    <div className="space-y-6">
                        {generatedCode ? (
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 animate-fadeIn">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                        <CheckCircleIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Mã đã tạo</h2>
                                        <p className="text-sm text-purple-200">Sao chép và gửi cho khách hàng</p>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm font-medium text-purple-200">Registration Code</span>
                                        <button
                                            onClick={copyToClipboard}
                                            className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-all"
                                        >
                                            <ClipboardDocumentIcon className="w-4 h-4 text-purple-200" />
                                            <span className="text-xs text-purple-200">Copy</span>
                                        </button>
                                    </div>

                                    <div className="bg-black/30 rounded-lg p-4 font-mono text-2xl text-center text-white tracking-wider break-all">
                                        {generatedCode}
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                                    <p className="text-sm text-blue-200">
                                        <strong>Lưu ý:</strong> Mã này chỉ sử dụng được một lần. Hãy gửi cho khách hàng để họ kích hoạt tài khoản.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 flex flex-col items-center justify-center h-full min-h-[400px]">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                                    <KeyIcon className="w-12 h-12 text-purple-300" />
                                </div>
                                <h3 className="text-xl font-semibold text-white mb-2">Chưa có mã nào được tạo</h3>
                                <p className="text-purple-200 text-center max-w-md">
                                    Điền thông tin khách hàng và nhấn "Tạo mã kích hoạt" để sinh mã đăng ký mới
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* My Codes Section */}
                <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Mã đã tạo</h2>
                                <p className="text-sm text-purple-200">Danh sách các mã kích hoạt của bạn</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchMyCodes}
                            disabled={loadingCodes}
                            className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all"
                        >
                            <svg className={`w-5 h-5 ${loadingCodes ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm font-medium">Làm mới</span>
                        </button>
                    </div>

                    {loadingCodes ? (
                        <div className="flex items-center justify-center py-12">
                            <svg className="animate-spin h-10 w-10 text-purple-400" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : myCodes.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                                <KeyIcon className="w-8 h-8 text-purple-300" />
                            </div>
                            <p className="text-purple-200">Chưa có mã nào được tạo</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-purple-200">Mã</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-purple-200">Trạng thái</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-purple-200">Thông tin</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-purple-200">Ngày tạo</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-purple-200">Hết hạn</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myCodes.map((code) => (
                                        <tr key={code.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center space-x-2">
                                                    <code className="px-2 py-1 bg-black/30 rounded text-sm text-cyan-300 font-mono">
                                                        {code.code}
                                                    </code>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(code.code);
                                                            toast.success("Đã sao chép!");
                                                        }}
                                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                                    >
                                                        <ClipboardDocumentIcon className="w-4 h-4 text-purple-300" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                {code.isUsed ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                                                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                        Đã sử dụng
                                                    </span>
                                                ) : new Date(code.expiredAt) < new Date() ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                                                        Hết hạn
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                        Chưa dùng
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                {code.isUsed && code.usedByEmail ? (
                                                    <div className="text-sm">
                                                        <p className="text-white font-medium">{code.usedByName || 'N/A'}</p>
                                                        <p className="text-purple-300 text-xs">{code.usedByEmail}</p>
                                                        {code.usedAt && (
                                                            <p className="text-purple-400 text-xs">
                                                                Dùng: {new Date(code.usedAt).toLocaleString('vi-VN')}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-purple-400 text-sm">Chưa sử dụng</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-purple-200">
                                                    {new Date(code.createdAt).toLocaleString('vi-VN')}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-purple-200">
                                                    {new Date(code.expiredAt).toLocaleString('vi-VN')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom animations */}
            <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
        </div>
    );
}
