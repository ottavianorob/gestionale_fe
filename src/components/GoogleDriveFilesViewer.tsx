

import React, { useState, useEffect, useCallback } from 'react';
import type { GoogleDriveFile, GoogleDriveUser, GoogleDriveFilesViewerProps, ActivityLogType } from '../types';
import { LinkIcon, FileIcon as GenericFileIcon, FolderIcon, GoogleDriveIcon } from './icons'; // Import GoogleDriveIcon
import { SectionTitle } from './SectionTitle';

// Helper function to safely join URL paths
const joinUrlPath = (base: string, path: string): string => {
  if (!base || typeof base !== 'string' || !base.trim().startsWith('http')) {
    console.error(
      "Base URL for joinUrlPath is invalid (empty, not a string, or missing HTTP/HTTPS scheme). Backend URL might be misconfigured.",
      `Base: "${base}"`
    );
    return `INVALID_BACKEND_URL_SCHEME_OR_EMPTY/${path.replace(/^\/+/, '')}`;
  }
  try {
    const baseUrlEnsuredSlash = base.endsWith('/') ? base : base + '/';
    const relativePath = path.startsWith('/') ? path.substring(1) : path;
    const fullUrl = new URL(relativePath, baseUrlEnsuredSlash);
    return fullUrl.toString();
  } catch (e: any) {
    console.error("Error constructing URL in joinUrlPath:", e.message, "Base:", base, "Path:", path);
    return `URL_CONSTRUCTION_ERROR_FOR_FETCH/${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
};


export const GoogleDriveFilesViewer: React.FC<GoogleDriveFilesViewerProps> = ({ 
    addActivityLogEntry, 
    backendUrl, 
    initialFolderIdOrUrl,
    isGoogleLoggedIn,      // New prop
    googleDriveUser,       // New prop
    googleAuthError,       // New prop for auth errors from App.tsx
    onTriggerAuthCheck     // New prop to trigger auth check in App.tsx
}) => {
  const [folderIdInput, setFolderIdInput] = useState<string>(initialFolderIdOrUrl || '');
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null); // Specific error for fetching files

  useEffect(() => {
     // If an initial folder ID is provided, set it. Otherwise, try localStorage.
    if (initialFolderIdOrUrl) {
        setFolderIdInput(initialFolderIdOrUrl);
    } else {
        const savedFolderId = localStorage.getItem('googleDriveLastFolderId');
        if (savedFolderId) {
            setFolderIdInput(savedFolderId);
        }
    }
  }, [initialFolderIdOrUrl]);

  // Effect to automatically fetch files if logged in and folderIdInput is set (e.g., on initial load or when folderIdInput changes programmatically)
  useEffect(() => {
    if (isGoogleLoggedIn && folderIdInput && (!files.length || folderIdInput !== localStorage.getItem('googleDriveLastLoadedFolderId'))) {
      handleFetchFiles(folderIdInput);
    }
    // Clear files if logged out
    if (!isGoogleLoggedIn && files.length > 0) {
        setFiles([]);
        setFetchError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoogleLoggedIn, folderIdInput, initialFolderIdOrUrl]); // Dependencies: isGoogleLoggedIn and folderIdInput for auto-fetch


  const extractFolderId = (input: string): string => {
    if (!input) return '';
    if (!input.includes('drive.google.com')) {
      return input.trim(); 
    }
    try {
      const url = new URL(input);
      const pathParts = url.pathname.split('/');
      let idIndex = pathParts.indexOf('folders');
      if (idIndex !== -1 && pathParts.length > idIndex + 1) {
        return pathParts[idIndex + 1].split('?')[0];
      }
      const uIndex = pathParts.indexOf('u');
      if (uIndex !== -1 && uIndex + 2 < pathParts.length && pathParts[uIndex+2] === 'folders' && uIndex + 3 < pathParts.length) {
        return pathParts[uIndex+3].split('?')[0];
      }
    } catch (e) {
      console.warn("Could not parse URL, using input as is:", input);
    }
    return input.trim(); 
  };

  const handleFetchFiles = useCallback(async (folderToFetch?: string) => {
    const targetFolder = folderToFetch || folderIdInput;
    const currentFolderId = extractFolderId(targetFolder);

    setFetchError(null); // Clear previous fetch errors

    if (!isGoogleLoggedIn) {
        setFetchError('Autenticazione Google richiesta. Effettua il login dalla pagina Impostazioni.');
        return;
    }
    if (!backendUrl || !backendUrl.startsWith('http') || backendUrl.includes('localhost') || backendUrl.includes('BACKEND_URL_NOT_CONFIGURED') || backendUrl.includes('INVALID_BACKEND_URL')) {
        let msg = "L'URL del backend non è configurato o non è valido. Configuralo nelle Impostazioni.";
        if (backendUrl && backendUrl.includes('localhost')) msg = `L'URL del backend (${backendUrl}) punta a localhost.`;
        setFetchError(msg);
        return;
    }
    if (!currentFolderId.trim()) {
      setFetchError('Per favore, inserisci un ID cartella Google Drive valido o un link alla cartella.');
      return;
    }

    setIsLoading(true);
    setFiles([]);
    addActivityLogEntry('GOOGLE_DRIVE_FETCH', `Richiesta file per cartella ID: ${currentFolderId}`);
    
    if (!initialFolderIdOrUrl) { // Only save to localStorage if not an initial load from prop
        localStorage.setItem('googleDriveLastFolderId', targetFolder); 
    }


    try {
      const filesApiUrl = joinUrlPath(backendUrl, `/api/files?folderId=${encodeURIComponent(currentFolderId.trim())}`);
      const response = await fetch(filesApiUrl, { credentials: 'include' });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Errore sconosciuto dal server."}));
        let specificError = errorData.error || `Errore ${response.status} nel recupero dei file.`;
        if (response.status === 401) { 
            specificError = errorData.error || 'Autenticazione fallita o sessione scaduta. Prova a fare login di nuovo.';
            addActivityLogEntry('GOOGLE_AUTH', `Autenticazione fallita durante recupero file: ${errorData.error}.`);
            onTriggerAuthCheck(); // Trigger re-check which will update global state
        } else {
            addActivityLogEntry('GOOGLE_DRIVE_FETCH', `Errore ${response.status} recupero file: ${errorData.error}.`);
        }
        setFetchError(specificError);
        throw new Error(specificError);
      }
      const fetchedFiles: GoogleDriveFile[] = await response.json();
      setFiles(fetchedFiles);
      localStorage.setItem('googleDriveLastLoadedFolderId', targetFolder);
      if (fetchedFiles.length === 0) {
        setFetchError('Nessun file trovato nella cartella specificata. Potrebbe essere vuota, non esistere, o potresti non avere i permessi necessari.');
      }
      addActivityLogEntry('GOOGLE_DRIVE_FETCH', `Recuperati ${fetchedFiles.length} file dalla cartella ID: ${currentFolderId}.`);
    } catch (err: any) {
      console.error("Error fetching files:", err);
      if (!fetchError && err.message && !err.message.includes('HTTP error')) { 
        setFetchError(`Errore nel recupero dei file: ${err.message}`);
      }
      if (err instanceof TypeError && (err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("load failed")) ) {
        setFetchError(`Errore di connessione al server backend (${backendUrl}). Assicurati che sia in esecuzione, accessibile e che la configurazione CORS del backend sia corretta per ${window.location.origin}. Controlla la console del server backend per eventuali errori.`);
        addActivityLogEntry('GOOGLE_DRIVE_FETCH', `Errore connessione backend recupero file: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [addActivityLogEntry, backendUrl, folderIdInput, initialFolderIdOrUrl, isGoogleLoggedIn, onTriggerAuthCheck, fetchError]);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('it-IT', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).replace('.', '');
  };
  
  // Display auth error from App.tsx if present and no specific fetch error
  const displayError = fetchError || googleAuthError;

  return (
    <div className="p-4 md:p-6 rounded-lg h-full flex flex-col text-content">
      {!initialFolderIdOrUrl && <SectionTitle>Google Drive Files</SectionTitle>}
      
      {!isGoogleLoggedIn ? (
        <div className="flex flex-col items-center justify-center flex-grow">
          {displayError && <p className="mb-4 text-sm text-danger bg-danger/20 p-2.5 rounded-md text-center" role="alert">{displayError}</p>}
          <GoogleDriveIcon className="w-12 h-12 text-content/50 mb-4" />
          <p className="mb-2 text-content/80 text-center text-sm">
            Per visualizzare i file, autenticati con Google.
          </p>
          <p className="text-xs text-content/60 text-center">
            Puoi effettuare il login dalla pagina "Impostazioni".
          </p>
        </div>
      ) : (
        <>
          {/* Input form only if not an initialFolderIdOrUrl (i.e., used as a general widget) */}
          {!initialFolderIdOrUrl && (
            <form onSubmit={(e) => { e.preventDefault(); handleFetchFiles(); }} className="mb-4 flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <input
                type="text"
                value={folderIdInput}
                onChange={(e) => { setFolderIdInput(e.target.value); setFetchError(null); }}
                placeholder="ID Cartella Google Drive o link completo"
                className="flex-grow" // Rely on global styles
                aria-label="ID Cartella Google Drive o link completo alla cartella"
                aria-describedby="folderIdHelpWidget"
                disabled={isLoading}
              />
              <p id="folderIdHelpWidget" className="sr-only">Inserisci l'ID di una cartella Google Drive o il link completo ad essa.</p>
              <button
                type="submit"
                disabled={isLoading || !folderIdInput.trim()}
                className="btn-primary flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && !files.length ? 'Caricamento...' : 'Mostra File'}
              </button>
            </form>
          )}

          {displayError && <p className="my-3 text-sm text-danger bg-danger/20 p-2.5 rounded-md text-center flex-shrink-0" role="alert">{displayError}</p>}

          {isLoading && files.length === 0 && <p className="text-content/70 text-center py-5 animate-pulse flex-shrink-0">Recupero file in corso...</p>}
          
          {files.length > 0 && (
            <div className="flex-grow overflow-y-auto space-y-1.5 pr-1 -mr-1 mt-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-card)' }} role="list" aria-label="Elenco dei file nella cartella Google Drive">
              {files.map(file => (
                <div key={file.id} className="flex items-center p-2 bg-primary rounded-md hover:bg-primary/70 transition-colors group" role="listitem">
                  {file.mimeType === 'application/vnd.google-apps.folder' ? (
                    <FolderIcon className="w-5 h-5 mr-2.5 text-accent flex-shrink-0" />
                  ) : (
                     file.iconLink ? 
                     <img src={file.iconLink} alt="" aria-hidden="true" className="w-5 h-5 mr-2.5 flex-shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} /> 
                     : <GenericFileIcon className="w-5 h-5 mr-2.5 text-content/70 flex-shrink-0" />
                  )}
                  <GenericFileIcon className={`w-5 h-5 mr-2.5 text-content/70 flex-shrink-0 ${file.iconLink ? 'hidden' : ''}`} />
                  
                  <div className="flex-grow overflow-hidden mr-2.5">
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-content hover:text-accent hover:underline focus:text-accent focus:underline truncate block"
                      title={`Apri ${file.name} su Google Drive`}
                    >
                      {file.name}
                    </a>
                    <p className="text-xs text-content/60 truncate" title={file.mimeType}>{file.mimeType}</p>
                  </div>
                  <p className="text-xs text-content/70 whitespace-nowrap flex-shrink-0" title={`Ultima modifica: ${formatDate(file.modifiedTime)}`}>{formatDate(file.modifiedTime)}</p>
                </div>
              ))}
            </div>
          )}
          {files.length === 0 && !isLoading && !displayError && folderIdInput && !fetchError?.includes("Nessun file trovato") && !fetchError?.includes("cartella è vuota") && (
             <p className="text-content/70 text-sm text-center py-5 flex-shrink-0">Inserisci un ID cartella Google Drive valido e clicca "Mostra File" per visualizzare il contenuto.</p>
          )}
        </>
      )}
    </div>
  );
};
