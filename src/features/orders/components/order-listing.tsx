import type { Order } from '@/types/ehr';
import { getList } from '@/constants/mock-data';
import { searchParamsCache } from '@/lib/searchparams';
import { OrderTable } from './order-tables';
import { columns } from './order-tables/columns';

export default async function OrderListingPage() {
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

  const result = getList('orders', {
    pagination: { current: page, pageSize: pageLimit },
    filters
  });

  return (
    <OrderTable
      data={result.data}
      totalItems={result.total}
      columns={columns}
    />
  );
}
