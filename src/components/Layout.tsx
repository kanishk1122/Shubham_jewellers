'use client';

import React, { useState } from 'react';
import { ThemeToggle } from '@/components/ui/enhanced';
import { Button } from '@/components/ui/enhanced';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'text-blue-600 dark:text-blue-400' },
  { id: 'billing', label: 'New Bill', icon: '🧾', color: 'text-green-600 dark:text-green-400' },
  { id: 'products', label: 'Products', icon: '💍', color: 'text-purple-600 dark:text-purple-400' },
  { id: 'customers', label: 'Customers', icon: '👥', color: 'text-indigo-600 dark:text-indigo-400' },
  { id: 'bills', label: 'Bills History', icon: '📋', color: 'text-orange-600 dark:text-orange-400' },
  { id: 'rates', label: 'Metal Rates', icon: '💰', color: 'text-yellow-600 dark:text-yellow-400' },
];

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="text-2xl mr-2">✨</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Shubham</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Jewellers</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onTabChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`text-xl mr-3 ${activeTab === item.id ? item.color : ''}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2025 Shubham Jewellers
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              v1.0.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top navbar */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16">
          <div className="flex items-center justify-between h-full px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Page title */}
            <div className="flex-1 lg:flex-none">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white capitalize">
                {activeTab === 'bills' ? 'Bills History' : activeTab}
              </h2>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Quick stats */}
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">Today</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Theme toggle */}
              <ThemeToggle />

              {/* Profile menu */}
              <div className="relative">
                <button className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    SJ
                  </div>
                  <span className="hidden md:block text-sm font-medium">Admin</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
