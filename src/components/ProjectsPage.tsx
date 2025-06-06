
import React, { useState, useMemo, useCallback } from 'react';
import type { Project, Client, ProjectsPageProps, ActivityLogType, TaskItem, ServiceItem, TimelinePeriodData, ManagedFile } from '../types';
import { SectionTitle } from './SectionTitle';
import { PlusCircleIcon, DocumentTextIcon as FilterIcon, EditIcon, TrashIcon, LinkIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from './icons';
import { ProjectModal } from './ProjectModal';
import { ProjectDetailView } from './ProjectDetailView';
import { ProjectTimelineSlider } from './ProjectTimelineSlider';
import clsx from 'clsx';

// Utility to parse DD/MM/AA to Date object (UTC to avoid timezone issues with date parts)
const parseUIDateString = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100 && year >= 0) {
      year += 2000;
    } else if (year < 0 || (year >= 100 && year < 1900) || year > 2100){
        console.warn(`Invalid year or out of plausible range in date string for UI parsing: ${dateStr}`);
        return null;
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      const date = new Date(Date.UTC(year, month, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date;
      } else {
        console.warn(`Constructed date parts do not match input (e.g., invalid day for month) in date string: ${dateStr}`);
        return null;
      }
    }
  }
  console.warn(`Invalid date string format for UI parsing: ${dateStr}`);
  return null;
};

const getMonthStart = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const getMonthEnd = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));

const isProjectActiveInMonth = (project: Project, targetMonthDate: Date): boolean => {
  const projectStart = parseUIDateString(project.dataProg);
  const projectEnd = parseUIDateString(project.dataFineProgetto);
  if (!projectStart) return false;
  const targetMonthStart = getMonthStart(targetMonthDate);
  const targetMonthEnd = getMonthEnd(targetMonthDate);
  if (projectStart > targetMonthEnd) return false;
  if (projectEnd && projectEnd < targetMonthStart) return false;
  return true;
};

const getProjectStatus = (project: Project): 'inCorso' | 'completato' => {
    if (!project.dataFineProgetto || project.dataFineProgetto.trim() === '') return 'inCorso';
    const endDate = parseUIDateString(project.dataFineProgetto);
    const todayMidnight = new Date(); todayMidnight.setUTCHours(0,0,0,0);
    return endDate && endDate < todayMidnight ? 'completato' : 'inCorso';
};

const formatDateForTable = (dateStr: string | null | undefined): string => {
    if (!dateStr) return 'N/D';
    const date = parseUIDateString(dateStr);
    if (!date) return dateStr; 
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'UTC' });
};

const formatCurrencyForTable = (amount: number | undefined) => {
  if (typeof amount !== 'number') return '-';
  return "€ " + amount.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); 
};

