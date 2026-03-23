'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  EncounterLinkSelect,
  type EncounterOption
} from '@/components/clinical/encounter-link-select';

export type { EncounterOption };

interface VitalEditFormContentProps {
  draft: Record<string, unknown>;
  onUpdate: (key: string, value: unknown) => void;
  encounters?: EncounterOption[];
}

/** Comprehensive vital-signs edit form (30+ fields).
 *  Used for both "new" and "edit" modes on patient & encounter pages. */
export function VitalEditFormContent({
  draft,
  onUpdate,
  encounters
}: VitalEditFormContentProps) {
  const numField = (label: string, key: string, unit?: string) => (
    <div className='space-y-1'>
      <Label className='text-muted-foreground text-[11px]'>
        {label}
        {unit ? ` (${unit})` : ''}
      </Label>
      <Input
        className='h-8 text-xs'
        type='number'
        step='any'
        value={draft[key] != null ? String(draft[key]) : ''}
        onChange={(e) =>
          onUpdate(key, e.target.value ? parseFloat(e.target.value) : null)
        }
        placeholder={label}
      />
    </div>
  );
  const textField = (label: string, key: string) => (
    <div className='space-y-1'>
      <Label className='text-muted-foreground text-[11px]'>{label}</Label>
      <Input
        className='h-8 text-xs'
        value={(draft[key] as string) || ''}
        onChange={(e) => onUpdate(key, e.target.value)}
        placeholder={label}
      />
    </div>
  );
  return (
    <div className='space-y-5'>
      {/* Encounter Link (optional) */}
      {encounters && (
        <EncounterLinkSelect
          encounters={encounters}
          value={draft.encounter_id ? String(draft.encounter_id) : '__none__'}
          onValueChange={(v) =>
            onUpdate('encounter_id', v === '__none__' ? null : Number(v))
          }
        />
      )}
      {/* Date */}
      <div>
        <Label className='text-muted-foreground text-[11px]'>
          Date Recorded
        </Label>
        <Input
          className='h-8 w-48 text-xs'
          type='date'
          value={(draft.date_recorded as string) || ''}
          onChange={(e) => onUpdate('date_recorded', e.target.value)}
        />
      </div>
      {/* Core Vitals */}
      <div>
        <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
          Vital Signs
        </h4>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
          {numField('Systolic BP', 'blood_pressure_sys', 'mmHg')}
          {numField('Diastolic BP', 'blood_pressure_dia', 'mmHg')}
          {numField('Heart Rate', 'heart_rate', 'bpm')}
          {numField('Temperature', 'body_temperature', '°F')}
          {numField('SpO2', 'SpO2', '%')}
          {numField('Respiratory Rate', 'respiratory_rate', '/min')}
          {numField('Weight', 'weight', 'lbs')}
          {numField('Height', 'height', 'in')}
          {numField('Pain Scale', 'pain_scale', '0-10')}
          {numField('BMI', 'body_mass_index')}
        </div>
      </div>
      {/* Body Composition */}
      <div>
        <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
          Body Composition
        </h4>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
          {numField('Body Fat', 'fat', '%')}
          {numField('Water', 'water', '%')}
          {numField('Muscle Mass', 'muscle_mass', 'lbs')}
          {numField('Bone Mass', 'bone_mass', 'lbs')}
          {numField('Protein', 'protein', '%')}
          {textField('Body Type', 'body_type')}
          {numField('Metabolic Age', 'metabolic_age')}
          {numField('Basal Metabolism', 'basal_metabolism', 'kcal')}
          {numField('Visceral Fat', 'visceral_fat')}
          {numField('Impedance', 'impedance', 'Ω')}
          {numField('Waist Circumference', 'waist_circumference', 'in')}
          {numField('Peak Flow', 'peak_flow_measurement', 'L/min')}
        </div>
      </div>
      {/* Additional */}
      <div>
        <h4 className='text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase'>
          Additional Measurements
        </h4>
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
          {numField('Blood Glucose', 'blood_glucose_levels', 'mg/dL')}
          {textField('Vision Test', 'vision_test_result')}
          {textField('Hearing Test', 'hearing_test_result')}
        </div>
      </div>
      {/* ECG & Notes */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <div className='space-y-1'>
          <Label className='text-muted-foreground text-[11px]'>
            ECG Result
          </Label>
          <Textarea
            className='min-h-15 text-xs'
            value={(draft.ecg_result as string) || ''}
            onChange={(e) => onUpdate('ecg_result', e.target.value)}
            placeholder='ECG result...'
          />
        </div>
        <div className='space-y-1'>
          <Label className='text-muted-foreground text-[11px]'>Notes</Label>
          <Textarea
            className='min-h-15 text-xs'
            value={(draft.note as string) || ''}
            onChange={(e) => onUpdate('note', e.target.value)}
            placeholder='Notes...'
          />
        </div>
      </div>
    </div>
  );
}
