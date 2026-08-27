'use server'

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { revalidatePath } from 'next/cache';
import { Item, ColorPanel, PanelUpdateLog, PanelStatus, ActionType, LeadContentTest, PanelCreationProcess, PanelCreationCheck, PreProductionSample, PPSSubmission } from '@/types';
import { WhiteWoodItem, WhiteWoodTransaction } from '@/types/whitewood';
import { calculateExpirationDate, calculatePanelStatus } from '@/lib/status-logic';
import * as localDb from './local-db';

export async function getDB() {
  const { env } = getCloudflareContext();
  if (!env || !env.DB) {
    throw new Error('D1 Database binding not found');
  }
  return env.DB;
}

// ITEMS
export async function getItems() {
  if (process.env.NODE_ENV === 'development') return localDb.getItems();
  
  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
  return results as unknown as Item[];
}

export async function addItem(item: Item) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addItem(item);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('INSERT INTO items (item_code, item_name, main_wood, handled_by, category, color_code, color_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(item.item_code, item.item_name, item.main_wood || null, item.handled_by || null, item.category || null, item.color_code || null, item.color_name || null, item.created_at)
    .run();
  
  revalidatePath('/');
}

// COLOR PANELS
export async function getPanels() {
  if (process.env.NODE_ENV === 'development') return localDb.getPanels();

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM color_panels ORDER BY created_at DESC').all();
  return results as unknown as ColorPanel[];
}

