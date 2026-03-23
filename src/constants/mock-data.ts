// =============================================================================
// Vedi EHR - Mock Data Store (All 12 Modules)
// =============================================================================
// Production-quality mock data for development without a backend
// =============================================================================

import type {
  User,
  Patient,
  Encounter,
  Recording,
  Appointment,
  Order,
  LabResult,
  Prescription,
  Medication,
  Claim,
  ClaimLineItem,
  Message,
  Notification,
  Task,
  Report,
  Provider,
  AuditEntry,
  SystemSetting,
  TelehealthSession,
  Vital,
  Allergy,
  Diagnosis,
  SOAPNote,
  InsuranceInfo,
  Condition,
  Referral,
  DashboardStats,
  DashboardAlert,
  RecentActivity,
  WaitlistEntry,
  Payment,
  FeeSchedule,
  FormTemplate,
  CodeSet,
  FaxEntry,
  EligibilityCheck
} from '@/types/ehr';

// ─── Users (5 Roles) ────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'usr-001',
    email: 'dr.sarah.chen@vedi.health',
    name: 'Dr. Sarah Chen',
    role: 'doctor',
    specialty: 'Internal Medicine',
    npi: '1234567890',
    department: 'Primary Care',
    phone: '(555) 100-0001',
    avatar_url: undefined,
    is_active: true,
    last_login: '2026-03-06T08:30:00Z',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2026-03-06T08:30:00Z'
  },
  {
    id: 'usr-002',
    email: 'dr.james.wilson@vedi.health',
    name: 'Dr. James Wilson',
    role: 'doctor',
    specialty: 'Cardiology',
    npi: '0987654321',
    department: 'Cardiology',
    phone: '(555) 100-0002',
    is_active: true,
    last_login: '2026-03-06T07:45:00Z',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2026-03-06T07:45:00Z'
  },
  {
    id: 'usr-003',
    email: 'nurse.maria.garcia@vedi.health',
    name: 'Maria Garcia, RN',
    role: 'nurse',
    department: 'Primary Care',
    phone: '(555) 100-0003',
    is_active: true,
    last_login: '2026-03-06T07:00:00Z',
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2026-03-06T07:00:00Z'
  },
  {
    id: 'usr-004',
    email: 'admin@vedi.health',
    name: 'Patricia Adams',
    role: 'admin',
    department: 'Administration',
    phone: '(555) 100-0004',
    is_active: true,
    last_login: '2026-03-06T06:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2026-03-06T06:00:00Z'
  },
  {
    id: 'usr-005',
    email: 'billing@vedi.health',
    name: 'Robert Thompson',
    role: 'biller',
    department: 'Billing',
    phone: '(555) 100-0005',
    is_active: true,
    last_login: '2026-03-05T16:00:00Z',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2026-03-05T16:00:00Z'
  },
  {
    id: 'usr-006',
    email: 'frontdesk@vedi.health',
    name: 'Jessica Martinez',
    role: 'front_desk',
    department: 'Front Office',
    phone: '(555) 100-0006',
    is_active: true,
    last_login: '2026-03-06T07:30:00Z',
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2026-03-06T07:30:00Z'
  }
];

// ─── Patients ────────────────────────────────────────────────────────────────

const MOCK_ALLERGIES: Allergy[][] = [
  [
    {
      id: 'alg-1',
      substance: 'Penicillin',
      reaction: 'Rash, Hives',
      severity: 'moderate',
      status: 'active',
      onset_date: '2015-06-01'
    },
    {
      id: 'alg-2',
      substance: 'Sulfa drugs',
      reaction: 'Difficulty breathing',
      severity: 'severe',
      status: 'active',
      onset_date: '2018-03-15'
    }
  ],
  [
    {
      id: 'alg-3',
      substance: 'Latex',
      reaction: 'Contact dermatitis',
      severity: 'mild',
      status: 'active',
      onset_date: '2020-01-01'
    }
  ],
  [],
  [
    {
      id: 'alg-4',
      substance: 'Codeine',
      reaction: 'Nausea, vomiting',
      severity: 'moderate',
      status: 'active',
      onset_date: '2019-07-22'
    }
  ],
  [
    {
      id: 'alg-5',
      substance: 'Aspirin',
      reaction: 'GI bleeding',
      severity: 'severe',
      status: 'active',
      onset_date: '2017-11-03'
    },
    {
      id: 'alg-6',
      substance: 'Ibuprofen',
      reaction: 'GI upset',
      severity: 'moderate',
      status: 'active',
      onset_date: '2017-11-03'
    }
  ]
];

