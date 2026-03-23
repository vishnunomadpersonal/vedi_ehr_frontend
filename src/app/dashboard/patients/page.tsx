'use client';

import { useEhrList } from '@/hooks/use-ehr-data';
import { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import type { Patient } from '@/types';
import { PatientTable } from '@/features/patients/components/patient-tables';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import PageContainer from '@/components/layout/page-container';

export default function PatientListPage() {
  const { result, query: listQuery } = useEhrList<Patient>({
    resource: 'patients',
    pagination: { currentPage: 1, pageSize: 200 }
  });
  const isLoading = listQuery.isLoading;

  const patients = useMemo(() => result?.data ?? [], [result?.data]);

  return (
    <PageContainer scrollable>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Patients</h1>
            <p className='text-muted-foreground text-sm'>
              Manage patient records and demographics.
            </p>
          </div>
          <Button asChild>
            <Link href='/dashboard/patients/create'>
              <UserPlus className='mr-2 h-4 w-4' />
              New Patient
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <DataTableSkeleton columnCount={7} filterCount={2} />
        ) : (
          <PatientTable data={patients} />
        )}
      </div>
    </PageContainer>
  );
}
