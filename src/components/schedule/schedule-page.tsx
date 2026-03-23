'use client';

import React, { useState, useRef, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type {
  EventContentArg,
  DatesSetArg,
  EventDropArg,
  EventClickArg
} from '@fullcalendar/core';
import type {
  DateClickArg,
  EventResizeDoneArg
} from '@fullcalendar/interaction';
import { toast } from 'sonner';
import type { CalEvent } from '@/types/calendar-types';
import {
  getRandomColor,
  convertEventToCalEvent,
  toLocalISOString
} from '@/types/calendar-types';
import {
  getAppointmentsByDateRange,
  updateAppointment,
  deleteAppointment
} from '@/lib/schedule-service';

import CalendarEvent from '@/components/schedule/calendar-event';
import CalendarEventFormDialog from '@/components/schedule/calendar-event-form-dialog';
import CalendarEventViewDialog from '@/components/schedule/calendar-event-view-dialog';
import CalendarDeleteDialog from '@/components/schedule/calendar-delete-dialog';

export default function SchedulePage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<CalEvent | undefined>(
    undefined
  );
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEventViewDialog, setShowEventViewDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch events for visible date range
  const fetchEvents = useCallback(async (startStr: string, endStr: string) => {
    setLoading(true);
    try {
      const data = await getAppointmentsByDateRange(startStr, endStr);
      const coloredEvents = data.map((ev) => ({
        ...ev,
        color: getRandomColor()
      }));
      setEvents(coloredEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle calendar date range change
  const handleDatesSet = (arg: DatesSetArg) => {
    fetchEvents(arg.startStr, arg.endStr);
  };

  // Click on a date -> open create dialog
  const handleDateClick = (arg: DateClickArg) => {
    // arg.dateStr may be date-only ("2026-03-14") in month view.
    // Use arg.date (Date object, local) to ensure time component is preserved.
    // If month view (no time), default to 9:00 AM local.
    let startDate = arg.date;
    if (!arg.dateStr.includes('T')) {
      startDate = new Date(
        arg.date.getFullYear(),
        arg.date.getMonth(),
        arg.date.getDate(),
        9,
        0,
        0
      );
    }
    const startStr = toLocalISOString(startDate).slice(0, 16);
    const endDate = new Date(startDate.getTime() + 30 * 60000);
    const endStr = toLocalISOString(endDate).slice(0, 16);
    const calEvent: CalEvent = {
      id: '',
      title: '',
      start: startStr,
      end: endStr,
      extendedProps: {
        patient_id: '',
        patient_name: '',
        provider_id: '',
        provider_name: '',
        encounter_type: 'office_visit',
        chief_complaint: '',
        notes: '',
        status: 'scheduled'
      }
    };
    setCurrentEvent(calEvent);
    setIsEditing(false);
    setShowModal(true);
  };

  // Click on an event -> open view dialog
  const handleEventClick = (arg: EventClickArg) => {
    const calEvent = convertEventToCalEvent(arg.event);
    setCurrentEvent(calEvent);
    setShowEventViewDialog(true);
  };

  // Drag & drop an event -> update times
  const handleEventDrop = async (arg: EventDropArg) => {
    const calEvent = convertEventToCalEvent(arg.event);
    try {
      await updateAppointment(calEvent);
      toast.success('Event updated');
    } catch (error) {
      console.error('Drop update failed:', error);
      toast.error('Update failed');
      arg.revert();
    }
  };

  // Resize an event -> update end time
  const handleEventResize = async (arg: EventResizeDoneArg) => {
    const calEvent = convertEventToCalEvent(arg.event);
    try {
      await updateAppointment(calEvent);
      toast.success('Event updated');
    } catch (error) {
      console.error('Resize update failed:', error);
      toast.error('Update failed');
      arg.revert();
    }
  };

  // Close modals & refresh
  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentEvent(undefined);
    const api = calendarRef.current?.getApi();
    if (api) {
      fetchEvents(
        api.view.activeStart.toISOString(),
        api.view.activeEnd.toISOString()
      );
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentEvent(undefined);
  };

  // Edit callback from view dialog or event component
  const handleEdit = (event: CalEvent) => {
    setCurrentEvent(event);
    setIsEditing(true);
    setShowEventViewDialog(false);
    setShowModal(true);
  };

  // Delete callback
  const handleDelete = (event: CalEvent) => {
    setCurrentEvent(event);
    setShowEventViewDialog(false);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!currentEvent?.id) return;
    try {
      await deleteAppointment(currentEvent.id);
      toast.success('Appointment deleted successfully');
      handleCloseDeleteModal();
      const api = calendarRef.current?.getApi();
      if (api) {
        fetchEvents(
          api.view.activeStart.toISOString(),
          api.view.activeEnd.toISOString()
        );
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete appointment');
    }
  };

  // Custom event renderer
  const renderEventContent = (eventInfo: EventContentArg) => {
    const calEvent = convertEventToCalEvent(eventInfo.event);
    return (
      <CalendarEvent
        event={calEvent}
        viewType={eventInfo.view.type}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );
  };

  return (
    <div className='flex h-full flex-col gap-4 p-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Schedule</h1>
          <p className='text-muted-foreground text-sm'>
            Manage appointments and encounters
          </p>
        </div>
        {loading && (
          <span className='text-muted-foreground text-xs'>Loading...</span>
        )}
      </div>

      <div className='bg-card flex-1 rounded-lg border p-4 shadow-sm'>
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin,
            listPlugin
          ]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          initialView='dayGridMonth'
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          eventOverlap={false}
          slotMinTime='00:00:00'
          slotMaxTime='24:00:00'
          slotDuration='00:10:00'
          slotLabelInterval='01:00:00'
          events={events}
          eventContent={renderEventContent}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          datesSet={handleDatesSet}
          height='auto'
          contentHeight='auto'
        />
      </div>

      {/* Form Dialog — Create / Edit */}
      <CalendarEventFormDialog
        showModal={showModal}
        isEditing={isEditing}
        currentEvent={currentEvent}
        handleCloseModal={handleCloseModal}
      />

      {/* View Dialog — Details + Status */}
      <CalendarEventViewDialog
        eventDetails={currentEvent}
        showEventViewDialog={showEventViewDialog}
        setShowEventViewDialog={setShowEventViewDialog}
        handleEditEvent={handleEdit}
        handleDeleteModal={handleDelete}
        onStatusChanged={() => {
          const api = calendarRef.current?.getApi();
          if (api) {
            fetchEvents(
              api.view.activeStart.toISOString(),
              api.view.activeEnd.toISOString()
            );
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <CalendarDeleteDialog
        showDeleteModal={showDeleteModal}
        handleCloseDeleteModal={handleCloseDeleteModal}
        handleDelete={handleConfirmDelete}
      />
    </div>
  );
}
