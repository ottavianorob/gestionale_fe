
import React, { useState, useEffect } from 'react';
import type { Client } from '../types';
import { UserIcon } from './icons'; 
import clsx from 'clsx'; 

interface ClientCardProps {
  client: Client;
  totalInvoiced: number;
  onShowDetail: (client: Client) => void; 
}

const formatCurrency = (amount: number) => {
  return `€${amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const ClientCard: React.FC<ClientCardProps> = ({ client, totalInvoiced, onShowDetail }) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const canAttemptLoad = client.immagineUrl && (client.immagineUrl.startsWith('data:image') || client.immagineUrl.startsWith('http'));

  useEffect(() => {
    setImageLoadError(false);
  }, [client.immagineUrl]);
  
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('a, button')) {
      return;
    }
    onShowDetail(client);
  };

  return (
    <div 
      className="bg-card p-4 sm:p-5 flex flex-col h-full transition-all duration-200 cursor-pointer hover:bg-primary-light group focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-card border border-content/10"
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(e as any);}}
      role="button"
      tabIndex={0}
      aria-label={`Visualizza dettagli per ${client.denominazione}`}
    >
      <div className="flex-grow">
        <div className="flex items-center mb-4 sm:mb-6">
          <div className="w-10 h-10 sm:w-12 sm:h-12 overflow-hidden bg-primary-light border-2 border-content/10 flex-shrink-0 flex items-center justify-center">
            {canAttemptLoad && !imageLoadError ? (
              <img
                src={client.immagineUrl!}
                alt="" 
                className="w-full h-full object-cover"
                onError={() => setImageLoadError(true)}
                aria-hidden="true"
              />
            ) : (
              <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-content/70" aria-hidden="true" /> 
            )}
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-content ml-3 sm:ml-4 flex-1 truncate" title={client.denominazione}>
            {client.denominazione}
          </h3>
        </div>

        <div className="space-y-1 text-xs sm:text-sm mb-4">
          <p className="text-content/80">
            <span className="font-medium">P.IVA:</span> {client.partitaIva || 'N/D'}
          </p>
          <p className="text-content/70">
             {client.indirizzo1 || 'N/D'}
            {client.indirizzo2 && `, ${client.indirizzo2}`}
          </p>
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-center">
          <p className="text-xs text-content/60 uppercase tracking-wider">Totale Fatturato</p>
          <p className="text-2xl sm:text-3xl font-bold text-accent mt-1">
            {formatCurrency(totalInvoiced)}
          </p>
        </div>
      </div>
    </div>
  );
};
