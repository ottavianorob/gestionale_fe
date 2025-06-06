
import React from 'react';
import { EyeIcon, EyeSlashIcon } from './icons'; // Assicurati che il percorso sia corretto

interface DragHandleProps {
  title: string;
  widgetId: string; // 'widgetId' invece di 'id' per chiarezza, dato che 'id' è spesso usato per DOM
  onToggleVisibility: (widgetId: string) => void;
  isVisible: boolean;
}

export const DragHandle: React.FC<DragHandleProps> = ({ title, widgetId, onToggleVisibility, isVisible }) => {
  return (
    <div className="widget-drag-handle bg-accent/60 text-primary text-xs px-2 py-1 cursor-move absolute top-0 left-0 right-0 z-10 flex justify-between items-center w-full">
      <span className="font-semibold truncate pr-1">{title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation(); 
          onToggleVisibility(widgetId);
        }}
        className="p-0.5 hover:bg-primary/20 flex-shrink-0"
        title={isVisible ? "Nascondi sezione" : "Mostra sezione"}
        aria-label={isVisible ? `Nascondi la sezione ${title}` : `Mostra la sezione ${title}`}
      >
        {isVisible ? <EyeSlashIcon className="w-3.5 h-3.5" /> : <EyeIcon className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
