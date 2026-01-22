# FE Create Order - API Testing Tool

Ứng dụng React TypeScript để test các API backend cho việc tạo đơn hàng, cấp tài khoản, phát hành mẫu hóa đơn và gia hạn số hóa đơn.

## 📋 Mục đích

Tool này được xây dựng để test trước các API backend (.NET) trước khi tích hợp vào hệ thống chính:
- Tạo đơn hàng (Draft)
- Cấp tài khoản EVATNEW cho khách hàng
- Phát hành mẫu hóa đơn điện tử
- Gia hạn thêm số hóa đơn cho mẫu cũ
- **Gia hạn hợp đồng** (Tạo hợp đồng gia hạn + Gửi Odoo + Tạo Job)

## 🚀 Cài đặt

### Prerequisites
- Node.js 16+ 
- npm hoặc yarn
- Backend API đang chạy tại `http://localhost:44344`

### Bước 1: Clone project
```bash
git clone <repo-url>
cd fe-create-order
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

### Bước 3: Cấu hình API endpoint
Mở file `src/api/apiClient.js` và cập nhật `baseURL` nếu cần:
```javascript
const api = axios.create({
  baseURL: "http://localhost:44344/api", // Đổi URL này nếu backend ở địa chỉ khác
});
```

### Bước 4: Chạy ứng dụng
```bash
npm start
```

Ứng dụng sẽ mở tại [http://localhost:3000](http://localhost:3000)

## 📁 Cấu trúc Project

```
fe-create-order/
├── src/
│   ├── api/
│   │   └── apiClient.js          # Axios config
│   ├── components/
│   │   ├── FormField.tsx         # Component input field dùng chung
│   │   └── Tabs.tsx              # Component tab navigation
│   ├── pages/
│   │   ├── RegisterAccount.tsx   # Tab 1: Đăng ký cấp tài khoản
│   │   ├── PublishTemplate.tsx   # Tab 2: Phát hành mẫu hóa đơn
│   │   ├── ExtendInvoice.tsx     # Tab 3: Gia hạn số hóa đơn
│   │   └── RenewContract.tsx     # Tab 4: Gia hạn hợp đồng
│   ├── App.tsx                   # Main app component
│   ├── index.tsx                 # Entry point
│   └── index.css                 # Global styles (Tailwind)
├── public/
├── API_DOCUMENTATION.md          # Chi tiết về API backend
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🎯 Chức năng

### Tab 1: Đăng ký cấp tài khoản

Màn hình này cho phép:
- **Tạo đơn hàng (Draft)**: Tạo đơn hàng nhưng chưa cấp tài khoản
- **Cấp tài khoản**: Chỉ cấp tài khoản EVATNEW cho khách
- **Tạo đơn + Cấp TK**: Thực hiện cả 2 bước (khuyên dùng)

**Fields quan trọng**:
- MST/CCCD: Mã số thuế hoặc CCCD khách hàng
- Mẫu số: Mẫu hóa đơn (VD: 1, 2, 3...)
- Ký hiệu: Ký hiệu hóa đơn (VD: TTIQuyên)
- Mã nhân viên: Mã NVKD phụ trách
- Thông tin công ty: Tên, địa chỉ, email, SĐT, đại diện...

**API Endpoints**:
- `POST /api/odoo/orders/create` - Tạo đơn hàng
- `POST /api/odoo/orders/createAccount` - Cấp tài khoản
- `POST /api/odoo/orders/createFull` - Tạo đơn + Cấp TK

### Tab 2: Phát hành mẫu hóa đơn

Cho phép phát hành mẫu hóa đơn mới (XSLT template).

**Fields**:
- Mã số thuế
- Mẫu số
- Ký hiệu
- Người dùng
- File mẫu (.xslt hoặc .xml)

**API Endpoint**:
- `POST /api/odoo/orders/publishTemplate`

### Tab 3: Gia hạn thêm số hóa đơn

Gia hạn thêm số hóa đơn cho mẫu đã phát hành.

**Fields**:
- Mã số thuế
- Mẫu số
- Ký hiệu
- Số cũ đến (VD: 1000)
- Số mới đến (VD: 2000)
- Người dùng

**API Endpoint**:
- `POST /api/odoo/orders/extendRange`

### Tab 4: Gia hạn hợp đồng

Tạo hợp đồng gia hạn chính thức, gửi thông tin sang Odoo và tự động tạo Job phát hành.

**Quy trình**:
1. **Nhập MST** và tải thông tin công ty
2. **Hiển thị thông tin hợp đồng hiện tại** (mẫu HĐ, ký hiệu, số HĐ còn lại)
3. **Chọn gói sản phẩm** từ danh sách (số lượng HĐ/gói tự động tính)
4. **Nhập thông tin bổ sung**:
   - Người ký hợp đồng
   - Chức vụ
   - Mã nhân viên kinh doanh
   - Ngày cấp GPKD
   - Mô tả hợp đồng
5. **Số HĐ mới được tự động tính** dựa trên:
   - Số HĐ còn lại của hợp đồng cũ
   - Tổng số HĐ trong các gói được chọn
6. **Tạo hợp đồng**: Hệ thống sẽ:
   - Insert record vào bảng `EContracts` (trạng thái: Trình ký 101)
   - Insert chi tiết sản phẩm vào `EContractsDetails`
   - Insert/Update thông tin khách hàng vào `ECustomers`
   - Gửi email cho kế toán để duyệt
   - Tạo Job phát hành tài khoản (auto approve 0→101→201)
   - Gửi payload sang Odoo qua API `/winerp-create-order`

