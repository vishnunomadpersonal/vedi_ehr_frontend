import type { Claim } from '@/types/ehr';
import { getList } from '@/constants/mock-data';
import { searchParamsCache } from '@/lib/searchparams';
import { ClaimTable } from './claim-tables';
import { columns } from './claim-tables/columns';

export default async function ClaimListingPage() {
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

  const result = getList('claims', {
    pagination: { current: page, pageSize: pageLimit },
    filters
  });

  return (
    <ClaimTable
      data={result.data}
      totalItems={result.total}
      columns={columns}
    />
  );
}
