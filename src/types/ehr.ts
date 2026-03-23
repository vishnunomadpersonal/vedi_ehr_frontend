// =============================================================================
// Vedi EHR - Complete Type System (12 Modules, 68 Pages)
// =============================================================================
// Based on Vedi_EHR_Refine_Architecture.docx - Production-Ready Types
// =============================================================================

// ─── Core / Shared Types ─────────────────────────────────────────────────────

export type UserRole = 'doctor' | 'nurse' | 'admin' | 'biller' | 'front_desk';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  specialty?: string;
  npi?: string; // National Provider Identifier
  department?: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  action:
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'export'
    | 'print'
    | 'sign'
    | 'lock';
  resource_type: string;
  resource_id: string;
  resource_label?: string;
  ip_address: string;
  user_agent?: string;
  details?: string;
  phi_accessed: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Module 1: Dashboard ─────────────────────────────────────────────────────

export interface DashboardStats {
  total_patients: number;
  todays_appointments: number;
  pending_tasks: number;
  open_encounters: number;
  unread_messages: number;
  pending_lab_results: number;
  pending_prescriptions: number;
  revenue_today: number;
  patients_trend: number; // percentage change
  appointments_trend: number;
}

export interface DashboardAlert {
  id: string;
  type:
    | 'critical_lab'
    | 'medication_interaction'
    | 'appointment_reminder'
    | 'task_overdue'
    | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  patient_id?: string;
  patient_name?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface RecentActivity {
  id: string;
  user_name: string;
  action: string;
  resource_type: string;
  resource_label: string;
  timestamp: string;
}

// ─── Module 2: Scheduling & Appointments ─────────────────────────────────────

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'waitlisted';

export type AppointmentType =
  | 'new_patient'
  | 'follow_up'
  | 'annual_physical'
  | 'urgent'
  | 'telehealth'
  | 'procedure'
  | 'lab_review';

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  type: AppointmentType;
  status: AppointmentStatus;
  date: string; // ISO date
  start_time: string; // HH:mm
  end_time: string; // HH:mm
  duration_minutes: number;
  room?: string;
  reason: string;
  notes?: string;
  insurance_verified: boolean;
  copay_amount?: number;
  copay_collected: boolean;
  check_in_time?: string;
  check_out_time?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  telehealth_link?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  provider_id: string;
}

export interface WaitlistEntry {
  id: string;
  patient_id: string;
  patient_name: string;
  appointment_type: AppointmentType;
  preferred_provider_id?: string;
  preferred_dates: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  added_at: string;
  status: 'waiting' | 'offered' | 'scheduled' | 'expired';
}

// ─── Module 3: Patient Management ────────────────────────────────────────────

export type PatientStatus = 'active' | 'inactive' | 'deceased' | 'transferred';
export type Gender = 'male' | 'female' | 'other' | 'unknown';
export type MaritalStatus =
  | 'single'
  | 'married'
  | 'divorced'
  | 'widowed'
  | 'separated'
  | 'unknown';

