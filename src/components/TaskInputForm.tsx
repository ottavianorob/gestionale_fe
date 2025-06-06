
import React, { useState, useEffect } from 'react';
import type { Todo, UrgencyLevel, HistoricalTask } from '../types';
import { 
    URGENCY_LOW_MULTIPLIER, URGENCY_MEDIUM_MULTIPLIER, URGENCY_HIGH_MULTIPLIER, 
    DEFAULT_HOURLY_RATE 
} from '../constants';

interface TaskInputFormProps {
  onAddTask: (task: Omit<Todo, 'id' | 'completed' | 'createdAt'>) => void;
  clients: string[]; // List of available clients
  historicalTasks: HistoricalTask[]; // For price suggestion
}

const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const TaskInputForm: React.FC<TaskInputFormProps> = ({ onAddTask, clients, historicalTasks }) => {
  const [task, setTask] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [client, setClient] = useState<string>(clients[0] || '');
  const [estimatedHours, setEstimatedHours] = useState<number | ''>('');
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (task.trim() && estimatedHours) {
      // Simple Price Suggestion Logic
      let baseRate = DEFAULT_HOURLY_RATE;
      const taskKeywords = task.toLowerCase().split(' ');

      // Try to find a similar historical task
      const similarTask = historicalTasks.find(ht => 
        ht.keywords.some(kw => taskKeywords.includes(kw.toLowerCase()))
      );

      if (similarTask) {
        baseRate = similarTask.basePrice / (similarTask.hours || 1); // Use historical base rate if available
      }
      
      let urgencyMultiplier = URGENCY_MEDIUM_MULTIPLIER;
      if (urgency === 'low') urgencyMultiplier = URGENCY_LOW_MULTIPLIER;
      if (urgency === 'high') urgencyMultiplier = URGENCY_HIGH_MULTIPLIER;

      const price = baseRate * Number(estimatedHours) * urgencyMultiplier;
      setSuggestedPrice(Math.round(price));
    } else {
      setSuggestedPrice(null);
    }
  }, [task, estimatedHours, urgency, historicalTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.trim() || !estimatedHours) {
        alert("Per favore, inserisci la descrizione del task e le ore stimate.");
        return;
    }
    onAddTask({
      task,
      urgency,
      client,
      estimatedHours: Number(estimatedHours),
      suggestedPrice: suggestedPrice ?? undefined,
      notes,
    });
    setTask('');
    setUrgency('medium');
    setClient(clients[0] || '');
    setEstimatedHours('');
    setSuggestedPrice(null);
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-primary space-y-4 border border-content/10"> {/* Removed rounded-lg, sharp edges */}
      <h3 className="text-lg font-medium text-content">Aggiungi Nuova Attività</h3>
      <div>
        <label htmlFor="task-description" className="block text-sm font-normal text-content/70 mb-1">Descrizione Task</label>
        <input
          id="task-description"
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Es. Creare wireframes per App Z"
          className="w-full" 
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="task-urgency" className="block text-sm font-normal text-content/70 mb-1">Urgenza</label>
          <select
            id="task-urgency"
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
            className="w-full" 
          >
            <option value="low">Bassa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label htmlFor="task-client" className="block text-sm font-normal text-content/70 mb-1">Cliente</label>
          <select
            id="task-client"
            value={client}
            onChange={(e) => setClient(e.target.value)}
            className="w-full" 
          >
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="">Nessun Cliente Specifico</option>
          </select>
        </div>
        <div>
          <label htmlFor="task-hours" className="block text-sm font-normal text-content/70 mb-1">Ore Stimate</label>
          <input
            id="task-hours"
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value ? parseFloat(e.target.value) : '')}
            placeholder="Es. 8"
            min="0.5"
            step="0.5"
            className="w-full" 
            required
          />
        </div>
      </div>
      <div>
        <label htmlFor="task-notes" className="block text-sm font-normal text-content/70 mb-1">Note Aggiuntive</label>
        <textarea
          id="task-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Dettagli aggiuntivi, requisiti specifici..."
          rows={2}
          className="w-full" 
        />
      </div>

      {suggestedPrice !== null && (
        <div className="p-3 bg-primary-light/50 text-center border border-accent/50"> {/* Removed rounded-md, sharp edges */}
          <p className="text-sm text-content/80">Prezzo Suggerito: 
            <span className="text-lg font-semibold text-accent ml-2">{"€ " + suggestedPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </p>
        </div>
      )}
      <button
        type="submit"
        className="w-full btn-primary" // Will be sharp from global styles
      >
        Aggiungi Task
      </button>
    </form>
  );
};
