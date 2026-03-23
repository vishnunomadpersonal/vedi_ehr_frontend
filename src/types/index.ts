import { Icons } from '@/components/icons';

export interface PermissionCheck {
  permission?: string;
  plan?: string;
  feature?: string;
  role?: string;
  requireOrg?: boolean;
}

export interface NavItem {
  title: string;
  url: string;
  disabled?: boolean;
  external?: boolean;
  shortcut?: [string, string];
  icon?: keyof typeof Icons;
  label?: string;
  description?: string;
  isActive?: boolean;
  items?: NavItem[];
  access?: PermissionCheck;
}

export interface NavItemWithChildren extends NavItem {
  items: NavItemWithChildren[];
}

export interface NavItemWithOptionalChildren extends NavItem {
  items?: NavItemWithChildren[];
}

export interface FooterItem {
  title: string;
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
}

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

// ============================================================================
// EHR Domain Types
// ============================================================================

// ---------- Base ----------
export interface BaseRecord {
  id: string;
  created_at: string;
  updated_at: string;
}

// ---------- Auth ----------
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  avatar?: string;
}

export type UserRole = 'doctor' | 'nurse' | 'admin' | 'biller' | 'front_desk';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// ---------- Patient (mapped to swrinnov_clinic_ehr15.patients) ----------
export interface Patient extends BaseRecord {
  // ── Core identity ──
  patient_id?: string; // DB primary key
  fhir_id?: string;
  user_id?: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  name_prefix?: string; // Mr, Mrs, Dr
  name_suffix?: string; // Jr, III
  name_use?: string; // official | usual | nickname
  dob?: string; // DB column name (date)
  date_of_birth: string; // alias kept for backward compat
  age?: string; // stored as varchar in DB
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  birth_sex?: string; // M | F | UNK
  marital_status?: string;
  marital_status_code?: string;
  marital_status_display?: string;

  // ── Contact ──
  phone?: string;
  email?: string;
  mobile_phone?: string; // convenience alias
  phone_secondary?: string; // convenience alias
  telecom_system?: string; // phone | email | fax
  telecom_use?: string; // home | work | mobile

  // ── Address (flat — matches DB columns) ──
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  address_line2?: string;
  address_use?: string; // home | work
  address_type?: string; // physical | postal
  address_district?: string;
  // Nested object kept for backward-compat with existing UI components
  address?: Address;

  // ── Employment / identification ──
  occupation?: string;
  employment_status?: string;
  driver_license_no?: string;
  ssn?: string;
  ssn_last_four?: string; // derived convenience field

  // ── Clinical ──
  primary_registered_hospital_id?: number;
  eye_color?: string;
  race?: string;
  race_code?: string;
  race_display?: string;
  ethnicity?: string;
  ethnicity_code?: string;
  ethnicity_display?: string;
  primary_language?: string; // DB column name
  preferred_language?: string; // alias
  speaking_language?: string; // alias
  communication_language?: string;
  communication_preferred?: boolean;

  // ── Provider references ──
  primary_care_physician?: string;
  referring_physician?: string;
  primary_provider_id?: string;
  primary_provider_name?: string;
  general_practitioner_reference?: string;
  managing_organization_reference?: string;

  // ── Emergency contact (flat — matches DB) ──
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone_number?: string;
  // Nested object kept for backward-compat
  emergency_contact?: EmergencyContact;

  // ── Insurance (nested for backward-compat sidebar) ──
  insurance?: Insurance;
  // Flat convenience fields for Profile tab
  insurance_group?: string;
  insurance_name?: string;
  insurance_number?: string;

  // ── Record keeping ──
  medical_record_number: string;
  identifier_system?: string;
  identifier_value?: string;
  id_number?: string;
  status: 'active' | 'inactive' | 'deceased';
  active?: boolean;
  version?: number;
  created_by?: number;
  modified_by?: number;
  modified_dt?: string;
  certification_date?: string;

