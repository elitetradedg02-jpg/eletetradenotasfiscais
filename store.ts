
import { useState, useEffect } from 'react';
import { Invoice, Supplier, PaymentStatus, FinancialStatus } from './types';

const STORAGE_KEY = 'ELITE_TRADE_DATA_V3';

interface AppData {
  invoices: Invoice[];
  suppliers: Supplier[];
}

const getInitialData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return { invoices: [], suppliers: [] };
};

export const useStore = () => {
  const [data, setData] = useState<AppData>(getInitialData());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const calculateStatus = (invoice: Invoice): PaymentStatus => {
    const today = new Date().toISOString().split('T')[0];
    
    // According to rule 4:
    // Scheduled payments > today: Don't count for "Paid"
    // Scheduled payments <= today OR manual payments: Count for "Paid"
    const totalPaid = invoice.payments
      .filter(p => !p.isScheduled || (p.isScheduled && p.date <= today))
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (totalPaid >= invoice.totalAmount - 0.01) return PaymentStatus.PAID;
    
    if (invoice.dueDate < today) return PaymentStatus.OVERDUE;
    
    return PaymentStatus.OPEN;
  };

  // Status Sync Effect
  useEffect(() => {
    const updatedInvoices = data.invoices.map(invoice => {
      const newStatus = calculateStatus(invoice);
      if (newStatus !== invoice.status) {
        return { ...invoice, status: newStatus };
      }
      return invoice;
    });
    
    if (JSON.stringify(updatedInvoices) !== JSON.stringify(data.invoices)) {
      setData(prev => ({ ...prev, invoices: updatedInvoices }));
    }
  }, [data.invoices]);

  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const id = crypto.randomUUID();
    const newSupplier = { ...supplier, id };
    setData(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSupplier]
    }));
    return newSupplier;
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setData(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
    }));
  };

  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const id = crypto.randomUUID();
    const newInvoice = { ...invoice, id } as Invoice;
    newInvoice.status = calculateStatus(newInvoice);
    setData(prev => ({
      ...prev,
      invoices: [...prev.invoices, newInvoice]
    }));
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => {
        if (inv.id === id) {
          const updated = { ...inv, ...updates };
          updated.status = calculateStatus(updated);
          return updated;
        }
        return inv;
      })
    }));
  };

  const deleteInvoice = (id: string) => {
    setData(prev => ({
      ...prev,
      invoices: prev.invoices.filter(inv => inv.id !== id)
    }));
  };

  return {
    invoices: data.invoices,
    suppliers: data.suppliers,
    addSupplier,
    updateSupplier,
    addInvoice,
    updateInvoice,
    deleteInvoice
  };
};
