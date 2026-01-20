
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store';
import { Invoice, PaymentStatus, PaymentMethod, FilterState, SortDirection, FinancialStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Icons } from '../constants';

interface InvoiceListProps {
  onSelectInvoice: (id: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ onSelectInvoice }) => {
  const { invoices, suppliers, updateInvoice } = useStore();
  
  const [filters, setFilters] = useState<FilterState>({});
  const [sortField, setSortField] = useState<string>('dueDate');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('INVOICE_FILTERS');
    if (saved) setFilters(JSON.parse(saved));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('INVOICE_FILTERS', JSON.stringify(filters));
  }, [filters]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(inv => {
        const supplier = suppliers.find(s => s.id === inv.supplierId);
        const itemMatch = inv.items?.some(it => it.description.toLowerCase().includes(lowerSearch));
        return (
          inv.invoiceNumber.toLowerCase().includes(lowerSearch) ||
          supplier?.razaoSocial.toLowerCase().includes(lowerSearch) ||
          supplier?.nomeFantasia?.toLowerCase().includes(lowerSearch) ||
          inv.destination.toLowerCase().includes(lowerSearch) ||
          itemMatch
        );
      });
    }

    // Column Filters
    if (filters.status) result = result.filter(i => i.status === filters.status);
    if (filters.financialStatus) result = result.filter(i => i.financialStatus === filters.financialStatus);
    if (filters.paymentMethod) result = result.filter(i => i.paymentMethod === filters.paymentMethod);
    if (filters.supplierId) result = result.filter(i => i.supplierId === filters.supplierId);
    if (filters.issueDateStart) result = result.filter(i => i.issueDate >= filters.issueDateStart!);
    if (filters.issueDateEnd) result = result.filter(i => i.issueDate <= filters.issueDateEnd!);
    if (filters.dueDateStart) result = result.filter(i => i.dueDate >= filters.dueDateStart!);
    if (filters.dueDateEnd) result = result.filter(i => i.dueDate <= filters.dueDateEnd!);
    if (filters.amountMin !== undefined) result = result.filter(i => i.totalAmount >= filters.amountMin!);
    if (filters.amountMax !== undefined) result = result.filter(i => i.totalAmount <= filters.amountMax!);

    // Sorting Logic
    result.sort((a, b) => {
      let valA: any, valB: any;
      const supplierA = suppliers.find(s => s.id === a.supplierId);
      const supplierB = suppliers.find(s => s.id === b.supplierId);

      switch (sortField) {
        case 'issueDate': valA = a.issueDate; valB = b.issueDate; break;
        case 'dueDate': valA = a.dueDate; valB = b.dueDate; break;
        case 'amount': valA = a.totalAmount; valB = b.totalAmount; break;
        case 'supplier': 
          valA = (supplierA?.nomeFantasia || supplierA?.razaoSocial || '').toLowerCase(); 
          valB = (supplierB?.nomeFantasia || supplierB?.razaoSocial || '').toLowerCase(); 
          break;
        case 'status': valA = a.status; valB = b.status; break;
        default: valA = a.dueDate; valB = b.dueDate;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, suppliers, searchTerm, filters, sortField, sortDir]);

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const handleInlineUpdate = (id: string, field: keyof Invoice, value: any) => {
    updateInvoice(id, { [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Search and Global Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Buscar por nota, item ou fornecedor..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={clearFilters} 
          className="text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
        >
          Limpar Filtros
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center text-[10px] bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-tighter">Status:</span>
          <select 
            className="bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium"
            value={filters.status || ''}
            onChange={(e) => setFilters({...filters, status: e.target.value || undefined})}
          >
            <option value="">Todos</option>
            {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-tighter">Financeiro:</span>
          <select 
            className="bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium"
            value={filters.financialStatus || ''}
            onChange={(e) => setFilters({...filters, financialStatus: e.target.value || undefined})}
          >
            <option value="">Todos</option>
            {Object.values(FinancialStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-tighter">Tipo:</span>
          <select 
            className="bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium"
            value={filters.paymentMethod || ''}
            onChange={(e) => setFilters({...filters, paymentMethod: e.target.value || undefined})}
          >
            <option value="">Todas</option>
            {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1"></div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-tighter">Vencimento:</span>
          <div className="flex items-center gap-1">
            <input type="date" className="bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium" value={filters.dueDateStart || ''} onChange={(e) => setFilters({...filters, dueDateStart: e.target.value})} />
            <span>a</span>
            <input type="date" className="bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium" value={filters.dueDateEnd || ''} onChange={(e) => setFilters({...filters, dueDateEnd: e.target.value})} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-400 uppercase tracking-tighter">Valor:</span>
          <div className="flex items-center gap-1">
            <input type="number" placeholder="Min" className="w-16 bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium" onChange={(e) => setFilters({...filters, amountMin: parseFloat(e.target.value) || undefined})} />
            <input type="number" placeholder="Max" className="w-16 bg-white border border-slate-200 rounded px-2 py-1 outline-none font-medium" onChange={(e) => setFilters({...filters, amountMax: parseFloat(e.target.value) || undefined})} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1300px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <th className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-all" onClick={() => handleSort('issueDate')}>
                Emissão {sortField === 'issueDate' && (sortDir === 'asc' ? <Icons.ChevronUp /> : <Icons.ChevronDown />)}
              </th>
              <th className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-all" onClick={() => handleSort('dueDate')}>
                Vencimento {sortField === 'dueDate' && (sortDir === 'asc' ? <Icons.ChevronUp /> : <Icons.ChevronDown />)}
              </th>
              <th className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-all" onClick={() => handleSort('supplier')}>
                Fornecedor {sortField === 'supplier' && (sortDir === 'asc' ? <Icons.ChevronUp /> : <Icons.ChevronDown />)}
              </th>
              <th className="px-4 py-3">Descrição / Itens</th>
              <th className="px-4 py-3">Financeiro</th>
              <th className="px-4 py-3">Tipo Pgto</th>
              <th className="px-4 py-3 cursor-pointer text-right group hover:bg-slate-100 transition-all" onClick={() => handleSort('amount')}>
                Valor {sortField === 'amount' && (sortDir === 'asc' ? <Icons.ChevronUp /> : <Icons.ChevronDown />)}
              </th>
              <th className="px-4 py-3 cursor-pointer group hover:bg-slate-100 transition-all" onClick={() => handleSort('status')}>
                Status {sortField === 'status' && (sortDir === 'asc' ? <Icons.ChevronUp /> : <Icons.ChevronDown />)}
              </th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredInvoices.map((inv) => {
              const supplier = suppliers.find(s => s.id === inv.supplierId);
              const firstItem = inv.items?.[0]?.description || '-';
              const itemCount = (inv.items?.length || 0) - 1;

              return (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors align-top">
                  <td className="px-4 py-4 text-slate-500 whitespace-nowrap">{formatDate(inv.issueDate)}</td>
                  <td className="px-4 py-4">
                    <input 
                      type="date" 
                      className="bg-transparent hover:bg-white border border-transparent hover:border-slate-200 rounded px-1 outline-none text-xs font-bold text-slate-700 transition-all"
                      defaultValue={inv.dueDate}
                      onBlur={(e) => handleInlineUpdate(inv.id, 'dueDate', e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col max-w-[200px]">
                      <span className="font-bold text-slate-800 uppercase text-[11px] truncate" title={supplier?.razaoSocial}>
                        {supplier?.nomeFantasia || supplier?.razaoSocial}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">NF: {inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col group relative" title={inv.items?.map(i => `${i.quantity}x ${i.description}`).join('\n')}>
                      <span className="text-[11px] text-slate-600 truncate max-w-[250px]">{firstItem}</span>
                      {itemCount > 0 && <span className="text-[9px] text-indigo-500 font-bold bg-indigo-50 inline-block px-1 rounded w-fit mt-0.5">+{itemCount} itens</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="text-[10px] font-bold uppercase p-1.5 bg-slate-100 border-none rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 transition-all cursor-pointer"
                      value={inv.financialStatus}
                      onChange={(e) => handleInlineUpdate(inv.id, 'financialStatus', e.target.value as FinancialStatus)}
                    >
                      {Object.values(FinancialStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      className="text-[11px] bg-transparent border-transparent hover:border-slate-200 border rounded px-1 outline-none font-medium transition-all"
                      value={inv.paymentMethod}
                      onChange={(e) => handleInlineUpdate(inv.id, 'paymentMethod', e.target.value)}
                    >
                      {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-slate-900 whitespace-nowrap">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase shadow-sm ${
                      inv.status === PaymentStatus.PAID ? 'bg-emerald-100 text-emerald-700' :
                      inv.status === PaymentStatus.OPEN ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <button 
                      onClick={() => onSelectInvoice(inv.id)} 
                      className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all"
                      title="Ver Dossiê Completo"
                    >
                      <Icons.ChevronDown />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredInvoices.length === 0 && (
          <div className="p-12 text-center text-slate-400 bg-slate-50">
            Nenhuma nota fiscal encontrada para os critérios selecionados.
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
