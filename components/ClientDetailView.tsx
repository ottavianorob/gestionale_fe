
import React, { useState, useEffect, useMemo } from 'react';
import type { Client, Project, ClientDetailViewProps, Invoice, InvoiceTimelineDataPoint, ActivityLogType } from '../types';
import { UserIcon, EditIcon, TrashIcon, ArrowLeftIcon, LinkIcon, PlusCircleIcon } from './icons';
import { SectionTitle } from './SectionTitle';
import { ClientInvoicesTimelineChart } from './charts/ClientInvoicesTimelineChart';
import clsx from 'clsx'; // Import clsx

const formatCurrency = (amount: number | undefined) => {
  if (typeof amount !== 'number') return 'N/A';
  return `€${amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date: Date | null): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

const parseClientDateString = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) {
      year += 2000;
    }
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone issues with date parts
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  console.warn(`Invalid client date string for parsing: ${dateStr}`);
  return null;
};

const isValidDateString = (dateStr: string | null | undefined): boolean => {
    if (!dateStr || dateStr.trim() === '') return true; // Optional fields are valid if empty
    return /^\d{2}\/\d{2}\/\d{2}$/.test(dateStr) && parseClientDateString(dateStr) !== null;
};


type ProjectFormState = Omit<Project, 'id' | 'idCliente'>;

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  client,
  projects,
  invoicesData,
  onGoBack,
  onEditClient,
  onDeleteClient,
  onAddProject,
  onEditProject,
  onDeleteProject,
  addActivityLogEntry
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const canAttemptLoad = client.immagineUrl && (client.immagineUrl.startsWith('data:image') || client.immagineUrl.startsWith('http'));

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectFormState, setProjectFormState] = useState<ProjectFormState>({
    denominazioneProgetto: '',
    dataProg: '',
    dataFineProgetto: null,
    linkProgetto: null,
  });

  useEffect(() => {
    setImageLoadError(false);
  }, [client.immagineUrl]);

  const clientInvoices = useMemo(() => {
    return invoicesData.filter(invoice => invoice.idCliente === client.id);
  }, [invoicesData, client.id]);

  const invoiceStats = useMemo(() => {
    if (clientInvoices.length === 0) {
      return {
        totalInvoiced: 0,
        numberOfInvoices: 0,
        firstInvoiceDate: null,
        lastInvoiceDate: null,
        averageInvoiceValue: 0,
      };
    }

    const total = clientInvoices.reduce((sum, inv) => sum + inv.importoFattura, 0);
    const dates = clientInvoices
      .map(inv => parseClientDateString(inv.dataFattura))
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      totalInvoiced: total,
      numberOfInvoices: clientInvoices.length,
      firstInvoiceDate: dates.length > 0 ? dates[0] : null,
      lastInvoiceDate: dates.length > 0 ? dates[dates.length - 1] : null,
      averageInvoiceValue: total / clientInvoices.length,
    };
  }, [clientInvoices]);

  const projectStats = useMemo(() => {
    const activeProjects = projects.filter(p => !p.dataFineProgetto || (parseClientDateString(p.dataFineProgetto) || new Date(0)) > new Date()).length;
    const completedProjects = projects.length - activeProjects;
    return {
      totalProjects: projects.length,
      activeProjects,
      completedProjects,
    };
  }, [projects]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const dateA = parseClientDateString(a.dataProg);
      const dateB = parseClientDateString(b.dataProg);
      if (dateA && dateB) return dateB.getTime() - dateA.getTime();
      if (dateA) return -1;
      if (dateB) return 1;
      return 0;
    });
  }, [projects]);

  const invoiceTimelineData = useMemo<InvoiceTimelineDataPoint[]>(() => {
    return clientInvoices
      .map(invoice => ({
        date: parseClientDateString(invoice.dataFattura),
        amount: invoice.importoFattura,
        invoiceNumber: invoice.numeroFattura,
      }))
      .filter(item => item.date !== null) 
      .sort((a, b) => (a.date as Date).getTime() - (b.date as Date).getTime()) as InvoiceTimelineDataPoint[];
  }, [clientInvoices]);

  // Project Modal Handlers
  const handleOpenProjectModal = (projectToEdit?: Project) => {
    if (projectToEdit) {
      setEditingProject(projectToEdit);
      setProjectFormState({
        denominazioneProgetto: projectToEdit.denominazioneProgetto,
        dataProg: projectToEdit.dataProg,
        dataFineProgetto: projectToEdit.dataFineProgetto,
        linkProgetto: projectToEdit.linkProgetto,
      });
    } else {
      setEditingProject(null);
      setProjectFormState({
        denominazioneProgetto: '',
        dataProg: '',
        dataFineProgetto: null,
        linkProgetto: null,
      });
    }
    setIsProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProjectFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProject = () => {
    if (!projectFormState.denominazioneProgetto.trim()) {
      alert("La denominazione del progetto è obbligatoria.");
      return;
    }
    if (!isValidDateString(projectFormState.dataProg)) {
        alert("Formato Data Inizio non valido. Usare GG/MM/AA.");
        return;
    }
     if (!isValidDateString(projectFormState.dataFineProgetto)) {
        alert("Formato Data Fine non valido. Usare GG/MM/AA o lasciare vuoto.");
        return;
    }


    const projectDataToSave = { ...projectFormState, idCliente: client.id };

    if (editingProject) {
      onEditProject(editingProject.id, projectDataToSave);
      addActivityLogEntry('PROJECT_EDIT', `Progetto "${projectDataToSave.denominazioneProgetto}" modificato per cliente ${client.denominazione}.`, { projectId: editingProject.id });
    } else {
      onAddProject(projectDataToSave);
      addActivityLogEntry('PROJECT_ADD', `Nuovo progetto "${projectDataToSave.denominazioneProgetto}" aggiunto per cliente ${client.denominazione}.`, { projectData: projectDataToSave });
    }
    handleCloseProjectModal();
  };

  const handleDeleteProjectRequest = (project: Project) => {
    if (window.confirm(`Sei sicuro di voler eliminare il progetto "${project.denominazioneProgetto}"?`)) {
      onDeleteProject(project.id);
      addActivityLogEntry('PROJECT_DELETE', `Progetto "${project.denominazioneProgetto}" (ID: ${project.id}) eliminato per cliente ${client.denominazione}.`);
    }
  };


  return (
    <div className="h-full flex flex-col text-content">
      {/* Header */}
      <div className="flex items-start mb-6 pb-4 border-b border-content/20">
        <button
          onClick={onGoBack}
          className="btn-icon p-2 mr-4 text-content/80 hover:text-accent flex-shrink-0"
          aria-label="Torna alla lista clienti"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow overflow-hidden">
          <h2 className="text-2xl font-semibold text-accent truncate" title={client.denominazione}>{client.denominazione}</h2>
          <p className="text-sm text-content/80 mt-0.5">P.IVA: {client.partitaIva}</p>
        </div>
        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
          <button onClick={() => onEditClient(client)} className="btn-icon !p-1.5 sm:!p-2" title="Modifica Cliente"><EditIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          <button onClick={() => onDeleteClient(client.id, client.denominazione)} className="btn-icon !p-1.5 sm:!p-2 !text-danger hover:!bg-danger/20" title="Elimina Cliente"><TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary-light)' }}>
        
        {/* Client Info and Image */}
        <div className="bg-card p-4 sm:p-6 border border-content/10 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 overflow-hidden bg-primary-light border-2 border-content/20 flex-shrink-0 flex items-center justify-center"> {/* Square image placeholder */}
            {canAttemptLoad && !imageLoadError ? (
              <img src={client.immagineUrl!} alt={`Immagine profilo di ${client.denominazione}`} className="w-full h-full object-cover" onError={() => setImageLoadError(true)} />
            ) : (
              <UserIcon className="w-12 h-12 sm:w-16 sm:h-16 text-content/50" />
            )}
          </div>
          <div className="text-sm space-y-1">
            <p><strong className="text-content/70">Indirizzo:</strong> {client.indirizzo1}</p>
            <p><strong className="text-content/70">CAP, Città:</strong> {client.indirizzo2}</p>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-card p-4 border border-content/10"> {/* Sharp edges */}
            <h4 className="text-sm font-semibold text-content/70 uppercase tracking-wider mb-2">Fatturato</h4>
            <p className="text-3xl font-bold text-accent mb-1">{formatCurrency(invoiceStats.totalInvoiced)}</p>
            <div className="text-xs text-content/80 space-y-0.5">
              <p>Numero Fatture: {invoiceStats.numberOfInvoices}</p>
              <p>Prima Fattura: {formatDate(invoiceStats.firstInvoiceDate)}</p>
              <p>Ultima Fattura: {formatDate(invoiceStats.lastInvoiceDate)}</p>
              <p>Valore Medio Fattura: {formatCurrency(invoiceStats.averageInvoiceValue)}</p>
            </div>
          </div>
          <div className="bg-card p-4 border border-content/10"> {/* Sharp edges */}
            <h4 className="text-sm font-semibold text-content/70 uppercase tracking-wider mb-2">Progetti</h4>
            <p className="text-3xl font-bold text-accent mb-1">{projectStats.totalProjects}</p>
            <div className="text-xs text-content/80 space-y-0.5">
              <p>Progetti Attivi: {projectStats.activeProjects}</p>
              <p>Progetti Completati: {projectStats.completedProjects}</p>
            </div>
          </div>
        </div>

        {/* Invoice Timeline Chart */}
        {invoiceTimelineData.length > 0 && (
          <div className="bg-card p-3 sm:p-4 border border-content/10 h-64"> {/* Sharp edges */}
            <h4 className="text-sm font-semibold text-content/70 uppercase tracking-wider mb-2">Timeline Fatture Cliente</h4>
            <ClientInvoicesTimelineChart data={invoiceTimelineData} />
          </div>
        )}
        
        {/* Projects List */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <SectionTitle className="!text-lg !mb-0">Progetti Associati</SectionTitle>
            <button onClick={() => handleOpenProjectModal()} className="btn-primary flex items-center text-sm !px-3 !py-1.5">
              <PlusCircleIcon className="w-4 h-4 mr-1.5" /> Aggiungi Progetto
            </button>
          </div>
          {sortedProjects.length > 0 ? (
            <div className="space-y-3">
              {sortedProjects.map(proj => {
                 const isProjOngoing = !proj.dataFineProgetto || (parseClientDateString(proj.dataFineProgetto) || new Date(0)) > new Date();
                 return (
                  <div key={proj.id} className="bg-card p-3 sm:p-4 border border-content/10 flex flex-col sm:flex-row justify-between items-start gap-2"> {/* Sharp edges */}
                    <div>
                      <h5 className="font-semibold text-content/95 text-sm sm:text-base">{proj.denominazioneProgetto}</h5>
                      <p className="text-xs text-content/70">
                        Da: {formatDate(parseClientDateString(proj.dataProg))}  A: {proj.dataFineProgetto ? formatDate(parseClientDateString(proj.dataFineProgetto)) : <span className="italic text-green-400">In Corso</span>}
                      </p>
                    </div>
                    <div className="flex space-x-1 sm:space-x-2 mt-2 sm:mt-0 flex-shrink-0">
                      {proj.linkProgetto && <a href={proj.linkProgetto} target="_blank" rel="noopener noreferrer" className="btn-icon !p-1" title="Link Progetto"><LinkIcon className="w-4 h-4" /></a>}
                      <button onClick={() => handleOpenProjectModal(proj)} className="btn-icon !p-1" title="Modifica Progetto"><EditIcon className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteProjectRequest(proj)} className="btn-icon !p-1 !text-danger hover:!bg-danger/20" title="Elimina Progetto"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-content/70 text-center py-4 border border-dashed border-content/20 bg-primary-light">Nessun progetto associato a questo cliente.</p> /* Sharp edges */
          )}
        </div>

      </div>

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[150] p-4" role="dialog" aria-modal="true" aria-labelledby="clientProjectModalTitle">
          <div className="bg-card p-6 w-full max-w-lg border border-accent/50 max-h-[90vh] overflow-y-auto"> {/* Sharp edges */}
            <h3 id="clientProjectModalTitle" className="text-xl font-semibold text-content mb-6">
              {editingProject ? 'Modifica Progetto per ' + client.denominazione : 'Aggiungi Nuovo Progetto per ' + client.denominazione}
            </h3>
            <form onSubmit={(e) => {e.preventDefault(); handleSaveProject(); }} className="space-y-4">
              <div>
                <label htmlFor="denominazioneProgetto" className="block text-sm font-normal text-content/80 mb-1">Denominazione Progetto*</label>
                <input type="text" name="denominazioneProgetto" id="denominazioneProgetto" value={projectFormState.denominazioneProgetto} onChange={handleProjectFormChange} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dataProg" className="block text-sm font-normal text-content/80 mb-1">Data Inizio*</label>
                  <input type="text" name="dataProg" id="dataProg" value={projectFormState.dataProg} onChange={handleProjectFormChange} placeholder="GG/MM/AA" required />
                </div>
                <div>
                  <label htmlFor="dataFineProgetto" className="block text-sm font-normal text-content/80 mb-1">Data Fine (opzionale)</label>
                  <input type="text" name="dataFineProgetto" id="dataFineProgetto" value={projectFormState.dataFineProgetto || ''} onChange={handleProjectFormChange} placeholder="GG/MM/AA" />
                </div>
              </div>
              <div>
                <label htmlFor="linkProgetto" className="block text-sm font-normal text-content/80 mb-1">Link Progetto (opzionale)</label>
                <input type="url" name="linkProgetto" id="linkProgetto" value={projectFormState.linkProgetto || ''} onChange={handleProjectFormChange} placeholder="https://..." />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={handleCloseProjectModal} className="btn-secondary">Annulla</button>
                <button type="submit" className="btn-primary">
                  {editingProject ? 'Salva Modifiche' : 'Aggiungi Progetto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
