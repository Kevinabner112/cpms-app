import { create } from 'zustand';
import { Item, ColorPanel, PanelUpdateLog, PanelStatus, PanelCreationProcess, PanelCreationCheck } from '@/types';
import { WhiteWoodItem, WhiteWoodTransaction, WhiteWoodOwner, WhiteWoodStatus, TransactionStatus } from '@/types/whitewood';
import { calculateExpirationDate, calculatePanelStatus } from '@/lib/status-logic';
import { format, addMonths } from 'date-fns';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';

interface CPMSState {
  items: Item[];
  panels: ColorPanel[];
  logs: PanelUpdateLog[];
  whiteWoods: WhiteWoodItem[];
  whiteWoodLogs: WhiteWoodTransaction[];
  panelProcesses: PanelCreationProcess[];
  isInitialized: boolean;
  
  initFirestore: () => void;
  renewPanel: (panelId: string, inspectorName: string, validityMonths: number, lastUpdatedDate: string, notes?: string) => Promise<void>;
  markPanelMissing: (panelId: string, actorName: string, notes?: string) => Promise<void>;
  addPanel: (itemCode: string, validityMonths: number, inspectorName: string, lastUpdatedDate: string, photoUrl?: string) => Promise<void>;
  addItem: (item: Omit<Item, 'created_at'>) => Promise<void>;
  deleteItem: (itemCode: string) => Promise<void>;
  importItems: (items: Omit<Item, 'created_at'>[]) => Promise<void>;

  startPanelProcess: (itemCode: string, handledBy: string, startDate: string) => Promise<void>;
  addProcessCheck: (processId: string, check: PanelCreationCheck) => Promise<void>;
  finalizeProcess: (processId: string, approvalDate: string, photoUrl: string, status: 'APPROVED' | 'REJECTED', inspectorName?: string) => Promise<void>;

  addWhiteWood: (item: Omit<WhiteWoodItem, 'created_at' | 'status'>) => Promise<void>;
  borrowWhiteWood: (itemCode: string, borrower: WhiteWoodOwner, submissionDate?: string, borrowDate?: string, document?: string) => Promise<void>;
  updateEximStatus: (transactionId: string, itemCode: string, borrowDate: string, document: string) => Promise<void>;
  returnWhiteWood: (transactionId: string, itemCode: string, returnDate: string, document: string) => Promise<void>;
  deletePanel: (panelId: string) => Promise<void>;
  deletePanelProcess: (processId: string) => Promise<void>;
}

