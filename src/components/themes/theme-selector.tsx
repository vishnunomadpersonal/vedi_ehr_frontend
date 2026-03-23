'use client';

import { useEffect, useState } from 'react';
import { useThemeConfig } from '@/components/themes/active-theme';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Icons } from '../icons';
import { THEMES } from './theme.config';

export function ThemeSelector() {
  const { activeTheme, setActiveTheme } = useThemeConfig();

  // Prevent hydration mismatch: Radix Select generates different
  // aria-controls IDs on server vs client. Only render after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder with identical dimensions to avoid layout shift
    return (
      <div className='flex items-center gap-2'>
        <div className='border-input pointer-events-none flex h-9 w-fit items-center gap-2 rounded-md border bg-transparent px-3 py-2 text-sm opacity-0'>
          <span className='text-muted-foreground hidden sm:block'>
            <Icons.palette />
          </span>
          <span className='text-muted-foreground block sm:hidden'>Theme</span>
          <span>{activeTheme}</span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='theme-selector' className='sr-only'>
        Theme
      </Label>
      <Select value={activeTheme} onValueChange={setActiveTheme}>
        <SelectTrigger
          id='theme-selector'
          className='justify-start *:data-[slot=select-value]:w-24'
        >
          <span className='text-muted-foreground hidden sm:block'>
            <Icons.palette />
          </span>
          <span className='text-muted-foreground block sm:hidden'>Theme</span>
          <SelectValue placeholder='Select a theme' />
        </SelectTrigger>
        <SelectContent align='end'>
          {THEMES.length > 0 && (
            <>
              <SelectGroup>
                <SelectLabel>themes</SelectLabel>
                {THEMES.map((theme) => (
                  <SelectItem key={theme.name} value={theme.value}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
