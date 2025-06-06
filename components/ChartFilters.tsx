
import React from 'react';
import type { ChartFilterState } from '../types';

interface ChartFiltersProps {
  years: (number | string)[];
  clients: string[];
  currentFilters: ChartFilterState;
  onFilterChange: (filters: Partial<ChartFilterState>) => void;
}

export const ChartFilters: React.FC<ChartFiltersProps> = ({ years, clients, currentFilters, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3 items-end"> {/* Container is inherently flat */}
      <div>
        <label htmlFor="year-filter" className="block text-xs font-normal text-content/70 mb-1">
          Anno
        </label>
        <select
          id="year-filter"
          value={currentFilters.selectedYear}
          onChange={(e) => onFilterChange({ selectedYear: e.target.value === 'all' ? 'all' : parseInt(e.target.value) })}
          className="w-full sm:w-auto" // Rely on global styles from index.html for sharp edges
        >
          <option value="all" className="bg-card text-content">Tutti gli Anni</option>
          {years.map(year => (
            <option key={year} value={year} className="bg-card text-content">{year}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="client-filter" className="block text-xs font-normal text-content/70 mb-1">
          Cliente (Esempio)
        </label>
        <select
          id="client-filter"
          value={currentFilters.selectedClient}
          onChange={(e) => onFilterChange({ selectedClient: e.target.value })}
          className="w-full sm:w-auto" // Rely on global styles for sharp edges
        >
          <option value="all" className="bg-card text-content">Tutti i Clienti</option>
          {clients.map(client => (
            <option key={client} value={client} className="bg-card text-content">{client}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-content/50 mt-1 self-end flex-grow text-right hidden sm:block">Filtri applicati ai grafici sottostanti.</p>
    </div>
  );
};