type SortKey = 'denominazioneProgetto' | 'clientName' | 'dataProg' | 'dataFineProgetto' | 'status' | 'totalValue';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projectsData, clientsData, tasksData, servicesData, projectFiles,
  onAddProject, onEditProject, onDeleteProject, addActivityLogEntry,
  effectiveBackendUrl, isGoogleLoggedIn, googleDriveUser, googleAuthError,
  onTriggerAuthCheck, isGoogleDriveFeatureEnabled,
  onUploadProjectFileApp, onDeleteProjectFileApp, onDownloadProjectFileApp
}) => {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);

  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [isTimelineFilterActive, setIsTimelineFilterActive] = useState<boolean>(false);
  const [selectedTimelineMonth, setSelectedTimelineMonth] = useState<Date | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'dataProg', direction: 'desc' });

  const clientMap = useMemo(() => new Map(clientsData.map(client => [client.id, client.denominazione])), [clientsData]);

  const filteredProjectsForTimeline = useMemo(() => projectsData.filter(p => 
    (filterClient === 'all' || p.idCliente === parseInt(filterClient)) &&
    (filterStatus === 'all' || getProjectStatus(p) === filterStatus)
  ), [projectsData, filterClient, filterStatus]);

  const timelinePeriods = useMemo<TimelinePeriodData[]>(() => {
    const periods: TimelinePeriodData[] = [];
    const fixedStartDate = new Date(Date.UTC(2022, 0, 1)); 
    const fixedEndDate = new Date(Date.UTC(2026, 11, 31)); 
    let currentMonthIter = getMonthStart(fixedStartDate);
    while (currentMonthIter <= getMonthStart(fixedEndDate)) {
      const projectCount = filteredProjectsForTimeline.filter(p => isProjectActiveInMonth(p, currentMonthIter)).length;
      periods.push({
        monthDate: new Date(currentMonthIter),
        projectCount,
        label: currentMonthIter.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }).replace('.', ''),
      });
      currentMonthIter.setUTCMonth(currentMonthIter.getUTCMonth() + 1);
    }
    return periods;
  }, [filteredProjectsForTimeline]);

  const handleSelectTimelinePeriod = useCallback((period: Date | null) => {
    setSelectedTimelineMonth(period);
    if (period && isTimelineFilterActive) { 
      addActivityLogEntry('PROJECT_VIEW', `Timeline filtrata per: ${period.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`);
    }
  }, [addActivityLogEntry, isTimelineFilterActive]);

  const toggleTimelineFilter = () => setIsTimelineFilterActive(prev => {
    const newActiveState = !prev;
    if (!newActiveState) setSelectedTimelineMonth(null); 
    else if (!selectedTimelineMonth && timelinePeriods.length > 0) {
        const defaultMonth = timelinePeriods.find(p => p.monthDate.getTime() === getMonthStart(new Date()).getTime()) || timelinePeriods[Math.floor(timelinePeriods.length / 2)];
        if (defaultMonth) setSelectedTimelineMonth(defaultMonth.monthDate);
    }
    addActivityLogEntry('PROJECT_VIEW', `Filtro timeline ${newActiveState ? 'attivato' : 'disattivato'}.`);
    return newActiveState;
  });

  const handleOpenProjectModal = (projectToEdit?: Project) => {
    setEditingProject(projectToEdit || null);
    setIsProjectModalOpen(true);
    addActivityLogEntry(projectToEdit ? 'PROJECT_EDIT' : 'PROJECT_ADD', `Modale progetto ${projectToEdit ? 'aperta per modifica' : 'aperta per aggiunta'}.`);
  };
  const handleCloseProjectModal = () => { setIsProjectModalOpen(false); setEditingProject(null); };

  const handleSaveProjectFromModal = (projectData: Omit<Project, 'id'>) => {
    if (editingProject) {
      onEditProject(editingProject.id, projectData);
      if (selectedProjectForDetail?.id === editingProject.id) setSelectedProjectForDetail(prev => prev ? { ...prev, ...projectData } : null);
    } else onAddProject(projectData);
    handleCloseProjectModal();
  };

  const handleDeleteRequest = (projectId: number, projectName: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare il progetto "${projectName}"?`)) {
      onDeleteProject(projectId);
      if (selectedProjectForDetail?.id === projectId) setSelectedProjectForDetail(null); 
    } else addActivityLogEntry('PROJECT_DELETE', `Eliminazione progetto "${projectName}" annullata.`);
  };

  const handleShowProjectDetail = (project: Project) => { setSelectedProjectForDetail(project); addActivityLogEntry('PROJECT_VIEW', `Dettaglio progetto: ${project.denominazioneProgetto}`); };
  const handleCloseProjectDetail = () => { setSelectedProjectForDetail(null); addActivityLogEntry('PROJECT_VIEW', `Chiusura dettaglio progetto.`); };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedFilteredProjects = useMemo(() => {
    let tempProjects = projectsData.map(p => ({
      ...p,
      clientName: clientMap.get(p.idCliente) || 'Sconosciuto',
      status: getProjectStatus(p),
      totalValue: tasksData.filter(task => task.idProgetto === p.id).reduce((sum, task) => sum + (task.importoTask > 0 ? task.importoTask : 0), 0)
    })).filter(p => 
      (filterClient === 'all' || p.idCliente === parseInt(filterClient)) &&
      (filterStatus === 'all' || p.status === filterStatus) &&
      (searchTerm === '' || p.denominazioneProgetto.toLowerCase().includes(searchTerm.toLowerCase()) || p.clientName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!isTimelineFilterActive || !selectedTimelineMonth || isProjectActiveInMonth(p, selectedTimelineMonth))
    );

    tempProjects.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'dataProg' || sortConfig.key === 'dataFineProgetto') {
        valA = parseUIDateString(valA as string | null)?.getTime() || (sortConfig.direction === 'asc' ? Infinity : -Infinity) ; // Handle null dates for sorting
        valB = parseUIDateString(valB as string | null)?.getTime() || (sortConfig.direction === 'asc' ? Infinity : -Infinity) ;
      } else if (sortConfig.key === 'totalValue') {
         valA = valA ?? 0; // Treat undefined/null as 0 for sorting
         valB = valB ?? 0;
      }

      let comparison = 0;
      if (valA === null || valA === undefined) comparison = 1;
      else if (valB === null || valB === undefined) comparison = -1;
      else if (typeof valA === 'string' && typeof valB === 'string') comparison = valA.localeCompare(valB);
      else if (valA < valB) comparison = -1;
      else if (valA > valB) comparison = 1;
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return tempProjects;
  }, [projectsData, clientMap, tasksData, filterClient, filterStatus, searchTerm, isTimelineFilterActive, selectedTimelineMonth, sortConfig]);

  const renderSortArrow = (key: SortKey) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  if (selectedProjectForDetail) {
    const tasksForSelected = tasksData.filter(task => task.idProgetto === selectedProjectForDetail.id);
    const clientNameForSelected = clientMap.get(selectedProjectForDetail.idCliente) || 'Sconosciuto';
    const localFilesForSelected = projectFiles.find(pf => pf.id === selectedProjectForDetail.id.toString())?.files || [];
    return (
      <div className="h-full flex flex-col">
        <ProjectDetailView
          project={selectedProjectForDetail} clientName={clientNameForSelected} tasksForProject={tasksForSelected} servicesData={servicesData}
          onGoBack={handleCloseProjectDetail} onEditProject={handleOpenProjectModal} onDeleteProject={handleDeleteRequest}
          addActivityLogEntry={addActivityLogEntry} effectiveBackendUrl={effectiveBackendUrl} isGoogleLoggedIn={isGoogleLoggedIn}
          googleDriveUser={googleDriveUser} googleAuthError={googleAuthError} onTriggerAuthCheck={onTriggerAuthCheck}
          isGoogleDriveFeatureEnabled={isGoogleDriveFeatureEnabled} projectLocalFiles={localFilesForSelected}
          onUploadProjectFile={(file) => onUploadProjectFileApp(selectedProjectForDetail.id.toString(), file)}
          onDeleteProjectFile={(fileId) => onDeleteProjectFileApp(selectedProjectForDetail.id.toString(), fileId)}
          onDownloadProjectFile={onDownloadProjectFileApp}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col text-content">
      <div className="sticky top-0 z-20 bg-primary py-3">
        <SectionTitle className="!mb-3">Gestione Progetti</SectionTitle>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-center mb-3">
          <button onClick={() => handleOpenProjectModal()} className="btn-primary flex items-center text-sm w-full sm:w-auto justify-center">
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Aggiungi Progetto
          </button>
          <button onClick={toggleTimelineFilter} className={clsx("btn-secondary flex items-center text-sm w-full sm:w-auto justify-center", isTimelineFilterActive && "!bg-accent !text-primary hover:!bg-opacity-90")}>
            <FilterIcon className="w-4 h-4 mr-2" /> {isTimelineFilterActive ? "Disattiva Filtro Timeline" : "Attiva Filtro Timeline"}
          </button>
          <div className="flex items-center border border-content/20 bg-card flex-grow w-full sm:w-auto">
            <input type="text" placeholder="Cerca..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="placeholder-content/50 text-sm bg-transparent p-2.5 flex-grow !border-0 !ring-0 !outline-none w-full min-w-[150px]" />
            <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="text-sm bg-transparent p-2.5 border-l border-content/20 !border-0 !ring-0 !outline-none focus:border-l-accent min-w-[130px] sm:min-w-[150px]">
              <option value="all" className="bg-card text-content">Tutti i Clienti</option>
              {clientsData.sort((a,b) => a.denominazione.localeCompare(b.denominazione)).map(c => <option key={c.id} value={c.id} className="bg-card text-content">{c.denominazione}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm bg-transparent p-2.5 border-l border-content/20 !border-0 !ring-0 !outline-none focus:border-l-accent min-w-[130px] sm:min-w-[150px]">
              <option value="all" className="bg-card text-content">Tutti gli Stati</option>
              <option value="inCorso" className="bg-card text-content">In Corso</option>
              <option value="completato" className="bg-card text-content">Completato</option>
            </select>
          </div>
        </div>
        {isTimelineFilterActive && timelinePeriods.length > 0 && (
          <ProjectTimelineSlider timelinePeriods={timelinePeriods} selectedPeriod={selectedTimelineMonth} onSelectPeriod={handleSelectTimelinePeriod} isTimelineFilterActive={isTimelineFilterActive} />
        )}
      </div>

      <div className={clsx("flex-grow overflow-auto", (isTimelineFilterActive && timelinePeriods.length > 0) ? "pt-2" : "pt-4")} style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary-light)' }}>
        {sortedFilteredProjects.length > 0 ? (
          <table className="min-w-full divide-y divide-content/10 border border-content/10">
            <thead className="bg-card/50 backdrop-blur-sm sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-content/80 uppercase tracking-wider cursor-pointer hover:text-accent" onClick={() => requestSort('denominazioneProgetto')}>Progetto{renderSortArrow('denominazioneProgetto')}</th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-content/80 uppercase tracking-wider cursor-pointer hover:text-accent" onClick={() => requestSort('clientName')}>Cliente{renderSortArrow('clientName')}</th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-content/80 uppercase tracking-wider cursor-pointer hover:text-accent hidden md:table-cell" onClick={() => requestSort('dataProg')}>Inizio{renderSortArrow('dataProg')}</th>
                <th scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-content/80 uppercase tracking-wider cursor-pointer hover:text-accent hidden md:table-cell" onClick={() => requestSort('dataFineProgetto')}>Fine{renderSortArrow('dataFineProgetto')}</th>
                <th scope="col" className="px-3 py-2.5 text-center text-xs font-medium text-content/80 uppercase tracking-wider cursor-pointer hover:text-accent" onClick={() => requestSort('status')}>Stato{renderSortArrow('status')}</th>
                <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium text-content/80 uppercase tracking-wider cursor-pointer hover:text-accent hidden sm:table-cell" onClick={() => requestSort('totalValue')}>Valore{renderSortArrow('totalValue')}</th>
                <th scope="col" className="px-3 py-2.5 text-center text-xs font-medium text-content/80 uppercase tracking-wider">Azioni</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-primary-light/50">
              {sortedFilteredProjects.map(project => (
                <tr 
                    key={project.id} 
                    className="hover:bg-primary-light transition-colors duration-150 cursor-pointer border-l-[2px] border-transparent hover:border-l-accent"
                    onClick={() => handleShowProjectDetail(project)}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleShowProjectDetail(project)}
                    tabIndex={0}
                    aria-label={`Visualizza dettagli per il progetto ${project.denominazioneProgetto}`}
                >
                  <td className="px-3 py-2 text-sm text-content/90 whitespace-nowrap truncate max-w-[120px] xs:max-w-[150px] sm:max-w-xs" title={project.denominazioneProgetto}>{project.denominazioneProgetto}</td>
                  <td className="px-3 py-2 text-xs text-content/80 whitespace-nowrap truncate max-w-[100px] xs:max-w-[120px] sm:max-w-xs" title={project.clientName}>{project.clientName}</td>
                  <td className="px-3 py-2 text-xs text-content/80 whitespace-nowrap hidden md:table-cell">{formatDateForTable(project.dataProg)}</td>
                  <td className="px-3 py-2 text-xs text-content/80 whitespace-nowrap hidden md:table-cell">{formatDateForTable(project.dataFineProgetto)}</td>
                  <td className="px-3 py-2 text-xs text-center whitespace-nowrap">
                    <span className={clsx("px-2 py-0.5 text-[10px] font-semibold", project.status === 'inCorso' ? 'bg-success/80 text-content' : 'bg-content/20 text-content/70')}>
                      {project.status === 'inCorso' ? 'In Corso' : 'Completato'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-accent/90 font-medium text-right whitespace-nowrap hidden sm:table-cell">{formatCurrencyForTable(project.totalValue)}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <button onClick={(e) => { e.stopPropagation(); handleOpenProjectModal(project); }} className="btn-icon !p-1" title="Modifica Progetto"><EditIcon className="w-4 h-4" /></button>
                    {project.linkProgetto && <a href={project.linkProgetto} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="btn-icon !p-1 inline-block align-middle" title="Link Esterno"><LinkIcon className="w-4 h-4" /></a>}
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(project.id, project.denominazioneProgetto); }} className="btn-icon !p-1 !hover:text-danger" title="Elimina Progetto"><TrashIcon className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-content/70">Nessun progetto trovato con i filtri correnti.</p>
          </div>
        )}
      </div>

      {isProjectModalOpen && <ProjectModal isOpen={isProjectModalOpen} onClose={handleCloseProjectModal} onSave={handleSaveProjectFromModal} projectToEdit={editingProject} clients={clientsData} />}
    </div>
  );
};