# 🎯 Demo Tool Sale - React Learning Project

> Dự án học React.js với Authentication Flow và Modern UI

## 🚀 Quick Start

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm start
```

Ứng dụng sẽ mở tại: **http://localhost:3000**

## 📚 Tài Liệu Chi Tiết

Xem file [SETUP_GUIDE.md](./SETUP_GUIDE.md) để biết:
- Cấu trúc project
- Hướng dẫn setup từng bước
- Tích hợp Backend API
- Học React qua project này
- Troubleshooting

## ✨ Features

- ✅ Login Page với modern UI
- ✅ Protected Routes
- ✅ Dashboard với stats
- ✅ React Context API cho state management
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Responsive design

## 🏗️ Tech Stack

- **React 19** + TypeScript
- **React Router** v6
- **Tailwind CSS** v3
- **Axios** cho API calls
- **React Hot Toast** cho notifications

## 📁 Cấu Trúc Chính

```
src/
├── api/              # API services
├── components/       # Reusable components
├── contexts/         # React Context
├── layouts/          # Layout components
├── pages/            # Page components
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── RegisterAndPublish_NEW.tsx
└── types/            # TypeScript types
```

## 🔐 Authentication Flow

1. User vào `/login`
2. Nhập username & password
3. Call API `/api/auth/login`
4. Lưu user info & token vào localStorage
5. Redirect đến `/dashboard`
6. Protected routes check authentication

## 🎨 Screenshots

### Login Page
![Login](docs/login-preview.png)

### Dashboard
![Dashboard](docs/dashboard-preview.png)

## 📝 TODO

- [ ] Implement backend API endpoint
- [ ] Add forgot password
- [ ] Add user profile page
- [ ] Add more features from RegisterAndPublish_NEW

## 🤝 Contributing

Đây là project học tập, feel free to modify và experiment, vibe coding !

## 📄 License

Private - For Learning Purpose

---

**Made with ❤️ by MNL**
