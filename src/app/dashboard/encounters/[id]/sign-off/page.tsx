import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Sign Off — Vedi EHR' };

export default function EncounterSignOffPage() {
  return (
    <PageContainer
      pageTitle='Sign Off'
      pageDescription='Review and sign off the encounter'
    >
      <Card>
        <CardHeader>
          <CardTitle>Sign Off</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Encounter sign-off workflow coming soon.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
