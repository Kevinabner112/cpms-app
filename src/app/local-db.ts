import { Item, ColorPanel, PanelUpdateLog, LeadContentTest, PanelCreationProcess, PanelCreationCheck, PreProductionSample, PPSSubmission } from '@/types';
import { WhiteWoodItem, WhiteWoodTransaction } from '@/types/whitewood';
import fs from 'fs';
import path from 'path';
import { calculateExpirationDate, calculatePanelStatus } from '@/lib/status-logic';

const DB_FILE = path.join(process.cwd(), 'local-mock-db.json');

type MockSchema = {
  items: Item[];
  color_panels: ColorPanel[];
  audit_logs: PanelUpdateLog[];
  whitewood_items: WhiteWoodItem[];
  whitewood_transactions: WhiteWoodTransaction[];
  lead_content_tests: LeadContentTest[];
  panel_processes: PanelCreationProcess[];
  pps_records: PreProductionSample[];
};

function readDB(): MockSchema {
  let data: Partial<MockSchema> = {};
  try {
    if (fs.existsSync(DB_FILE)) {
      data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading mock DB', e);
  }
  return {
    items: data.items || [],
    color_panels: data.color_panels || [],
    audit_logs: data.audit_logs || [],
    whitewood_items: data.whitewood_items || [],
    whitewood_transactions: data.whitewood_transactions || [],
    lead_content_tests: data.lead_content_tests || [],
    panel_processes: data.panel_processes || [],
    pps_records: data.pps_records || []
  };
}

function writeDB(data: MockSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing mock DB', e);
  }
}

