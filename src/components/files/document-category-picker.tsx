'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  FlaskConical,
  Image,
  FileSignature,
  CreditCard,
  Share2,
  Pill,
  Upload,
  Building2,
  Scale,
  FolderOpen
} from 'lucide-react';

export interface DocumentCategory {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  icon_class?: string | null;
  color_code?: string | null;
  display_order?: number | null;
  is_active?: boolean;
}

// Map category codes to lucide icons
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  clinical_notes: <FileText className='h-3.5 w-3.5 text-blue-500' />,
  lab_results: <FlaskConical className='h-3.5 w-3.5 text-purple-500' />,
  imaging: <Image className='h-3.5 w-3.5 text-cyan-500' />,
  consent: <FileSignature className='h-3.5 w-3.5 text-amber-500' />,
  insurance: <CreditCard className='h-3.5 w-3.5 text-emerald-500' />,
  referrals: <Share2 className='h-3.5 w-3.5 text-indigo-500' />,
  prescriptions: <Pill className='h-3.5 w-3.5 text-rose-500' />,
  patient_uploads: <Upload className='h-3.5 w-3.5 text-gray-500' />,
  external: <Building2 className='h-3.5 w-3.5 text-orange-500' />,
  legal: <Scale className='h-3.5 w-3.5 text-red-500' />
};

// Fallback categories in case API is unavailable
const FALLBACK_CATEGORIES: DocumentCategory[] = [
  { id: 1, code: 'clinical_notes', name: 'Clinical Notes' },
  { id: 2, code: 'lab_results', name: 'Lab Results' },
  { id: 3, code: 'imaging', name: 'Imaging' },
  { id: 4, code: 'consent', name: 'Consent Forms' },
  { id: 5, code: 'insurance', name: 'Insurance' },
  { id: 6, code: 'referrals', name: 'Referrals' },
  { id: 7, code: 'prescriptions', name: 'Prescriptions' },
  { id: 8, code: 'patient_uploads', name: 'Patient Uploads' },
  { id: 9, code: 'external', name: 'External Records' },
  { id: 10, code: 'legal', name: 'Legal' }
];

interface DocumentCategoryPickerProps {
  value?: string;
  onValueChange: (code: string, category: DocumentCategory | null) => void;
  placeholder?: string;
  className?: string;
}

export function DocumentCategoryPicker({
  value,
  onValueChange,
  placeholder = 'Select document category',
  className
}: DocumentCategoryPickerProps) {
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || '/api';
    fetch(`${API}/v1/documents/categories`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        const data = json?.data || json;
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES))
      .finally(() => setLoading(false));
  }, []);

  const selectedCat = categories.find((c) => c.code === value);

  return (
    <Select
      value={value || ''}
      onValueChange={(v) => {
        const cat = categories.find((c) => c.code === v) || null;
        onValueChange(v, cat);
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue
          placeholder={loading ? 'Loading categories...' : placeholder}
        >
          {selectedCat && (
            <span className='flex items-center gap-2'>
              {CATEGORY_ICONS[selectedCat.code] || (
                <FolderOpen className='h-3.5 w-3.5' />
              )}
              {selectedCat.name}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.code} value={cat.code}>
            <span className='flex items-center gap-2'>
              {CATEGORY_ICONS[cat.code] || (
                <FolderOpen className='h-3.5 w-3.5' />
              )}
              {cat.name}
              {cat.description && (
                <span className='text-muted-foreground text-[10px]'>
                  {cat.description}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Compact badge-style display for a selected category */
export function DocumentCategoryBadge({
  code,
  name
}: {
  code: string;
  name: string;
}) {
  return (
    <Badge variant='outline' className='gap-1.5 text-xs font-normal'>
      {CATEGORY_ICONS[code] || <FolderOpen className='h-3 w-3' />}
      {name}
    </Badge>
  );
}
