import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'SOAP Notes — Vedi EHR' };

export default function EncounterSOAPPage() {
  return (
    <PageContainer
      pageTitle='SOAP Notes'
      pageDescription='Document subjective, objective, assessment, and plan'
    >
      <Card>
        <CardHeader>
          <CardTitle>SOAP Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>SOAP note editor coming soon.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
