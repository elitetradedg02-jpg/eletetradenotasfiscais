
import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { PaymentStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Icons } from '../constants';

const Reports: React.FC = () => {
  const { invoices, suppliers } = useStore();
  
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchStart = dateStart ? inv.dueDate >= dateStart : true;
      const matchEnd = dateEnd ? inv.dueDate <= dateEnd : true;
      const matchSupplier = supplierFilter ? inv.supplierId === supplierFilter : true;
      const matchStatus = statusFilter === 'all' ? true : inv.status === statusFilter;
      
      return matchStart && matchEnd && matchSupplier && matchStatus;
    });
  }, [invoices, dateStart, dateEnd, supplierFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const paid = filteredInvoices.reduce((acc, inv) => {
      return acc + inv.payments.reduce((pAcc, p) => pAcc + p.amount, 0);
    }, 0);
    return { total, paid, open: total - paid };
  }, [filteredInvoices]);

  const exportCSV = () => {
    const headers = ['Numero', 'Serie', 'Fornecedor', 'Emissao', 'Vencimento', 'Valor Total', 'Valor Pago', 'Status', 'Destinacao'];
    const rows = filteredInvoices.map(inv => {
      const supplier = suppliers.find(s => s.id === inv.supplierId);
      const paid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
      return [
        inv.invoiceNumber,
        inv.series,
        supplier?.razaoSocial || '',
        inv.issueDate,
        inv.dueDate,
        inv.totalAmount.toString(),
        paid.toString(),
        inv.status,
        inv.destination
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_notas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios Financeiros</h2>
          <p className="text-sm text-slate-500">Extração de dados e análise por período e status.</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors self-start"
        >
          <Icons.Import /> {/* Usando ícone de import para simular export */}
          Exportar CSV
        </button>
      </header>

      {/* Filtros de Relatório */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início (Vencimento)</label>
            <input 
              type="date" 
              className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim (Vencimento)</label>
            <input 
              type="date" 
              className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fornecedor</label>
            <select 
              className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
            >
              <option value="">Todos os Fornecedores</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.razaoSocial}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
            <select 
              className="w-full p-2 border border-slate-200 rounded text-sm outline-none focus:ring-1 focus:ring-indigo-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Filtrado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total no Período</p>
          <p className="text-xl font-bold text-slate-800">{formatCurrency(stats.total)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pago</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.paid)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pendente</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(stats.open)}</p>
        </div>
      </div>

      {/* Tabela de Resultados do Relatório */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <th className="px-4 py-3">Vencimento</th>
              <th className="px-4 py-3">Fornecedor</th>
              <th className="px-4 py-3">Nº Nota</th>
              <th className="px-4 py-3">Valor Total</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredInvoices.map(inv => {
              const supplier = suppliers.find(s => s.id === inv.supplierId);
              const paid = inv.payments.reduce((acc, p) => acc + p.amount, 0);
              return (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3 font-bold uppercase truncate max-w-[200px]">{supplier?.razaoSocial}</td>
                  <td className="px-4 py-3 text-slate-500">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">{formatCurrency(paid)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                      inv.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === PaymentStatus.OPEN ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredInvoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">Nenhum dado encontrado para os filtros selecionados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
