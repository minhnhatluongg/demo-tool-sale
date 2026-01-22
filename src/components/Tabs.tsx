import React from "react";
import { NavLink } from "react-router-dom";

export default function Tabs() {
  const tabs = [
    { path: "/register-publish", label: "Khách hàng WT (2 bước)" },
    { path: "/register", label: "Đăng ký cấp tài khoản" },
    { path: "/publish", label: "Phát hành mẫu hóa đơn" },
    { path: "/extend", label: "Gia hạn thêm số hóa đơn" },
    { path: "/renew", label: "Gia hạn hợp đồng" },
  ];

  return (
    <div className="flex gap-6 border-b border-gray-300 mb-6">
      {tabs.map((t) => (
        <NavLink
          key={t.path}
          to={t.path}
          className={({ isActive }) =>
            `pb-2 text-sm font-semibold ${
              isActive ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-600"
            }`
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
