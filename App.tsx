
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import XMLImport from './components/XMLImport';
import InvoiceList from './components/InvoiceList';
import InvoiceDetails from './components/InvoiceDetails';
import Reports from './components/Reports';
import { useStore } from './store';
import { formatCnpjCpf } from './utils/formatters';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const { invoices, suppliers, updateSupplier } = useStore();

  const handleSupplierFieldUpdate = (id: string, field: string, value: string) => {
    updateSupplier(id, { [field]: value });
  };

  const renderContent = () => {
    if (selectedInvoiceId) {
      return (
        <InvoiceDetails 
          id={selectedInvoiceId} 
          onBack={() => setSelectedInvoiceId(null)} 
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard invoices={invoices} />;
      case 'invoices':
        return (
          <div className="space-y-8">
            <XMLImport />
            <div className="space-y-4">
              <header className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-800">Lista de Notas Fiscais</h3>
              </header>
              <InvoiceList onSelectInvoice={(id) => setSelectedInvoiceId(id)} />
            </div>
          </div>
        );
      case 'suppliers':
        return (
          <div className="space-y-6">
            <header>
              <h2 className="text-2xl font-bold text-slate-800">Fornecedores</h2>
              <p className="text-sm text-slate-500">Gestão de parceiros comerciais e contatos.</p>
            </header>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Razão Social / Fantasia</th>
                    <th className="px-6 py-4">CNPJ / CPF</th>
                    <th className="px-6 py-4">Contato Principal</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {suppliers.map(sup => {
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 uppercase tracking-tighter">{sup.razaoSocial}</span>
                            <input 
                              type="text" 
                              className="text-[10px] bg-transparent border-none p-0 focus:ring-0 text-slate-400" 
                              placeholder="Editar Nome Fantasia..." 
                              defaultValue={sup.nomeFantasia || ''} 
                              onBlur={(e) => handleSupplierFieldUpdate(sup.id, 'nomeFantasia', e.target.value)}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-500">{formatCnpjCpf(sup.cnpjCpf)}</td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            className="w-full text-xs p-1 border border-transparent hover:border-slate-200 rounded" 
                            placeholder="Nome / Dep. Financeiro..." 
                            defaultValue={sup.contato || ''} 
                            onBlur={(e) => handleSupplierFieldUpdate(sup.id, 'contato', e.target.value)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Ativo</span>
                        </td>
                      </tr>
                    );
                  })}
                  {suppliers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum fornecedor cadastrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'reports':
        return <Reports />;
      default:
        return <Dashboard invoices={invoices} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={(tab) => {
      setActiveTab(tab);
      setSelectedInvoiceId(null);
    }}>
      {renderContent()}
    </Layout>
  );
};

export default App;
