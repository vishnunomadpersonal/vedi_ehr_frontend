'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export interface EncounterOption {
  id: string | number;
  encounter_type: string;
  scheduled_at?: string;
  status: string;
}

interface EncounterLinkSelectProps {
  encounters: EncounterOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * Reusable "Link to Encounter (optional)" dropdown.
 * Value of "__none__" or "" means no encounter selected.
 */
export function EncounterLinkSelect({
  encounters,
  value,
  onValueChange,
  className
}: EncounterLinkSelectProps) {
  const validEncounters = encounters.filter(
    (e) => e.status !== 'cancelled' && e.status !== 'no_show'
  );

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <Label className='text-muted-foreground text-[11px]'>
        Link to Encounter <span className='font-normal'>(optional)</span>
      </Label>
      {validEncounters.length > 0 ? (
        <Select value={value || '__none__'} onValueChange={onValueChange}>
          <SelectTrigger className='h-8 text-xs'>
            <SelectValue placeholder='No encounter (general)' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__none__'>No encounter (general)</SelectItem>
            {validEncounters.map((enc) => (
              <SelectItem key={enc.id} value={String(enc.id)}>
                #{enc.id} — {enc.encounter_type.replace(/_/g, ' ')}{' '}
                {enc.scheduled_at
                  ? `(${new Date(enc.scheduled_at).toLocaleDateString()})`
                  : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className='text-muted-foreground text-xs italic'>
          No encounters available — record will be saved without encounter link.
        </p>
      )}
    </div>
  );
}

/** Resolve the encounter ID from the select value. Returns the numeric ID or undefined if "__none__"/empty. */
export function resolveEncounterId(value: string): number | undefined {
  if (!value || value === '__none__') return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}
