
import React from 'react';
import type { IconProps } from '../../types';

export const BriefcaseIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.073a2.25 2.25 0 0 1-2.25 2.25h-12a2.25 2.25 0 0 1-2.25-2.25V6.375a2.25 2.25 0 0 1 2.25-2.25h7.5A2.25 2.25 0 0 1 15.75 6.375v4.073m0 0L12 10.5m3.75 3.675L12 10.5m3.75 3.675A2.25 2.25 0 0 1 13.5 18H12v-2.25A2.25 2.25 0 0 1 9.75 13.5v-2.25A2.25 2.25 0 0 1 12 9h1.5m3 0h3.75c.621 0 1.125-.504 1.125-1.125V6.375c0-.621-.504-1.125-1.125-1.125H16.5m0 0V4.875c0-.621-.504-1.125-1.125-1.125H8.625c-.621 0-1.125.504-1.125 1.125v1.5m0 0H3.75V18a2.25 2.25 0 0 0 2.25 2.25h12.75A2.25 2.25 0 0 0 20.25 18v-3.85Z" />
  </svg>
);