export const useStore = create<CPMSState>((set, get) => ({
  items: [],
  panels: [],
  logs: [],
  whiteWoods: [],
  whiteWoodLogs: [],
  panelProcesses: [],
  isInitialized: false,

  initFirestore: async () => {
    if (get().isInitialized) return;
    set({ isInitialized: true });

    // Listeners
    onSnapshot(collection(db, 'items'), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as Item);
      set({ items });
    });

    onSnapshot(collection(db, 'panels'), (snapshot) => {
      const panels = snapshot.docs.map(doc => {
        const p = doc.data() as ColorPanel;
        return {
          ...p,
          status: p.status === 'MISSING' ? 'MISSING' : calculatePanelStatus(p.expiration_date, false)
        };
      });
      panels.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      set({ panels });
    });

    onSnapshot(collection(db, 'logs'), (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as PanelUpdateLog);
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      set({ logs });
    });

    // White Wood Listeners
    onSnapshot(collection(db, 'whitewood_items'), (snapshot) => {
      const whiteWoods = snapshot.docs.map(doc => doc.data() as WhiteWoodItem);
      whiteWoods.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      set({ whiteWoods });
    });

    onSnapshot(collection(db, 'whitewood_transactions'), (snapshot) => {
      const whiteWoodLogs = snapshot.docs.map(doc => doc.data() as WhiteWoodTransaction);
      whiteWoodLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      set({ whiteWoodLogs });
    });

    // Panel Processes Listener
    onSnapshot(collection(db, 'panel_processes'), (snapshot) => {
      const panelProcesses = snapshot.docs.map(doc => doc.data() as PanelCreationProcess);
      panelProcesses.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      set({ panelProcesses });
    });
  },

  renewPanel: async (panelId, inspectorName, validityMonths, lastUpdatedDate, notes) => {
    const p = get().panels.find(p => p.panel_id === panelId);
    if (!p) return;

    const newExpiration = calculateExpirationDate(lastUpdatedDate, validityMonths);
    const newStatus = calculatePanelStatus(newExpiration, false);
    
    const panelRef = doc(db, 'panels', panelId);
    await setDoc(panelRef, {
      ...p,
      last_updated_date: lastUpdatedDate,
      validity_period_months: validityMonths,
      expiration_date: newExpiration,
      status: newStatus,
      qa_inspector_name: inspectorName,
      notes: notes || p.notes || ''
    });

    const logId = `LOG-${Date.now()}`;
    const logRef = doc(db, 'logs', logId);
    await setDoc(logRef, {
      log_id: logId,
      panel_id: panelId,
      action_type: 'RENEWAL',
      previous_expiration_date: p.expiration_date,
      new_expiration_date: newExpiration,
      actor_name: inspectorName,
      notes: notes || '',
      timestamp: new Date().toISOString()
    });
  },

  markPanelMissing: async (panelId, actorName, notes) => {
    const p = get().panels.find(p => p.panel_id === panelId);
    if (!p) return;

    const panelRef = doc(db, 'panels', panelId);
    await setDoc(panelRef, { ...p, status: 'MISSING' });

    const logId = `LOG-${Date.now()}`;
    const logRef = doc(db, 'logs', logId);
    await setDoc(logRef, {
      log_id: logId,
      panel_id: panelId,
      action_type: 'MARKED_MISSING',
      actor_name: actorName,
      notes: notes || '',
      timestamp: new Date().toISOString()
    });
  },

  deletePanel: async (panelId) => {
    await deleteDoc(doc(db, 'panels', panelId));
  },

  addPanel: async (itemCode, validityMonths, inspectorName, lastUpdatedDate, photoUrl) => {
    const newExpiration = calculateExpirationDate(lastUpdatedDate, validityMonths);
    const newStatus = calculatePanelStatus(newExpiration, false);
    const panelId = `PNL-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const newPanel: ColorPanel = {
      panel_id: panelId,
      item_code: itemCode,
      rack_location: '',
      last_updated_date: lastUpdatedDate,
      validity_period_months: validityMonths,
      expiration_date: newExpiration,
      status: newStatus,
      qa_inspector_name: inspectorName,
      photo_url: photoUrl || '',
      created_at: new Date().toISOString(),
      notes: ''
    };

    await setDoc(doc(db, 'panels', panelId), newPanel);

    const logId = `LOG-${Date.now()}`;
    await setDoc(doc(db, 'logs', logId), {
      log_id: logId,
      panel_id: panelId,
      action_type: 'NEW_PANEL',
      new_expiration_date: newExpiration,
      actor_name: inspectorName,
      timestamp: new Date().toISOString(),
      notes: ''
    });
  },

  addItem: async (item) => {
    const newItem: Item = { ...item, created_at: new Date().toISOString() };
    await setDoc(doc(db, 'items', newItem.item_code), newItem);
  },

  importItems: async (items) => {
    for (let i = 0; i < items.length; i += 500) {
      const batch = writeBatch(db);
      items.slice(i, i + 500).forEach(item => {
        const newItem: Item = { ...item, created_at: new Date().toISOString() };
        const itemRef = doc(db, 'items', newItem.item_code);
        batch.set(itemRef, newItem);
      });
      await batch.commit();
    }
  },

  deleteItem: async (itemCode) => {
    await deleteDoc(doc(db, 'items', itemCode));
  },

  startPanelProcess: async (itemCode, handledBy, startDate) => {
    const processId = `PCT-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const newProcess: PanelCreationProcess = {
      process_id: processId,
      item_code: itemCode,
      start_date: startDate,
      handled_by: handledBy,
      checks: [],
      status: 'IN_PROGRESS'
    };
    await setDoc(doc(db, 'panel_processes', processId), newProcess);
  },

  addProcessCheck: async (processId, check) => {
    const process = get().panelProcesses.find(p => p.process_id === processId);
    if (!process) return;
    const updatedChecks = [...process.checks, check];
    await updateDoc(doc(db, 'panel_processes', processId), {
      checks: updatedChecks
    });
  },

  finalizeProcess: async (processId, approvalDate, photoUrl, status, inspectorName) => {
    const process = get().panelProcesses.find(p => p.process_id === processId);
    if (!process) return;
    
    const start = new Date(process.start_date);
    const end = new Date(approvalDate);
    const leadTimeDays = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    await updateDoc(doc(db, 'panel_processes', processId), {
      approval_date: approvalDate,
      result_photo_url: photoUrl,
      status: status,
      lead_time_days: leadTimeDays
    });

    // Otomatis masukkan ke Panel Inventory jika Approved
    if (status === 'APPROVED') {
      await get().addPanel(
        process.item_code,
        12, // Default validity 12 bulan
        inspectorName || process.handled_by, // Gunakan input inspector, fallback ke handled_by
        approvalDate,
        photoUrl
      );
    }
  },

  deletePanelProcess: async (processId) => {
    await deleteDoc(doc(db, 'panel_processes', processId));
  },


  addWhiteWood: async (item) => {
    const newItem: WhiteWoodItem = {
      ...item,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    };
    await setDoc(doc(db, 'whitewood_items', newItem.item_code), newItem);
  },

  borrowWhiteWood: async (itemCode, borrower, submissionDate, borrowDate, documentStr) => {
    const item = get().whiteWoods.find(w => w.item_code === itemCode);
    if (!item) return;

    const transactionId = `WWT-${Date.now()}`;
    const isExim = item.owner === 'MO' && borrower === 'N1';
    
    const dueDate = borrowDate ? format(addMonths(new Date(borrowDate), 3), 'yyyy-MM-dd') : undefined;

    const transaction: WhiteWoodTransaction = {
      transaction_id: transactionId,
      item_code: itemCode,
      borrower,
      status: isExim ? 'PENDING_EXIM' : 'ACTIVE',
      submission_date: submissionDate,
      borrow_date: borrowDate,
      due_date: dueDate,
      outgoing_document: documentStr,
      timestamp: new Date().toISOString()
    };

    const newStatus: WhiteWoodStatus = isExim ? 'PENDING_EXIM' : 'BORROWED';

    await setDoc(doc(db, 'whitewood_transactions', transactionId), transaction);
    await updateDoc(doc(db, 'whitewood_items', itemCode), { 
      status: newStatus,
      current_location: isExim ? 'IN_TRANSIT' : borrower
    });
  },

  updateEximStatus: async (transactionId, itemCode, borrowDate, documentStr) => {
    const dueDate = format(addMonths(new Date(borrowDate), 3), 'yyyy-MM-dd');
    
    await updateDoc(doc(db, 'whitewood_transactions', transactionId), {
      status: 'ACTIVE',
      borrow_date: borrowDate,
      due_date: dueDate,
      outgoing_document: documentStr
    });

    const t = get().whiteWoodLogs.find(l => l.transaction_id === transactionId);
    if (t) {
      await updateDoc(doc(db, 'whitewood_items', itemCode), {
        status: 'BORROWED',
        current_location: t.borrower
      });
    }
  },

  returnWhiteWood: async (transactionId, itemCode, returnDate, documentStr) => {
    await updateDoc(doc(db, 'whitewood_transactions', transactionId), {
      status: 'RETURNED',
      return_date: returnDate,
      return_document: documentStr
    });

    const item = get().whiteWoods.find(w => w.item_code === itemCode);
    if (item) {
      await updateDoc(doc(db, 'whitewood_items', itemCode), {
        status: 'AVAILABLE',
        current_location: item.owner
      });
    }
  }
}));