const MOCK_INSURANCE: InsuranceInfo[][] = [
  [
    {
      id: 'ins-1',
      type: 'primary',
      payer_name: 'Blue Cross Blue Shield',
      payer_id: 'BCBS001',
      plan_name: 'PPO Gold',
      member_id: 'XWB943817264',
      group_number: 'GRP-7721',
      subscriber_name: 'John Smith',
      subscriber_relationship: 'self',
      effective_date: '2025-01-01',
      copay_amount: 30,
      deductible: 1500,
      deductible_met: 750,
      is_active: true,
      verified: true,
      verified_date: '2026-03-01'
    }
  ],
  [
    {
      id: 'ins-2',
      type: 'primary',
      payer_name: 'Aetna',
      payer_id: 'AET001',
      plan_name: 'HMO Standard',
      member_id: 'AET-887654',
      group_number: 'GRP-4412',
      subscriber_name: 'Emily Johnson',
      subscriber_relationship: 'self',
      effective_date: '2025-01-01',
      copay_amount: 25,
      deductible: 2000,
      deductible_met: 500,
      is_active: true,
      verified: true,
      verified_date: '2026-02-28'
    }
  ],
  [
    {
      id: 'ins-3',
      type: 'primary',
      payer_name: 'UnitedHealthcare',
      payer_id: 'UHC001',
      plan_name: 'Choice Plus',
      member_id: 'UHC-112233',
      group_number: 'GRP-9901',
      subscriber_name: 'Michael Brown',
      subscriber_relationship: 'self',
      effective_date: '2025-01-01',
      copay_amount: 40,
      deductible: 3000,
      deductible_met: 1200,
      is_active: true,
      verified: true,
      verified_date: '2026-03-05'
    }
  ],
  [
    {
      id: 'ins-4',
      type: 'primary',
      payer_name: 'Cigna',
      payer_id: 'CIG001',
      plan_name: 'Open Access Plus',
      member_id: 'CIG-445566',
      group_number: 'GRP-3345',
      subscriber_name: 'Olivia Davis',
      subscriber_relationship: 'self',
      effective_date: '2025-06-01',
      copay_amount: 35,
      deductible: 1750,
      deductible_met: 900,
      is_active: true,
      verified: true,
      verified_date: '2026-03-02'
    }
  ],
  [
    {
      id: 'ins-5',
      type: 'primary',
      payer_name: 'Medicare',
      payer_id: 'MED001',
      plan_name: 'Part B',
      member_id: '1EG4-TE5-MK72',
      subscriber_name: 'Robert Wilson',
      subscriber_relationship: 'self',
      effective_date: '2023-01-01',
      copay_amount: 0,
      deductible: 240,
      deductible_met: 240,
      is_active: true,
      verified: true,
      verified_date: '2026-01-15'
    }
  ]
];

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    mrn: 'MRN-100001',
    first_name: 'John',
    last_name: 'Smith',
    middle_name: 'Robert',
    name_prefix: 'Mr.',
    age: 41,
    date_of_birth: '1985-03-15',
    gender: 'male',
    birth_sex: 'male',
    phone: '(555) 200-0001',
    mobile_phone: '(555) 200-1001',
    email: 'john.smith@email.com',
    status: 'active',
    ssn_last_four: '4532',
    id_number: 'DL-TX-8501234',
    race: 'Caucasian',
    ethnicity: 'Non-Hispanic',
    eye_color: 'Brown',
    height: '5\'11"',
    weight: '185 lbs',
    marital_status: 'married',
    speaking_language: 'English',
    suppose_name: 'Jane Smith',
    other_family_member_seen: 'Jane Smith (pat-009)',
    occupation: 'Software Engineer',
    employment_status: 'Full-time',
    employer: 'Dell Technologies',
    employer_phone: '(512) 338-4400',
    referring_physician: 'Dr. Michael Torres',
    hipaa_consent_given: true,
    address: {
      line1: '123 Main St',
      line2: 'Apt 4B',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
      country: 'US'
    },
    emergency_contact: {
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '(555) 200-0002'
    },
    primary_provider_id: 'usr-001',
    primary_provider_name: 'Dr. Sarah Chen',
    insurance: MOCK_INSURANCE[0],
    allergies: MOCK_ALLERGIES[0],
    insurance_group: 'GRP-88421',
    insurance_name: 'Blue Cross Blue Shield',
    insurance_number: 'BCBS-100001',
    advance_directives: true,
    preferred_language: 'English',
    preferred_pharmacy: 'CVS Pharmacy - Congress Ave',
    last_visit_date: '2026-02-28',
    next_appointment_date: '2026-03-10',
    tags: ['diabetes', 'hypertension'],
    lifestyle_and_habits: {
      id: 'lh-001',
      patient_id: 'pat-001',
      smoking_status: 'former',
      tobacco_type: 'cigarettes',
      packs_per_day: 0,
      pack_years: 5,
      ready_to_quit: false,
      alcohol_status: 'current',
      alcohol_drinks_per_week: 3,
      audit_c_score: 2,
      recreational_drugs: false,
      iv_drug_use: false,
      naloxone_prescribed: false,
      exercise_frequency: '3-4 times/week',
      exercise_minutes_per_week: 150,
      exercise_type: 'Running, Weight Training',
      diet_type: 'Balanced',
      dietary_restrictions: 'None',
      caffeine_use: '2 cups coffee/day',
      sleep_hours_per_night: 7,
      sleep_quality: 'good',
      education_level: "Bachelor's Degree",
      living_situation: 'Lives with spouse',
      social_support: 'Strong',
      transportation_access: true,
      food_security: true,
      sexually_active: true,
      social_history_notes:
        'Active lifestyle; manages diabetes well with diet and exercise.'
    },
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2026-02-28T00:00:00Z'
  },
  {
    id: 'pat-002',
    mrn: 'MRN-100002',
    first_name: 'Emily',
    last_name: 'Johnson',
    middle_name: 'Grace',
    name_prefix: 'Ms.',
    age: 33,
    date_of_birth: '1992-07-22',
    gender: 'female',
    birth_sex: 'female',
    phone: '(555) 200-0003',
    mobile_phone: '(555) 200-1003',
    email: 'emily.j@email.com',
    status: 'active',
    ssn_last_four: '7891',
    id_number: 'DL-TX-9207654',
    race: 'Caucasian',
    ethnicity: 'Non-Hispanic',
    eye_color: 'Blue',
    height: '5\'6"',
    weight: '140 lbs',
    marital_status: 'single',
    speaking_language: 'English',
    occupation: 'Teacher',
    employment_status: 'Full-time',
    employer: 'Austin ISD',
    employer_phone: '(512) 414-1700',
    hipaa_consent_given: true,
    address: {
      line1: '456 Oak Ave',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
      country: 'US'
    },
    emergency_contact: {
      name: 'Mark Johnson',
      relationship: 'Brother',
      phone: '(555) 200-0004'
    },
    primary_provider_id: 'usr-001',
    primary_provider_name: 'Dr. Sarah Chen',
    insurance: MOCK_INSURANCE[1],
    allergies: MOCK_ALLERGIES[1],
    insurance_group: 'GRP-55210',
    insurance_name: 'Aetna',
    insurance_number: 'AET-200002',
    advance_directives: false,
    preferred_language: 'English',
    last_visit_date: '2026-03-01',
    next_appointment_date: '2026-03-07',
    tags: ['asthma'],
    lifestyle_and_habits: {
      id: 'lh-002',
      patient_id: 'pat-002',
      smoking_status: 'never',
      packs_per_day: 0,
      pack_years: 0,
      ready_to_quit: false,
      alcohol_status: 'current',
      alcohol_drinks_per_week: 1,
      audit_c_score: 0,
      recreational_drugs: false,
      iv_drug_use: false,
      naloxone_prescribed: false,
      exercise_frequency: '5+ times/week',
      exercise_minutes_per_week: 200,
      exercise_type: 'Yoga, Hiking',
      diet_type: 'Vegetarian',
      dietary_restrictions: 'Dairy-free',
      caffeine_use: '1 cup tea/day',
      sleep_hours_per_night: 8,
      sleep_quality: 'good',
      education_level: "Master's Degree",
      living_situation: 'Lives alone',
      social_support: 'Moderate',
      transportation_access: true,
      food_security: true,
      sexually_active: false,
      social_history_notes:
        'Health-conscious; well-controlled asthma with inhaler PRN.'
    },
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'pat-003',
    mrn: 'MRN-100003',
    first_name: 'Michael',
    last_name: 'Brown',
    middle_name: 'James',
    name_prefix: 'Mr.',
    age: 47,
    date_of_birth: '1978-11-08',
    gender: 'male',
    birth_sex: 'male',
    phone: '(555) 200-0005',
    mobile_phone: '(555) 200-1005',
    email: 'm.brown@email.com',
    status: 'active',
    ssn_last_four: '3215',
    id_number: 'DL-TX-7811987',
    race: 'African American',
    ethnicity: 'Non-Hispanic',
    eye_color: 'Brown',
    height: '6\'1"',
    weight: '210 lbs',
    marital_status: 'married',
    speaking_language: 'English',
    suppose_name: 'Lisa Brown',
    occupation: 'Electrician',
    employment_status: 'Full-time',
    employer: 'City of Round Rock',
    employer_phone: '(512) 218-5400',
    hipaa_consent_given: true,
    address: {
      line1: '789 Elm Dr',
      city: 'Round Rock',
      state: 'TX',
      zip: '78665',
      country: 'US'
    },
    emergency_contact: {
      name: 'Lisa Brown',
      relationship: 'Spouse',
      phone: '(555) 200-0006'
    },
    primary_provider_id: 'usr-002',
    primary_provider_name: 'Dr. James Wilson',
    insurance: MOCK_INSURANCE[2],
    allergies: MOCK_ALLERGIES[2],
    insurance_group: 'GRP-33102',
    insurance_name: 'Cigna',
    insurance_number: 'CIG-300003',
    advance_directives: true,
    preferred_language: 'English',
    last_visit_date: '2026-02-20',
    next_appointment_date: '2026-03-12',
    tags: ['coronary_artery_disease', 'hyperlipidemia'],
    lifestyle_and_habits: {
      id: 'lh-003',
      patient_id: 'pat-003',
      smoking_status: 'current',
      tobacco_type: 'cigarettes',
      packs_per_day: 0.5,
      pack_years: 15,
      ready_to_quit: true,
      alcohol_status: 'current',
      alcohol_drinks_per_week: 7,
      audit_c_score: 4,
      recreational_drugs: false,
      iv_drug_use: false,
      naloxone_prescribed: false,
      exercise_frequency: '1-2 times/week',
      exercise_minutes_per_week: 60,
      exercise_type: 'Walking',
      diet_type: 'Standard American',
      dietary_restrictions: 'Low sodium (cardiac)',
      caffeine_use: '3 cups coffee/day',
      sleep_hours_per_night: 6,
      sleep_quality: 'fair',
      education_level: 'Trade/Vocational',
      living_situation: 'Lives with spouse and children',
      social_support: 'Strong',
      transportation_access: true,
      food_security: true,
      sexually_active: true,
      social_history_notes:
        'Current smoker counseled on cessation at every visit. CAD follow-up quarterly.'
    },
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2026-02-20T00:00:00Z'
  },
  {
    id: 'pat-004',
    mrn: 'MRN-100004',
    first_name: 'Olivia',
    last_name: 'Davis',
    date_of_birth: '1990-04-30',
    gender: 'female',
    phone: '(555) 200-0007',
    email: 'olivia.davis@email.com',
    status: 'active',
    address: {
      line1: '321 Pine Ln',
      city: 'Cedar Park',
      state: 'TX',
      zip: '78613',
      country: 'US'
    },
    emergency_contact: {
      name: 'Thomas Davis',
      relationship: 'Father',
      phone: '(555) 200-0008'
    },
    primary_provider_id: 'usr-001',
    primary_provider_name: 'Dr. Sarah Chen',
    insurance: MOCK_INSURANCE[3],
    allergies: MOCK_ALLERGIES[3],
    advance_directives: false,
    preferred_language: 'English',
    last_visit_date: '2026-03-04',
    next_appointment_date: '2026-03-15',
    tags: ['migraine', 'anxiety'],
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2026-03-04T00:00:00Z'
  },
  {
    id: 'pat-005',
    mrn: 'MRN-100005',
    first_name: 'Robert',
    last_name: 'Wilson',
    middle_name: 'Edward',
    name_prefix: 'Mr.',
    age: 70,
    date_of_birth: '1955-09-12',
    gender: 'male',
    birth_sex: 'male',
    phone: '(555) 200-0009',
    mobile_phone: '(555) 200-1009',
    email: 'r.wilson@email.com',
    status: 'active',
    ssn_last_four: '6789',
    id_number: 'DL-TX-5509876',
    race: 'Caucasian',
    ethnicity: 'Non-Hispanic',
    eye_color: 'Green',
    height: '5\'10"',
    weight: '220 lbs',
    marital_status: 'married',
    speaking_language: 'English',
    suppose_name: 'Margaret Wilson',
    occupation: 'Retired',
    employment_status: 'Retired',
    hipaa_consent_given: true,
    address: {
      line1: '555 Maple Rd',
      city: 'Georgetown',
      state: 'TX',
      zip: '78626',
      country: 'US'
    },
    emergency_contact: {
      name: 'Margaret Wilson',
      relationship: 'Spouse',
      phone: '(555) 200-0010'
    },
    primary_provider_id: 'usr-002',
    primary_provider_name: 'Dr. James Wilson',
    insurance: MOCK_INSURANCE[4],
    allergies: MOCK_ALLERGIES[4],
    insurance_group: 'GRP-MED-001',
    insurance_name: 'Medicare Part B',
    insurance_number: 'MED-500005',
    advance_directives: true,
    preferred_language: 'English',
    preferred_pharmacy: 'Walgreens - University Blvd',
    last_visit_date: '2026-03-05',
    next_appointment_date: '2026-03-08',
    tags: ['chf', 'afib', 'copd'],
    lifestyle_and_habits: {
      id: 'lh-005',
      patient_id: 'pat-005',
      smoking_status: 'former',
      tobacco_type: 'cigarettes',
      packs_per_day: 0,
      pack_years: 30,
      ready_to_quit: false,
      alcohol_status: 'never',
      alcohol_drinks_per_week: 0,
      audit_c_score: 0,
      recreational_drugs: false,
      iv_drug_use: false,
      naloxone_prescribed: false,
      exercise_frequency: 'daily',
      exercise_minutes_per_week: 120,
      exercise_type: 'Walking, Light Stretching',
      diet_type: 'Low sodium cardiac diet',
      dietary_restrictions: 'Low sodium, low fat',
      caffeine_use: 'Decaf only',
      sleep_hours_per_night: 6,
      sleep_quality: 'poor',
      education_level: 'Associate Degree',
      living_situation: 'Lives with spouse',
      social_support: 'Strong',
      transportation_access: true,
      food_security: true,
      sexually_active: false,
      social_history_notes:
        '30-pack-year smoking history; quit 5 years ago. CHF managed with diuretics. Uses CPAP for sleep apnea.'
    },
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z'
  },
  {
    id: 'pat-006',
    mrn: 'MRN-100006',
    first_name: 'Sophia',
    last_name: 'Martinez',
    date_of_birth: '1998-12-05',
    gender: 'female',
    phone: '(555) 200-0011',
    email: 'sophia.m@email.com',
    status: 'active',
    address: {
      line1: '777 Cedar St',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
      country: 'US'
    },
    emergency_contact: {
      name: 'Carlos Martinez',
      relationship: 'Father',
      phone: '(555) 200-0012'
    },
    primary_provider_id: 'usr-001',
    primary_provider_name: 'Dr. Sarah Chen',
    insurance: MOCK_INSURANCE[0],
    allergies: [],
    advance_directives: false,
    preferred_language: 'Spanish',
    last_visit_date: '2026-02-15',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z'
  },
  {
    id: 'pat-007',
    mrn: 'MRN-100007',
    first_name: 'William',
    last_name: 'Anderson',
    date_of_birth: '1968-06-18',
    gender: 'male',
    phone: '(555) 200-0013',
    email: 'w.anderson@email.com',
    status: 'active',
    address: {
      line1: '999 Birch Blvd',
      city: 'Pflugerville',
      state: 'TX',
      zip: '78660',
      country: 'US'
    },
    emergency_contact: {
      name: 'Karen Anderson',
      relationship: 'Spouse',
      phone: '(555) 200-0014'
    },
    primary_provider_id: 'usr-002',
    primary_provider_name: 'Dr. James Wilson',
    insurance: MOCK_INSURANCE[2],
    allergies: MOCK_ALLERGIES[0],
    advance_directives: true,
    preferred_language: 'English',
    last_visit_date: '2026-01-30',
    tags: ['hypertension', 'sleep_apnea'],
    created_at: '2023-09-01T00:00:00Z',
    updated_at: '2026-01-30T00:00:00Z'
  },
  {
    id: 'pat-008',
    mrn: 'MRN-100008',
    first_name: 'Isabella',
    last_name: 'Thomas',
    date_of_birth: '2001-08-25',
    gender: 'female',
    phone: '(555) 200-0015',
    email: 'isabella.t@email.com',
    status: 'active',
    address: {
      line1: '111 Willow Way',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
      country: 'US'
    },
    emergency_contact: {
      name: 'David Thomas',
      relationship: 'Father',
      phone: '(555) 200-0016'
    },
    primary_provider_id: 'usr-001',
    primary_provider_name: 'Dr. Sarah Chen',
    insurance: MOCK_INSURANCE[1],
    allergies: [],
    advance_directives: false,
    preferred_language: 'English',
    last_visit_date: '2026-03-06',
    tags: ['depression'],
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2026-03-06T00:00:00Z'
  }
];

