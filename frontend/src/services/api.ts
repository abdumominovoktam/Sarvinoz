const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem('sarvinoz_access_token');
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem('sarvinoz_access_token', access);
  if (refresh) {
    localStorage.setItem('sarvinoz_refresh_token', refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem('sarvinoz_access_token');
  localStorage.removeItem('sarvinoz_refresh_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!navigator.onLine) {
    throw new ApiError(
      'Internet aloqasi uzildi. Ulanish tiklangach davom etishingiz mumkin.',
      0
    );
  }

  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Server bilan aloqa qilishda muammo yuz berdi.',
      503
    );
  }

  if (response.status === 401) {
    clearTokens();
    window.dispatchEvent(new CustomEvent('sarvinoz:unauthorized'));
    throw new ApiError('Seansingiz tugagan. Qayta login qiling.', 401);
  }

  let data: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    let errMsg = data?.detail || data?.message || 'Xatolik yuz berdi.';
    if (typeof data === 'object' && !data?.detail && !data?.message) {
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        errMsg = Array.isArray(val) ? val[0] : String(val);
      }
    }
    throw new ApiError(errMsg, response.status, data);
  }

  return data as T;
}

export async function downloadExportFile(format: 'csv' | 'excel') {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}/admin-panel/export/?export_format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new Error('Eksport qilishda xatolik yuz berdi.');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = format === 'excel' ? 'sanoq_sistemalari_reyting.xlsx' : 'sanoq_sistemalari_reyting.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
