import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  IconStethoscope,
  IconNurse,
  IconShield,
  IconCash,
  IconDeviceDesktop
} from '@tabler/icons-react';

export const metadata = { title: 'Roles Management — Vedi EHR' };

const roles = [
  {
    title: 'Doctor',
    icon: IconStethoscope,
    permissions: [
      'View & edit patient records',
      'Create & sign encounters',
      'Order labs & prescriptions',
      'View clinical reports'
    ],
    userCount: 4
  },
  {
    title: 'Nurse',
    icon: IconNurse,
    permissions: [
      'View patient records',
      'Record vitals & intake',
      'Assist encounters',
      'Manage tasks'
    ],
    userCount: 3
  },
  {
    title: 'Admin',
    icon: IconShield,
    permissions: [
      'Full system access',
      'Manage users & roles',
      'System configuration',
      'View audit logs'
    ],
    userCount: 2
  },
  {
    title: 'Billing Staff',
    icon: IconCash,
    permissions: [
      'View patient demographics',
      'Manage claims & payments',
      'Access financial reports',
      'Insurance verification'
    ],
    userCount: 2
  },
  {
    title: 'Front Desk',
    icon: IconDeviceDesktop,
    permissions: [
      'Schedule appointments',
      'Patient check-in/check-out',
      'Collect copays',
      'View provider schedules'
    ],
    userCount: 1
  }
];

export default function RolesPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Roles Management'
      pageDescription='Configure role-based access control and permissions'
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {roles.map((role) => (
          <Card key={role.title} className='flex flex-col'>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='bg-muted flex h-9 w-9 items-center justify-center rounded-lg'>
                    <role.icon className='text-muted-foreground h-5 w-5' />
                  </div>
                  <CardTitle className='text-base'>{role.title}</CardTitle>
                </div>
                <Badge variant='secondary'>
                  {role.userCount} user{role.userCount !== 1 ? 's' : ''}
                </Badge>
              </div>
              <CardDescription>
                Permissions for {role.title} role
              </CardDescription>
            </CardHeader>
            <CardContent className='flex-1'>
              <ul className='space-y-1.5'>
                {role.permissions.map((permission) => (
                  <li
                    key={permission}
                    className='text-muted-foreground flex items-center gap-2 text-sm'
                  >
                    <span className='bg-muted-foreground h-1 w-1 rounded-full' />
                    {permission}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
