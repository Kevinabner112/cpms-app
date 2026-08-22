DROP TABLE IF EXISTS lead_content_tests;
DROP TABLE IF EXISTS panel_processes;
DROP TABLE IF EXISTS whitewood_transactions;
DROP TABLE IF EXISTS whitewood_items;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS color_panels;
DROP TABLE IF EXISTS items;

CREATE TABLE items (
  item_code TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  main_wood TEXT,
  handled_by TEXT,
  category TEXT,
  color_code TEXT,
  color_name TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE color_panels (
  panel_id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL,
  rack_location TEXT,
  last_updated_date TEXT NOT NULL,
  validity_period_months INTEGER NOT NULL,
  expiration_date TEXT NOT NULL,
  status TEXT NOT NULL,
  photo_url TEXT,
  qa_inspector_name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_code) REFERENCES items(item_code) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
  log_id TEXT PRIMARY KEY,
  panel_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  previous_expiration_date TEXT,
  new_expiration_date TEXT,
  actor_name TEXT NOT NULL,
  notes TEXT,
  timestamp TEXT NOT NULL,
  item_code TEXT,
  main_wood TEXT
);

CREATE TABLE whitewood_items (
  item_code TEXT PRIMARY KEY,
  item_name TEXT,
  owner TEXT NOT NULL,
  current_location TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE whitewood_transactions (
  transaction_id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL,
  borrower TEXT NOT NULL,
  status TEXT NOT NULL,
  submission_date TEXT,
  borrow_date TEXT,
  due_date TEXT,
  return_date TEXT,
  outgoing_document TEXT,
  return_document TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (item_code) REFERENCES whitewood_items(item_code) ON DELETE CASCADE
);

CREATE TABLE panel_processes (
  process_id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL,
  start_date TEXT NOT NULL,
  handled_by TEXT NOT NULL,
  checks_json TEXT NOT NULL,
  result_photo_url TEXT,
  approval_date TEXT,
  lead_time_days INTEGER,
  status TEXT NOT NULL,
  FOREIGN KEY (item_code) REFERENCES items(item_code) ON DELETE CASCADE
);

CREATE TABLE lead_content_tests (
  test_id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL,
  provider TEXT NOT NULL,
  test_date TEXT NOT NULL,
  expiration_date TEXT NOT NULL,
  status TEXT NOT NULL,
  document_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_code) REFERENCES items(item_code) ON DELETE CASCADE
);