  // ── Consent / HIPAA ──
  patient_acknowledgment?: boolean;
  patient_signature?: string;
  hipaa_consent_given?: boolean;
  hipaa_consent_date?: string;
  hipaa_consent_document?: string;
  hipaa_privacy_notice_given?: boolean;

  // ── Deceased ──
  deceased_boolean?: boolean;
  deceased_datetime?: string;

  // ── Multiple birth ──
  multiple_birth_boolean?: boolean;
  multiple_birth_integer?: number;

  // ── Gender identity ──
  gender_identity_code?: string;
  gender_identity_display?: string;

  // ── Patient links ──
  link_other_patient?: string;
  link_type?: string;

  // ── FHIR metadata ──
  meta_version_id?: number;
  meta_last_updated?: string;
  meta_source?: string;
  meta_profile?: unknown;
  meta_security?: unknown;
  meta_tag?: unknown;
  extensions?: unknown;
  fhir_narrative_status?: string;
  fhir_narrative_div?: string;

  // ── Clinical lists (convenience — kept for sidebar) ──
  allergies?: string[];
  medications?: string[];
  notes?: string;
  tags?: string[];
  photo_url?: string;
  preferred_pharmacy?: string;
  advance_directives?: boolean;

  // ── Scheduling ──
  last_visit_date?: string;
  next_appointment_date?: string;

  // ── Family ──
  other_family_member_seen?: string;
  suppose_name?: string; // spouse name (DB typo preserved)

  // ── Height / Weight (convenience — authoritative values in vitals) ──
  height?: string;
  weight?: string;

  // ── Related data (joined) ──
  lifestyle_and_habits?: LifestyleAndHabits;
  insurance_information?: InsuranceInformation;
  medical_history?: MedicalHistory;
}

// ---------- Insurance Information (swrinnov_clinic_ehr15.insuranceinformation) ----------
export interface InsuranceInformation {
  insurance_id?: number;
  fhir_id?: string;
  patient_id: string;
  primary_insurance_provider?: string;
  policy_number?: string;
  group_number?: string;
  plan_type?: string;
  coverage_start_date?: string;
  coverage_end_date?: string;
  policy_holder_name?: string;
  relationship_to_patient?: string;
  secondary_insurance_provider?: string;
  status?: string; // active | cancelled
  subscriber_id?: string;
  subscriber_reference?: string;
  beneficiary_reference?: string;
  dependent?: string;
  relationship_code?: string;
  relationship_display?: string;
  network?: string;
  order_value?: number;
  cost_to_beneficiary?: unknown;
  subrogation?: boolean;
  insurance_plan_reference?: string;
  verification_status?: string;
  verification_date?: string;
  verified_by?: string;
  eligibility_checked?: boolean;
  eligibility_check_date?: string;
  copay_amount?: number;
  deductible_amount?: number;
  deductible_met?: number;
  out_of_pocket_max?: number;
  out_of_pocket_met?: number;
  created_by?: number;
  created_dt?: string;
  modified_by?: number;
  modified_dt?: string;
  version?: number;
  meta_version_id?: number;
  meta_last_updated?: string;
  extensions?: unknown;
}

// ---------- Lifestyle & Habits (swrinnov_clinic_ehr15.lifestyle_and_habits) ----------
export interface LifestyleAndHabits {
  lifestyle_id?: number;
  patient_id?: string;

  // ── Allergies (categorized) ──
  allergies_environmental?: string;
  allergies_food?: string;
  allergies_medications?: string;
  allergies_other?: string;
  allergies_coded?: unknown; // JSON: FHIR AllergyIntolerance[]
  no_known_allergies?: boolean;
  no_known_drug_allergies?: boolean;
  no_known_food_allergies?: boolean;
  no_known_environmental_allergies?: boolean;
  allergy_list_reviewed?: boolean;
  allergy_list_review_date?: string;
  allergy_list_reviewed_by?: string;

  // ── Smoking / Tobacco ──
  smoking_status?: string;
  smoking_status_coded?: string; // SNOMED
  smoking_status_display?: string;
  tobacco_type?: string;
  tobacco_use_start_date?: string;
  tobacco_use_end_date?: string;
  packs_per_day?: string; // varchar in DB
  pack_years?: string; // varchar in DB
  ready_to_quit?: boolean;
  counseling_provided?: boolean;

