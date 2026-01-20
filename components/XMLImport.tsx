
import React, { useState, useRef } from 'react';
import { parseInvoiceXml } from '../utils/xmlParser';
import { useStore } from '../store';
import { Icons } from '../constants';

const XMLImport: React.FC = () => {
  const { invoices, suppliers, addInvoice, addSupplier } = useStore();
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    duplicate: number;
    error: number;
    files: Array<{ name: string; status: 'pending' | 'success' | 'duplicate' | 'error' }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Explicitly cast to File[] to ensure 'name' and 'text()' are available
    const selectedFiles = Array.from(e.target.files || []) as File[];
    if (selectedFiles.length === 0) return;

    setImporting(true);
    // Use a wider type for status so it can be updated from 'pending' to other states
    const filesToProcess = selectedFiles.map(f => ({ 
      name: f.name, 
      status: 'pending' as 'pending' | 'success' | 'duplicate' | 'error' 
    }));
    setResults({ success: 0, duplicate: 0, error: 0, files: filesToProcess });

    const stats = { success: 0, duplicate: 0, error: 0 };
    const processedFiles = [...filesToProcess];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        const text = await file.text();
        const parsedData = await parseInvoiceXml(text);

        // Check Duplicity
        const isDuplicate = invoices.some(inv => inv.accessKey && inv.accessKey === parsedData.accessKey);
        
        if (isDuplicate) {
          stats.duplicate++;
          processedFiles[i].status = 'duplicate';
        } else {
          // Find or create supplier
          let supplierId = '';
          const existingSupplier = suppliers.find(s => s.cnpjCpf === parsedData.supplier.cnpjCpf);
          
          if (existingSupplier) {
            supplierId = existingSupplier.id;
          } else {
            const newSupplier = addSupplier(parsedData.supplier);
            supplierId = newSupplier.id;
          }

          // Add invoice
          const { supplier, ...invoiceData } = parsedData;
          addInvoice({
            ...invoiceData as any,
            supplierId,
            payments: [],
            attachments: [],
          });

          stats.success++;
          processedFiles[i].status = 'success';
        }
      } catch (err) {
        console.error(`Error processing ${file.name}:`, err);
        stats.error++;
        processedFiles[i].status = 'error';
      }

      setResults({ ...stats, files: [...processedFiles] });
    }

    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Importação de XML</h3>
            <p className="text-sm text-slate-500">Selecione um ou mais arquivos .xml para importação automática.</p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".xml"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold shadow-sm hover:bg-indigo-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed`}
            >
              <Icons.Import />
              {importing ? 'Processando...' : 'Importar XML'}
            </button>
          </div>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                <span className="block text-2xl font-bold text-emerald-600">{results.success}</span>
                <span className="text-xs font-medium text-emerald-800 uppercase tracking-tighter">Sucesso</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-center">
                <span className="block text-2xl font-bold text-amber-600">{results.duplicate}</span>
                <span className="text-xs font-medium text-amber-800 uppercase tracking-tighter">Duplicatas</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-center">
                <span className="block text-2xl font-bold text-rose-600">{results.error}</span>
                <span className="text-xs font-medium text-rose-800 uppercase tracking-tighter">Erros</span>
              </div>
            </div>

            {importing && (
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${((results.success + results.duplicate + results.error) / results.files.length) * 100}%` }}
                ></div>
              </div>
            )}

            <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100">
              {results.files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 text-sm">
                  <span className="truncate max-w-[200px] text-slate-600">{file.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    file.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                    file.status === 'duplicate' ? 'bg-amber-100 text-amber-700' :
                    file.status === 'error' ? 'bg-rose-100 text-rose-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {file.status === 'pending' ? 'Pendente' : 
                     file.status === 'success' ? 'Importado' :
                     file.status === 'duplicate' ? 'Duplicado' : 'Erro'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-medium">Os dados importados podem ser editados manualmente na lista de notas.</p>
      </div>
    </div>
  );
};

export default XMLImport;
