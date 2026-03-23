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
  FlaskConical,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  Building2,
  FileText,
  LayoutGrid,
  List,
  Activity,
  Pencil,
  Trash2
} from 'lucide-react';
import type { LabResult } from '@/types';

// ── Status / flag helpers ────────────────────────────────────────────────────

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  final: 'default',
  preliminary: 'outline',
  corrected: 'secondary',
  amended: 'secondary',
  'entered-in-error': 'destructive',
  cancelled: 'destructive',
  registered: 'outline'
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function isOutOfRange(
  result?: string | null,
  reference?: string | null
): boolean {
  if (!result || !reference) return false;
  const val = parseFloat(result);
  if (isNaN(val)) return false;
  // e.g. "4.5-11.0", "0 - 200", "< 5.7"
  const rangeMatch = reference.match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (rangeMatch) {
    const lo = parseFloat(rangeMatch[1]);
    const hi = parseFloat(rangeMatch[2]);
    return val < lo || val > hi;
  }
  return false;
}

// ── Lab Result Detail ────────────────────────────────────────────────────────

function LabResultDetail({ lab }: { lab: LabResult }) {
  const outOfRange = isOutOfRange(lab.result_value, lab.reference_range);

  return (
    <div className='bg-muted/30 space-y-3 rounded-lg p-4'>
      <div className='grid grid-cols-2 gap-3 text-xs md:grid-cols-4'>
        {lab.result_value && (
          <div>
            <p className='text-muted-foreground'>Result Value</p>
            <p
              className={`text-base font-semibold ${outOfRange || lab.critical_flag ? 'text-red-600' : 'text-foreground'}`}
            >
              {lab.result_value} {lab.result_unit || ''}
            </p>
          </div>
        )}
        {lab.reference_range && (
          <div>
            <p className='text-muted-foreground'>Reference Range</p>
            <p className='font-medium'>{lab.reference_range}</p>
          </div>
        )}
        {lab.test_facility && (
          <div>
            <p className='text-muted-foreground flex items-center gap-1'>
              <Building2 className='h-3 w-3' /> Facility
            </p>
            <p className='font-medium'>{lab.test_facility}</p>
          </div>
        )}
        {lab.loinc_code && (
          <div>
            <p className='text-muted-foreground'>LOINC Code</p>
            <p className='font-mono'>{lab.loinc_code}</p>
          </div>
        )}
        {lab.result_interpretation && (
          <div>
            <p className='text-muted-foreground'>Interpretation</p>
            <Badge
              variant={
                lab.result_interpretation.toLowerCase().includes('abnormal')
                  ? 'destructive'
                  : lab.result_interpretation.toLowerCase().includes('normal')
                    ? 'default'
                    : 'secondary'
              }
              className='text-[10px]'
            >
              {lab.result_interpretation}
            </Badge>
          </div>
        )}
        {lab.specimen_type_display && (
          <div>
            <p className='text-muted-foreground'>Specimen</p>
            <p className='font-medium'>{lab.specimen_type_display}</p>
          </div>
        )}
        {lab.performer_display && (
          <div>
            <p className='text-muted-foreground'>Performed By</p>
            <p className='font-medium'>{lab.performer_display}</p>
          </div>
        )}
        {lab.category_display && (
          <div>
            <p className='text-muted-foreground'>Category</p>
            <p className='font-medium'>{lab.category_display}</p>
          </div>
        )}
      </div>

      {lab.fhir_note && (
        <div className='text-xs'>
          <p className='text-muted-foreground mb-1 flex items-center gap-1'>
            <FileText className='h-3 w-3' /> Note
          </p>
          <p className='bg-background rounded border px-2 py-1 italic'>
            {lab.fhir_note}
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Export: LabResultsTab
// ═══════════════════════════════════════════════════════════════════════════════

interface LabResultsTabProps {
  labResults: LabResult[];
  isLoading?: boolean;
  onEdit?: (lab: LabResult) => void;
  onDelete?: (id: string | number) => void;
}

export function LabResultsTab({
  labResults,
  isLoading,
  onEdit,
  onDelete
}: LabResultsTabProps) {
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

  if (!labResults.length) {
    return (
      <Card>
        <CardContent className='p-12 text-center'>
          <FlaskConical className='text-muted-foreground/30 mx-auto mb-3 h-12 w-12' />
          <h3 className='text-muted-foreground text-lg font-semibold'>
            No Lab Results
          </h3>
          <p className='text-muted-foreground text-sm'>
            No laboratory examination records found for this patient.
          </p>
        </CardContent>
      </Card>
    );
  }

  const criticalResults = labResults.filter((l) => l.critical_flag);

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-lg font-semibold'>Lab Results</h3>
          <Badge variant='secondary'>{labResults.length}</Badge>
          {criticalResults.length > 0 && (
            <Badge
              variant='destructive'
              className='flex items-center gap-1 text-[10px]'
            >
              <AlertTriangle className='h-3 w-3' /> {criticalResults.length}{' '}
              Critical
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
          {labResults.map((lab) => {
            const labId = lab.lab_examination_id || lab.id;
            const isExpanded = expandedIds.has(labId);
            const outOfRange = isOutOfRange(
              lab.result_value,
              lab.reference_range
            );

            return (
              <Card
                key={labId}
                className={`overflow-hidden ${lab.critical_flag ? 'border-red-300 bg-red-50/30 dark:bg-red-950/10' : ''}`}
              >
                <div
                  className='hover:bg-muted/40 flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors'
                  onClick={() => toggle(labId)}
                >
                  {isExpanded ? (
                    <ChevronDown className='text-muted-foreground h-4 w-4 shrink-0' />
                  ) : (
                    <ChevronRight className='text-muted-foreground h-4 w-4 shrink-0' />
                  )}

                  {lab.critical_flag ? (
                    <AlertTriangle className='h-4 w-4 shrink-0 text-red-500' />
                  ) : (
                    <Activity className='h-4 w-4 shrink-0 text-teal-500' />
                  )}

                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <span className='truncate text-sm font-medium'>
                        {lab.test_type || 'Lab Test'}
                      </span>
                      <Badge
                        variant={statusVariant[lab.status || ''] || 'outline'}
                        className='text-[10px]'
                      >
                        {lab.status || 'unknown'}
                      </Badge>
                      {lab.critical_flag && (
                        <Badge variant='destructive' className='text-[10px]'>
                          CRITICAL
                        </Badge>
                      )}
                      {outOfRange && !lab.critical_flag && (
                        <Badge
                          variant='outline'
                          className='border-amber-300 text-[10px] text-amber-600'
                        >
                          Out of Range
                        </Badge>
                      )}
                    </div>
                    <div className='text-muted-foreground mt-0.5 flex items-center gap-3 text-xs'>
                      <span className='flex items-center gap-1'>
                        <Clock className='h-3 w-3' />
                        {formatDate(lab.test_date)}
                      </span>
                      {lab.result_value && (
                        <span
                          className={`font-medium ${outOfRange || lab.critical_flag ? 'text-red-600' : ''}`}
                        >
                          {lab.result_value} {lab.result_unit || ''}
                        </span>
                      )}
                      {lab.reference_range && (
                        <span className='text-muted-foreground/70'>
                          Ref: {lab.reference_range}
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
                          onClick={() => onEdit(lab)}
                        >
                          <Pencil className='h-3.5 w-3.5' />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-muted-foreground hover:text-destructive h-7 w-7'
                          onClick={() => onDelete(labId)}
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
                    <LabResultDetail lab={lab} />
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
                <TableHead>Test</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>LOINC</TableHead>
                <TableHead>Facility</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labResults.map((lab) => {
                const labId = lab.lab_examination_id || lab.id;
                const outOfRange = isOutOfRange(
                  lab.result_value,
                  lab.reference_range
                );
                return (
                  <TableRow
                    key={labId}
                    className={
                      lab.critical_flag ? 'bg-red-50/50 dark:bg-red-950/10' : ''
                    }
                  >
                    <TableCell className='text-xs whitespace-nowrap'>
                      {formatDate(lab.test_date)}
                    </TableCell>
                    <TableCell className='text-sm font-medium'>
                      {lab.test_type || '—'}
                    </TableCell>
                    <TableCell
                      className={`text-sm font-semibold ${outOfRange || lab.critical_flag ? 'text-red-600' : ''}`}
                    >
                      {lab.result_value || '—'} {lab.result_unit || ''}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {lab.reference_range || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[lab.status || ''] || 'outline'}
                        className='text-[10px]'
                      >
                        {lab.status || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lab.critical_flag ? (
                        <Badge variant='destructive' className='text-[10px]'>
                          CRITICAL
                        </Badge>
                      ) : outOfRange ? (
                        <Badge
                          variant='outline'
                          className='border-amber-300 text-[10px] text-amber-600'
                        >
                          Abnormal
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className='font-mono text-xs'>
                      {lab.loinc_code || '—'}
                    </TableCell>
                    <TableCell className='text-xs'>
                      {lab.test_facility || '—'}
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