// ─── Encounters ──────────────────────────────────────────────────────────────

export const MOCK_ENCOUNTERS: Encounter[] = [
  {
    id: 'enc-001',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'office_visit',
    status: 'completed',
    chief_complaint: 'Follow-up for diabetes management',
    date: '2026-02-28',
    start_time: '09:00',
    end_time: '09:30',
    duration_minutes: 30,
    location: 'Room 3',
    soap_note: {
      subjective:
        'Patient reports blood sugar levels have been well-controlled. Occasional morning highs around 160 mg/dL. No hypoglycemic episodes. Adherent to metformin regimen.',
      objective:
        'BP 128/82, HR 72, Temp 98.4F, SpO2 98%. Weight 185 lbs (stable). A1c 7.1% (improved from 7.8%). Foot exam: no ulcers, pulses palpable.',
      assessment:
        'Type 2 Diabetes Mellitus - improving control. Hypertension - at goal.',
      plan: 'Continue metformin 1000mg BID. Add morning walk 30 min. Recheck A1c in 3 months. Continue lisinopril 10mg daily. Follow up in 3 months.',
      ai_generated: false,
      reviewed_by_provider: true
    },
    vitals: [],
    diagnoses: [
      {
        id: 'dx-1',
        icd10_code: 'E11.65',
        description: 'Type 2 DM with hyperglycemia',
        type: 'primary',
        status: 'active'
      },
      {
        id: 'dx-2',
        icd10_code: 'I10',
        description: 'Essential hypertension',
        type: 'secondary',
        status: 'active'
      }
    ],
    orders: ['ord-001'],
    prescriptions: ['rx-001'],
    referrals: [],
    recording_ids: ['rec-001'],
    billing_codes: [
      {
        code: '99214',
        type: 'CPT',
        description: 'Office visit, moderate complexity',
        units: 1,
        amount: 175
      }
    ],
    signed_by: 'Dr. Sarah Chen',
    signed_at: '2026-02-28T10:00:00Z',
    locked_at: '2026-02-28T10:05:00Z',
    locked_by: 'Dr. Sarah Chen',
    created_at: '2026-02-28T09:00:00Z',
    updated_at: '2026-02-28T10:05:00Z'
  },
  {
    id: 'enc-002',
    patient_id: 'pat-002',
    patient_name: 'Emily Johnson',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'office_visit',
    status: 'signed',
    chief_complaint: 'Persistent cough for 2 weeks',
    date: '2026-03-01',
    start_time: '10:00',
    end_time: '10:25',
    duration_minutes: 25,
    location: 'Room 1',
    soap_note: {
      subjective:
        'Patient presents with persistent dry cough for 2 weeks. Worse at night. No fever, no shortness of breath at rest. History of asthma, uses albuterol PRN.',
      objective:
        'BP 118/74, HR 68, Temp 98.6F, SpO2 99%. Lungs: mild expiratory wheezing bilateral. No accessory muscle use. Throat: mild erythema.',
      assessment:
        'Acute asthma exacerbation, likely viral trigger. Rule out post-nasal drip.',
      plan: 'Start fluticasone inhaler 110mcg BID for 4 weeks. Continue albuterol PRN. Chest X-ray if not improved in 1 week. Follow up in 2 weeks.',
      ai_generated: false,
      reviewed_by_provider: true
    },
    vitals: [],
    diagnoses: [
      {
        id: 'dx-3',
        icd10_code: 'J45.21',
        description: 'Mild intermittent asthma with acute exacerbation',
        type: 'primary',
        status: 'active'
      }
    ],
    orders: [],
    prescriptions: ['rx-002'],
    referrals: [],
    recording_ids: ['rec-002'],
    signed_by: 'Dr. Sarah Chen',
    signed_at: '2026-03-01T11:00:00Z',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T11:00:00Z'
  },
  {
    id: 'enc-003',
    patient_id: 'pat-003',
    patient_name: 'Michael Brown',
    provider_id: 'usr-002',
    provider_name: 'Dr. James Wilson',
    type: 'follow_up',
    status: 'in_progress',
    chief_complaint: 'Chest pain evaluation follow-up',
    date: '2026-03-06',
    start_time: '14:00',
    duration_minutes: 30,
    location: 'Room 5',
    diagnoses: [
      {
        id: 'dx-4',
        icd10_code: 'I25.10',
        description: 'Coronary artery disease',
        type: 'primary',
        status: 'active'
      },
      {
        id: 'dx-5',
        icd10_code: 'E78.5',
        description: 'Hyperlipidemia',
        type: 'secondary',
        status: 'active'
      }
    ],
    orders: ['ord-002'],
    prescriptions: [],
    referrals: [],
    recording_ids: [],
    created_at: '2026-03-06T14:00:00Z',
    updated_at: '2026-03-06T14:00:00Z'
  },
  {
    id: 'enc-004',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    provider_id: 'usr-002',
    provider_name: 'Dr. James Wilson',
    type: 'office_visit',
    status: 'completed',
    chief_complaint: 'CHF and COPD follow-up',
    date: '2026-03-05',
    start_time: '11:00',
    end_time: '11:40',
    duration_minutes: 40,
    location: 'Room 2',
    soap_note: {
      subjective:
        'Patient reports increasing shortness of breath with minimal exertion over past week. 3-pillow orthopnea. Weight gain of 4 lbs in 3 days. Taking all medications as prescribed.',
      objective:
        'BP 142/88, HR 88, RR 22, Temp 98.2F, SpO2 93% on RA. Weight 210 lbs (up 4 lbs). JVD present. Lungs: bilateral crackles at bases. Lower extremity edema 2+ bilateral. BNP elevated at 850 pg/mL.',
      assessment:
        'Acute exacerbation of congestive heart failure. COPD stable.',
      plan: 'Increase furosemide to 80mg daily x 5 days then recheck. Fluid restriction 1.5L/day. Daily weight monitoring. If SOB worsens or weight gain >2 lbs overnight, go to ER. Cardiologist follow-up this week. Continue tiotropium for COPD.',
      ai_generated: false,
      reviewed_by_provider: true
    },
    vitals: [],
    diagnoses: [
      {
        id: 'dx-6',
        icd10_code: 'I50.9',
        description: 'Heart failure, unspecified',
        type: 'primary',
        status: 'active'
      },
      {
        id: 'dx-7',
        icd10_code: 'J44.1',
        description: 'COPD with acute exacerbation',
        type: 'secondary',
        status: 'active'
      }
    ],
    orders: ['ord-003'],
    prescriptions: ['rx-003'],
    referrals: ['ref-001'],
    recording_ids: ['rec-003'],
    billing_codes: [
      {
        code: '99215',
        type: 'CPT',
        description: 'Office visit, high complexity',
        units: 1,
        amount: 250
      }
    ],
    signed_by: 'Dr. James Wilson',
    signed_at: '2026-03-05T12:00:00Z',
    locked_at: '2026-03-05T12:05:00Z',
    locked_by: 'Dr. James Wilson',
    created_at: '2026-03-05T11:00:00Z',
    updated_at: '2026-03-05T12:05:00Z'
  },
  {
    id: 'enc-005',
    patient_id: 'pat-004',
    patient_name: 'Olivia Davis',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'office_visit',
    status: 'completed',
    chief_complaint: 'Migraine management',
    date: '2026-03-04',
    start_time: '15:30',
    end_time: '16:00',
    duration_minutes: 30,
    location: 'Room 1',
    soap_note: {
      subjective:
        'Patient reports 4-5 migraines per month, lasting 4-8 hours each. Current sumatriptan helps but needs 2+ doses. Missing work 2 days/month. Anxiety well-controlled on sertraline.',
      objective:
        'BP 122/78, HR 74, Temp 98.6F. Neuro exam: CN II-XII intact. No focal deficits. Fundoscopic: no papilledema.',
      assessment:
        'Chronic migraine without aura, inadequately controlled. Generalized anxiety disorder - stable.',
      plan: 'Start topiramate 25mg daily, titrate to 50mg in 2 weeks. Continue sumatriptan PRN. Migraine diary. Refer to neurology if not improved in 6 weeks. Continue sertraline 50mg.',
      ai_generated: true,
      ai_confidence: 0.92,
      reviewed_by_provider: true
    },
    vitals: [],
    diagnoses: [
      {
        id: 'dx-8',
        icd10_code: 'G43.709',
        description: 'Chronic migraine without aura',
        type: 'primary',
        status: 'active'
      },
      {
        id: 'dx-9',
        icd10_code: 'F41.1',
        description: 'Generalized anxiety disorder',
        type: 'secondary',
        status: 'active'
      }
    ],
    orders: [],
    prescriptions: ['rx-004', 'rx-005'],
    referrals: [],
    recording_ids: ['rec-004'],
    signed_by: 'Dr. Sarah Chen',
    signed_at: '2026-03-04T16:30:00Z',
    created_at: '2026-03-04T15:30:00Z',
    updated_at: '2026-03-04T16:30:00Z'
  }
];

