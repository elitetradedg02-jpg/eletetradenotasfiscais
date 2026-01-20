
import React, { useState } from 'react';
import { useStore } from '../store';
import { Invoice, PaymentMethod, AttachmentType, Attachment, LineItem, PaymentRecord } from '../types';
import { formatCurrency, formatDate, formatCnpjCpf } from '../utils/formatters';

interface InvoiceDetailsProps {
  id: string;
  onBack: () => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ id, onBack }) => {
  const { invoices, suppliers, updateInvoice, deleteInvoice } = useStore();
  const invoice = invoices.find(i => i.id === id);
  const supplier = invoice ? suppliers.find(s => s.id === invoice.supplierId) : null;

  const [activeTab, setActiveTab] = useState<'dossier' | 'items' | 'payments'>('dossier');
  const [isPaying, setIsPaying] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    method: PaymentMethod.PIX,
    notes: '',
  });

  if (!invoice || !supplier) return null;

  const today = new Date().toISOString().split('T')[0];
  const totalPaid = invoice.payments
    .filter(p => !p.isScheduled || (p.isScheduled && p.date <= today))
    .reduce((acc, p) => acc + p.amount, 0);
  const remaining = invoice.totalAmount - totalPaid;

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedPayments = [...invoice.payments];
    
    if (editingPaymentId) {
      updatedPayments = updatedPayments.map(p => 
        p.id === editingPaymentId ? { ...p, ...paymentForm, isScheduled: false } : p
      );
      alert('Pagamento atualizado com sucesso');
    } else {
      const newPayment: PaymentRecord = {
        id: crypto.randomUUID(),
        ...paymentForm,
        isScheduled: false
      };
      updatedPayments.push(newPayment);
      alert('Pagamento registrado com sucesso');
    }
    
    updateInvoice(invoice.id, { payments: updatedPayments });
    setIsPaying(false);
    setEditingPaymentId(null);
  };

  const handleDeletePayment = (payId: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de pagamento? Esta ação é irreversível e atualizará o status financeiro da nota.')) {
      const updatedPayments = invoice.payments.filter(p => p.id !== payId);
      updateInvoice(invoice.id, { payments: updatedPayments });
      alert('Pagamento excluído com sucesso');
    }
  };

  const handleEditPayment = (p: PaymentRecord) => {
    setPaymentForm({
      amount: p.amount,
      date: p.date,
      method: p.method,
      notes: p.notes,
    });
    setEditingPaymentId(p.id);
    setIsPaying(true);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<LineItem>) => {
    const newItems = invoice.items.map(it => it.id === itemId ? { ...it, ...updates } : it);
    updateInvoice(invoice.id, { items: newItems });
  };

  const handleDeleteItem = (itemId: string) => {
    if (confirm('Excluir este item da nota?')) {
      const newItems = invoice.items.filter(it => it.id !== itemId);
      updateInvoice(invoice.id, { items: newItems });
    }
  };

  const handleAddItemManual = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: 'Novo Item',
      quantity: 1,
      unitValue: 0,
      totalValue: 0
    };
    updateInvoice(invoice.id, { items: [...(invoice.items || []), newItem] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2">
          &larr; Voltar para a Lista
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => { if(confirm('Excluir nota fiscal e todos os seus dados?')) { deleteInvoice(invoice.id); onBack(); } }} 
            className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all"
          >
            Excluir Nota
          </button>
        </div>
      </div>

      <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit">
        {(['dossier', 'items', 'payments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            {tab === 'dossier' ? 'Dossiê' : tab === 'items' ? 'Itens' : 'Pagamentos'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'dossier' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                <InfoItem label="Fornecedor" value={supplier.razaoSocial} subValue={formatCnpjCpf(supplier.cnpjCpf)} />
                <InfoItem label="Contato Principal" value={supplier.contato || 'Não Informado'} />
                <InfoItem label="Nota Fiscal / Série" value={`${invoice.invoiceNumber} / ${invoice.series}`} />
                <InfoItem label="Valor Total" value={formatCurrency(invoice.totalAmount)} highlight />
                <InfoItem label="Status Nota" value={invoice.status} badge />
                <InfoItem label="Financeiro" value={invoice.financialStatus} badge />
                <InfoItem label="Data de Emissão" value={formatDate(invoice.issueDate)} />
                <InfoItem label="Data de Vencimento" value={formatDate(invoice.dueDate)} />
              </div>
              <div className="pt-6 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Observações da Nota</label>
                <textarea 
                  className="w-full p-4 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                  rows={4}
                  defaultValue={invoice.notes} 
                  onBlur={(e) => updateInvoice(invoice.id, { notes: e.target.value })}
                  placeholder="Informações adicionais sobre esta nota..."
                />
              </div>
            </div>
          )}

          {activeTab === 'items' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Produtos e Serviços</h3>
                <button onClick={handleAddItemManual} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">+ Add Item</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[9px]">
                    <tr>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3 text-center">Qtd</th>
                      <th className="px-4 py-3 text-right">Unitário</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.items?.map(it => (
                      <tr key={it.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-4 py-3">
                          <input 
                            className="w-full bg-transparent border-none p-0 focus:ring-0 font-medium text-slate-700" 
                            defaultValue={it.description} 
                            onBlur={(e) => handleUpdateItem(it.id, { description: e.target.value })} 
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input 
                            className="w-16 bg-transparent border-none text-center p-0 focus:ring-0" 
                            type="number" 
                            defaultValue={it.quantity} 
                            onBlur={(e) => handleUpdateItem(it.id, { quantity: parseFloat(e.target.value) })} 
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <input 
                            className="w-24 bg-transparent border-none text-right p-0 focus:ring-0" 
                            type="number" 
                            defaultValue={it.unitValue} 
                            onBlur={(e) => handleUpdateItem(it.id, { unitValue: parseFloat(e.target.value), totalValue: it.quantity * parseFloat(e.target.value) })} 
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(it.totalValue)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handleDeleteItem(it.id)} className="text-rose-500 hover:text-rose-700 font-bold text-lg">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Programação de Pagamentos</h3>
                <button 
                  onClick={() => { setIsPaying(true); setEditingPaymentId(null); setPaymentForm({ ...paymentForm, amount: remaining > 0 ? remaining : 0 }); }} 
                  className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-bold rounded-xl uppercase tracking-widest shadow-lg hover:shadow-indigo-200 transition-all"
                >
                  Registrar Pagamento
                </button>
              </div>

              {isPaying && (
                <form onSubmit={handleSavePayment} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-300">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Valor</label>
                    <input type="number" step="0.01" className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value)})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Data</label>
                    <input type="date" className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Forma</label>
                    <select className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value as PaymentMethod})}>
                      {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Observações</label>
                    <input type="text" className="w-full p-3 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={paymentForm.notes} onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})} placeholder="Ex: Pagamento 1/3" />
                  </div>
                  <div className="md:col-span-3 flex justify-end gap-3">
                    <button type="button" onClick={() => {setIsPaying(false); setEditingPaymentId(null);}} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                    <button type="submit" className="text-xs font-bold bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-indigo-700 transition-all">
                      {editingPaymentId ? 'Atualizar Dados' : 'Confirmar Pagamento'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {invoice.payments.length === 0 ? (
                  <p className="text-center text-slate-400 py-12 text-sm italic">Nenhum pagamento registrado ou programado.</p>
                ) : (
                  invoice.payments.sort((a,b) => a.date.localeCompare(b.date)).map((p) => {
                    const isOverdueScheduled = p.isScheduled && p.date < today;
                    const isFutureScheduled = p.isScheduled && p.date > today;
                    const isEffective = !p.isScheduled || (p.isScheduled && p.date <= today);

                    return (
                      <div key={p.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                        isFutureScheduled ? 'bg-amber-50 border-amber-100' : 
                        isOverdueScheduled ? 'bg-rose-50 border-rose-100' : 
                        'bg-emerald-50 border-emerald-100'
                      }`}>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700">{formatDate(p.date)}</span>
                            <span className={`text-[9px] uppercase font-black ${
                              isFutureScheduled ? 'text-amber-600' : 
                              isOverdueScheduled ? 'text-rose-600' : 
                              'text-emerald-600'
                            }`}>
                              {p.isScheduled ? (isFutureScheduled ? 'Programado' : 'Vencido/Efetivado') : p.method}
                            </span>
                          </div>
                          <div className="hidden md:flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</span>
                            <span className="text-[11px] text-slate-600 font-medium">{p.notes || '-'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className={`text-lg font-black ${isEffective ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {formatCurrency(p.amount)}
                          </span>
                          <div className="flex gap-3">
                            <button onClick={() => handleEditPayment(p)} className="p-2 text-indigo-600 hover:bg-white rounded-lg transition-all" title="Editar">
                              ✏️
                            </button>
                            <button onClick={() => handleDeletePayment(p.id)} className="p-2 text-rose-600 hover:bg-white rounded-lg transition-all" title="Excluir">
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center px-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Efetivado (Status Paga)</span>
                <span className="text-2xl font-black text-emerald-600">{formatCurrency(totalPaid)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-indigo-600 text-white p-8 rounded-2xl shadow-xl shadow-indigo-100 flex flex-col items-center text-center">
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-2">Saldo Remanescente</p>
            <p className="text-4xl font-black tracking-tighter mb-4">{formatCurrency(remaining)}</p>
            <div className="w-full bg-indigo-500/30 rounded-full h-1.5 mt-2">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (totalPaid / invoice.totalAmount) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-6 border-b pb-2">Dossiê de Anexos</h3>
            <div className="space-y-6">
              <label className="block group cursor-pointer">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-2xl group-hover:border-indigo-300 transition-all bg-slate-50">
                  <span className="text-2xl mb-2">📁</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase group-hover:text-indigo-600">Subir Documento</span>
                </div>
                <input type="file" className="hidden" />
              </label>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {invoice.attachments.length === 0 ? (
                  <p className="text-[10px] text-slate-400 text-center italic">Nenhum anexo encontrado.</p>
                ) : (
                  invoice.attachments.map(at => (
                    <div key={at.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group">
                      <div className="flex flex-col truncate flex-1">
                        <span className="text-[10px] font-bold text-slate-700 truncate">{at.name}</span>
                        <span className="text-[8px] text-slate-400 uppercase">{formatDate(at.uploadDate)}</span>
                      </div>
                      <a href={at.url} download className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all">Baixar</a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value, subValue, highlight, badge }: any) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
    <div className="flex items-baseline gap-2">
      {badge ? (
        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase shadow-sm ${
          ['Paga', 'Comprovante Pagto', 'Enviado'].includes(value) ? 'bg-emerald-100 text-emerald-700' :
          ['Em aberto', 'Aguardando'].includes(value) ? 'bg-amber-100 text-amber-700' :
          'bg-rose-100 text-rose-700'
        }`}>{value}</span>
      ) : (
        <span className={`text-sm font-bold truncate ${highlight ? 'text-2xl font-black text-slate-900 tracking-tighter' : 'text-slate-700'}`}>{value}</span>
      )}
      {subValue && <span className="text-[10px] text-slate-400 font-mono">{subValue}</span>}
    </div>
  </div>
);

export default InvoiceDetails;
