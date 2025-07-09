"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter, usePathname } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
}

import {
  BarChart,
  FileText,
  Package,
  Users,
  ClipboardList,
  Coins,
} from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <BarChart className="w-5 h-5" />,
    color: "text-blue-600 dark:text-blue-400",
    href: "/dashboard",
  },
  {
    id: "billing",
    label: "New Bill",
    icon: <FileText className="w-5 h-5" />,
    color: "text-green-600 dark:text-green-400",
    href: "/billing",
  },
  {
    id: "products",
    label: "Products",
    icon: <Package className="w-5 h-5" />,
    color: "text-purple-600 dark:text-purple-400",
    href: "/products",
  },
  {
    id: "customers",
    label: "Customers",
    icon: <Users className="w-5 h-5" />,
    color: "text-indigo-600 dark:text-indigo-400",
    href: "/customers",
  },
  {
    id: "bills",
    label: "Bills History",
    icon: <ClipboardList className="w-5 h-5" />,
    color: "text-orange-600 dark:text-orange-400",
    href: "/bills",
  },
  {
    id: "rates",
    label: "Metal Rates",
    icon: <Coins className="w-5 h-5" />,
    color: "text-yellow-600 dark:text-yellow-400",
    href: "/rates",
  },
];


const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case "light":
        return "☀️";
      case "dark":
        return "🌙";
      case "system":
        return "🖥️";
      default:
        return "🌙";
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
        return `System (${actualTheme})`;
      default:
        return "Dark";
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center space-x-2 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all duration-200"
      title={`Current: ${getThemeLabel()}. Click to cycle themes.`}
    >
      <span className="text-lg">{getThemeIcon()}</span>
      <span className="hidden md:block text-sm font-medium">
        {getThemeLabel()}
      </span>
    </button>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === "/") return "dashboard";
    return pathname.slice(1); // Remove leading slash
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-600 bg-opacity-75 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700">
          <div className="flex items-center text-white">
            <div className="text-2xl mr-2">✨</div>
            <div>
              <h1 className="text-lg font-bold">Shubham</h1>
              <p className="text-xs opacity-90">Jewellers</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-zinc-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 group ${
                    getActiveTab() === item.id
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500 shadow-sm"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <span
                    className={`text-xl mr-3 transition-transform group-hover:scale-110 ${
                      getActiveTab() === item.id ? item.color : ""
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                  {getActiveTab() === item.id && (
                    <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Quick Stats in Sidebar */}
        <div className="absolute bottom-20 left-4 right-4">
          <div className="bg-zinc-50 dark:bg-zinc-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Today's Summary
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Sales</span>
                <span className="font-medium text-green-600 dark:text-green-400">
                  ₹1,25,000
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">Bills</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  8 pending
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-750">
          <div className="text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              © 2025 Shubham Jewellers
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              v1.0.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 h-16 shadow-sm">
          <div className="flex items-center justify-between h-full px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Page title and breadcrumb */}
            <div className="flex-1 lg:flex-none">
              <div className="flex items-center space-x-2">
                <span className="text-xl">
                  {menuItems.find((item) => item.id === getActiveTab())?.icon}
                </span>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-white capitalize">
                  {getActiveTab() === "bills"
                    ? "Bills History"
                    : menuItems.find((item) => item.id === getActiveTab())
                        ?.label || "Dashboard"}
                </h2>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Current date and time */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="text-right">
                  <p className="text-zinc-500 dark:text-zinc-400">Today</p>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {new Date().toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <button className="relative p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5-5m0 0l5-5h-5m0 5H9a6 6 0 01-6-6V7a3 3 0 013-3h4"
                  />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Profile menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    SJ
                  </div>
                  <span className="hidden md:block text-sm font-medium">
                    Admin
                  </span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <div className="animate-slide-up">{children}</div>
        </main>
      </div>
    </div>
  );
};
