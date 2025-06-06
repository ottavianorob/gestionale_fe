
import React from 'react';
import type { ActivityLogEntry } from '../types';
import { 
    HomeIcon, FolderIcon, DocumentTextIcon, CogIcon, BellIcon, UsersIcon, BriefcaseIcon, CurrencyEuroIcon, // existing
    UploadIcon, DownloadIcon, TrashIcon, EditIcon // new potential icons for types
} from './icons'; // Assuming a central icons export

const getActivityIcon = (type: ActivityLogEntry['type']) => {
  switch (type) {
    case 'TASK_CREATE':
    case 'TASK_UPDATE':
    case 'TASK_DELETE':
      return <BriefcaseIcon className="w-4 h-4 text-accent mr-2" />; // Changed accentOrange to accent
    case 'FILE_UPLOAD':
      return <UploadIcon className="w-4 h-4 text-accent mr-2" />; // Changed accentOrange to accent
    case 'FILE_DELETE':
      return <TrashIcon className="w-4 h-4 text-accent mr-2" />; // Changed accentOrange to accent
    case 'FISCAL_SIM':
      return <CurrencyEuroIcon className="w-4 h-4 text-accent mr-2" />; // Changed accentOrange to accent
    case 'LAYOUT_CHANGE':
      return <EditIcon className="w-4 h-4 text-accent mr-2" />; // Changed accentOrange to accent
    case 'DATA_EXPORT':
      return <DownloadIcon className="w-4 h-4 text-accent mr-2" />; // Changed accentOrange to accent
    default:
      return <BellIcon className="w-4 h-4 text-accent mr-2" />; // Changed accentOrange to accent
  }
};

export const ActivityLogItem: React.FC<{ entry: ActivityLogEntry }> = ({ entry }) => {
  return (
    <div className="relative pl-8 py-3 border-l-2 border-content/20 group"> {/* Changed pureWhite to content */}
      <div className="absolute -left-[9px] top-3 w-3.5 h-3.5 bg-accent border-2 border-primary-light group-hover:bg-content transition-colors"></div> {/* Removed rounded-full, changed deepBlueLight to primary-light, accentOrange to accent, pureWhite to content */}
      <div className="flex items-center text-xs text-content/60 mb-0.5"> {/* Changed pureWhite to content */}
        {getActivityIcon(entry.type)}
        <span>{entry.timestamp} - <span className="font-semibold text-content/80">{entry.user}</span></span> {/* Changed pureWhite to content */}
      </div>
      <p className="text-sm text-content/90">{entry.description}</p> {/* Changed pureWhite to content */}
      {/* {entry.details && Object.keys(entry.details).length > 0 && (
        <div className="mt-1 text-xs text-pureWhite/50 bg-deepBlue p-2 rounded-md">
          <pre className="whitespace-pre-wrap break-all"><code>{JSON.stringify(entry.details, null, 2)}</code></pre>
        </div>
      )} */}
    </div>
  );
};
