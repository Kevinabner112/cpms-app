export type PPSStatus = 'PENDING' | 'REVISING' | 'APPROVED' | 'CLOSED';

export interface QIRChecklist {
  mahogany_wood: { confirm: 'YES' | 'NO' | ''; remarks: string; description: string; critical: boolean; major: boolean; minor: boolean; };
  dacron: { confirm: 'YES' | 'NO' | ''; remarks: string; description: string; critical: boolean; major: boolean; minor: boolean; };
  busa: { confirm: 'YES' | 'NO' | ''; remarks: string; description: string; critical: boolean; major: boolean; minor: boolean; };
  fabric: { confirm: 'YES' | 'NO' | ''; remarks: string; description: string; critical: boolean; major: boolean; minor: boolean; };
  sleeper: { confirm: 'YES' | 'NO' | ''; remarks: string; description: string; critical: boolean; major: boolean; minor: boolean; };
  metal_strecher: { confirm: 'YES' | 'NO' | ''; remarks: string; description: string; critical: boolean; major: boolean; minor: boolean; };
  glider: { confirm: 'YES' | 'NO' | ''; remarks: string; description: string; critical: boolean; major: boolean; minor: boolean; };
  product_knowledge_remarks: string;
}

export interface QIRData {
  product_name: string;
  item_number_custom: string;
  item_size: string;
  color: string;
  material: string;
  qty: string;
  client_name: string;
  supplier_name: string;
  inspection_date: string;
  starting_at: string;
  finish_at: string;
  inspection_location: string;
  inspector: string;
  made_in: string;
  
  checklist: QIRChecklist;
}

export interface PreProductionSample {
  pps_id: string;              
  project_name: string;        
  item_code: string;           
  handled_by: string;          
  status: PPSStatus;           
  start_date: string;          
  approval_date?: string;      
  result_photo_url?: string;   
  
  qir_data?: QIRData;

  submissions: PPSSubmission[]; 
  
  created_at: string;
}

export interface PPSDefect {
  defect_id: string;
  description: string;
  photo_far?: string;
  photo_close?: string;
}

export interface PPSSubmission {
  submission_number: number;   
  submission_date: string;     
  reviewer_name?: string;      
  review_date?: string;        
  status: 'PENDING_REVIEW' | 'REVISED' | 'PASSED';
  overview: string;
  photo_front: string;
  photo_top: string;
  photo_bottom: string;
  photo_side: string;
  defects: PPSDefect[];
}
