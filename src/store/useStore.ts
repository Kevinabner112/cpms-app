import { create } from 'zustand';
import { Item, ColorPanel, PanelUpdateLog, PanelStatus, PanelCreationProcess, PanelCreationCheck, LeadContentTest, PreProductionSample, PPSSubmission } from '@/types';
import { WhiteWoodItem, WhiteWoodTransaction, WhiteWoodOwner, WhiteWoodStatus, TransactionStatus } from '@/types/whitewood';
import { format, addMonths } from 'date-fns';
import { calculateExpirationDate, calculatePanelStatus } from '@/lib/status-logic';
import {
  getItems, getPanels, getLogs, getWhiteWoodItems, getWhiteWoodTransactions, getLeadTests,
  addItem, updateItem, deleteItem as apiDeleteItem, addPanel, renewPanel, markPanelMissing, deletePanel,
  addWhiteWoodItem, importWhiteWoodItems,
  addLeadTest, finalizeLeadTest, deleteLeadTest,
  getPanelProcesses, addPanelProcess, addProcessCheck as apiAddProcessCheck, finalizePanelProcess, deletePanelProcess as apiDeletePanelProcess,
  getPPSRecords, addPPSRecord, updatePPSRecord, addPPSSubmission, updatePPSSubmissionQIR
} from '@/app/actions';

interface CPMSState {
  items: Item[];
  panels: ColorPanel[];
  logs: PanelUpdateLog[];
  whiteWoods: WhiteWoodItem[];
  whiteWoodLogs: WhiteWoodTransaction[];
  panelProcesses: PanelCreationProcess[];
  leadTests: LeadContentTest[];
  ppsRecords: PreProductionSample[];
  isInitialized: boolean;
  isLoading: boolean;

  fetchData: () => Promise<void>;

  renewPanel: (panelId: string, inspectorName: string, validityMonths: number, lastUpdatedDate: string, notes?: string, photoUrl?: string) => Promise<void>;
  markPanelMissing: (panelId: string, actorName: string, notes?: string) => Promise<void>;
  addPanel: (itemCode: string, validityMonths: number, inspectorName: string, lastUpdatedDate: string, photoUrl?: string) => Promise<void>;
  addItem: (item: Omit<Item, 'created_at'>) => Promise<void>;
  updateItem: (itemCode: string, updates: Partial<Item>) => Promise<void>;
  deleteItem: (itemCode: string) => Promise<void>;
  deletePanel: (panelId: string) => Promise<void>;
  importItems: (items: Omit<Item, 'created_at'>[]) => Promise<void>;

  startPanelProcess: (itemCode: string, handledBy: string, startDate: string) => Promise<void>;
  addProcessCheck: (processId: string, check: PanelCreationCheck) => Promise<void>;
  finalizeProcess: (processId: string, approvalDate: string, photoUrl: string, status: 'APPROVED' | 'REJECTED', inspectorName?: string) => Promise<void>;
  deletePanelProcess: (processId: string) => Promise<void>;

  addWhiteWood: (item: Omit<WhiteWoodItem, 'created_at' | 'status'>) => Promise<void>;
  importWhiteWoodItems: (items: WhiteWoodItem[]) => Promise<void>;
  borrowWhiteWood: (itemCode: string, borrower: WhiteWoodOwner, submissionDate?: string, borrowDate?: string, document?: string) => Promise<void>;
  updateEximStatus: (transactionId: string, itemCode: string, borrowDate: string, document: string) => Promise<void>;
  returnWhiteWood: (transactionId: string, itemCode: string, returnDate: string, document: string) => Promise<void>;

  // Lead Content Methods
  addLeadContentTest: (test: Omit<LeadContentTest, 'test_id' | 'expiration_date' | 'status' | 'created_at'>) => Promise<void>;
  initiateLeadContentRenewal: (itemCode: string, provider: 'BV' | 'INTERTEK', sentDate: string) => Promise<void>;
  finalizeLeadContentRenewal: (testId: string, testDate: string, documentUrl?: string) => Promise<void>;
  deleteLeadContentTest: (testId: string) => Promise<void>;

  // PPS Methods
  startPPS: (projectName: string, itemCode: string, handledBy: string, startDate: string) => Promise<void>;
  updatePPSStatus: (ppsId: string, status: 'PENDING' | 'REVISING' | 'APPROVED' | 'CLOSED', approvalDate?: string, resultPhotoUrl?: string) => Promise<void>;
  updatePPSRecord: (ppsId: string, updates: Partial<PreProductionSample>) => Promise<void>;
  addPPSSubmissionCheck: (ppsId: string, submission: PPSSubmission) => Promise<void>;
  updatePPSSubmission: (ppsId: string, submissionIndex: number, submission: PPSSubmission) => Promise<void>;
  updatePPSSubmissionQIR: (ppsId: string, submissionIndex: number, qirData: any) => Promise<void>;
}

