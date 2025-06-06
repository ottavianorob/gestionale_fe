
import React from 'react';
import type { IconProps } from '../../types';

export const UsersIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-3.741-5.006c-.008.007-.016.013-.024.021L12 9.75M12 9.75L6 3.75m0 0a3 3 0 0 0-3.741 5.006c.008-.007.016-.013.024-.021L6 9.75m0-6L12 3.75m0 0L18 3.75M12 21a9.094 9.094 0 0 0-3.741-.479 3 3 0 0 0 3.741 5.006c.008-.007.016-.013.024-.021L12 15.75m0 0L18 21m-6-5.25L6 21" />
  </svg>
);