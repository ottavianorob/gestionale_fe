

import React from 'react';
// Import the original Layout type from react-grid-layout for reference or other uses.
import type { Layout as RGL_Layout_Original } from 'react-grid-layout';

// Define CustomLayoutItem explicitly with all properties used in the configuration
// and expected by react-grid-layout. This ensures TypeScript recognizes 'i' and other
// RGL properties directly on CustomLayoutItem.
export interface CustomLayoutItem {
  // Core RGL properties
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Optional RGL properties (include ones used in config and common ones)
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
  isBounded?: boolean;
  // Custom property
  defaultVisible?: boolean;
}

export type WidgetVisibilityState = Record<string, boolean>;


export interface IconProps {
  className?: string;
}
export type IconComponent = React.FC<IconProps>;

export interface Metric {
  id: string; // Unique identifier for the metric, e.g., 'entrateLorde'
  title: string;
  value: string | number;
  percentageChange?: number;
  icon?: React.ReactNode; // Keep React.ReactNode for flexibility, but ensure string for import/export of icon name
  iconName?: string; // Add for serialization if needed
}

export interface MonthlyRevenueData {
  month: string;
  year: number; // Added year for filtering
  revenue: number;
}

export interface RevenueCategoryData {
  name: string;
  value: number;
  client?: string; // Optional client association for filtering
  year: number; // Added non-optional year for filtering and consistency
}

export interface ExpenseRevenueData {
  month: string;
  year: number; // Added year for filtering
  revenue: number;
  expenses: number; // Assumed to be variable expenses
}

export interface FixedExpenseData {
  month: string;
  year: number;
  cost: number;
}

export interface NetProfitData {
  month: string;
  year: number;
  netProfit: number;
  fixedExpenses: number;
}


export interface Activity { // Original recent activities
  id: string;
  description: string;
  timestamp: string;
}

export type UrgencyLevel = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  task: string;
  completed: boolean;
  urgency?: UrgencyLevel;
  client?: string;
  quantity?: number; // e.g., hours or units
  estimatedHours?: number;
  suggestedPrice?: number;
  finalPrice?: number;
  createdAt?: string;
  notes?: string;
}

// For price suggestion heuristic
export interface HistoricalTask {
  keywords: string[]; // Keywords from task description
  basePrice: number; // Price for a standard unit/hour without multipliers
  clientTier?: 'standard' | 'premium'; // Example client tier
  urgency: UrgencyLevel;
  hours?: number; // If priced by hours
}


export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string; // Potrebbe diventare un viewId o rimanere '#' per non-navigation items
  viewId?: ActiveView; // Aggiunto per identificare la vista da attivare
  action?: 'googleLogin'; // For special actions like Google Login
  children?: SidebarNavItem[];
}

export interface UtilityBarProps {
  notificationCount?: number;
  BellIcon: IconComponent;
  EnvelopeIcon: IconComponent;
  CogIcon: IconComponent;
  Bars3Icon: IconComponent; // Added for mobile menu toggle
  onToggleLayoutEdit: () => void;
  isLayoutEditMode: boolean;
  isMobileView: boolean; // Added to control mobile-specific UI
  onToggleMobileMenu: () => void; // Added to handle mobile menu toggle
}

// Fiscal Simulation
export interface FiscalInput {
  revenue: number;
  coeffRedditivita: number;
  aliquotaInps: number;
  aliquotaImposta: number;
  isStartupRate: boolean; // To use 5% tax rate
  deductInpsForTax: boolean; // Whether INPS contributions are deductible for tax calculation
}

export interface FiscalResult {
  redditoImponibileLordo: number;
  contributiInps: number;
  taxableIncomeForImposta: number; // Assicurati che sia corretto qui
  impostaDovuta: number;
  nettoDisponibile: number;
}

// Activity Log
export type ActivityLogType = 
  'TASK_CREATE' | 'TASK_UPDATE' | 'TASK_DELETE' | 
  'FILE_UPLOAD' | 'FILE_DELETE' | 
  'FISCAL_SIM' | 
  'LAYOUT_CHANGE' | 'DATA_EXPORT' | 'DATA_IMPORT' | 'WIDGET_VISIBILITY_CHANGE' | 
  'CLIENT_ADD' | 'CLIENT_EDIT' | 'CLIENT_DELETE' |
  'PROJECT_ADD' | 'PROJECT_EDIT' | 'PROJECT_DELETE' | 'PROJECT_VIEW' |
  'EVENT_ADD' | 'EVENT_EDIT' | 'EVENT_DELETE' | 
  'INVOICE_VIEW' | 'INVOICE_EDIT' |
  'GOOGLE_AUTH' | 'GOOGLE_DRIVE_FETCH' |
  'WEATHER_FETCH'; // Added for weather

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  user: string; // For now, static "Roberto Ottaviano" or "Sistema"
  type: ActivityLogType;
  description: string;
  details?: Record<string, any>;
}

