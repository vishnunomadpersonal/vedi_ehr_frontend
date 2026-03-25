'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function TeamPage() {
  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription='Manage your workspace team, members, roles, security and more.'
    >
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            Team Members
          </CardTitle>
          <CardDescription>Manage team roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Team management is handled by your system administrator.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
