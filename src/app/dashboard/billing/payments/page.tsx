import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export const metadata = { title: 'Payments — Vedi EHR' };

export default function PaymentsPage() {
  return (
    <PageContainer
      pageTitle='Payments'
      pageDescription='Track and manage payments'
    >
      <Card>
        <CardHeader>
          <CardTitle>Payment Management</CardTitle>
          <CardDescription>
            View and manage incoming payments from insurance providers and
            patients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Payment tracking and management coming soon.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
