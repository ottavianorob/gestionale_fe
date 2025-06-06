
import React, { useState, useEffect } from 'react';
import type { ProjectModalProps, Project, Client } from '../types';

// Helper to parse DD/MM/AA to Date object
const parseModalDateString = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
       const date = new Date(Date.UTC(year, month, day));
       if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  return null;
};

// Helper to format Date object to DD/MM/AA string
const dateToDisplayString = (date: Date | null): string => {
  if (!date) return '';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

// Helper to format Date object to YYYY-MM-DD string for date input
const dateToInputString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isValidDateDisplayString = (dateStr: string | null | undefined): boolean => {
    if (!dateStr || dateStr.trim() === '') return true; // Optional fields are valid if empty
    return /^\d{2}\/\d{2}\/\d{2}$/.test(dateStr) && parseModalDateString(dateStr) !== null;
};


export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, projectToEdit, clients, initialClientId }) => {
  const [denominazioneProgetto, setDenominazioneProgetto] = useState('');
  const [idCliente, setIdCliente] = useState<number>(initialClientId || (clients.length > 0 ? clients[0].id : -1));
  const [dataProg, setDataProg] = useState(''); // Stores as YYYY-MM-DD for input field
  const [dataFineProgetto, setDataFineProgetto] = useState(''); // Stores as YYYY-MM-DD for input field
  const [linkProgetto, setLinkProgetto] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setDenominazioneProgetto(projectToEdit.denominazioneProgetto);
      setIdCliente(projectToEdit.idCliente);
      setDataProg(dateToInputString(parseModalDateString(projectToEdit.dataProg)));
      setDataFineProgetto(dateToInputString(parseModalDateString(projectToEdit.dataFineProgetto)));
      setLinkProgetto(projectToEdit.linkProgetto || '');
    } else {
      setDenominazioneProgetto('');
      setIdCliente(initialClientId || (clients.length > 0 ? clients[0].id : -1));
      const today = new Date();
      setDataProg(dateToInputString(today)); 
      setDataFineProgetto('');
      setLinkProgetto('');
    }
  }, [projectToEdit, isOpen, clients, initialClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!denominazioneProgetto.trim()) {
      alert("La denominazione del progetto è obbligatoria.");
      return;
    }
    if (idCliente === -1 && clients.length > 0) { 
        alert("Seleziona un cliente.");
        return;
    }
     if (clients.length === 0 && idCliente === -1){
         alert("Nessun cliente disponibile. Aggiungi prima un cliente.");
         return;
    }
    if (!dataProg) {
        alert("La data di inizio è obbligatoria.");
        return;
    }
    const dataProgToSave = dateToDisplayString(parseModalDateString(dateToInputString(new Date(dataProg + "T00:00:00Z")))); 
    const dataFineProgettoToSave = dataFineProgetto ? dateToDisplayString(parseModalDateString(dateToInputString(new Date(dataFineProgetto + "T00:00:00Z")))) : null;


    if (!isValidDateDisplayString(dataProgToSave)) {
        alert("Formato Data Inizio non valido. Usare GG/MM/AA.");
        return;
    }
    if (dataFineProgettoToSave && !isValidDateDisplayString(dataFineProgettoToSave)) {
        alert("Formato Data Fine non valido. Usare GG/MM/AA o lasciare vuoto.");
        return;
    }

    onSave({
      denominazioneProgetto,
      idCliente,
      dataProg: dataProgToSave,
      dataFineProgetto: dataFineProgettoToSave,
      linkProgetto: linkProgetto.trim() || null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="projectModalTitle">
      <div className="bg-card p-6 w-11/12 max-w-xs sm:max-w-md md:max-w-lg border border-accent/50 max-h-[90vh] overflow-y-auto"> {/* Sharp edges from global styles */}
        <h3 id="projectModalTitle" className="text-xl font-semibold text-content mb-6">
          {projectToEdit ? 'Modifica Progetto' : 'Aggiungi Nuovo Progetto'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="denominazioneProgettoModal" className="block text-sm font-normal text-content/80 mb-1">Denominazione Progetto*</label>
            <input type="text" id="denominazioneProgettoModal" value={denominazioneProgetto} onChange={(e) => setDenominazioneProgetto(e.target.value)} required className="w-full"/> {/* Sharp from global */}
          </div>

          <div>
            <label htmlFor="idClienteModal" className="block text-sm font-normal text-content/80 mb-1">Cliente*</label>
            <select id="idClienteModal" value={idCliente} onChange={(e) => setIdCliente(Number(e.target.value))} required className="w-full"> {/* Sharp from global */}
              {clients.length === 0 && <option value="-1" disabled className="bg-card text-content">Nessun cliente</option>}
              {clients.sort((a,b) => a.denominazione.localeCompare(b.denominazione)).map(c => <option key={c.id} value={c.id} className="bg-card text-content">{c.denominazione}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dataProgModal" className="block text-sm font-normal text-content/80 mb-1">Data Inizio*</label>
              <input type="date" id="dataProgModal" value={dataProg} onChange={(e) => setDataProg(e.target.value)} required className="w-full"/> {/* Sharp from global */}
            </div>
            <div>
              <label htmlFor="dataFineProgettoModal" className="block text-sm font-normal text-content/80 mb-1">Data Fine (opzionale)</label>
              <input type="date" id="dataFineProgettoModal" value={dataFineProgetto} onChange={(e) => setDataFineProgetto(e.target.value)} className="w-full"/> {/* Sharp from global */}
            </div>
          </div>

          <div>
            <label htmlFor="linkProgettoModal" className="block text-sm font-normal text-content/80 mb-1">Link Progetto (opzionale)</label>
            <input type="url" id="linkProgettoModal" value={linkProgetto} onChange={(e) => setLinkProgetto(e.target.value)} placeholder="https://..." className="w-full"/> {/* Sharp from global */}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">Annulla</button> {/* Sharp from global */}
            <button type="submit" className="btn-primary"> {/* Sharp from global */}
              {projectToEdit ? 'Salva Modifiche' : 'Aggiungi Progetto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};