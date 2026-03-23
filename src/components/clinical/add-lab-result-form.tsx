'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FlaskConical, Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  EncounterLinkSelect,
  resolveEncounterId,
  type EncounterOption
} from '@/components/clinical/encounter-link-select';
import type { LabResult } from '@/types';

interface AddLabResultFormProps {
  patientId: string;
  encounterId?: string;
  encounters?: EncounterOption[];
  onSuccess: () => void;
  /** When provided, the form opens in edit mode pre-populated with this data */
  editData?: LabResult | null;
  /** Called when user cancels editing */
  onCancelEdit?: () => void;
  /** Extra content rendered inside the form card (e.g. document uploader) */
  children?: React.ReactNode;
}

function generateId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AddLabResultForm({
  patientId,
  encounterId,
  encounters,
  onSuccess,
  editData,
  onCancelEdit,
  children
}: AddLabResultFormProps) {
  const isEditMode = !!editData;
  const [open, setOpen] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [selectedEncounter, setSelectedEncounter] = useState<string>(
    encounterId ||
      (editData?.encounter_id ? String(editData.encounter_id) : '__none__')
  );
  const API = process.env.NEXT_PUBLIC_API_URL || '/api';

  const [testType, setTestType] = useState(editData?.test_type || '');
  const [testDate, setTestDate] = useState(
    editData?.test_date || new Date().toISOString().split('T')[0]
  );
  const [testFacility, setTestFacility] = useState(
    editData?.test_facility || ''
  );
  const [resultValue, setResultValue] = useState(editData?.result_value || '');
  const [resultUnit, setResultUnit] = useState(editData?.result_unit || '');
  const [referenceRange, setReferenceRange] = useState(
    editData?.reference_range || ''
  );
  const [status, setStatus] = useState(editData?.status || 'final');
  const [criticalFlag, setCriticalFlag] = useState(
    editData?.critical_flag ?? false
  );
  const [conclusion, setConclusion] = useState(editData?.conclusion || '');
  const [loincCode, setLoincCode] = useState(editData?.loinc_code || '');
  const [performingLab, setPerformingLab] = useState(
    editData?.performing_lab || ''
  );

  const reset = () => {
    setTestType('');
    setTestDate(new Date().toISOString().split('T')[0]);
    setTestFacility('');
    setResultValue('');
    setResultUnit('');
    setReferenceRange('');
    setStatus('final');
    setCriticalFlag(false);
    setConclusion('');
    setLoincCode('');
    setPerformingLab('');
    setOpen(false);
    onCancelEdit?.();
  };

  const handleSubmit = async () => {
    if (!testType.trim()) {
      toast.error('Test type is required');
      return;
    }

    setSaving(true);
    try {
      if (isEditMode) {
        // ── EDIT mode: PATCH existing lab result ──
        const labId = editData!.lab_examination_id || editData!.id;
        const body: Record<string, unknown> = {
          test_type: testType.trim(),
          test_date: testDate || null,
          test_facility: testFacility.trim() || null,
          result_value: resultValue.trim() || null,
          reference_range: referenceRange.trim() || null,
          status,
          critical_flag: criticalFlag,
          conclusion: conclusion.trim() || null,
          loinc_code: loincCode.trim() || null,
          performing_lab: performingLab.trim() || null
        };
        const res = await fetch(`${API}/v1/lab-results/${labId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to update lab result');
        toast.success('Lab result updated successfully');
        reset();
        onSuccess();
      } else {
        // ── CREATE mode ──
        const id = generateId('lab');
        const body: Record<string, unknown> = {
          lab_examination_id: id,
          patient_id: patientId,
          ...(() => {
            const eid = encounterId
              ? Number(encounterId)
              : resolveEncounterId(selectedEncounter);
            return eid ? { encounter_id: eid } : {};
          })(),
          test_type: testType.trim(),
          test_date: testDate || null,
          test_facility: testFacility.trim() || null,
          result_value: resultValue.trim() || null,
          reference_range: referenceRange.trim() || null,
          status,
          critical_flag: criticalFlag,
          conclusion: conclusion.trim() || null,
          loinc_code: loincCode.trim() || null,
          performing_lab: performingLab.trim() || null
        };

        const res = await fetch(`${API}/v1/lab-results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error('Failed to create lab result');

        toast.success('Lab result added successfully');
        reset();
        onSuccess();
      } // end else (create mode)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create lab result'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Plus className='mr-1 h-3.5 w-3.5' />
        Add Lab Result
      </Button>
    );
  }

  return (
    <Card className='border-primary/30 bg-primary/2 border-dashed'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <FlaskConical className='text-primary h-4 w-4' />
          {isEditMode ? 'Edit Lab Result' : 'New Lab Result'}
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
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4'>
          <div className='space-y-1 sm:col-span-2'>
            <Label className='text-[11px]'>Test Type *</Label>
            <Input
              placeholder='e.g., Complete Blood Count (CBC)'
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Test Date</Label>
            <Input
              type='date'
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className='h-8 text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='registered'>Registered</SelectItem>
                <SelectItem value='preliminary'>Preliminary</SelectItem>
                <SelectItem value='final'>Final</SelectItem>
                <SelectItem value='amended'>Amended</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4'>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Result Value</Label>
            <Input
              placeholder='e.g., 14.2'
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Unit</Label>
            <Input
              placeholder='e.g., g/dL'
              value={resultUnit}
              onChange={(e) => setResultUnit(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Reference Range</Label>
            <Input
              placeholder='e.g., 12.0-17.5 g/dL'
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>LOINC Code</Label>
            <Input
              placeholder='e.g., 718-7'
              value={loincCode}
              onChange={(e) => setLoincCode(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Test Facility</Label>
            <Input
              placeholder='e.g., City General Hospital Lab'
              value={testFacility}
              onChange={(e) => setTestFacility(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
          <div className='space-y-1'>
            <Label className='text-[11px]'>Performing Lab</Label>
            <Input
              placeholder='e.g., Quest Diagnostics'
              value={performingLab}
              onChange={(e) => setPerformingLab(e.target.value)}
              className='h-8 text-sm'
            />
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Switch
            checked={criticalFlag}
            onCheckedChange={setCriticalFlag}
            id='critical-flag'
          />
          <Label htmlFor='critical-flag' className='cursor-pointer text-sm'>
            Critical / Abnormal Result
          </Label>
        </div>

        <div className='space-y-1'>
          <Label className='text-[11px]'>Conclusion</Label>
          <Textarea
            placeholder='Interpretation or conclusion notes...'
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
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
            {isEditMode ? 'Update Lab Result' : 'Save Lab Result'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
