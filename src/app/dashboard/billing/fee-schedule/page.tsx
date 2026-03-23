import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export const metadata = { title: 'Fee Schedule — Vedi EHR' };

export default function FeeSchedulePage() {
  return (
    <PageContainer
      pageTitle='Fee Schedule'
      pageDescription='Manage procedure and service fee schedules'
    >
      <Card>
        <CardHeader>
          <CardTitle>Fee Schedule Management</CardTitle>
          <CardDescription>
            Configure and manage fee schedules for procedures and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Fee schedule management coming soon.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
