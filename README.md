# React Boilerplate

## 🚀 Overview

This is a **React Boilerplate** built with **Vite**, **React 19**, **Tailwind CSS v4**, and **Redux Toolkit**. It provides a scalable structure for building modern web applications with best practices in mind.

## 📂 Project Structure

```bash
react-boilerplate/
├── public/                # Static assets
├── src/
│   ├── assets/            # Images, fonts, etc.
│   ├── components/        # UI components
│   │   ├── common/        # Reusable UI components (e.g., Button, Input)
│   │   ├── layout/        # Layout components (e.g., AuthLayout, DashboardLayout)
│   ├── features/
│   │   ├── auth/          # Authentication module (Redux slice, API service)
│   │   ├── dashboard/     # Dashboard module (Redux slice, UI components)
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Page components
│   ├── services/          # API services (e.g., authService, api.js)
│   ├── store/             # Redux store configuration
│   ├── utils/             # Utility functions and constants
│   ├── App.jsx            # Root component
│   ├── main.jsx           # Entry point
│   ├── index.css          # Global styles
├── .gitignore             # Ignored files in Git
├── vite.config.js         # Vite configuration
└── package.json           # Project metadata and dependencies
```

## 🛠️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/AnwarHossainSR/react-boilerplate.git
cd react-boilerplate
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000/`

### 4️⃣ Build for Production

```bash
npm run build
```

## 🚀 Features

✅ **Vite** – Fast development and hot module replacement  
✅ **React 19** – Latest React features and optimizations  
✅ **Tailwind CSS v4** – Modern CSS-first styling  
✅ **Redux Toolkit** – State management with best practices  
✅ **Custom Hooks** – Reusable logic abstraction  
✅ **Modular Architecture** – Scalable and maintainable folder structure  
✅ **API Services** – Centralized API handling with `services/api.js`

## 📦 Dependencies

| Package          | Version |
| ---------------- | ------- |
| React            | ^19.x   |
| Redux Toolkit    | ^2.x    |
| React Router DOM | ^7.x    |
| Tailwind CSS     | ^4.x    |
| Vite             | ^6.x    |

## 🔥 Folder Details

### 📌 Components

- `common/` – Reusable UI components (e.g., `Button.jsx`, `Input.jsx`)
- `layout/` – Layout components (e.g., `DashboardLayout.jsx`, `PublicLayout.jsx`)

### 📌 Features

- `auth/` – Handles authentication logic (Redux slice, API service)
- `dashboard/` – Dashboard-related state and components

### 📌 Hooks

- `useAuth.js` – Authentication hook
- `useFetch.js` – Fetch data with `useEffect`

### 📌 Pages

- `auth/` – Login & Register pages
- `dashboard/` – Dashboard & Profile pages
- `Home.jsx` – Main landing page

### 📌 Services

- `api.js` – Centralized API handling
- `authService.js` – Handles authentication API requests

## 📜 License

This project is licensed under the **MIT License**.

---

💡 **Need help?** Feel free to contribute or open an issue on [GitHub](https://github.com/yourusername/react-boilerplate). 🚀