  // ── Alcohol ──
  alcohol_status?: string;
  alcohol_use_coded?: string; // SNOMED
  alcohol_drinks_per_week?: number;
  alcohol_type?: string;
  alcohol_binge_frequency?: string;
  audit_c_score?: number;
  alcohol_use_start_date?: string;
  alcohol_use_end_date?: string;

  // ── Substances ──
  recreational_drugs?: string; // varchar in DB
  substance_use_coded?: unknown; // JSON — 42 CFR Part 2
  iv_drug_use?: boolean;
  substance_use_treatment_history?: boolean;
  naloxone_prescribed?: boolean;

  // ── Exercise ──
  exercise_frequency?: string;
  exercise_minutes_per_week?: number;
  exercise_type?: string;

  // ── Diet ──
  diet_type?: string;
  dietary_restrictions?: string;
  caffeine_use?: string;

  // ── Sleep ──
  sleep_hours_per_night?: string; // varchar in DB
  sleep_quality?: string;

  // ── Social determinants ──
  occupation?: string;
  occupation_coded?: unknown;
  occupational_hazards?: string;
  education_level?: string;
  living_situation?: string;
  social_support?: string;
  transportation_access?: boolean;
  food_security?: string; // varchar in DB

  // ── Sexual health ──
  sexually_active?: boolean;
  sexual_orientation?: string;
  gender_identity?: string;

  // ── Notes ──
  social_history_notes?: string;

  // ── Audit ──
  created_by?: number;
  created_dt?: string;
  modified_by?: number;
  modified_dt?: string;
  version?: number;
  fhir_id?: string;
}

// ---------- Medical History (swrinnov_clinic_ehr15.medicalhistory) ----------
export interface MedicalHistory {
  medical_history_id?: number;
  patient_id?: string;

  // ── Cardiovascular ──
  cardiovascular_palpitations?: boolean;
  cardiovascular_chest_pain?: boolean;
  cardiovascular_swelling_of_extremities?: boolean;

  // ── Constitutional ──
  constitutional_fever?: boolean;
  constitutional_chills?: boolean;
  constitutional_fatigue?: boolean;
  constitutional_weight_loss?: boolean;

  // ── Chronic Conditions ──
  chronic_conditions_hypertension?: boolean;
  chronic_conditions_diabetes?: boolean;
  chronic_conditions_asthma?: boolean;
  chronic_conditions_heart_disease?: boolean;
  chronic_conditions_other?: boolean;
  chronic_conditions_other_detail?: string;

  // ── Family History ──
  family_history_heart_disease?: boolean;
  family_history_diabetes?: boolean;
  family_history_cancer?: boolean;
  family_history_stroke?: boolean;
  family_history_hypertension?: boolean;
  family_history_mental_illness?: boolean;
  family_history_other?: boolean;
  family_history_other_detail?: string;

  // ── Gastrointestinal ──
  gastrointestinal_nausea?: boolean;
  gastrointestinal_vomiting?: boolean;
  gastrointestinal_diarrhea?: boolean;
  gastrointestinal_constipation?: boolean;

  // ── Eyes ──
  eyes_redness?: boolean;
  eyes_vision_changes?: boolean;
  eyes_eye_pain?: boolean;

  // ── Musculoskeletal ──
  musculoskeletal_stiffness?: boolean;
  musculoskeletal_joint_pain?: boolean;
  musculoskeletal_muscle_pain?: boolean;

  // ── Neurological ──
  neurological_headaches?: boolean;
  neurological_dizziness?: boolean;
  neurological_numbness_tingling?: boolean;

  // ── Psychiatric ──
  psychiatric_depression?: boolean;
  psychiatric_anxiety?: boolean;
  psychiatric_sleep_disturbances?: boolean;