export async function addPanel(panel: ColorPanel) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addPanel(panel);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('INSERT INTO color_panels (panel_id, item_code, rack_location, last_updated_date, validity_period_months, expiration_date, status, photo_url, qa_inspector_name, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(panel.panel_id, panel.item_code, panel.rack_location, panel.last_updated_date, panel.validity_period_months, panel.expiration_date, panel.status, panel.photo_url || null, panel.qa_inspector_name, panel.notes || null, panel.created_at)
    .run();

  // Log creation
  const logId = crypto.randomUUID();
  await db.prepare('INSERT INTO audit_logs (log_id, panel_id, action_type, new_expiration_date, actor_name, timestamp, item_code) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(logId, panel.panel_id, 'NEW_PANEL', panel.expiration_date, panel.qa_inspector_name, new Date().toISOString(), panel.item_code)
    .run();
  
  revalidatePath('/');
}

export async function renewPanel(panelId: string, actorName: string, notes?: string, photoUrl?: string) {
  if (process.env.NODE_ENV === 'development') {
    localDb.renewPanel(panelId, actorName, notes, photoUrl);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM color_panels WHERE panel_id = ?').bind(panelId).all();
  if (results.length === 0) throw new Error('Panel not found');
  const panel = results[0] as unknown as ColorPanel;

  const today = new Date().toISOString().split('T')[0];
  const newExpirationDate = calculateExpirationDate(today, panel.validity_period_months);
  const newStatus = calculatePanelStatus(newExpirationDate, false);

  await db.prepare('UPDATE color_panels SET last_updated_date = ?, expiration_date = ?, status = ?, notes = ?, photo_url = ? WHERE panel_id = ?')
    .bind(today, newExpirationDate, newStatus, notes || panel.notes || null, photoUrl || panel.photo_url || null, panelId)
    .run();

  const logId = crypto.randomUUID();
  await db.prepare('INSERT INTO audit_logs (log_id, panel_id, action_type, previous_expiration_date, new_expiration_date, actor_name, notes, timestamp, item_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(logId, panelId, 'RENEWAL', panel.expiration_date, newExpirationDate, actorName, notes || null, new Date().toISOString(), panel.item_code)
    .run();

  revalidatePath('/');
}

export async function markPanelMissing(panelId: string, actorName: string, notes?: string) {
  if (process.env.NODE_ENV === 'development') {
    localDb.markPanelMissing(panelId, actorName, notes);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM color_panels WHERE panel_id = ?').bind(panelId).all();
  if (results.length === 0) throw new Error('Panel not found');
  const panel = results[0] as unknown as ColorPanel;

  await db.prepare('UPDATE color_panels SET status = ?, notes = ? WHERE panel_id = ?')
    .bind('MISSING', notes || panel.notes || null, panelId)
    .run();

  const logId = crypto.randomUUID();
  await db.prepare('INSERT INTO audit_logs (log_id, panel_id, action_type, actor_name, notes, timestamp, item_code) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(logId, panelId, 'MARKED_MISSING', actorName, notes || null, new Date().toISOString(), panel.item_code)
    .run();

  revalidatePath('/');
}

export async function deletePanel(panelId: string) {
  if (process.env.NODE_ENV === 'development') {
    localDb.deletePanel(panelId);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('DELETE FROM color_panels WHERE panel_id = ?').bind(panelId).run();
  
  revalidatePath('/');
}

export async function updatePanelInfo(panelId: string, updates: Partial<ColorPanel>) {
  if (process.env.NODE_ENV === 'development') {
    localDb.updatePanelInfo(panelId, updates);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const setStatements = [];
  const bindings = [];
  for (const [key, value] of Object.entries(updates)) {
    setStatements.push(`${key} = ?`);
    bindings.push(value);
  }
  bindings.push(panelId);
  
  await db.prepare(`UPDATE color_panels SET ${setStatements.join(', ')} WHERE panel_id = ?`)
    .bind(...bindings)
    .run();
}

// AUDIT LOGS
export async function getLogs() {
  if (process.env.NODE_ENV === 'development') return localDb.getLogs();

  const db = await getDB();
  const { results } = await db.prepare(`
    SELECT l.*, i.main_wood 
    FROM audit_logs l 
    LEFT JOIN items i ON l.item_code = i.item_code 
    ORDER BY l.timestamp DESC
  `).all();
  return results as unknown as PanelUpdateLog[];
}

// WHITE WOOD ITEMS
export async function getWhiteWoodItems() {
  if (process.env.NODE_ENV === 'development') return localDb.getWhiteWoodItems();

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM whitewood_items ORDER BY created_at DESC').all();
  return results as unknown as WhiteWoodItem[];
}

export async function addWhiteWoodItem(item: WhiteWoodItem) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addWhiteWoodItem(item);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('INSERT INTO whitewood_items (item_code, item_name, owner, current_location, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(item.item_code, item.item_name || null, item.owner, item.current_location, item.status, item.created_at)
    .run();
    
  revalidatePath('/');
}

export async function importWhiteWoodItems(items: WhiteWoodItem[]) {
  if (process.env.NODE_ENV === 'development') {
    localDb.importWhiteWoodItems(items);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const stmts = items.map(item => 
    db.prepare('INSERT INTO whitewood_items (item_code, item_name, owner, current_location, status, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(item_code) DO UPDATE SET item_name=excluded.item_name, owner=excluded.owner, current_location=excluded.current_location, status=excluded.status')
      .bind(item.item_code, item.item_name || null, item.owner, item.current_location, item.status, item.created_at)
  );
  await db.batch(stmts);
  
  revalidatePath('/');
}

export async function updateWhiteWoodItem(itemCode: string, updates: Partial<WhiteWoodItem>) {
  if (process.env.NODE_ENV === 'development') {
    localDb.updateWhiteWoodItem(itemCode, updates);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const setStatements = [];
  const bindings = [];
  for (const [key, value] of Object.entries(updates)) {
    setStatements.push(`${key} = ?`);
    bindings.push(value);
  }
  bindings.push(itemCode);
  
  await db.prepare(`UPDATE whitewood_items SET ${setStatements.join(', ')} WHERE item_code = ?`)
    .bind(...bindings)
    .run();
}

// WHITE WOOD TRANSACTIONS
export async function getWhiteWoodTransactions() {
  if (process.env.NODE_ENV === 'development') return localDb.getWhiteWoodTransactions();

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM whitewood_transactions ORDER BY timestamp DESC').all();
  return results as unknown as WhiteWoodTransaction[];
}

export async function addWhiteWoodTransaction(tx: WhiteWoodTransaction) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addWhiteWoodTransaction(tx);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('INSERT INTO whitewood_transactions (transaction_id, item_code, borrower, status, submission_date, borrow_date, due_date, return_date, outgoing_document, return_document, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(tx.transaction_id, tx.item_code, tx.borrower, tx.status, tx.submission_date || null, tx.borrow_date || null, tx.due_date || null, tx.return_date || null, tx.outgoing_document || null, tx.return_document || null, tx.timestamp)
    .run();
    
  revalidatePath('/');
}

export async function updateWhiteWoodTransaction(txId: string, updates: Partial<WhiteWoodTransaction>) {
  if (process.env.NODE_ENV === 'development') {
    localDb.updateWhiteWoodTransaction(txId, updates);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const setStatements = [];
  const bindings = [];
  for (const [key, value] of Object.entries(updates)) {
    setStatements.push(`${key} = ?`);
    bindings.push(value);
  }
  bindings.push(txId);
  
  await db.prepare(`UPDATE whitewood_transactions SET ${setStatements.join(', ')} WHERE transaction_id = ?`)
    .bind(...bindings)
    .run();
}

// LEAD CONTENT TESTS
export async function getLeadTests() {
  if (process.env.NODE_ENV === 'development') return localDb.getLeadTests();

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM lead_content_tests ORDER BY created_at DESC').all();
  return results as unknown as LeadContentTest[];
}

export async function addLeadTest(test: LeadContentTest) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addLeadTest(test);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('INSERT INTO lead_content_tests (test_id, item_code, provider, sent_date, test_date, expiration_date, status, document_url, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(test.test_id, test.item_code, test.provider, test.sent_date || null, test.test_date || null, test.expiration_date || null, test.status, test.document_url || null, test.notes || null, test.created_at)
    .run();
    
  revalidatePath('/');
}

export async function finalizeLeadTest(testId: string, testDate: string, documentUrl?: string) {
  if (process.env.NODE_ENV === 'development') {
    localDb.finalizeLeadTest(testId, testDate, documentUrl);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const expDate = new Date(testDate);
  expDate.setFullYear(expDate.getFullYear() + 1);
  const expirationDate = expDate.toISOString().split('T')[0];
  const newStatus = calculatePanelStatus(expirationDate, false);

  await db.prepare('UPDATE lead_content_tests SET test_date = ?, expiration_date = ?, status = ?, document_url = ? WHERE test_id = ?')
    .bind(testDate, expirationDate, newStatus, documentUrl || null, testId)
    .run();
    
  revalidatePath('/');
}

export async function deleteLeadTest(testId: string) {
  if (process.env.NODE_ENV === 'development') {
    localDb.deleteLeadTest(testId);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('DELETE FROM lead_content_tests WHERE test_id = ?').bind(testId).run();
  
  revalidatePath('/');
}

// PANEL CREATION PROCESSES
export async function getPanelProcesses() {
  if (process.env.NODE_ENV === 'development') return localDb.getPanelProcesses();

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM panel_processes ORDER BY start_date DESC').all();
  
  return results.map((row: any) => ({
    ...row,
    checks: JSON.parse(row.checks_json || '[]')
  })) as unknown as PanelCreationProcess[];
}

export async function addPanelProcess(panelProcess: PanelCreationProcess) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addPanelProcess(panelProcess);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('INSERT INTO panel_processes (process_id, item_code, start_date, handled_by, checks_json, status) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(panelProcess.process_id, panelProcess.item_code, panelProcess.start_date, panelProcess.handled_by, JSON.stringify(panelProcess.checks || []), panelProcess.status)
    .run();
    
  revalidatePath('/');
}

export async function addProcessCheck(processId: string, check: PanelCreationCheck) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addProcessCheck(processId, check);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const { results } = await db.prepare('SELECT checks_json FROM panel_processes WHERE process_id = ?').bind(processId).all();
  if (results.length === 0) throw new Error('Process not found');
  
  const checks = JSON.parse((results[0] as any).checks_json || '[]');
  checks.push(check);
  
  await db.prepare('UPDATE panel_processes SET checks_json = ? WHERE process_id = ?')
    .bind(JSON.stringify(checks), processId)
    .run();
    
  revalidatePath('/');
}

export async function finalizePanelProcess(processId: string, approvalDate: string, photoUrl?: string, status?: 'APPROVED' | 'REJECTED', leadTimeDays?: number) {
  if (process.env.NODE_ENV === 'development') {
    localDb.finalizePanelProcess(processId, approvalDate, photoUrl, status, leadTimeDays);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('UPDATE panel_processes SET status = ?, approval_date = ?, result_photo_url = ?, lead_time_days = ? WHERE process_id = ?')
    .bind(status || 'APPROVED', approvalDate, photoUrl || null, leadTimeDays !== undefined ? leadTimeDays : null, processId)
    .run();
    
  revalidatePath('/');
}

export async function deletePanelProcess(processId: string) {
  if (process.env.NODE_ENV === 'development') {
    localDb.deletePanelProcess(processId);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare('DELETE FROM panel_processes WHERE process_id = ?').bind(processId).run();
  
  revalidatePath('/');
}

// PPS (PRE PRODUCTION SAMPLE)
export async function getPPSRecords(): Promise<PreProductionSample[]> {
  if (process.env.NODE_ENV === 'development') return localDb.getPPSRecords();

  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM pre_production_samples ORDER BY created_at DESC').all();
  
  return results.map((row: any) => ({
    pps_id: row.pps_id,
    project_name: row.project_name,
    item_code: row.item_code,
    handled_by: row.handled_by,
    status: row.status,
    start_date: row.start_date,
    approval_date: row.approval_date || undefined,
    result_photo_url: row.result_photo_url || undefined,
    qir_data: row.qir_data ? JSON.parse(row.qir_data) : undefined,
    submissions: JSON.parse(row.submissions_json || '[]'),
    created_at: row.created_at
  }));
}

export async function addPPSRecord(pps: PreProductionSample) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addPPSRecord(pps);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  await db.prepare(`
    INSERT INTO pre_production_samples (pps_id, project_name, item_code, handled_by, status, start_date, approval_date, result_photo_url, qir_data, submissions_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    pps.pps_id, pps.project_name, pps.item_code, pps.handled_by, pps.status, pps.start_date, 
    pps.approval_date || null, pps.result_photo_url || null, 
    pps.qir_data ? JSON.stringify(pps.qir_data) : null,
    JSON.stringify(pps.submissions || []),
    pps.created_at
  ).run();
  
  revalidatePath('/');
}

export async function updatePPSRecord(ppsId: string, updates: Partial<PreProductionSample>) {
  if (process.env.NODE_ENV === 'development') {
    localDb.updatePPSRecord(ppsId, updates);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  // Fetch existing
  const existingRow = await db.prepare('SELECT * FROM pre_production_samples WHERE pps_id = ?').bind(ppsId).first();
  if (!existingRow) return;
  
  const currentQirData = existingRow.qir_data ? JSON.parse(existingRow.qir_data as string) : undefined;
  const currentSubmissions = JSON.parse((existingRow.submissions_json as string) || '[]');
  
  const newQirData = updates.qir_data !== undefined ? updates.qir_data : currentQirData;
  const newSubmissions = updates.submissions !== undefined ? updates.submissions : currentSubmissions;

  const sets = [];
  const binds = [];
  if (updates.project_name) { sets.push('project_name = ?'); binds.push(updates.project_name); }
  if (updates.status) { sets.push('status = ?'); binds.push(updates.status); }
  if (updates.approval_date) { sets.push('approval_date = ?'); binds.push(updates.approval_date); }
  if (updates.result_photo_url !== undefined) { sets.push('result_photo_url = ?'); binds.push(updates.result_photo_url); }
  
  sets.push('qir_data = ?'); binds.push(newQirData ? JSON.stringify(newQirData) : null);
  sets.push('submissions_json = ?'); binds.push(JSON.stringify(newSubmissions));
  
  binds.push(ppsId);

  await db.prepare(`UPDATE pre_production_samples SET ${sets.join(', ')} WHERE pps_id = ?`).bind(...binds).run();
  
  revalidatePath('/');
}

export async function addPPSSubmission(ppsId: string, submission: PPSSubmission) {
  if (process.env.NODE_ENV === 'development') {
    localDb.addPPSSubmission(ppsId, submission);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const existingRow = await db.prepare('SELECT submissions_json FROM pre_production_samples WHERE pps_id = ?').bind(ppsId).first();
  let submissions: any[] = [];
  if (existingRow && existingRow.submissions_json) {
    submissions = JSON.parse(existingRow.submissions_json as string);
  }
  
  submissions.push(submission);
  await db.prepare('UPDATE pre_production_samples SET submissions_json = ? WHERE pps_id = ?').bind(JSON.stringify(submissions), ppsId).run();
  
  revalidatePath('/');
}

export async function updatePPSSubmissionQIR(ppsId: string, submissionIndex: number, qirData: any) {
  if (process.env.NODE_ENV === 'development') {
    localDb.updatePPSSubmissionQIR(ppsId, submissionIndex, qirData);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const existingRow = await db.prepare('SELECT submissions_json FROM pre_production_samples WHERE pps_id = ?').bind(ppsId).first();
  if (existingRow && existingRow.submissions_json) {
    let submissions: any[] = JSON.parse(existingRow.submissions_json as string);
    if (submissions[submissionIndex]) {
      submissions[submissionIndex].qir_data = qirData;
      await db.prepare('UPDATE pre_production_samples SET submissions_json = ? WHERE pps_id = ?').bind(JSON.stringify(submissions), ppsId).run();
    }
  }
  revalidatePath('/');
}

export async function updatePPSSubmission(ppsId: string, submissionIndex: number, submission: PPSSubmission) {
  if (process.env.NODE_ENV === 'development') {
    localDb.updatePPSSubmission(ppsId, submissionIndex, submission);
    revalidatePath('/');
    return;
  }

  const db = await getDB();
  const existingRow = await db.prepare('SELECT submissions_json FROM pre_production_samples WHERE pps_id = ?').bind(ppsId).first();
  if (existingRow && existingRow.submissions_json) {
    let submissions: any[] = JSON.parse(existingRow.submissions_json as string);
    if (submissions[submissionIndex]) {
      submissions[submissionIndex] = submission;
      await db.prepare('UPDATE pre_production_samples SET submissions_json = ? WHERE pps_id = ?').bind(JSON.stringify(submissions), ppsId).run();
    }
  }
  revalidatePath('/');
}

