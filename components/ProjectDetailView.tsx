import React, { useMemo, useRef } from 'react';
import type { Project, TaskItem, ServiceItem, ProjectDetailViewProps, ManagedFile, FileType } from '../types';
import { SectionTitle } from './SectionTitle';
import { FolderIcon, UserIcon, LinkIcon, EditIcon, TrashIcon, ArrowLeftIcon, DocumentTextIcon, GoogleDriveIcon, UploadIcon, DownloadIcon, FileGenericIcon, FilePdfIcon, FileImageIcon } from './icons';
import { GoogleDriveFilesViewer } from './GoogleDriveFilesViewer';
import clsx from 'clsx';

// Utility to parse DD/MM/AA to Date object
const parseDetailDateString = (dateStr: string | null | undefined): Date | null => {
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
  console.warn(`Invalid date string for detail parsing: ${dateStr}`);
  return null;
};

const formatDateForDetail = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/D';
  const date = parseDetailDateString(dateStr);
  if (!date) return dateStr;
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const formatCurrencyForDetail = (amount: number) => {
  return "€ " + amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const isGoogleDriveFolderLink = (url: string | null | undefined): boolean => {
  if (!url) return false;
  try {
    const GDRIVE_REGEX = /^(https?:\/\/)?(www\.)?drive\.google\.com\/drive\/(folders|u\/\d+\/folders)\/([-\w]+)(\?.*)?$/i;
    return GDRIVE_REGEX.test(url);
  } catch (e) {
    return false;
  }
};

const getLocalFileIcon = (type: FileType) => {
  switch (type) {
    case 'pdf': return <FilePdfIcon className="w-5 h-5 text-content/80" />;
    case 'img': return <FileImageIcon className="w-5 h-5 text-content/80" />;
    case 'folder': return <FolderIcon className="w-5 h-5 text-accent" />;
    default: return <FileGenericIcon className="w-5 h-5 text-content/80" />;
  }
};

const calculateProjectDurationText = (startDateStr: string | null | undefined, endDateStr: string | null | undefined): string => {
    const startDate = parseDetailDateString(startDateStr);
    const today = new Date();
    today.setUTCHours(0,0,0,0);

    let endDate = parseDetailDateString(endDateStr);
    let isOngoingOrFutureEndDate = false;

    if (!endDate || endDate >= today) { 
        isOngoingOrFutureEndDate = true;
        endDate = today; 
    }
    
    if (!startDate || !endDate || endDate < startDate) {
        return 'N/D'; 
    }

    const utcStartDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
    const utcEndDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));

    const diffTime = utcEndDate.getTime() - utcStartDate.getTime();
    const totalDays = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    if (totalDays === 0 && startDate.getTime() === endDate.getTime() && !isOngoingOrFutureEndDate) {
        return "<1 giorno";
    }
     if (totalDays === 0 && isOngoingOrFutureEndDate) {
        return "<1 giorno (ad oggi)";
    }
   
    let durationString = '';
    if (totalDays < 30) {
        durationString = `${totalDays} giorn${totalDays === 1 ? 'o' : 'i'}`;
    } else {
        const totalMonths = Math.floor(totalDays / 30.4375); 
        const remainingDays = Math.round(totalDays % 30.4375); 
        
        if (totalMonths < 12) {
            durationString = `${totalMonths} mes${totalMonths === 1 ? 'e' : 'i'}`;
            if (remainingDays > 5 && totalMonths < 6) { 
                 durationString += ` e ${remainingDays}gg`;
            }
        } else {
            const years = Math.floor(totalMonths / 12);
            const monthsInYear = totalMonths % 12;
            durationString = `${years} ann${years === 1 ? 'o' : 'i'}`;
            if (monthsInYear > 0) {
                 durationString += ` e ${monthsInYear} mes${monthsInYear === 1 ? 'e' : 'i'}`;
            }
        }
    }
    return `${isOngoingOrFutureEndDate ? `${durationString} (ad oggi)` : durationString}`;
};