// ─── Appointments ────────────────────────────────────────────────────────────

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    patient_id: 'pat-002',
    patient_name: 'Emily Johnson',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'follow_up',
    status: 'confirmed',
    date: '2026-03-07',
    start_time: '09:00',
    end_time: '09:30',
    duration_minutes: 30,
    room: 'Room 1',
    reason: 'Asthma follow-up',
    insurance_verified: true,
    copay_amount: 25,
    copay_collected: false,
    is_recurring: false,
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z'
  },
  {
    id: 'apt-002',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    provider_id: 'usr-002',
    provider_name: 'Dr. James Wilson',
    type: 'urgent',
    status: 'scheduled',
    date: '2026-03-08',
    start_time: '10:00',
    end_time: '10:45',
    duration_minutes: 45,
    room: 'Room 2',
    reason: 'CHF follow-up - weight gain',
    insurance_verified: true,
    copay_amount: 0,
    copay_collected: true,
    is_recurring: false,
    created_at: '2026-03-05T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z'
  },
  {
    id: 'apt-003',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'follow_up',
    status: 'confirmed',
    date: '2026-03-10',
    start_time: '11:00',
    end_time: '11:30',
    duration_minutes: 30,
    room: 'Room 3',
    reason: 'Diabetes 3-month follow-up',
    insurance_verified: true,
    copay_amount: 30,
    copay_collected: false,
    is_recurring: true,
    recurrence_pattern: 'Every 3 months',
    created_at: '2026-02-28T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'apt-004',
    patient_id: 'pat-003',
    patient_name: 'Michael Brown',
    provider_id: 'usr-002',
    provider_name: 'Dr. James Wilson',
    type: 'follow_up',
    status: 'confirmed',
    date: '2026-03-12',
    start_time: '14:00',
    end_time: '14:30',
    duration_minutes: 30,
    room: 'Room 5',
    reason: 'Cardiac stress test results review',
    insurance_verified: true,
    copay_amount: 40,
    copay_collected: false,
    is_recurring: false,
    created_at: '2026-03-06T00:00:00Z',
    updated_at: '2026-03-06T00:00:00Z'
  },
  {
    id: 'apt-005',
    patient_id: 'pat-006',
    patient_name: 'Sophia Martinez',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'new_patient',
    status: 'scheduled',
    date: '2026-03-06',
    start_time: '14:30',
    end_time: '15:15',
    duration_minutes: 45,
    room: 'Room 1',
    reason: 'New patient annual physical',
    insurance_verified: false,
    copay_amount: 30,
    copay_collected: false,
    is_recurring: false,
    created_at: '2026-03-03T00:00:00Z',
    updated_at: '2026-03-03T00:00:00Z'
  },
  {
    id: 'apt-006',
    patient_id: 'pat-008',
    patient_name: 'Isabella Thomas',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'telehealth',
    status: 'confirmed',
    date: '2026-03-06',
    start_time: '16:00',
    end_time: '16:30',
    duration_minutes: 30,
    reason: 'Depression medication follow-up',
    insurance_verified: true,
    copay_amount: 25,
    copay_collected: false,
    is_recurring: false,
    telehealth_link: 'https://meet.vedi.health/room-006',
    created_at: '2026-03-02T00:00:00Z',
    updated_at: '2026-03-05T00:00:00Z'
  },
  {
    id: 'apt-007',
    patient_id: 'pat-004',
    patient_name: 'Olivia Davis',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'follow_up',
    status: 'confirmed',
    date: '2026-03-15',
    start_time: '10:00',
    end_time: '10:30',
    duration_minutes: 30,
    room: 'Room 3',
    reason: 'Migraine - topiramate titration check',
    insurance_verified: true,
    copay_amount: 35,
    copay_collected: false,
    is_recurring: false,
    created_at: '2026-03-04T00:00:00Z',
    updated_at: '2026-03-04T00:00:00Z'
  },
  {
    id: 'apt-008',
    patient_id: 'pat-007',
    patient_name: 'William Anderson',
    provider_id: 'usr-002',
    provider_name: 'Dr. James Wilson',
    type: 'annual_physical',
    status: 'scheduled',
    date: '2026-03-20',
    start_time: '09:00',
    end_time: '10:00',
    duration_minutes: 60,
    room: 'Room 4',
    reason: 'Annual physical exam',
    insurance_verified: false,
    copay_amount: 40,
    copay_collected: false,
    is_recurring: true,
    recurrence_pattern: 'Annually',
    created_at: '2026-02-15T00:00:00Z',
    updated_at: '2026-02-15T00:00:00Z'
  }
];

// ─── Recordings ──────────────────────────────────────────────────────────────

