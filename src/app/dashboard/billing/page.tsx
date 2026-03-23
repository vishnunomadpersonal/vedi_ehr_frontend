import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import ClaimListingPage from '@/features/billing/components/claim-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import type { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = { title: 'Billing & Claims — Vedi EHR' };

type PageProps = { searchParams: Promise<SearchParams> };

export default async function BillingPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Billing & Claims'
      pageDescription='Manage insurance claims, payments, and billing'
      pageHeaderAction={
        <Link
          href='/dashboard/billing/create'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className='mr-2 h-4 w-4' /> New Claim
        </Link>
      }
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={7} rowCount={10} filterCount={2} />
        }
      >
        <ClaimListingPage />
      </Suspense>
    </PageContainer>
  );
}
