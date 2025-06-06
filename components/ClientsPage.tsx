
import React, { useState, useMemo, useCallback } from 'react';
import type { Client, ClientsPageProps, Invoice, ActivityLogType, Project } from '../types';
import { SectionTitle } from './SectionTitle';
import { PlusCircleIcon } from './icons';
import { ClientCard } from './ClientCard';
import { ClientDetailView } from './ClientDetailView';

type ClientEditFormState = Omit<Client, 'id'>;

export const ClientsPage: React.FC<ClientsPageProps> = ({
  clients,
  invoicesData,
  projectsData,
  onAddClient,
  onEditClient,
  onDeleteClient,
  addActivityLogEntry,
  onAddProject,
  onEditProject,
  onDeleteProject,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editFormState, setEditFormState] = useState<ClientEditFormState>({
    denominazione: '',
    partitaIva: '',
    indirizzo1: '',
    indirizzo2: '',
    immagineUrl: null,
  });

  const [detailedClient, setDetailedClient] = useState<Client | null>(null);

  const clientTotalInvoiced = useMemo(() => {
    const totals = new Map<number, number>();
    clients.forEach(client => {
      const clientInvoices = invoicesData.filter(invoice => invoice.idCliente === client.id);
      const total = clientInvoices.reduce((sum, invoice) => sum + invoice.importoFattura, 0);
      totals.set(client.id, total);
    });
    return totals;
  }, [clients, invoicesData]);

  const handleAdd = () => {
    const newClientName = prompt("Inserisci nome nuovo cliente:");
    if (newClientName) {
      const mockNewClient: Omit<Client, 'id'> = {
        denominazione: newClientName,
        partitaIva: "00000000000", 
        indirizzo1: "Via Nuova", 
        indirizzo2: "Città", 
        immagineUrl: null
      };
      onAddClient(mockNewClient);
    }
  };

  const handleEditRequest = useCallback((clientToEdit: Client) => {
    setEditingClient(clientToEdit);
    setEditFormState({
      denominazione: clientToEdit.denominazione,
      partitaIva: clientToEdit.partitaIva,
      indirizzo1: clientToEdit.indirizzo1,
      indirizzo2: clientToEdit.indirizzo2,
      immagineUrl: clientToEdit.immagineUrl,
    });
    setIsEditModalOpen(true);
    addActivityLogEntry('CLIENT_EDIT', `Apertura modale modifica per: ${clientToEdit.denominazione}`);
  }, [addActivityLogEntry]);

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (e.target.type === 'file') return; 

    setEditFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormState(prevState => ({
          ...prevState,
          immagineUrl: reader.result as string,
        }));
        addActivityLogEntry('CLIENT_EDIT', `Nuova immagine (${file.name}) selezionata (in anteprima) per cliente (ID: ${editingClient?.id}).`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = () => {
    if (editingClient && editFormState.denominazione.trim() !== '') {
      onEditClient(editingClient.id, editFormState); 
      
      if (detailedClient && detailedClient.id === editingClient.id) {
        setDetailedClient(prev => prev ? { ...prev, ...editFormState } : null);
      }

      setIsEditModalOpen(false);
      setEditingClient(null);
    } else if (editingClient) {
      alert("La denominazione non può essere vuota.");
      addActivityLogEntry('CLIENT_EDIT', `Tentativo di modifica cliente ID: ${editingClient.id} fallito (denominazione vuota).`);
    }
  };

  const handleDeleteRequest = useCallback((clientId: number, clientName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il cliente "${clientName}"? L'azione è irreversibile.`)) {
      onDeleteClient(clientId);
      if (detailedClient && detailedClient.id === clientId) {
        setDetailedClient(null); 
      }
    }
  }, [onDeleteClient, detailedClient, addActivityLogEntry]);

  const handleShowClientDetail = useCallback((client: Client) => {
    setDetailedClient(client);
    addActivityLogEntry('LAYOUT_CHANGE', `Visualizzazione dettagli per cliente: ${client.denominazione}`);
  }, [addActivityLogEntry]);

  const handleCloseClientDetail = useCallback(() => {
    setDetailedClient(null);
    addActivityLogEntry('LAYOUT_CHANGE', `Chiusura vista dettagli cliente.`);
  }, [addActivityLogEntry]);


  return (
    <>
      {detailedClient ? (
        <div className="h-full flex flex-col">
          <ClientDetailView
            client={detailedClient}
            projects={projectsData.filter(p => p.idCliente === detailedClient.id)}
            invoicesData={invoicesData}
            onGoBack={handleCloseClientDetail}
            onEditClient={handleEditRequest}
            onDeleteClient={handleDeleteRequest}
            onAddProject={onAddProject}
            onEditProject={onEditProject}
            onDeleteProject={onDeleteProject}
            addActivityLogEntry={addActivityLogEntry}
          />
        </div>
      ) : (
        <div className="h-full flex flex-col">
          <div className="sticky top-0 z-10 bg-primary py-3">
            <SectionTitle className="!mb-3">Gestione Clienti</SectionTitle>
            <div className="flex flex-wrap gap-3">
                <button
                onClick={handleAdd}
                className="btn-primary flex items-center text-sm"
                >
                <PlusCircleIcon className="w-5 h-5 mr-2" /> Aggiungi Cliente
                </button>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {clients.map(client => (
                <ClientCard
                    key={client.id}
                    client={client}
                    totalInvoiced={clientTotalInvoiced.get(client.id) || 0}
                    onShowDetail={handleShowClientDetail}
                />
                ))}
                {clients.length === 0 && (
                    <p className="col-span-full text-center text-content/70 py-10">Nessun cliente trovato.</p>
                )}
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[160] p-4" role="dialog" aria-modal="true" aria-labelledby="clientModalTitle">
          <div className="bg-card p-6 w-11/12 max-w-xs sm:max-w-md md:max-w-lg border border-accent/50 max-h-[90vh] overflow-y-auto">
            <h3 id="clientModalTitle" className="text-xl font-semibold text-content mb-6">
              {`Modifica Cliente: ${editingClient.denominazione}`}
            </h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-4">
              <div>
                <label htmlFor="denominazione" className="block text-sm font-normal text-content/80 mb-1">Denominazione*</label>
                <input type="text" name="denominazione" id="denominazione" value={editFormState.denominazione} onChange={handleEditFormChange} required />
              </div>
              <div>
                <label htmlFor="partitaIva" className="block text-sm font-normal text-content/80 mb-1">Partita IVA</label>
                <input type="text" name="partitaIva" id="partitaIva" value={editFormState.partitaIva} onChange={handleEditFormChange} />
              </div>
              <div>
                <label htmlFor="indirizzo1" className="block text-sm font-normal text-content/80 mb-1">Indirizzo 1</label>
                <input type="text" name="indirizzo1" id="indirizzo1" value={editFormState.indirizzo1} onChange={handleEditFormChange} />
              </div>
              <div>
                <label htmlFor="indirizzo2" className="block text-sm font-normal text-content/80 mb-1">Indirizzo 2 (CAP, Città)</label>
                <input type="text" name="indirizzo2" id="indirizzo2" value={editFormState.indirizzo2} onChange={handleEditFormChange} />
              </div>
              <div>
                  <label htmlFor="immagineUrl" className="block text-sm font-normal text-content/80 mb-1">URL Immagine / Carica File</label>
                  <div className="flex items-center space-x-2">
                      <input 
                          type="text" 
                          name="immagineUrl" 
                          id="immagineUrl" 
                          value={editFormState.immagineUrl || ''} 
                          onChange={handleEditFormChange} 
                          placeholder="http:// o data:image/..."
                          className="flex-grow"
                      />
                      <input 
                          type="file" 
                          id="imageUpload" 
                          accept="image/*"
                          onChange={handleImageFileChange} 
                          className="hidden" 
                      />
                       <label 
                          htmlFor="imageUpload" 
                          className="btn-secondary cursor-pointer !px-3 !py-2.5"
                          title="Carica immagine"
                      >
                          Sfoglia...
                      </label>
                  </div>
                  {editFormState.immagineUrl && (
                      <div className="mt-2">
                          <img src={editFormState.immagineUrl} alt="Anteprima" className="max-h-20 border border-content/20"/>
                      </div>
                  )}
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditingClient(null); addActivityLogEntry('CLIENT_EDIT', `Modifica cliente ${editingClient.denominazione} annullata.`);}} className="btn-secondary">Annulla</button>
                <button type="submit" className="btn-primary">
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};