export const MOCK_RECORDINGS: Recording[] = [
  {
    id: 'rec-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    status: 'completed',
    duration_seconds: 1245,
    format: 'webm',
    sample_rate: 48000,
    channels: 1,
    consent_obtained: true,
    consent_timestamp: '2026-02-28T09:00:00Z',
    started_at: '2026-02-28T09:02:00Z',
    ended_at: '2026-02-28T09:22:45Z',
    transcript: {
      id: 'trx-001',
      recording_id: 'rec-001',
      segments: [
        {
          id: 'seg-1',
          speaker: 'doctor',
          speaker_name: 'Dr. Chen',
          text: 'Good morning John. How have your blood sugars been running?',
          start_time: 0,
          end_time: 4.5,
          confidence: 0.97
        },
        {
          id: 'seg-2',
          speaker: 'patient',
          speaker_name: 'John',
          text: "They've been pretty good actually. Mostly between 110 and 140 before meals. But I still get some morning highs around 160.",
          start_time: 5,
          end_time: 12,
          confidence: 0.95
        },
        {
          id: 'seg-3',
          speaker: 'doctor',
          speaker_name: 'Dr. Chen',
          text: "That's good improvement. Your A1c came back at 7.1, which is down from 7.8 last time. Are you having any low blood sugar episodes?",
          start_time: 12.5,
          end_time: 20,
          confidence: 0.96
        },
        {
          id: 'seg-4',
          speaker: 'patient',
          speaker_name: 'John',
          text: "No, no lows. I've been taking the metformin every morning and evening with food like you said.",
          start_time: 20.5,
          end_time: 26,
          confidence: 0.94
        }
      ],
      full_text:
        "Good morning John. How have your blood sugars been running? They've been pretty good actually...",
      language: 'en',
      confidence: 0.955,
      model: 'whisper-large-v3',
      processing_time_ms: 8500,
      word_count: 287,
      created_at: '2026-02-28T09:23:00Z'
    },
    created_at: '2026-02-28T09:00:00Z',
    updated_at: '2026-02-28T09:23:00Z'
  },
  {
    id: 'rec-002',
    encounter_id: 'enc-002',
    patient_id: 'pat-002',
    patient_name: 'Emily Johnson',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    status: 'completed',
    duration_seconds: 980,
    format: 'webm',
    sample_rate: 48000,
    channels: 1,
    consent_obtained: true,
    consent_timestamp: '2026-03-01T10:00:00Z',
    started_at: '2026-03-01T10:02:00Z',
    ended_at: '2026-03-01T10:18:20Z',
    created_at: '2026-03-01T10:00:00Z',
    updated_at: '2026-03-01T10:19:00Z'
  },
  {
    id: 'rec-003',
    encounter_id: 'enc-004',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    provider_id: 'usr-002',
    provider_name: 'Dr. James Wilson',
    status: 'completed',
    duration_seconds: 1580,
    format: 'webm',
    sample_rate: 48000,
    channels: 1,
    consent_obtained: true,
    consent_timestamp: '2026-03-05T11:00:00Z',
    started_at: '2026-03-05T11:02:00Z',
    ended_at: '2026-03-05T11:28:20Z',
    created_at: '2026-03-05T11:00:00Z',
    updated_at: '2026-03-05T11:29:00Z'
  },
  {
    id: 'rec-004',
    encounter_id: 'enc-005',
    patient_id: 'pat-004',
    patient_name: 'Olivia Davis',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    status: 'completed',
    duration_seconds: 1100,
    format: 'webm',
    sample_rate: 48000,
    channels: 1,
    consent_obtained: true,
    consent_timestamp: '2026-03-04T15:30:00Z',
    ai_soap_note: {
      subjective: 'Patient reports 4-5 migraines per month...',
      objective: 'BP 122/78, HR 74...',
      assessment: 'Chronic migraine without aura...',
      plan: 'Start topiramate 25mg daily...',
      ai_generated: true,
      ai_confidence: 0.92,
      reviewed_by_provider: true
    },
    started_at: '2026-03-04T15:32:00Z',
    ended_at: '2026-03-04T15:50:20Z',
    created_at: '2026-03-04T15:30:00Z',
    updated_at: '2026-03-04T15:51:00Z'
  }
];

// ─── Orders & Lab Results ────────────────────────────────────────────────────

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-001',
    encounter_id: 'enc-001',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    ordering_provider_id: 'usr-001',
    ordering_provider_name: 'Dr. Sarah Chen',
    type: 'lab',
    status: 'completed',
    priority: 'routine',
    code: '4548-4',
    description: 'Hemoglobin A1c',
    clinical_indication: 'Diabetes monitoring',
    diagnosis_codes: ['E11.65'],
    fasting_required: false,
    lab_name: 'Quest Diagnostics',
    results: [
      {
        id: 'lr-001',
        order_id: 'ord-001',
        test_name: 'Hemoglobin A1c',
        loinc_code: '4548-4',
        value: '7.1',
        unit: '%',
        reference_range: '4.0-5.6',
        flag: 'high',
        performed_at: '2026-02-27T00:00:00Z'
      },
      {
        id: 'lr-002',
        order_id: 'ord-001',
        test_name: 'Fasting Glucose',
        loinc_code: '1558-6',
        value: '142',
        unit: 'mg/dL',
        reference_range: '70-100',
        flag: 'high',
        performed_at: '2026-02-27T00:00:00Z'
      }
    ],
    result_received_at: '2026-02-27T14:00:00Z',
    created_at: '2026-02-20T00:00:00Z',
    updated_at: '2026-02-27T14:00:00Z'
  },
  {
    id: 'ord-002',
    encounter_id: 'enc-003',
    patient_id: 'pat-003',
    patient_name: 'Michael Brown',
    ordering_provider_id: 'usr-002',
    ordering_provider_name: 'Dr. James Wilson',
    type: 'lab',
    status: 'pending',
    priority: 'urgent',
    code: '24331-1',
    description: 'Lipid Panel',
    clinical_indication: 'Hyperlipidemia monitoring',
    diagnosis_codes: ['E78.5'],
    fasting_required: true,
    lab_name: 'Quest Diagnostics',
    created_at: '2026-03-06T14:30:00Z',
    updated_at: '2026-03-06T14:30:00Z'
  },
  {
    id: 'ord-003',
    encounter_id: 'enc-004',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    ordering_provider_id: 'usr-002',
    ordering_provider_name: 'Dr. James Wilson',
    type: 'lab',
    status: 'completed',
    priority: 'stat',
    code: '42637-9',
    description: 'BNP Panel',
    clinical_indication: 'Heart failure evaluation',
    diagnosis_codes: ['I50.9'],
    results: [
      {
        id: 'lr-003',
        order_id: 'ord-003',
        test_name: 'BNP',
        loinc_code: '42637-9',
        value: '850',
        unit: 'pg/mL',
        reference_range: '<100',
        flag: 'critical_high',
        performed_at: '2026-03-05T10:00:00Z'
      },
      {
        id: 'lr-004',
        order_id: 'ord-003',
        test_name: 'Creatinine',
        loinc_code: '2160-0',
        value: '1.4',
        unit: 'mg/dL',
        reference_range: '0.7-1.2',
        flag: 'high',
        performed_at: '2026-03-05T10:00:00Z'
      },
      {
        id: 'lr-005',
        order_id: 'ord-003',
        test_name: 'Potassium',
        loinc_code: '2823-3',
        value: '4.2',
        unit: 'mEq/L',
        reference_range: '3.5-5.0',
        flag: 'normal',
        performed_at: '2026-03-05T10:00:00Z'
      }
    ],
    result_received_at: '2026-03-05T11:00:00Z',
    created_at: '2026-03-05T09:00:00Z',
    updated_at: '2026-03-05T11:00:00Z'
  },
  {
    id: 'ord-004',
    patient_id: 'pat-003',
    patient_name: 'Michael Brown',
    ordering_provider_id: 'usr-002',
    ordering_provider_name: 'Dr. James Wilson',
    type: 'imaging',
    status: 'completed',
    priority: 'urgent',
    code: '71046',
    description: 'Chest X-Ray, 2 views',
    clinical_indication: 'Chest pain evaluation',
    diagnosis_codes: ['I25.10'],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-02T00:00:00Z'
  }
];

// ─── Prescriptions ───────────────────────────────────────────────────────────

export const MOCK_PRESCRIPTIONS: Prescription[] = [
  {
    id: 'rx-001',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    prescriber_id: 'usr-001',
    prescriber_name: 'Dr. Sarah Chen',
    encounter_id: 'enc-001',
    medication: {
      id: 'med-001',
      name: 'Metformin 1000mg',
      generic_name: 'Metformin HCl',
      brand_name: 'Glucophage',
      dose: '1000',
      dose_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      frequency: 'Twice daily',
      strength: '1000mg',
      rxnorm_code: '861004'
    },
    sig: 'Take 1 tablet by mouth twice daily with meals',
    quantity: 60,
    quantity_unit: 'tablets',
    days_supply: 30,
    refills_authorized: 5,
    refills_remaining: 4,
    dispense_as_written: false,
    pharmacy_name: 'CVS Pharmacy - Congress Ave',
    status: 'active',
    start_date: '2026-02-28',
    is_controlled: false,
    prior_authorization_required: false,
    created_at: '2026-02-28T10:00:00Z',
    updated_at: '2026-02-28T10:00:00Z'
  },
  {
    id: 'rx-002',
    patient_id: 'pat-002',
    patient_name: 'Emily Johnson',
    prescriber_id: 'usr-001',
    prescriber_name: 'Dr. Sarah Chen',
    encounter_id: 'enc-002',
    medication: {
      id: 'med-002',
      name: 'Fluticasone 110mcg',
      generic_name: 'Fluticasone Propionate',
      brand_name: 'Flovent',
      dose: '110',
      dose_unit: 'mcg',
      form: 'inhaler',
      route: 'inhalation',
      frequency: 'Twice daily',
      strength: '110mcg/actuation'
    },
    sig: 'Inhale 2 puffs twice daily. Rinse mouth after use.',
    quantity: 1,
    quantity_unit: 'inhaler',
    days_supply: 30,
    refills_authorized: 2,
    refills_remaining: 2,
    dispense_as_written: false,
    pharmacy_name: 'Walgreens - Lamar Blvd',
    status: 'active',
    start_date: '2026-03-01',
    end_date: '2026-03-29',
    is_controlled: false,
    prior_authorization_required: false,
    created_at: '2026-03-01T11:00:00Z',
    updated_at: '2026-03-01T11:00:00Z'
  },
  {
    id: 'rx-003',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    prescriber_id: 'usr-002',
    prescriber_name: 'Dr. James Wilson',
    encounter_id: 'enc-004',
    medication: {
      id: 'med-003',
      name: 'Furosemide 80mg',
      generic_name: 'Furosemide',
      brand_name: 'Lasix',
      dose: '80',
      dose_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      frequency: 'Once daily',
      strength: '80mg'
    },
    sig: 'Take 1 tablet by mouth once daily in the morning',
    quantity: 30,
    quantity_unit: 'tablets',
    days_supply: 30,
    refills_authorized: 3,
    refills_remaining: 3,
    dispense_as_written: false,
    pharmacy_name: 'Walgreens - University Blvd',
    status: 'active',
    start_date: '2026-03-05',
    is_controlled: false,
    prior_authorization_required: false,
    created_at: '2026-03-05T12:00:00Z',
    updated_at: '2026-03-05T12:00:00Z'
  },
  {
    id: 'rx-004',
    patient_id: 'pat-004',
    patient_name: 'Olivia Davis',
    prescriber_id: 'usr-001',
    prescriber_name: 'Dr. Sarah Chen',
    encounter_id: 'enc-005',
    medication: {
      id: 'med-004',
      name: 'Topiramate 25mg',
      generic_name: 'Topiramate',
      brand_name: 'Topamax',
      dose: '25',
      dose_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      frequency: 'Once daily',
      strength: '25mg'
    },
    sig: 'Take 1 tablet by mouth at bedtime. Increase to 50mg after 2 weeks.',
    quantity: 30,
    quantity_unit: 'tablets',
    days_supply: 30,
    refills_authorized: 2,
    refills_remaining: 2,
    dispense_as_written: false,
    pharmacy_name: 'CVS Pharmacy - Research Blvd',
    status: 'active',
    start_date: '2026-03-04',
    is_controlled: false,
    prior_authorization_required: false,
    created_at: '2026-03-04T16:30:00Z',
    updated_at: '2026-03-04T16:30:00Z'
  },
  {
    id: 'rx-005',
    patient_id: 'pat-004',
    patient_name: 'Olivia Davis',
    prescriber_id: 'usr-001',
    prescriber_name: 'Dr. Sarah Chen',
    medication: {
      id: 'med-005',
      name: 'Sertraline 50mg',
      generic_name: 'Sertraline HCl',
      brand_name: 'Zoloft',
      dose: '50',
      dose_unit: 'mg',
      form: 'tablet',
      route: 'oral',
      frequency: 'Once daily',
      strength: '50mg'
    },
    sig: 'Take 1 tablet by mouth once daily in the morning',
    quantity: 30,
    quantity_unit: 'tablets',
    days_supply: 30,
    refills_authorized: 5,
    refills_remaining: 3,
    dispense_as_written: false,
    pharmacy_name: 'CVS Pharmacy - Research Blvd',
    status: 'active',
    start_date: '2025-09-15',
    is_controlled: false,
    prior_authorization_required: false,
    created_at: '2025-09-15T00:00:00Z',
    updated_at: '2026-03-04T16:30:00Z'
  }
];

