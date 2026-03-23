'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface CalendarDeleteDialogProps {
  showDeleteModal: boolean;
  handleCloseDeleteModal: () => void;
  handleDelete: () => void;
}

const CalendarDeleteDialog: React.FC<CalendarDeleteDialogProps> = ({
  showDeleteModal,
  handleCloseDeleteModal,
  handleDelete
}) => {
  return (
    <Dialog open={showDeleteModal} onOpenChange={handleCloseDeleteModal}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-4'>
            <div className='flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
              <AlertTriangle
                className='h-6 w-6 text-red-600 dark:text-red-400'
                aria-hidden='true'
              />
            </div>
            <div>
              <DialogTitle>Delete Appointment</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this appointment? This action
                cannot be undone.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button variant='destructive' onClick={handleDelete}>
            Delete
          </Button>
          <Button variant='secondary' onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarDeleteDialog;