export interface Patient {
  id: string;
  mrn: string; // Medical Record Number
  first_name: string;
  middle_name?: string;
  last_name: string;
  name_prefix?: string;
  name_suffix?: string;
  date_of_birth: string;
  age?: number;
  gender: Gender;
  birth_sex?: string;
  marital_status?: MaritalStatus;
  ssn_last_four?: string;
  ssn?: string;
  id_number?: string;
  email?: string;
  phone: string;
  phone_secondary?: string;
  mobile_phone?: string;
  address: Address;
  emergency_contact: EmergencyContact;
  primary_provider_id?: string;
  primary_provider_name?: string;
  referring_physician?: string;
  insurance: InsuranceInfo[];
  allergies: Allergy[];
  status: PatientStatus;
  preferred_language?: string;
  speaking_language?: string;
  preferred_pharmacy?: string;
  advance_directives: boolean;
  photo_url?: string;
  notes?: string;
  tags?: string[];
  last_visit_date?: string;
  next_appointment_date?: string;
  // Extended fields from swrinnov_clinic_ehr15 DB
  race?: string;
  ethnicity?: string;
  eye_color?: string;
  height?: string;
  weight?: string;
  occupation?: string;
  employment_status?: string;
  employer?: string;
  employer_phone?: string;
  driver_license_no?: string;
  insurance_group?: string;
  insurance_name?: string;
  insurance_number?: string;
  other_family_member_seen?: string;
  suppose_name?: string;
  hipaa_consent_given?: boolean;
  lifestyle_and_habits?: LifestyleAndHabits;
  created_at: string;
  updated_at: string;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface InsuranceInfo {
  id: string;
  type: 'primary' | 'secondary' | 'tertiary';
  payer_name: string;
  payer_id: string;
  plan_name: string;
  member_id: string;
  group_number?: string;
  subscriber_name: string;
  subscriber_relationship: 'self' | 'spouse' | 'child' | 'other';
  effective_date: string;
  termination_date?: string;
  copay_amount?: number;
  deductible?: number;
  deductible_met?: number;
  is_active: boolean;
  verified: boolean;
  verified_date?: string;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onset_date?: string;
  status: 'active' | 'inactive' | 'resolved';
  notes?: string;
}

// ─── Lifestyle & Habits (from swrinnov_clinic_ehr15.lifestyle_and_habits) ────

export interface LifestyleAndHabits {
  id: string;
  patient_id: string;
  // Allergies (legacy text)
  allergies_environmental?: string;
  allergies_food?: string;
  allergies_medications?: string;
  allergies_other?: string;
  no_known_allergies?: boolean;
  // Tobacco / Smoking
  smoking_status?: 'current' | 'former' | 'never' | 'unknown';
  tobacco_use_start_date?: string;
  tobacco_use_end_date?: string;
  packs_per_day?: number;
  pack_years?: number;
  tobacco_type?: string;
  ready_to_quit?: boolean;
  counseling_provided?: boolean;
  // Alcohol
  alcohol_status?: 'current' | 'former' | 'never' | 'unknown';
  alcohol_drinks_per_week?: number;
  alcohol_type?: string;
  alcohol_binge_frequency?: string;
  audit_c_score?: number;
  // Substance Use
  recreational_drugs?: boolean;
  iv_drug_use?: boolean;
  substance_use_treatment_history?: string;
  naloxone_prescribed?: boolean;
  // Exercise & Diet
  exercise_frequency?: string;
  exercise_minutes_per_week?: number;
  exercise_type?: string;
  diet_type?: string;
  dietary_restrictions?: string;
  caffeine_use?: string;
  // Sleep
  sleep_hours_per_night?: number;
  sleep_quality?: 'good' | 'fair' | 'poor';
  // Social
  occupation_coded?: string;
  occupational_hazards?: string;
  education_level?: string;
  living_situation?: string;
  social_support?: string;
  transportation_access?: boolean;
  food_security?: boolean;
  sexually_active?: boolean;
  sexual_orientation?: string;
  social_history_notes?: string;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  type:
    | 'intake_form'
    | 'consent'
    | 'insurance_card'
    | 'lab_result'
    | 'imaging'
    | 'referral'
    | 'other';
  name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

export interface PatientHistory {
  id: string;
  patient_id: string;
  type: 'medical' | 'surgical' | 'family' | 'social';
  condition: string;
  details?: string;
  onset_date?: string;
  resolved_date?: string;
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

// ─── Module 4: Clinical Encounter ────────────────────────────────────────────

export type EncounterStatus =
  | 'planned'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'signed'
  | 'locked'
  | 'amended'
  | 'cancelled';

export type EncounterType =
  | 'office_visit'
  | 'telehealth'
  | 'emergency'
  | 'inpatient'
  | 'procedure'
  | 'consultation'
  | 'follow_up';

export interface Encounter {
  id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  appointment_id?: string;
  type: EncounterType;
  status: EncounterStatus;
  chief_complaint: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  soap_note?: SOAPNote;
  vitals?: Vital[];
  diagnoses: Diagnosis[];
  procedures_performed?: string[];
  orders: string[]; // order IDs
  prescriptions: string[]; // prescription IDs
  referrals: string[];
  follow_up_plan?: string;
  follow_up_date?: string;
  signed_by?: string;
  signed_at?: string;
  locked_at?: string;
  locked_by?: string;
  amendment_reason?: string;
  billing_codes?: BillingCode[];
  recording_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  template_id?: string;
  ai_generated: boolean;
  ai_confidence?: number;
  reviewed_by_provider: boolean;
}

export interface SOAPTemplate {
  id: string;
  name: string;
  specialty: string;
  chief_complaint_category: string;
  subjective_template: string;
  objective_template: string;
  assessment_template: string;
  plan_template: string;
  is_default: boolean;
  created_by: string;
  created_at: string;
}

export interface Vital {
  id: string;
  encounter_id: string;
  patient_id: string;
  recorded_by: string;
  recorded_at: string;
  temperature?: number; // F
  temperature_unit?: 'F' | 'C';
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  respiratory_rate?: number;
  oxygen_saturation?: number;
  weight?: number; // lbs
  weight_unit?: 'lbs' | 'kg';
  height?: number; // inches
  height_unit?: 'in' | 'cm';
  bmi?: number;
  pain_level?: number; // 0-10
  notes?: string;
}

export interface Diagnosis {
  id: string;
  icd10_code: string;
  description: string;
  type: 'primary' | 'secondary' | 'admitting' | 'discharge';
  status: 'active' | 'resolved' | 'chronic' | 'ruled_out';
  onset_date?: string;
  resolved_date?: string;
  notes?: string;
}

export interface Condition {
  id: string;
  patient_id: string;
  icd10_code: string;
  description: string;
  status: 'active' | 'resolved' | 'chronic' | 'remission';
  severity: 'mild' | 'moderate' | 'severe';
  onset_date: string;
  resolved_date?: string;
  diagnosed_by: string;
  notes?: string;
}

export interface ClinicalImpression {
  id: string;
  encounter_id: string;
  patient_id: string;
  provider_id: string;
  status: 'draft' | 'completed' | 'amended';
  summary: string;
  findings: string[];
  assessment: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

export interface BillingCode {
  code: string;
  type: 'CPT' | 'ICD10' | 'HCPCS';
  description: string;
  modifier?: string;
  units: number;
  amount?: number;
}

// ─── Module 5: Session Recording ─────────────────────────────────────────────

export type RecordingStatus =
  | 'ready'
  | 'recording'
  | 'paused'
  | 'processing'
  | 'transcribing'
  | 'completed'
  | 'failed'
  | 'archived';

export interface Recording {
  id: string;
  encounter_id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  status: RecordingStatus;
  duration_seconds: number;
  file_url?: string;
  file_size?: number;
  format: 'wav' | 'mp3' | 'webm';
  sample_rate: number;
  channels: number;
  transcript?: Transcript;
  ai_soap_note?: SOAPNote;
  consent_obtained: boolean;
  consent_timestamp?: string;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  recording_id: string;
  segments: TranscriptSegment[];
  full_text: string;
  language: string;
  confidence: number;
  model: string; // e.g., "whisper-large-v3", "deepgram-nova"
  processing_time_ms: number;
  word_count: number;
  created_at: string;
}

export interface TranscriptSegment {
  id: string;
  speaker: 'doctor' | 'patient' | 'nurse' | 'other' | 'unknown';
  speaker_name?: string;
  text: string;
  start_time: number; // seconds
  end_time: number;
  confidence: number;
  words?: TranscriptWord[];
}

export interface TranscriptWord {
  word: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

// ─── Module 6: Orders & Results ──────────────────────────────────────────────

export type OrderStatus =
  | 'draft'
  | 'pending'
  | 'submitted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type OrderType = 'lab' | 'imaging' | 'referral' | 'procedure' | 'other';

export interface Order {
  id: string;
  encounter_id?: string;
  patient_id: string;
  patient_name: string;
  ordering_provider_id: string;
  ordering_provider_name: string;
  type: OrderType;
  status: OrderStatus;
  priority: 'routine' | 'urgent' | 'stat' | 'asap';
  code: string; // LOINC, CPT, etc.
  description: string;
  clinical_indication: string;
  diagnosis_codes: string[];
  specimen_type?: string;
  fasting_required?: boolean;
  special_instructions?: string;
  lab_name?: string;
  scheduled_date?: string;
  collected_at?: string;
  results?: LabResult[];
  result_received_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LabResult {
  id: string;
  order_id: string;
  test_name: string;
  loinc_code?: string;
  value: string;
  unit: string;
  reference_range: string;
  flag:
    | 'normal'
    | 'low'
    | 'high'
    | 'critical_low'
    | 'critical_high'
    | 'abnormal';
  notes?: string;
  performed_at: string;
}

export interface ImagingResult {
  id: string;
  order_id: string;
  modality:
    | 'xray'
    | 'ct'
    | 'mri'
    | 'ultrasound'
    | 'pet'
    | 'mammogram'
    | 'other';
  body_part: string;
  findings: string;
  impression: string;
  radiologist: string;
  image_urls?: string[];
  report_url?: string;
  performed_at: string;
}

export interface Referral {
  id: string;
  patient_id: string;
  patient_name: string;
  referring_provider_id: string;
  referring_provider_name: string;
  referred_to_provider?: string;
  referred_to_specialty: string;
  referred_to_facility?: string;
  reason: string;
  clinical_notes: string;
  priority: 'routine' | 'urgent' | 'emergent';
  status: 'draft' | 'sent' | 'accepted' | 'completed' | 'cancelled';
  insurance_authorization?: string;
  auth_number?: string;
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
}

// ─── Module 7: Prescriptions ─────────────────────────────────────────────────

export type PrescriptionStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'on_hold';

export interface Prescription {
  id: string;
  patient_id: string;
  patient_name: string;
  prescriber_id: string;
  prescriber_name: string;
  encounter_id?: string;
  medication: Medication;
  sig: string; // Directions (e.g., "Take 1 tablet by mouth twice daily")
  quantity: number;
  quantity_unit: string;
  days_supply: number;
  refills_authorized: number;
  refills_remaining: number;
  dispense_as_written: boolean;
  pharmacy_name: string;
  pharmacy_phone?: string;
  pharmacy_address?: string;
  status: PrescriptionStatus;
  start_date: string;
  end_date?: string;
  last_filled_date?: string;
  notes?: string;
  is_controlled: boolean;
  dea_schedule?: 'II' | 'III' | 'IV' | 'V';
  prior_authorization_required: boolean;
  prior_authorization_number?: string;
  interactions?: DrugInteraction[];
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  rxnorm_code?: string;
  ndc_code?: string;
  name: string;
  generic_name: string;
  brand_name?: string;
  dose: string;
  dose_unit: string;
  form:
    | 'tablet'
    | 'capsule'
    | 'liquid'
    | 'injection'
    | 'patch'
    | 'inhaler'
    | 'cream'
    | 'drops'
    | 'other';
  route:
    | 'oral'
    | 'topical'
    | 'injection'
    | 'inhalation'
    | 'sublingual'
    | 'rectal'
    | 'ophthalmic'
    | 'otic'
    | 'nasal'
    | 'other';
  frequency: string;
  strength: string;
  manufacturer?: string;
}

export interface DrugInteraction {
  id: string;
  drug_a: string;
  drug_b: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinical_significance: string;
  recommendation: string;
}

export interface AllergyCheck {
  medication_name: string;
  allergy_substance: string;
  match_type: 'exact' | 'class' | 'cross_reactivity';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  recommendation: string;
}

// ─── Module 8: Billing & Insurance ───────────────────────────────────────────

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'accepted'
  | 'rejected'
  | 'denied'
  | 'paid'
  | 'partial_paid'
  | 'appealed'
  | 'void';

export interface Claim {
  id: string;
  claim_number: string;
  patient_id: string;
  patient_name: string;
  encounter_id: string;
  insurance_id: string;
  payer_name: string;
  provider_id: string;
  provider_name: string;
  facility_name?: string;
  type: 'professional' | 'institutional';
  status: ClaimStatus;
  filing_indicator: 'primary' | 'secondary' | 'tertiary';
  service_date: string;
  submission_date?: string;
  line_items: ClaimLineItem[];
  total_charges: number;
  total_allowed: number;
  total_paid: number;
  patient_responsibility: number;
  adjustment_amount: number;
  denial_reason?: string;
  denial_code?: string;
  remittance_date?: string;
  check_number?: string;
  era_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClaimLineItem {
  id: string;
  cpt_code: string;
  description: string;
  modifier?: string;
  icd10_codes: string[];
  units: number;
  charge_amount: number;
  allowed_amount: number;
  paid_amount: number;
  adjustment_amount: number;
  denial_reason?: string;
  service_date: string;
  place_of_service: string;
}

export interface EligibilityCheck {
  id: string;
  patient_id: string;
  insurance_id: string;
  payer_name: string;
  member_id: string;
  status: 'eligible' | 'ineligible' | 'unknown' | 'error';
  checked_at: string;
  effective_date: string;
  termination_date?: string;
  plan_name: string;
  copay?: number;
  deductible?: number;
  deductible_met?: number;
  out_of_pocket_max?: number;
  out_of_pocket_met?: number;
  coinsurance_percentage?: number;
  notes?: string;
}

export interface Payment {
  id: string;
  patient_id: string;
  patient_name: string;
  claim_id?: string;
  type:
    | 'copay'
    | 'coinsurance'
    | 'deductible'
    | 'self_pay'
    | 'refund'
    | 'adjustment';
  method: 'cash' | 'check' | 'credit_card' | 'debit_card' | 'ach' | 'insurance';
  amount: number;
  reference_number?: string;
  posted_date: string;
  received_by: string;
  notes?: string;
  status: 'posted' | 'void' | 'refunded';
  created_at: string;
}

export interface Statement {
  id: string;
  patient_id: string;
  patient_name: string;
  statement_date: string;
  due_date: string;
  total_charges: number;
  total_payments: number;
  total_adjustments: number;
  balance_due: number;
  line_items: StatementLineItem[];
  status: 'generated' | 'sent' | 'paid' | 'overdue' | 'collections';
  sent_at?: string;
  sent_method?: 'mail' | 'email' | 'portal';
}

export interface StatementLineItem {
  service_date: string;
  description: string;
  charges: number;
  insurance_paid: number;
  adjustments: number;
  patient_paid: number;
  balance: number;
}

export interface FeeSchedule {
  id: string;
  cpt_code: string;
  description: string;
  standard_charge: number;
  medicare_rate?: number;
  medicaid_rate?: number;
  effective_date: string;
  end_date?: string;
  modifier?: string;
  facility_rate?: number;
  non_facility_rate?: number;
}

// ─── Module 9: Messaging ─────────────────────────────────────────────────────

export type MessageType = 'internal' | 'patient' | 'system' | 'fax';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Message {
  id: string;
  type: MessageType;
  from_user_id: string;
  from_user_name: string;
  to_user_ids: string[];
  to_user_names: string[];
  cc_user_ids?: string[];
  patient_id?: string;
  patient_name?: string;
  encounter_id?: string;
  subject: string;
  body: string;
  priority: MessagePriority;
  is_read: boolean;
  read_at?: string;
  attachments?: MessageAttachment[];
  thread_id?: string;
  parent_message_id?: string;
  reply_count: number;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'appointment' | 'lab_result' | 'message' | 'task' | 'alert' | 'system';
  title: string;
  body: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface FaxEntry {
  id: string;
  direction: 'inbound' | 'outbound';
  from_number: string;
  to_number: string;
  patient_id?: string;
  patient_name?: string;
  subject?: string;
  page_count: number;
  status: 'queued' | 'sending' | 'sent' | 'received' | 'failed';
  file_url: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
}

// ─── Module 10: Reports & Analytics ──────────────────────────────────────────

export type ReportType =
  | 'clinical'
  | 'financial'
  | 'operational'
  | 'custom'
  | 'population_health';

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  description: string;
  query_definition?: string;
  parameters?: ReportParameter[];
  schedule?: string; // cron expression
  last_run_at?: string;
  created_by: string;
  is_favorite: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportParameter {
  name: string;
  label: string;
  type: 'date' | 'date_range' | 'select' | 'multiselect' | 'text' | 'number';
  options?: { label: string; value: string }[];
  default_value?: string;
  required: boolean;
}

export interface ReportResult {
  report_id: string;
  generated_at: string;
  parameters_used: Record<string, string>;
  columns: { key: string; label: string; type: string }[];
  rows: Record<string, string | number>[];
  summary?: Record<string, number>;
  chart_data?: ChartDataPoint[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
  date?: string;
}

// ─── Module 11: Administration ───────────────────────────────────────────────

export interface SystemSetting {
  id: string;
  category:
    | 'general'
    | 'clinical'
    | 'billing'
    | 'scheduling'
    | 'security'
    | 'integration';
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'select';
  options?: string[];
  updated_by: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  credentials: string; // MD, DO, NP, PA, etc.
  specialty: string;
  sub_specialty?: string;
  npi: string;
  dea_number?: string;
  state_license: string;
  state_license_state: string;
  state_license_expiry: string;
  board_certified: boolean;
  accepting_new_patients: boolean;
  schedule_template?: string;
  department: string;
  phone?: string;
  email: string;
  bio?: string;
  photo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CodeSet {
  id: string;
  type: 'ICD10' | 'CPT' | 'LOINC' | 'SNOMED' | 'RXNORM' | 'HCPCS';
  code: string;
  description: string;
  category?: string;
  is_active: boolean;
  effective_date?: string;
  end_date?: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'intake' | 'consent' | 'assessment' | 'discharge' | 'custom';
  fields: FormField[];
  is_active: boolean;
  version: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'number'
    | 'date'
    | 'select'
    | 'multiselect'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'signature';
  label: string;
  name: string;
  placeholder?: string;
  required: boolean;
  options?: { label: string; value: string }[];
  validation?: string;
  order: number;
  section?: string;
  conditional_on?: string;
  conditional_value?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime_seconds: number;
  version: string;
  services: ServiceHealth[];
  last_checked: string;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'degraded' | 'down';
  latency_ms: number;
  last_error?: string;
  checked_at: string;
}

// ─── Module 12: Telehealth ───────────────────────────────────────────────────

export type TelehealthStatus =
  | 'waiting'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface TelehealthSession {
  id: string;
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  provider_id: string;
  provider_name: string;
  room_name: string;
  room_url: string; // Jitsi meeting URL
  status: TelehealthStatus;
  scheduled_start: string;
  actual_start?: string;
  actual_end?: string;
  duration_minutes?: number;
  patient_joined_at?: string;
  provider_joined_at?: string;
  recording_enabled: boolean;
  recording_id?: string;
  screen_shared: boolean;
  chat_log?: TelehealthChatMessage[];
  technical_issues?: string[];
  patient_satisfaction_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface TelehealthChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

export interface VirtualWaitingRoom {
  id: string;
  provider_id: string;
  provider_name: string;
  patients: WaitingRoomEntry[];
  estimated_wait_minutes: number;
  max_capacity: number;
}

export interface WaitingRoomEntry {
  patient_id: string;
  patient_name: string;
  appointment_id: string;
  joined_at: string;
  position: number;
  estimated_start: string;
  status: 'waiting' | 'ready' | 'in_session';
}

// ─── Task Management (Cross-Module) ─────────────────────────────────────────

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskCategory =
  | 'follow_up'
  | 'lab_review'
  | 'referral'
  | 'prior_auth'
  | 'refill'
  | 'callback'
  | 'documentation'
  | 'billing'
  | 'administrative'
  | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_id: string;
  assigned_to_name: string;
  created_by_id: string;
  created_by_name: string;
  patient_id?: string;
  patient_name?: string;
  encounter_id?: string;
  due_date?: string;
  completed_at?: string;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// ─── RBAC Types ──────────────────────────────────────────────────────────────

export interface Permission {
  resource: string;
  actions: (
    | 'list'
    | 'show'
    | 'create'
    | 'edit'
    | 'delete'
    | 'export'
    | 'sign'
    | 'lock'
  )[];
}

export interface RolePermissions {
  role: UserRole;
  permissions: Permission[];
}

// RBAC Matrix from the architecture document
export const ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'doctor',
    permissions: [
      { resource: 'patients', actions: ['list', 'show', 'create', 'edit'] },
      {
        resource: 'encounters',
        actions: ['list', 'show', 'create', 'edit', 'sign', 'lock']
      },
      { resource: 'recordings', actions: ['list', 'show', 'create'] },
      {
        resource: 'prescriptions',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      {
        resource: 'orders',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      { resource: 'referrals', actions: ['list', 'show', 'create', 'edit'] },
      { resource: 'schedule', actions: ['list', 'show'] },
      { resource: 'tasks', actions: ['list', 'show', 'create', 'edit'] },
      { resource: 'messages', actions: ['list', 'show', 'create'] },
      { resource: 'reports', actions: ['list', 'show'] },
      { resource: 'telehealth', actions: ['list', 'show', 'create'] }
    ]
  },
  {
    role: 'nurse',
    permissions: [
      { resource: 'patients', actions: ['list', 'show', 'edit'] },
      { resource: 'encounters', actions: ['list', 'show', 'create', 'edit'] },
      { resource: 'recordings', actions: ['list', 'show', 'create'] },
      { resource: 'prescriptions', actions: ['list', 'show'] },
      { resource: 'orders', actions: ['list', 'show', 'create'] },
      { resource: 'schedule', actions: ['list', 'show'] },
      { resource: 'tasks', actions: ['list', 'show', 'create', 'edit'] },
      { resource: 'messages', actions: ['list', 'show', 'create'] },
      { resource: 'telehealth', actions: ['list', 'show', 'create'] }
    ]
  },
  {
    role: 'admin',
    permissions: [
      {
        resource: 'patients',
        actions: ['list', 'show', 'create', 'edit', 'delete', 'export']
      },
      {
        resource: 'encounters',
        actions: ['list', 'show', 'create', 'edit', 'delete', 'export']
      },
      {
        resource: 'recordings',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      {
        resource: 'prescriptions',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      {
        resource: 'orders',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      {
        resource: 'billing',
        actions: ['list', 'show', 'create', 'edit', 'delete', 'export']
      },
      {
        resource: 'schedule',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      {
        resource: 'tasks',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      { resource: 'messages', actions: ['list', 'show', 'create'] },
      {
        resource: 'reports',
        actions: ['list', 'show', 'create', 'edit', 'export']
      },
      {
        resource: 'administration',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      { resource: 'audit_log', actions: ['list', 'show', 'export'] },
      {
        resource: 'telehealth',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      }
    ]
  },
  {
    role: 'biller',
    permissions: [
      { resource: 'patients', actions: ['list', 'show'] },
      { resource: 'encounters', actions: ['list', 'show'] },
      {
        resource: 'billing',
        actions: ['list', 'show', 'create', 'edit', 'delete', 'export']
      },
      { resource: 'schedule', actions: ['list', 'show'] },
      { resource: 'reports', actions: ['list', 'show'] }
    ]
  },
  {
    role: 'front_desk',
    permissions: [
      { resource: 'patients', actions: ['list', 'show', 'create', 'edit'] },
      { resource: 'encounters', actions: ['list', 'show', 'create'] },
      {
        resource: 'schedule',
        actions: ['list', 'show', 'create', 'edit', 'delete']
      },
      { resource: 'tasks', actions: ['list', 'show', 'create', 'edit'] },
      { resource: 'messages', actions: ['list', 'show', 'create'] }
    ]
  }
];

export function hasPermission(
  role: UserRole,
  resource: string,
  action: string
): boolean {
  const rolePerms = ROLE_PERMISSIONS.find((rp) => rp.role === role);
  if (!rolePerms) return false;
  const resourcePerms = rolePerms.permissions.find(
    (p) => p.resource === resource
  );
  if (!resourcePerms) return false;
  return resourcePerms.actions.includes(
    action as Permission['actions'][number]
  );
}
