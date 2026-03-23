import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconWand } from '@tabler/icons-react';

export const metadata = { title: 'Report Builder — Vedi EHR' };

export default function ReportBuilderPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Custom Report Builder'
      pageDescription='Create tailored reports with custom field selection'
    >
      <Card className='mx-auto max-w-2xl'>
        <CardHeader className='text-center'>
          <div className='bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
            <IconWand className='text-muted-foreground h-6 w-6' />
          </div>
          <CardTitle>Custom Report Builder</CardTitle>
          <CardDescription>
            Build custom reports with drag-and-drop field selection.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground text-center text-sm'>
          <p>
            Select data sources, choose fields, apply filters, and generate
            custom reports tailored to your organization&apos;s needs. Export in
            PDF, CSV, or Excel formats.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
