import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { loginAPI } from '../api/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');

        if (savedUser && savedToken) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error('Failed to parse saved user:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (loginName: string, password: string, remember: boolean) => {
        setIsLoading(true);
        try {
            const response = await loginAPI(loginName, password);
            if (response.success && response.user) {
                setUser(response.user);
                if (remember) {
                    localStorage.setItem('user', JSON.stringify(response.user));
                    localStorage.setItem('loginName', loginName);
                    if (response.token) {
                        localStorage.setItem('token', response.token);
                    }
                } else {
                    // Chỉ lưu vào sessionStorage
                    sessionStorage.setItem('user', JSON.stringify(response.user));
                    if (response.token) {
                        sessionStorage.setItem('token', response.token);
                    }
                }
                toast.success(`Chào mừng, ${response.user.fullName}!`);
            } else {
                throw new Error(response.message || 'Đăng nhập thất bại');
            }
        } catch (error: any) {
            toast.error(error.message || 'Có lỗi xảy ra khi đăng nhập');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        toast.success('Đã đăng xuất');
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
