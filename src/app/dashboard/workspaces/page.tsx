'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function WorkspacesPage() {
  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your workspaces and switch between them'
    >
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Building2 className='h-5 w-5' />
            Vedi EHR Workspace
          </CardTitle>
          <CardDescription>Clinical Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Your active workspace for managing clinical operations.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
