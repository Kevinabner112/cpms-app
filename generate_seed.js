const fs = require('fs');
const db = JSON.parse(fs.readFileSync('local-mock-db.json', 'utf8'));

let sql = '';

// Helper to escape strings for SQL
function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// Helper for numbers
function num(n) {
  if (n === null || n === undefined) return 'NULL';
  return n;
}

// 1. Seed items
if (db.items) {
  for (const item of db.items) {
    sql += `INSERT OR REPLACE INTO items (item_code, item_name, main_wood, handled_by, category, color_code, color_name, created_at) VALUES (${esc(item.item_code)}, ${esc(item.item_name)}, ${esc(item.main_wood)}, ${esc(item.handled_by)}, ${esc(item.category)}, ${esc(item.color_code)}, ${esc(item.color_name)}, ${esc(item.created_at)});\n`;
  }
}

// 2. Seed pre_production_samples
if (db.pre_production_samples) {
  for (const pps of db.pre_production_samples) {
    sql += `INSERT OR REPLACE INTO pre_production_samples (pps_id, project_name, item_code, handled_by, status, start_date, approval_date, result_photo_url, qir_data, submissions_json, created_at) VALUES (${esc(pps.pps_id)}, ${esc(pps.project_name)}, ${esc(pps.item_code)}, ${esc(pps.handled_by)}, ${esc(pps.status)}, ${esc(pps.start_date)}, ${esc(pps.approval_date)}, ${esc(pps.result_photo_url)}, ${esc(JSON.stringify(pps.qir_data))}, ${esc(JSON.stringify(pps.submissions || []))}, ${esc(pps.created_at)});\n`;
  }
}

// 3. Seed color_panels
if (db.color_panels) {
  for (const p of db.color_panels) {
    sql += `INSERT OR REPLACE INTO color_panels (panel_id, item_code, rack_location, last_updated_date, validity_period_months, expiration_date, status, photo_url, qa_inspector_name, notes, created_at) VALUES (${esc(p.panel_id)}, ${esc(p.item_code)}, ${esc(p.rack_location)}, ${esc(p.last_updated_date)}, ${num(p.validity_period_months)}, ${esc(p.expiration_date)}, ${esc(p.status)}, ${esc(p.photo_url)}, ${esc(p.qa_inspector_name)}, ${esc(p.notes)}, ${esc(p.created_at)});\n`;
  }
}

// 4. Seed audit_logs
if (db.audit_logs) {
  for (const l of db.audit_logs) {
    sql += `INSERT OR REPLACE INTO audit_logs (log_id, panel_id, action_type, previous_expiration_date, new_expiration_date, actor_name, notes, timestamp, item_code, main_wood) VALUES (${esc(l.log_id)}, ${esc(l.panel_id)}, ${esc(l.action_type)}, ${esc(l.previous_expiration_date)}, ${esc(l.new_expiration_date)}, ${esc(l.actor_name)}, ${esc(l.notes)}, ${esc(l.timestamp)}, ${esc(l.item_code)}, ${esc(l.main_wood)});\n`;
  }
}

// 5. Seed whitewood_items
if (db.whitewood_items) {
  for (const w of db.whitewood_items) {
    sql += `INSERT OR REPLACE INTO whitewood_items (item_code, item_name, owner, current_location, status, created_at) VALUES (${esc(w.item_code)}, ${esc(w.item_name)}, ${esc(w.owner)}, ${esc(w.current_location)}, ${esc(w.status)}, ${esc(w.created_at)});\n`;
  }
}

// 6. Seed whitewood_transactions
if (db.whitewood_transactions) {
  for (const t of db.whitewood_transactions) {
    sql += `INSERT OR REPLACE INTO whitewood_transactions (transaction_id, item_code, borrower, status, submission_date, borrow_date, due_date, return_date, outgoing_document, return_document, timestamp) VALUES (${esc(t.transaction_id)}, ${esc(t.item_code)}, ${esc(t.borrower)}, ${esc(t.status)}, ${esc(t.submission_date)}, ${esc(t.borrow_date)}, ${esc(t.due_date)}, ${esc(t.return_date)}, ${esc(t.outgoing_document)}, ${esc(t.return_document)}, ${esc(t.timestamp)});\n`;
  }
}

// 7. Seed panel_processes
if (db.panel_processes) {
  for (const p of db.panel_processes) {
    sql += `INSERT OR REPLACE INTO panel_processes (process_id, item_code, start_date, handled_by, checks_json, result_photo_url, approval_date, lead_time_days, status) VALUES (${esc(p.process_id)}, ${esc(p.item_code)}, ${esc(p.start_date)}, ${esc(p.handled_by)}, ${esc(JSON.stringify(p.checks || []))}, ${esc(p.result_photo_url)}, ${esc(p.approval_date)}, ${num(p.lead_time_days)}, ${esc(p.status)});\n`;
  }
}

// 8. Seed lead_content_tests
if (db.lead_content_tests) {
  for (const l of db.lead_content_tests) {
    sql += `INSERT OR REPLACE INTO lead_content_tests (test_id, item_code, provider, sent_date, test_date, expiration_date, status, document_url, notes, created_at) VALUES (${esc(l.test_id)}, ${esc(l.item_code)}, ${esc(l.provider)}, ${esc(l.sent_date)}, ${esc(l.test_date)}, ${esc(l.expiration_date)}, ${esc(l.status)}, ${esc(l.document_url)}, ${esc(l.notes)}, ${esc(l.created_at)});\n`;
  }
}

fs.writeFileSync('seed_data.sql', sql);
console.log('Generated seed_data.sql with length: ' + sql.length);
