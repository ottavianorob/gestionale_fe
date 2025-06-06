
import React from 'react';
import type { IconProps } from '../../types';

// Google Drive Icon SVG
export const GoogleDriveIcon: React.FC<IconProps> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" focusable="false">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M18.281 9.852H9.319l-2.152 3.728h8.962l2.152-3.728z" fill="#FFC107"/>
    <path d="M6.073 16.051l-2.152-3.728L1.58 16.738c-.43.75.036 1.701.864 1.701h14.112c.828 0 1.294-.951.864-1.701l-2.152-3.728-7.201 7.04z" fill="#34A853"/>
    <path d="M7.167 3.5l-2.152 3.728h13.971l2.152-3.728L14.681 3.5H9.319c-.276 0-.539.113-.724.308L7.167 3.5z" fill="#4285F4"/>
  </svg>
);