  // ── Respiratory ──
  respiratory_cough?: boolean;
  respiratory_shortness_of_breath?: boolean;
  respiratory_wheezing?: boolean;

  // ── Genitourinary ──
  genitourinary_painful_urination?: boolean;
  genitourinary_blood_in_urine?: boolean;
  genitourinary_urgency_frequency?: boolean;

  // ── Additional text fields ──
  current_medications?: string;
  past_surgeries?: string;
  previous_injuries?: string;
  vaccinations?: string;
  clinical_notes?: string;

  // ── FHIR / coded data ──
  fhir_id?: string;
  condition_category?: string;
  chronic_conditions_coded?: Array<{
    code: string;
    system: string;
    display: string;
    onsetDate?: string;
    status?: string;
  }>;
  family_history_coded?: Array<{
    relationship: string;
    condition: string;
    contributedToDeath?: boolean;
    ageAtOnset?: string;
  }>;
  current_medications_coded?: Array<{
    code: string;
    system: string;
    display: string;
    dosage?: string;
    status?: string;
  }>;
  past_surgeries_coded?: Array<{
    code: string;
    system: string;
    display: string;
    date?: string;
    outcome?: string;
  }>;
  social_history?: unknown;

  // ── Audit ──
  created_by?: number;
  created_dt?: string;
  modified_by?: number;
  modified_dt?: string;
  version?: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Insurance {
  provider: string;
  policy_number: string;
  group_number?: string;
  subscriber_name?: string;
  effective_date?: string;
  expiration_date?: string;
}

// ---------- Encounter (EPIC 0.4) ----------
export interface Encounter extends BaseRecord {
  encounter_id?: number;
  patient_id: string;
  patient_name?: string; // denormalized for display
  provider_id: string;
  provider_name?: string;
  encounter_type: EncounterType;
  status: EncounterStatus;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  chief_complaint?: string;
  notes?: string;
  summary?: string;
  diagnosis_codes?: string[];
  transcript_id?: string;

  // ── SOAP notes (from DB) ──────────────────────────────────────────────
  subjective_notes?: string;
  objective_notes?: string;
  assessment_notes?: string;
  plan_notes?: string;

  // ── FHIR / clinical details ───────────────────────────────────────────
  encounter_number?: string;
  fhir_id?: string;
  fhir_status?: string;
  fhir_class_code?: string;
  fhir_class_display?: string;
  encounter_type_code?: string;
  encounter_type_display?: string;
  service_type_display?: string;
  priority_display?: string;
  reason_display?: string;

  // ── Period / Duration ─────────────────────────────────────────────────
  period_start?: string;
  period_end?: string;
  length_value?: number;
  length_unit?: string;

  // ── Location ──────────────────────────────────────────────────────────
  location_id?: string;
  location_status?: string;

  // ── Provider / Appointment ────────────────────────────────────────────
  primary_provider_id?: number;
  appointment_id?: number;

  // ── Diagnosis (raw FHIR JSON) ─────────────────────────────────────────
  diagnosis?: Array<{
    code: string;
    display: string;
    rank?: number;
    use?: string;
  }>;

