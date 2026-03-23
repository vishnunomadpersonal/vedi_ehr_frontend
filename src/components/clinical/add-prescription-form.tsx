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
import { Pill, Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { Prescription } from '@/types';
import {
  EncounterLinkSelect,
  resolveEncounterId,
  type EncounterOption
} from '@/components/clinical/encounter-link-select';

interface AddPrescriptionFormProps {
  patientId: string;
  encounterId?: string;
  encounters?: EncounterOption[];
  onSuccess: () => void;
  /** When provided, the form opens in edit mode pre-populated with this data */
  editData?: Prescription | null;
  /** Called when user cancels editing (clears editData in parent) */
  onCancelEdit?: () => void;
  /** Extra content rendered inside the form card (e.g. document uploader) */
  children?: React.ReactNode;
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AddPrescriptionForm({
  patientId,
  encounterId,
  encounters,
  onSuccess,
  editData,
  onCancelEdit,
  children
}: AddPrescriptionFormProps) {
  const isEditMode = !!editData;
  const [open, setOpen] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<string>(
    encounterId ||
      (editData?.encounter_id ? String(editData.encounter_id) : '__none__')
  );
  const API = process.env.NEXT_PUBLIC_API_URL || '/api';

  // Medication fields
  const [medicationName, setMedicationName] = useState(
    editData?.medications?.[0]?.medication_name ||
      editData?.medication_reference ||
      ''
  );
  const [dosage, setDosage] = useState(
    editData?.medications?.[0]?.dosage || ''
  );
  const [frequency, setFrequency] = useState(
    editData?.medications?.[0]?.frequency || ''
  );
  const [instructions, setInstructions] = useState(
    editData?.medications?.[0]?.instructions || ''
  );

  // Prescription fields
  const [status, setStatus] = useState(editData?.status || 'active');
  const [priority, setPriority] = useState(editData?.priority || 'routine');
  const [intent, setIntent] = useState(editData?.intent || 'order');
  const [refills, setRefills] = useState(
    editData?.dispense_request_number_of_repeats != null
      ? String(editData.dispense_request_number_of_repeats)
      : ''
  );
  const [quantity, setQuantity] = useState(
    editData?.dispense_request_quantity_value != null
      ? String(editData.dispense_request_quantity_value)
      : ''
  );
  const [quantityUnit, setQuantityUnit] = useState(
    editData?.dispense_request_quantity_unit || 'tablets'
  );
  const [notes, setNotes] = useState(editData?.fhir_note || '');

  const reset = () => {
    setMedicationName('');
    setDosage('');
    setFrequency('');
    setInstructions('');
    setStatus('active');
    setPriority('routine');
    setIntent('order');
    setRefills('');
    setQuantity('');
    setQuantityUnit('tablets');
    setNotes('');
    setOpen(false);
    onCancelEdit?.();
  };

  const handleSubmit = async () => {
    if (!medicationName.trim()) {
      toast.error('Medication name is required');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        // ── EDIT mode: PATCH the existing prescription ──
        const rxId = editData!.prescription_id || editData!.id;
        const rxBody: Record<string, unknown> = {
          status,
          intent,
          priority,
          medication_reference: medicationName.trim(),
          medication_codeable_concept: { text: medicationName.trim() }
        };
        if (refills.trim())
          rxBody.dispense_request_number_of_repeats = parseInt(refills);
        if (quantity.trim()) {
          rxBody.dispense_request_quantity_value = parseFloat(quantity);
          rxBody.dispense_request_quantity_unit = quantityUnit;
        }
        if (dosage.trim() || frequency.trim()) {
          rxBody.dosage_instruction = {
            text: [dosage.trim(), frequency.trim()].filter(Boolean).join(' — '),
            doseAndRate: dosage.trim()
              ? [{ doseQuantity: { value: dosage.trim() } }]
              : undefined
          };
        }
        if (notes.trim()) rxBody.fhir_note = notes.trim();

        const res = await fetch(`${API}/v1/prescriptions/${rxId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rxBody)
        });
        if (!res.ok) throw new Error('Failed to update prescription');

        toast.success('Prescription updated successfully');
        reset();
        onSuccess();
      } else {
        // ── CREATE mode (original logic) ──
        const medId = generateId('med');
        const medRes = await fetch(`${API}/v1/medications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            medication_id: medId,
            medication_name: medicationName.trim(),
            dosage: dosage.trim() || null,
            frequency: frequency.trim() || null,
            instructions: instructions.trim() || null,
            status: 'active'
          })
        });

        if (!medRes.ok) throw new Error('Failed to create medication');

        // 2. Create the prescription
        const rxId = generateId('rx');
        const rxBody: Record<string, unknown> = {
          prescription_id: rxId,
          patient_id: Number(patientId),
          doctor_id: 1, // TODO: resolve from session
          ...(() => {
            const eid = encounterId
              ? Number(encounterId)
              : resolveEncounterId(selectedEncounter);
            return eid ? { encounter_id: eid } : {};
          })(),
          date_issued: new Date().toISOString().split('T')[0],
          status,
          intent,
          priority,
          medication_reference: `Medication/${medId}`,
          medication_codeable_concept: { text: medicationName.trim() }
        };
        if (refills.trim())
          rxBody.dispense_request_number_of_repeats = parseInt(refills);
        if (quantity.trim()) {
          rxBody.dispense_request_quantity_value = parseFloat(quantity);
          rxBody.dispense_request_quantity_unit = quantityUnit;
        }
        if (dosage.trim() || frequency.trim()) {
          rxBody.dosage_instruction = {
            text: [dosage.trim(), frequency.trim()].filter(Boolean).join(' — '),
            doseAndRate: dosage.trim()
              ? [{ doseQuantity: { value: dosage.trim() } }]
              : undefined
          };
        }
        if (notes.trim()) rxBody.fhir_note = notes.trim();

        const rxRes = await fetch(`${API}/v1/prescriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rxBody)
        });

        if (!rxRes.ok) throw new Error('Failed to create prescription');

        // 3. Link prescription ↔ medication via junction table
        try {
          await fetch(`${API}/v1/prescriptions/${rxId}/medications/${medId}`, {
            method: 'PUT'
          });
        } catch {
          // Junction link is best-effort; the prescription is still usable
        }

        toast.success('Prescription created successfully');
        reset();
        onSuccess();
      } // end else (create mode)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create prescription'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Plus className='mr-1 h-3.5 w-3.5' />
        Add Prescription
      </Button>
    );
  }

  return (
    <Card className='border-primary/30 bg-primary/2 border-dashed'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Pill className='text-primary h-4 w-4' />
          {isEditMode ? 'Edit Prescription' : 'New Prescription'}
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
        {/* Medication Info */}
        <div className='space-y-3'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            Medication
          </p>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4'>
            <div className='space-y-1 sm:col-span-2'>
              <Label className='text-[11px]'>Medication Name *</Label>
              <Input
                placeholder='e.g., Amoxicillin'
                value={medicationName}
                onChange={(e) => setMedicationName(e.target.value)}
                className='h-8 text-sm'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-[11px]'>Dosage</Label>
              <Input
                placeholder='e.g., 500mg'
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className='h-8 text-sm'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-[11px]'>Frequency</Label>
              <Input
                placeholder='e.g., Twice daily'
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className='h-8 text-sm'
              />
            </div>
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Instructions</Label>
            <Input
              placeholder='e.g., Take with food'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
        </div>

        {/* Prescription Details */}
        <div className='space-y-3'>
          <p className='text-muted-foreground text-xs font-medium tracking-wide uppercase'>
            Prescription Details
          </p>
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
            <div className='space-y-1'>
              <Label className='text-[11px]'>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className='h-8 text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='on-hold'>On Hold</SelectItem>
                  <SelectItem value='stopped'>Stopped</SelectItem>
                  <SelectItem value='draft'>Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-[11px]'>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className='h-8 text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='routine'>Routine</SelectItem>
                  <SelectItem value='urgent'>Urgent</SelectItem>
                  <SelectItem value='asap'>ASAP</SelectItem>
                  <SelectItem value='stat'>STAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-[11px]'>Intent</Label>
              <Select value={intent} onValueChange={setIntent}>
                <SelectTrigger className='h-8 text-sm'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='order'>Order</SelectItem>
                  <SelectItem value='plan'>Plan</SelectItem>
                  <SelectItem value='proposal'>Proposal</SelectItem>
                  <SelectItem value='original-order'>Original Order</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-1'>
              <Label className='text-[11px]'>Refills</Label>
              <Input
                type='number'
                min='0'
                placeholder='0'
                value={refills}
                onChange={(e) => setRefills(e.target.value)}
                className='h-8 text-sm'
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-[11px]'>Quantity</Label>
              <div className='flex gap-1'>
                <Input
                  type='number'
                  min='0'
                  placeholder='30'
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className='h-8 w-16 text-sm'
                />
                <Select value={quantityUnit} onValueChange={setQuantityUnit}>
                  <SelectTrigger className='h-8 flex-1 text-sm'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='tablets'>tablets</SelectItem>
                    <SelectItem value='capsules'>capsules</SelectItem>
                    <SelectItem value='mL'>mL</SelectItem>
                    <SelectItem value='mg'>mg</SelectItem>
                    <SelectItem value='units'>units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-1'>
          <Label className='text-[11px]'>Notes</Label>
          <Textarea
            placeholder='Additional prescription notes...'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className='text-sm'
          />
        </div>

        {children}

        <div className='flex justify-end gap-2'>
          <Button variant='ghost' size='sm' onClick={reset} disabled={saving}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />}
            {isEditMode ? 'Update Prescription' : 'Create Prescription'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
