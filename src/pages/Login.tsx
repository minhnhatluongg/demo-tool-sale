import React, { useState, useEffect } from 'react';
import { SuccessModal } from './login-material';
import { ErrorModal } from './login-material';
import { LoginForm } from './login-material';
import { LoginIllustration } from './login-material';
import { BackgroundElements } from './login-material'
import { ThemeToggle } from './login-material';
import { loginAPI } from '../api/authService';
import { useNavigate } from 'react-router-dom';
import './login-material/animations.css';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Login = () => {
  const [formData, setFormData] = useState({
    loginName: '',
    password: '',
    remember: false,
  });
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleVisibility = () => setIsVisible(!isVisible);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError('');
    setShowSuccess(false);

    if (!formData.loginName.trim() || !formData.password.trim()) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setIsLoading(true);
    try {
      await login(formData.loginName, formData.password, formData.remember);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setError(error.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-500 ${isDark
        ? 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
      }`}>
      {/* Success Modal */}
      <SuccessModal
        isVisible={showSuccess}
        username={formData.loginName}
        isDark={isDark}
      />

      {/* Error Modal */}
      <ErrorModal
        isVisible={!!error}
        error={error}
        onClose={() => setError('')}
        isDark={isDark}
      />

      {/* Animated Background Elements */}
      <BackgroundElements isDark={isDark} />

      {/* Theme Toggle Button */}
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

      {/* Main Container */}
      <div className={`w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'
        }`}>
        {/* Left Side - Illustration */}
        <LoginIllustration isDark={isDark} />

        {/* Right Side - Login Form */}
        <LoginForm
          formData={formData}
          setFormData={setFormData}
          isVisible={isVisible}
          toggleVisibility={toggleVisibility}
          error={error}
          isLoading={isLoading}
          onSubmit={handleSubmit}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default Login;