
import React, { useState } from 'react';
import { CheckIcon } from './icons/CheckIcon';
import { EditIcon } from './icons/EditIcon'; // Assuming you have an EditIcon
import { TrashIcon } from './icons/TrashIcon'; // Assuming you have a TrashIcon
import type { Todo, UrgencyLevel } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void; // For editing
}

const UrgencyBadge: React.FC<{urgency?: UrgencyLevel}> = ({ urgency }) => {
  if (!urgency) return null;
  let bgColor = 'bg-gray-500';
  if (urgency === 'low') bgColor = 'bg-green-600';
  if (urgency === 'medium') bgColor = 'bg-yellow-500';
  if (urgency === 'high') bgColor = 'bg-red-600';
  return <span className={`px-2 py-0.5 text-xs font-semibold text-content ${bgColor}`}>{urgency.toUpperCase()}</span>; {/* Removed rounded-full, now sharp */}
};


export const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.task);
  // Add states for other editable fields if needed

  const handleSaveEdit = () => {
    onUpdate(todo.id, { task: editText });
    setIsEditing(false);
  };
  
  // TODO: Implement a small modal or inline form for editing more details

  return (
    <div className="bg-primary p-3 border border-content/10 group hover:border-accent/50 transition-colors"> {/* Removed rounded-lg, sharp edges */}
      <div className="flex items-start justify-between">
        <label className="flex items-start cursor-pointer flex-grow mr-2">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
            className="sr-only peer" 
          />
          <span /* Checkbox custom styling. Relies on global styles for square shape and focus. */
            className={`w-5 h-5 border-2 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 transition-all duration-150 ease-in-out
                        ${todo.completed ? 'bg-accent border-accent' : 'border-content/50 group-hover:border-accent bg-card'}`} 
          >
            {todo.completed && <CheckIcon className="w-3.5 h-3.5 text-primary" />}
          </span>
          {isEditing ? (
            <input 
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
              className="text-sm font-normal bg-transparent border-b border-accent text-content flex-grow outline-none"
              autoFocus
            />
          ) : (
            <span className={`text-sm font-normal transition-colors duration-150 ease-in-out ${todo.completed ? 'text-content/50 line-through' : 'text-content/90 group-hover:text-content'}`}>
              {todo.task}
            </span>
          )}
        </label>
        <div className="flex space-x-1 flex-shrink-0">
           {/* <button onClick={() => setIsEditing(true)} className="text-content/50 hover:text-accent p-1" title="Modifica">
            <EditIcon className="w-4 h-4" />
          </button> */}
          <button onClick={() => onDelete(todo.id)} className="btn-icon !p-1 focus-visible:ring-danger" title="Elimina"> {/* Uses global btn-icon sharp style */}
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {(todo.urgency || todo.client || todo.estimatedHours || todo.suggestedPrice || todo.notes) && (
        <div className="mt-2 pl-8 text-xs space-y-1">
          {todo.urgency && <p><UrgencyBadge urgency={todo.urgency} /></p>}
          {todo.client && <p className="text-content/60">Cliente: <span className="text-content/80">{todo.client}</span></p>}
          {todo.estimatedHours && <p className="text-content/60">Ore Stimate: <span className="text-content/80">{todo.estimatedHours}h</span></p>}
          {todo.suggestedPrice && <p className="text-content/60">Prezzo Suggerito: <span className="text-accent/80">{"€ " + todo.suggestedPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>}
          {todo.finalPrice && <p className="text-content/60">Prezzo Finale: <span className="text-accent font-semibold">{"€ " + todo.finalPrice.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>}
          {todo.notes && <p className="text-content/60 italic">Note: {todo.notes}</p>}
        </div>
      )}
    </div>
  );
};
