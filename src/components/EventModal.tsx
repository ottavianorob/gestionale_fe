
import React, { useState, useEffect } from 'react';
import type { EventModalProps, Event, EventType } from '../types';

const eventTypes: EventType[] = ['Meeting', 'Scadenza', 'Personale', 'Progetto Inizio', 'Progetto Fine', 'Avviso', 'Altro'];

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, onSave, event, selectedDate }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState<EventType>('Altro');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDate(event.date); // Already YYYY-MM-DD
      setType(event.type);
      setDescription(event.description || '');
    } else if (selectedDate) {
      setTitle('');
      setDate(selectedDate); // Pre-fill with selected date if adding new
      setType('Altro');
      setDescription('');
    } else {
        // Default to today if no selectedDate (e.g. clicking add from header)
        const today = new Date().toISOString().split('T')[0];
        setTitle('');
        setDate(today);
        setType('Altro');
        setDescription('');
    }
  }, [event, isOpen, selectedDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
        alert("Titolo e data sono obbligatori.");
        return;
    }
    onSave({ title, date, type, description });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4" role="dialog" aria-modal="true" aria-labelledby="eventModalTitle">
      <div className="bg-card p-6 w-11/12 max-w-xs sm:max-w-sm md:max-w-md border border-accent/50 max-h-[90vh] overflow-y-auto"> {/* Sharp edges from global styles */}
        <h3 id="eventModalTitle" className="text-xl font-semibold text-content mb-6">
          {event ? 'Modifica Evento' : 'Aggiungi Nuovo Evento'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="eventTitle" className="block text-sm font-normal text-content/80 mb-1">Titolo Evento*</label>
            <input type="text" id="eventTitle" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full"/> {/* Sharp from global */}
          </div>
          <div>
            <label htmlFor="eventDate" className="block text-sm font-normal text-content/80 mb-1">Data Evento*</label>
            <input type="date" id="eventDate" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full"/> {/* Sharp from global */}
          </div>
          <div>
            <label htmlFor="eventType" className="block text-sm font-normal text-content/80 mb-1">Tipo Evento</label>
            <select id="eventType" value={type} onChange={(e) => setType(e.target.value as EventType)} className="w-full"> {/* Sharp from global */}
              {eventTypes.map(et => <option key={et} value={et} className="bg-card text-content">{et}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="eventDescription" className="block text-sm font-normal text-content/80 mb-1">Descrizione</label>
            <textarea id="eventDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full"/> {/* Sharp from global */}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary" // Sharp from global
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-primary" // Sharp from global
            >
              {event ? 'Salva Modifiche' : 'Aggiungi Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};