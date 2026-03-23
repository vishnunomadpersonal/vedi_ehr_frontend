'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Syringe,
  ChevronDown,
  ChevronRight,
  Clock,
  Building2,
  FileText,
  HeartPulse,
  LayoutGrid,
  List,
  Droplets,
  AlertCircle,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Surgery } from '@/types';

// ── Status helpers ───────────────────────────────────────────────────────────

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  completed: 'default',
  preparation: 'outline',
  'in-progress': 'secondary',
  'not-done': 'destructive',
  'entered-in-error': 'destructive',
  stopped: 'destructive',
  unknown: 'outline'
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function formatDuration(mins?: number | null): string {
  if (mins == null) return '—';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Surgery Detail ───────────────────────────────────────────────────────────

function SurgeryDetail({ surgery }: { surgery: Surgery }) {
  return (
    <div className='bg-muted/30 space-y-3 rounded-lg p-4'>
      <div className='grid grid-cols-2 gap-3 text-xs md:grid-cols-4'>
        {surgery.surgery_desc && (
          <div className='col-span-2'>
            <p className='text-muted-foreground'>Description</p>
            <p className='font-medium'>{surgery.surgery_desc}</p>
          </div>
        )}
        {surgery.surgery_facility && (
          <div>
            <p className='text-muted-foreground flex items-center gap-1'>
              <Building2 className='h-3 w-3' /> Facility
            </p>
            <p className='font-medium'>{surgery.surgery_facility}</p>
          </div>
        )}
        {surgery.body_site_display && (
          <div>
            <p className='text-muted-foreground'>Body Site</p>
            <p className='font-medium'>{surgery.body_site_display}</p>
          </div>
        )}
        {surgery.anesthesia_type && (
          <div>
            <p className='text-muted-foreground'>Anesthesia</p>
            <p className='font-medium capitalize'>{surgery.anesthesia_type}</p>
          </div>
        )}
        {surgery.surgery_duration_minutes != null && (
          <div>
            <p className='text-muted-foreground'>Duration</p>
            <p className='font-medium'>
              {formatDuration(surgery.surgery_duration_minutes)}
            </p>
          </div>
        )}
        {surgery.estimated_blood_loss_ml != null && (
          <div>
            <p className='text-muted-foreground flex items-center gap-1'>
              <Droplets className='h-3 w-3 text-red-400' /> Blood Loss
            </p>
            <p
              className={`font-medium ${surgery.estimated_blood_loss_ml > 500 ? 'font-bold text-red-600' : ''}`}
            >
              {surgery.estimated_blood_loss_ml} mL
            </p>
          </div>
        )}
        {surgery.cpt_code && (
          <div>
            <p className='text-muted-foreground'>CPT Code</p>
            <p className='font-mono'>{surgery.cpt_code}</p>
          </div>
        )}
        {surgery.icd10_pcs_code && (
          <div>
            <p className='text-muted-foreground'>ICD-10-PCS</p>
            <p className='font-mono'>{surgery.icd10_pcs_code}</p>
          </div>
        )}
        {surgery.outcome_display && (
          <div>
            <p className='text-muted-foreground'>Outcome</p>
            <Badge
              variant={
                surgery.outcome_display.toLowerCase().includes('success')
                  ? 'default'
                  : surgery.outcome_display
                        .toLowerCase()
                        .includes('complication')
                    ? 'destructive'
                    : 'secondary'
              }
              className='text-[10px]'
            >
              {surgery.outcome_display}
            </Badge>
          </div>
        )}
        {surgery.performer_display && (
          <div>
            <p className='text-muted-foreground'>Surgeon</p>
            <p className='font-medium'>{surgery.performer_display}</p>
          </div>
        )}
        {surgery.category_display && (
          <div>
            <p className='text-muted-foreground'>Category</p>
            <p className='font-medium'>{surgery.category_display}</p>
          </div>
        )}
        {surgery.reason_display && (
          <div className='col-span-2'>
            <p className='text-muted-foreground'>Reason</p>
            <p className='font-medium'>{surgery.reason_display}</p>
          </div>
        )}
      </div>

      {/* Complications */}
      {surgery.complication_display && (
        <div className='text-xs'>
          <p className='text-muted-foreground mb-1 flex items-center gap-1'>
            <AlertCircle className='h-3 w-3 text-red-500' /> Complications
          </p>
          <p className='rounded border border-red-200 bg-red-50 px-2 py-1 text-red-700 dark:bg-red-950/20 dark:text-red-400'>
            {surgery.complication_display}
          </p>
        </div>
      )}

      {/* Follow-up */}
      {surgery.followup_display && (
        <div className='text-xs'>
          <p className='text-muted-foreground mb-1'>Follow-up</p>
          <p className='bg-background rounded border px-2 py-1'>
            {surgery.followup_display}
          </p>
        </div>
      )}

      {/* Note */}
      {surgery.fhir_note && (
        <div className='text-xs'>
          <p className='text-muted-foreground mb-1 flex items-center gap-1'>
            <FileText className='h-3 w-3' /> Note
          </p>
          <p className='bg-background rounded border px-2 py-1 italic'>
            {surgery.fhir_note}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Export: SurgeryTab
// ═══════════════════════════════════════════════════════════════════════════════

interface SurgeryTabProps {
  surgeries: Surgery[];
  isLoading?: boolean;
  onEdit?: (s: Surgery) => void;
  onDelete?: (id: string | number) => void;
}

export function SurgeryTab({
  surgeries,
  isLoading,
  onEdit,
  onDelete
}: SurgeryTabProps) {
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

  if (!surgeries.length) {
    return (
      <Card>
        <CardContent className='p-12 text-center'>
          <Syringe className='text-muted-foreground/30 mx-auto mb-3 h-12 w-12' />
          <h3 className='text-muted-foreground text-lg font-semibold'>
            No Surgeries
          </h3>
          <p className='text-muted-foreground text-sm'>
            No surgical procedure records found for this patient.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold'>Surgeries &amp; Procedures</h3>
          <Badge variant='secondary'>{surgeries.length}</Badge>
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
          {surgeries.map((s) => {
            const sId = s.surgery_id || s.id;
            const isExpanded = expandedIds.has(sId);

            return (
              <Card key={sId} className='overflow-hidden'>
                <div
                  className='hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors'
                  onClick={() => toggle(sId)}
                >
                  {isExpanded ? (
                    <ChevronDown className='text-muted-foreground h-4 w-4 shrink-0' />
                  ) : (
                    <ChevronRight className='text-muted-foreground h-4 w-4 shrink-0' />
                  )}

                  <HeartPulse className='h-4 w-4 shrink-0 text-rose-500' />

                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='truncate text-sm font-medium'>
                        {s.surgery_type || 'Procedure'}
                      </span>
                      <Badge
                        variant={statusVariant[s.status || ''] || 'outline'}
                        className='text-[10px]'
                      >
                        {s.status || 'unknown'}
                      </Badge>
                      {s.outcome_display && (
                        <Badge
                          variant={
                            s.outcome_display.toLowerCase().includes('success')
                              ? 'default'
                              : s.outcome_display
                                    .toLowerCase()
                                    .includes('complication')
                                ? 'destructive'
                                : 'secondary'
                          }
                          className='text-[10px]'
                        >
                          {s.outcome_display}
                        </Badge>
                      )}
                    </div>
                    <div className='text-muted-foreground mt-0.5 flex items-center gap-3 text-xs'>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        {formatDate(s.surgery_date)}
                      </span>
                      {s.surgery_facility && (
                        <span className='flex items-center gap-1'>
                          <Building2 className='h-3 w-3' />
                          {s.surgery_facility}
                        </span>
                      )}
                      {s.anesthesia_type && (
                        <span className='capitalize'>{s.anesthesia_type}</span>
                      )}
                      {s.surgery_duration_minutes != null && (
                        <span>
                          {formatDuration(s.surgery_duration_minutes)}
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
                          onClick={() => onEdit(s)}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-muted-foreground hover:text-destructive h-7 w-7'
                          onClick={() => onDelete(sId)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className='px-4 pb-4'>
                    <Separator className='mb-3' />
                    <SurgeryDetail surgery={s} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Anesthesia</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>CPT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surgeries.map((s) => {
                const sId = s.surgery_id || s.id;
                return (
                  <TableRow key={sId}>
                    <TableCell className='text-xs whitespace-nowrap'>
                      {formatDate(s.surgery_date)}
                    </TableCell>
                    <TableCell className='text-sm font-medium'>
                      {s.surgery_type || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[s.status || ''] || 'outline'}
                        className='text-[10px]'
                      >
                        {s.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.outcome_display ? (
                        <Badge
                          variant={
                            s.outcome_display.toLowerCase().includes('success')
                              ? 'default'
                              : s.outcome_display
                                    .toLowerCase()
                                    .includes('complication')
                                ? 'destructive'
                                : 'secondary'
                          }
                          className='text-[10px]'
                        >
                          {s.outcome_display}
                        </Badge>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {s.surgery_facility || '—'}
                    </TableCell>
                    <TableCell className='text-xs capitalize'>
                      {s.anesthesia_type || '—'}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {formatDuration(s.surgery_duration_minutes)}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {s.cpt_code || '—'}
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
