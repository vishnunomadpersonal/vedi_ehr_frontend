import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconNotes } from '@tabler/icons-react';

export const metadata = { title: 'AI-Generated Notes — Vedi EHR' };

type PageProps = { params: Promise<{ id: string }> };

export default async function AiNotesPage(props: PageProps) {
  const { id } = await props.params;

  return (
    <PageContainer scrollable pageTitle='AI-Generated Notes'>
      <Card className='mx-auto max-w-3xl'>
        <CardHeader className='text-center'>
          <CardTitle className='flex items-center justify-center gap-2'>
            <IconNotes className='h-5 w-5' /> AI-Generated Notes
          </CardTitle>
          <CardDescription>
            Recording {id} — AI clinical notes coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm'>
            AI notes viewer placeholder
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