  // ── Participants (raw FHIR JSON) ──────────────────────────────────────
  participants?: Array<{
    role: string;
    name: string;
    id?: number;
    type?: string;
  }>;
}

export type EncounterType =
  | 'office_visit'
  | 'telemedicine'
  | 'follow_up'
  | 'urgent_care'
  | 'annual_physical'
  | 'consultation';

export type EncounterStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

// ---------- Session Recording (EPIC 0.3) ----------
export interface Recording extends BaseRecord {
  recording_id?: number;
  encounter_id: string | number;
  patient_id?: string;
  storage_provider?: string;
  bucket_name?: string;
  object_key?: string;
  file_url?: string;
  file_name?: string;
  duration_seconds: number;
  file_size_bytes?: number;
  format: 'webm' | 'wav' | 'mp3';
  sample_rate?: number;
  channels?: number;
  mime_type?: string;
  status: 'recording' | 'uploading' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  recorded_by?: number;
  device_info?: string;
  recording_started_at?: string;
  recording_ended_at?: string;
}

export interface TranscriptSegment {
  id?: string;
  speaker: 'doctor' | 'patient' | 'unknown';
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
}

export interface Transcript extends BaseRecord {
  transcript_id?: number;
  recording_id?: string | number;
  encounter_id: string | number;
  patient_id?: string;
  segments: TranscriptSegment[];
  full_text?: string;
  language?: string;
  speaker_count?: number;
  word_count?: number;
  duration_seconds?: number;
  confidence_avg?: number;
  stt_provider?: string;
  stt_model?: string;
  status: 'processing' | 'completed' | 'failed' | 'partial';
  error_message?: string;
  soap_generated?: boolean;
  created_by?: number;
}

// ---------- Audit ----------
export interface AuditLog extends BaseRecord {
  user_id: string;
  action: string;
  resource: string;
  resource_id: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

// ---------- Prescription (swrinnov_clinic_ehr15.prescriptions) ----------
export interface Prescription extends BaseRecord {
  prescription_id: string;
  fhir_id?: string;
  patient_id: number;
  doctor_id: number;
  encounter_id?: number;
  date_issued?: string;
  status?: string;
  intent?: string;
  priority?: string;
  do_not_perform?: boolean;
  medication_reference?: string;
  medication_codeable_concept?: Record<string, unknown>;
  subject_reference?: string;
  encounter_reference?: string;
  authored_on?: string;
  requester_reference?: string;
  performer_reference?: string;
  dosage_instruction?: Record<string, unknown> | Record<string, unknown>[];
  dispense_request_number_of_repeats?: number;
  dispense_request_quantity_value?: number;
  dispense_request_quantity_unit?: string;
  dispense_request_expected_supply_duration?: string;
  dispense_request_validity_period_start?: string;
  dispense_request_validity_period_end?: string;
  substitution_allowed_boolean?: boolean;
  fhir_note?: string;
  reason_code?: Record<string, unknown>;
  category_display?: string;
  status_reason_display?: string;
  // Linked medication (resolved from medication_reference or junction table)
  medication?: Medication;
  medications?: Medication[];
  // Audit
  created_by?: number;
  created_dt?: string;
  modified_by?: number;
  modified_dt?: string;
  version?: number;
}

// ---------- Medication (swrinnov_clinic_ehr15.medications) ----------
export interface Medication {
  id?: string;
  medication_id: string;
  fhir_id?: string;
  medication_name: string;
  instructions?: string;
  dosage?: string;
  frequency?: string;
  side_effects?: string;
  status?: string;
  code_code?: string;
  code_display?: string;
  dose_form_display?: string;
  total_volume_value?: number;
  total_volume_unit?: string;
  ndc_code?: string;
  rxnorm_code?: string;
  snomed_code?: string;
  generic_name?: string;
  brand_name?: string;
  therapeutic_class?: string;
  controlled_substance_schedule?: string;
  requires_prior_auth?: boolean;
  batch_lot_number?: string;
  batch_expiration_date?: string;
}

// ---------- Lab Result (swrinnov_clinic_ehr15.labresults) ----------
export interface LabResult extends BaseRecord {
  lab_examination_id: string;
  fhir_id?: string;
  bill_id?: string;
  patient_id?: string;
  encounter_id?: number;
  test_type?: string;
  test_date?: string;
  test_facility?: string;
  result_value?: string;
  result_unit?: string;
  reference_range?: string;
  result_interpretation?: string;
  status?: string;
  code_code?: string;
  code_display?: string;
  loinc_code?: string;
  cpt_code?: string;
  performing_lab?: string;
  ordering_provider_reference?: string;
  conclusion?: string;
  critical_flag?: boolean;
  critical_value_notified?: boolean;
  specimen_type_display?: string;
  performer_display?: string;
  category_display?: string;
  fhir_note?: string;
  // Audit
  created_by?: number;
  created_dt?: string;
  modified_by?: number;
  modified_dt?: string;
  version?: number;
}

// ---------- Surgery / Procedure (swrinnov_clinic_ehr15.surgery) ----------
export interface Surgery extends BaseRecord {
  surgery_id: string;
  fhir_id?: string;
  patient_id?: string;
  encounter_id?: number;
  surgery_date?: string;
  surgery_type?: string;
  surgery_desc?: string;
  surgery_facility?: string;
  status?: string;
  code_code?: string;
  code_display?: string;
  cpt_code?: string;
  icd10_pcs_code?: string;
  anesthesia_type?: string;
  estimated_blood_loss_ml?: number;
  surgery_duration_minutes?: number;
  performed_datetime?: string;
  performed_period_start?: string;
  performed_period_end?: string;
  body_site_display?: string;
  outcome_code?: string;
  outcome_display?: string;
  performer_display?: string;
  category_display?: string;
  reason_display?: string;
  complication_display?: string;
  followup_display?: string;
  fhir_note?: string;
  recorder_reference?: string;
  // Audit
  created_by?: number;
  created_dt?: string;
  modified_by?: number;
  modified_dt?: string;
  version?: number;
}

// ---------- Vitals ----------
// ---------- Vitals (swrinnov_clinic_ehr15.vitals) ----------
export interface Vital extends BaseRecord {
  vitals_id?: number;
  fhir_id?: string;
  patient_id: string;
  encounter_id?: string;
  recorded_by?: string;
  recorded_at?: string;

