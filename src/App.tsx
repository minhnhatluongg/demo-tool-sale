import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardLayout from "./layouts/DashboardLayout";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminContracts from "./pages/admin/AdminContracts";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminSalesTree from "./pages/admin/AdminSalesTree";
import AdminExpiring from "./pages/admin/AdminExpiring";
import RegisterAndPublish_NEW from "./pages/RegisterAndPublish_NEW";
import Register from "./features/register/Register";
import Publish from "./features/publish/Publish";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Wrapped in DashboardLayout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="register" element={<Register />} />
              <Route path="publish" element={<Publish />} />
              {/* eslint-disable-next-line react/jsx-pascal-case */}
              <Route path="register-publish" element={<RegisterAndPublish_NEW />} />
            </Route>

            {/* Admin Routes - Wrapped in AdminLayout */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="contracts" element={<AdminContracts />} />
              <Route path="sales-tree" element={<AdminSalesTree />} />
              <Route path="expiring" element={<AdminExpiring />} />
              <Route path="logs" element={<AdminLogs />} />
            </Route>

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