// ─── Referrals ───────────────────────────────────────────────────────────────

export const MOCK_REFERRALS: Referral[] = [
  {
    id: 'ref-001',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    referring_provider_id: 'usr-002',
    referring_provider_name: 'Dr. James Wilson',
    referred_to_specialty: 'Cardiology',
    referred_to_provider: 'Dr. Amanda Rodriguez',
    referred_to_facility: 'Austin Heart Center',
    reason: 'CHF exacerbation requiring specialist evaluation',
    clinical_notes:
      'Patient with acute CHF exacerbation, BNP 850. Needs urgent cardiology follow-up.',
    priority: 'urgent',
    status: 'sent',
    created_at: '2026-03-05T12:00:00Z',
    updated_at: '2026-03-05T12:00:00Z'
  }
];

// ─── Claims / Billing ────────────────────────────────────────────────────────

export const MOCK_CLAIMS: Claim[] = [
  {
    id: 'clm-001',
    claim_number: 'CLM-2026-00451',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    encounter_id: 'enc-001',
    insurance_id: 'ins-1',
    payer_name: 'Blue Cross Blue Shield',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    type: 'professional',
    status: 'paid',
    filing_indicator: 'primary',
    service_date: '2026-02-28',
    submission_date: '2026-03-01',
    line_items: [
      {
        id: 'cli-1',
        cpt_code: '99214',
        description: 'Office visit, moderate complexity',
        icd10_codes: ['E11.65', 'I10'],
        units: 1,
        charge_amount: 175,
        allowed_amount: 145,
        paid_amount: 115,
        adjustment_amount: 30,
        service_date: '2026-02-28',
        place_of_service: '11'
      }
    ],
    total_charges: 175,
    total_allowed: 145,
    total_paid: 115,
    patient_responsibility: 30,
    adjustment_amount: 30,
    remittance_date: '2026-03-04',
    check_number: 'ACH-778896',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-04T00:00:00Z'
  },
  {
    id: 'clm-002',
    claim_number: 'CLM-2026-00467',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    encounter_id: 'enc-004',
    insurance_id: 'ins-5',
    payer_name: 'Medicare',
    provider_id: 'usr-002',
    provider_name: 'Dr. James Wilson',
    type: 'professional',
    status: 'submitted',
    filing_indicator: 'primary',
    service_date: '2026-03-05',
    submission_date: '2026-03-06',
    line_items: [
      {
        id: 'cli-2',
        cpt_code: '99215',
        description: 'Office visit, high complexity',
        icd10_codes: ['I50.9', 'J44.1'],
        units: 1,
        charge_amount: 250,
        allowed_amount: 0,
        paid_amount: 0,
        adjustment_amount: 0,
        service_date: '2026-03-05',
        place_of_service: '11'
      }
    ],
    total_charges: 250,
    total_allowed: 0,
    total_paid: 0,
    patient_responsibility: 0,
    adjustment_amount: 0,
    created_at: '2026-03-06T00:00:00Z',
    updated_at: '2026-03-06T00:00:00Z'
  }
];

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    claim_id: 'clm-001',
    type: 'copay',
    method: 'credit_card',
    amount: 30,
    posted_date: '2026-02-28',
    received_by: 'Jessica Martinez',
    status: 'posted',
    created_at: '2026-02-28T00:00:00Z'
  }
];

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const MOCK_TASKS: Task[] = [
  {
    id: 'tsk-001',
    title: 'Review lab results for John Smith',
    description:
      'A1c and fasting glucose results are in. Review and update treatment plan.',
    category: 'lab_review',
    status: 'completed',
    priority: 'medium',
    assigned_to_id: 'usr-001',
    assigned_to_name: 'Dr. Sarah Chen',
    created_by_id: 'usr-003',
    created_by_name: 'Maria Garcia, RN',
    patient_id: 'pat-001',
    patient_name: 'John Smith',
    encounter_id: 'enc-001',
    due_date: '2026-02-28',
    completed_at: '2026-02-28T09:30:00Z',
    created_at: '2026-02-27T14:00:00Z',
    updated_at: '2026-02-28T09:30:00Z'
  },
  {
    id: 'tsk-002',
    title: 'Prior auth for Robert Wilson cardiology referral',
    description:
      'Submit prior authorization for urgent cardiology consult at Austin Heart Center.',
    category: 'prior_auth',
    status: 'in_progress',
    priority: 'high',
    assigned_to_id: 'usr-006',
    assigned_to_name: 'Jessica Martinez',
    created_by_id: 'usr-002',
    created_by_name: 'Dr. James Wilson',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    due_date: '2026-03-07',
    created_at: '2026-03-05T12:00:00Z',
    updated_at: '2026-03-06T09:00:00Z'
  },
  {
    id: 'tsk-003',
    title: 'Follow-up call: Olivia Davis migraine',
    description:
      'Call patient in 2 weeks to check if topiramate is tolerated and migraines improving.',
    category: 'follow_up',
    status: 'todo',
    priority: 'medium',
    assigned_to_id: 'usr-003',
    assigned_to_name: 'Maria Garcia, RN',
    created_by_id: 'usr-001',
    created_by_name: 'Dr. Sarah Chen',
    patient_id: 'pat-004',
    patient_name: 'Olivia Davis',
    due_date: '2026-03-18',
    created_at: '2026-03-04T17:00:00Z',
    updated_at: '2026-03-04T17:00:00Z'
  },
  {
    id: 'tsk-004',
    title: 'Process Robert Wilson insurance claim',
    description:
      'Submit claim for 3/5 encounter, high complexity office visit with CHF exacerbation.',
    category: 'billing',
    status: 'in_progress',
    priority: 'medium',
    assigned_to_id: 'usr-005',
    assigned_to_name: 'Robert Thompson',
    created_by_id: 'usr-004',
    created_by_name: 'Patricia Adams',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    encounter_id: 'enc-004',
    due_date: '2026-03-08',
    created_at: '2026-03-06T08:00:00Z',
    updated_at: '2026-03-06T08:00:00Z'
  },
  {
    id: 'tsk-005',
    title: 'Verify insurance for Sophia Martinez',
    description:
      'New patient scheduled 3/6. Verify BCBS PPO Gold coverage before appointment.',
    category: 'administrative',
    status: 'todo',
    priority: 'high',
    assigned_to_id: 'usr-006',
    assigned_to_name: 'Jessica Martinez',
    created_by_id: 'usr-006',
    created_by_name: 'Jessica Martinez',
    patient_id: 'pat-006',
    patient_name: 'Sophia Martinez',
    due_date: '2026-03-06',
    created_at: '2026-03-05T16:00:00Z',
    updated_at: '2026-03-05T16:00:00Z'
  },
  {
    id: 'tsk-006',
    title: 'Complete Michael Brown stress test order',
    description:
      'Order cardiac stress test. Patient to be fasting. Schedule within 1 week.',
    category: 'follow_up',
    status: 'todo',
    priority: 'urgent',
    assigned_to_id: 'usr-002',
    assigned_to_name: 'Dr. James Wilson',
    created_by_id: 'usr-002',
    created_by_name: 'Dr. James Wilson',
    patient_id: 'pat-003',
    patient_name: 'Michael Brown',
    encounter_id: 'enc-003',
    due_date: '2026-03-07',
    created_at: '2026-03-06T15:00:00Z',
    updated_at: '2026-03-06T15:00:00Z'
  },
  {
    id: 'tsk-007',
    title: 'Refill request: Emily Johnson albuterol',
    description: 'Patient called requesting albuterol inhaler refill.',
    category: 'refill',
    status: 'todo',
    priority: 'low',
    assigned_to_id: 'usr-001',
    assigned_to_name: 'Dr. Sarah Chen',
    created_by_id: 'usr-003',
    created_by_name: 'Maria Garcia, RN',
    patient_id: 'pat-002',
    patient_name: 'Emily Johnson',
    due_date: '2026-03-08',
    created_at: '2026-03-06T10:00:00Z',
    updated_at: '2026-03-06T10:00:00Z'
  }
];

