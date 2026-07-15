import { PrintJob, SupportCall, SupportCategory } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'https://arox-api-993539509814.asia-south1.run.app';
const KIOSK_ID = import.meta.env.VITE_KIOSK_ID || '1';

export interface ConsumablesStatus {
  paper_capacity: number | null;
  paper_remaining: number | null;
  toner_capacity: number | null;
  toner_remaining: number | null;
  last_paper_refill?: string | null;
  last_toner_refill?: string | null;
  updated_at?: string | null;
}

async function fetchJson(url: string, options: RequestInit = {}) {
  const fetchOptions = {
    ...options,
    cache: 'no-store' as RequestCache,
  };
  const res = await fetch(url, fetchOptions);
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Invalid response type: ${contentType}. Is the backend running?`);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const getConsumables = async (): Promise<ConsumablesStatus> => {
  return fetchJson(`${API_BASE}/api/kiosks/${KIOSK_ID}/consumables`);
};

export const triggerKioskAlert = async (
  alertType: 'paper_low' | 'toner_low',
  message: string,
  extra?: Record<string, unknown>,
) => {
  return fetchJson(`${API_BASE}/api/kiosks/${KIOSK_ID}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      alert_type: alertType,
      source: 'kiosk',
      severity: 'critical',
      message,
      recipient_roles: ['admin', 'service'],
      extra,
    }),
  });
};

export const validateCode = async (code: string): Promise<PrintJob | null> => {
  try {
    const data = await fetchJson(`${API_BASE}/api/job/${code}?kiosk_id=${KIOSK_ID}`);
    if (!data.success) return null;

    return {
      id: data.upload_id.toString(),
      filename: `Job ${code}`,
      pages: data.pages,
      copies: data.copies,
      color: data.color,
      status: data.status,
      pickup_code: code,
      estimated_time_seconds: data.estimated_time_seconds,
      email: data.email,
    };
  } catch (err: any) {
    if (err.message?.includes('Invalid pickup code') && /^\d+$/.test(code)) {
      try {
        const arxCode = `ARX-${code}`;
        const data = await fetchJson(`${API_BASE}/api/job/${arxCode}?kiosk_id=${KIOSK_ID}`);
        if (!data.success) return null;

        return {
          id: data.upload_id.toString(),
          filename: `Job ${arxCode}`,
          pages: data.pages,
          copies: data.copies,
          color: data.color,
          status: data.status,
          pickup_code: arxCode,
          estimated_time_seconds: data.estimated_time_seconds,
          email: data.email,
        };
      } catch (fallbackErr) {
        // Ignore fallback error and throw original
      }
    }

    if (!err.message?.includes('Invalid pickup code')) {
      console.error('Validation error:', err);
    }
    throw err;
  }
};

export const requestOtp = async (code: string): Promise<boolean> => {
  try {
    const data = await fetchJson(`${API_BASE}/api/job/${code}/request_release_otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kiosk_id: KIOSK_ID }),
    });
    return data.success;
  } catch (err: any) {
    console.error('OTP request error:', err);
    throw err;
  }
};

export const verifyOtp = async (code: string, otp: string): Promise<boolean> => {
  try {
    const data = await fetchJson(`${API_BASE}/api/job/${code}/verify_release_otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kiosk_id: KIOSK_ID, otp }),
    });
    return data.success;
  } catch (err: any) {
    console.error('OTP verify error:', err);
    throw err;
  }
};

export const startPrintJob = async (code: string): Promise<{ success: boolean; status: string; estimated_time_seconds?: number }> => {
  try {
    const data = await fetchJson(`${API_BASE}/api/release_job`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickup_code: code, kiosk_id: KIOSK_ID }),
    });
    return {
      success: data.success,
      status: data.success ? 'printing' : 'failed',
      estimated_time_seconds: data.estimated_time_seconds,
    };
  } catch (err: any) {
    console.error('Start print error:', err);
    throw err;
  }
};

export const checkJobStatus = async (uploadId: string): Promise<string> => {
  try {
    const data = await fetchJson(`${API_BASE}/api/job_status/${uploadId}`);
    if (data.success) return data.status;
    return 'failed';
  } catch (err) {
    console.error('Status check error:', err);
    return 'failed';
  }
};

export const createSupportCall = async (category: SupportCategory, description: string) => {
  const data = await fetchJson(`${API_BASE}/api/support/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kiosk_id: Number(KIOSK_ID),
      category,
      description,
    }),
  });

  return data;
};
