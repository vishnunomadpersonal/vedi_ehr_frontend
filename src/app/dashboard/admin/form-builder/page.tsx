import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { IconForms } from '@tabler/icons-react';

export const metadata = { title: 'Form Builder — Vedi EHR' };

export default function FormBuilderPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Form Builder'
      pageDescription='Create and manage custom forms and templates'
    >
      <Card className='mx-auto max-w-2xl'>
        <CardHeader className='text-center'>
          <div className='bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
            <IconForms className='text-muted-foreground h-6 w-6' />
          </div>
          <CardTitle>Form Builder</CardTitle>
          <CardDescription>
            Design custom intake forms, consent documents, and assessments with
            a visual drag-and-drop builder.
          </CardDescription>
        </CardHeader>
        <CardContent className='text-muted-foreground text-center text-sm'>
          <p>
            Create form templates with text fields, dropdowns, checkboxes,
            signatures, and conditional logic. Published forms can be assigned
            to patient workflows.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
