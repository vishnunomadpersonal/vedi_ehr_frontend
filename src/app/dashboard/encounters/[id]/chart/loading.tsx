import { Skeleton } from '@/components/ui/skeleton';

export default function EncounterChartLoading() {
  return (
    <div className='flex gap-6'>
      <Skeleton className='h-96 w-72 shrink-0' />
      <div className='flex-1 space-y-4'>
        <Skeleton className='h-10 w-64' />
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-64 w-full' />
      </div>
    </div>
  );
}
