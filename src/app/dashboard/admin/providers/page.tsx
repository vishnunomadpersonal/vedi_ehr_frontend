import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getList } from '@/constants/mock-data';
import type { Provider } from '@/types/ehr';
import { IconStethoscope, IconId, IconBuilding } from '@tabler/icons-react';

export const metadata = { title: 'Provider Directory — Vedi EHR' };

export default async function ProvidersPage() {
  const { data: providers } = getList('providers');

  return (
    <PageContainer
      scrollable
      pageTitle='Provider Directory'
      pageDescription='Manage provider profiles, credentials, and scheduling'
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {providers.map((provider: Provider) => (
          <Card key={provider.id}>
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <CardTitle className='text-base'>
                  {provider.first_name} {provider.last_name},{' '}
                  {provider.credentials}
                </CardTitle>
                <Badge
                  variant={provider.is_active ? 'default' : 'secondary'}
                  className={
                    provider.is_active
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
                      : ''
                  }
                >
                  {provider.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>{provider.specialty}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex items-center gap-2 text-sm'>
                <IconId className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground'>
                  NPI: {provider.npi}
                </span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <IconBuilding className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground'>
                  {provider.department}
                </span>
              </div>
              <div className='flex items-center gap-2 text-sm'>
                <IconStethoscope className='text-muted-foreground h-4 w-4' />
                <span className='text-muted-foreground'>
                  {provider.accepting_new_patients
                    ? 'Accepting new patients'
                    : 'Not accepting new patients'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
