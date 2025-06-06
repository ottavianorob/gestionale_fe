
import React from 'react';
import type { ActivityLogEntry } from '../types';
import { SectionTitle } from './SectionTitle';
import { ActivityLogItem } from './ActivityLogItem';

interface ActivityLogProps {
  activities: ActivityLogEntry[];
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  const containerClasses = "bg-primary-light p-6 h-full flex flex-col border border-content/10"; // Sharp edges

  if (!activities || activities.length === 0) {
    return (
      <div className={containerClasses}>
        <SectionTitle>Storico Attività e Modifiche</SectionTitle>
        <p className="text-content/70 text-sm mt-4 flex-grow flex items-center justify-center">Nessuna attività registrata.</p>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <SectionTitle>Storico Attività e Modifiche</SectionTitle>
      <div className="mt-4 pr-2 space-y-0"> 
        {activities.slice().map(entry => ( 
          <ActivityLogItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
};
