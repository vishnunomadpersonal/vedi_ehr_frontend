'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { Paperclip } from 'lucide-react';
import type { CalEvent } from '@/types/calendar-types';
import {
  ENCOUNTER_TYPES,
  APPOINTMENT_DURATIONS,
  toLocalISOString
} from '@/types/calendar-types';
import {
  createAppointment,
  updateAppointment,
  searchPatients,
  searchStaff
} from '@/lib/schedule-service';
import {
  StagedFileUploader,
  type StagedFileUploaderHandle
} from '@/components/files/staged-file-uploader';
import {
  fetchDocumentCategories,
  DOCUMENT_TYPES_FALLBACK
} from '@/lib/document-types';

interface EventFormDialogProps {
  showModal: boolean;
  isEditing: boolean;
  currentEvent: CalEvent | undefined;
  handleCloseModal: () => void;
}

const CalendarEventFormDialog: React.FC<EventFormDialogProps> = ({
  showModal,
  isEditing,
  currentEvent,
  handleCloseModal
}) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<
    Array<{
      id: string;
      user_id?: number | null;
      name: string;
      email?: string;
      phone?: string;
      medical_record_number?: string;
    }>
  >([]);
  const [selectedPatient, setSelectedPatient] = useState<{
    patient_id: string;
    user_id?: number | null;
    patient_name: string;
  } | null>(null);
  const [providerName, setProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [providerSearch, setProviderSearch] = useState('');
  const [staffResults, setStaffResults] = useState<
    Array<{
      id: number;
      user_id: number;
      name: string;
      specialization?: string;
      department?: string;
      role?: string;
      email?: string;
    }>
  >([]);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [appointmentStart, setAppointmentStart] = useState('');
  const [appointmentEnd, setAppointmentEnd] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [encounterType, setEncounterType] = useState('office_visit');
  const [notes, setNotes] = useState('');
  const [showPatientsDropdown, setShowPatientsDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDocSection, setShowDocSection] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [docCategories, setDocCategories] = useState<
    { value: string; label: string }[]
  >([...DOCUMENT_TYPES_FALLBACK]);
  const patientInputRef = useRef<HTMLDivElement>(null);
  const providerInputRef = useRef<HTMLDivElement>(null);
  const uploaderRef = useRef<StagedFileUploaderHandle>(null);

  const debouncedPatientSearch = useDebounce(patientSearch, 300);
  const debouncedProviderSearch = useDebounce(providerSearch, 300);

  const resetState = () => {
    setPatientSearch('');
    setPatients([]);
    setSelectedPatient(null);
    setProviderName('');
    setProviderId('');
    setProviderSearch('');
    setStaffResults([]);
    setShowProviderDropdown(false);
    setAppointmentStart('');
    setAppointmentEnd('');
    setSelectedDuration(30);
    setChiefComplaint('');
    setEncounterType('office_visit');
    setNotes('');
    setShowPatientsDropdown(false);
    setShowDocSection(false);
    setDocumentType('');
  };

  // Fetch document categories from the DB once
  useEffect(() => {
    fetchDocumentCategories().then((cats) => {
      setDocCategories(cats);
      if (!documentType && cats.length > 0) setDocumentType(cats[0].value);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load patients based on debounced search
  useEffect(() => {
    if (debouncedPatientSearch && debouncedPatientSearch.length >= 2) {
      searchPatients(debouncedPatientSearch).then((results) => {
        setPatients(results);
        setShowPatientsDropdown(true);
      });
    } else {
      setPatients([]);
      setShowPatientsDropdown(false);
    }
  }, [debouncedPatientSearch]);

  // Load staff based on debounced provider search
  useEffect(() => {
    if (debouncedProviderSearch && debouncedProviderSearch.length >= 2) {
      searchStaff(debouncedProviderSearch).then((results) => {
        setStaffResults(results);
        setShowProviderDropdown(true);
      });
    } else {
      setStaffResults([]);
      setShowProviderDropdown(false);
    }
  }, [debouncedProviderSearch]);

  // Populate form from currentEvent
  useEffect(() => {
    if (currentEvent) {
      const start = currentEvent.start
        ? toLocalISOString(new Date(currentEvent.start)).slice(0, 16)
        : '';
      setAppointmentStart(start);

      if (currentEvent.end) {
        setAppointmentEnd(
          toLocalISOString(new Date(currentEvent.end)).slice(0, 16)
        );
      } else if (start) {
        const endDate = new Date(currentEvent.start);
        endDate.setMinutes(endDate.getMinutes() + selectedDuration);
        setAppointmentEnd(toLocalISOString(endDate).slice(0, 16));
      }

      if (isEditing && currentEvent.extendedProps) {
        setSelectedPatient({
          patient_id: currentEvent.extendedProps.patient_id || '',
          user_id:
            currentEvent.extendedProps.user_id != null
              ? Number(currentEvent.extendedProps.user_id)
              : null,
          patient_name: currentEvent.extendedProps.patient_name || ''
        });
        setPatientSearch(currentEvent.extendedProps.patient_name || '');
        setProviderName(currentEvent.extendedProps.provider_name || '');
        setProviderId(currentEvent.extendedProps.provider_id || '');
        setProviderSearch(currentEvent.extendedProps.provider_name || '');
        setChiefComplaint(currentEvent.extendedProps.chief_complaint || '');
        setEncounterType(
          currentEvent.extendedProps.encounter_type || 'office_visit'
        );
        setNotes(currentEvent.extendedProps.notes || '');
      }
    }
  }, [isEditing, currentEvent]);

  // Click outside patient dropdown to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        patientInputRef.current &&
        !patientInputRef.current.contains(event.target as Node)
      ) {
        setShowPatientsDropdown(false);
      }
      if (
        providerInputRef.current &&
        !providerInputRef.current.contains(event.target as Node)
      ) {
        setShowProviderDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-compute end time from start + duration
  const handleDurationChange = (duration: number) => {
    setSelectedDuration(duration);
    if (appointmentStart) {
      const startTime = new Date(appointmentStart);
      startTime.setMinutes(startTime.getMinutes() + duration);
      setAppointmentEnd(toLocalISOString(startTime).slice(0, 16));
    }
  };

  useEffect(() => {
    if (appointmentStart && selectedDuration) {
      const startTime = new Date(appointmentStart);
      startTime.setMinutes(startTime.getMinutes() + selectedDuration);
      setAppointmentEnd(toLocalISOString(startTime).slice(0, 16));
    }
  }, [appointmentStart, selectedDuration]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    setSaving(true);
    const eventData: CalEvent = {
      id: isEditing && currentEvent ? currentEvent.id : '',
      // Keep local-time strings — backend stores naive datetimes
      start: appointmentStart,
      end: appointmentEnd,
      title: selectedPatient.patient_name,
      extendedProps: {
        patient_id: selectedPatient.patient_id,
        user_id: selectedPatient.user_id ?? null,
        patient_name: selectedPatient.patient_name,
        provider_id: providerId,
        provider_name: providerName,
        encounter_type: encounterType,
        chief_complaint: chiefComplaint,
        notes: notes,
        status: 'scheduled'
      }
    };

    try {
      if (isEditing) {
        const resp = await updateAppointment(eventData);
        if (resp.status === 200) {
          toast.success('Appointment updated successfully');
        } else {
          toast.error('Appointment update error');
        }
      } else {
        const resp = await createAppointment(eventData);
        if (resp.status === 200) {
          toast.success('Appointment created successfully');

          // Upload staged documents if any
          const stagedCount = uploaderRef.current?.stagedCount ?? 0;
          if (stagedCount > 0 && selectedPatient) {
            try {
              const apptId = String(
                resp.data.appointment_id ?? resp.data.id ?? ''
              );
              await uploaderRef.current!.uploadAll(
                selectedPatient.patient_id,
                apptId,
                {
                  document_type: documentType,
                  upload_source: 'appointment',
                  patient_name: selectedPatient.patient_name,
                  encounter_type: encounterType
                }
              );
              toast.success(`${stagedCount} document(s) uploaded`);
            } catch {
              toast.error('Some documents failed to upload');
            }
          }
        } else {
          toast.error('Appointment creation error');
        }
      }
      resetState();
      handleCloseModal();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={showModal}
      onOpenChange={() => {
        handleCloseModal();
        resetState();
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Appointment' : 'Add Appointment'}
          </DialogTitle>
          <DialogDescription>
            Manage your appointments efficiently.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className='scrollbar-invisible max-h-[70vh] space-y-4 overflow-y-auto pr-1'
        >
          {/* Patient Search */}
          <div ref={patientInputRef} className='relative space-y-1'>
            <Label className='text-muted-foreground text-xs'>Patient</Label>
            <Input
              placeholder='Search patient by name...'
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                setSelectedPatient(null);
              }}
              onFocus={() =>
                patients.length > 0 && setShowPatientsDropdown(true)
              }
              className='h-9 text-sm'
            />
            {showPatientsDropdown && patients.length > 0 && (
              <ul className='bg-popover absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border shadow-lg'>
                {patients.map((patient) => (
                  <li
                    key={patient.id}
                    className='hover:bg-accent cursor-pointer px-3 py-2 text-sm'
                    onClick={() => {
                      setSelectedPatient({
                        patient_id: patient.id,
                        user_id: patient.user_id ?? null,
                        patient_name: patient.name
                      });
                      setPatientSearch(patient.name);
                      setShowPatientsDropdown(false);
                    }}
                  >
                    <span className='font-medium'>{patient.name}</span>
                    {patient.medical_record_number && (
                      <span className='text-muted-foreground ml-2 text-xs'>
                        MRN: {patient.medical_record_number}
                      </span>
                    )}
                    {(patient.email || patient.phone) && (
                      <span className='text-muted-foreground block text-xs'>
                        {patient.email && `${patient.email}`}
                        {patient.email && patient.phone && ' · '}
                        {patient.phone && `${patient.phone}`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Provider Search */}
          <div ref={providerInputRef} className='relative space-y-1'>
            <Label className='text-muted-foreground text-xs'>
              Provider Name
            </Label>
            <Input
              placeholder='Search provider by name...'
              value={providerSearch}
              onChange={(e) => {
                setProviderSearch(e.target.value);
                setProviderName('');
                setProviderId('');
              }}
              onFocus={() =>
                staffResults.length > 0 && setShowProviderDropdown(true)
              }
              className='h-9 text-sm'
            />
            {showProviderDropdown && staffResults.length > 0 && (
              <ul className='bg-popover absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border shadow-lg'>
                {staffResults.map((staff) => (
                  <li
                    key={staff.id}
                    className='hover:bg-accent cursor-pointer px-3 py-2 text-sm'
                    onClick={() => {
                      setProviderName(staff.name);
                      setProviderId(String(staff.user_id));
                      setProviderSearch(staff.name);
                      setShowProviderDropdown(false);
                    }}
                  >
                    <span className='font-medium'>{staff.name}</span>
                    {staff.specialization && (
                      <span className='text-muted-foreground ml-2 text-xs'>
                        {staff.specialization}
                      </span>
                    )}
                    {(staff.department || staff.email) && (
                      <span className='text-muted-foreground block text-xs'>
                        {staff.department && `${staff.department}`}
                        {staff.department && staff.email && ' · '}
                        {staff.email && `${staff.email}`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Encounter Type */}
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>
              Encounter Type
            </Label>
            <Select value={encounterType} onValueChange={setEncounterType}>
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue placeholder='Select type' />
              </SelectTrigger>
              <SelectContent>
                {ENCOUNTER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Time */}
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>Start Time</Label>
            <Input
              type='datetime-local'
              value={appointmentStart}
              onChange={(e) => setAppointmentStart(e.target.value)}
              required
              className='h-9 text-sm'
            />
          </div>

          {/* Duration */}
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>Duration</Label>
            <Select
              value={selectedDuration.toString()}
              onValueChange={(v) => handleDurationChange(parseInt(v))}
            >
              <SelectTrigger className='h-9 text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPOINTMENT_DURATIONS.map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    {d} mins
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* End Time (auto-filled) */}
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>End Time</Label>
            <Input
              type='datetime-local'
              value={appointmentEnd}
              onChange={(e) => setAppointmentEnd(e.target.value)}
              required
              className='h-9 text-sm'
            />
          </div>

          {/* Chief Complaint */}
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>
              Chief Complaint
            </Label>
            <Textarea
              placeholder='Reason for visit / chief complaint'
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className='min-h-16 text-sm'
            />
          </div>

          {/* Notes */}
          <div className='space-y-1'>
            <Label className='text-muted-foreground text-xs'>Notes</Label>
            <Textarea
              placeholder='Additional notes...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className='min-h-12 text-sm'
            />
          </div>

          {/* Documents */}
          {!isEditing && (
            <div className='border-muted-foreground/25 space-y-2 rounded-md border border-dashed p-3'>
              <button
                type='button'
                className='text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 text-xs font-medium transition-colors'
                onClick={() => setShowDocSection((v) => !v)}
              >
                <Paperclip className='h-3.5 w-3.5' />
                <span>Attach documents</span>
                {(uploaderRef.current?.stagedCount ?? 0) > 0 && (
                  <span className='bg-primary text-primary-foreground ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium'>
                    {uploaderRef.current!.stagedCount}
                  </span>
                )}
                <svg
                  className={`ml-auto h-3.5 w-3.5 transition-transform ${showDocSection ? 'rotate-180' : ''}`}
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='m6 9 6 6 6-6' />
                </svg>
              </button>

              <div className={showDocSection ? 'space-y-3 pt-1' : 'hidden'}>
                {/* Patient & encounter context */}
                {selectedPatient && (
                  <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                    <span className='bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium'>
                      Patient: {selectedPatient.patient_name}
                    </span>
                    <span className='bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5'>
                      {ENCOUNTER_TYPES.find((t) => t.value === encounterType)
                        ?.label ?? encounterType}
                    </span>
                  </div>
                )}

                {/* Document type selector */}
                <div className='space-y-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Document Type
                  </Label>
                  <Select value={documentType} onValueChange={setDocumentType}>
                    <SelectTrigger className='h-8 text-xs'>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {docCategories.map((dt) => (
                        <SelectItem
                          key={dt.value}
                          value={dt.value}
                          className='text-xs'
                        >
                          {dt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File uploader — always mounted so staged files survive collapse */}
                <StagedFileUploader ref={uploaderRef} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type='submit' disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type='button'
              variant='secondary'
              onClick={() => {
                handleCloseModal();
                resetState();
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventFormDialog;
