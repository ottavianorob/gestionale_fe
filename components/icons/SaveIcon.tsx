import React from 'react';
import type { IconProps } from '../../types';

export const SaveIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.643V16.5a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 16.5v-2.679a2.25 2.25 0 00-.1-.643L16.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.012-1.244h3.86M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);