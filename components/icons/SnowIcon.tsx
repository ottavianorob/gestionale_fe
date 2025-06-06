import React from 'react';
import type { IconProps } from '../../types';

export const SnowIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a4.5 4.5 0 001.33-8.693 3.75 3.75 0 00-6.523-1.363 4.5 4.5 0 00-5.256 2.797A4.504 4.504 0 002.25 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5l-.75.75m.75-.75l.75.75m0 0l.75-.75m-.75.75L12 18m0 0l-.75-.75m.75.75L12 18m0 0l.75.75m-.75-.75L12 18m-3-1.5l-.75.75m.75-.75l.75.75m0 0l.75-.75m-.75.75L9 18m6-1.5l-.75.75m.75-.75l.75.75m0 0l.75-.75m-.75.75l-.75.75L15 18" />
  </svg>
);