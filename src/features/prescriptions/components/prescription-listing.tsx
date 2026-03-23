import type { Prescription } from '@/types/ehr';
import { getList } from '@/constants/mock-data';
import { searchParamsCache } from '@/lib/searchparams';
import { PrescriptionTable } from './prescription-tables';
import { columns } from './prescription-tables/columns';

export default async function PrescriptionListingPage() {
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

  const result = getList('prescriptions', {
    pagination: { current: page, pageSize: pageLimit },
    filters
  });

  return (
    <PrescriptionTable
      data={result.data}
      totalItems={result.total}
      columns={columns}
    />
  );
}
