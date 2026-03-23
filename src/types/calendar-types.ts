// ============================================================================
// Vedi EHR — Calendar Types
// FullCalendar event interface + helpers for appointment-based scheduling
// ============================================================================

export interface CalEvent {
  id: string;
  title?: string;
  start: string;
  end: string;
  extendedProps: {
    patient_id?: string;
    user_id?: number | null;
    patient_name?: string;
    provider_id?: string;
    provider_name?: string;
    encounter_type?: string;
    status?: string;
    chief_complaint?: string;
    notes?: string;
    encounter_id?: string;
    encounter_fhir_id?: string;
  };
  color?: string;
}

export const ENCOUNTER_TYPES = [
  { value: 'office_visit', label: 'Office Visit' },
  { value: 'telemedicine', label: 'Telemedicine' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'urgent_care', label: 'Urgent Care' },
  { value: 'annual_physical', label: 'Annual Physical' },
  { value: 'consultation', label: 'Consultation' }
] as const;

export const APPOINTMENT_STATUS = [
  'scheduled',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
] as const;

export const APPOINTMENT_DURATIONS = [10, 15, 20, 30, 45, 60] as const;

// ── Utility functions ──

const EVENT_COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#f97316',
  '#a855f7'
];

let colorIndex = 0;
export function getRandomColor(): string {
  const color = EVENT_COLORS[colorIndex % EVENT_COLORS.length];
  colorIndex++;
  return color;
}

export function toLocalISOString(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0') +
    'T' +
    String(date.getHours()).padStart(2, '0') +
    ':' +
    String(date.getMinutes()).padStart(2, '0') +
    ':' +
    String(date.getSeconds()).padStart(2, '0')
  );
}

export function formatDateToLocalISOString(date: Date): string {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - timezoneOffset)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
}

export function convertEventToCalEvent(eventData: {
  id?: string;
  start?: Date | string | null;
  end?: Date | string | null;
  title?: string;
  extendedProps?: Record<string, unknown>;
}): CalEvent {
  const startDateTime = formatDateToLocalISOString(
    new Date(eventData.start || Date.now())
  );
  const endDateTime = formatDateToLocalISOString(
    new Date(eventData.end || Date.now())
  );

  return {
    id: String(eventData.id || ''),
    title: String(
      eventData.extendedProps?.patient_name || eventData.title || ''
    ),
    start: startDateTime,
    end: endDateTime,
    extendedProps: {
      patient_name: String(eventData.extendedProps?.patient_name || ''),
      provider_name: String(eventData.extendedProps?.provider_name || ''),
      patient_id: String(eventData.extendedProps?.patient_id || ''),
      provider_id: String(eventData.extendedProps?.provider_id || ''),
      encounter_type: String(eventData.extendedProps?.encounter_type || ''),
      chief_complaint: String(eventData.extendedProps?.chief_complaint || ''),
      status: String(eventData.extendedProps?.status || ''),
      notes: String(eventData.extendedProps?.notes || ''),
      encounter_id: String(eventData.extendedProps?.encounter_id || ''),
      encounter_fhir_id: String(
        eventData.extendedProps?.encounter_fhir_id || ''
      )
    }
  };
}

export const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  checked_in:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  in_progress:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  completed:
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
};
