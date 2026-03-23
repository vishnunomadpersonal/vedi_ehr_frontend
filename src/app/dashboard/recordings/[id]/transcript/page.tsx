import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconFileText } from '@tabler/icons-react';

export const metadata = { title: 'Full Transcript — Vedi EHR' };

type PageProps = { params: Promise<{ id: string }> };

export default async function TranscriptPage(props: PageProps) {
  const { id } = await props.params;

  return (
    <PageContainer scrollable pageTitle='Full Transcript'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader className='text-center'>
          <CardTitle className='flex items-center justify-center gap-2'>
            <IconFileText className='h-5 w-5' /> Full Transcript
          </CardTitle>
          <CardDescription>
            Recording {id} — full transcript view coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm'>
            Transcript viewer placeholder
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
