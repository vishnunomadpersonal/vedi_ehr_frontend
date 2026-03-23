import {
  Clock,
  CheckCircle2,
  LogIn,
  Stethoscope,
  XCircle,
  AlertTriangle
} from 'lucide-react';

export const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', icon: Clock },
  { value: 'checked_in', label: 'Checked In', icon: LogIn },
  { value: 'in_progress', label: 'In Progress', icon: Stethoscope },
  { value: 'completed', label: 'Completed', icon: CheckCircle2 },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle },
  { value: 'no_show', label: 'No Show', icon: AlertTriangle }
];

export const TYPE_OPTIONS = [
  { value: 'office_visit', label: 'Office Visit' },
  { value: 'telemedicine', label: 'Telemedicine' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'urgent_care', label: 'Urgent Care' },
  { value: 'annual_physical', label: 'Annual Physical' },
  { value: 'consultation', label: 'Consultation' }
];