// ITEMS
export async function getItems() {
  const db = readDB();
  return db.items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addItem(item: Item) {
  const db = readDB();
  db.items.push({
    ...item,
    main_wood: item.main_wood || undefined,
    handled_by: item.handled_by || undefined,
    category: item.category || undefined,
    color_code: item.color_code || undefined,
    color_name: item.color_name || undefined
  });
  writeDB(db);
}

export async function updateItem(itemCode: string, updates: Partial<Item>) {
  const db = readDB();
  const index = db.items.findIndex(i => i.item_code === itemCode);
  if (index !== -1) {
    db.items[index] = { ...db.items[index], ...updates };
    writeDB(db);
  }
}

export async function deleteItem(itemCode: string) {
  const db = readDB();
  db.items = db.items.filter(i => i.item_code !== itemCode);
  writeDB(db);
}

// COLOR PANELS
export async function getPanels() {
  const db = readDB();
  return db.color_panels.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addPanel(panel: ColorPanel) {
  const db = readDB();
  db.color_panels.push({
    ...panel,
    photo_url: panel.photo_url || undefined,
    notes: panel.notes || undefined
  });
  
  db.audit_logs.push({
    log_id: crypto.randomUUID(),
    panel_id: panel.panel_id,
    action_type: 'NEW_PANEL',
    new_expiration_date: panel.expiration_date,
    actor_name: panel.qa_inspector_name,
    timestamp: new Date().toISOString(),
    item_code: panel.item_code
  } as PanelUpdateLog);
  
  writeDB(db);
}

export async function renewPanel(panelId: string, actorName: string, notes?: string, photoUrl?: string) {
  const db = readDB();
  const panel = db.color_panels.find(p => p.panel_id === panelId);
  if (!panel) throw new Error('Panel not found');

  const today = new Date().toISOString().split('T')[0];
  const newExpirationDate = calculateExpirationDate(today, panel.validity_period_months);
  const newStatus = calculatePanelStatus(newExpirationDate, false);

  const prevExp = panel.expiration_date;
  panel.last_updated_date = today;
  panel.expiration_date = newExpirationDate;
  panel.status = newStatus;
  if (notes) panel.notes = notes;
  if (photoUrl) panel.photo_url = photoUrl;

  db.audit_logs.push({
    log_id: crypto.randomUUID(),
    panel_id: panelId,
    action_type: 'RENEWAL',
    previous_expiration_date: prevExp,
    new_expiration_date: newExpirationDate,
    actor_name: actorName,
    notes: notes || undefined,
    timestamp: new Date().toISOString(),
    item_code: panel.item_code
  } as PanelUpdateLog);

  writeDB(db);
}

export async function markPanelMissing(panelId: string, actorName: string, notes?: string) {
  const db = readDB();
  const panel = db.color_panels.find(p => p.panel_id === panelId);
  if (!panel) throw new Error('Panel not found');

  panel.status = 'MISSING';
  if (notes) panel.notes = notes;

  db.audit_logs.push({
    log_id: crypto.randomUUID(),
    panel_id: panelId,
    action_type: 'MARKED_MISSING',
    actor_name: actorName,
    notes: notes || undefined,
    timestamp: new Date().toISOString(),
    item_code: panel.item_code
  } as PanelUpdateLog);

  writeDB(db);
}

export async function deletePanel(panelId: string) {
  const db = readDB();
  db.color_panels = db.color_panels.filter(p => p.panel_id !== panelId);
  writeDB(db);
}

export async function updatePanelInfo(panelId: string, updates: Partial<ColorPanel>) {
  const db = readDB();
  const panel = db.color_panels.find(p => p.panel_id === panelId);
  if (panel) {
    Object.assign(panel, updates);
    writeDB(db);
  }
}

// AUDIT LOGS
export async function getLogs() {
  const db = readDB();
  return db.audit_logs
    .map(log => {
      const item = db.items.find(i => i.item_code === log.item_code);
      return { ...log, main_wood: item?.main_wood };
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// WHITE WOOD ITEMS
export async function getWhiteWoodItems() {
  const db = readDB();
  return db.whitewood_items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addWhiteWoodItem(item: WhiteWoodItem) {
  const db = readDB();
  db.whitewood_items.push({
    ...item,
    item_name: item.item_name || undefined
  });
  writeDB(db);
}

export async function importWhiteWoodItems(items: WhiteWoodItem[]) {
  const db = readDB();
  for (const item of items) {
    const existingIndex = db.whitewood_items.findIndex(i => i.item_code === item.item_code);
    if (existingIndex >= 0) {
      db.whitewood_items[existingIndex] = { ...db.whitewood_items[existingIndex], ...item, item_name: item.item_name || undefined };
    } else {
      db.whitewood_items.push({
        ...item,
        item_name: item.item_name || undefined
      });
    }
  }
  writeDB(db);
}

export async function updateWhiteWoodItem(itemCode: string, updates: Partial<WhiteWoodItem>) {
  const db = readDB();
  const item = db.whitewood_items.find(i => i.item_code === itemCode);
  if (item) {
    Object.assign(item, updates);
    writeDB(db);
  }
}

// WHITE WOOD TRANSACTIONS
export async function getWhiteWoodTransactions() {
  const db = readDB();
  return db.whitewood_transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function addWhiteWoodTransaction(tx: WhiteWoodTransaction) {
  const db = readDB();
  db.whitewood_transactions.push({
    ...tx,
    submission_date: tx.submission_date || undefined,
    borrow_date: tx.borrow_date || undefined,
    due_date: tx.due_date || undefined,
    return_date: tx.return_date || undefined,
    outgoing_document: tx.outgoing_document || undefined,
    return_document: tx.return_document || undefined
  });
  writeDB(db);
}

export async function updateWhiteWoodTransaction(txId: string, updates: Partial<WhiteWoodTransaction>) {
  const db = readDB();
  const tx = db.whitewood_transactions.find(t => t.transaction_id === txId);
  if (tx) {
    Object.assign(tx, updates);
    writeDB(db);
  }
}

// LEAD CONTENT TESTS
export async function getLeadTests() {
  const db = readDB();
  return db.lead_content_tests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addLeadTest(test: LeadContentTest) {
  const db = readDB();
  db.lead_content_tests.push({
    ...test,
    sent_date: test.sent_date || undefined,
    test_date: test.test_date || undefined,
    expiration_date: test.expiration_date || undefined,
    document_url: test.document_url || undefined,
    notes: test.notes || undefined
  });
  writeDB(db);
}

export async function finalizeLeadTest(testId: string, testDate: string, documentUrl?: string) {
  const db = readDB();
  const test = db.lead_content_tests.find(t => t.test_id === testId);
  if (!test) return;

  const expDate = new Date(testDate);
  expDate.setFullYear(expDate.getFullYear() + 1);
  const expirationDate = expDate.toISOString().split('T')[0];
  const newStatus = calculatePanelStatus(expirationDate, false);

  test.test_date = testDate;
  test.expiration_date = expirationDate;
  test.status = newStatus;
  if (documentUrl) test.document_url = documentUrl;
  
  writeDB(db);
}

export async function deleteLeadTest(testId: string) {
  const db = readDB();
  db.lead_content_tests = db.lead_content_tests.filter(t => t.test_id !== testId);
  writeDB(db);
}

// PANEL CREATION PROCESSES
export async function getPanelProcesses() {
  const db = readDB();
  return db.panel_processes.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
}

export async function addPanelProcess(process: PanelCreationProcess) {
  const db = readDB();
  db.panel_processes.push(process);
  writeDB(db);
}

export async function addProcessCheck(processId: string, check: PanelCreationCheck) {
  const db = readDB();
  const process = db.panel_processes.find(p => p.process_id === processId);
  if (process) {
    process.checks.push(check);
    writeDB(db);
  } else {
    throw new Error('Process not found');
  }
}

export async function finalizePanelProcess(processId: string, approvalDate: string, photoUrl?: string, status?: 'APPROVED' | 'REJECTED', leadTimeDays?: number) {
  const db = readDB();
  const process = db.panel_processes.find(p => p.process_id === processId);
  if (!process) throw new Error('Process not found');

  process.status = status || 'APPROVED';
  if (approvalDate) process.approval_date = approvalDate;
  if (photoUrl) process.result_photo_url = photoUrl;
  if (leadTimeDays !== undefined) process.lead_time_days = leadTimeDays;
  
  writeDB(db);
}

export async function deletePanelProcess(processId: string) {
  const db = readDB();
  db.panel_processes = db.panel_processes.filter(p => p.process_id !== processId);
  writeDB(db);
}

// PPS (PRE PRODUCTION SAMPLE)
export async function getPPSRecords() {
  const db = readDB();
  return db.pps_records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addPPSRecord(pps: PreProductionSample) {
  const db = readDB();
  db.pps_records.push({
    ...pps,
    approval_date: pps.approval_date || undefined,
    result_photo_url: pps.result_photo_url || undefined,
    submissions: pps.submissions || []
  });
  writeDB(db);
}

export async function updatePPSRecord(ppsId: string, updates: Partial<PreProductionSample>) {
  const db = readDB();
  const pps = db.pps_records.find(p => p.pps_id === ppsId);
  if (pps) {
    Object.assign(pps, updates);
    writeDB(db);
  }
}

export async function deletePPSRecord(ppsId: string) {
  const db = readDB();
  db.pps_records = db.pps_records.filter(p => p.pps_id !== ppsId);
  writeDB(db);
}

export async function addPPSSubmission(ppsId: string, submission: PPSSubmission) {
  const db = readDB();
  const pps = db.pps_records.find(p => p.pps_id === ppsId);
  if (pps) {
    pps.submissions = pps.submissions || [];
    pps.submissions.push(submission);
    writeDB(db);
  }
}

export async function updatePPSSubmissionQIR(ppsId: string, submissionIndex: number, qirData: any) {
  const db = readDB();
  const pps = db.pps_records.find(p => p.pps_id === ppsId);
  if (pps && pps.submissions && pps.submissions[submissionIndex]) {
    pps.submissions[submissionIndex].qir_data = qirData;
    writeDB(db);
  }
}

export async function updatePPSSubmission(ppsId: string, submissionIndex: number, submission: PPSSubmission) {
  const db = readDB();
  const pps = db.pps_records.find(p => p.pps_id === ppsId);
  if (pps && pps.submissions && pps.submissions[submissionIndex]) {
    pps.submissions[submissionIndex] = submission;
    writeDB(db);
  }
}
