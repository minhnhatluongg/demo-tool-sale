import React from 'react';
import { Card, CardBody } from "@heroui/react";
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon } from '@heroicons/react/24/outline';

interface LoginFormData {
  loginName: string;
  password: string;
  remember: boolean;
}

interface LoginFormProps {
  formData: LoginFormData;
  setFormData: React.Dispatch<React.SetStateAction<LoginFormData>>;
  isVisible: boolean;
  toggleVisibility: () => void;
  error: string;
  isLoading: boolean;
  onSubmit: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isDark: boolean;
  onOpenRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  setFormData,
  isVisible,
  toggleVisibility,
  error,
  isLoading,
  onSubmit,
  isDark,
  onOpenRegister
}) => {
  return (
    <Card
      className={`w-full max-w-md mx-auto shadow-2xl transition-all duration-300 ${
        isDark ? 'bg-slate-800/90 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl'
      }`}
    >
      <CardBody className="p-8">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isDark ? 'bg-gradient-to-br from-purple-600 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-purple-600'
          } shadow-lg`}>
            <LockClosedIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Đăng Nhập
          </h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
            <p className="text-red-500 text-sm flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {error}
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Tên đăng nhập *
            </label>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
              isDark
                ? 'border-slate-600 hover:border-purple-500 focus-within:border-purple-500 bg-slate-700/50'
                : 'border-gray-300 hover:border-blue-500 focus-within:border-blue-500 bg-white'
            }`}>
              <UserIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Nhập tên đăng nhập"
                value={formData.loginName}
                onChange={(e) => setFormData(p => ({...p, loginName: e.target.value}))}
                className={`w-full bg-transparent outline-none ${isDark ? 'text-white' : 'text-gray-800'} placeholder:text-gray-400`}
                required
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Mật khẩu *
            </label>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
              isDark
                ? 'border-slate-600 hover:border-purple-500 focus-within:border-purple-500 bg-slate-700/50'
                : 'border-gray-300 hover:border-blue-500 focus-within:border-blue-500 bg-white'
            }`}>
              <LockClosedIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <input
                type={isVisible ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={(e) => setFormData(p => ({...p, password: e.target.value}))}
                className={`flex-1 bg-transparent outline-none ${isDark ? 'text-white' : 'text-gray-800'} placeholder:text-gray-400`}
                required
              />
              <button
                type="button"
                onClick={toggleVisibility}
                className="focus:outline-none flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors"
              >
                {isVisible ? (
                  <EyeSlashIcon className={`w-5 h-5 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} />
                ) : (
                  <EyeIcon className={`w-5 h-5 transition-colors ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) => setFormData(p => ({...p, remember: e.target.checked}))}
                  className="peer sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded transition-all peer-checked:bg-purple-600 peer-checked:border-purple-600 ${
                  isDark ? 'border-gray-500' : 'border-gray-400'
                }`}>
                  {formData.remember && (
                    <svg className="w-full h-full text-white p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className={`text-sm select-none ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Ghi nhớ tôi
              </span>
            </label>
            <button
              type="button"
              className={`text-sm font-medium transition-colors ${
                isDark
                  ? 'text-purple-400 hover:text-purple-300'
                  : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              Quên mật khẩu?
            </button>
          </div>

          <button
            onClick={onSubmit}
            disabled={isLoading}
            className={`w-full py-3 px-6 rounded-lg font-semibold text-white shadow-lg transition-all ${
              isLoading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:scale-105'
            } ${
              isDark
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }`}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </button>
        </div>
        <div className="mt-6 text-center">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Chưa có tài khoản? {' '}
              <button
              type='button'
              onClick={onOpenRegister}
              className={`font-semibold transition-colors underline-offset-4 hover:underline 
                ${isDark ? 
              'text-purple-400 hover:text-purple-300' : 
              'text-blue-600 hover:text-blue-700'}`}>
                Đăng ký nhân sự ngay
              </button>
          </p>
        </div>
        <div className={`mt-8 pt-6 border-t text-center text-xs ${
          isDark ? 'border-slate-700 text-gray-500' : 'border-gray-200 text-gray-500'
        }`}>
          © 2026 WinInvoice Solution - All rights reserved
        </div>
      </CardBody>
    </Card>
  );
};

export default LoginForm;