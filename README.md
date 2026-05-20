# ⚡ ERP ToolSale — Admin Console & Sales Portal

> Internal tool hỗ trợ đội ngũ Sale & Admin quản lý hợp đồng điện tử, giám sát quy trình ký, theo dõi hết hạn TVAN/CKS — xây dựng trên React 19 + TypeScript + TailwindCSS.

---

## 🖼️ Screenshots

<!-- Thêm ảnh screenshot vào đây -->
| Admin — Quản lý hợp đồng | Admin — Cây ASM |
|:---:|:---:|
| *screenshot* | *screenshot* |

| Admin — Sắp hết hạn | Sale — Đăng ký HĐ |
|:---:|:---:|
| *screenshot* | *screenshot* |

---

## 🎯 Tổng quan

**ERP ToolSale** là công cụ nội bộ phục vụ 2 nhóm người dùng:

### 👤 Sale Portal (Nhân viên kinh doanh)
- Đăng ký hợp đồng mới (chọn sản phẩm, nhập thông tin KH)
- Phát hành hợp đồng điện tử
- Theo dõi trạng thái đơn hàng

### 🛡️ Admin Console (Trọng tâm)
Bảng điều khiển dành cho quản trị viên với quyền bypass quy trình:

| Tính năng | Mô tả |
|-----------|--------|
| **Quản lý hợp đồng** | Xem tất cả HĐ, phân trang server-side (24k+ records), trình ký tự động hàng loạt |
| **Trình ký tự động** | Auto propose-sign tất cả HĐ chưa ký — chạy tuần tự với progress realtime |
| **Bypass quy trình** | Cấp TK / Phát hành HĐ / Xuất HĐĐT — bỏ qua các bước phê duyệt |
| **Gỡ ký / Rút trình ký** | Unsign hoặc rút trình ký với lý do, ghi nhận audit |
| **Trạng thái xử lý** | Hiển thị đầy đủ pipeline tT1→tT8 dạng badge trực quan |
| **Cây ASM** | Xem cấu trúc phân cấp Sales (MNG → SUP → TEAM → TDV/CTV), search realtime, highlight kết quả |
| **Sắp hết hạn** | Theo dõi HĐ TVAN sắp hết hạn (lọc theo range) + Chứng thư số CKS sắp expire |
| **Logs** | Xem log hệ thống theo category/ngày |

---

## 🏗️ Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Styling | TailwindCSS 3 + Glass morphism UI |
| Routing | React Router v6 |
| HTTP | Axios (JWT Bearer auto-inject) |
| UI Components | Heroicons, Headless UI, Framer Motion |
| Notifications | React Hot Toast |
| Build | Create React App |

---

## 📁 Cấu trúc dự án

```
src/
├── api/              # API services (adminService, authService, contractService...)
├── components/       # Shared components (Modal, FormField, Tabs...)
├── contexts/         # AuthContext, ThemeContext
├── features/         # Feature modules (register, publish, register-account-sale)
├── layouts/          # AdminLayout (glass sidebar), DashboardLayout
├── pages/
│   ├── admin/        # ⭐ AdminContracts, AdminSalesTree, AdminExpiring, AdminLogs
│   └── ...           # Login, Dashboard
├── types/            # TypeScript interfaces
└── utils/            # Helpers (admin check, formatters)
```

---

## 🚀 Cài đặt & Chạy

```bash
# Clone
git clone <repo-url>
cd demo-tool-sale

# Install dependencies
npm install

# Development (proxy → localhost:7112)
npm start

# Production build
npm run build
```

### Biến môi trường

| Env | API Base URL |
|-----|-------------|
| Development | `https://localhost:7112/api` |
| Production | `https://api-erprc.win-tech.vn/api` |

---

## 🔐 Phân quyền

- **JWT Authentication** — token lưu localStorage/sessionStorage
- **Admin gate** — FE check userCode whitelist, BE check qua `AdminAuthFilter`
- **Protected routes** — redirect `/login` nếu chưa xác thực

---

## 📡 API Endpoints chính (Admin)

```
GET  /admin/econtract/list-paged     → Danh sách HĐ phân trang
GET  /admin/econtract/summary/:oid   → Chi tiết HĐ
POST /Econtract/propose-sign         → Trình ký
POST /Econtract/unsign               → Gỡ ký
POST /Econtract/rut-trinh-ky         → Rút trình ký
POST /admin/econtract/bypass/captk   → Bypass cấp TK
POST /admin/econtract/bypass/phat-hanh-hoa-don
POST /admin/econtract/bypass/xuat-hoa-don-hddt
GET  /SalesHierarchy/managers/:id    → Cây ASM
GET  /tvan-renewals/expiring-soon    → TVAN sắp hết hạn
GET  /RptUsed/cert-expire            → CKS sắp hết hạn
```

---

## 👨‍💻 Author

**Lương Minh Nhật** — Admin · 001332

---

<p align="center">
  <sub>Built with ⚡ React 19 &bull; TailwindCSS &bull; TypeScript</sub>
</p>
