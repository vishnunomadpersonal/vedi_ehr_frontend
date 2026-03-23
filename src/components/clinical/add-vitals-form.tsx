'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface AddVitalsFormProps {
  patientId: string;
  encounterId: string;
  onSuccess: () => void;
}

const VITAL_FIELDS: {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
  step?: string;
}[] = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
  {
    key: 'blood_pressure_sys',
    label: 'BP Systolic',
    unit: 'mmHg',
    placeholder: '120'
  },
  {
    key: 'blood_pressure_dia',
    label: 'BP Diastolic',
    unit: 'mmHg',
    placeholder: '80'
  },
  {
    key: 'body_temperature',
    label: 'Temperature',
    unit: '°F',
    placeholder: '98.6',
    step: '0.1'
  },
  {
    key: 'respiratory_rate',
    label: 'Respiratory Rate',
    unit: '/min',
    placeholder: '16'
  },
  { key: 'SpO2', label: 'SpO₂', unit: '%', placeholder: '98' },
  {
    key: 'weight',
    label: 'Weight',
    unit: 'kg',
    placeholder: '70',
    step: '0.1'
  },
  {
    key: 'height',
    label: 'Height',
    unit: 'cm',
    placeholder: '170',
    step: '0.1'
  },
  { key: 'pain_scale', label: 'Pain Level', unit: '/10', placeholder: '0' },
  {
    key: 'blood_glucose_levels',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    placeholder: '100',
    step: '0.1'
  }
];

export function AddVitalsForm({
  patientId,
  encounterId,
  onSuccess
}: AddVitalsFormProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  const API = process.env.NEXT_PUBLIC_API_URL || '/api';

  const update = (key: string, val: string) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  const reset = () => {
    setValues({});
    setNotes('');
    setOpen(false);
  };

  const handleSubmit = async () => {
    const filled = Object.entries(values).filter(([, v]) => v.trim() !== '');
    if (filled.length === 0) {
      toast.error('Enter at least one vital sign value');
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        patient_id: patientId,
        encounter_id: Number(encounterId),
        date_recorded: new Date().toISOString().split('T')[0],
        time_recorded: new Date().toTimeString().split(' ')[0],
        status: 'final'
      };
      if (notes.trim()) body.note = notes.trim();

      for (const [k, v] of filled) {
        const num = parseFloat(v);
        if (!isNaN(num)) body[k] = num;
      }

      const res = await fetch(`${API}/v1/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error('Failed to save vitals');

      toast.success('Vitals recorded successfully');
      reset();
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save vitals');
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Button variant='outline' size='sm' onClick={() => setOpen(true)}>
        <Plus className='mr-1 h-3.5 w-3.5' />
        Add Vitals
      </Button>
    );
  }

  return (
    <Card className='border-primary/30 bg-primary/2 border-dashed'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2 text-sm'>
          <Activity className='text-primary h-4 w-4' />
          Record Vitals
        </CardTitle>
        <Button variant='ghost' size='icon' className='h-7 w-7' onClick={reset}>
          <X className='h-3.5 w-3.5' />
        </Button>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
          {VITAL_FIELDS.map((f) => (
            <div key={f.key} className='space-y-1'>
              <Label className='text-muted-foreground text-[11px]'>
                {f.label} <span className='text-[10px]'>({f.unit})</span>
              </Label>
              <Input
                type='number'
                step={f.step || '1'}
                placeholder={f.placeholder}
                value={values[f.key] || ''}
                onChange={(e) => update(f.key, e.target.value)}
                className='h-8 text-sm'
              />
            </div>
          ))}
        </div>

        <div className='space-y-1'>
          <Label className='text-muted-foreground text-[11px]'>Notes</Label>
          <Textarea
            placeholder='Optional notes about these readings...'
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className='text-sm'
          />
        </div>

        <div className='flex justify-end gap-2'>
          <Button variant='ghost' size='sm' onClick={reset} disabled={saving}>
            Cancel
          </Button>
          <Button size='sm' onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className='mr-1 h-3.5 w-3.5 animate-spin' />}
            Save Vitals
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