// File Manager
export type FileType = 'pdf' | 'doc' | 'xls' | 'txt' | 'img' | 'folder' | 'generic';
export interface ManagedFile { // This is for the existing FileManager, not Google Drive files
  id: string;
  name: string;
  type: FileType;
  size: string; // e.g. "1.2MB"
  path: string; // e.g. "Project Alpha/Designs/"
  uploadDate: string;
  parentId?: string; // For folder structure
  isFolder: boolean;
  children?: ManagedFile[]; // For folders
}
export interface ProjectFolder { // Or ClientFolder for existing FileManager
    id: string; // Corresponds to Project.id
    name: string; // Corresponds to Project.denominazioneProgetto
    files: ManagedFile[];
}


// Chart Filters
export interface ChartFilterState {
  selectedYear: number | 'all';
  selectedClient: string | 'all';
}

// React Grid Layout items
export type DashboardLayout = CustomLayoutItem[];


// News Ticker
export interface NewsTickerItem {
  id: string;
  category: string;
  categoryColor?: string; // Hex color for badge background
  mainText: string; // Orange, uppercase
  secondaryText?: string; // Optional: Smaller, lighter - this will be replaced by "X days ago" logic
  timestamp: string; // ISO date string for calculating "X days ago"
}

// Invoice Data
export interface Invoice {
  id: number;
  numeroFattura: string;
  dataFattura: string; // "DD/MM/YY"
  idCliente: number;
  descrizioneFattura: string;
  ivaPercentuale: string; // "0%"
  naturaFattura: string; // "N2.2"
  scadenzaGiorni: number;
  importoFattura: number; // 10000.00
  dataIncassoAttesa: string; // "DD/MM/YY" or empty
}

export type InvoiceStatus = 'Pagata' | 'In Scadenza' | 'Scaduta' | 'Da Incassare' | 'Nota di Credito';

export interface InvoiceDisplayItem extends Invoice {
  clientName: string;
  calculatedDueDate: Date | null;
  status: InvoiceStatus;
  displayPaymentDate: string; // Date string for display (actual or expected)
}

export interface InvoicesPageProps {
  invoicesData: Invoice[];
  clientsData: Client[];
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
  onEditInvoice: (invoiceId: number, updatedData: Partial<Invoice>) => void;
}

export interface InvoiceDetailViewProps {
  invoice: InvoiceDisplayItem;
  clientsData: Client[];
  onGoBack: () => void;
  onEditInvoice: (invoiceId: number, updatedData: Partial<Invoice>) => void;
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
}


// Client Data
export interface Client {
  id: number;
  denominazione: string;
  partitaIva: string;
  indirizzo1: string;
  indirizzo2: string;
  immagineUrl?: string | null;
}

// Service Data
export interface ServiceItem {
  id: number;
  categoriaServizio: string;
  descrizioneServizio: string;
}

// Task Data
export interface TaskItem {
  id: number;
  idProgetto: number;
  dataTask: string; // "DD/MM/YY" or "" if '######'
  idServizio: number;
  descrizioneTask: string | null; // Can be null if not present
  numeroTask: number;
  rateTask: number;
  importoTask: number; // Numerical value, 0.00 if '######'
}

// Project Data
export interface Project {
  id: number;
  idCliente: number;
  dataProg: string; // Start date "DD/MM/AA"
  denominazioneProgetto: string;
  dataFineProgetto: string | null; // End date "DD/MM/AA", can be null
  linkProgetto: string | null;
}


// Active View for page navigation
export type ActiveView = 'dashboard' | 'clienti' | 'progetti' | 'fatture' | 'impostazioni' | 'servizi' | 'googleDrive';


export interface ClientsPageProps {
  clients: Client[];
  invoicesData: Invoice[];
  projectsData: Project[];
  onAddClient: (newClientData: Omit<Client, 'id'>) => void;
  onEditClient: (clientId: number, updatedData: Partial<Client>) => void;
  onDeleteClient: (clientId: number) => void;
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
  // Project handlers for ClientDetailView
  onAddProject: (newProjectData: Omit<Project, 'id'>) => void;
  onEditProject: (projectId: number, updatedData: Partial<Project>) => void;
  onDeleteProject: (projectId: number) => void;
}

export interface ClientDetailViewProps {
  client: Client;
  projects: Project[]; // Already filtered for this client
  invoicesData: Invoice[];
  onGoBack: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: number, clientName: string) => void;
  // Project handlers
  onAddProject: (newProjectData: Omit<Project, 'id'>) => void;
  onEditProject: (projectId: number, updatedData: Partial<Project>) => void;
  onDeleteProject: (projectId: number) => void;
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
}

export interface InvoiceTimelineDataPoint {
  date: Date;
  amount: number;
  invoiceNumber: string;
}

export interface ClientInvoiceTimelineChartProps {
  data: InvoiceTimelineDataPoint[];
}

// Event Calendar Types
export type EventType = 
  'Meeting' | 
  'Scadenza' | 
  'Personale' | 
  'Altro' | 
  'Progetto Inizio' | 
  'Progetto Fine' | 
  'Avviso';

export interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD format
  type: EventType;
  description?: string;
}

