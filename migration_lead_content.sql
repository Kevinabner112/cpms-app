CREATE TABLE new_lead_content_tests (
  test_id TEXT PRIMARY KEY,
  item_code TEXT NOT NULL,
  provider TEXT NOT NULL,
  sent_date TEXT,
  test_date TEXT,
  expiration_date TEXT,
  status TEXT NOT NULL,
  document_url TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (item_code) REFERENCES items(item_code) ON DELETE CASCADE
);

INSERT INTO new_lead_content_tests 
SELECT test_id, item_code, provider, NULL as sent_date, test_date, expiration_date, status, document_url, notes, created_at 
FROM lead_content_tests;

DROP TABLE lead_content_tests;
ALTER TABLE new_lead_content_tests RENAME TO lead_content_tests;
