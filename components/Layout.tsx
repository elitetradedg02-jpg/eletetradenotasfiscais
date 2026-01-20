
import React from 'react';
import { Icons } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Icons.Dashboard /> },
    { id: 'invoices', label: 'Notas Fiscais', icon: <Icons.Invoice /> },
    { id: 'suppliers', label: 'Fornecedores', icon: <Icons.Supplier /> },
    { id: 'reports', label: 'Relatórios', icon: <Icons.Filter /> },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Topbar */}
      <nav className="bg-white border-b md:border-b-0 md:border-r border-slate-200 w-full md:w-64 flex-shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <div className="p-1 bg-indigo-600 rounded text-white flex-shrink-0">
              <Icons.Invoice />
            </div>
            Elite Trade
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Gestão de notas fiscais</p>
        </div>

        <div className="px-3 py-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
