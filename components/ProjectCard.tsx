
import React from 'react';
import type { Project, ProjectCardProps } from '../types';
import { FolderIcon, LinkIcon, EditIcon, TrashIcon } from './icons';
import clsx from 'clsx'; 

// Parses "DD/MM/AA" to Date object (UTC)
const parseCardDateString = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    let year = parseInt(parts[2], 10);
    if (year < 100) { // Handle 2-digit year
      year += 2000;
    }
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(Date.UTC(year, month, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  console.warn(`Invalid date string for card parsing: ${dateStr}`);
  return null;
};

// Formats date to "DD Mon AA" (e.g., "15 Lug 24")
const formatDateForCardDisplay = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/D';
  const date = parseCardDateString(dateStr);
  if (!date) return dateStr; // Return original if parsing failed
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'UTC' }).replace('.', '');
};

const formatCurrency = (amount: number | undefined) => {
  if (typeof amount !== 'number') return 'N/A';
  return "€ " + amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Calculates duration text, e.g., "(45 giorni)" or "(circa 2 mesi)"
function calculateDurationText(startDateStr: string | null | undefined, endDateStr: string | null | undefined): string | null {
    if (!startDateStr || !endDateStr) return null;

    const startDate = parseCardDateString(startDateStr);
    const endDate = parseCardDateString(endDateStr);

    if (!startDate || !endDate || endDate < startDate) {
        return null; 
    }
    
    const utcStartDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const utcEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

    const diffTime = utcEndDate.getTime() - utcStartDate.getTime();
    const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (totalDays < 0) return null; 
    if (totalDays === 0) return "(<1 giorno)"; 

    if (totalDays < 60) {
        return `(${totalDays} giorn${totalDays === 1 ? 'o' : 'i'})`;
    } else {
        const totalMonths = Math.round(totalDays / 30.4375); 
        if (totalMonths < 1) return `(${totalDays} giorn${totalDays === 1 ? 'o' : 'i'})`; 
        return `(circa ${totalMonths} mes${totalMonths === 1 ? 'e' : 'i'})`;
    }
}


export const ProjectCard: React.FC<ProjectCardProps> = ({ project, clientName, onEdit, onDelete, onShowDetail, totalTasksAmount }) => {
  const todayAtMidnight = new Date();
  todayAtMidnight.setUTCHours(0, 0, 0, 0);

  const parsedEndDate = project.dataFineProgetto ? parseCardDateString(project.dataFineProgetto) : null;
  
  const isCompleted = !!parsedEndDate && parsedEndDate < todayAtMidnight;
  
  const durationText = isCompleted ? calculateDurationText(project.dataProg, project.dataFineProgetto) : null;
  const formattedStartDate = formatDateForCardDisplay(project.dataProg);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    onShowDetail(project);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
        if ((e.target as HTMLElement).closest('button, a')) {
            return;
        }
        onShowDetail(project);
    }
  };


  return (
    <div 
        className="bg-card p-4 sm:p-5 flex flex-col h-full transition-all duration-200 hover:bg-primary-light group relative cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 border border-content/10" // Sharp edges
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Visualizza dettagli per il progetto ${project.denominazioneProgetto}`}
    >
      <div className="flex justify-between items-start mb-2 min-h-[2rem]">
        <div className="absolute top-2 left-2 z-20 flex space-x-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150">
          {project.linkProgetto && (
            <a
              href={project.linkProgetto}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()} 
              className="btn-icon !p-1 sm:!p-1.5" // Sharp from global
              title="Apri link progetto"
              aria-label={`Apri link per ${project.denominazioneProgetto}`}
            >
              <LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(project); }}
            className="btn-icon !p-1 sm:!p-1.5" // Sharp from global
            title="Modifica Progetto"
            aria-label={`Modifica progetto ${project.denominazioneProgetto}`}
          >
            <EditIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(project.id, project.denominazioneProgetto); }}
            className="btn-icon !p-1 sm:!p-1.5 !hover:text-danger" // Sharp from global
            title="Elimina Progetto"
            aria-label={`Elimina progetto ${project.denominazioneProgetto}`}
          >
            <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="text-xs text-content/60 text-right ml-auto">
          <span>{formattedStartDate}</span>
          {isCompleted && durationText && (
            <span className="text-accent ml-1">{durationText}</span>
          )}
        </div>
      </div>

      <div className="flex-grow mb-3 sm:mb-4 mt-1">
        <FolderIcon className="w-7 h-7 sm:w-8 sm:h-8 text-accent mb-2" />
        
        <h3 className="text-base sm:text-lg font-semibold text-content mb-1 break-words" title={project.denominazioneProgetto}>
          {project.denominazioneProgetto}
        </h3>
        <p className="text-xs text-accent/80 font-medium mb-2 sm:mb-3 uppercase tracking-wider truncate" title={clientName}>
          {clientName}
        </p>
      </div>

      <div className="mt-auto pt-2 sm:pt-3 border-t border-content/10 flex justify-between items-end">
        {isCompleted && typeof totalTasksAmount === 'number' ? (
          <div className="text-xs text-left">
            <span className="text-accent font-semibold">{formatCurrency(totalTasksAmount)}</span>
          </div>
        ) : (
          <div></div> 
        )}
        {isCompleted ? (
          <span className="px-2 py-0.5 text-xs font-semibold bg-content/20 text-content/70"> 
            Completato
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-semibold bg-success/80 text-content"> 
            In Corso
          </span>
        )}
      </div>
    </div>
  );
};
