// // These match the database enums
// export type CaseStatus = "pending" | "active" | "hearing" | "verdict_pending" | "closed" | "appealed";
// export type EvidenceCategory = "document" | "video" | "audio" | "image" | "other";
// export type RoleCategory = "judiciary" | "legal_practitioner" | "public_party";

// // Legacy types for UI compatibility
// export type EvidenceStatus = "draft" | "pending" | "signed" | "immutable";
// export type EvidenceType = "forensic" | "cctv" | "witness" | "document" | "audio" | "other";

// export interface CaseFile {
//   id: string;
//   caseNumber: string;
//   title: string;
//   description: string;
//   courtName: string;
//   presidingJudge: string;
//   status: CaseStatus;
//   createdAt: string;
//   updatedAt: string;
//   evidenceCount: number;
// }

// export interface Evidence {
//   id: string;
//   caseId: string;
//   fileName: string;
//   fileType: string;
//   fileSize: number;
//   fileUrl?: string;
//   thumbnailUrl?: string;
//   type: EvidenceType;
//   status: EvidenceStatus;
//   uploadedBy: string;
//   uploadedAt: string;
//   hash?: string;
//   signedBy?: string;
//   signedAt?: string;
//   signature?: string;
//   hearingSessionId?: string;
// }

// export interface CustodyEvent {
//   id: string;
//   caseId: string;
//   action: string;
//   actor: string;
//   timestamp: string;
//   details: string;
//   txHash?: string;
// }

// export interface AuthorizedPerson {
//   id: string;
//   name: string;
//   role: string;
//   department: string;
//   govId: string;
//   addedAt: string;
// }


// src/types/case.ts

export type CaseStatus = "pending" | "active" | "hearing" | "verdict_pending" | "closed" | "appealed";
export type EvidenceCategory = "document" | "video" | "audio" | "image" | "other";
export type RoleCategory = "judiciary" | "legal_practitioner" | "public_party";
export type EvidenceStatus = "draft" | "pending" | "signed" | "immutable";
export type EvidenceType = "forensic" | "cctv" | "witness" | "document" | "audio" | "other";

// --- NEW INTERFACES ---

export interface Profile {
  id: string;
  full_name: string;
  role: 'judge' | 'lawyer' | 'clerk' | 'client' | string;
  email?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CaseFile {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  
  // Database IDs
  judge_id?: string;
  lawyer_a_id?: string;
  lawyer_b_id?: string;
  created_by?: string;

  // Joined Profiles (For displaying names)
  judge?: Profile;
  lawyer_a?: Profile;
  lawyer_b?: Profile;

  // Legacy fields
  case_number?: string;
  caseNumber?: string;
  case_type?: string;
  courtName?: string;
  presidingJudge?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  evidenceCount?: number;
}

// List Item Interface
export interface CauseListItem {
  id: string;
  srNo: number;
  caseNumber: string;
  parties: string;
  caseType: string;
  stage: string;
  status: "scheduled" | "in-progress" | "completed" | "adjourned";
  time?: string;
  isUrgent: boolean;
}

export interface JudgmentItem {
  id: string;
  
  caseNumber: string;
  parties: string;
  hearingDate: string;
  draftProgress: number;
  dueDate: string;
  isOverdue?: boolean;
}

// --- Police / FIR Types ---
export type FIRStatus = 'Registered' | 'Under Investigation' | 'Chargesheet Filed' | 'Closed';

export interface FIR {
  id: string;
  fir_number: string;
  police_station: string;
  informant_name: string;
  informant_contact: string;
  incident_date: string; // ISO timestamp
  incident_place: string;
  offense_nature: string;
  bns_section: string;
  accused_name?: string | null;
  victim_name: string;
  description?: string;
  status: FIRStatus;
  created_at?: string;
  officer_id?: string; // auth.users id
}

export type InvestigationFileType = 'Supplementary Chargesheet' | 'Forensic Report' | 'Witness Statement';

export interface InvestigationFile {
  id: string;
  fir_id: string;
  file_url: string;
  file_type: InvestigationFileType;
  notes?: string;
  uploaded_at?: string;
}