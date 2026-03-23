import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconCode } from '@tabler/icons-react';

export const metadata = { title: 'Code Sets — Vedi EHR' };

const codeSets = [
  {
    title: 'ICD-10',
    description:
      'International Classification of Diseases, 10th Revision — diagnosis and procedure codes.',
    count: '72,000+',
    version: '2026 FY'
  },
  {
    title: 'CPT',
    description:
      'Current Procedural Terminology — medical procedure and service codes.',
    count: '10,000+',
    version: '2026'
  },
  {
    title: 'LOINC',
    description:
      'Logical Observation Identifiers Names and Codes — laboratory and clinical observations.',
    count: '98,000+',
    version: '2.77'
  },
  {
    title: 'SNOMED CT',
    description:
      'Systematized Nomenclature of Medicine — clinical terminology for EHR systems.',
    count: '360,000+',
    version: '2025-09'
  },
  {
    title: 'RxNorm',
    description:
      'Normalized names for clinical drugs — enables interoperability of pharmacy data.',
    count: '115,000+',
    version: '2026-02'
  },
  {
    title: 'HCPCS',
    description:
      'Healthcare Common Procedure Coding System — codes for services, procedures, and supplies.',
    count: '7,000+',
    version: '2026'
  }
];

export default function CodeSetsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Code Sets'
      pageDescription='Manage medical coding reference data (ICD-10, CPT, LOINC, etc.)'
    >
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {codeSets.map((codeSet) => (
          <Card
            key={codeSet.title}
            className='cursor-pointer transition-shadow hover:shadow-md'
          >
            <CardHeader className='pb-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='bg-muted flex h-9 w-9 items-center justify-center rounded-lg'>
                    <IconCode className='text-muted-foreground h-5 w-5' />
                  </div>
                  <CardTitle className='text-base'>{codeSet.title}</CardTitle>
                </div>
                <Badge variant='secondary'>{codeSet.count}</Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-2'>
              <CardDescription>{codeSet.description}</CardDescription>
              <p className='text-muted-foreground text-xs'>
                Version: {codeSet.version}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
