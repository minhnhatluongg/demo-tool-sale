# 🚀 Hướng Dẫn Setup & Chạy Project React - Tool Sale Demo

## 📋 Tổng Quan Dự Án

Project này đã được tái cấu trúc hoàn toàn để học React.js với các tính năng:
- ✅ **Authentication Flow**: Đăng nhập với JWT
- ✅ **Protected Routes**: Bảo vệ các trang yêu cầu đăng nhập
- ✅ **Modern UI**: Giao diện đẹp mắt với Tailwind CSS
- ✅ **State Management**: React Context API
- ✅ **API Integration**: Axios cho HTTP requests

---

## 🏗️ Cấu Trúc Project

```
demo-tool-sale/
├── src/
│   ├── api/                    # API services
│   │   └── authService.ts      # Authentication API
│   ├── components/             # Reusable components
│   │   └── ProtectedRoute.tsx  # Route guard
│   ├── contexts/               # React Context
│   │   └── AuthContext.tsx     # Auth state management
│   ├── layouts/                # Layout components
│   │   └── DashboardLayout.tsx # Main dashboard layout
│   ├── pages/                  # Page components
│   │   ├── Login.tsx           # Login page
│   │   ├── Dashboard.tsx       # Dashboard home
│   │   └── RegisterAndPublish_NEW.tsx  # Main feature page
│   ├── types/                  # TypeScript types
│   │   └── auth.ts             # Auth-related types
│   ├── App.tsx                 # Main app with routing
│   └── index.tsx               # Entry point
└── package.json
```

---

## 🔧 Yêu Cầu Hệ Thống

