import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = { title: 'Encounter Templates — Vedi EHR' };

export default function EncounterTemplatesPage() {
  return (
    <PageContainer
      pageTitle='Encounter Templates'
      pageDescription='Manage reusable encounter templates'
    >
      <Card>
        <CardHeader>
          <CardTitle>Encounter Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Template management coming soon.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