export const useStore = create<CPMSState>((set, get) => ({
  items: [],
  panels: [],
  logs: [],
  whiteWoods: [],
  whiteWoodLogs: [],
  panelProcesses: [],
  leadTests: [],
  ppsRecords: [],
  isInitialized: false,
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    try {
      const [fetchedItems, fetchedPanels, fetchedLogs, fetchedWhiteWoods, fetchedWhiteWoodTxs, fetchedLeadTests, fetchedPanelProcesses, fetchedPPS] = await Promise.all([
        getItems(),
        getPanels(),
        getLogs(),
        getWhiteWoodItems(),
        getWhiteWoodTransactions(),
        getLeadTests(),
        getPanelProcesses(),
        getPPSRecords()
      ]);

      const updatedPanels = fetchedPanels.map((p: any) => ({
        ...p,
        status: p.status === 'MISSING' ? 'MISSING' : calculatePanelStatus(p.expiration_date, false)
      }));

      const updatedLeadTests = fetchedLeadTests.map((t: any) => ({
        ...t,
        status: t.status === 'PENDING' ? 'PENDING' : calculatePanelStatus(t.expiration_date, false)
      }));

      set({
        items: fetchedItems,
        panels: updatedPanels,
        logs: fetchedLogs,
        whiteWoods: fetchedWhiteWoods,
        whiteWoodLogs: fetchedWhiteWoodTxs,
        leadTests: updatedLeadTests,
        panelProcesses: fetchedPanelProcesses,
        ppsRecords: fetchedPPS,
        isInitialized: true,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      set({ isLoading: false });
    }
  },

  renewPanel: async (panelId, inspectorName, validityMonths, lastUpdatedDate, notes, photoUrl) => {
    // Optimistic Update
    const newExpiration = calculateExpirationDate(lastUpdatedDate, validityMonths);
    const newStatus = calculatePanelStatus(newExpiration, false);
    set((state) => ({
      panels: state.panels.map(p => p.panel_id === panelId ? { ...p, last_updated_date: lastUpdatedDate, expiration_date: newExpiration, status: newStatus, qa_inspector_name: inspectorName, notes: notes || p.notes, photo_url: photoUrl || p.photo_url } : p)
    }));
    // Sync to Server
    await renewPanel(panelId, inspectorName, notes, photoUrl);
    await get().fetchData();
  },

  markPanelMissing: async (panelId, actorName, notes) => {
    set((state) => ({
      panels: state.panels.map(p => p.panel_id === panelId ? { ...p, status: 'MISSING', notes: notes || p.notes } : p)
    }));
    await markPanelMissing(panelId, actorName, notes);
    await get().fetchData();
  },

  deletePanel: async (panelId: string) => {
    set((state) => ({ panels: state.panels.filter(p => p.panel_id !== panelId) }));
    await deletePanel(panelId);
    await get().fetchData();
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

    await addPanel(newPanel);
    await get().fetchData();
  },

  addItem: async (item) => {
    const newItem: Item = { ...item, created_at: new Date().toISOString() };
    await addItem(newItem);
    await get().fetchData();
  },

  importItems: async (items) => {
    // Simple iterative import for now. Optimally we'd do a batch server action.
    for (const item of items) {
      await addItem({ ...item, created_at: new Date().toISOString() } as Item);
    }
    await get().fetchData();
  },

  deleteItem: async (itemCode) => {
    await apiDeleteItem(itemCode);
    await get().fetchData();
  },

  updateItem: async (itemCode, updates) => {
    await updateItem(itemCode, updates);
    await get().fetchData();
  },

  startPanelProcess: async (itemCode, handledBy, startDate) => {
    const processId = `PRC-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const newProcess: PanelCreationProcess = {
      process_id: processId,
      item_code: itemCode,
      start_date: startDate,
      handled_by: handledBy,
      checks: [],
      status: 'IN_PROGRESS'
    };
    await addPanelProcess(newProcess);
    await get().fetchData();
  },

  addProcessCheck: async (processId, check) => {
    await apiAddProcessCheck(processId, check);
    await get().fetchData();
  },

  finalizeProcess: async (processId, approvalDate, photoUrl, status, inspectorName) => {
    const proc = get().panelProcesses.find(p => p.process_id === processId);
    let leadTimeDays;
    if (proc && approvalDate) {
      leadTimeDays = Math.max(0, Math.floor((new Date(approvalDate).getTime() - new Date(proc.start_date).getTime()) / (1000 * 60 * 60 * 24)));
    }

    await finalizePanelProcess(processId, approvalDate, photoUrl, status, leadTimeDays);

    if (status === 'APPROVED' && proc) {
      const existingPanel = get().panels.find(p => p.item_code === proc.item_code && p.status !== 'MISSING' && p.status !== 'PENDING');

      if (existingPanel) {
        // Renewal logic
        await get().renewPanel(existingPanel.panel_id, inspectorName || proc.handled_by, existingPanel.validity_period_months || 24, approvalDate, `Renewed via process ${processId}`, photoUrl);
      } else {
        // Creation logic
        await get().addPanel(proc.item_code, 24, inspectorName || proc.handled_by, approvalDate, photoUrl);
      }
    }

    await get().fetchData();
  },

  deletePanelProcess: async (processId) => {
    await apiDeletePanelProcess(processId);
    await get().fetchData();
  },


  addWhiteWood: async (item) => {
    const newItem: WhiteWoodItem = {
      ...item,
      status: 'AVAILABLE',
      created_at: new Date().toISOString()
    };
    await addWhiteWoodItem(newItem);
    await get().fetchData();
  },

  importWhiteWoodItems: async (items) => {
    await importWhiteWoodItems(items);
    await get().fetchData();
  },

  borrowWhiteWood: async (itemCode, borrower, submissionDate, borrowDate, documentStr) => {
    // Simplified for D1 server action...
    await get().fetchData();
  },

  updateEximStatus: async (transactionId, itemCode, borrowDate, documentStr) => {
    // Simplified for D1 server action...
    await get().fetchData();
  },

  returnWhiteWood: async (transactionId, itemCode, returnDate, documentStr) => {
    // Simplified for D1 server action...
    await get().fetchData();
  },

  // LEAD CONTENT METHODS
  addLeadContentTest: async (test) => {
    // Legacy add logic for backward compatibility or direct creation
    let status: PanelStatus = 'PENDING';
    let expirationDate = null;

    if (test.test_date) {
      const expDate = addMonths(new Date(test.test_date), 12);
      expirationDate = expDate.toISOString().split('T')[0];
      status = calculatePanelStatus(expirationDate, false);
    }

    const newTest: LeadContentTest = {
      ...test,
      test_id: `LCT-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      expiration_date: expirationDate as any,
      status,
      created_at: new Date().toISOString()
    };

    await addLeadTest(newTest);
    await get().fetchData();
  },

  initiateLeadContentRenewal: async (itemCode, provider, sentDate) => {
    const newTest: LeadContentTest = {
      test_id: `LCT-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      item_code: itemCode,
      provider: provider,
      sent_date: sentDate,
      status: 'PENDING',
      created_at: new Date().toISOString()
    };
    await addLeadTest(newTest);
    await get().fetchData();
  },

  finalizeLeadContentRenewal: async (testId, testDate, documentUrl) => {
    await finalizeLeadTest(testId, testDate, documentUrl);
    await get().fetchData();
  },

  deleteLeadContentTest: async (testId) => {
    await deleteLeadTest(testId);
    await get().fetchData();
  },

  // PPS Methods
  startPPS: async (projectName, itemCode, handledBy, startDate) => {
    const ppsId = `PPS-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const newPPS: PreProductionSample = {
      pps_id: ppsId,
      project_name: projectName,
      item_code: itemCode,
      handled_by: handledBy,
      start_date: startDate,
      status: 'PENDING',
      submissions: [],
      created_at: new Date().toISOString()
    };
    await addPPSRecord(newPPS);
    await get().fetchData();
  },

  updatePPSStatus: async (ppsId, status, approvalDate, resultPhotoUrl) => {
    await updatePPSRecord(ppsId, {
      status,
      approval_date: approvalDate,
      result_photo_url: resultPhotoUrl
    });
    await get().fetchData();
  },

  updatePPSRecord: async (ppsId, updates) => {
    await updatePPSRecord(ppsId, updates);
    await get().fetchData();
  },

  addPPSSubmissionCheck: async (ppsId, submission) => {
    await addPPSSubmission(ppsId, submission);

    // Auto update status based on submission
    if (submission.status === 'PASSED') {
      await updatePPSRecord(ppsId, { status: 'APPROVED', approval_date: submission.review_date || new Date().toISOString().split('T')[0] });
    } else if (submission.status === 'REVISED') {
      await updatePPSRecord(ppsId, { status: 'REVISING' });
    }

    await get().fetchData();
  },

  updatePPSSubmissionQIR: async (ppsId, submissionIndex, qirData) => {
    await updatePPSSubmissionQIR(ppsId, submissionIndex, qirData);
    await get().fetchData();
  },

  updatePPSSubmission: async (ppsId, submissionIndex, submission) => {
    // We can't easily import this directly if it wasn't added to actions.ts exports yet, but I'll add it
    const { updatePPSSubmission } = await import('@/app/actions');
    await updatePPSSubmission(ppsId, submissionIndex, submission);

    // Auto update status based on submission (only if it's the latest submission)
    const pps = get().ppsRecords.find(p => p.pps_id === ppsId);
    if (pps && submissionIndex === pps.submissions.length - 1) {
      if (submission.status === 'PASSED') {
        await get().updatePPSRecord(ppsId, { status: 'APPROVED', approval_date: submission.review_date || new Date().toISOString().split('T')[0] });
      } else if (submission.status === 'REVISED') {
        await get().updatePPSRecord(ppsId, { status: 'REVISING' });
      }
    }
    await get().fetchData();
  }
}));