// ─── Messages ────────────────────────────────────────────────────────────────

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-001',
    type: 'internal',
    from_user_id: 'usr-003',
    from_user_name: 'Maria Garcia, RN',
    to_user_ids: ['usr-001'],
    to_user_names: ['Dr. Sarah Chen'],
    subject: 'Robert Wilson weight gain alert',
    body: 'Dr. Chen, FYI - Robert Wilson called. He reports gaining 4 lbs in the last 3 days despite following fluid restriction. His scheduled appointment is tomorrow with Dr. Wilson, but wanted to flag this for your awareness as well.',
    priority: 'high',
    is_read: false,
    reply_count: 0,
    created_at: '2026-03-06T07:30:00Z'
  },
  {
    id: 'msg-002',
    type: 'patient',
    from_user_id: 'usr-001',
    from_user_name: 'Dr. Sarah Chen',
    to_user_ids: ['usr-003'],
    to_user_names: ['Maria Garcia, RN'],
    patient_id: 'pat-004',
    patient_name: 'Olivia Davis',
    subject: 'Re: Topiramate side effects check',
    body: "Maria, thanks for the update. Since Olivia is tolerating the 25mg well, let's proceed with the planned increase to 50mg as discussed. Please call her and confirm.",
    priority: 'normal',
    is_read: true,
    read_at: '2026-03-06T08:00:00Z',
    reply_count: 1,
    thread_id: 'thread-001',
    created_at: '2026-03-05T17:00:00Z'
  },
  {
    id: 'msg-003',
    type: 'system',
    from_user_id: 'system',
    from_user_name: 'System',
    to_user_ids: ['usr-002'],
    to_user_names: ['Dr. James Wilson'],
    subject: 'Critical Lab Result: Robert Wilson BNP',
    body: 'CRITICAL: BNP result for Robert Wilson (MRN-100005) is 850 pg/mL (reference: <100). This result has been flagged for immediate review.',
    priority: 'urgent',
    is_read: true,
    read_at: '2026-03-05T11:05:00Z',
    reply_count: 0,
    created_at: '2026-03-05T11:00:00Z'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    user_id: 'usr-001',
    type: 'task',
    title: 'New task assigned',
    body: 'Review lab results for John Smith',
    action_url: '/tasks',
    is_read: true,
    read_at: '2026-02-27T14:05:00Z',
    created_at: '2026-02-27T14:00:00Z'
  },
  {
    id: 'notif-002',
    user_id: 'usr-001',
    type: 'message',
    title: 'New message',
    body: 'From Maria Garcia: Robert Wilson weight gain alert',
    action_url: '/messages',
    is_read: false,
    created_at: '2026-03-06T07:30:00Z'
  },
  {
    id: 'notif-003',
    user_id: 'usr-002',
    type: 'alert',
    title: 'Critical lab result',
    body: 'BNP 850 pg/mL for Robert Wilson',
    action_url: '/orders',
    is_read: true,
    read_at: '2026-03-05T11:05:00Z',
    created_at: '2026-03-05T11:00:00Z'
  },
  {
    id: 'notif-004',
    user_id: 'usr-001',
    type: 'appointment',
    title: 'Upcoming appointment',
    body: 'Sophia Martinez - New patient at 2:30 PM today',
    action_url: '/schedule',
    is_read: false,
    created_at: '2026-03-06T08:00:00Z'
  },
  {
    id: 'notif-005',
    user_id: 'usr-006',
    type: 'task',
    title: 'Task due today',
    body: 'Verify insurance for Sophia Martinez',
    action_url: '/tasks',
    is_read: false,
    created_at: '2026-03-06T07:00:00Z'
  }
];

// ─── Reports ─────────────────────────────────────────────────────────────────

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rpt-001',
    name: 'Daily Patient Volume',
    type: 'operational',
    description: 'Number of patients seen per day by provider',
    is_favorite: true,
    is_shared: true,
    created_by: 'Patricia Adams',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'rpt-002',
    name: 'Monthly Revenue Summary',
    type: 'financial',
    description: 'Revenue by service type and payer',
    is_favorite: true,
    is_shared: true,
    created_by: 'Robert Thompson',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'rpt-003',
    name: 'A1c Control Report',
    type: 'clinical',
    description: 'Patients with diabetes and their A1c trends',
    is_favorite: false,
    is_shared: true,
    created_by: 'Dr. Sarah Chen',
    created_at: '2025-06-01T00:00:00Z',
    updated_at: '2026-02-01T00:00:00Z'
  },
  {
    id: 'rpt-004',
    name: 'Claims Aging Report',
    type: 'financial',
    description: 'Outstanding claims grouped by days since submission',
    is_favorite: true,
    is_shared: true,
    created_by: 'Robert Thompson',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  },
  {
    id: 'rpt-005',
    name: 'No-Show Rate Report',
    type: 'operational',
    description: 'Appointment no-show rates by provider and type',
    is_favorite: false,
    is_shared: true,
    created_by: 'Patricia Adams',
    created_at: '2025-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z'
  }
];

// ─── Providers ───────────────────────────────────────────────────────────────

export const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'prv-001',
    user_id: 'usr-001',
    first_name: 'Sarah',
    last_name: 'Chen',
    credentials: 'MD',
    specialty: 'Internal Medicine',
    npi: '1234567890',
    state_license: 'TX-MD-123456',
    state_license_state: 'TX',
    state_license_expiry: '2027-12-31',
    board_certified: true,
    accepting_new_patients: true,
    department: 'Primary Care',
    email: 'dr.sarah.chen@vedi.health',
    is_active: true,
    bio: 'Board-certified internist with 12 years of experience in primary care and chronic disease management.',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'prv-002',
    user_id: 'usr-002',
    first_name: 'James',
    last_name: 'Wilson',
    credentials: 'MD, FACC',
    specialty: 'Cardiology',
    sub_specialty: 'Heart Failure',
    npi: '0987654321',
    state_license: 'TX-MD-789012',
    state_license_state: 'TX',
    state_license_expiry: '2027-06-30',
    board_certified: true,
    accepting_new_patients: true,
    department: 'Cardiology',
    email: 'dr.james.wilson@vedi.health',
    is_active: true,
    bio: 'Fellowship-trained cardiologist specializing in heart failure and preventive cardiology.',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

// ─── Audit Log ───────────────────────────────────────────────────────────────

export const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'aud-001',
    user_id: 'usr-001',
    user_name: 'Dr. Sarah Chen',
    user_role: 'doctor',
    action: 'read',
    resource_type: 'patient',
    resource_id: 'pat-001',
    resource_label: 'John Smith',
    ip_address: '192.168.1.100',
    phi_accessed: true,
    timestamp: '2026-03-06T08:30:00Z'
  },
  {
    id: 'aud-002',
    user_id: 'usr-001',
    user_name: 'Dr. Sarah Chen',
    user_role: 'doctor',
    action: 'update',
    resource_type: 'encounter',
    resource_id: 'enc-001',
    resource_label: 'Enc #001 - John Smith',
    ip_address: '192.168.1.100',
    phi_accessed: true,
    timestamp: '2026-03-06T08:35:00Z'
  },
  {
    id: 'aud-003',
    user_id: 'usr-001',
    user_name: 'Dr. Sarah Chen',
    user_role: 'doctor',
    action: 'sign',
    resource_type: 'encounter',
    resource_id: 'enc-001',
    resource_label: 'Enc #001 - John Smith',
    ip_address: '192.168.1.100',
    phi_accessed: true,
    timestamp: '2026-02-28T10:00:00Z'
  },
  {
    id: 'aud-004',
    user_id: 'usr-005',
    user_name: 'Robert Thompson',
    user_role: 'biller',
    action: 'create',
    resource_type: 'claim',
    resource_id: 'clm-001',
    resource_label: 'Claim CLM-2026-00451',
    ip_address: '192.168.1.105',
    phi_accessed: true,
    timestamp: '2026-03-01T09:00:00Z'
  },
  {
    id: 'aud-005',
    user_id: 'usr-006',
    user_name: 'Jessica Martinez',
    user_role: 'front_desk',
    action: 'create',
    resource_type: 'appointment',
    resource_id: 'apt-005',
    resource_label: 'Sophia Martinez - New Patient',
    ip_address: '192.168.1.106',
    phi_accessed: true,
    timestamp: '2026-03-03T14:00:00Z'
  },
  {
    id: 'aud-006',
    user_id: 'usr-004',
    user_name: 'Patricia Adams',
    user_role: 'admin',
    action: 'export',
    resource_type: 'report',
    resource_id: 'rpt-002',
    resource_label: 'Monthly Revenue Summary',
    ip_address: '192.168.1.104',
    phi_accessed: false,
    timestamp: '2026-03-05T16:00:00Z'
  }
];

