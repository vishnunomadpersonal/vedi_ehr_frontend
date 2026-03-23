'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Plus, Trash2, Save, Loader2 } from 'lucide-react';

/** Pencil icon — edit an existing record */
export function SectionEditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant='ghost'
      size='icon'
      className='text-muted-foreground hover:text-primary h-7 w-7 transition-transform duration-150 hover:scale-125'
      onClick={onClick}
    >
      <Pencil className='h-3.5 w-3.5' />
    </Button>
  );
}

/** Plus icon — add a new record */
export function SectionAddButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant='ghost'
      size='icon'
      className='text-muted-foreground h-7 w-7 transition-transform duration-150 hover:scale-125 hover:text-green-500'
      onClick={onClick}
    >
      <Plus className='h-4 w-4' />
    </Button>
  );
}

/** Trash icon — delete a record */
export function SectionDeleteButton({
  onClick,
  loading
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <Button
      variant='ghost'
      size='icon'
      className='text-muted-foreground hover:text-destructive h-7 w-7 transition-transform duration-150 hover:scale-125'
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className='h-3.5 w-3.5 animate-spin' />
      ) : (
        <Trash2 className='h-3.5 w-3.5' />
      )}
    </Button>
  );
}

/** Save / Cancel bar shown when editing */
export function EditActions({
  onSave,
  onCancel,
  saving
}: {
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  return (
    <div className='flex items-center justify-end gap-2 pt-2'>
      <Button
        size='sm'
        onClick={() => onSave()}
        disabled={saving}
        className='h-7 px-3 text-xs'
      >
        {saving ? (
          <Loader2 className='mr-1 h-3 w-3 animate-spin' />
        ) : (
          <Save className='mr-1 h-3 w-3' />
        )}
        Save
      </Button>
      <Button
        size='sm'
        variant='ghost'
        onClick={() => onCancel()}
        disabled={saving}
        className='h-7 px-3 text-xs'
      >
        Cancel
      </Button>
    </div>
  );
}
