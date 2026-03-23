import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconPlayerPlay } from '@tabler/icons-react';

export const metadata = { title: 'Audio Playback — Vedi EHR' };

type PageProps = { params: Promise<{ id: string }> };

export default async function PlaybackPage(props: PageProps) {
  const { id } = await props.params;

  return (
    <PageContainer scrollable pageTitle='Audio Playback'>
      <Card className='mx-auto max-w-2xl'>
        <CardHeader className='text-center'>
          <CardTitle className='flex items-center justify-center gap-2'>
            <IconPlayerPlay className='h-5 w-5' /> Audio Playback
          </CardTitle>
          <CardDescription>
            Recording {id} — audio playback coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm'>
            Audio player placeholder
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
