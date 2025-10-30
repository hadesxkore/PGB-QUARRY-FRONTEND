# QuarryWebSystem Admin Panel Structure

## 📁 Folder Structure

```
src/
├── admin/
│   ├── AdminPage.tsx              # Main admin page with routing
│   ├── AdminLayout.tsx            # Sidebar layout component
│   └── pages/
│       ├── DashboardPage.tsx      # Dashboard with stats
│       ├── QuarryManagementPage.tsx  # Quarry sites management
│       ├── TruckLogsPage.tsx      # Truck entry/exit logs
│       ├── CCTVSnapshotsPage.tsx  # CCTV camera feeds
│       ├── ReportsPage.tsx        # Reports generation
│       └── UserManagementPage.tsx # User accounts management
├── store/
│   ├── authStore.ts               # Authentication state (Zustand)
│   └── adminStore.ts              # Admin UI state (Zustand)
├── services/
│   ├── api.ts                     # Axios instance
│   └── authService.ts             # Auth API calls
└── pages/
    └── LoginPage.tsx              # Login form
```

## 🎨 Features

### Sidebar Navigation
- ✅ Collapsible sidebar (desktop)
- ✅ Mobile responsive with overlay
- ✅ Active page highlighting
- ✅ User profile display
- ✅ Bataan logo integration
- ✅ Logout functionality

### Pages Included
1. **Dashboard** - Overview with stats and recent activity
2. **Quarry Management** - List and manage quarry sites
3. **Truck Logs** - Track truck entries and exits
4. **CCTV Snapshots** - View camera feeds and snapshots
5. **Reports** - Generate and download reports
6. **User Management** - Manage system users (Admin only)

### State Management (Zustand)
- **authStore.ts** - User authentication, login/logout
- **adminStore.ts** - Sidebar state, current page

### Design
- Modern UI with shadcn components
- Gradient backgrounds
- Responsive grid layouts
- Interactive cards and tables
- Status badges and icons
- Smooth transitions

## 🚀 How to Use

1. **Login** - Use admin credentials
2. **Navigate** - Click sidebar menu items
3. **View Data** - Each page shows relevant information
4. **Logout** - Click logout button in sidebar

## 🔐 Authentication Flow

1. User enters email/password on LoginPage
2. authService.login() calls backend API
3. Token and user data stored in authStore (Zustand)
4. App.tsx checks isAuthenticated
5. If authenticated → AdminPage
6. If not → LoginPage

## 📱 Responsive Design

- **Desktop** - Full sidebar (264px width)
- **Collapsed** - Icon-only sidebar (80px width)
- **Mobile** - Hidden sidebar with hamburger menu

## 🎯 Next Steps

- Connect pages to real backend APIs
- Add create/edit/delete functionality
- Implement real-time updates with Socket.IO
- Add data visualization charts
- Implement file upload for CCTV
- Add pagination for tables
