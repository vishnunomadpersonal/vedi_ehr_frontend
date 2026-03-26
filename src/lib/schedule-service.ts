// ============================================================================
// Vedi EHR — Schedule / Calendar API Service
// Talks to the /v1/appointments backend and maps to CalEvent
// ============================================================================

import { apiClient } from '@/lib/api';
import type { CalEvent } from '@/types/calendar-types';

const APPT_BASE = '/v1/appointments';
const PAT_BASE = '/v1/patients';
const STAFF_BASE = '/v1/staff';

// ── Backend appointment shape (response) ──

interface AppointmentDTO {
  appointment_id: number;
  id?: number;
  patient_id: number;
  doctor_id: number;
  patient_name?: string | null;
  provider_name?: string | null;
  appointment_start_time?: string | null;
  appointment_end_time?: string | null;
  appointment_date?: string | null;
  reason_for_visit?: string | null;
  visit_type?: string | null;
  status?: string | null;
  fhir_status?: string | null;
  internal_notes?: string | null;
  notes?: string | null;
  minutes_duration?: number | null;
  encounter_fhir_id?: string | null;
  encounter_id?: number | null;
  fhir_id?: string | null;
}

// ── DTO → CalEvent ──

function appointmentToCalEvent(a: AppointmentDTO): CalEvent {
  return {
    id: String(a.id ?? a.appointment_id ?? ''),
    title: a.patient_name || 'Unnamed Patient',
    start: a.appointment_start_time || '',
    end: a.appointment_end_time || a.appointment_start_time || '',
    extendedProps: {
      patient_id: String(a.patient_id || ''),
      patient_name: a.patient_name || '',
      provider_name: a.provider_name || '',
      provider_id: String(a.doctor_id || ''),
      encounter_type: a.visit_type || 'office_visit',
      status: a.status || 'scheduled',
      chief_complaint: a.reason_for_visit || '',
      notes: a.notes || '',
      encounter_id: a.encounter_id ? String(a.encounter_id) : '',
      encounter_fhir_id: a.encounter_fhir_id || ''
    }
  };
}

// ── Queries ──

export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<CalEvent[]> {
  try {
    const res = await apiClient.get<{
      success: boolean;
      data: AppointmentDTO[];
      meta?: { total: number };
    }>(APPT_BASE, {
      start_date: startDate,
      end_date: endDate,
      _end: '200',
      _sort: 'appointment_start_time',
      _order: 'asc'
    });
    return (res.data || []).map(appointmentToCalEvent);
  } catch (error) {
    console.error('Error loading appointments by date:', error);
    return [];
  }
}

export async function createAppointment(
  event: CalEvent
): Promise<{ data: AppointmentDTO; status: number }> {
  const body = {
    patient_id:
      Number(event.extendedProps?.user_id) ||
      Number(event.extendedProps?.patient_id) ||
      0,
    doctor_id: Number(event.extendedProps?.provider_id) || 0,
    appointment_start_time: event.start,
    appointment_end_time: event.end,
    visit_type: event.extendedProps?.encounter_type || 'office_visit',
    reason_for_visit: event.extendedProps?.chief_complaint || '',
    notes: event.extendedProps?.notes || '',
    status: 'scheduled',
    provider_name: event.extendedProps?.provider_name || '',
    patient_name: event.extendedProps?.patient_name || ''
  };
  const res = await apiClient.post<{ success: boolean; data: AppointmentDTO }>(
    APPT_BASE,
    body
  );
  return { data: res.data, status: 200 };
}

export async function updateAppointment(
  event:
    | CalEvent
    | {
        id: string;
        start: string;
        end: string;
        extendedProps?: Record<string, unknown>;
      }
): Promise<{ data: AppointmentDTO; status: number }> {
  const body: Record<string, unknown> = {
    appointment_start_time: event.start?.toString(),
    appointment_end_time: event.end?.toString()
  };
  if (event.extendedProps) {
    if (event.extendedProps.patient_id)
      body.patient_id = Number(event.extendedProps.patient_id);
    if (event.extendedProps.provider_id)
      body.doctor_id = Number(event.extendedProps.provider_id);
    if (event.extendedProps.encounter_type)
      body.visit_type = String(event.extendedProps.encounter_type);
    if (event.extendedProps.chief_complaint)
      body.reason_for_visit = String(event.extendedProps.chief_complaint);
    if (event.extendedProps.notes)
      body.notes = String(event.extendedProps.notes);
    if (event.extendedProps.status)
      body.status = String(event.extendedProps.status);
    if (event.extendedProps.provider_name)
      body.provider_name = String(event.extendedProps.provider_name);
    if (event.extendedProps.patient_name)
      body.patient_name = String(event.extendedProps.patient_name);
  }
  const res = await apiClient.patch<{ success: boolean; data: AppointmentDTO }>(
    `${APPT_BASE}/${event.id}`,
    body
  );
  return { data: res.data, status: 200 };
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: string
): Promise<{ data: AppointmentDTO; status: number }> {
  const res = await apiClient.patch<{ success: boolean; data: AppointmentDTO }>(
    `${APPT_BASE}/${appointmentId}`,
    { status }
  );
  return { data: res.data, status: 200 };
}

export async function updateEncounterStatus(
  encounterId: string,
  status: string
): Promise<void> {
  await apiClient.patch(`/v1/encounters/${encounterId}`, { status });
}

export async function deleteAppointment(id: string): Promise<{ ok: boolean }> {
  await apiClient.delete(`${APPT_BASE}/${id}`);
  return { ok: true };
}

// ── Patient search ──

export async function searchPatients(query: string): Promise<
  Array<{
    id: string;
    user_id?: number | null;
    name: string;
    email?: string;
    phone?: string;
    medical_record_number?: string;
  }>
> {
  try {
    const res = await apiClient.get<{
      success: boolean;
      data: Array<{
        id: string;
        patient_id?: string;
        user_id?: number | null;
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        mobile_phone?: string;
        medical_record_number?: string;
      }>;
    }>(PAT_BASE, { search: query, per_page: '10' });
    return (res.data || []).map((p) => ({
      id: String(p.id ?? p.patient_id ?? ''),
      user_id: p.user_id ?? null,
      name: [p.first_name, p.last_name].filter(Boolean).join(' '),
      email: p.email,
      phone: p.phone || p.mobile_phone,
      medical_record_number: p.medical_record_number
    }));
  } catch {
    return [];
  }
}

// ── Staff / Provider search ──

export async function searchStaff(query: string): Promise<
  Array<{
    id: number;
    user_id: number;
    name: string;
    specialization?: string;
    department?: string;
    role?: string;
    email?: string;
  }>
> {
  try {
    const res = await apiClient.get<{
      success: boolean;
      data: Array<{
        id: number;
        staff_id?: number;
        user_id: number;
        first_name?: string;
        last_name?: string;
        name_prefix?: string;
        display_name?: string;
        specialization?: string;
        department?: string;
        role?: string;
        email?: string;
      }>;
    }>(STAFF_BASE, { search: query, per_page: '10' });
    return (res.data || []).map((s) => ({
      id: s.id ?? s.staff_id ?? 0,
      user_id: s.user_id,
      name:
        s.display_name ||
        [s.name_prefix, s.first_name, s.last_name].filter(Boolean).join(' '),
      specialization: s.specialization,
      department: s.department,
      role: s.role,
      email: s.email
    }));
  } catch {
    return [];
  }
}
