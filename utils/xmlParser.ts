
import { Invoice, DocumentType, PaymentStatus, PaymentMethod, PaymentCondition, FinancialStatus, LineItem, PaymentRecord } from '../types';

export const parseInvoiceXml = async (xmlString: string): Promise<Partial<Invoice> & { supplier: any }> => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const getTagValue = (parent: Element | Document, tagName: string) => 
    parent.getElementsByTagName(tagName)[0]?.textContent || '';

  // Detect Type
  const isNFe = xmlDoc.getElementsByTagName('infNFe').length > 0;
  
  const emit = xmlDoc.getElementsByTagName('emit')[0];
  const supplier = {
    razaoSocial: getTagValue(emit, 'xNome'),
    nomeFantasia: getTagValue(emit, 'xFant'),
    cnpjCpf: getTagValue(emit, 'CNPJ') || getTagValue(emit, 'CPF'),
    status: 'Ativo' as const,
  };

  const issueDate = getTagValue(xmlDoc, 'dhEmi').split('T')[0] || getTagValue(xmlDoc, 'dEmi');
  const totalAmount = parseFloat(getTagValue(xmlDoc, 'vNF') || getTagValue(xmlDoc, 'vServ') || '0');
  const taxes = parseFloat(getTagValue(xmlDoc, 'vTotTrib') || '0');

  // Parse Items (Line Items)
  const items: LineItem[] = [];
  const detTags = Array.from(xmlDoc.getElementsByTagName('det'));
  detTags.forEach((det) => {
    const prod = det.getElementsByTagName('prod')[0];
    if (prod) {
      items.push({
        id: crypto.randomUUID(),
        description: getTagValue(prod, 'xProd'),
        quantity: parseFloat(getTagValue(prod, 'qCom') || '0'),
        unitValue: parseFloat(getTagValue(prod, 'vUnCom') || '0'),
        totalValue: parseFloat(getTagValue(prod, 'vProd') || '0'),
        cfop: getTagValue(prod, 'CFOP'),
        ncm: getTagValue(prod, 'NCM')
      });
    }
  });

  // Parse Duplicates (Installments)
  const payments: PaymentRecord[] = [];
  const dupTags = Array.from(xmlDoc.getElementsByTagName('dup'));
  let minDueDate = '9999-12-31';
  const today = new Date().toISOString().split('T')[0];

  if (dupTags.length > 0) {
    dupTags.forEach(dup => {
      const dVenc = getTagValue(dup, 'dVenc');
      const vDup = parseFloat(getTagValue(dup, 'vDup') || '0');
      const nDup = getTagValue(dup, 'nDup');
      
      if (dVenc && dVenc < minDueDate) minDueDate = dVenc;
      
      payments.push({
        id: crypto.randomUUID(),
        date: dVenc,
        amount: vDup,
        method: PaymentMethod.BOLETO,
        notes: `Parcela ${nDup}`,
        isScheduled: true // Mark as programmed from XML
      });
    });
  } else {
    // Single payment fallback
    const singleVenc = getTagValue(xmlDoc, 'dVenc') || issueDate;
    minDueDate = singleVenc;
    payments.push({
      id: crypto.randomUUID(),
      date: singleVenc,
      amount: totalAmount,
      method: PaymentMethod.BOLETO,
      notes: 'Parcela única (XML)',
      isScheduled: true
    });
  }

  // Ensure minDueDate isn't the initial placeholder if no dates found
  if (minDueDate === '9999-12-31') minDueDate = issueDate;

  return {
    invoiceNumber: getTagValue(xmlDoc, 'nNF') || getTagValue(xmlDoc, 'numero'),
    series: getTagValue(xmlDoc, 'serie'),
    accessKey: getTagValue(xmlDoc, 'chNFe'),
    issueDate: issueDate,
    dueDate: minDueDate,
    totalAmount: totalAmount,
    taxes: taxes,
    type: isNFe ? DocumentType.NFE : DocumentType.NFSE,
    status: PaymentStatus.OPEN,
    financialStatus: FinancialStatus.WAITING,
    paymentMethod: PaymentMethod.BOLETO,
    paymentCondition: dupTags.length > 1 ? PaymentCondition.INSTALLMENTS : PaymentCondition.CASH,
    installments: dupTags.length || 1,
    notes: 'Importado via XML',
    destination: '',
    items,
    payments,
    supplier
  };
};
