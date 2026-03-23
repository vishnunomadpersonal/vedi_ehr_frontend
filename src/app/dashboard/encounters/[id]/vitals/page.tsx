import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Vitals — Vedi EHR' };

export default function EncounterVitalsPage() {
  return (
    <PageContainer
      pageTitle='Vitals'
      pageDescription='Record and review patient vitals'
    >
      <Card>
        <CardHeader>
          <CardTitle>Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>Vitals recording coming soon.</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
