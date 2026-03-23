'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { CalEvent } from '@/types/calendar-types';
import { getRandomColor } from '@/types/calendar-types';

interface CalendarEventProps {
  event: CalEvent;
  viewType: string;
  onEdit: (event: CalEvent) => void;
  onDelete: (event: CalEvent) => void;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  viewType,
  onEdit,
  onDelete
}) => {
  const isMonthView = viewType === 'dayGridMonth';
  const isTimeGridView =
    viewType === 'timeGridWeek' || viewType === 'timeGridDay';
  const isListView = viewType === 'listWeek' || viewType === 'listDay';

  const handleIconClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    e.stopPropagation();
    action();
  };

  const verticalStrapColor = event.color || getRandomColor();

  const patientName = event.extendedProps?.patient_name || '';
  const displayName = patientName
    ? patientName.charAt(0).toUpperCase() + patientName.slice(1).toLowerCase()
    : 'Unknown Patient';
  const encounterType = event.extendedProps?.encounter_type || '';

  return (
    <div className='relative flex h-full w-full cursor-pointer flex-row items-center justify-between overflow-hidden rounded-sm bg-zinc-200 p-2 text-ellipsis whitespace-nowrap transition-all duration-200 dark:bg-zinc-800'>
      {/* Left color strap */}
      <div
        className='absolute top-0 left-0 h-full w-1 rounded-l-sm'
        style={{ backgroundColor: verticalStrapColor }}
      />

      {/* Event Details */}
      <div className='mb-0 ml-1.5 flex flex-grow flex-col justify-center overflow-hidden'>
        <span className='text-foreground text-sm font-bold'>
          {event.title || displayName}
        </span>
        {encounterType && (
          <span className='text-muted-foreground mb-0 translate-y-[2px] text-xs leading-[1.2rem] font-medium'>
            {encounterType}
          </span>
        )}
        {(isMonthView || isTimeGridView || isListView) && event.start && (
          <span className='text-muted-foreground mt-0 translate-y-[-2px] text-xs'>
            {new Date(event.start).toLocaleDateString([], {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}{' '}
            {new Date(event.start).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
            {isTimeGridView &&
              event.end &&
              ` - ${new Date(event.end).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}`}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className='flex flex-row items-center gap-1'>
        <button
          onClick={(e) => handleIconClick(e, () => onEdit(event))}
          className='cursor-pointer border-none bg-transparent transition-transform hover:scale-125'
        >
          <Pencil size={14} className='text-blue-500' />
        </button>
        <button
          onClick={(e) => handleIconClick(e, () => onDelete(event))}
          className='cursor-pointer border-none bg-transparent transition-transform hover:scale-125'
        >
          <Trash2 size={14} className='text-red-500' />
        </button>
      </div>
    </div>
  );
};

export default CalendarEvent;
