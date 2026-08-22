'use server'

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { Item, ColorPanel, PanelUpdateLog, PanelStatus, ActionType, LeadContentTest } from '@/types';
import { WhiteWoodItem, WhiteWoodTransaction } from '@/types/whitewood';
import { calculateExpirationDate, calculatePanelStatus } from '@/lib/status-logic';


export async function getDB() {
  const { env } = getCloudflareContext();
  if (!env || !env.DB) {
    throw new Error('D1 Database binding not found');
  }
  return env.DB;
}

// ITEMS
export async function getItems() {
  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM items ORDER BY created_at DESC').all();
  return results as unknown as Item[];
}

export async function addItem(item: Item) {
  const db = await getDB();
  await db.prepare('INSERT INTO items (item_code, item_name, main_wood, handled_by, category, color_code, color_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(item.item_code, item.item_name, item.main_wood || null, item.handled_by || null, item.category || null, item.color_code || null, item.color_name || null, item.created_at)
    .run();
}

// COLOR PANELS
export async function getPanels() {
  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM color_panels ORDER BY created_at DESC').all();
  return results as unknown as ColorPanel[];
}

export async function addPanel(panel: ColorPanel) {
  const db = await getDB();
  await db.prepare('INSERT INTO color_panels (panel_id, item_code, rack_location, last_updated_date, validity_period_months, expiration_date, status, photo_url, qa_inspector_name, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(panel.panel_id, panel.item_code, panel.rack_location, panel.last_updated_date, panel.validity_period_months, panel.expiration_date, panel.status, panel.photo_url || null, panel.qa_inspector_name, panel.notes || null, panel.created_at)
    .run();

  // Log creation
  const logId = crypto.randomUUID();
  await db.prepare('INSERT INTO audit_logs (log_id, panel_id, action_type, new_expiration_date, actor_name, timestamp, item_code) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(logId, panel.panel_id, 'NEW_PANEL', panel.expiration_date, panel.qa_inspector_name, new Date().toISOString(), panel.item_code)
    .run();
}

export async function renewPanel(panelId: string, actorName: string, notes?: string) {
  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM color_panels WHERE panel_id = ?').bind(panelId).all();
  if (results.length === 0) throw new Error('Panel not found');
  const panel = results[0] as unknown as ColorPanel;

  const today = new Date().toISOString().split('T')[0];
  const newExpirationDate = calculateExpirationDate(today, panel.validity_period_months);
  const newStatus = calculatePanelStatus(newExpirationDate, false);

  await db.prepare('UPDATE color_panels SET last_updated_date = ?, expiration_date = ?, status = ?, notes = ? WHERE panel_id = ?')
    .bind(today, newExpirationDate, newStatus, notes || panel.notes || null, panelId)
    .run();

  const logId = crypto.randomUUID();
  await db.prepare('INSERT INTO audit_logs (log_id, panel_id, action_type, previous_expiration_date, new_expiration_date, actor_name, notes, timestamp, item_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(logId, panelId, 'RENEWAL', panel.expiration_date, newExpirationDate, actorName, notes || null, new Date().toISOString(), panel.item_code)
    .run();
}

export async function markPanelMissing(panelId: string, actorName: string, notes?: string) {
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
}

export async function deletePanel(panelId: string) {
  const db = await getDB();
  await db.prepare('DELETE FROM color_panels WHERE panel_id = ?').bind(panelId).run();
}

export async function updatePanelInfo(panelId: string, updates: Partial<ColorPanel>) {
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
  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM whitewood_items ORDER BY created_at DESC').all();
  return results as unknown as WhiteWoodItem[];
}

export async function addWhiteWoodItem(item: WhiteWoodItem) {
  const db = await getDB();
  await db.prepare('INSERT INTO whitewood_items (item_code, item_name, owner, current_location, status, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(item.item_code, item.item_name || null, item.owner, item.current_location, item.status, item.created_at)
    .run();
}

export async function updateWhiteWoodItem(itemCode: string, updates: Partial<WhiteWoodItem>) {
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
  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM whitewood_transactions ORDER BY timestamp DESC').all();
  return results as unknown as WhiteWoodTransaction[];
}

export async function addWhiteWoodTransaction(tx: WhiteWoodTransaction) {
  const db = await getDB();
  await db.prepare('INSERT INTO whitewood_transactions (transaction_id, item_code, borrower, status, submission_date, borrow_date, due_date, return_date, outgoing_document, return_document, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(tx.transaction_id, tx.item_code, tx.borrower, tx.status, tx.submission_date || null, tx.borrow_date || null, tx.due_date || null, tx.return_date || null, tx.outgoing_document || null, tx.return_document || null, tx.timestamp)
    .run();
}

export async function updateWhiteWoodTransaction(txId: string, updates: Partial<WhiteWoodTransaction>) {
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
  const db = await getDB();
  const { results } = await db.prepare('SELECT * FROM lead_content_tests ORDER BY created_at DESC').all();
  return results as unknown as LeadContentTest[];
}

export async function addLeadTest(test: LeadContentTest) {
  const db = await getDB();
  await db.prepare('INSERT INTO lead_content_tests (test_id, item_code, provider, sent_date, test_date, expiration_date, status, document_url, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(test.test_id, test.item_code, test.provider, test.sent_date || null, test.test_date || null, test.expiration_date || null, test.status, test.document_url || null, test.notes || null, test.created_at)
    .run();
}

export async function finalizeLeadTest(testId: string, testDate: string, documentUrl?: string) {
  const db = await getDB();
  const expDate = new Date(testDate);
  expDate.setFullYear(expDate.getFullYear() + 1);
  const expirationDate = expDate.toISOString().split('T')[0];
  const newStatus = calculatePanelStatus(expirationDate, false);

  await db.prepare('UPDATE lead_content_tests SET test_date = ?, expiration_date = ?, status = ?, document_url = ? WHERE test_id = ?')
    .bind(testDate, expirationDate, newStatus, documentUrl || null, testId)
    .run();
}

export async function deleteLeadTest(testId: string) {
  const db = await getDB();
  await db.prepare('DELETE FROM lead_content_tests WHERE test_id = ?').bind(testId).run();
}
