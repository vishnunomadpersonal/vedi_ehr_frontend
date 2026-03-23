'use client';

import { useEhrList, useEhrUpdate, useEhrDelete } from '@/hooks/use-ehr-data';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Zap,
  MoreHorizontal,
  Search,
  ListTodo,
  ArrowUpRight,
  X,
  Play
} from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from '@/types';
import { toast } from 'sonner';

const statusConfig: Record<
  TaskStatus,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  draft: { label: 'Draft', icon: Circle, color: 'text-muted-foreground' },
  requested: { label: 'Requested', icon: Clock, color: 'text-blue-500' },
  accepted: { label: 'Accepted', icon: CheckCircle2, color: 'text-blue-600' },
  in_progress: { label: 'In Progress', icon: Play, color: 'text-amber-500' },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600'
  },
  cancelled: { label: 'Cancelled', icon: X, color: 'text-muted-foreground' },
  rejected: { label: 'Rejected', icon: X, color: 'text-red-500' }
};

const priorityConfig: Record<
  TaskPriority,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  routine: { label: 'Routine', icon: Circle, variant: 'outline' },
  urgent: { label: 'Urgent', icon: AlertTriangle, variant: 'secondary' },
  asap: { label: 'ASAP', icon: Zap, variant: 'default' },
  stat: { label: 'STAT', icon: Zap, variant: 'destructive' }
};

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { result, query } = useEhrList<Task>({
    resource: 'tasks',
    pagination: { currentPage: 1, pageSize: 50 },
    sorters: [
      { field: 'priority', order: 'desc' },
      { field: 'due_date', order: 'asc' }
    ]
  });

  const { mutate: updateTask } = useEhrUpdate();
  const { mutate: deleteTask } = useEhrDelete();

  const tasks = result?.data ?? [];
  const isLoading = query?.isLoading;

  // Client-side filtering
  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.patient_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = (task: Task, newStatus: TaskStatus) => {
    updateTask(
      { resource: 'tasks', id: task.id, values: { status: newStatus } },
      {
        onSuccess: () =>
          toast.success(`Task marked as ${newStatus.replace('_', ' ')}`)
      }
    );
  };

  // Stats
  const openCount = tasks.filter(
    (t) => !['completed', 'cancelled', 'rejected'].includes(t.status)
  ).length;
  const urgentCount = tasks.filter(
    (t) =>
      (t.priority === 'stat' || t.priority === 'asap') &&
      !['completed', 'cancelled', 'rejected'].includes(t.status)
  ).length;
  const overdueCount = tasks.filter((t) => {
    if (
      !t.due_date ||
      ['completed', 'cancelled', 'rejected'].includes(t.status)
    )
      return false;
    return new Date(t.due_date) < new Date();
  }).length;

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Tasks</h1>
          <p className='text-muted-foreground text-sm'>
            Manage clinical and administrative tasks
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-3'>
        <Card>
          <CardContent className='px-4 pt-4 pb-3'>
            <div className='flex items-center gap-2'>
              <ListTodo className='text-primary h-4 w-4' />
              <span className='text-2xl font-bold'>{openCount}</span>
              <span className='text-muted-foreground text-sm'>Open</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='px-4 pt-4 pb-3'>
            <div className='flex items-center gap-2'>
              <Zap className='h-4 w-4 text-amber-500' />
              <span className='text-2xl font-bold'>{urgentCount}</span>
              <span className='text-muted-foreground text-sm'>Urgent</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='px-4 pt-4 pb-3'>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='h-4 w-4 text-red-500' />
              <span className='text-2xl font-bold'>{overdueCount}</span>
              <span className='text-muted-foreground text-sm'>Overdue</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-3'>
        <div className='relative max-w-xs flex-1'>
          <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
          <Input
            placeholder='Search tasks...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[140px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            <SelectItem value='requested'>Requested</SelectItem>
            <SelectItem value='accepted'>Accepted</SelectItem>
            <SelectItem value='in_progress'>In Progress</SelectItem>
            <SelectItem value='completed'>Completed</SelectItem>
            <SelectItem value='cancelled'>Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className='w-[130px]'>
            <SelectValue placeholder='Priority' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Priorities</SelectItem>
            <SelectItem value='stat'>STAT</SelectItem>
            <SelectItem value='asap'>ASAP</SelectItem>
            <SelectItem value='urgent'>Urgent</SelectItem>
            <SelectItem value='routine'>Routine</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className='space-y-2'>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className='h-16 w-full' />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className='text-muted-foreground py-12 text-center'>
            <ListTodo className='mx-auto mb-2 h-8 w-8 opacity-50' />
            <p>No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-1'>
          {filtered.map((task) => {
            const sc = statusConfig[task.status];
            const pc = priorityConfig[task.priority];
            const StatusIcon = sc.icon;
            const PriorityIcon = pc.icon;
            const isOverdue =
              task.due_date &&
              new Date(task.due_date) < new Date() &&
              !['completed', 'cancelled', 'rejected'].includes(task.status);

            return (
              <Card
                key={task.id}
                className='group hover:bg-accent/50 cursor-pointer transition-colors'
                onClick={() => setSelectedTask(task)}
              >
                <CardContent className='flex items-center gap-3 px-4 py-3'>
                  {/* Status icon button */}
                  <button
                    className={`shrink-0 ${sc.color} hover:opacity-80`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (task.status !== 'completed') {
                        handleStatusChange(task, 'completed');
                      }
                    }}
                    title={
                      task.status === 'completed'
                        ? 'Completed'
                        : 'Mark complete'
                    }
                  >
                    <StatusIcon className='h-5 w-5' />
                  </button>

                  {/* Content */}
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`truncate text-sm font-medium ${
                          task.status === 'completed'
                            ? 'text-muted-foreground line-through'
                            : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      <Badge
                        variant={pc.variant}
                        className='shrink-0 text-[10px]'
                      >
                        <PriorityIcon className='mr-0.5 h-2.5 w-2.5' />
                        {pc.label}
                      </Badge>
                    </div>
                    <div className='text-muted-foreground mt-0.5 flex items-center gap-2 text-xs'>
                      {task.patient_name && <span>{task.patient_name}</span>}
                      {task.due_date && (
                        <span
                          className={
                            isOverdue ? 'font-medium text-red-500' : ''
                          }
                        >
                          {isOverdue ? 'Overdue: ' : 'Due: '}
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='shrink-0 opacity-0 group-hover:opacity-100'
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      {task.status !== 'in_progress' &&
                        task.status !== 'completed' && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(task, 'in_progress')
                            }
                          >
                            <Play className='mr-2 h-3 w-3' />
                            Start
                          </DropdownMenuItem>
                        )}
                      {task.status !== 'completed' && (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(task, 'completed')}
                        >
                          <CheckCircle2 className='mr-2 h-3 w-3' />
                          Complete
                        </DropdownMenuItem>
                      )}
                      {task.patient_id && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/patients/${task.patient_id}`}
                            >
                              <ArrowUpRight className='mr-2 h-3 w-3' />
                              View Patient
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      {task.encounter_id && (
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/encounters/${task.encounter_id}`}
                          >
                            <ArrowUpRight className='mr-2 h-3 w-3' />
                            View Encounter
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className='text-destructive'
                        onClick={() => handleStatusChange(task, 'cancelled')}
                      >
                        <X className='mr-2 h-3 w-3' />
                        Cancel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Detail Dialog */}
      <Dialog
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      >
        {selectedTask && (
          <DialogContent className='max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {(() => {
                  const Icon = statusConfig[selectedTask.status].icon;
                  return (
                    <Icon
                      className={`h-5 w-5 ${statusConfig[selectedTask.status].color}`}
                    />
                  );
                })()}
                {selectedTask.title}
              </DialogTitle>
              <DialogDescription>
                {selectedTask.description || 'No description'}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3 text-sm'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <span className='text-muted-foreground block'>Status</span>
                  <Badge variant='outline'>
                    {statusConfig[selectedTask.status].label}
                  </Badge>
                </div>
                <div>
                  <span className='text-muted-foreground block'>Priority</span>
                  <Badge
                    variant={priorityConfig[selectedTask.priority].variant}
                  >
                    {priorityConfig[selectedTask.priority].label}
                  </Badge>
                </div>
              </div>

              {selectedTask.patient_name && (
                <div>
                  <span className='text-muted-foreground block'>Patient</span>
                  <Link
                    href={`/dashboard/patients/${selectedTask.patient_id}`}
                    className='text-primary hover:underline'
                  >
                    {selectedTask.patient_name}
                  </Link>
                </div>
              )}

              {selectedTask.due_date && (
                <div>
                  <span className='text-muted-foreground block'>Due Date</span>
                  <span>
                    {new Date(selectedTask.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              {selectedTask.assigned_to_name && (
                <div>
                  <span className='text-muted-foreground block'>
                    Assigned To
                  </span>
                  <span>{selectedTask.assigned_to_name}</span>
                </div>
              )}
            </div>

            <DialogFooter className='gap-2'>
              {selectedTask.status !== 'completed' && (
                <>
                  {selectedTask.status !== 'in_progress' && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        handleStatusChange(selectedTask, 'in_progress');
                        setSelectedTask({
                          ...selectedTask,
                          status: 'in_progress'
                        });
                      }}
                    >
                      <Play className='mr-1 h-3 w-3' />
                      Start
                    </Button>
                  )}
                  <Button
                    size='sm'
                    onClick={() => {
                      handleStatusChange(selectedTask, 'completed');
                      setSelectedTask(null);
                    }}
                    className='bg-green-600 text-white hover:bg-green-700'
                  >
                    <CheckCircle2 className='mr-1 h-3 w-3' />
                    Complete
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
