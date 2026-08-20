export type WhiteWoodOwner = 'N1' | 'MO';
export type WhiteWoodStatus = 'AVAILABLE' | 'PENDING_EXIM' | 'BORROWED';

export interface WhiteWoodItem {
  item_code: string;
  item_name?: string; // Optional context
  owner: WhiteWoodOwner;
  current_location: WhiteWoodOwner | 'IN_TRANSIT';
  status: WhiteWoodStatus;
  created_at: string;
}

export type TransactionStatus = 'PENDING_EXIM' | 'ACTIVE' | 'RETURNED';

export interface WhiteWoodTransaction {
  transaction_id: string;
  item_code: string;
  borrower: WhiteWoodOwner;
  status: TransactionStatus;
  
  // Dates
  submission_date?: string; // Tgl Pengajuan Exim (MO -> N1)
  borrow_date?: string;     // Tgl Pengiriman Barang
  due_date?: string;        // Max 3 months from borrow_date
  return_date?: string;     // Actual return date
  
  // Documents
  outgoing_document?: string; // Surat Jalan (+ BC if MO->N1)
  return_document?: string;   // Dokumen pengembalian
  
  timestamp: string; // Created at
}
