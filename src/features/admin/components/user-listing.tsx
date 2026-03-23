import type { User } from '@/types/ehr';
import { getList } from '@/constants/mock-data';
import { searchParamsCache } from '@/lib/searchparams';
import { UserTable } from './user-tables';
import { columns } from './user-tables/columns';

export default async function UserListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');

  const filters: { field: string; operator: string; value: unknown }[] = [];
  if (search) {
    filters.push({ field: 'name', operator: 'contains', value: search });
  }

  const result = getList('users', {
    pagination: { current: page, pageSize: pageLimit },
    filters
  });

  return (
    <UserTable data={result.data} totalItems={result.total} columns={columns} />
  );
}
