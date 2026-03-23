'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Patient } from '@/types';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useEhrDelete } from '@/hooks/use-ehr-data';
import { toast } from 'sonner';

interface CellActionProps {
  data: Patient;
}

export function CellAction({ data }: CellActionProps) {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const { mutate: deletePatient, mutation: deleteMutation } = useEhrDelete();
  const isDeleting = deleteMutation.isPending;

  const handleDelete = () => {
    deletePatient(
      { resource: 'patients', id: data.id },
      {
        onSuccess: () => {
          setShowDelete(false);
          toast.success('Patient deleted');
        }
      }
    );
  };

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push(`/patients/${data.id}`)}>
            <Eye className='mr-2 h-4 w-4' /> View
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push(`/patients/${data.id}/edit`)}
          >
            <Pencil className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDelete(true)}
            className='text-destructive'
          >
            <Trash2 className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {data.first_name} {data.last_name}
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
