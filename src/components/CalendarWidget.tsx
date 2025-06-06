
import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import type { Event, CalendarWidgetProps, EventType } from '../types';
import { ChevronLeftIcon, ChevronRightIcon, PlusCircleIcon, EditIcon, TrashIcon } from './icons';
import clsx from 'clsx';

const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

const getEventTypeStyling = (type: EventType): {bgColor: string, borderColor: string, textColor: string, dotColor: string} => {
    switch(type) {
        case 'Meeting': return { bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500', textColor: 'text-blue-400', dotColor: 'bg-blue-500' };
        case 'Scadenza': return { bgColor: 'bg-red-500/10', borderColor: 'border-red-500', textColor: 'text-red-400', dotColor: 'bg-red-500' };
        case 'Personale': return { bgColor: 'bg-green-500/10', borderColor: 'border-green-500', textColor: 'text-green-400', dotColor: 'bg-green-500' };
        case 'Progetto Inizio': return { bgColor: 'bg-teal-500/10', borderColor: 'border-teal-500', textColor: 'text-teal-400', dotColor: 'bg-teal-500' };
        case 'Progetto Fine': return { bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500', textColor: 'text-pink-400', dotColor: 'bg-pink-500' };
        case 'Avviso': return { bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500', textColor: 'text-purple-400', dotColor: 'bg-purple-500' };
        case 'Altro':
        default: return { bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500', textColor: 'text-gray-400', dotColor: 'bg-gray-500' };
    }
};


export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
    events, onAddEvent, onEditEvent, onDeleteEvent,
    currentSelectedDate, onDateSelect,
    currentMonth, onSetCurrentMonth
}) => {
  const calendarGridRef = useRef<HTMLDivElement>(null);
  const calendarWidgetRef = useRef<HTMLDivElement>(null);
  const selectedEventsListRef = useRef<HTMLDivElement>(null);


  const startOfMonth = useMemo(() => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1), [currentMonth]);

  const startDate = useMemo(() => {
    const date = new Date(startOfMonth);
    const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Calculate difference to make Monday the first day
    date.setDate(date.getDate() + diff);
    return date;
  }, [startOfMonth]);

  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let dateIterator = new Date(startDate);
    for (let i = 0; i < 42; i++) { // 6 weeks for full grid visibility
      days.push(new Date(dateIterator));
      dateIterator.setDate(dateIterator.getDate() + 1);
    }
    return days;
  }, [startDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(event => {
      const dateKey = event.date; // YYYY-MM-DD format
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)?.push(event);
    });
    map.forEach((dayEvents) => {
        dayEvents.sort((a, b) => a.title.localeCompare(b.title));
    });
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    if (!currentSelectedDate) return [];
    const dateKey = currentSelectedDate.toISOString().split('T')[0];
    return eventsByDate.get(dateKey) || [];
  }, [currentSelectedDate, eventsByDate]);

  useEffect(() => {
    if (selectedDateEvents.length > 0 && selectedEventsListRef.current) {
        selectedEventsListRef.current.scrollTop = 0;
    }
  }, [selectedDateEvents]);

  const handlePrevMonth = useCallback(() => onSetCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)), [currentMonth, onSetCurrentMonth]);
  const handleNextMonth = useCallback(() => onSetCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)), [currentMonth, onSetCurrentMonth]);
  const handleToday = useCallback(() => {
    const today = new Date();
    onSetCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    onDateSelect(today);
  }, [onSetCurrentMonth, onDateSelect]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const isSelected = (date: Date) => {
    if (!currentSelectedDate) return false;
    return date.getFullYear() === currentSelectedDate.getFullYear() &&
           date.getMonth() === currentSelectedDate.getMonth() &&
           date.getDate() === currentSelectedDate.getDate();
  };

  const cellHeight = calendarGridRef.current && calendarWidgetRef.current
    ? Math.max(40, (calendarGridRef.current.offsetHeight / 6) - 4) // 4px for padding/border
    : 60; 

  const MAX_EVENT_DOTS = 3;

  return (
    <div ref={calendarWidgetRef} className="h-full flex flex-col bg-card p-3 sm:p-4 text-content border border-content/10">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center">
            <h2 className="text-lg sm:text-xl font-semibold text-content/90 w-36 sm:w-44 truncate" title={currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}>
            {currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={handleToday} className="ml-2 sm:ml-3 text-xs px-2 py-1 bg-primary hover:bg-accent hover:text-primary transition-colors">Oggi</button>
        </div>
        <div className="flex space-x-1 sm:space-x-2">
          <button onClick={handlePrevMonth} className="btn-icon !p-1.5 sm:!p-2" aria-label="Mese precedente"><ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          <button onClick={handleNextMonth} className="btn-icon !p-1.5 sm:!p-2" aria-label="Mese successivo"><ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          <button onClick={onAddEvent} className="btn-primary !px-2 !py-1 sm:!px-3 sm:!py-1.5 text-xs sm:text-sm flex items-center" aria-label="Aggiungi evento">
            <PlusCircleIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" /> <span className="hidden sm:inline">Evento</span>
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row gap-3 sm:gap-4 min-h-0">
        <div className="lg:w-2/3 flex flex-col">
            <div className="grid grid-cols-7 gap-px text-xs text-content/70 text-center mb-1 sm:mb-1.5">
            {daysOfWeek.map(day => <div key={day} className="pb-1 border-b border-content/10">{day}</div>)}
            </div>
            <div ref={calendarGridRef} className="grid grid-cols-7 grid-rows-6 gap-px flex-grow bg-primary-light border-l border-t border-primary-light">
            {calendarDays.map((day, index) => {
                const dayKey = day.toISOString().split('T')[0];
                const dayEvents = eventsByDate.get(dayKey) || [];
                const isCurrentMonthDay = day.getMonth() === currentMonth.getMonth();
                const isDayToday = isToday(day);
                const isDaySelected = isSelected(day);

                return (
                <div
                    key={index}
                    onClick={() => onDateSelect(day)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDateSelect(day)}
                    tabIndex={0}
                    className={clsx(
                    'p-1.5 sm:p-2 cursor-pointer flex flex-col relative border-r border-b border-primary-light transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-accent focus:z-10',
                    isCurrentMonthDay ? 'bg-card hover:bg-primary' : 'bg-card/50 text-content/50 hover:bg-primary/70',
                    {
                        'bg-accent text-content hover:bg-accent/90': isDaySelected, 
                        'border-2 border-accent': isDayToday && !isDaySelected, 
                    }
                    )}
                    style={{ minHeight: `${cellHeight}px`}}
                    role="button"
                    aria-label={`Giorno ${day.getDate()}, ${dayEvents.length} eventi. ${isDayToday ? 'Oggi.' : ''} ${isDaySelected ? 'Selezionato.' : ''}`}
                >
                    <span className={clsx(
                        "text-xs sm:text-sm font-medium mb-0.5 sm:mb-1",
                        isDaySelected ? "text-content" : isDayToday ? "text-accent" : isCurrentMonthDay ? "text-content/90" : "text-content/60"
                    )}>{day.getDate()}</span>
                    <div className="flex-grow space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, MAX_EVENT_DOTS).map(event => (
                            <div key={event.id} className="flex items-center">
                                <span className={clsx("w-1.5 h-1.5 mr-1 flex-shrink-0", getEventTypeStyling(event.type).dotColor, {'opacity-70': !isCurrentMonthDay}, isDaySelected ? 'bg-content/70' : '')}></span>
                                <span className={clsx(
                                    "text-[9px] sm:text-[10px] truncate",
                                    isDaySelected ? "text-content opacity-90" : "text-content/70",
                                    {'opacity-70': !isCurrentMonthDay}
                                )}>{event.title}</span>
                            </div>
                        ))}
                        {dayEvents.length > MAX_EVENT_DOTS && (
                             <div className={clsx("text-[9px] sm:text-[10px]", isDaySelected ? "text-content opacity-80" : "text-content/60", {'opacity-70': !isCurrentMonthDay})}>
                                +{dayEvents.length - MAX_EVENT_DOTS} altro...
                            </div>
                        )}
                    </div>
                </div>
                );
            })}
            </div>
        </div>

        <div ref={selectedEventsListRef} className="lg:w-1/3 flex-grow lg:flex-grow-0 lg:max-h-full overflow-y-auto space-y-2 sm:space-y-3 p-0.5 pr-1 -mr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-card)'}}>
            {currentSelectedDate ? (
                <>
                {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map(event => {
                    const { bgColor, borderColor, textColor } = getEventTypeStyling(event.type);
                    return (
                        <div key={event.id} className={clsx("p-2 sm:p-3 border-l-4", bgColor, borderColor)}>
                        <div className="flex justify-between items-start">
                            <div>
                            <h4 className={clsx("text-sm sm:text-base font-semibold", textColor)}>{event.title}</h4>
                            <p className="text-xs text-content/70">{event.type}</p>
                            </div>
                            <div className="flex space-x-1 sm:space-x-1.5 flex-shrink-0">
                            <button onClick={() => onEditEvent(event.id, event)} className="btn-icon !p-1" aria-label={`Modifica evento ${event.title}`}>
                                <EditIcon className="w-3.5 h-3.5 text-content/70 hover:text-accent" />
                            </button>
                            <button onClick={() => onDeleteEvent(event.id)} className="btn-icon !p-1" aria-label={`Elimina evento ${event.title}`}>
                                <TrashIcon className="w-3.5 h-3.5 text-content/70 hover:text-danger" />
                            </button>
                            </div>
                        </div>
                        {event.description && <p className="mt-1 text-xs text-content/80 whitespace-pre-wrap">{event.description}</p>}
                        </div>
                    );
                    })
                ) : (
                    <p className="text-sm text-content/70 text-center py-4">Nessun evento per questa data.</p>
                )}
                </>
            ) : (
                <p className="text-sm text-content/70 text-center py-4 h-full flex items-center justify-center">Seleziona una data per vedere gli eventi.</p>
            )}
        </div>
      </div>
    </div>
  );
};
