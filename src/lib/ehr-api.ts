// ============================================================================
// Vedi EHR — API Client (Refine-free)
// Extracted from providers/data-provider.ts
// All backend communication goes through these typed helpers.
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// ── Resource → API path mapping ──────────────────────────────────────────────

export const RESOURCE_API_MAP: Record<string, string> = {
  patients: '/patients',
  vitals: '/vitals',
  insurance_information: '/insurance',
  lifestyle_and_habits: '/lifestyle',
  medical_history: '/medical-history',
  encounters: '/encounters',
  prescriptions: '/prescriptions',
  medications: '/medications',
  lab_results: '/lab-results',
  surgery: '/surgery',
  recordings: '/recordings',
  transcripts: '/transcripts',
  conditions: '/conditions',
  clinical_impressions: '/clinical-impressions',
  tasks: '/tasks',
  appointments: '/appointments'
};

/** Resources that have a real backend endpoint */
export const hasBackend = (resource: string) => resource in RESOURCE_API_MAP;

/** Build full URL for a backend resource */
export const apiUrl = (resource: string, suffix = '') =>
  `${API_URL}/v1${RESOURCE_API_MAP[resource]}${suffix}`;

// ── Auth headers ─────────────────────────────────────────────────────────────

export const authHeaders = (): HeadersInit => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

// ── Envelope unwrap helpers ─────────────────────────────────────────────────

/**
 * Unwrap the backend `APIResponse` envelope → `{ success, data, message }`
 * Throws on non-2xx or success=false.
 */
export async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.message || 'API error');
  }
  return json.data as T;
}

/**
 * Unwrap a paginated response → items array + total count.
 * Backend returns `{ success, data: [...], meta: { total } }` + X-Total-Count header.
 */
export async function unwrapList<T>(
  res: Response
): Promise<{ data: T[]; total: number }> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  const json = await res.json();
  if (json.success === false) {
    throw new Error(json.message || 'API error');
  }
  const total =
    parseInt(res.headers.get('X-Total-Count') || '0', 10) ||
    json.meta?.total ||
    (json.data as unknown[]).length;
  return { data: json.data as T[], total };
}

/**
 * Safe fetch that returns null instead of throwing on failure.
 */
export async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) return null;
    return await unwrap<T>(res);
  } catch {
    return null;
  }
}

// ── ID normalization ─────────────────────────────────────────────────────────

/** Map resource name → PK column name in the backend response */
export const PK_FIELD: Record<string, string> = {
  patients: 'patient_id',
  vitals: 'vitals_id',
  insurance_information: 'insurance_id',
  lifestyle_and_habits: 'lifestyle_id',
  medical_history: 'medical_history_id',
  encounters: 'encounter_id',
  prescriptions: 'prescription_id',
  medications: 'medication_id',
  lab_results: 'lab_examination_id',
  surgery: 'surgery_id',
  recordings: 'recording_id',
  transcripts: 'transcript_id',
  conditions: 'condition_id',
  clinical_impressions: 'impression_id',
  tasks: 'task_id',
  appointments: 'appointment_id'
};

/**
 * Ensure every record has an `id` field.
 * The backend returns `patient_id` / `vitals_id` / etc.
 */
export function normalizeId<T>(
  resource: string,
  record: T
): T & { id: string | number } {
  const rec = record as Record<string, unknown>;
  if (rec.id !== undefined) return record as T & { id: string | number };
  const pkField = PK_FIELD[resource];
  if (pkField && rec[pkField] !== undefined) {
    return { ...record, id: rec[pkField] as string | number };
  }
  return record as T & { id: string | number };
}

// ── Filter / Sort query-string builder ───────────────────────────────────────

export interface ListParams {
  page?: number;
  pageSize?: number;
  filters?: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  sorters?: Array<{
    field: string;
    order: 'asc' | 'desc';
  }>;
}

function buildQueryString(params: ListParams): string {
  const qs = new URLSearchParams();

  // Convert page/pageSize → Refine-style _start/_end that the backend expects
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 200;
  qs.set('_start', String((page - 1) * pageSize));
  qs.set('_end', String(page * pageSize));

  // Filters → field__operator=value
  if (params.filters) {
    for (const f of params.filters) {
      if (f.value === undefined || f.value === null) continue;
      const op = f.operator === 'eq' ? '' : `__${f.operator}`;
      if (Array.isArray(f.value)) {
        qs.set(`${f.field}${op}`, f.value.join(','));
      } else {
        qs.set(`${f.field}${op}`, String(f.value));
      }
    }
  }

  // Sorters → sort=field:order
  if (params.sorters && params.sorters.length > 0) {
    qs.set(
      'sort',
      params.sorters.map((s) => `${s.field}:${s.order}`).join(',')
    );
  }

  const str = qs.toString();
  return str ? `?${str}` : '';
}

// ── CRUD operations ──────────────────────────────────────────────────────────

/**
 * Fetch a list of records for a resource.
 * Returns `{ data, total }`.
 */
export async function getList<T = Record<string, unknown>>(
  resource: string,
  params: ListParams = {}
): Promise<{ data: T[]; total: number }> {
  const qs = buildQueryString(params);
  const res = await fetch(`${apiUrl(resource)}${qs}`, {
    headers: authHeaders()
  });
  const { data, total } = await unwrapList<T>(res);
  return {
    data: data.map((r) => normalizeId(resource, r)) as T[],
    total
  };
}

/**
 * Fetch a single record by ID.
 */
export async function getOne<T = Record<string, unknown>>(
  resource: string,
  id: string | number
): Promise<T> {
  const res = await fetch(`${apiUrl(resource)}/${id}`, {
    headers: authHeaders()
  });
  const data = await unwrap<T>(res);
  return normalizeId(resource, data) as T;
}

/**
 * Create a new record.
 */
export async function create<T = Record<string, unknown>>(
  resource: string,
  values: Record<string, unknown>
): Promise<T> {
  const res = await fetch(apiUrl(resource), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(values)
  });
  const data = await unwrap<T>(res);
  return normalizeId(resource, data) as T;
}

/**
 * Update an existing record.
 */
export async function update<T = Record<string, unknown>>(
  resource: string,
  id: string | number,
  values: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${apiUrl(resource)}/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(values)
  });
  const data = await unwrap<T>(res);
  return normalizeId(resource, data) as T;
}

/**
 * Delete a record by ID.
 */
export async function deleteOne(
  resource: string,
  id: string | number
): Promise<void> {
  const res = await fetch(`${apiUrl(resource)}/${id}`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
}

/**
 * Generic custom request.
 */
export async function customRequest<T>(
  url: string,
  method = 'GET',
  payload?: unknown
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: method.toUpperCase(),
    headers: authHeaders(),
    body: payload ? JSON.stringify(payload) : undefined
  });
  const json = await res.json();
  return json as T;
}
