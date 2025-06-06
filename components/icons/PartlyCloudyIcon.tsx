import React from 'react';
import type { IconProps } from '../../types';

export const PartlyCloudyIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className}>
    {/* Sun part */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75V2.25m3.303 1.575L16.725 3m3 6.75H21.75m-1.575 3.303L21 16.725M12 20.25V21.75m-3.303-1.575L7.275 21M3.75 15H2.25m1.575-3.303L3 10.275" />
    <circle cx="12" cy="12" r="2.25" strokeLinecap="round" strokeLinejoin="round" />
    {/* Cloud part, slightly offset and smaller */}
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 17.25a3.375 3.375 0 003.375 3.375H22.5a3.375 3.375 0 00.998-6.52 2.813 2.813 0 00-4.892-1.022 3.375 3.375 0 00-3.942 2.098A3.379 3.379 0 0011.25 16.5a3.375 3.375 0 003.375 3.375h4.875z" transform="translate(-4 -3) scale(0.85)" />
  </svg>
);