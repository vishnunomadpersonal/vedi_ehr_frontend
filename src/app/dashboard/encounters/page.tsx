'use client';

import { useEhrList } from '@/hooks/use-ehr-data';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CalendarPlus } from 'lucide-react';
import type { Encounter } from '@/types';
import { EncounterTable } from '@/features/encounters/components/encounter-tables';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PageContainer from '@/components/layout/page-container';

export default function EncounterListPage() {
  const { result, query: listQuery } = useEhrList<Encounter>({
    resource: 'encounters',
    pagination: { currentPage: 1, pageSize: 200 },
    sorters: [{ field: 'scheduled_at', order: 'desc' }]
  });
  const isLoading = listQuery.isLoading;

  // Memoize to prevent TanStack Table state resets on re-render
  const encounters = useMemo(() => result?.data || [], [result?.data]);

  return (
    <PageContainer scrollable>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Encounters</h1>
            <p className='text-muted-foreground text-sm'>
              Clinical visits and sessions.
            </p>
          </div>
          <Button asChild>
            <Link href='/dashboard/encounters/create'>
              <CalendarPlus className='mr-2 h-4 w-4' />
              New Encounter
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <DataTableSkeleton columnCount={6} filterCount={2} />
        ) : (
          <EncounterTable data={encounters} />
        )}
      </div>
    </PageContainer>
  );
}
