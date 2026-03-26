'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pencil,
  Trash2,
  ExternalLink,
  UserCheck,
  ClipboardList,
  Loader2,
  X,
  UserX,
  Play
} from 'lucide-react';
import Link from 'next/link';
import type { CalEvent } from '@/types/calendar-types';
import { STATUS_COLORS } from '@/types/calendar-types';
import {
  updateAppointmentStatus,
  updateEncounterStatus
} from '@/lib/schedule-service';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CalendarEventViewDialogProps {
  eventDetails: CalEvent | undefined;
  showEventViewDialog: boolean;
  setShowEventViewDialog: (show: boolean) => void;
  handleEditEvent: (event: CalEvent) => void;
  handleDeleteModal: (event: CalEvent) => void;
  onStatusChanged?: () => void;
}

/**
 * Status flow buttons for clinical appointments:
 *   scheduled → [Check In]
 *   checked_in → [Start Visit] → navigates to encounter chart
 *   in_progress → (managed from encounter chart)
 *   completed → (locked)
 */
const CalendarEventViewDialog: React.FC<CalendarEventViewDialogProps> = ({
  eventDetails,
  showEventViewDialog,
  setShowEventViewDialog,
  handleEditEvent,
  handleDeleteModal,
  onStatusChanged
}) => {
  const [statusLoading, setStatusLoading] = useState(false);
  const router = useRouter();
  const status = eventDetails?.extendedProps?.status || 'scheduled';
  const encounterId = eventDetails?.extendedProps?.encounter_id;
  const hasEncounter = !!encounterId && encounterId !== '';

  const handleStartVisit = async () => {
    if (!eventDetails || !encounterId) return;
    setStatusLoading(true);
    try {
      // Update both appointment and encounter to in_progress
      await updateAppointmentStatus(eventDetails.id, 'in_progress');
      await updateEncounterStatus(encounterId, 'in_progress');
      if (eventDetails.extendedProps) {
        eventDetails.extendedProps.status = 'in_progress';
      }
      toast.success('Visit started');
      onStatusChanged?.();
      setShowEventViewDialog(false);
      router.push(`/dashboard/encounters/${encounterId}/chart`);
    } catch (error) {
      console.error('Error starting visit:', error);
      toast.error('Failed to start visit');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!eventDetails) return;
    setStatusLoading(true);
    try {
      const res = await updateAppointmentStatus(eventDetails.id, newStatus);
      // Update local state to reflect the change including encounter link
      if (eventDetails.extendedProps) {
        eventDetails.extendedProps.status = newStatus;
        // If check-in, the backend creates an encounter — get its ID from response
        if (newStatus === 'checked_in' && res.data) {
          const newEncId = res.data.encounter_id;
          if (newEncId) {
            eventDetails.extendedProps.encounter_id = String(newEncId);
          }
          eventDetails.extendedProps.encounter_fhir_id =
            res.data.encounter_fhir_id || '';
        }
      }

      const labels: Record<string, string> = {
        checked_in: 'Patient checked in — encounter created',
        in_progress: 'Visit started',
        completed: 'Appointment completed',
        cancelled: 'Appointment cancelled',
        no_show: 'Marked as no-show'
      };
      toast.success(labels[newStatus] || 'Status updated');
      onStatusChanged?.();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setStatusLoading(false);
    }
  };

  const statusClass = STATUS_COLORS[status] || '';

  return (
    <Dialog open={showEventViewDialog} onOpenChange={setShowEventViewDialog}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <div className='flex items-center justify-between pr-4'>
            <div>
              <DialogTitle>Appointment Details</DialogTitle>
              <DialogDescription>
                Review appointment and manage clinical workflow.
              </DialogDescription>
            </div>
            <Badge className={statusClass + ' text-xs capitalize'}>
              {status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </DialogHeader>

        <div className='space-y-4 text-sm'>
          {eventDetails ? (
            <>
              {/* ── Clinical Status Actions ── */}
              <div className='bg-muted/30 space-y-2 rounded-lg border p-3'>
                {status === 'scheduled' && (
                  <Button
                    className='w-full'
                    size='sm'
                    onClick={() => handleStatusChange('checked_in')}
                    disabled={statusLoading}
                  >
                    {statusLoading ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <UserCheck className='mr-2 h-4 w-4' />
                    )}
                    Check In Patient
                  </Button>
                )}

                {status === 'checked_in' && hasEncounter && (
                  <Button
                    className='w-full'
                    size='sm'
                    onClick={handleStartVisit}
                    disabled={statusLoading}
                  >
                    {statusLoading ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Play className='mr-2 h-4 w-4' />
                    )}
                    Start Visit — Open Chart
                  </Button>
                )}

                {status === 'checked_in' && !hasEncounter && (
                  <Button
                    className='w-full'
                    size='sm'
                    disabled
                    variant='outline'
                  >
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating encounter…
                  </Button>
                )}

                {(status === 'in_progress' || status === 'completed') &&
                  hasEncounter && (
                    <Button
                      className='w-full'
                      size='sm'
                      variant='outline'
                      asChild
                    >
                      <Link href={`/dashboard/encounters/${encounterId}/chart`}>
                        <ClipboardList className='mr-2 h-4 w-4' />
                        {status === 'completed'
                          ? 'View Signed Chart'
                          : 'Continue Charting'}
                      </Link>
                    </Button>
                  )}

                {/* Secondary actions row */}
                {status === 'scheduled' && (
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={statusLoading}
                    >
                      <X className='mr-1 h-3.5 w-3.5' /> Cancel
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                      className='flex-1'
                      onClick={() => handleStatusChange('no_show')}
                      disabled={statusLoading}
                    >
                      <UserX className='mr-1 h-3.5 w-3.5' /> No Show
                    </Button>
                  </div>
                )}

                {status === 'checked_in' && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full'
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={statusLoading}
                  >
                    <X className='mr-1 h-3.5 w-3.5' /> Cancel Appointment
                  </Button>
                )}
              </div>

              {/* ── Info Grid ── */}
              <div className='grid grid-cols-[120px_1fr] gap-y-2'>
                <span className='text-muted-foreground'>Appointment ID:</span>
                <span className='font-mono text-xs font-medium'>
                  {eventDetails.id || '—'}
                </span>

                {hasEncounter && (
                  <>
                    <span className='text-muted-foreground'>Encounter ID:</span>
                    <span className='font-mono text-xs font-medium'>
                      <Link
                        href={`/encounters/${encounterId}`}
                        className='text-primary hover:underline'
                      >
                        {encounterId}
                      </Link>
                    </span>
                  </>
                )}

                <span className='text-muted-foreground'>Patient:</span>
                <span className='font-medium'>
                  {eventDetails.extendedProps?.patient_name || '—'}
                </span>

                <span className='text-muted-foreground'>Provider:</span>
                <span className='font-medium'>
                  {eventDetails.extendedProps?.provider_name || '—'}
                </span>

                <span className='text-muted-foreground'>Visit Type:</span>
                <span className='font-medium capitalize'>
                  {(eventDetails.extendedProps?.encounter_type || '—').replace(
                    /_/g,
                    ' '
                  )}
                </span>

                <span className='text-muted-foreground'>Chief Complaint:</span>
                <span className='font-medium'>
                  {eventDetails.extendedProps?.chief_complaint || '—'}
                </span>

                <span className='text-muted-foreground'>Start:</span>
                <span className='font-medium'>
                  {new Date(eventDetails.start).toLocaleString()}
                </span>

                <span className='text-muted-foreground'>End:</span>
                <span className='font-medium'>
                  {eventDetails.end
                    ? new Date(eventDetails.end).toLocaleString()
                    : '—'}
                </span>
              </div>

              {eventDetails.extendedProps?.notes && (
                <div className='pt-1'>
                  <span className='text-muted-foreground text-xs'>Notes:</span>
                  <p className='bg-muted/50 mt-1 rounded p-2 text-sm whitespace-pre-wrap'>
                    {eventDetails.extendedProps.notes}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className='text-muted-foreground'>
              Loading appointment details...
            </div>
          )}
        </div>

        <DialogFooter className='flex w-full justify-end gap-2'>
          {eventDetails && status === 'scheduled' && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleEditEvent(eventDetails)}
              >
                <Pencil className='mr-1 h-4 w-4' /> Edit
              </Button>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => handleDeleteModal(eventDetails)}
              >
                <Trash2 className='mr-1 h-4 w-4' /> Delete
              </Button>
            </>
          )}
          {eventDetails && hasEncounter && (
            <Button variant='outline' size='sm' asChild>
              <Link href={`/encounters/${encounterId}`}>
                <ExternalLink className='mr-1 h-3.5 w-3.5' /> View Encounter
              </Link>
            </Button>
          )}
          <Button
            variant='secondary'
            size='sm'
            onClick={() => setShowEventViewDialog(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventViewDialog;
