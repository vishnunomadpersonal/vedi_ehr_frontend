'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import type { Patient } from '@/types';

interface PatientComboboxProps {
  patients: Patient[];
  value?: string;
  onSelect: (patientId: string) => void;
  disabled?: boolean;
}

/**
 * Searchable patient picker using cmdk (fuzzy search built-in).
 * Displays patient name + MRN, supports keyboard navigation.
 */
export function PatientCombobox({
  patients,
  value,
  onSelect,
  disabled
}: PatientComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selected = patients.find((p) => p.id === value);
  const displayLabel = selected
    ? `${selected.first_name} ${selected.last_name} (${selected.medical_record_number})`
    : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className='h-9 w-full justify-between text-sm font-normal'
        >
          {displayLabel ? (
            <span className='flex items-center gap-2 truncate'>
              <User className='text-muted-foreground h-3.5 w-3.5 shrink-0' />
              {displayLabel}
            </span>
          ) : (
            <span className='text-muted-foreground flex items-center gap-2'>
              <Search className='h-3.5 w-3.5 shrink-0' />
              Search patient...
            </span>
          )}
          <ChevronsUpDown className='ml-2 h-3.5 w-3.5 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[var(--radix-popover-trigger-width)] p-0'
        align='start'
      >
        <Command>
          <CommandInput placeholder='Type name or MRN...' />
          <CommandList>
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup>
              {patients.map((p) => {
                const label = `${p.first_name} ${p.last_name}`;
                const mrn = p.medical_record_number;
                return (
                  <CommandItem
                    key={p.id}
                    value={`${label} ${mrn}`}
                    onSelect={() => {
                      onSelect(p.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-3.5 w-3.5',
                        value === p.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className='flex flex-col'>
                      <span className='text-sm'>{label}</span>
                      <span className='text-muted-foreground font-mono text-[11px]'>
                        MRN: {mrn}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
