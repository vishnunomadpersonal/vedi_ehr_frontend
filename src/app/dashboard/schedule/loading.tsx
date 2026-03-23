import { Skeleton } from '@/components/ui/skeleton';

export default function ScheduleLoading() {
  return (
    <div className='space-y-4'>
      <div>
        <Skeleton className='h-8 w-36' />
        <Skeleton className='mt-1 h-4 w-48' />
      </div>
      <div className='flex gap-4'>
        <Skeleton className='h-96 flex-1' />
        <Skeleton className='h-96 w-80' />
      </div>
    </div>
  );
}
