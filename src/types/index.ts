export type PanelStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';
export type ReadinessStatus = 'GREEN' | 'YELLOW' | 'RED';
export type ActionType = 'NEW_PANEL' | 'RENEWAL' | 'PHYSICAL_CHECK' | 'MARKED_MISSING';

export interface Item {
  item_code: string;
  item_name: string;
  main_wood?: string;
  handled_by?: string;
  category?: string;
  color_code?: string;
  color_name?: string;
  created_at: string;
}

export interface ColorPanel {
  panel_id: string;
  item_code: string;
  rack_location: string;
  last_updated_date: string; // YYYY-MM-DD
  validity_period_months: number;
  expiration_date: string; // YYYY-MM-DD
  status: PanelStatus;
  photo_url?: string;
  qa_inspector_name: string;
  notes?: string;
  created_at: string;
}

export interface PanelUpdateLog {
  log_id: string;
  panel_id: string;
  action_type: ActionType;
  previous_expiration_date?: string;
  new_expiration_date?: string;
  actor_name: string;
  notes?: string;
  timestamp: string;
  item_code?: string;
  main_wood?: string;
}

export interface PanelCreationCheck {
  check_number: number;
  date: string;
  notes: string;
  status: 'PENDING' | 'REVISED' | 'PASSED';
}

export interface PanelCreationProcess {
  process_id: string;
  item_code: string;
  start_date: string;
  handled_by: string;
  checks: PanelCreationCheck[];
  result_photo_url?: string;
  approval_date?: string;
  lead_time_days?: number;
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
}

export type TestProvider = 'BV' | 'INTERTEK';

export interface LeadContentTest {
  test_id: string;
  item_code: string;
  provider: TestProvider;
  test_date: string; // YYYY-MM-DD
  expiration_date: string; // YYYY-MM-DD
  status: PanelStatus;
  document_url?: string;
  notes?: string;
  created_at: string;
}
