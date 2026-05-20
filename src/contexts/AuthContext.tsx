import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { loginAPI } from '../api/authService';
import toast from 'react-hot-toast';

/* ─── Admin whitelist (UserCode) ───────────────────────────────────────── */
const ADMIN_USER_CODES = ['001332'];

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

const readPersistedUser = (): { user: User | null; token: string | null } => {
    const local = {
        user: localStorage.getItem('user'),
        token: localStorage.getItem('token'),
    };
    if (local.user && local.token) {
        try {
            return { user: JSON.parse(local.user) as User, token: local.token };
        } catch {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    }
    const sess = {
        user: sessionStorage.getItem('user'),
        token: sessionStorage.getItem('token'),
    };
    if (sess.user && sess.token) {
        try {
            return { user: JSON.parse(sess.user) as User, token: sess.token };
        } catch {
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
        }
    }
    return { user: null, token: null };
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isAdmin = useMemo(() => {
        if (!user) return false;
        return ADMIN_USER_CODES.includes(user.userCode);
    }, [user]);

    useEffect(() => {
        const { user: savedUser } = readPersistedUser();
        if (savedUser) setUser(savedUser);
        setIsLoading(false);
    }, []);

    const login = async (loginName: string, password: string, remember: boolean): Promise<User> => {
        setIsLoading(true);
        try {
            const response = await loginAPI(loginName, password);
            if (response.success && response.user && response.token) {
                setUser(response.user);

                const storage = remember ? localStorage : sessionStorage;
                storage.setItem('user', JSON.stringify(response.user));
                storage.setItem('token', response.token);
                if (response.refreshToken) {
                    storage.setItem('refreshToken', response.refreshToken);
                }
                if (remember) {
                    localStorage.setItem('loginName', loginName);
                }

                toast.success(`Chào mừng, ${response.user.fullName || response.user.userCode}!`);
                return response.user;
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
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        toast.success('Đã đăng xuất');
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isAdmin,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
