
import React, { useState } from 'react';
import type { ManagedFile, FileType, ProjectFolder } from '../types';
import { SectionTitle } from './SectionTitle';
import { FolderIcon, FilePdfIcon, FileImageIcon, FileGenericIcon, UploadIcon, TrashIcon, DownloadIcon } from './icons'; // Assuming central export

interface FileManagerProps {
  projectFolders: ProjectFolder[]; // Can be projects or clients
  onFileUpload: (projectId: string, file: File) => void; 
  onFileDelete: (projectId: string, fileId: string) => void;
  onFileDownload: (file: ManagedFile) => void; 
}

const getFileIcon = (type: FileType, isFolder: boolean) => {
  if (isFolder) return <FolderIcon className="w-5 h-5 text-accent" />;
  switch (type) {
    case 'pdf': return <FilePdfIcon className="w-5 h-5 text-content/80" />;
    case 'img': return <FileImageIcon className="w-5 h-5 text-content/80" />;
    default: return <FileGenericIcon className="w-5 h-5 text-content/80" />;
  }
};

export const FileManager: React.FC<FileManagerProps> = ({ projectFolders, onFileUpload, onFileDelete, onFileDownload }) => {
  const [selectedProject, setSelectedProject] = useState<ProjectFolder | null>(projectFolders.length > 0 ? projectFolders[0] : null);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const project = projectFolders.find(p => p.id === e.target.value);
    setSelectedProject(project || null);
  };

  const handleActualFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && selectedProject) {
      onFileUpload(selectedProject.id, event.target.files[0]);
      event.target.value = ""; // Reset file input
    }
  };


  return (
    <div className="p-4 md:p-6 h-full flex flex-col border border-content/10"> {/* Removed rounded-lg */}
      <SectionTitle>Gestione Documenti Locali</SectionTitle>
      <div className="mb-4 flex flex-wrap items-center gap-4 flex-shrink-0">
        <div>
            <label htmlFor="project-select-fm" className="text-sm text-content/80 mr-2">Progetto/Cliente:</label>
            <select
            id="project-select-fm"
            value={selectedProject?.id || ''}
            onChange={handleProjectChange}
            className="min-w-[200px]" // Global select styles will apply (sharp edges)
            >
            {projectFolders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
        {selectedProject && (
            <>
              <input 
                type="file" 
                id={`file-upload-input-fm-${selectedProject.id}`} 
                className="hidden" 
                onChange={handleActualFileUpload} 
              />
              <label
                  htmlFor={`file-upload-input-fm-${selectedProject.id}`}
                  className="btn-primary cursor-pointer flex items-center text-sm !px-3 !py-2" // btn-primary will be sharp
              >
                  <UploadIcon className="w-4 h-4 mr-2" /> Carica File
              </label>
            </>
        )}
      </div>

      {selectedProject ? (
        <div className="space-y-2 pr-2 flex-grow overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary)' }}>
          {selectedProject.files.length > 0 ? selectedProject.files.map(file => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-primary hover:bg-primary/70 transition-colors group border border-content/10"> {/* Removed rounded-md, added border */}
              <div className="flex items-center space-x-3">
                {getFileIcon(file.type, file.isFolder)}
                <span className="text-sm text-content">{file.name}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-content/70 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{file.size}</span>
                <span>{file.uploadDate}</span>
                <button onClick={() => onFileDownload(file)} className="btn-icon !p-1 focus-visible:ring-accent" title="Download"> {/* btn-icon is sharp */}
                  <DownloadIcon className="w-4 h-4" />
                </button>
                <button onClick={() => onFileDelete(selectedProject.id, file.id)} className="btn-icon !p-1 focus-visible:ring-danger" title="Elimina"> {/* btn-icon is sharp */}
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )) : <p className="text-content/70 text-sm mt-4 flex-grow flex items-center justify-center">Nessun file in questo progetto/cliente.</p>}
        </div>
      ) : (
        <p className="text-content/70 text-sm mt-4 flex-grow flex items-center justify-center">Seleziona un progetto/cliente per visualizzare i file.</p>
      )}
    </div>
  );
};
