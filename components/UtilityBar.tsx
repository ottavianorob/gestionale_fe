


import React from 'react';
import type { UtilityBarProps, ActivityLogType } from '../types'; 
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { DateTimeDisplay } from './DateTimeDisplay';
import { WeatherWidget } from './WeatherWidget'; // Import WeatherWidget
import clsx from 'clsx'; 

export const UtilityBar: React.FC<UtilityBarProps & { addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void }> = ({ 
  notificationCount = 0, 
  BellIcon, 
  EnvelopeIcon, 
  CogIcon,
  Bars3Icon,
  onToggleLayoutEdit,
  isLayoutEditMode,
  isMobileView,
  onToggleMobileMenu,
  addActivityLogEntry
}) => {
  return (
    <div className={clsx(
        "flex justify-between items-center py-4 sm:py-5 border-b border-content/10 mb-4",
        isMobileView && "px-0", 
        !isMobileView && "px-1"  
      )}>
      
      {/* Left group: Hamburger (mobile only), DateTime, Weather */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {isMobileView && (
          <button 
            onClick={onToggleMobileMenu}
            className="btn-icon md:hidden -ml-1" 
            aria-label="Apri menu"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        )}
        <DateTimeDisplay />
        <WeatherWidget addActivityLogEntry={addActivityLogEntry} /> 
      </div>
      
      {/* Right group: Layout Edit (desktop only), Notifications */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {!isMobileView && (
          <button 
            onClick={onToggleLayoutEdit}
            className={clsx(
                "flex items-center p-1.5 sm:p-2 transition-colors duration-150 ease-in-out text-xs", 
                isLayoutEditMode 
                  ? 'bg-accent text-primary hover:bg-opacity-90' 
                  : 'bg-primary-light text-content hover:bg-opacity-80 border border-content/30'
            )} 
            aria-label={isLayoutEditMode ? "Salva layout" : "Modifica layout"}
            title={isLayoutEditMode ? "Salva layout" : "Modifica layout"}
          >
            {isLayoutEditMode ? <SaveIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <EditIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="ml-1 hidden sm:inline">{isLayoutEditMode ? "Salva" : "Modifica"}</span>
          </button>
        )}

        <button 
          className="btn-icon relative" 
          aria-label={`Notifiche ${notificationCount > 0 ? `(${notificationCount} non lette)` : ''}`}
          title="Notifiche"
        >
          <BellIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          {notificationCount > 0 && (
            <span 
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-[18px] w-[18px] text-[10px] font-bold text-primary bg-accent border-2 border-primary rounded-full"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
        
        {/* <button className="btn-icon" aria-label="Messaggi" title="Messaggi">
          <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button> */}

      </div>
    </div>
  );
};