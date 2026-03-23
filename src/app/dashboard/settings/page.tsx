'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import PageContainer from '@/components/layout/page-container';

export default function SettingsPage() {
  return (
    <PageContainer scrollable>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground'>
            Manage your portal preferences and account.
          </p>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information.</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-1'>
                <Label className='text-muted-foreground text-xs'>Name</Label>
                <p className='text-sm font-medium'>Dr. Sarah Chen</p>
              </div>
              <div className='grid gap-1'>
                <Label className='text-muted-foreground text-xs'>Email</Label>
                <p className='text-sm font-medium'>doctor@vedi.health</p>
              </div>
              <div className='grid gap-1'>
                <Label className='text-muted-foreground text-xs'>Role</Label>
                <Badge variant='secondary'>Doctor</Badge>
              </div>
              <div className='grid gap-1'>
                <Label className='text-muted-foreground text-xs'>
                  Specialty
                </Label>
                <p className='text-sm font-medium'>Internal Medicine</p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive alerts.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='notify-encounter' className='text-sm'>
                  New encounter alerts
                </Label>
                <Switch id='notify-encounter' defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <Label htmlFor='notify-transcript' className='text-sm'>
                  Transcript ready
                </Label>
                <Switch id='notify-transcript' defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <Label htmlFor='notify-summary' className='text-sm'>
                  AI summary generated
                </Label>
                <Switch id='notify-summary' defaultChecked />
              </div>
              <Separator />
              <div className='flex items-center justify-between'>
                <Label htmlFor='notify-email' className='text-sm'>
                  Email notifications
                </Label>
                <Switch id='notify-email' />
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card className='md:col-span-2'>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Portal version and environment details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-4'>
                <div className='grid gap-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Version
                  </Label>
                  <p className='text-sm font-medium'>0.1.0-alpha</p>
                </div>
                <div className='grid gap-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Environment
                  </Label>
                  <Badge variant='outline'>Development</Badge>
                </div>
                <div className='grid gap-1'>
                  <Label className='text-muted-foreground text-xs'>
                    API Status
                  </Label>
                  <Badge className='w-fit border-yellow-500/20 bg-yellow-500/10 text-yellow-600'>
                    Mock Data
                  </Badge>
                </div>
                <div className='grid gap-1'>
                  <Label className='text-muted-foreground text-xs'>
                    Framework
                  </Label>
                  <p className='text-sm font-medium'>Refine v5 + Next.js 16</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
