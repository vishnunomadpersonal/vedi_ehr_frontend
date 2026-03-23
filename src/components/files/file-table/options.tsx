'use client';

import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  CalendarDays,
  FolderOpen
} from 'lucide-react';

// ── Document Type options (populated dynamically) ───────────────────────────
// These are built at runtime from `fetchDocumentCategories()` in the parent.

// ── Scan Status ──────────────────────────────────────────────────────────────

export const SCAN_STATUS_OPTIONS = [
  { value: 'clean', label: 'Clean', icon: ShieldCheck },
  { value: 'infected', label: 'Infected', icon: ShieldAlert },
  { value: 'error', label: 'Scan Error', icon: ShieldAlert },
  { value: 'pending', label: 'Scanning…', icon: ShieldQuestion },
  { value: 'disabled', label: 'No Scan', icon: ShieldQuestion }
];

// ── Upload Source ────────────────────────────────────────────────────────────

export const SOURCE_OPTIONS = [
  { value: 'appointment', label: 'Appointment', icon: CalendarDays },
  { value: 'patient_files', label: 'Patient Files', icon: FolderOpen }
];
