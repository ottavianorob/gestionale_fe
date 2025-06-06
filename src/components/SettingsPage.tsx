
import React, { useState, useEffect, useRef } from 'react';
import { SectionTitle } from './SectionTitle';
import { CogIcon, DownloadIcon, DocumentTextIcon, UploadIcon, GoogleDriveIcon } from './icons'; 
import type { SettingsPageProps, ActivityLogType } from '../types';
import clsx from 'clsx';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentEffectiveBackendUrl,
  addActivityLogEntry,
  onExportJSON,
  onImportJSON, 
  onExportCSV,
  isGoogleLoggedIn,
  googleDriveUser,
  onGoogleLogin,
  onGoogleLogout,
  googleAuthIsLoading,
  googleAuthError,
  onTriggerAuthCheck,
  isGoogleDriveFeatureEnabled 
}) => {
  const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [frontendOrigin, setFrontendOrigin] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFrontendOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const urlIsLocalhost = currentEffectiveBackendUrl.includes('localhost') || currentEffectiveBackendUrl.includes('127.0.0.1');
    const urlIsEmptyOrPlaceholder = !currentEffectiveBackendUrl || 
                                    currentEffectiveBackendUrl.includes("INVALID_BACKEND_URL") || 
                                    currentEffectiveBackendUrl.includes("BACKEND_URL_NOT_CONFIGURED") ||
                                    currentEffectiveBackendUrl.includes("URL_CONSTRUCTION_ERROR");

    if (urlIsEmptyOrPlaceholder) {
        setWarningMessage("L'URL del backend non è configurato o sembra non essere valido. Alcune funzionalità (es. Google Drive) potrebbero non funzionare. Controlla le variabili d'ambiente VITE_REACT_APP_BACKEND_URL o VITE_BACKEND_URL.");
        setIsWarningVisible(true);
    } else if (urlIsLocalhost && isGoogleDriveFeatureEnabled) { // Only show localhost warning if feature is meant to be active
      setWarningMessage(`L'URL del backend (${currentEffectiveBackendUrl}) sembra puntare a un server locale (localhost). Per il corretto funzionamento dell'autenticazione Google e di altre integrazioni online, è necessario un URL backend pubblico e accessibile da internet (es. https://tuo-backend.onrender.com).`);
      setIsWarningVisible(true);
    } else {
      setIsWarningVisible(false);
      setWarningMessage('');
    }
  }, [currentEffectiveBackendUrl, isGoogleDriveFeatureEnabled]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImportFile(event.target.files[0]);
      setImportStatus(null); // Reset previous message
    }
  };

  const handleImportClick = () => {
    if (importFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonString = e.target?.result as string;
          const result = onImportJSON(jsonString);
          setImportStatus({ message: result.message, type: result.success ? 'success' : 'error' });
          addActivityLogEntry('DATA_IMPORT', `Tentativo importazione file ${importFile.name}: ${result.message}`);
        } catch (error: any) {
          setImportStatus({ message: `Errore durante la lettura del file: ${error.message}`, type: 'error' });
          addActivityLogEntry('DATA_IMPORT', `Errore lettura file ${importFile.name} per importazione: ${error.message}`);
        }
        setImportFile(null); // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.onerror = () => {
        setImportStatus({ message: 'Errore durante la lettura del file.', type: 'error' });
        addActivityLogEntry('DATA_IMPORT', `Errore I/O lettura file ${importFile.name} per importazione.`);
      }
      reader.readAsText(importFile);
    } else {
      setImportStatus({ message: 'Nessun file selezionato per l\'importazione.', type: 'error' });
    }
  };

  const backendUrlConfigText = `
Per configurare l'URL del backend, imposta una delle seguenti variabili d'ambiente prima di avviare l'applicazione (VITE_REACT_APP_BACKEND_URL ha la precedenza):

1. VITE_REACT_APP_BACKEND_URL="https://iltuoserver.com"
   (Metodo standard per app Create React App o simili)

2. VITE_BACKEND_URL="https://iltuoserver.com"
   (Metodo generico per Vite)

Se nessuna di queste è impostata, verrà utilizzato un URL di fallback predefinito, che potrebbe non essere quello desiderato.

NOTA IMPORTANTE PER GOOGLE AUTH:
Se il backend è su un servizio come Render.com, l'URL del backend DEVE essere pubblico (non localhost). Inoltre, il server backend DEVE essere configurato per accettare richieste CORS dal seguente URL frontend:
${frontendOrigin || 'NON ANCORA DISPONIBILE (RICARICA LA PAGINA SE NECESSARIO)'}
Su Render, questo di solito si fa impostando una variabile d'ambiente FRONTEND_URL sul servizio backend a questo valore.
`;

  const renderCriticalAuthErrorBanner = () => {
    if (!isGoogleDriveFeatureEnabled) return null; // Do not show if feature is globally disabled
    
    const isCriticalError = googleAuthError && (
        googleAuthError.includes("Errore di connessione al server backend") || 
        googleAuthError.includes("URL Backend non valido") || 
        googleAuthError.includes("URL del backend fornito") ||
        googleAuthError.includes("malformato o incompleto") ||
        googleAuthError.includes("ERRORE DI CONNESSIONE O CORS")
    );

    if (!isCriticalError) return null;

    return (
      <div 
        className="fixed top-0 left-0 right-0 bg-danger text-content p-3 sm:p-4 z-[200] shadow-lg text-xs max-h-[40vh] overflow-y-auto" 
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-content) var(--color-danger)'}} 
        role="alert"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-base sm:text-lg">Errore di Configurazione o Connessione Backend (Google Drive)</h4>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold">Si è verificato un errore critico che impedisce il funzionamento di Google Drive:</p>
            <p className="bg-primary/30 p-2 rounded font-mono text-[11px] break-words">{googleAuthError}</p>
            <p>Questo solitamente indica un problema con:</p>
            <ul className="list-disc list-inside text-[11px] space-y-1 pl-2">
              <li><strong>L'URL del Backend:</strong> Assicurati che l'URL <code className="bg-primary/30 px-1 py-0.5 rounded text-[10px]">{currentEffectiveBackendUrl}</code> sia corretto, pubblico, e che il server sia in esecuzione.</li>
              <li><strong>Configurazione CORS sul Backend:</strong> Il server backend deve permettere richieste dall'origine del frontend (<code className="bg-primary/30 px-1 py-0.5 rounded text-[10px]">{frontendOrigin || 'Ricarica per vedere'}</code>). Su servizi come Render, questo si fa impostando la variabile d'ambiente <code className="bg-primary/30 px-1 py-0.5 rounded text-[10px]">FRONTEND_URL</code> sul backend a questo valore.</li>
              <li><strong>Variabili d'Ambiente Google OAuth sul Backend:</strong> Verifica che <code className="bg-primary/30 px-1 py-0.5 rounded text-[10px]">GOOGLE_CLIENT_ID</code>, <code className="bg-primary/30 px-1 py-0.5 rounded text-[10px]">GOOGLE_CLIENT_SECRET</code>, e <code className="bg-primary/30 px-1 py-0.5 rounded text-[10px]">GOOGLE_REDIRECT_URI</code> siano correttamente impostate sul server backend.</li>
            </ul>
            <p className="mt-2">Consulta i log del browser (scheda Rete) e i log del server backend per dettagli specifici. Potrebbe essere necessario aggiornare la configurazione del backend.</p>
             <button 
                onClick={() => onTriggerAuthCheck()} 
                className="mt-2 text-xs bg-primary hover:bg-primary-light px-2 py-1 rounded border border-content/50"
             >
                Riprova a verificare lo stato dell'autenticazione
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="h-full flex flex-col text-content p-4 md:p-6 space-y-6 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: `var(--color-accent) var(--color-primary-light)`}}>
      {renderCriticalAuthErrorBanner()}
      <SectionTitle>Impostazioni Applicazione</SectionTitle>

      {isWarningVisible && (
        <div className="bg-warning/20 border border-warning text-warning-content p-3 rounded-md text-sm" role="alert">
          <p className="font-semibold mb-1">Avviso Configurazione Backend:</p>
          <p className="whitespace-pre-wrap text-xs">{warningMessage}</p>
        </div>
      )}

      <section className="bg-card p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-accent mb-3 flex items-center">
          <CogIcon className="w-5 h-5 mr-2" /> Informazioni Tecniche
        </h3>
        <div className="text-xs space-y-1 text-content/80">
          <p><strong>URL Backend Effettivo:</strong> <code className="text-accent/90 bg-primary px-1 rounded text-[11px]">{currentEffectiveBackendUrl}</code></p>
          <p><strong>Origine Frontend:</strong> <code className="text-accent/90 bg-primary px-1 rounded text-[11px]">{frontendOrigin || 'Non disponibile'}</code></p>
          <details className="text-xs mt-2 cursor-pointer">
            <summary className="text-content/70 hover:text-accent">Dettagli configurazione URL Backend</summary>
            <pre className="bg-primary/50 p-2 mt-1 rounded text-content/80 text-[10px] whitespace-pre-wrap break-all">
              {backendUrlConfigText}
            </pre>
          </details>
        </div>
      </section>

      {isGoogleDriveFeatureEnabled && (
        <section className="bg-card p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-accent mb-3 flex items-center">
            <GoogleDriveIcon className="w-5 h-5 mr-2" /> Autenticazione Google Drive
          </h3>
          {googleAuthIsLoading ? (
            <div className="flex items-center text-content/70">
              <svg className="animate-spin h-5 w-5 mr-3 text-accent" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Verifica stato autenticazione...
            </div>
          ) : isGoogleLoggedIn && googleDriveUser ? (
            <div>
              <p className="text-content/90">Accesso effettuato come: <strong className="text-accent">{googleDriveUser.email}</strong></p>
              {googleDriveUser.name && <p className="text-xs text-content/70">Nome: {googleDriveUser.name}</p>}
              {googleDriveUser.picture && <img src={googleDriveUser.picture} alt="User avatar" className="w-10 h-10 rounded-full my-2 border border-accent/50"/>}
              <button onClick={onGoogleLogout} className="btn-secondary text-sm mt-2">
                Logout da Google
              </button>
            </div>
          ) : (
            <div>
              <p className="text-content/80 mb-2 text-sm">Autenticati con il tuo account Google per accedere alle funzionalità di Google Drive (es. visualizzatore file nei Progetti).</p>
              <button onClick={onGoogleLogin} className="btn-primary text-sm flex items-center">
                <GoogleDriveIcon className="w-4 h-4 mr-2"/> Login con Google
              </button>
            </div>
          )}
           {!googleAuthIsLoading && googleAuthError && !isGoogleLoggedIn && !googleAuthError.includes("Errore di connessione al server backend") && !googleAuthError.includes("URL Backend non valido") && !googleAuthError.includes("URL del backend fornito") && !googleAuthError.includes("malformato o incompleto") && !googleAuthError.includes("ERRORE DI CONNESSIONE O CORS") && (
            <p className="mt-3 text-xs text-danger bg-danger/20 p-2 rounded-md" role="alert">{googleAuthError}</p>
          )}
        </section>
      )}


      <section className="bg-card p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-accent mb-3 flex items-center">
          <DownloadIcon className="w-5 h-5 mr-2" /> Esportazione Dati
        </h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onExportJSON}
            className="btn-primary flex items-center justify-center text-sm"
          >
            <DocumentTextIcon className="w-4 h-4 mr-2" /> Esporta Dati Dashboard (JSON)
          </button>
          <button
            onClick={onExportCSV}
            className="btn-primary flex items-center justify-center text-sm"
          >
            <DocumentTextIcon className="w-4 h-4 mr-2" /> Esporta To-Do List (CSV)
          </button>
        </div>
         <p className="text-xs text-content/60 mt-2">L'esportazione JSON include tutti i dati dell'applicazione e le configurazioni del layout.</p>
      </section>
      
      <section className="bg-card p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-accent mb-3 flex items-center">
          <UploadIcon className="w-5 h-5 mr-2" /> Importazione Dati (JSON)
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange} 
            ref={fileInputRef}
            className="text-sm file-input"
            aria-label="Seleziona file JSON da importare"
          />
          <button
            onClick={handleImportClick}
            disabled={!importFile}
            className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            Importa Dati da File
          </button>
        </div>
        {importStatus && (
          <p className={clsx(
            "mt-3 text-xs p-2 rounded-md",
            importStatus.type === 'success' ? "bg-success/20 text-success-content" : "bg-danger/20 text-danger-content"
          )} role="status">
            {importStatus.message}
          </p>
        )}
        <p className="text-xs text-content/60 mt-2">
            <strong>Attenzione:</strong> L'importazione sostituirà tutti i dati e le impostazioni correnti. Assicurati di aver esportato i dati correnti se necessario.
        </p>
      </section>
    </div>
  );
};
