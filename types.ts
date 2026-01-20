
export enum PaymentStatus {
  OPEN = 'Em aberto',
  PAID = 'Paga',
  OVERDUE = 'Vencida'
}

export enum FinancialStatus {
  WAITING = 'Aguardando',
  RECEIPT = 'Comprovante Pagto',
  SENT = 'Enviado'
}

export enum PaymentMethod {
  PIX = 'Pix',
  BOLETO = 'Boleto',
  CARD = 'Cartão',
  TRANSFER = 'Transferência',
  CASH = 'Dinheiro'
}

export enum PaymentCondition {
  CASH = 'À vista',
  INSTALLMENTS = 'Parcelado'
}

export enum DocumentType {
  NFE = 'NF-e',
  NFSE = 'NFS-e'
}

export enum AttachmentType {
  BOLETO = 'Boleto bancário',
  COMPROVANTE = 'Comprovante de pagamento',
  OUTROS = 'Outros documentos'
}

export interface Attachment {
  id: string;
  name: string;
  type: AttachmentType;
  description: string;
  uploadDate: string;
  url: string;
  mimeType: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  notes: string;
  receiptUrl?: string;
  isScheduled?: boolean; // True if imported from XML as a future installment
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  cfop?: string;
  ncm?: string;
}

export interface Supplier {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpjCpf: string;
  email?: string;
  phone?: string;
  contato?: string; // New field
  notes?: string;
  status: 'Ativo' | 'Inativo';
}

export interface Invoice {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  series: string;
  accessKey: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  taxes: number;
  type: DocumentType;
  destination: string;
  paymentMethod: PaymentMethod;
  paymentCondition: PaymentCondition;
  financialStatus: FinancialStatus; // New field
  installments?: number;
  status: PaymentStatus;
  notes: string;
  payments: PaymentRecord[];
  items: LineItem[]; // New field
  attachments: Attachment[];
}

export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  supplierId?: string;
  destination?: string;
  status?: string;
  financialStatus?: string;
  paymentMethod?: string;
  issueDateStart?: string;
  issueDateEnd?: string;
  dueDateStart?: string;
  dueDateEnd?: string;
  amountMin?: number;
  amountMax?: number;
}
