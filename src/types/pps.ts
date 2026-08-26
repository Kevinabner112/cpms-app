export type PPSStatus = 'PENDING' | 'REVISING' | 'APPROVED' | 'CLOSED';

export interface PreProductionSample {
  pps_id: string;              
  project_name: string;        
  item_code: string;           
  handled_by: string;          
  status: PPSStatus;           
  start_date: string;          
  approval_date?: string;      
  result_photo_url?: string;   
  
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