  // ── Core vitals ──
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  pulse_pressure?: number;
  body_temperature?: number; // decimal(4,2)
  SpO2?: number; // oxygen saturation %
  heart_rate?: number;
  peak_flow_measurement?: number; // decimal(5,2)
  weight?: number; // decimal(5,2)
  height?: number; // decimal(4,2)
  date_recorded?: string; // date
  time_recorded?: string; // time
  respiratory_rate?: number;
  pain_scale?: number; // 0-10
  body_mass_index?: number; // decimal(4,2)

  // ── Body composition ──
  fat?: number; // decimal(4,2) %
  water?: number; // decimal(4,2) %
  bone_mass?: number; // decimal(4,2)
  muscle_mass?: number; // decimal(4,2)
  protein?: number; // decimal(4,2)
  body_type?: string; // varchar(50)
  metabolic_age?: number;
  impedance?: number;
  basal_metabolism?: number; // decimal(4,2)
  visceral_fat?: number; // decimal(4,2)
  waist_circumference?: number; // decimal(5,2)

  // ── Additional measurements ──
  blood_glucose_levels?: number; // decimal(5,2)
  vision_test_result?: string; // varchar(50)
  hearing_test_result?: string; // varchar(50)
  ecg_result?: string; // text

  // ── FHIR observation metadata ──
  identifier_system?: string;
  identifier_value?: string;
  based_on_reference?: string;
  part_of_reference?: string;
  status?: string; // 'final' | 'registered' | 'preliminary' | 'amended'
  category_code?: string;
  category_system?: string;
  category_display?: string;
  code_system?: string;
  code_code?: string;
  code_display?: string;
  subject_reference?: string;
  focus_reference?: unknown;
  encounter_reference?: string;
  effective_datetime?: string;
  effective_period_start?: string;
  effective_period_end?: string;
  issued?: string;
  performer_reference?: unknown;
  data_absent_reason_code?: string;
  data_absent_reason_display?: string;
  interpretation_code?: string;
  interpretation_system?: string;
  interpretation_display?: string;
  note?: string;
  body_site_code?: string;
  body_site_system?: string;
  body_site_display?: string;
  method_code?: string;
  method_system?: string;
  method_display?: string;
  device_reference?: string;
  reference_range_low?: number;
  reference_range_high?: number;
  reference_range_type?: string;
  reference_range_text?: string;
  has_member?: unknown;
  derived_from?: unknown;
  component?: unknown;
  meta_version_id?: number;
  meta_last_updated?: string;
  extensions?: unknown;

