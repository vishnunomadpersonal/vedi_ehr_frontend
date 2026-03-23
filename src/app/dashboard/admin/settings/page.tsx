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
import type { SystemSetting } from '@/types/ehr';

export const metadata = { title: 'System Settings — Vedi EHR' };

const categoryLabels: Record<string, string> = {
  general: 'General',
  clinical: 'Clinical',
  billing: 'Billing',
  scheduling: 'Scheduling',
  security: 'Security',
  integration: 'Integration'
};

export default async function SettingsPage() {
  const { data: settings } = getList('system_settings');

  // Group settings by category
  const grouped = (settings as SystemSetting[]).reduce(
    (acc, setting) => {
      const cat = setting.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(setting);
      return acc;
    },
    {} as Record<string, SystemSetting[]>
  );

  return (
    <PageContainer
      scrollable
      pageTitle='System Settings'
      pageDescription='Configure system-wide settings and preferences'
    >
      <div className='space-y-6'>
        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className='text-base'>
                {categoryLabels[category] ?? category}
              </CardTitle>
              <CardDescription>
                {items.length} setting{items.length !== 1 ? 's' : ''} in this
                category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='divide-y'>
                {items.map((setting) => (
                  <div
                    key={setting.id}
                    className='flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0'
                  >
                    <div className='space-y-1'>
                      <p className='text-sm font-medium'>{setting.label}</p>
                      <p className='text-muted-foreground text-xs'>
                        {setting.description}
                      </p>
                      <p className='text-muted-foreground font-mono text-xs'>
                        {setting.key}
                      </p>
                    </div>
                    <Badge variant='outline' className='shrink-0 font-mono'>
                      {setting.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
