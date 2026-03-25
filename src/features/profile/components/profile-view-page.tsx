'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getIdentity } from '@/lib/auth';
import { useEffect, useState } from 'react';

export default function ProfileViewPage() {
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    getIdentity()
      .then(setUser)
      .catch(() => {});
  }, []);

  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ?? 'U';

  return (
    <div className='flex w-full flex-col p-4'>
      <Card className='max-w-lg'>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account details</CardDescription>
        </CardHeader>
        <CardContent className='flex items-center gap-4'>
          <Avatar className='h-16 w-16'>
            <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className='text-lg font-semibold'>
              {user?.name ?? 'Loading...'}
            </p>
            <p className='text-muted-foreground text-sm'>{user?.email}</p>
            <p className='text-muted-foreground text-xs capitalize'>
              {user?.role}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
