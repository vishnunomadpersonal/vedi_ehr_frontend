import { Skeleton } from '@/components/ui/skeleton';

export default function TasksLoading() {
  return (
    <div className='space-y-4'>
      <div>
        <Skeleton className='h-8 w-32' />
        <Skeleton className='mt-1 h-4 w-48' />
      </div>
      <div className='grid grid-cols-3 gap-3'>
        <Skeleton className='h-16' />
        <Skeleton className='h-16' />
        <Skeleton className='h-16' />
      </div>
      <div className='flex gap-3'>
        <Skeleton className='h-9 w-48' />
        <Skeleton className='h-9 w-36' />
        <Skeleton className='h-9 w-32' />
      </div>
      <div className='space-y-2'>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className='h-16 w-full' />
        ))}
      </div>
    </div>
  );
}