// ─── Dashboard Stats ─────────────────────────────────────────────────────────

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  total_patients: 847,
  todays_appointments: 12,
  pending_tasks: 5,
  open_encounters: 3,
  unread_messages: 2,
  pending_lab_results: 4,
  pending_prescriptions: 3,
  revenue_today: 2850,
  patients_trend: 3.2,
  appointments_trend: -1.5
};

export const MOCK_DASHBOARD_ALERTS: DashboardAlert[] = [
  {
    id: 'da-001',
    type: 'critical_lab',
    severity: 'critical',
    title: 'Critical Lab Result',
    message: 'BNP 850 pg/mL for Robert Wilson requires immediate review',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    action_url: '/orders/ord-003',
    is_read: false,
    created_at: '2026-03-05T11:00:00Z'
  },
  {
    id: 'da-002',
    type: 'task_overdue',
    severity: 'warning',
    title: 'Overdue Task',
    message: 'Prior auth for Robert Wilson cardiology referral is due today',
    patient_id: 'pat-005',
    patient_name: 'Robert Wilson',
    action_url: '/tasks',
    is_read: false,
    created_at: '2026-03-06T07:00:00Z'
  },
  {
    id: 'da-003',
    type: 'appointment_reminder',
    severity: 'info',
    title: 'Upcoming Appointment',
    message: 'New patient Sophia Martinez at 2:30 PM - insurance not verified',
    patient_id: 'pat-006',
    patient_name: 'Sophia Martinez',
    action_url: '/schedule',
    is_read: false,
    created_at: '2026-03-06T08:00:00Z'
  }
];

export const MOCK_RECENT_ACTIVITY: RecentActivity[] = [
  {
    id: 'ra-001',
    user_name: 'Dr. Sarah Chen',
    action: 'signed',
    resource_type: 'encounter',
    resource_label: 'Olivia Davis - Migraine visit',
    timestamp: '2026-03-04T16:30:00Z'
  },
  {
    id: 'ra-002',
    user_name: 'Dr. James Wilson',
    action: 'completed',
    resource_type: 'encounter',
    resource_label: 'Robert Wilson - CHF follow-up',
    timestamp: '2026-03-05T12:00:00Z'
  },
  {
    id: 'ra-003',
    user_name: 'Maria Garcia, RN',
    action: 'created',
    resource_type: 'task',
    resource_label: 'Follow-up call: Olivia Davis',
    timestamp: '2026-03-04T17:00:00Z'
  },
  {
    id: 'ra-004',
    user_name: 'Jessica Martinez',
    action: 'scheduled',
    resource_type: 'appointment',
    resource_label: 'Sophia Martinez - New Patient',
    timestamp: '2026-03-03T14:00:00Z'
  },
  {
    id: 'ra-005',
    user_name: 'Robert Thompson',
    action: 'submitted',
    resource_type: 'claim',
    resource_label: 'CLM-2026-00467 - Robert Wilson',
    timestamp: '2026-03-06T09:00:00Z'
  }
];

export const MOCK_DASHBOARD_ACTIVITY = MOCK_RECENT_ACTIVITY;

// ─── System Settings (Admin) ─────────────────────────────────────────────────

export const MOCK_SYSTEM_SETTINGS: SystemSetting[] = [
  {
    id: 'set-001',
    category: 'general',
    key: 'clinic_name',
    value: 'Vedi Health Clinic',
    label: 'Clinic Name',
    description: 'Name displayed in header and reports',
    type: 'string',
    updated_by: 'Patricia Adams',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'set-002',
    category: 'scheduling',
    key: 'appointment_duration_default',
    value: '30',
    label: 'Default Appointment Duration',
    description: 'Default duration in minutes for new appointments',
    type: 'number',
    updated_by: 'Patricia Adams',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'set-003',
    category: 'clinical',
    key: 'auto_save_soap_notes',
    value: 'true',
    label: 'Auto-save SOAP Notes',
    description: 'Automatically save SOAP notes every 60 seconds',
    type: 'boolean',
    updated_by: 'Patricia Adams',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'set-004',
    category: 'security',
    key: 'session_timeout_minutes',
    value: '30',
    label: 'Session Timeout',
    description: 'Minutes of inactivity before automatic logout',
    type: 'number',
    updated_by: 'Patricia Adams',
    updated_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 'set-005',
    category: 'billing',
    key: 'default_place_of_service',
    value: '11',
    label: 'Default Place of Service',
    description: 'Default POS code for office visits',
    type: 'string',
    updated_by: 'Robert Thompson',
    updated_at: '2026-01-01T00:00:00Z'
  }
];

// ─── Telehealth ──────────────────────────────────────────────────────────────

export const MOCK_TELEHEALTH_SESSIONS: TelehealthSession[] = [
  {
    id: 'tele-001',
    appointment_id: 'apt-006',
    patient_id: 'pat-008',
    patient_name: 'Isabella Thomas',
    provider_id: 'usr-001',
    provider_name: 'Dr. Sarah Chen',
    room_name: 'vedi-room-006',
    room_url: 'https://meet.vedi.health/room-006',
    status: 'waiting',
    scheduled_start: '2026-03-06T16:00:00Z',
    recording_enabled: true,
    screen_shared: false,
    created_at: '2026-03-02T00:00:00Z',
    updated_at: '2026-03-06T00:00:00Z'
  }
];

// ─── Data Store Interface ────────────────────────────────────────────────────

type ResourceMap = {
  users: User;
  patients: Patient;
  encounters: Encounter;
  recordings: Recording;
  appointments: Appointment;
  orders: Order;
  prescriptions: Prescription;
  claims: Claim;
  payments: Payment;
  messages: Message;
  notifications: Notification;
  tasks: Task;
  reports: Report;
  providers: Provider;
  audit_log: AuditEntry;
  system_settings: SystemSetting;
  telehealth_sessions: TelehealthSession;
  referrals: Referral;
};

const dataStore: Record<string, { id: string }[]> = {
  users: [...MOCK_USERS],
  patients: [...MOCK_PATIENTS],
  encounters: [...MOCK_ENCOUNTERS],
  recordings: [...MOCK_RECORDINGS],
  appointments: [...MOCK_APPOINTMENTS],
  orders: [...MOCK_ORDERS],
  prescriptions: [...MOCK_PRESCRIPTIONS],
  claims: [...MOCK_CLAIMS],
  payments: [...MOCK_PAYMENTS],
  messages: [...MOCK_MESSAGES],
  notifications: [...MOCK_NOTIFICATIONS],
  tasks: [...MOCK_TASKS],
  reports: [...MOCK_REPORTS],
  providers: [...MOCK_PROVIDERS],
  audit_log: [...MOCK_AUDIT_LOG],
  system_settings: [...MOCK_SYSTEM_SETTINGS],
  telehealth_sessions: [...MOCK_TELEHEALTH_SESSIONS],
  referrals: [...MOCK_REFERRALS]
};

export function getList<K extends keyof ResourceMap>(
  resource: K,
  params?: {
    pagination?: { current: number; pageSize: number };
    sorters?: { field: string; order: 'asc' | 'desc' }[];
    filters?: { field: string; operator: string; value: unknown }[];
  }
): { data: ResourceMap[K][]; total: number } {
  let items = [...(dataStore[resource] || [])] as ResourceMap[K][];

  // Apply filters
  if (params?.filters) {
    for (const filter of params.filters) {
      items = items.filter((item) => {
        const val = (item as unknown as Record<string, unknown>)[filter.field];
        switch (filter.operator) {
          case 'eq':
            return val === filter.value;
          case 'ne':
            return val !== filter.value;
          case 'contains':
            return String(val)
              .toLowerCase()
              .includes(String(filter.value).toLowerCase());
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(val);
          default:
            return true;
        }
      });
    }
  }

  // Apply sorters
  if (params?.sorters?.length) {
    const { field, order } = params.sorters[0];
    items.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[field];
      const bVal = (b as unknown as Record<string, unknown>)[field];
      if (aVal === bVal) return 0;
      const cmp = aVal! < bVal! ? -1 : 1;
      return order === 'desc' ? -cmp : cmp;
    });
  }

  const total = items.length;

  // Apply pagination
  if (params?.pagination) {
    const { current, pageSize } = params.pagination;
    const start = (current - 1) * pageSize;
    items = items.slice(start, start + pageSize);
  }

  return { data: items, total };
}

export function getOne<K extends keyof ResourceMap>(
  resource: K,
  id: string
): ResourceMap[K] | undefined {
  const items = dataStore[resource] || [];
  return items.find((item) => item.id === id) as ResourceMap[K] | undefined;
}

export function createOne<K extends keyof ResourceMap>(
  resource: K,
  data: Partial<ResourceMap[K]> & { id?: string }
): ResourceMap[K] {
  const id =
    data.id || `${resource.slice(0, 3)}-${String(Date.now()).slice(-6)}`;
  const newItem = {
    ...data,
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  } as ResourceMap[K];
  if (!dataStore[resource]) dataStore[resource] = [];
  dataStore[resource].push(newItem as { id: string });
  return newItem;
}

export function updateOne<K extends keyof ResourceMap>(
  resource: K,
  id: string,
  data: Partial<ResourceMap[K]>
): ResourceMap[K] | undefined {
  const items = dataStore[resource] || [];
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  const updated = {
    ...items[index],
    ...data,
    updated_at: new Date().toISOString()
  } as ResourceMap[K];
  dataStore[resource][index] = updated as { id: string };
  return updated;
}

export function deleteOne(resource: string, id: string): boolean {
  const items = dataStore[resource] || [];
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return false;
  dataStore[resource].splice(index, 1);
  return true;
}
