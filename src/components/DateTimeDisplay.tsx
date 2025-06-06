
import React, { useState, useEffect } from 'react';
import type { DateTimeDisplayProps } from '../types'; 

export const DateTimeDisplay: React.FC<DateTimeDisplayProps> = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); 

    return () => {
      clearInterval(timerId); 
    };
  }, []);

  const dayOfWeek = currentTime.toLocaleDateString('it-IT', { weekday: 'long' });
  const dayAndMonth = currentTime.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
  });

  const seconds = currentTime.getSeconds();
  const minutes = currentTime.getMinutes();
  const hours = currentTime.getHours();

  const secondDeg = (seconds / 60) * 360;
  const minuteDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

  return (
    <div className="flex items-center space-x-4 text-content/90"> {/* Increased space-x */}
      <div className="w-14 h-14 flex-shrink-0" aria-hidden="true"> {/* Increased size from w-10 h-10 */}
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Clock face */}
          <circle cx="50" cy="50" r="48" strokeWidth="3" stroke="currentColor" fill="none" className="text-content/30" />
          
          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="currentColor" className="text-accent" />

          {/* Hour hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="25"
            strokeWidth="5"
            stroke="currentColor"
            strokeLinecap="round"
            className="text-content"
            transform={`rotate(${hourDeg} 50 50)`}
          />
          {/* Minute hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="15"
            strokeWidth="4"
            stroke="currentColor"
            strokeLinecap="round"
            className="text-content/80"
            transform={`rotate(${minuteDeg} 50 50)`}
          />
          {/* Second hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="10"
            strokeWidth="2"
            stroke="currentColor"
            strokeLinecap="round"
            className="text-accent"
            transform={`rotate(${secondDeg} 50 50)`}
          />
           {/* Optional: Markings for 12, 3, 6, 9 */}
          <line x1="50" y1="5" x2="50" y2="10" strokeWidth="2" stroke="currentColor" className="text-content/50" />
          <line x1="95" y1="50" x2="90" y2="50" strokeWidth="2" stroke="currentColor" className="text-content/50" />
          <line x1="50" y1="95" x2="50" y2="90" strokeWidth="2" stroke="currentColor" className="text-content/50" />
          <line x1="5" y1="50" x2="10" y2="50" strokeWidth="2" stroke="currentColor" className="text-content/50" />
        </svg>
      </div>
      <div>
        <p className="text-base font-medium capitalize leading-tight">{dayOfWeek}</p> {/* Increased from text-sm */}
        <p className="text-base font-medium capitalize leading-tight">{dayAndMonth}</p> {/* Increased from text-sm */}
      </div>
    </div>
  );
};