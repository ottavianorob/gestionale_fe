import React from 'react';
import type { IconProps } from '../../types';

export const CurrencyEuroIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.2 7a6 7 0 1 0 0 10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10h-8m0 4h8" />
  </svg>
);