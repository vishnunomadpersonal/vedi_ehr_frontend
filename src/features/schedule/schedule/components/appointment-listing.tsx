import type { Appointment } from '@/types/ehr';
import { getList } from '@/constants/mock-data';
import { searchParamsCache } from '@/lib/searchparams';
import { AppointmentTable } from './appointment-tables';
import { columns } from './appointment-tables/columns';

export default async function AppointmentListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters: { field: string; operator: string; value: unknown }[] = [];
  if (search) {
    filters.push({
      field: 'patient_name',
      operator: 'contains',
      value: search
    });
  }

  const result = getList('appointments', {
    pagination: { current: page, pageSize: pageLimit },
    filters
  });

  return (
    <AppointmentTable
      data={result.data as Appointment[]}
      totalItems={result.total}
      columns={columns}
    />
  );
}