export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project, clientName, tasksForProject, servicesData,
  onGoBack, onEditProject, onDeleteProject, addActivityLogEntry,
  effectiveBackendUrl, isGoogleLoggedIn, googleDriveUser, googleAuthError, onTriggerAuthCheck, isGoogleDriveFeatureEnabled,
  projectLocalFiles, onUploadProjectFile, onDeleteProjectFile, onDownloadProjectFile,
}) => {
  const todayAtMidnight = new Date();
  todayAtMidnight.setUTCHours(0,0,0,0);
  const projectEndDate = parseDetailDateString(project.dataFineProgetto);
  const isOngoing = !projectEndDate || projectEndDate >= todayAtMidnight;
  const localFileInputRef = useRef<HTMLInputElement>(null);

  const serviceMap = useMemo(() => new Map(servicesData.map(service => [service.id, service.descrizioneServizio])), [servicesData]);

  const sortedTasksByDate = useMemo(() => [...tasksForProject].sort((a, b) => {
    const dateA = parseDetailDateString(a.dataTask);
    const dateB = parseDetailDateString(b.dataTask);
    if (dateA && dateB) return dateB.getTime() - dateA.getTime();
    if (dateA) return -1; 
    if (dateB) return 1;
    return 0; 
  }), [tasksForProject]);

  const totalTasksAmount = useMemo(() => tasksForProject.reduce((sum, task) => sum + (task.importoTask > 0 ? task.importoTask : 0), 0), [tasksForProject]);

  const projectHasGoogleDriveLink = isGoogleDriveFolderLink(project.linkProgetto);

  const categorizedTasks = useMemo(() => {
    const categoryMap: Record<string, TaskItem[]> = {};
    sortedTasksByDate.forEach(task => {
      const service = servicesData.find(s => s.id === task.idServizio);
      const category = service?.categoriaServizio || 'Non Categorizzato';
      if (!categoryMap[category]) categoryMap[category] = [];
      categoryMap[category].push(task);
    });
    const PREP_MATERIALE_CATEGORY = "PREPARAZIONE MATERIALE";
    const sortedCategories = Object.keys(categoryMap).sort((a, b) => {
      if (a === PREP_MATERIALE_CATEGORY) return -1;
      if (b === PREP_MATERIALE_CATEGORY) return 1;
      return a.localeCompare(b);
    });
    return sortedCategories.map(categoryName => ({ categoryName, tasks: categoryMap[categoryName] }));
  }, [sortedTasksByDate, servicesData]);

  const durationDisplay = calculateProjectDurationText(project.dataProg, project.dataFineProgetto);

  const handleLocalFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onUploadProjectFile(event.target.files[0]);
      if(event.target) event.target.value = ""; // Reset file input
    }
  };

  return (
    <div className="h-full flex flex-col text-content"> 
      <div className="flex items-start mb-6 pb-4 border-b border-content/20">
        <button onClick={onGoBack} className="btn-icon p-2 mr-4 text-content/80 hover:text-accent flex-shrink-0" aria-label="Torna alla lista progetti">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <div className="flex-grow overflow-hidden">
            <div className="flex items-center gap-x-3">
                <h2 className="text-2xl font-semibold text-accent truncate" title={project.denominazioneProgetto}>{project.denominazioneProgetto}</h2>
                {project.linkProgetto && !projectHasGoogleDriveLink && (
                    <a href={project.linkProgetto} target="_blank" rel="noopener noreferrer" className="btn-icon !p-1 text-content/70 hover:text-accent flex-shrink-0" title="Apri link progetto generico">
                        <LinkIcon className="w-5 h-5" />
                    </a>
                )}
            </div>
            <p className="text-sm text-content/80 mt-0.5">Cliente: <span className="font-medium">{clientName}</span></p>
        </div>
        <div className="flex space-x-1 sm:space-x-2 flex-shrink-0">
          <button onClick={() => onEditProject(project)} className="btn-icon !p-1.5 sm:!p-2" title="Modifica Progetto"><EditIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
          <button onClick={() => onDeleteProject(project.id, project.denominazioneProgetto)} className="btn-icon !p-1.5 sm:!p-2 !hover:text-danger" title="Elimina Progetto"><TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" /></button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary-light)' }}>
        
        <div className="bg-card p-4 sm:p-6 border border-content/10"> {/* Sharp edges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
            <div><span className="text-xs text-content/70 block">Data Inizio</span><span className="text-content/90 block">{formatDateForDetail(project.dataProg)}</span></div>
            <div><span className="text-xs text-content/70 block">Data Fine</span><span className={clsx("text-content/90 block", isOngoing && "italic text-green-400")}>{project.dataFineProgetto ? formatDateForDetail(project.dataFineProgetto) : 'In Corso'}</span></div>
            <div><span className="text-xs text-content/70 block">Stato</span><span className={clsx("text-content/90 block font-medium", isOngoing ? "text-green-400" : "text-content/70")}>{isOngoing ? 'In Corso' : 'Completato'}</span></div>
            <div className="sm:col-span-2 md:col-span-1"><span className="text-xs text-content/70 block">Durata</span><span className="text-content/90 block">{durationDisplay}</span></div>
            {totalTasksAmount > 0 && (<div><span className="text-xs text-content/70 block">Valore Task</span><span className="text-accent font-semibold block">{formatCurrencyForDetail(totalTasksAmount)}</span></div>)}
          </div>
        </div>

        {categorizedTasks.length > 0 && (
            <div className="mb-6">
            <SectionTitle className="!text-lg !mb-3">Task del Progetto</SectionTitle>
            <div className="space-y-4">
                {categorizedTasks.map(({ categoryName, tasks }) => (
                <div key={categoryName} className="bg-card p-3 sm:p-4 border border-content/10"> {/* Sharp edges */}
                    <h4 className="text-sm font-semibold text-accent/80 mb-2 pb-1 border-b border-content/10">{categoryName}</h4>
                    <ul className="space-y-1.5 text-xs">
                    {tasks.map(task => (
                        <li key={task.id} className="flex justify-between items-center">
                        <span className="text-content/90 flex-grow pr-2">{task.descrizioneTask || (serviceMap.get(task.idServizio) || 'Task non specificato')}{task.numeroTask > 1 && <span className="text-content/60 text-[10px] ml-1">(x{task.numeroTask})</span>}</span>
                        <span className="text-accent font-medium whitespace-nowrap">{formatCurrencyForDetail(task.importoTask)}</span>
                        </li>
                    ))}</ul>
                </div>))}
            </div></div>
        )}

        <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
                <SectionTitle className="!text-lg !mb-0">File Locali del Progetto</SectionTitle>
                <input type="file" ref={localFileInputRef} onChange={handleLocalFileUpload} className="hidden" id={`project-file-upload-${project.id}`}/>
                <label htmlFor={`project-file-upload-${project.id}`} className="btn-primary flex items-center text-sm !px-3 !py-1.5 cursor-pointer" title="Carica file per questo progetto">
                    <UploadIcon className="w-4 h-4 mr-1.5" /> Carica File
                </label>
            </div>
            {projectLocalFiles.length > 0 ? (
                <div className="space-y-2">
                {projectLocalFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-2.5 bg-card hover:bg-primary/80 transition-colors group border border-content/10"> {/* Sharp edges */}
                    <div className="flex items-center space-x-2.5 flex-grow min-w-0">
                        {getLocalFileIcon(file.type)}
                        <span className="text-sm text-content truncate" title={file.name}>{file.name}</span>
                    </div>
                    <div className="flex items-center space-x-2.5 text-xs text-content/70 flex-shrink-0 ml-2">
                        <span className="hidden sm:inline">{file.size}</span>
                        <span className="hidden md:inline">{file.uploadDate}</span>
                        <button onClick={() => onDownloadProjectFile(file)} className="btn-icon !p-1" title="Download"><DownloadIcon className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteProjectFile(file.id)} className="btn-icon !p-1 !hover:text-danger" title="Elimina"><TrashIcon className="w-4 h-4" /></button>
                    </div></div>
                ))}</div>
            ) : (
                <p className="text-content/70 text-sm text-center py-4 border border-dashed border-content/20 bg-card">Nessun file locale caricato.</p> /* Sharp edges */
            )}
        </div>

        {isGoogleDriveFeatureEnabled && projectHasGoogleDriveLink && (
          <div className="mb-6">
            <SectionTitle className="!text-lg !mb-3 flex items-center"><GoogleDriveIcon className="w-5 h-5 mr-2 text-accent"/><span>File Google Drive</span></SectionTitle>
            <div className="bg-card p-0 border border-content/10 h-96"> {/* Sharp edges */}
              <GoogleDriveFilesViewer addActivityLogEntry={addActivityLogEntry} backendUrl={effectiveBackendUrl} initialFolderIdOrUrl={project.linkProgetto || undefined}
                isGoogleLoggedIn={isGoogleLoggedIn} googleDriveUser={googleDriveUser} googleAuthError={googleAuthError} onTriggerAuthCheck={onTriggerAuthCheck}
              />
            </div></div>
        )}
      </div>
    </div>
  );
};