  // ── LOINC codes ──
  systolic_loinc?: string; // default '8480-6'
  diastolic_loinc?: string; // default '8462-4'
  heart_rate_loinc?: string; // default '8867-4'
  temperature_loinc?: string; // default '8310-5'
  respiratory_rate_loinc?: string; // default '9279-1'
  oxygen_saturation_loinc?: string; // default '2708-6'
  bmi_loinc?: string; // default '39156-5'
  height_loinc?: string; // default '8302-2'
  weight_loinc?: string; // default '29463-7'

  // ── Backward-compat aliases (used in existing UI code) ──
  systolic_bp?: number;
  diastolic_bp?: number;
  temperature?: number;
  temperature_unit?: 'F' | 'C';
  oxygen_saturation?: number;
  bmi?: number;
  pain_level?: number;
  notes?: string;

  // ── Audit ──
  created_by?: number;
  created_dt?: string;
  modified_by?: number;
  modified_dt?: string;
  version?: number;
}

// ---------- Problem List (Conditions) ----------
export interface Condition extends BaseRecord {
  patient_id: string;
  code: string; // ICD-10
  display: string;
  category: 'problem-list-item' | 'encounter-diagnosis';
  clinical_status:
    | 'active'
    | 'recurrence'
    | 'relapse'
    | 'inactive'
    | 'remission'
    | 'resolved';
  verification_status:
    | 'confirmed'
    | 'unconfirmed'
    | 'provisional'
    | 'differential'
    | 'refuted';
  severity?: 'mild' | 'moderate' | 'severe';
  onset_date?: string;
  abatement_date?: string;
  recorded_by?: string;
  notes?: string;
}

// ---------- Clinical Impression (Chart Notes) ----------
export interface ClinicalImpression extends BaseRecord {
  encounter_id: string;
  patient_id: string;
  provider_id: string;
  provider_name?: string;
  status: 'draft' | 'completed' | 'entered-in-error';
  summary: string;
  finding?: string;
  assessment?: string;
  plan?: string;
  signed_at?: string;
  signed_by?: string;
}

// ---------- Tasks ----------
export interface Task extends BaseRecord {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  assigned_to_name?: string;
  requester_id?: string;
  requester_name?: string;
  patient_id?: string;
  patient_name?: string;
  encounter_id?: string;
  due_date?: string;
  completed_at?: string;
  category?: string;
}

export type TaskStatus =
  | 'draft'
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type TaskPriority = 'routine' | 'urgent' | 'asap' | 'stat';

// ---------- Appointments / Scheduling ----------
export interface Appointment extends BaseRecord {
  patient_id: string;
  patient_name?: string;
  provider_id: string;
  provider_name?: string;
  status: AppointmentStatus;
  appointment_type: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  reason?: string;
  notes?: string;
  location?: string;
}

export type AppointmentStatus =
  | 'proposed'
  | 'pending'
  | 'booked'
  | 'arrived'
  | 'checked_in'
  | 'fulfilled'
  | 'cancelled'
  | 'noshow';

// ---------- Audit ----------
// (moved above)

// ---------- API / Pagination ----------
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// ---------- Patient Files ----------
export type VirusScanStatus =
  | 'pending'
  | 'clean'
  | 'infected'
  | 'error'
  | 'disabled';

export interface PatientFile {
  id: string;
  filename: string;
  path: string | null;
  content_type: string | null;
  size: number | null;
  detail: Record<string, unknown> | null;
  credential: Record<string, unknown> | null;
  download_url: string | null;
  virus_scan_status: VirusScanStatus;
  is_quarantined: boolean;
  quarantine_reason: string | null;
  encounter_id: string | null;
  patient_id: string | null;
  appointment_name: string | null;
  upload_source: string | null;
  document_type_label: string | null;
  created_at: string | null;
}

export interface UploadInitResult {
  upload_id: string;
  chunk_size: number;
}

export interface UploadChunkResult {
  upload_id: string;
  chunk_index: number;
}

export interface VirusScannerHealth {
  status: string;
  message: string | null;
  scanner: string | null;
  enabled: boolean;
}
