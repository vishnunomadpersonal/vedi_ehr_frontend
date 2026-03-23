import { CheckCircle2, XCircle, Skull } from 'lucide-react';

export const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', icon: CheckCircle2 },
  { value: 'inactive', label: 'Inactive', icon: XCircle },
  { value: 'deceased', label: 'Deceased', icon: Skull }
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
];