export interface CalendarWidgetProps {
  events: Event[];
  onAddEvent: () => void; 
  onEditEvent: (eventId: string, updatedData: Partial<Event>) => void;
  onDeleteEvent: (eventId: string) => void; 
  
  currentSelectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  currentMonth: Date;
  onSetCurrentMonth: (date: Date) => void;
}

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<Event, 'id'>) => void;
  event?: Event | null; // Pass existing event for editing
  selectedDate?: string; // YYYY-MM-DD string for pre-filling date
}

export interface DateTimeDisplayProps {
  // No props needed as it gets current date/time internally
}

export interface ServicesPageProps {
  services: ServiceItem[];
  tasks: TaskItem[];
}

export interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  navItems: SidebarNavItem[];
  activeView: ActiveView;
  onNavItemClick: (viewIdOrAction: ActiveView | 'googleLogin') => void;
  isMobileView: boolean;
}

// Timeline Types for ProjectsPage
export interface TimelinePeriodData {
  monthDate: Date; // Represents the first day of the month
  projectCount: number;
  label: string; // e.g., "Lug '24"
}

export interface ProjectTimelineSliderProps {
  timelinePeriods: TimelinePeriodData[];
  selectedPeriod: Date | null;
  onSelectPeriod: (period: Date | null) => void;
  isTimelineFilterActive: boolean; // New prop
}

// Project Statistics Types
export interface ProjectStats {
  totalProjects: number;
  ongoingProjects: number;
  completedProjects: number;
}

export interface ProjectStatsDisplayProps {
  stats: ProjectStats;
}

export interface ProjectsPageProps {
  projectsData: Project[];
  clientsData: Client[];
  tasksData: TaskItem[];
  servicesData: ServiceItem[];
  projectFiles: ProjectFolder[]; // Added for passing down to ProjectDetailView
  onAddProject: (newProjectData: Omit<Project, 'id'>) => void;
  onEditProject: (projectId: number, updatedData: Partial<Project>) => void;
  onDeleteProject: (projectId: number) => void;
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
  effectiveBackendUrl: string;
  isGoogleLoggedIn: boolean;
  googleDriveUser: GoogleDriveUser | null;
  googleAuthError: string | null;
  onTriggerAuthCheck: () => Promise<boolean>;
  isGoogleDriveFeatureEnabled: boolean;
  // File handlers from App.tsx to be passed down
  onUploadProjectFileApp: (projectId: string, file: File) => void;
  onDeleteProjectFileApp: (projectId: string, fileId: string) => void;
  onDownloadProjectFileApp: (file: ManagedFile) => void;
}

export interface ProjectCardProps {
  project: Project;
  clientName: string;
  onEdit: (project: Project) => void;
  onDelete: (projectId: number, projectName: string) => void;
  onShowDetail: (project: Project) => void;
  totalTasksAmount?: number; // Added for sum of tasks if project is completed
}

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id'>) => void;
  projectToEdit: Project | null;
  clients: Client[];
  initialClientId?: number;
}

export interface ProjectDetailViewProps {
  project: Project;
  clientName: string;
  tasksForProject: TaskItem[];
  servicesData: ServiceItem[];
  onGoBack: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: number, projectName: string) => void;
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
  effectiveBackendUrl: string;
  isGoogleLoggedIn: boolean;
  googleDriveUser: GoogleDriveUser | null;
  googleAuthError: string | null;
  onTriggerAuthCheck: () => Promise<boolean>;
  isGoogleDriveFeatureEnabled: boolean; 
  // Local file management props
  projectLocalFiles: ManagedFile[];
  onUploadProjectFile: (file: File) => void; // projectId is implicit via current project
  onDeleteProjectFile: (fileId: string) => void; // projectId is implicit
  onDownloadProjectFile: (file: ManagedFile) => void;
}

// Google Drive Integration Types
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
  iconLink?: string;
}

export interface GoogleDriveUser {
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleDriveFilesViewerProps {
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
  backendUrl: string;
  initialFolderIdOrUrl?: string;
  isGoogleLoggedIn: boolean;
  googleDriveUser: GoogleDriveUser | null;
  googleAuthError: string | null;
  onTriggerAuthCheck: () => Promise<boolean>; 
}

export interface SettingsPageProps {
    currentEffectiveBackendUrl: string;
    addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
    onExportJSON: () => void;
    onImportJSON: (jsonString: string) => { success: boolean, message: string };
    onExportCSV: () => void; 
    isGoogleLoggedIn: boolean;
    googleDriveUser: GoogleDriveUser | null;
    onGoogleLogin: () => void;
    onGoogleLogout: () => Promise<void>;
    googleAuthIsLoading: boolean;
    googleAuthError: string | null;
    onTriggerAuthCheck: () => Promise<boolean>;
    isGoogleDriveFeatureEnabled: boolean; // Added prop
}

// Weather Widget Types
export interface WeatherData {
  temperature: number;
  description: string;
  icon: string; // OpenWeatherMap icon code
  cityName: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface WeatherWidgetProps {
  addActivityLogEntry: (type: ActivityLogType, description: string, details?: Record<string, any>) => void;
}