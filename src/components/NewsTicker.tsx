
import React from 'react';
import type { NewsTickerItem } from '../types';
import { ACCENT_ORANGE, PURE_WHITE } from '../constants'; // Using PURE_WHITE for text-content consistency

interface NewsTickerProps {
  items: NewsTickerItem[];
}

const formatTimeAgo = (isoDateString: string): string => {
  const date = new Date(isoDateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "pochi secondi fa";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minut${diffInMinutes === 1 ? 'o' : 'i'} fa`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} or${diffInHours === 1 ? 'a' : 'e'} fa`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "ieri";
  if (diffInDays < 30) return `${diffInDays} giorni fa`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return "1 mese fa";
  if (diffInMonths < 12) return `${diffInMonths} mesi fa`;
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ann${diffInYears === 1 ? 'o' : 'i'} fa`;
};

export const NewsTicker: React.FC<NewsTickerProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return (
      <div className="w-full bg-primary-light py-2 px-4 text-center text-content/70 text-sm mb-4 border-y border-content/10"> {/* Changed deepBlueLight to primary-light, pureWhite to content */}
        Nessuna novità recente
      </div>
    );
  }

  // Duplicare gli item per creare un effetto di scorrimento infinito e fluido
  const duplicatedItems = [...items, ...items];

  return (
    <div className="ticker-wrap w-full bg-primary-light overflow-hidden whitespace-nowrap mb-4 group border-y border-content/10"> {/* Changed deepBlueLight to primary-light */}
      <div className="ticker-move inline-block">
        {duplicatedItems.map((item, index) => (
          <div key={`${item.id}-${index}`} className="inline-flex items-center py-2 px-6 align-middle">
            <span 
              style={{ backgroundColor: item.categoryColor || ACCENT_ORANGE }} 
              className="px-2 py-0.5 text-xs font-semibold text-primary mr-3 flex-shrink-0" // Changed deepBlue to primary
            >
              {item.category}
            </span>
            <span className="text-accent uppercase font-medium text-sm mr-3 flex-shrink-0"> {/* Changed accentOrange to accent */}
              {item.mainText}
            </span>
            <span className="text-content/70 text-xs font-extralight flex-shrink-0"> {/* Changed pureWhite to content */}
              {formatTimeAgo(item.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