1. **Node.js** (v16 trở lên) - [Download tại đây](https://nodejs.org/)
2. **npm** hoặc **yarn**
3. **Backend API** đang chạy tại `https://cms.wininvoice.vn`

---

## 📦 Cài Đặt & Chạy

### Bước 1: Cài đặt Node.js (nếu chưa có)

1. Tải Node.js từ: https://nodejs.org/
2. Chọn phiên bản LTS (Long Term Support)
3. Cài đặt và restart terminal/PowerShell
4. Kiểm tra cài đặt:
   ```bash
   node --version
   npm --version
   ```

### Bước 2: Cài đặt dependencies

```bash
cd c:\Users\PC\Desktop\Source\Tool_Sale_Demo\demo-tool-sale
npm install
```

### Bước 3: Chạy development server

```bash
npm start
```

Ứng dụng sẽ mở tại: **http://localhost:3000**

---

## 🎯 Flow Hoạt Động

### 1. **Trang Đăng Nhập** (`/login`)

Khi vào app, user sẽ thấy trang login với:
- Input username & password
- Checkbox "Ghi nhớ đăng nhập"
- Button đăng nhập với loading state
- Error handling

**Code tham khảo**: `src/pages/Login.tsx`

### 2. **Authentication Process**

```typescript
// File: src/contexts/AuthContext.tsx
const login = async (loginName: string, password: string, remember: boolean) => {
  const response = await loginAPI(loginName, password);
  
  if (response.success && response.user) {
    setUser(response.user);
    
    // Lưu vào localStorage nếu "Remember me"
    if (remember) {
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('token', response.token);
    }
  }
};
```

### 3. **Protected Routes**

Sau khi đăng nhập thành công:
- User được redirect đến `/dashboard`
- Tất cả routes được bảo vệ bởi `ProtectedRoute` component
- Nếu chưa đăng nhập -> tự động redirect về `/login`

**Code tham khảo**: `src/components/ProtectedRoute.tsx`

### 4. **Dashboard**

Dashboard hiển thị:
- Welcome message với tên user
- Stats cards (tổng đơn hàng, hoàn thành, đang xử lý...)
- Quick actions buttons
- Recent activity

**Code tham khảo**: `src/pages/Dashboard.tsx`

---

## 🔌 Tích Hợp Backend API

### Cấu Hình API Endpoint

File: `src/api/authService.ts`

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cms.wininvoice.vn';

export const loginAPI = async (loginName: string, password: string) => {
  const response = await apiClient.post('/api/auth/login', {
    loginName,
    password,
    cmpnID: '00',
    languageDefault: 'VN',
  });
  
  return response.data;
};
```

### Backend API Expected Response

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "user": {
    "userCode": "SALE001",
    "userName": "sale_user",
    "fullName": "Nguyễn Văn A",
    "email": "sale@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Tạo Backend API (C# .NET)

Dựa trên code C# bạn cung cấp, tạo API endpoint:

```csharp
[HttpPost("api/auth/login")]
public async Task<IActionResult> Login([FromBody] LoginRequest request)
{
    string connection = @"Server=125.212.205.139;Initial Catalog=BosOnline;...";
    
    List<SqlParameter> paramInfo = new List<SqlParameter>();
    paramInfo.Add(new SqlParameter("@LognName", request.LoginName));
    paramInfo.Add(new SqlParameter("@CmpnID", "00"));
    paramInfo.Add(new SqlParameter("@LanguageDefault", "VN"));
    paramInfo.Add(new SqlParameter("@WorkstationDate", ""));
    
    var dtInfo = connect.ExecuteStoredProcedure("bosConfigure..bosGetUserByLoginName", paramInfo, connection);
    List<bosUser> lstInfo = ConvertDataTable<bosUser>(dtInfo);
    bosUser model = lstInfo.FirstOrDefault();
    
    if (model != null)
    {
        if (request.Password == SHA1.Decrypt(model.Password))
        {
            // Generate JWT token
            var token = GenerateJwtToken(model);
            
            return Ok(new
            {
                success = true,
                message = "Đăng nhập thành công",
                user = new
                {
                    userCode = model.UserCode,
                    userName = model.UserName,
                    fullName = model.FullName
                },
                token = token
            });
        }
        else
        {
            return Unauthorized(new { success = false, message = "Sai mật khẩu!" });
        }
    }
    else
    {
        return NotFound(new { success = false, message = "User không tồn tại!" });
    }
}
```

---

## 🎨 Tùy Chỉnh UI

### Thay Đổi Màu Sắc

File: `tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',    // Blue
        secondary: '#8b5cf6',  // Purple
        // Thêm màu tùy chỉnh
      },
    },
  },
};
```

### Thêm Animations

File: `src/index.css`

```css
@keyframes yourAnimation {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.animate-your-animation {
  animation: yourAnimation 2s infinite;
}
```

---

## 📚 Học React Qua Project Này

### 1. **React Hooks**

- `useState`: Quản lý state trong component
- `useEffect`: Side effects (API calls, subscriptions)
- `useContext`: Truy cập global state
- `useNavigate`: Điều hướng programmatically

**Ví dụ trong Login.tsx:**

```typescript
const [formData, setFormData] = useState({
  loginName: '',
  password: '',
  remember: false,
});

useEffect(() => {
  const savedLoginName = localStorage.getItem('loginName');
  if (savedLoginName) {
    setFormData(prev => ({ ...prev, loginName: savedLoginName }));
  }
}, []);
```

### 2. **React Context API**

Quản lý authentication state toàn app:

```typescript
// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Sử dụng trong component
const { user, login } = useAuth();
```

### 3. **React Router**

Điều hướng giữa các trang:

```typescript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
</Routes>
```

### 4. **TypeScript với React**

Định nghĩa types cho props và state:

```typescript
interface LoginProps {
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  // Component logic
};
```

---

## 🐛 Debugging & Troubleshooting

### Lỗi thường gặp:

1. **"Cannot find module"**
   ```bash
   npm install
   ```

2. **"Port 3000 already in use"**
   ```bash
   # Đổi port trong package.json
   "start": "PORT=3001 react-scripts start"
   ```

3. **CORS Error**
   - Cấu hình CORS trong backend
   - Hoặc dùng proxy trong `package.json`:
     ```json
     "proxy": "https://cms.wininvoice.vn"
     ```

4. **API không response**
   - Kiểm tra backend đang chạy
   - Kiểm tra network tab trong DevTools
   - Log response trong console

---

## 🚀 Next Steps - Mở Rộng Project

### 1. **Thêm Features**

- [ ] Forgot Password
- [ ] User Profile Page
- [ ] Settings Page
- [ ] Notifications
- [ ] Search functionality

### 2. **Cải Thiện UX**

- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] Offline mode
- [ ] Progressive Web App (PWA)

### 3. **Testing**

- [ ] Unit tests với Jest
- [ ] Integration tests
- [ ] E2E tests với Cypress

### 4. **Performance**

- [ ] Code splitting
- [ ] Lazy loading
- [ ] Memoization với `useMemo`, `useCallback`
- [ ] Virtual scrolling cho lists

---

## 📖 Tài Liệu Tham Khảo

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/docs/intro)

---

## 💡 Tips Học React

1. **Đọc hiểu code từng file một**
   - Bắt đầu từ `App.tsx`
   - Sau đó `AuthContext.tsx`
   - Cuối cùng các pages

2. **Thử modify và xem kết quả**
   - Thay đổi màu sắc
   - Thêm/bớt fields trong form
   - Tạo component mới

3. **Debug với React DevTools**
   - Cài extension React DevTools
   - Xem component tree
   - Inspect props và state

4. **Đọc error messages**
   - React error messages rất chi tiết
   - Đọc kỹ stack trace
   - Google error nếu không hiểu

---

## 📞 Support

Nếu gặp vấn đề, check:
1. Console trong browser (F12)
2. Terminal output
3. Network tab để xem API calls

---

**Made with ❤️ by MNL | Version 1.0.0**
