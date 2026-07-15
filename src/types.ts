export type JobStatus = 'pending' | 'validating' | 'ready' | 'printing' | 'completed' | 'failed' | 'onKiosk';

export interface PrintJob {
  id: string;
  filename: string;
  pages: number;
  copies: number;
  color: boolean;
  cost?: number;
  status: JobStatus;
  pickup_code?: string;
  estimated_time_seconds?: number;
  email?: string;
}

export type CallStatus = 'idle' | 'checking_availability' | 'queued' | 'connecting' | 'connected' | 'ended' | 'error';
export type SupportCategory = 'paper_jam' | 'toner_out' | 'payment_issue' | 'other';

export interface SupportCall {
  id: string;
  kiosk_id: string;
  category: SupportCategory;
  description: string;
  status: CallStatus;
  started_at: string;
}

export interface AgentSupportCall extends SupportCall {
  kiosk_location?: string;
  duration_seconds?: number;
}
