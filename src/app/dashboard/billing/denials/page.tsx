import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export const metadata = { title: 'Denials Management — Vedi EHR' };

export default function DenialsPage() {
  return (
    <PageContainer
      pageTitle='Denials Management'
      pageDescription='Track and appeal denied claims'
    >
      <Card>
        <CardHeader>
          <CardTitle>Denials Management</CardTitle>
          <CardDescription>
            Review denied claims and manage the appeals process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Denials management and appeals workflow coming soon.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