**Fields quan trọng**:
- **MST**: Mã số thuế khách hàng (bắt buộc)
- **Người ký HĐ**: Tên người đại diện ký hợp đồng (bắt buộc)
- **Chức vụ**: Mặc định "Giám Đốc"
- **Mã NVKD**: Mã nhân viên kinh doanh phụ trách (bắt buộc)
- **Sản phẩm**: Chọn từ danh sách, có thể chọn nhiều gói
- **Số lượng**: Số lượng gói (mỗi gói chứa N hóa đơn)

**Kết quả**:
- Mã hợp đồng mới (OID): `{MaNV}/{yyMMdd:HHmmssfff}`
- Mã Job: `{MaNV}/{yyMMdd:HHmmssfff}`
- Trạng thái HĐ: Trình ký → Đợi kế toán duyệt
- Payload đã gửi sang Odoo

**API Endpoint**:
- `POST /api/contracts/create-renew`

**Request Body**:
```json
{
  "CusName": "CÔNG TY ABC",
  "CusAddress": "123 Đường XYZ",
  "CusTax": "0123456789",
  "CusPeopleSign": "Nguyễn Văn A",
  "CusPositionBySign": "Giám Đốc",
  "SaleEmID": "000001",
  "SampleID": "01GTKT3/001",
  "OIDContract": "000001/240315/123456",
  "InvcSample": "01GTKT3/001",
  "InvcSign": "K25T",
  "InvFrom": 1001,
  "InvTo": 2000,
  "Products": [
    {
      "ItemID": "HDDT1000",
      "ItemName": "Gói 1000 hóa đơn",
      "ItemUnitName": "Gói",
      "ItemPrice": 500000,
      "ItemQtty": 1,
      "VAT_Rate": 8,
      "Sum_Amnt": 500000,
      "ItemPerBox": 1000
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tạo hợp đồng gia hạn thành công (đã gửi Odoo và tạo Job).",
  "newOID": "000001/251031/123456789",
  "jobOid": "000001/251031/123456790",
  "traceId": "abc123..."
}
```

## 📖 API Documentation

Xem chi tiết về các API, request/response format, và luồng xử lý tại:
**[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

## 🛠 Tech Stack

- **React 18** - UI Library
- **TypeScript** - Type safety
- **React Router DOM** - Routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Create React App** - Build tool

## 🔧 Scripts

```bash
# Development
npm start              # Chạy dev server

# Build
npm run build         # Build production

# Test
npm test              # Run tests

# Format & Lint (nếu có)
npm run lint          # Check linting
npm run format        # Format code
```

## 📝 Lưu ý khi sử dụng

1. **Backend API phải chạy trước**: Đảm bảo backend .NET đang chạy tại port 44344
2. **CORS**: Backend cần enable CORS cho `http://localhost:3000`
3. **MST là bắt buộc**: Tất cả API đều yêu cầu MST
4. **Mẫu số + Ký hiệu**: Dùng để định danh hợp đồng duy nhất
5. **UserCode**: Quyết định ai là người tạo/quản lý đơn hàng

## 🐛 Troubleshooting

### Lỗi: "Network Error" hoặc "ERR_CONNECTION_REFUSED"
- Kiểm tra backend có đang chạy không
- Kiểm tra `baseURL` trong `apiClient.js` đúng chưa
- Kiểm tra firewall/antivirus có block không

### Lỗi: CORS Policy
- Backend cần enable CORS:
```csharp
builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Và thêm app.UseCors() trong pipeline
```

### Lỗi: 400 Bad Request
- Kiểm tra các field bắt buộc đã nhập đầy đủ chưa
- Kiểm tra format MST, số hóa đơn có đúng không

### Lỗi: 500 Internal Server Error
- Xem log backend trong folder `logs/`
- Kiểm tra kết nối database
- Kiểm tra cấu hình Odoo API

## 🤝 Contributing

Đây là tool nội bộ để test. Nếu có vấn đề:
1. Kiểm tra log backend trước
2. Kiểm tra network tab trong DevTools
3. Tham khảo `API_DOCUMENTATION.md`

## 📄 License

Internal tool - Not for public distribution

## 👥 Contact

- Developer: [Tên của bạn]
- Backend API: Xem file `full-be.txt`
- UI Reference: Xem các ảnh trong project

---

**Phiên bản**: 1.1.0  
**Ngày cập nhật**: 31/10/2025

## 🆕 Changelog

### Version 1.1.0 (31/10/2025)
- ✨ Thêm tính năng "Gia hạn hợp đồng" (Tab 4)
- 🔄 Tích hợp API `POST /api/contracts/create-renew`
- 📦 Hỗ trợ chọn nhiều sản phẩm/gói
- 🧮 Tự động tính phạm vi số hóa đơn mới
- 📧 Tự động gửi email thông báo kế toán
- 🤖 Tự động tạo Job phát hành (0→101→201)
- 🌐 Tự động gửi payload sang Odoo

### Version 1.0.0 (28/10/2025)
- 🎉 Phiên bản đầu tiên
- ✅ 3 tính năng cơ bản: Đăng ký TK, Phát hành mẫu, Gia hạn số
