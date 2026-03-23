'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pill,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Clock,
  FileText,
  Package,
  Stethoscope,
  LayoutGrid,
  List,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Prescription, Medication } from '@/types';

// ── Status badge colors ──────────────────────────────────────────────────────

const statusColor: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  active: 'default',
  completed: 'secondary',
  stopped: 'destructive',
  cancelled: 'destructive',
  'entered-in-error': 'destructive',
  'on-hold': 'outline',
  draft: 'outline'
};

const priorityColor: Record<string, string> = {
  stat: 'text-red-600 bg-red-50 border-red-200',
  asap: 'text-orange-600 bg-orange-50 border-orange-200',
  urgent: 'text-amber-600 bg-amber-50 border-amber-200',
  routine: 'text-slate-600 bg-slate-50 border-slate-200'
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function parseDosageInstruction(
  di?: Record<string, unknown> | Record<string, unknown>[] | null
): string {
  if (!di) return '—';
  if (Array.isArray(di) && di.length > 0) {
    const first = di[0] as Record<string, unknown>;
    return (
      (first.text as string) ||
      (first.patientInstruction as string) ||
      JSON.stringify(first)
    );
  }
  if (typeof di === 'object' && !Array.isArray(di)) {
    return (
      (di.text as string) || (di.patientInstruction as string) || 'See details'
    );
  }
  return '—';
}

// ── Medication Detail Card (Medplum style) ───────────────────────────────────

function MedicationCard({ med }: { med: Medication }) {
  return (
    <div className='bg-card space-y-2 rounded-lg border p-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Pill className='h-4 w-4 text-blue-500' />
          <span className='text-sm font-semibold'>{med.medication_name}</span>
        </div>
        {med.status && (
          <Badge
            variant={med.status === 'active' ? 'default' : 'secondary'}
            className='text-[10px]'
          >
            {med.status}
          </Badge>
        )}
      </div>

      <div className='grid grid-cols-2 gap-2 text-xs md:grid-cols-4'>
        {med.dosage && (
          <div>
            <p className='text-muted-foreground'>Dosage</p>
            <p className='font-medium'>{med.dosage}</p>
          </div>
        )}
        {med.frequency && (
          <div>
            <p className='text-muted-foreground'>Frequency</p>
            <p className='font-medium'>{med.frequency}</p>
          </div>
        )}
        {med.dose_form_display && (
          <div>
            <p className='text-muted-foreground'>Form</p>
            <p className='font-medium'>{med.dose_form_display}</p>
          </div>
        )}
        {(med.brand_name || med.generic_name) && (
          <div>
            <p className='text-muted-foreground'>Brand / Generic</p>
            <p className='font-medium'>{med.brand_name || med.generic_name}</p>
          </div>
        )}
        {med.therapeutic_class && (
          <div>
            <p className='text-muted-foreground'>Therapeutic Class</p>
            <p className='font-medium'>{med.therapeutic_class}</p>
          </div>
        )}
        {med.ndc_code && (
          <div>
            <p className='text-muted-foreground'>NDC</p>
            <p className='font-mono'>{med.ndc_code}</p>
          </div>
        )}
        {med.rxnorm_code && (
          <div>
            <p className='text-muted-foreground'>RxNorm</p>
            <p className='font-mono'>{med.rxnorm_code}</p>
          </div>
        )}
        {med.controlled_substance_schedule && (
          <div>
            <p className='text-muted-foreground'>Schedule</p>
            <Badge
              variant='outline'
              className='border-amber-300 text-[10px] text-amber-600'
            >
              {med.controlled_substance_schedule}
            </Badge>
          </div>
        )}
      </div>

      {med.instructions && (
        <div className='text-xs'>
          <p className='text-muted-foreground'>Instructions</p>
          <p className='text-foreground/80 italic'>{med.instructions}</p>
        </div>
      )}

      {med.side_effects && (
        <div className='flex items-start gap-1 text-xs'>
          <AlertTriangle className='mt-0.5 h-3 w-3 shrink-0 text-amber-500' />
          <div>
            <p className='text-muted-foreground'>Side Effects</p>
            <p className='text-amber-700'>{med.side_effects}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Prescription Row (Expanded) ──────────────────────────────────────────────

function PrescriptionDetail({ rx }: { rx: Prescription }) {
  return (
    <div className='bg-muted/30 space-y-3 rounded-lg p-4'>
      {/* Prescription Metadata */}
      <div className='grid grid-cols-2 gap-3 text-xs md:grid-cols-4'>
        <div>
          <p className='text-muted-foreground'>Intent</p>
          <p className='font-medium capitalize'>{rx.intent || 'order'}</p>
        </div>
        <div>
          <p className='text-muted-foreground'>Category</p>
          <p className='font-medium'>{rx.category_display || '—'}</p>
        </div>
        {rx.authored_on && (
          <div>
            <p className='text-muted-foreground'>Authored</p>
            <p className='font-medium'>{formatDate(rx.authored_on)}</p>
          </div>
        )}
        {rx.dispense_request_number_of_repeats != null && (
          <div>
            <p className='text-muted-foreground'>Refills</p>
            <p className='font-medium'>
              {rx.dispense_request_number_of_repeats}
            </p>
          </div>
        )}
        {rx.dispense_request_quantity_value != null && (
          <div>
            <p className='text-muted-foreground'>Qty</p>
            <p className='font-medium'>
              {rx.dispense_request_quantity_value}{' '}
              {rx.dispense_request_quantity_unit || ''}
            </p>
          </div>
        )}
        {rx.dispense_request_expected_supply_duration && (
          <div>
            <p className='text-muted-foreground'>Supply Duration</p>
            <p className='font-medium'>
              {rx.dispense_request_expected_supply_duration}
            </p>
          </div>
        )}
        <div>
          <p className='text-muted-foreground'>Substitution</p>
          <p className='font-medium'>
            {rx.substitution_allowed_boolean !== false
              ? 'Allowed'
              : 'Not Allowed'}
          </p>
        </div>
      </div>

      {/* Dosage Instruction */}
      <div className='text-xs'>
        <p className='text-muted-foreground mb-1 flex items-center gap-1'>
          <ClipboardList className='h-3 w-3' /> Dosage Instruction
        </p>
        <p className='bg-background text-foreground/80 rounded border px-2 py-1'>
          {parseDosageInstruction(rx.dosage_instruction)}
        </p>
      </div>

      {/* Note */}
      {rx.fhir_note && (
        <div className='text-xs'>
          <p className='text-muted-foreground mb-1 flex items-center gap-1'>
            <FileText className='h-3 w-3' /> Note
          </p>
          <p className='bg-background rounded border px-2 py-1 italic'>
            {rx.fhir_note}
          </p>
        </div>
      )}

      {/* Linked Medications (Medplum style) */}
      {rx.medications && rx.medications.length > 0 && (
        <div>
          <p className='text-muted-foreground mb-2 flex items-center gap-1 text-xs'>
            <Package className='h-3 w-3' /> Linked Medications (
            {rx.medications.length})
          </p>
          <div className='space-y-2'>
            {rx.medications.map((med) => (
              <MedicationCard key={med.medication_id} med={med} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Export: PrescriptionsTab
// ═══════════════════════════════════════════════════════════════════════════════

interface PrescriptionsTabProps {
  prescriptions: Prescription[];
  isLoading?: boolean;
  onEdit?: (rx: Prescription) => void;
  onDelete?: (id: string | number) => void;
}

export function PrescriptionsTab({
  prescriptions,
  isLoading,
  onEdit,
  onDelete
}: PrescriptionsTabProps) {
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-6'>
          <div className='space-y-3'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='bg-muted h-16 animate-pulse rounded' />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prescriptions.length) {
    return (
      <Card>
        <CardContent className='p-12 text-center'>
          <Pill className='text-muted-foreground/30 mx-auto mb-3 h-12 w-12' />
          <h3 className='text-muted-foreground text-lg font-semibold'>
            No Prescriptions
          </h3>
          <p className='text-muted-foreground text-sm'>
            No prescription records found for this patient.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activePrescriptions = prescriptions.filter(
    (rx) => rx.status === 'active'
  );
  const otherPrescriptions = prescriptions.filter(
    (rx) => rx.status !== 'active'
  );

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold'>Prescriptions</h3>
          <Badge variant='secondary'>{prescriptions.length}</Badge>
          {activePrescriptions.length > 0 && (
            <Badge variant='default' className='text-[10px]'>
              {activePrescriptions.length} Active
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-1 rounded-md border p-0.5'>
          <Button
            size='sm'
            variant={view === 'cards' ? 'default' : 'ghost'}
            className='h-7 px-2'
            onClick={() => setView('cards')}
          >
            <LayoutGrid className='h-3.5 w-3.5' />
          </Button>
          <Button
            size='sm'
            variant={view === 'table' ? 'default' : 'ghost'}
            className='h-7 px-2'
            onClick={() => setView('table')}
          >
            <List className='h-3.5 w-3.5' />
          </Button>
        </div>
      </div>

      {view === 'cards' ? (
        <div className='space-y-3'>
          {prescriptions.map((rx) => {
            const rxId = rx.prescription_id || rx.id;
            const isExpanded = expandedIds.has(rxId);
            const medCount = rx.medications?.length || 0;

            return (
              <Card key={rxId} className='overflow-hidden'>
                {/* Summary Row */}
                <div
                  className='hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors'
                  onClick={() => toggle(rxId)}
                >
                  {isExpanded ? (
                    <ChevronDown className='text-muted-foreground h-4 w-4 shrink-0' />
                  ) : (
                    <ChevronRight className='text-muted-foreground h-4 w-4 shrink-0' />
                  )}

                  <Stethoscope className='h-4 w-4 shrink-0 text-violet-500' />

                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='truncate text-sm font-medium'>
                        {medCount > 0
                          ? rx
                              .medications!.map((m) => m.medication_name)
                              .join(', ')
                          : rx.medication_reference || `Rx ${rxId.slice(0, 8)}`}
                      </span>
                      <Badge
                        variant={statusColor[rx.status || ''] || 'outline'}
                        className='text-[10px]'
                      >
                        {rx.status || 'unknown'}
                      </Badge>
                      {rx.priority && rx.priority !== 'routine' && (
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[10px] ${priorityColor[rx.priority] || ''}`}
                        >
                          {rx.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className='text-muted-foreground mt-0.5 flex items-center gap-3 text-xs'>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        {formatDate(rx.date_issued)}
                      </span>
                      {medCount > 0 && (
                        <span className='flex items-center gap-1'>
                          <Pill className='h-3 w-3' />
                          {medCount} medication{medCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {rx.dispense_request_number_of_repeats != null && (
                        <span>
                          {rx.dispense_request_number_of_repeats} refills
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit / Delete actions */}
                  {(onEdit || onDelete) && (
                    <div
                      className='flex shrink-0 items-center gap-0.5'
                      onClick={(e) => e.stopPropagation()}
                    >
                      {onEdit && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-muted-foreground hover:text-primary h-7 w-7'
                          onClick={() => onEdit(rx)}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-muted-foreground hover:text-destructive h-7 w-7'
                          onClick={() => onDelete(rxId)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className='px-4 pb-4'>
                    <Separator className='mb-3' />
                    <PrescriptionDetail rx={rx} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Medication(s)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Dosage Instruction</TableHead>
                <TableHead>Refills</TableHead>
                <TableHead>Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((rx) => {
                const rxId = rx.prescription_id || rx.id;
                const medCount = rx.medications?.length || 0;
                return (
                  <TableRow key={rxId}>
                    <TableCell className='text-xs whitespace-nowrap'>
                      {formatDate(rx.date_issued)}
                    </TableCell>
                    <TableCell className='text-sm font-medium'>
                      {medCount > 0
                        ? rx
                            .medications!.map((m) => m.medication_name)
                            .join(', ')
                        : rx.medication_reference || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusColor[rx.status || ''] || 'outline'}
                        className='text-[10px]'
                      >
                        {rx.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-xs capitalize'>
                      {rx.priority || 'routine'}
                    </TableCell>
                    <TableCell className='max-w-50 truncate text-xs'>
                      {parseDosageInstruction(rx.dosage_instruction)}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {rx.dispense_request_number_of_repeats ?? '—'}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {rx.dispense_request_quantity_value
                        ? `${rx.dispense_request_quantity_value} ${rx.dispense_request_quantity_unit || ''}`
                        : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
