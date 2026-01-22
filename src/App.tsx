import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Tabs from "./components/Tabs";
import RegisterAccount from "./pages/RegisterAccount";
import PublishTemplate from "./pages/PublishTemplate";
import ExtendInvoice from "./pages/ExtendInvoice";
import RenewContract from "./pages/RenewContract";
import RegisterAndPublish_NEW from "./pages/RegisterAndPublish_NEW";

export default function App() {
  const BACKEND_API_URL = "https://cms.wininvoice.vn";
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              UI Tạo - Phát Hành - Gia Hạn (Hóa Đơn) - API Testing UI
            </h1>
            <p className="text-gray-600 text-sm">
              Test API tạo đơn hàng, cấp tài khoản, phát hành mẫu hóa đơn
            </p>
            {/* 🌐 Link backend màu xanh có hover */}
            <p className="text-sm mt-1">
              Made by MNL | Backend API:&nbsp;
              <a
                href={BACKEND_API_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors underline underline-offset-2"
              >
                {BACKEND_API_URL}
              </a>
            </p>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            <Tabs />
            <Routes>
              <Route path="/" element={<Navigate to="/register-publish" />} />
              {/* eslint-disable-next-line react/jsx-pascal-case */}
              <Route path="/register-publish" element={<RegisterAndPublish_NEW />} />
              <Route path="/register" element={<RegisterAccount />} />
              <Route path="/publish" element={<PublishTemplate />} />
              <Route path="/extend" element={<ExtendInvoice />} />
              <Route path="/renew" element={<RenewContract />} />
            </Routes>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-gray-500">
            <p>© 2025 Internal Testing Tool | Version 1.0.0</p>
            <p className="mt-1">
              Backend API:{" "}
              <code className="bg-gray-100 px-2 py-0.5 rounded">
                http://localhost:44344
              </code>
            </p>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}
