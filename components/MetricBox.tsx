
import React from 'react';
import type { IconProps, Metric } from '../types'; 
import { metricIconMap } from '../config/dashboard-config'; 

interface MetricBoxProps {
  title: string;
  value: string | number;
  percentageChange?: number;
  iconName?: string; 
  icon?: React.ReactNode; 
  ChangeIconPositive?: React.FC<IconProps>;
  ChangeIconNegative?: React.FC<IconProps>;
}

export const MetricBox: React.FC<MetricBoxProps> = ({ 
  title, 
  value, 
  percentageChange, 
  iconName,
  icon, 
  ChangeIconPositive,
  ChangeIconNegative 
}) => {
  const hasChange = typeof percentageChange === 'number';
  const isPositive = hasChange && percentageChange > 0;
  const isNegative = hasChange && percentageChange < 0;

  let displayIcon: React.ReactNode = icon; 
  if (!displayIcon && iconName && metricIconMap[iconName]) {
    const IconComponent = metricIconMap[iconName];
    displayIcon = <IconComponent className="w-6 h-6 text-accent" />; 
  }

  const isCurrencyMetric = iconName?.includes('Currency') || (typeof value === 'number' && (title.toLowerCase().includes('entrate') || title.toLowerCase().includes('spese')));
  
  const displayValue = typeof value === 'number' && isCurrencyMetric
    ? "€ " + value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : typeof value === 'number' 
    ? value.toLocaleString('it-IT') 
    : value;


  return (
    <div className="p-4 h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xs font-normal text-content/70 uppercase tracking-wider">{title}</h3>
          {displayIcon && <div className="text-accent opacity-90">{displayIcon}</div>}
        </div>
        <p className="text-3xl md:text-4xl font-normal text-content mt-1">{displayValue}</p>
      </div>
      <div className="h-[20px] mt-2"> 
        {hasChange && (
          <div className={`flex items-center text-xs ${isPositive ? 'text-accent' : isNegative ? 'text-danger' : 'text-content/60'}`}>
            {isPositive && ChangeIconPositive && <ChangeIconPositive className="w-3.5 h-3.5 mr-1" />}
            {isNegative && ChangeIconNegative && <ChangeIconNegative className="w-3.5 h-3.5 mr-1" />}
            {!isPositive && !isNegative && <span className="w-3.5 h-3.5 mr-1 inline-block text-center">-</span>}
            <span className="truncate">{percentageChange.toFixed(1)}% vs periodo prec.</span>
          </div>
        )}
      </div>
    </div>
  );
};
