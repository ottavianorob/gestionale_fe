import React from 'react';
import type { IconProps } from '../../types';

export const FilePdfIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12V9.75M8.25 9.75h3M8.25 12h3m-3 2.25h3M3.375 2.25c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9h-3.375z" />
    <text x="15" y="16" fontFamily="Arial, sans-serif" fontSize="4px" fill="currentColor" fontWeight="bold">PDF</text>
  </svg>
);