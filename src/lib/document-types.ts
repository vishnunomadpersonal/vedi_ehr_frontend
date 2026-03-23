// ═══════════════════════════════════════════════════════════════════════════════
// Document categories — fetched from the EHR backend's document_categories table.
// Falls back to a static list if the API is unreachable.
// ═══════════════════════════════════════════════════════════════════════════════

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const DOCUMENTS_BASE = `${API_URL}/v1/documents`;

/** Shape returned by GET /api/v1/documents/categories */
export interface DocumentCategory {
  id: number;
  name: string;
  code: string;
  description: string | null;
  parent_category_id: number | null;
  fhir_category_code: string | null;
  display_order: number | null;
  icon_class: string | null;
  color_code: string | null;
  is_active: boolean;
}

// ── Static fallback (used when API unavailable / SSR) ────────────────────────

export const DOCUMENT_TYPES_FALLBACK = [
  { value: 'clinical_notes', label: 'Clinical Notes' },
  { value: 'lab_results', label: 'Lab Results' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'consent', label: 'Consent Forms' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'referrals', label: 'Referrals' },
  { value: 'prescriptions', label: 'Prescriptions' },
  { value: 'patient_uploads', label: 'Patient Uploads' },
  { value: 'external', label: 'External Records' },
  { value: 'legal', label: 'Legal' }
] as const;

// ── Cached API fetch ─────────────────────────────────────────────────────────

let _cached: { value: string; label: string }[] | null = null;

/**
 * Fetch document categories from the backend.
 * Caches in-memory so subsequent calls are instant.
 */
export async function fetchDocumentCategories(): Promise<
  { value: string; label: string }[]
> {
  if (_cached) return _cached;

  try {
    const res = await fetch(`${DOCUMENTS_BASE}/categories`);
    if (!res.ok) throw new Error(`${res.status}`);
    const json: { success: boolean; data: DocumentCategory[] } =
      await res.json();
    if (json.success && json.data.length > 0) {
      _cached = json.data.map((c) => ({ value: c.code, label: c.name }));
      return _cached;
    }
  } catch {
    // Fall through to static list
  }
  return [...DOCUMENT_TYPES_FALLBACK];
}

/** Synchronous label lookup — checks cache, then fallback. */
export function documentTypeLabel(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const list = _cached ?? DOCUMENT_TYPES_FALLBACK;
  return (
    (list as readonly { value: string; label: string }[]).find(
      (dt) => dt.value === value
    )?.label ?? value
  );
}
