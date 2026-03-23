'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Syringe, Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  EncounterLinkSelect,
  resolveEncounterId,
  type EncounterOption
} from '@/components/clinical/encounter-link-select';
import type { Surgery } from '@/types';

interface AddSurgeryFormProps {
  patientId: string;
  encounterId?: string;
  encounters?: EncounterOption[];
  onSuccess: () => void;
  /** When provided, the form opens in edit mode pre-populated with this data */
  editData?: Surgery | null;
  /** Called when user cancels editing */
  onCancelEdit?: () => void;
  /** Extra content rendered inside the form card (e.g. document uploader) */
  children?: React.ReactNode;
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AddSurgeryForm({
  patientId,
  encounterId,
  encounters,
  onSuccess,
  editData,
  onCancelEdit,
  children
}: AddSurgeryFormProps) {
  const isEditMode = !!editData;
  const [open, setOpen] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<string>(
    encounterId ||
      (editData?.encounter_id ? String(editData.encounter_id) : '__none__')
  );
  const API = process.env.NEXT_PUBLIC_API_URL || '/api';

  const [surgeryType, setSurgeryType] = useState(editData?.surgery_type || '');
  const [surgeryDesc, setSurgeryDesc] = useState(editData?.surgery_desc || '');
  const [surgeryDate, setSurgeryDate] = useState(
    editData?.surgery_date || new Date().toISOString().split('T')[0]
  );
  const [surgeryFacility, setSurgeryFacility] = useState(
    editData?.surgery_facility || ''
  );
  const [status, setStatus] = useState(editData?.status || 'completed');
  const [anesthesiaType, setAnesthesiaType] = useState(
    editData?.anesthesia_type || ''
  );
  const [estimatedBloodLoss, setEstimatedBloodLoss] = useState(
    editData?.estimated_blood_loss_ml != null
      ? String(editData.estimated_blood_loss_ml)
      : ''
  );
  const [cptCode, setCptCode] = useState(editData?.cpt_code || '');
  const [notes, setNotes] = useState(editData?.fhir_note || '');

  const reset = () => {
    setSurgeryType('');
    setSurgeryDesc('');
    setSurgeryDate(new Date().toISOString().split('T')[0]);
    setSurgeryFacility('');
    setStatus('completed');
    setAnesthesiaType('');
    setEstimatedBloodLoss('');
    setCptCode('');
    setNotes('');
    setOpen(false);
    onCancelEdit?.();
  };

  const handleSubmit = async () => {
    if (!surgeryType.trim()) {
      toast.error('Procedure type is required');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        // ── EDIT mode: PATCH existing surgery ──
        const sId = editData!.surgery_id || editData!.id;
        const body: Record<string, unknown> = {
          surgery_type: surgeryType.trim(),
          surgery_desc: surgeryDesc.trim() || null,
          surgery_date: surgeryDate || null,
          surgery_facility: surgeryFacility.trim() || null,
          status,
          anesthesia_type: anesthesiaType.trim() || null,
          cpt_code: cptCode.trim() || null,
          fhir_note: notes.trim() || null,
          performed_datetime: surgeryDate
            ? new Date(surgeryDate).toISOString()
            : null
        };
        if (estimatedBloodLoss.trim()) {
          body.estimated_blood_loss_ml = parseInt(estimatedBloodLoss);
        }
        const res = await fetch(`${API}/v1/surgery/${sId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to update procedure');
        toast.success('Procedure updated successfully');
        reset();
        onSuccess();
      } else {
        // ── CREATE mode ──
        const id = generateId('surg');
        const body: Record<string, unknown> = {
          surgery_id: id,
          patient_id: patientId,
          ...(() => {
            const eid = encounterId
              ? Number(encounterId)
              : resolveEncounterId(selectedEncounter);
            return eid ? { encounter_id: eid } : {};
          })(),
          surgery_type: surgeryType.trim(),
          surgery_desc: surgeryDesc.trim() || null,
          surgery_date: surgeryDate || null,
          surgery_facility: surgeryFacility.trim() || null,
          status,
          anesthesia_type: anesthesiaType.trim() || null,
          cpt_code: cptCode.trim() || null,
          fhir_note: notes.trim() || null,
          performed_datetime: surgeryDate
            ? new Date(surgeryDate).toISOString()
            : null
        };
        if (estimatedBloodLoss.trim()) {
          body.estimated_blood_loss_ml = parseInt(estimatedBloodLoss);
        }

        const res = await fetch(`${API}/v1/surgery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error('Failed to create procedure record');

        toast.success('Procedure recorded successfully');
        reset();
        onSuccess();
      } // end else (create mode)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create procedure'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Plus className='mr-1 h-3.5 w-3.5' />
        Add Procedure
      </Button>
    );
  }

  return (
    <Card className='border-primary/30 bg-primary/2 border-dashed'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Syringe className='text-primary h-4 w-4' />
          {isEditMode ? 'Edit Procedure / Surgery' : 'New Procedure / Surgery'}
        </CardTitle>
        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={reset}>
          <X className='h-3.5 w-3.5' />
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Encounter Link (shown when no fixed encounterId) */}
        {!encounterId && encounters && (
          <EncounterLinkSelect
            encounters={encounters}
            value={selectedEncounter}
            onValueChange={setSelectedEncounter}
          />
        )}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3'>
          <div className='space-y-1 sm:col-span-2'>
            <Label className='text-[11px]'>Procedure Type *</Label>
            <Input
              placeholder='e.g., Appendectomy, Knee Arthroscopy'
              value={surgeryType}
              onChange={(e) => setSurgeryType(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Date</Label>
            <Input
              type='date'
              value={surgeryDate}
              onChange={(e) => setSurgeryDate(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4'>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='h-8 text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='preparation'>Preparation</SelectItem>
                <SelectItem value='in-progress'>In Progress</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='not-done'>Not Done</SelectItem>
                <SelectItem value='on-hold'>On Hold</SelectItem>
                <SelectItem value='stopped'>Stopped</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Anesthesia Type</Label>
            <Select value={anesthesiaType} onValueChange={setAnesthesiaType}>
              <SelectTrigger className='h-8 text-sm'>
                <SelectValue placeholder='Select...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='general'>General</SelectItem>
                <SelectItem value='local'>Local</SelectItem>
                <SelectItem value='regional'>Regional</SelectItem>
                <SelectItem value='spinal'>Spinal</SelectItem>
                <SelectItem value='epidural'>Epidural</SelectItem>
                <SelectItem value='sedation'>Sedation</SelectItem>
                <SelectItem value='none'>None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Est. Blood Loss (mL)</Label>
            <Input
              type='number'
              min='0'
              placeholder='0'
              value={estimatedBloodLoss}
              onChange={(e) => setEstimatedBloodLoss(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>CPT Code</Label>
            <Input
              placeholder='e.g., 44950'
              value={cptCode}
              onChange={(e) => setCptCode(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
        </div>

        <div className='space-y-1'>
          <Label className='text-[11px]'>Facility</Label>
          <Input
            placeholder='e.g., City General Hospital - OR Suite 3'
            value={surgeryFacility}
            onChange={(e) => setSurgeryFacility(e.target.value)}
            className='h-8 text-sm'
          />
        </div>

        <div className='space-y-1'>
          <Label className='text-[11px]'>Description / Notes</Label>
          <Textarea
            placeholder='Procedure description, findings, complications, outcome...'
            value={surgeryDesc}
            onChange={(e) => setSurgeryDesc(e.target.value)}
            rows={3}
            className='text-sm'
          />
        </div>

        {notes !== surgeryDesc && (
          <div className='space-y-1'>
            <Label className='text-[11px]'>Additional Notes</Label>
            <Textarea
              placeholder='Additional notes...'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className='text-sm'
            />
          </div>
        )}

        {children}

        <div className='flex justify-end gap-2'>
          <Button variant='ghost' size='sm' onClick={reset} disabled={saving}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />}
            {isEditMode ? 'Update Procedure' : 'Save Procedure'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
