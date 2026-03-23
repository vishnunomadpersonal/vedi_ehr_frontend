import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export const metadata = { title: 'Patient Communications — Vedi EHR' };

export default function PatientCommunicationsPage() {
  return (
    <PageContainer
      pageTitle='Patient Communications'
      pageDescription='Manage patient messaging and outreach'
    >
      <Card>
        <CardHeader>
          <CardTitle>Patient Communications</CardTitle>
          <CardDescription>
            Send and manage messages to patients including appointment
            reminders, follow-ups, and health communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Patient communication features coming soon.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
