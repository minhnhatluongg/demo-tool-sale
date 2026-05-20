import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../utils/admin';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
                <div className="text-center text-white/80">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
                    <p className="mt-4 text-sm">Đang kiểm tra phiên admin...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdmin(user)) return <Navigate to="/dashboard" replace />;

    return <>{children}</>;
};

export default AdminProtectedRoute;
