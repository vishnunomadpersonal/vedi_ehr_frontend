import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export const metadata = { title: 'Insurance Eligibility — Vedi EHR' };

export default function EligibilityPage() {
  return (
    <PageContainer
      pageTitle='Insurance Eligibility'
      pageDescription='Verify patient insurance eligibility'
    >
      <Card>
        <CardHeader>
          <CardTitle>Eligibility Verification</CardTitle>
          <CardDescription>
            Check patient insurance eligibility and benefits in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground text-sm'>
            Insurance eligibility verification coming soon.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
