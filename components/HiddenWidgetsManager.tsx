
import React from 'react';
import type { WidgetVisibilityState } from '../types';
import { EyeIcon } from './icons';

interface HiddenWidgetsManagerProps {
  widgetVisibility: WidgetVisibilityState;
  widgetTitles: Record<string, string>;
  onToggleWidget: (widgetId: string) => void;
}

export const HiddenWidgetsManager: React.FC<HiddenWidgetsManagerProps> = ({ widgetVisibility, widgetTitles, onToggleWidget }) => {
  const hiddenWidgets = Object.entries(widgetVisibility)
    .filter(([widgetId, isVisible]) => !isVisible && widgetTitles[widgetId]) // Ensure title exists
    .map(([widgetId, _]) => ({ id: widgetId, title: widgetTitles[widgetId] }));

  if (hiddenWidgets.length === 0) {
    return (
        <div className="my-4 p-3 bg-primary-light/30 text-center border border-content/10"> {/* Removed rounded-lg, changed deepBlueLight to primary-light */}
            <p className="text-sm text-content/70">Tutte le sezioni sono visibili.</p> {/* Changed pureWhite to content */}
        </div>
    );
  }

  return (
    <div className="my-4 p-4 bg-primary-light border border-content/10"> {/* Removed rounded-lg, changed deepBlueLight to primary-light */}
      <h3 className="text-md font-semibold text-content mb-3 border-b border-content/20 pb-2">Sezioni Nascoste</h3> {/* Changed pureWhite to content */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {hiddenWidgets.map(widget => (
          <button
            key={widget.id}
            onClick={() => onToggleWidget(widget.id)}
            className="flex items-center justify-center text-sm bg-primary text-content/80 hover:bg-accent hover:text-primary p-2 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-1 focus:ring-accent border border-content/20" // Removed rounded-md, changed deepBlue to primary, pureWhite to content, accentOrange to accent
            title={`Mostra la sezione ${widget.title}`}
          >
            <EyeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{widget.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
