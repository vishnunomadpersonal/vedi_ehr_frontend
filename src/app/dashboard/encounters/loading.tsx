import { Skeleton } from '@/components/ui/skeleton';

export default function EncountersLoading() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
        <Skeleton className='h-10 w-36' />
      </div>
      <Skeleton className='h-10 w-72' />
      <div className='rounded-md border'>
        <div className='space-y-2 p-4'>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className='h-12 w-full' />
          ))}
        </div>
      </div>
    </div>
  );
}
