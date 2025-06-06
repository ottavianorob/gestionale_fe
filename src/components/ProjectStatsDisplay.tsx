
import React from 'react';
import type { ProjectStatsDisplayProps } from '../types';
import clsx from 'clsx'; 

export const ProjectStatsDisplay: React.FC<ProjectStatsDisplayProps> = ({ stats }) => {
  const StatBar: React.FC<{ title: string; value: number; total: number; colorClass: string; labelSuffix?: string }> = ({ title, value, total, colorClass, labelSuffix="" }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <div className="mb-2 sm:mb-3">
        <div className="flex justify-between items-baseline text-xs text-content/80 mb-0.5">
          <span className="font-medium">{title}</span>
          <span className="text-accent font-semibold">{value}{labelSuffix}</span>
        </div>
        <div className="h-2.5 bg-primary-light"> {/* Sharp edges by default */}
          <div
            className={clsx("h-2.5 transition-all duration-300 ease-out", colorClass)} // Sharp edges by default
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${title}: ${value}`}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card p-3 sm:p-4 border border-content/10"> {/* Sharp edges by default */}
      <h4 className="text-sm text-content/70 uppercase tracking-wider mb-2 sm:mb-3 text-center sm:text-left">Riepilogo Progetti</h4>
      <div className="grid grid-cols-1 gap-y-1.5 sm:gap-y-2">
        <StatBar
          title="In Corso"
          value={stats.ongoingProjects}
          total={stats.totalProjects > 0 ? stats.totalProjects : Math.max(1, stats.ongoingProjects)} 
          colorClass="bg-green-500"
        />
        <StatBar
          title="Completati"
          value={stats.completedProjects}
          total={stats.totalProjects > 0 ? stats.totalProjects : Math.max(1, stats.completedProjects)} 
          colorClass="bg-content/40"
        />
         <div className="text-right text-xs text-content/70 mt-1 pt-1 border-t border-content/10">
          Totale Progetti: <span className="font-semibold text-accent">{stats.totalProjects}</span>
        </div>
      </div>
    </div>
  );
};
