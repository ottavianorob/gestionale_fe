

// Augment ImportMeta to include Vite's env variables
interface ImportMetaEnv {
  readonly VITE_REACT_APP_BACKEND_URL?: string; // For user-specified REACT_APP_... via Vite
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_OPENWEATHERMAP_API_KEY?: string; // Added for WeatherWidget
  // Add other environment variables used by Vite here if any
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Responsive as ResponsiveGridLayoutComponent, WidthProvider, Layout } from "react-grid-layout";
import clsx from 'clsx';

// Import configurations
import {
  initialLayoutsDefinition as initialLayoutsConfig, // Using updated layouts
  widgetTitles,
  sidebarNavItems,
  initialMetrics as initialMetricsConfig, 
  availableYearsForFilter
} from './config/dashboard-config';

// Component Imports from new index file
import {
  Sidebar,
  UtilityBar,
  MetricBox,
  SectionTitle,
  TodoItem,
  TaskInputForm,
  FiscalSimulationBox,
  FileManager,
  ChartFilters,
  DragHandle,
  HiddenWidgetsManager,
  NewsTicker,
  ClientsPage,
  CalendarWidget,
  EventModal,
  ServicesPage,
  InvoicesPage,
  ProjectsPage,
  GoogleDriveFilesViewer,
  SettingsPage
} from '../components';

// Chart Component Imports (from subdirectories)
import { MonthlyRevenueChart } from '../components/charts/MonthlyRevenueChart';
import { RevenueCategoryChart } from '../components/charts/RevenueCategoryChart';
import { ExpensesVsRevenueChart } from '../components/charts/ExpensesVsRevenueChart';
import { NetProfitVsFixedCostsChart } from '../components/charts/NetProfitVsFixedCostsChart';

// Type Imports
import type {
  Metric, Activity, Todo, MonthlyRevenueData, RevenueCategoryData, ExpenseRevenueData, FixedExpenseData, NetProfitData,
  SidebarNavItem, FiscalInput, FiscalResult, ActivityLogEntry, ActivityLogType,
  ManagedFile, ProjectFolder, ChartFilterState, HistoricalTask, DashboardLayout, WidgetVisibilityState, CustomLayoutItem,
  NewsTickerItem, Invoice, Client, ServiceItem, TaskItem, ActiveView, Project, Event,
  GoogleDriveFile, GoogleDriveUser
} from '../types';
import {
  ArrowTrendingUpIcon, ArrowTrendingDownIcon,
  BellIcon, EnvelopeIcon, CogIcon, Bars3Icon
} from '../components/icons';

const ReactGridLayout = WidthProvider(ResponsiveGridLayoutComponent);

const WIDGET_VISIBILITY_STORAGE_KEY = "dashboardWidgetVisibility_v3"; 
const LAYOUT_STORAGE_KEY = "dashboardLayouts_v11"; 

// --- Global flag to enable/disable Google Drive features ---
const IS_GOOGLE_DRIVE_ENABLED = false;


const appBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const appCols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

const appMargins: Record<string, [number, number]> = {
  lg: [18, 18],
  md: [16, 16],
  sm: [12, 12],
  xs: [10, 10],
  xxs: [8, 8],
};


const MOBILE_BREAKPOINT = 768; 
const DEFAULT_BACKEND_URL = "https://gestionale-backend-0z09.onrender.com";

// Helper function to safely join URL paths
const joinUrlPath = (base: string, path: string): string => {
  if (!base || typeof base !== 'string' || !base.trim().startsWith('http')) {
    console.error("Base URL for joinUrlPath is invalid.", `Base: "${base}"`);
    return `INVALID_BACKEND_URL/${path.replace(/^\/+/, '')}`;
  }
  try {
    const baseUrlEnsuredSlash = base.endsWith('/') ? base : base + '/';
    const relativePath = path.startsWith('/') ? path.substring(1) : path;
    const fullUrl = new URL(relativePath, baseUrlEnsuredSlash);
    return fullUrl.toString();
  } catch (e: any) {
    console.error("Error constructing URL in joinUrlPath:", e.message, "Base:", base, "Path:", path);
    return `URL_CONSTRUCTION_ERROR/${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }
};


const App = (): JSX.Element => {
  const [isAppLoading, setIsAppLoading] = useState(true); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [isLayoutEditMode, setIsLayoutEditMode] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [currentRGLBreakpoint, setCurrentRGLBreakpoint] = useState<string>('lg'); 
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  // --- Backend URL Configuration ---
  const viteEnv = (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') 
                  ? import.meta.env 
                  : {} as ImportMetaEnv; 
  
  const backendUrlFromReactAppEnv = viteEnv.VITE_REACT_APP_BACKEND_URL;
  const backendUrlFromViteEnv = viteEnv.VITE_BACKEND_URL;
  
  const effectiveBackendUrl = useMemo(() => {
    const urlFromReactApp = backendUrlFromReactAppEnv && backendUrlFromReactAppEnv.trim() !== '' ? backendUrlFromReactAppEnv.trim() : null;
    const urlFromVite = backendUrlFromViteEnv && backendUrlFromViteEnv.trim() !== '' ? backendUrlFromViteEnv.trim() : null;
    
    return urlFromReactApp || urlFromVite || DEFAULT_BACKEND_URL;
  }, [backendUrlFromReactAppEnv, backendUrlFromViteEnv]);

  useEffect(() => {
    const urlFromReactApp = backendUrlFromReactAppEnv && backendUrlFromReactAppEnv.trim() !== '' ? backendUrlFromReactAppEnv.trim() : null;
    const urlFromVite = backendUrlFromViteEnv && backendUrlFromViteEnv.trim() !== '' ? backendUrlFromViteEnv.trim() : null;
    if (!urlFromReactApp && !urlFromVite) {
      console.info(
        `[APP_CONFIG_INFO] Nessun URL backend specificato tramite VITE_REACT_APP_BACKEND_URL o VITE_BACKEND_URL. L'applicazione utilizzerà l'URL di fallback: ${DEFAULT_BACKEND_URL}. Per un ambiente di produzione o test, assicurati di configurare l'URL corretto del tuo backend.`
      );
    }
  }, [backendUrlFromReactAppEnv, backendUrlFromViteEnv]);


  // --- Google Drive Auth State ---
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false);
  const [googleDriveUser, setGoogleDriveUser] = useState<GoogleDriveUser | null>(null);
  const [googleAuthActionIsLoading, setGoogleAuthActionIsLoading] = useState(false); 
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);


  // --- Data States ---
  const [metricsData, setMetricsData] = useState<Metric[]>(initialMetricsConfig);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [newsTickerItems, setNewsTickerItems] = useState<NewsTickerItem[]>([]);
  const [baseMonthlyRevenueData, setBaseMonthlyRevenueData] = useState<MonthlyRevenueData[]>([]);
  const [baseRevenueCategoryData, setBaseRevenueCategoryData] = useState<RevenueCategoryData[]>([]);
  const [baseExpenseRevenueData, setBaseExpenseRevenueData] = useState<ExpenseRevenueData[]>([]);
  const [baseFixedExpensesData, setBaseFixedExpensesData] = useState<FixedExpenseData[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projectFiles, setProjectFiles] = useState<ProjectFolder[]>([]);
  const [historicalTasks, setHistoricalTasks] = useState<HistoricalTask[]>([]);
  const [formClients, setFormClients] = useState<string[]>([]);
  const [invoicesData, setInvoicesData] = useState<Invoice[]>([]);
  const [clientsData, setClientsData] = useState<Client[]>([]);
  const [servicesData, setServicesData] = useState<ServiceItem[]>([]);
  const [tasksData, setTasksData] = useState<TaskItem[]>([]);
  const [projectsData, setProjectsData] = useState<Project[]>([]);
  const [eventsData, setEventsData] = useState<Event[]>([]);

  // --- Calendar Specific State ---
  const [calendarCurrentMonth, setCalendarCurrentMonth] = useState(new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date | null>(new Date());
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventForModal, setEditingEventForModal] = useState<Event | null>(null);


  // --- Derived and Filter States ---
  const [chartFilters, setChartFilters] = useState<ChartFilterState>({ selectedYear: 'all', selectedClient: 'all' });
  const [availableChartClients, setAvailableChartClients] = useState<string[]>([]);

  const addActivityLogEntry = useCallback((type: ActivityLogType, description: string, details?: Record<string, any>): void => {
    const newEntry: ActivityLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
      timestamp: new Date().toLocaleString('it-IT'),
      user: 'Roberto Ottaviano', 
      type,
      description,
      details,
    };
    setActivityLog(prev => [newEntry, ...prev].slice(0, 100)); 
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobileView(mobile);
      if (mobile && isSidebarOpen) {
         // setIsSidebarOpen(false); // Let it stay on mobile if it was open
      } else if (!mobile) {
         setIsSidebarOpen(false); 
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]); 

  // --- Google Auth Functions ---
  const checkGoogleAuthStatus = useCallback(async (isInitialAppLoadCheck = false): Promise<boolean> => {
    if (!IS_GOOGLE_DRIVE_ENABLED) {
      if (!isInitialAppLoadCheck) setGoogleAuthActionIsLoading(false);
      setIsGoogleLoggedIn(false);
      setGoogleDriveUser(null);
      setGoogleAuthError("Funzionalità Google Drive disabilitata.");
      return false;
    }

    if (!isInitialAppLoadCheck) setGoogleAuthActionIsLoading(true);
    setGoogleAuthError(null);

    let envSource = `predefinito ('${DEFAULT_BACKEND_URL}')`;
    if (backendUrlFromReactAppEnv && backendUrlFromReactAppEnv.trim() !== '') {
        envSource = `VITE_REACT_APP_BACKEND_URL ('${backendUrlFromReactAppEnv}')`;
    } else if (backendUrlFromViteEnv && backendUrlFromViteEnv.trim() !== '') {
        envSource = `VITE_BACKEND_URL ('${backendUrlFromViteEnv}')`;
    }

    if (!effectiveBackendUrl || !effectiveBackendUrl.startsWith('http') || effectiveBackendUrl.includes('localhost') || effectiveBackendUrl.includes('BACKEND_URL_NOT_CONFIGURED')) {
      let msg = "URL Backend non valido/configurato per Google Auth.";
      if (effectiveBackendUrl && effectiveBackendUrl.includes('localhost')) msg = `URL Backend ('${effectiveBackendUrl}') punta a localhost. Non funzionerà per Google Auth se il frontend è online. Configura un URL pubblico (tramite variabile d'ambiente VITE_REACT_APP_BACKEND_URL o VITE_BACKEND_URL).`;
      setGoogleAuthError(msg);
      addActivityLogEntry('GOOGLE_AUTH', 'Controllo autenticazione fallito: URL backend non valido o localhost.', { backendUrl: effectiveBackendUrl, source: envSource });
      setIsGoogleLoggedIn(false);
      setGoogleDriveUser(null);
      if (!isInitialAppLoadCheck) setGoogleAuthActionIsLoading(false);
      return false;
    }

    const authStatusUrl = joinUrlPath(effectiveBackendUrl, '/auth/status');

    if (authStatusUrl.startsWith('INVALID_BACKEND_URL') || authStatusUrl.startsWith('URL_CONSTRUCTION_ERROR')) {
      const detailedMsg = `L'URL del backend fornito ('${effectiveBackendUrl}', da ${envSource}) è malformato o incompleto, risultando in: ${authStatusUrl}. Impossibile costruire un URL valido per l'autenticazione. Controlla la configurazione dell'URL del backend (VITE_REACT_APP_BACKEND_URL, VITE_BACKEND_URL o il default).`;
      setGoogleAuthError(detailedMsg);
      addActivityLogEntry('GOOGLE_AUTH', 'Controllo autenticazione fallito: URL backend non processabile.', { backendUrl: effectiveBackendUrl, source: envSource, constructedUrl: authStatusUrl });
      setIsGoogleLoggedIn(false);
      setGoogleDriveUser(null);
      if (!isInitialAppLoadCheck) setGoogleAuthActionIsLoading(false);
      return false;
    }
    
    console.log(
      `[AUTH_STATUS_CHECK] Attempting to fetch: ${authStatusUrl}`,
      `Effective Backend URL used: ${effectiveBackendUrl}`,
      `Current Frontend Origin: ${window.location.origin}`
    );

    try {
      const response = await fetch(authStatusUrl, { credentials: 'include' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Auth status check failed" }));
        if (!isInitialAppLoadCheck || !googleAuthError) {
          setGoogleAuthError(errorData.message || `Errore HTTP ${response.status} durante il controllo dello stato auth.`);
        }
        throw new Error(errorData.message || `HTTP error ${response.status}`);
      }
      const data = await response.json();
      
      const prevLoggedIn = isGoogleLoggedIn;
      setIsGoogleLoggedIn(data.isAuthenticated);
      setGoogleDriveUser(data.user || null);
      if(data.isAuthenticated) setGoogleAuthError(null);
      
      if (!prevLoggedIn && data.isAuthenticated && data.user) {
          addActivityLogEntry('GOOGLE_AUTH', `Login Google riuscito per ${data.user?.email}.`);
      } else if (isInitialAppLoadCheck && data.isAuthenticated && data.user && !googleDriveUser) { 
          addActivityLogEntry('GOOGLE_AUTH', `Autenticato con Google come ${data.user?.email}.`);
      } else if (isInitialAppLoadCheck && !data.isAuthenticated && data.error && !googleAuthError) {
        console.warn("Auth status check returned error:", data.error);
        setGoogleAuthError(data.error);
      }
      return data.isAuthenticated;
    } catch (err: any) {
      console.error("Error checking auth status:", err);
      setIsGoogleLoggedIn(false);
      setGoogleDriveUser(null);
      let specificError = `Impossibile verificare lo stato dell'autenticazione Google: ${err.message}`;
      if (err instanceof TypeError && (err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("load failed"))) {
        specificError = `ERRORE DI CONNESSIONE O CORS ("Load failed" / "Failed to fetch") verso '${effectiveBackendUrl}' durante il controllo auth.

USA LA CONSOLE DEL BROWSER (scheda Network per dettagli CORS) E I LOG DEL SERVER BACKEND PER RISOLVERE!

1. URL Backend: Assicurati che '${effectiveBackendUrl}' (da ${envSource}) sia l'URL corretto, pubblico e in esecuzione del tuo backend. Controlla i log del backend per errori all'avvio.

2. CORS SUL BACKEND (CAUSA PIÙ COMUNE):
   - L'origine del tuo frontend è: \`${window.location.origin}\` (visualizzato qui e nella console del browser).
   - **ISPEZIONA I LOG DEL TUO SERVER BACKEND (RENDER.COM O ALTROVE):** Il file 'server.js' è stato configurato per loggare l'origine ESATTA di ogni richiesta in arrivo (cerca messaggi come "Auth status request from origin: [valore effettivo ricevuto]").
   - Questo valore dell'header 'Origin' ricevuto dal backend DEVE CORRISPONDERE ESATTAMENTE alla variabile d'ambiente \`FRONTEND_URL\` che hai impostato sul tuo server backend. Controlla maiuscole/minuscole, http/https, e slash finali. Se non corrispondono, CORS fallirà.

3. CONSOLE DEL BROWSER (Scheda Rete): Ispeziona la richiesta fallita a \`${authStatusUrl}\` per messaggi di errore CORS dettagliati. Questi messaggi del browser sono FONDAMENTALI per capire se l'errore è dovuto a origini non consentite (CORS) o altri problemi di rete.

Questo errore indica un problema di configurazione o connettività tra frontend e backend che devi risolvere nel tuo ambiente server.`;
      }
      if (!isInitialAppLoadCheck || !googleAuthError) setGoogleAuthError(specificError);
      addActivityLogEntry('GOOGLE_AUTH', `Errore controllo auth: ${err.message}`); 
      return false;
    } finally {
      if (!isInitialAppLoadCheck) setGoogleAuthActionIsLoading(false);
    }
  }, [addActivityLogEntry, effectiveBackendUrl, isGoogleLoggedIn, googleDriveUser, googleAuthError, backendUrlFromReactAppEnv, backendUrlFromViteEnv]);

  const handleGoogleLogin = useCallback(() => {
    if (!IS_GOOGLE_DRIVE_ENABLED) {
      setGoogleAuthError("Funzionalità Google Drive disabilitata.");
      return;
    }
    if (!effectiveBackendUrl || !effectiveBackendUrl.startsWith('http') || effectiveBackendUrl.includes('localhost') || effectiveBackendUrl.includes('BACKEND_URL_NOT_CONFIGURED') || effectiveBackendUrl.includes('INVALID_BACKEND_URL')) {
      let msg = "L'URL del backend non è configurato o non è valido. Controlla le variabili d'ambiente (VITE_REACT_APP_BACKEND_URL, VITE_BACKEND_URL) o il default.";
       if (effectiveBackendUrl && effectiveBackendUrl.includes('localhost')) {
           msg = `L'URL del backend (${effectiveBackendUrl}) punta a localhost e non funzionerà per Google Auth se il frontend è online. Configura un URL pubblico.`;
        }
      setGoogleAuthError(msg);
      return;
    }
    addActivityLogEntry('GOOGLE_AUTH', 'Tentativo di login con Google iniziato.');
    setGoogleAuthError(null);
    setGoogleAuthActionIsLoading(true); 
    window.location.href = joinUrlPath(effectiveBackendUrl, '/auth/google');
  }, [effectiveBackendUrl, addActivityLogEntry]);

  const handleGoogleLogout = useCallback(async () => {
    if (!IS_GOOGLE_DRIVE_ENABLED) {
      setGoogleAuthError("Funzionalità Google Drive disabilitata.");
      return;
    }
    if (!effectiveBackendUrl || !effectiveBackendUrl.startsWith('http') || effectiveBackendUrl.includes('localhost') || effectiveBackendUrl.includes('BACKEND_URL_NOT_CONFIGURED') || effectiveBackendUrl.includes('INVALID_BACKEND_URL')) {
      setGoogleAuthError("URL Backend non valido per il logout.");
      return;
    }
    setGoogleAuthActionIsLoading(true);
    setGoogleAuthError(null);
    try {
      const logoutUrl = joinUrlPath(effectiveBackendUrl, '/auth/logout');
      await fetch(logoutUrl, { method: 'POST', credentials: 'include' });
      setIsGoogleLoggedIn(false);
      setGoogleDriveUser(null);
      addActivityLogEntry('GOOGLE_AUTH', 'Logout da Google effettuato.');
    } catch (err: any) {
      console.error("Error logging out from Google:", err);
      let logoutError = `Errore durante il logout: ${err.message}`;
      if (err instanceof TypeError && (err.message.toLowerCase().includes("failed to fetch") || err.message.toLowerCase().includes("load failed"))) {
        logoutError = `Errore di connessione al server backend (${effectiveBackendUrl}) during logout. 
This indicates the browser could not reach the server or the request was blocked (possibly CORS).

1. Ensure backend server is running at '${effectiveBackendUrl}'.
2. Verify \`FRONTEND_URL\` on backend matches \`${window.location.origin}\` for CORS.
3. Check network connectivity.
4. Inspect backend server logs for errors.`;
      }
      setGoogleAuthError(logoutError);
      addActivityLogEntry('GOOGLE_AUTH', `Errore logout: ${logoutError}`);
    } finally {
      setGoogleAuthActionIsLoading(false);
    }
  }, [effectiveBackendUrl, addActivityLogEntry]);


  useEffect(() => {
    const processAuthFlow = async () => {
      if (!IS_GOOGLE_DRIVE_ENABLED) {
        setIsGoogleLoggedIn(false);
        setGoogleDriveUser(null);
        return;
      }
      const queryParams = new URLSearchParams(window.location.search);
      const currentPathname = window.location.pathname;
      const authSuccessParam = queryParams.get('auth_success') === 'true';
      const authErrorParam = queryParams.get('auth_error') === 'true';
      const isOnAuthSuccessPath = currentPathname === '/auth-success';

      let wasAuthRedirect = false;

      if (authSuccessParam || (isOnAuthSuccessPath && !authErrorParam)) {
        wasAuthRedirect = true;
        addActivityLogEntry('GOOGLE_AUTH', `Auth success redirect (Path: ${currentPathname}, SuccessParam: ${authSuccessParam}). Verifying...`);
        const authenticated = await checkGoogleAuthStatus(false); 
        if (authenticated) {
          setActiveView('dashboard');
        } else {
          if (!googleAuthError) {
            const errMsg = 'Autenticazione Google non riuscita dopo il redirect. Riprova.';
            setGoogleAuthError(errMsg); 
            addActivityLogEntry('GOOGLE_AUTH', `Verifica post-redirect fallita: ${errMsg}`);
          }
          setActiveView('impostazioni');
        }
      } else if (authErrorParam) {
        wasAuthRedirect = true;
        const message = queryParams.get('message') || 'Errore sconosciuto dal backend.';
        const detailedMsg = `Autenticazione Google fallita (dal backend): ${message}.`;
        setGoogleAuthError(detailedMsg);
        addActivityLogEntry('GOOGLE_AUTH', `Errore redirect Google: ${message}.`);
        setActiveView('impostazioni');
      }

      if (wasAuthRedirect) {
        const newUrl = window.location.origin + (window.location.hash || ''); 
        window.history.replaceState({}, document.title, newUrl);
      } else {
        await checkGoogleAuthStatus(true);
      }
    };

    if (effectiveBackendUrl) { 
      processAuthFlow();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveBackendUrl]); 


  // --- Data Fetching Effect ---
  useEffect(() => {
    const fetchData = async () => {
      if(!isAppLoading) return; 

      try {
        const processResponse = async (url: string) => {
          const response = await fetch(url);
          if (!response.ok) {
            const errorText = await response.text().catch(() => "Could not retrieve error body.");
            const errorBodySnippet = errorText.length > 200 ? errorText.substring(0, 200) + "..." : errorText;
            console.error(`[APP_DATA_FETCH_ERROR] Failed to fetch ${url}: ${response.status} ${response.statusText}. Body: ${errorBodySnippet}`);
            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}. Body: ${errorBodySnippet}`);
          }
          
          const responseBodyText: string = await response.text(); 
          
          try {
            if (responseBodyText.trim() === '') { 
                console.warn(`[APP_DATA_FETCH_WARN] Empty response body for URL: ${url}. Returning null or default.`);
                if (url.includes('news-ticker.json')) return { items: [] }; 
                const arrayReturnEndpoints = [
                    'activity-log.json', 'todos.json', 'project-files.json', 'historical-tasks.json',
                    'form-clients.json', 'invoices.json', 'clients.json', 'services.json',
                    'tasks.json', 'projects.json', 'events.json', 'monthly-revenue.json',
                    'revenue-categories.json', 'expense-revenue.json', 'fixed-expenses.json',
                    'initial-metrics.json'
                ];
                if (arrayReturnEndpoints.some(endpoint => url.endsWith(endpoint))) return [];
                return null; 
            }
            return JSON.parse(responseBodyText);
          } catch (e: any) {
            const responseBodySnippet = responseBodyText.length > 500 ? responseBodyText.substring(0, 500) + "..." : responseBodyText;
            console.error(`[APP_DATA_PARSE_ERROR] Failed to parse JSON from ${url} (Status: ${response.status} ${response.statusText}). Error: ${e.message}. Response body snippet: ${responseBodySnippet}`);
            throw new Error(`Failed to parse JSON from ${url} (Status: ${response.status} ${response.statusText}). Error: ${e.message}. Response body snippet: ${responseBodySnippet}`);
          }
        };

        const [
          activityLogRes, newsTickerRes, monthlyRevenueRes, revenueCategoriesRes,
          expenseRevenueRes, fixedExpensesRes, todosRes, projectFilesRes,
          historicalTasksRes, formClientsRes, invoicesRes, clientsRes, servicesRes, tasksRes, projectsRes, eventsRes,
          initialMetricsRes
        ] = await Promise.all([
          processResponse('/data/activity-log.json'),
          processResponse('/data/news-ticker.json'),
          processResponse('/data/monthly-revenue.json'),
          processResponse('/data/revenue-categories.json'),
          processResponse('/data/expense-revenue.json'),
          processResponse('/data/fixed-expenses.json'),
          processResponse('/data/todos.json'),
          processResponse('/data/project-files.json'),
          processResponse('/data/historical-tasks.json'),
          processResponse('/data/form-clients.json'),
          processResponse('/data/invoices.json'),
          processResponse('/data/clients.json'),
          processResponse('/data/services.json'),
          processResponse('/data/tasks.json'),
          processResponse('/data/projects.json'),
          processResponse('/data/events.json'),
          processResponse('/data/initial-metrics.json')
        ]);
        
        setMetricsData(initialMetricsRes as Metric[] || initialMetricsConfig);
        setActivityLog(activityLogRes as ActivityLogEntry[] || []);
        
        let parsedNewsItems: NewsTickerItem[] = [];
        if (newsTickerRes) {
          const itemsSource = (newsTickerRes as any).items !== undefined && Array.isArray((newsTickerRes as any).items)
            ? (newsTickerRes as any).items
            : Array.isArray(newsTickerRes)
            ? newsTickerRes
            : null;

          if (itemsSource && Array.isArray(itemsSource)) {
            parsedNewsItems = (itemsSource as any[]).reduce((acc: NewsTickerItem[], item: any) => {
              if (item && typeof item.id === 'string' && 
                  typeof item.mainText === 'string' && 
                  typeof item.category === 'string' && 
                  typeof item.timestamp === 'string') {
                acc.push({
                  id: item.id,
                  category: item.category,
                  mainText: item.mainText,
                  timestamp: item.timestamp,
                  ...(item.categoryColor && { categoryColor: String(item.categoryColor) }),
                  ...(item.secondaryText && { secondaryText: String(item.secondaryText) }),
                } as NewsTickerItem);
              }
              return acc;
            }, []);
          } else {
            console.warn('[APP_DATA_FETCH_WARN] newsTickerRes data is not in a recognized array format or "items" property:', newsTickerRes);
          }
        }
        setNewsTickerItems(parsedNewsItems);

        setBaseMonthlyRevenueData(monthlyRevenueRes as MonthlyRevenueData[] || []);
        setBaseRevenueCategoryData(revenueCategoriesRes as RevenueCategoryData[] || []);
        setBaseExpenseRevenueData(expenseRevenueRes as ExpenseRevenueData[] || []);
        setBaseFixedExpensesData(fixedExpensesRes as FixedExpenseData[] || []);
        setTodos(todosRes as Todo[] || []);
        setProjectFiles(projectFilesRes as ProjectFolder[] || []);
        setHistoricalTasks(historicalTasksRes as HistoricalTask[] || []);
        setFormClients(formClientsRes as string[] || []);
        setInvoicesData(invoicesRes as Invoice[] || []);
        setClientsData(clientsRes as Client[] || []);
        setServicesData(servicesRes as ServiceItem[] || []);
        setTasksData(tasksRes as TaskItem[] || []); 
        setProjectsData(projectsRes as Project[] || []);
        setEventsData(eventsRes as Event[] || []);


        if (revenueCategoriesRes && Array.isArray(revenueCategoriesRes) && (revenueCategoriesRes as RevenueCategoryData[]).length > 0) {
          setAvailableChartClients(
            Array.from(new Set((revenueCategoriesRes as RevenueCategoryData[]).map((d: RevenueCategoryData) => d.client).filter(Boolean) as string[]))
          );
        }
        
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        addActivityLogEntry('DATA_EXPORT', `Errore caricamento dati: ${(error as Error).message}`);
      } finally {
        setIsAppLoading(false); 
      }
    };
    if(effectiveBackendUrl && isAppLoading) {
        fetchData();
    }
  }, [addActivityLogEntry, effectiveBackendUrl, isAppLoading]); 


  // --- Chart Data Filtering Logic ---
  const handleFilterChange = useCallback((filters: Partial<ChartFilterState>) => {
    setChartFilters(prev => ({ ...prev, ...filters }));
    addActivityLogEntry('DATA_EXPORT', `Filtri grafici aggiornati: Anno ${filters.selectedYear || 'Tutti'}, Cliente ${filters.selectedClient || 'Tutti'}`);
  }, [addActivityLogEntry]);

  const getFilteredData = <T extends { year: number; client?: string }>(data: T[]): T[] => {
    return data.filter(item =>
      (chartFilters.selectedYear === 'all' || item.year === Number(chartFilters.selectedYear)) &&
      (chartFilters.selectedClient === 'all' || !item.client || item.client === chartFilters.selectedClient)
    );
  };

  const filteredMonthlyRevenueData = getFilteredData(baseMonthlyRevenueData);
  const filteredRevenueCategoryData = getFilteredData(baseRevenueCategoryData);
  const filteredExpenseRevenueData = getFilteredData(baseExpenseRevenueData);
  const filteredFixedExpensesData = getFilteredData(baseFixedExpensesData);

  const netProfitData: NetProfitData[] = filteredExpenseRevenueData.map(er => {
    const fixed = filteredFixedExpensesData.find(fe => fe.month === er.month && fe.year === er.year)?.cost || 0;
    return {
      month: er.month,
      year: er.year,
      netProfit: er.revenue - er.expenses - fixed,
      fixedExpenses: fixed
    };
  });

  // --- Layout and Widget Visibility State & Handlers ---
  const [layouts, setLayouts] = useState(() => {
    const savedLayouts = localStorage.getItem(LAYOUT_STORAGE_KEY);
    try {
        if (savedLayouts) {
            const parsed = JSON.parse(savedLayouts);
            if (typeof parsed === 'object' && parsed !== null && parsed.lg && Array.isArray(parsed.lg)) {
                const currentWidgetKeys = new Set(initialLayoutsConfig.lg.map(item => item.i));
                const savedLgKeys = new Set(parsed.lg.map((item: CustomLayoutItem) => item.i));
                
                let allKeysPresentAndMatchCount = true;
                if (currentWidgetKeys.size !== savedLgKeys.size) {
                    allKeysPresentAndMatchCount = false;
                } else {
                    for(const key of currentWidgetKeys) {
                        if(!savedLgKeys.has(key)){
                            allKeysPresentAndMatchCount = false;
                            break;
                        }
                    }
                }

                if(allKeysPresentAndMatchCount) return parsed;
                 else {
                    console.warn("Mismatch between saved layout keys and default layout keys. Reverting to default.");
                 }
            }
        }
    } catch (e) {
        console.error("Failed to parse saved layouts, reverting to default:", e);
    }
    return JSON.parse(JSON.stringify(initialLayoutsConfig)); 
  });
  
  const defaultWidgetVisibility = useMemo(() => {
    const defaultVisibility: WidgetVisibilityState = {};
    const allWidgetKeysFromLayout = new Set<string>();
  
    Object.values(initialLayoutsConfig).forEach(layoutArray => {
        layoutArray.forEach(item => {
            allWidgetKeysFromLayout.add(item.i);
            const lgLayoutItem = initialLayoutsConfig.lg.find(lgItem => lgItem.i === item.i);
            if (lgLayoutItem && lgLayoutItem.defaultVisible !== undefined) {
                defaultVisibility[item.i] = lgLayoutItem.defaultVisible;
            } else if (item.defaultVisible !== undefined && defaultVisibility[item.i] === undefined) {
                 defaultVisibility[item.i] = item.defaultVisible;
            } else if (defaultVisibility[item.i] === undefined) {
                 defaultVisibility[item.i] = true; 
            }
        });
    });
  
    initialMetricsConfig.forEach(metric => {
        const metricWidgetId = `metric-${metric.id}`;
        if (!allWidgetKeysFromLayout.has(metricWidgetId)) { 
            defaultVisibility[metricWidgetId] = true; 
        }
    });
    
    if(widgetTitles.googleDriveViewer && !allWidgetKeysFromLayout.has('googleDriveViewer')) {
        const lgLayoutItemForDrive = initialLayoutsConfig.lg.find(item => item.i === 'googleDriveViewer');
        defaultVisibility['googleDriveViewer'] = lgLayoutItemForDrive?.defaultVisible ?? true;
    }
    return defaultVisibility;
  }, []);


  const [widgetVisibility, setWidgetVisibility] = useState<WidgetVisibilityState>(() => {
    const savedVisibility = localStorage.getItem(WIDGET_VISIBILITY_STORAGE_KEY);
    if (savedVisibility) {
        try {
            const parsedVisibility = JSON.parse(savedVisibility);
            if (typeof parsedVisibility === 'object' && parsedVisibility !== null && !Array.isArray(parsedVisibility)) {
                const validSavedVisibility: WidgetVisibilityState = { ...defaultWidgetVisibility }; 
                Object.keys(defaultWidgetVisibility).forEach(key => {
                    if (parsedVisibility[key] !== undefined && typeof parsedVisibility[key] === 'boolean') { 
                        validSavedVisibility[key] = parsedVisibility[key];
                    } else if (parsedVisibility[key] !== undefined) {
                        console.warn(`Invalid visibility value for widget "${key}" in localStorage. Using default.`);
                    }
                });
                return validSavedVisibility;
            }
        } catch (e) {
            console.error("Failed to parse saved widget visibility, reverting to default:", e);
        }
    }
    return defaultWidgetVisibility;
  });


  const onLayoutChange = (currentLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
    if(isLayoutEditMode) { 
        if (typeof allLayouts === 'object' && allLayouts !== null && Object.keys(allLayouts).length > 0) {
            const sanitizedLayouts: Record<string, CustomLayoutItem[]> = {};
            for (const breakpointKey in allLayouts) {
                if (Array.isArray(allLayouts[breakpointKey])) {
                    sanitizedLayouts[breakpointKey] = allLayouts[breakpointKey] as CustomLayoutItem[];
                }
            }
            if (Object.keys(sanitizedLayouts).length > 0) {
                 setLayouts(sanitizedLayouts);
            }
        }
    }
  };

  const toggleLayoutEditMode = () => {
    setIsLayoutEditMode(prev => {
        const newMode = !prev;
        if (!newMode && activeView === 'dashboard') { 
             try {
                localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
                localStorage.setItem(WIDGET_VISIBILITY_STORAGE_KEY, JSON.stringify(widgetVisibility));
                addActivityLogEntry('LAYOUT_CHANGE', "Layout e visibilità widget salvati.");
            } catch (e) {
                console.error("Failed to save layouts/visibility to localStorage:", e);
                addActivityLogEntry('LAYOUT_CHANGE', "Errore nel salvataggio del layout/visibilità.");
            }
        } else if (newMode && activeView === 'dashboard') {
            addActivityLogEntry('LAYOUT_CHANGE', "Modalità modifica layout attivata.");
        }
        return newMode;
    });
  };

  const handleToggleWidgetVisibility = (widgetId: string) => {
    setWidgetVisibility(prev => {
        const newVisibility = { ...prev, [widgetId]: !prev[widgetId] };
        addActivityLogEntry('WIDGET_VISIBILITY_CHANGE', `Visibilità widget "${widgetTitles[widgetId] || widgetId}" ${newVisibility[widgetId] ? 'abilitata' : 'disabilitata'}.`);
        return newVisibility;
    });
  };

  // --- View Management ---
  const handleViewChange = (viewOrAction: ActiveView | 'googleLogin') => {
    if (viewOrAction === 'googleLogin') {
        setActiveView('impostazioni'); 
        addActivityLogEntry('LAYOUT_CHANGE', `Navigazione a Impostazioni per login Google.`);
        if (isMobileView && isSidebarOpen) setIsSidebarOpen(false);
        return;
    }
    
    const view = viewOrAction as ActiveView;
    setActiveView(view);
    addActivityLogEntry('LAYOUT_CHANGE', `Navigazione alla vista: ${view}`);
    if (view !== 'dashboard' && isLayoutEditMode) { 
        setIsLayoutEditMode(false); 
    }
    if (isMobileView && isSidebarOpen) {
        setIsSidebarOpen(false); 
    }
  };

  // --- TODO Handlers ---
  const handleToggleTodo = (id: string) => {
    setTodos(prevTodos =>
      prevTodos.map(todo => {
        if (todo.id === id) {
          const updatedTodo = { ...todo, completed: !todo.completed };
          addActivityLogEntry('TASK_UPDATE', `Task "${updatedTodo.task}" ${updatedTodo.completed ? 'completato' : 'riaperto'}.`, { taskId: id });
          return updatedTodo;
        }
        return todo;
      })
    );
  };
  const handleAddTodo = (newTaskData: Omit<Todo, 'id' | 'completed'| 'createdAt'>) => {
    const newTodo: Todo = {
        ...newTaskData,
        id: `todo_${Date.now()}`, 
        completed: false,
        createdAt: new Date().toISOString(),
    };
    setTodos(prev => [newTodo, ...prev]);
    addActivityLogEntry('TASK_CREATE', `Nuovo task aggiunto: "${newTodo.task}"`, { taskId: newTodo.id, client: newTodo.client, urgency: newTodo.urgency });
  };
  const handleDeleteTodo = (id: string) => {
    const taskToDelete = todos.find(t => t.id === id);
    setTodos(prev => prev.filter(todo => todo.id !== id));
    if (taskToDelete) {
      addActivityLogEntry('TASK_DELETE', `Task "${taskToDelete.task}" eliminato.`, { taskId: id });
    }
  };
   const handleUpdateTodo = (id: string, updates: Partial<Todo>) => {
     setTodos(prev => prev.map(t => t.id === id ? {...t, ...updates} : t));
     addActivityLogEntry('TASK_UPDATE', `Task ID ${id} aggiornato.`, { taskId: id, updates });
   };


  // --- Other Handlers ---
  const handleFiscalSimulation = (input: FiscalInput, result: FiscalResult) => {
    addActivityLogEntry('FISCAL_SIM', 'Simulazione fiscale eseguita.', { input, result });
  };

  const handleFileUpload = async (projectId: string, file: File) => {
    addActivityLogEntry('FILE_UPLOAD', `Tentativo di caricamento file "${file.name}" per progetto ID ${projectId}.`);

    if (!effectiveBackendUrl || !effectiveBackendUrl.startsWith('http') || effectiveBackendUrl.includes('INVALID_BACKEND_URL') || effectiveBackendUrl.includes('URL_CONSTRUCTION_ERROR')) {
      console.error('handleFileUpload: URL Backend non valido o non configurato.', `URL: ${effectiveBackendUrl}`);
      addActivityLogEntry('FILE_UPLOAD', `Caricamento file "${file.name}" fallito: URL backend non valido.`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file); 

    const uploadUrl = joinUrlPath(effectiveBackendUrl, '/upload');
    if (uploadUrl.startsWith('INVALID_BACKEND_URL') || uploadUrl.startsWith('URL_CONSTRUCTION_ERROR')) {
        console.error('handleFileUpload: Costruzione URL di upload fallita.', `Base: ${effectiveBackendUrl}, Path: /upload, Risultato: ${uploadUrl}`);
        addActivityLogEntry('FILE_UPLOAD', `Caricamento file "${file.name}" fallito: URL di upload non costruibile.`);
        return;
    }


    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        credentials: 'include', 
      });

      if (response.ok) {
        const newFile: ManagedFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'img' : (file.type === 'application/pdf' ? 'pdf' : 'generic'),
          size: `${(file.size / 1024).toFixed(1)}KB`,
          path: '/', 
          uploadDate: new Date().toLocaleDateString('it-IT'),
          isFolder: false,
        };

        setProjectFiles(prevProjectFiles => {
          const projectIndex = prevProjectFiles.findIndex(p => p.id === projectId);
          if (projectIndex > -1) {
            return prevProjectFiles.map((p, index) =>
              index === projectIndex
                ? { ...p, files: [newFile, ...(p.files || [])].sort((a,b) => a.name.localeCompare(b.name)) }
                : p
            );
          } else {
            const currentProjectData = projectsData.find(p => p.id.toString() === projectId);
            const currentProjectName = currentProjectData ? currentProjectData.denominazioneProgetto : `Progetto ${projectId}`;
            const newProjectFolder: ProjectFolder = {
                id: projectId, 
                name: currentProjectName, 
                files: [newFile].sort((a,b) => a.name.localeCompare(b.name))
            };
            return [...prevProjectFiles, newProjectFolder];
          }
        });
        const projectNameForLog = projectFiles.find(p=>p.id === projectId)?.name || projectsData.find(p => p.id.toString() === projectId)?.denominazioneProgetto || `ID ${projectId}`;
        addActivityLogEntry('FILE_UPLOAD', `File "${newFile.name}" caricato con successo per progetto ${projectNameForLog}.`);

      } else {
        const errorText = await response.text().catch(() => `Errore HTTP ${response.status} durante l'upload.`);
        let errorDetail = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            errorDetail = errorJson.message || errorJson.error || errorText;
        } catch (e) { /* Non era JSON, usa errorText */ }

        console.error(`Errore durante il caricamento del file "${file.name}": ${response.status} - ${errorDetail}`);
        addActivityLogEntry('FILE_UPLOAD', `Caricamento file "${file.name}" fallito: ${response.status} - ${errorDetail}`);
      }
    } catch (error: any) {
      console.error(`Errore di rete o eccezione durante il caricamento del file "${file.name}":`, error.message);
      addActivityLogEntry('FILE_UPLOAD', `Caricamento file "${file.name}" fallito: Errore di rete - ${error.message}`);
    }
  };

  const handleFileDelete = (projectId: string, fileId: string) => {
    let deletedFileName = '';
    setProjectFiles(prev => prev.map(p => {
      if (p.id === projectId) {
        const fileToDelete = p.files.find(f => f.id === fileId);
        if (fileToDelete) deletedFileName = fileToDelete.name;
        return { ...p, files: p.files.filter(f => f.id !== fileId) };
      }
      return p;
    }));
     if (deletedFileName) {
        const projectNameForLog = projectFiles.find(p=>p.id === projectId)?.name || projectsData.find(p => p.id.toString() === projectId)?.denominazioneProgetto || `ID ${projectId}`;
        addActivityLogEntry('FILE_DELETE', `File "${deletedFileName}" eliminato da progetto ${projectNameForLog}.`, { fileId });
     }
  };
  const handleFileDownload = (file: ManagedFile) => {
    addActivityLogEntry('DATA_EXPORT', `Download simulato per file "${file.name}".`, { fileId: file.id });
    alert(`Simulato download di ${file.name}. Implementare actual download.`);
  };

  // Client Management Functions
  const handleClientAdd = (newClientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...newClientData,
      id: clientsData.length > 0 ? Math.max(...clientsData.map(c => c.id)) + 1 : 1, 
    };
    setClientsData(prev => [newClient, ...prev]);
    addActivityLogEntry('CLIENT_ADD', `Nuovo cliente "${newClient.denominazione}" aggiunto.`, { clientId: newClient.id, data: newClientData });
  };

  const handleClientEdit = (clientId: number, updatedData: Partial<Client>) => {
    setClientsData(prevClients => 
      prevClients.map(client => 
        client.id === clientId ? { ...client, ...updatedData } : client
      )
    );
    const clientName = clientsData.find(c => c.id === clientId)?.denominazione || `ID: ${clientId}`;
    addActivityLogEntry('CLIENT_EDIT', `Cliente "${clientName}" modificato.`, { clientId, updatedData });
  };

  const handleClientDelete = (clientId: number) => {
    const clientToDelete = clientsData.find(c => c.id === clientId);
    setClientsData(prevClients => prevClients.filter(client => client.id !== clientId));
    if (clientToDelete) {
        addActivityLogEntry('CLIENT_DELETE', `Cliente "${clientToDelete.denominazione}" (ID: ${clientId}) eliminato.`);
    } else {
        addActivityLogEntry('CLIENT_DELETE', `Tentativo di eliminare cliente con ID: ${clientId} (non trovato).`);
    }
  };

  // Project Management Functions
  const handleProjectAdd = (newProjectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...newProjectData,
      id: projectsData.length > 0 ? Math.max(...projectsData.map(p => p.id)) + 1 : 1,
    };
    setProjectsData(prev => [newProject, ...prev]); 
    const clientName = clientsData.find(c => c.id === newProject.idCliente)?.denominazione || `Cliente ID: ${newProject.idCliente}`;
    addActivityLogEntry('PROJECT_ADD', `Nuovo progetto "${newProject.denominazioneProgetto}" aggiunto per ${clientName}.`, { projectId: newProject.id, data: newProjectData });
  };

  const handleProjectEdit = (projectId: number, updatedData: Partial<Project>) => {
    setProjectsData(prevProjects =>
      prevProjects.map(project =>
        project.id === projectId ? { ...project, ...updatedData } : project
      )
    );
    const project = projectsData.find(p => p.id === projectId);
    if (project) {
        addActivityLogEntry('PROJECT_EDIT', `Progetto "${project.denominazioneProgetto}" modificato.`, { projectId, updatedData });
    }
  };

  const handleProjectDelete = (projectId: number) => {
    const projectToDelete = projectsData.find(p => p.id === projectId);
    setProjectsData(prevProjects => prevProjects.filter(project => project.id !== projectId));
    if (projectToDelete) {
        const clientName = clientsData.find(c => c.id === projectToDelete.idCliente)?.denominazione || `Cliente ID: ${projectToDelete.idCliente}`;
        addActivityLogEntry('PROJECT_DELETE', `Progetto "${projectToDelete.denominazioneProgetto}" eliminato per ${clientName}.`, { projectId });
    }
  };

  // --- Event Management Handlers ---
  const openEventModal = (eventToEdit: Event | null = null) => {
    setEditingEventForModal(eventToEdit);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setEditingEventForModal(null);
  };

  const handleSaveEventFromModal = (eventData: Omit<Event, 'id'>) => {
    if (editingEventForModal) {
      handleEventEdit(editingEventForModal.id, eventData);
    } else {
      handleEventAdd(eventData);
    }
    closeEventModal();
  };

  const handleEventAdd = (newEventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...newEventData,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
    };
    setEventsData(prev => [newEvent, ...prev].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    addActivityLogEntry('EVENT_ADD', `Nuovo evento "${newEvent.title}" aggiunto per il ${newEvent.date}.`, { eventId: newEvent.id, data: newEventData });
  };

  const handleEventEdit = (eventId: string, updatedData: Partial<Event>) => {
    setEventsData(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId ? { ...event, ...updatedData } : event
      ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    const event = eventsData.find(e => e.id === eventId);
    if (event) {
        addActivityLogEntry('EVENT_EDIT', `Evento "${event.title}" modificato.`, { eventId, updatedData });
    }
  };

  const handleEventDelete = (eventId: string) => {
    const eventToDelete = eventsData.find(e => e.id === eventId);
    setEventsData(prevEvents => prevEvents.filter(event => event.id !== eventId));
    if (eventToDelete) {
        addActivityLogEntry('EVENT_DELETE', `Evento "${eventToDelete.title}" eliminato.`, { eventId });
    }
  };

  // --- Invoice Management Handlers ---
  const handleInvoiceEdit = (invoiceId: number, updatedData: Partial<Invoice>) => {
    setInvoicesData(prevInvoices =>
      prevInvoices.map(invoice =>
        invoice.id === invoiceId ? { ...invoice, ...updatedData } : invoice
      )
    );
    const invoice = invoicesData.find(inv => inv.id === invoiceId);
    if (invoice) {
        addActivityLogEntry('INVOICE_EDIT', `Fattura "${invoice.numeroFattura}" (ID: ${invoiceId}) modificata.`, { invoiceId, updatedData });
    }
  };


  // --- Data Export/Import Functions ---
  const exportDataAsJSON = () => {
    const dataToExport = {
      metrics: metricsData, 
      todos,
      activityLog,
      projectFiles,
      financials: {
        monthlyRevenue: baseMonthlyRevenueData,
        revenueCategory: baseRevenueCategoryData,
        expenseRevenue: baseExpenseRevenueData,
        fixedExpenses: baseFixedExpensesData,
      },
      invoices: invoicesData,
      clients: clientsData,
      services: servicesData,
      tasks: tasksData,
      projects: projectsData,
      events: eventsData,
      layouts,
      widgetVisibility,
      newsTicker: newsTickerItems,
      historicalTasks,
      formClients,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `dashboard_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    addActivityLogEntry('DATA_EXPORT', 'Dati esportati in formato JSON.');
  };

  const handleImportJSON = useCallback((jsonString: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonString);

      const requiredKeys = [
        'metrics', 'todos', 'activityLog', 'projectFiles', 'financials', 
        'invoices', 'clients', 'services', 'tasks', 'projects', 'events', 
        'layouts', 'widgetVisibility', 'newsTicker', 'historicalTasks', 'formClients'
      ];
      const missingKeys = requiredKeys.filter(key => !(key in data));

      if (missingKeys.length > 0) {
        const errorMsg = `Importazione fallita: file JSON non valido o incompleto. Chiavi mancanti: ${missingKeys.join(', ')}.`;
        addActivityLogEntry('DATA_IMPORT', errorMsg);
        return { success: false, message: errorMsg };
      }
      
      const financialKeys = ['monthlyRevenue', 'revenueCategory', 'expenseRevenue', 'fixedExpenses'];
      const missingFinancialKeys = financialKeys.filter(key => !(key in data.financials));
       if (missingFinancialKeys.length > 0) {
        const errorMsg = `Importazione fallita: file JSON non valido. Chiavi mancanti in 'financials': ${missingFinancialKeys.join(', ')}.`;
        addActivityLogEntry('DATA_IMPORT', errorMsg);
        return { success: false, message: errorMsg };
      }


      const confirmed = window.confirm(
        "ATTENZIONE!\n\nStai per SOSTITUIRE tutti i dati e le impostazioni correnti con i dati del file importato.\n\nQuesta azione è IRREVERSIBILE.\n\nSei sicuro di voler procedere?"
      );

      if (!confirmed) {
        addActivityLogEntry('DATA_IMPORT', 'Importazione annullata dall\'utente.');
        return { success: false, message: 'Importazione annullata dall\'utente.' };
      }

      setMetricsData(data.metrics || initialMetricsConfig);
      setTodos(data.todos || []);
      setActivityLog(data.activityLog || []);
      setProjectFiles(data.projectFiles || []);
      
      if (data.financials) {
        setBaseMonthlyRevenueData(data.financials.monthlyRevenue || []);
        setBaseRevenueCategoryData(data.financials.revenueCategory || []);
        setBaseExpenseRevenueData(data.financials.expenseRevenue || []);
        setBaseFixedExpensesData(data.financials.fixedExpenses || []);
      } else {
        setBaseMonthlyRevenueData([]);
        setBaseRevenueCategoryData([]);
        setBaseExpenseRevenueData([]);
        setBaseFixedExpensesData([]);
      }

      setInvoicesData(data.invoices || []);
      setClientsData(data.clients || []);
      setServicesData(data.services || []);
      setTasksData(data.tasks || []);
      setProjectsData(data.projects || []);
      setEventsData(data.events || []);
      
      if (data.layouts && typeof data.layouts === 'object' && Object.keys(data.layouts).length > 0) {
          setLayouts(data.layouts);
      } else {
          setLayouts(JSON.parse(JSON.stringify(initialLayoutsConfig))); 
          addActivityLogEntry('DATA_IMPORT', 'Layout importato non valido, ripristinato il default.');
      }
      
      if (data.widgetVisibility && typeof data.widgetVisibility === 'object' && !Array.isArray(data.widgetVisibility)) {
         const importedVisibility = data.widgetVisibility;
         const finalVisibility: WidgetVisibilityState = { ...defaultWidgetVisibility };
         Object.keys(defaultWidgetVisibility).forEach(key => {
             if (importedVisibility[key] !== undefined && typeof importedVisibility[key] === 'boolean') {
                 finalVisibility[key] = importedVisibility[key];
             }
         });
         setWidgetVisibility(finalVisibility);
      } else {
          setWidgetVisibility(defaultWidgetVisibility);
          addActivityLogEntry('DATA_IMPORT', 'Visibilità widget importata non valida, ripristinato il default.');
      }

      setNewsTickerItems(data.newsTicker || []);
      setHistoricalTasks(data.historicalTasks || []);
      setFormClients(data.formClients || []);

      addActivityLogEntry('DATA_IMPORT', 'Dati importati con successo dal file JSON.');
      return { success: true, message: 'Dati importati con successo!' };

    } catch (e: any) {
      console.error("Error importing JSON:", e);
      addActivityLogEntry('DATA_IMPORT', `Errore durante l'importazione: ${e.message}`);
      return { success: false, message: `Errore durante l'importazione: ${e.message}. Assicurati che il file sia JSON valido.` };
    }
  }, [addActivityLogEntry, defaultWidgetVisibility]); 

   const exportTodosAsCSV = () => {
    if (todos.length === 0) {
        alert("Nessun task da esportare.");
        addActivityLogEntry('DATA_EXPORT', 'Esportazione CSV annullata: nessun task.');
        return;
    }

    const header = ['ID', 'Task', 'Completato', 'Urgenza', 'Cliente', 'Ore Stimate', 'Prezzo Suggerito', 'Prezzo Finale', 'Creato il', 'Note'];
    const rows = todos.map(todo => [
        todo.id,
        `"${todo.task.replace(/"/g, '""')}"`, 
        todo.completed ? 'Sì' : 'No',
        todo.urgency || '',
        `"${(todo.client || '').replace(/"/g, '""')}"`,
        todo.estimatedHours ?? '',
        todo.suggestedPrice ?? '',
        todo.finalPrice ?? '',
        todo.createdAt ? new Date(todo.createdAt).toLocaleDateString('it-IT') : '',
        `"${(todo.notes || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvString = [header.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `todo_list_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityLogEntry('DATA_EXPORT', 'Lista To-Do esportata in formato CSV.');
  };


  // --- MAIN RENDER ---
  if (isAppLoading) { 
    return (
        <div className="flex items-center justify-center h-screen bg-primary text-content">
            <div className="text-center">
                <svg className="animate-spin h-10 w-10 text-accent mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-light">Caricamento Dashboard...</p>
            </div>
        </div>
    );
  }
  
  const mainContentMarginClass = isMobileView 
    ? 'ml-0' 
    : 'md:ml-20'; // Sidebar is w-20 on desktop


  const renderView = () => {
    switch (activeView) {
      case 'clienti':
        return <ClientsPage 
                  clients={clientsData} 
                  invoicesData={invoicesData} 
                  projectsData={projectsData}
                  onAddClient={handleClientAdd}
                  onEditClient={handleClientEdit}
                  onDeleteClient={handleClientDelete}
                  addActivityLogEntry={addActivityLogEntry}
                  onAddProject={handleProjectAdd}
                  onEditProject={handleProjectEdit}
                  onDeleteProject={handleProjectDelete}
               />;
      case 'progetti':
        return <ProjectsPage 
                  projectsData={projectsData} 
                  clientsData={clientsData}
                  tasksData={tasksData}
                  servicesData={servicesData}
                  projectFiles={projectFiles}
                  onAddProject={handleProjectAdd}
                  onEditProject={handleProjectEdit}
                  onDeleteProject={handleProjectDelete}
                  addActivityLogEntry={addActivityLogEntry}
                  effectiveBackendUrl={effectiveBackendUrl}
                  isGoogleLoggedIn={IS_GOOGLE_DRIVE_ENABLED && isGoogleLoggedIn}
                  googleDriveUser={googleDriveUser}
                  googleAuthError={googleAuthError}
                  onTriggerAuthCheck={checkGoogleAuthStatus}
                  isGoogleDriveFeatureEnabled={IS_GOOGLE_DRIVE_ENABLED}
                  onUploadProjectFileApp={handleFileUpload}
                  onDeleteProjectFileApp={handleFileDelete}
                  onDownloadProjectFileApp={handleFileDownload}
               />;
      case 'fatture':
        return <InvoicesPage 
                  invoicesData={invoicesData} 
                  clientsData={clientsData} 
                  addActivityLogEntry={addActivityLogEntry}
                  onEditInvoice={handleInvoiceEdit}
                />;
      case 'servizi':
        return <ServicesPage services={servicesData} tasks={tasksData} />;
      case 'impostazioni':
        return <SettingsPage 
                  currentEffectiveBackendUrl={effectiveBackendUrl}
                  addActivityLogEntry={addActivityLogEntry}
                  onExportJSON={exportDataAsJSON}
                  onImportJSON={handleImportJSON}
                  onExportCSV={exportTodosAsCSV}
                  isGoogleLoggedIn={IS_GOOGLE_DRIVE_ENABLED && isGoogleLoggedIn}
                  googleDriveUser={googleDriveUser}
                  onGoogleLogin={handleGoogleLogin}
                  onGoogleLogout={handleGoogleLogout}
                  googleAuthIsLoading={googleAuthActionIsLoading}
                  googleAuthError={googleAuthError}
                  onTriggerAuthCheck={checkGoogleAuthStatus}
                  isGoogleDriveFeatureEnabled={IS_GOOGLE_DRIVE_ENABLED}
                />;
      case 'dashboard':
      default:
        return (
          <div className="h-full flex flex-col">
            {/* Sticky Header for Dashboard */}
            <div className="sticky top-0 z-10 bg-primary pt-1 pb-2 border-b border-content/10">
              {isLayoutEditMode && 
                <HiddenWidgetsManager 
                  widgetVisibility={widgetVisibility} 
                  widgetTitles={widgetTitles} 
                  onToggleWidget={handleToggleWidgetVisibility}
                />
              }
              <NewsTicker items={newsTickerItems} />
            </div>
            
            {/* Scrollable RGL Grid */}
            <div className="flex-grow overflow-y-auto mt-2">
              <ReactGridLayout
                  layouts={layouts}
                  breakpoints={appBreakpoints}
                  cols={appCols}
                  rowHeight={30} 
                  margin={appMargins[currentRGLBreakpoint] || appMargins.lg}
                  onLayoutChange={onLayoutChange}
                  onBreakpointChange={setCurrentRGLBreakpoint}
                  isDraggable={isLayoutEditMode}
                  isResizable={isLayoutEditMode}
                  draggableHandle=".widget-drag-handle"
                  className={clsx("border-0", { 'opacity-70': isLayoutEditMode })} 
              >
                {metricsData.map(metric => (
                  widgetVisibility[`metric-${metric.id}`] && (
                    <div key={`metric-${metric.id}`} className="relative bg-card p-0 border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles[`metric-${metric.id}`] || metric.title} widgetId={`metric-${metric.id}`} onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility[`metric-${metric.id}`]} />}
                      <MetricBox {...metric} ChangeIconPositive={ArrowTrendingUpIcon} ChangeIconNegative={ArrowTrendingDownIcon} />
                    </div>
                  )
                ))}

              {widgetVisibility.chartFilters && (
                  <div key="chartFilters" className="relative bg-card p-3 flex flex-col overflow-hidden border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles.chartFilters} widgetId="chartFilters" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.chartFilters}/>}
                      <ChartFilters years={availableYearsForFilter} clients={availableChartClients} currentFilters={chartFilters} onFilterChange={handleFilterChange} />
                  </div>
              )}
              {widgetVisibility.monthlyRevenue && (
                  <div key="monthlyRevenue" className="relative bg-card p-3 flex flex-col overflow-hidden border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles.monthlyRevenue} widgetId="monthlyRevenue" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.monthlyRevenue}/>}
                      <MonthlyRevenueChart data={filteredMonthlyRevenueData} />
                  </div>
              )}
              {widgetVisibility.revenueCategory && (
                  <div key="revenueCategory" className="relative bg-card p-3 flex flex-col overflow-hidden border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles.revenueCategory} widgetId="revenueCategory" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.revenueCategory}/>}
                      <RevenueCategoryChart data={filteredRevenueCategoryData} />
                  </div>
              )}
              {widgetVisibility.expensesVsRevenue && (
                  <div key="expensesVsRevenue" className="relative bg-card p-3 flex flex-col overflow-hidden border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles.expensesVsRevenue} widgetId="expensesVsRevenue" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.expensesVsRevenue}/>}
                      <ExpensesVsRevenueChart data={filteredExpenseRevenueData} />
                  </div>
              )}
              {widgetVisibility.netProfitVsFixed && (
                  <div key="netProfitVsFixed" className="relative bg-card p-3 flex flex-col overflow-hidden border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles.netProfitVsFixed} widgetId="netProfitVsFixed" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.netProfitVsFixed}/>}
                      <NetProfitVsFixedCostsChart data={netProfitData} />
                  </div>
              )}

              {widgetVisibility.fiscalSim && (
                  <div key="fiscalSim" className="relative bg-card p-0 flex flex-col overflow-hidden border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles.fiscalSim} widgetId="fiscalSim" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.fiscalSim}/>}
                      <FiscalSimulationBox onSimulationRun={handleFiscalSimulation}/>
                  </div>
              )}
              
              {widgetVisibility.todoAndActivity && (
                  <div key="todoAndActivity" className="relative bg-card p-0 flex flex-col overflow-hidden border border-content/10">
                  {isLayoutEditMode && <DragHandle title={widgetTitles.todoAndActivity} widgetId="todoAndActivity" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.todoAndActivity}/>}
                  <div className="flex-grow overflow-y-auto p-3 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-card)' }}>
                      <TaskInputForm onAddTask={handleAddTodo} clients={formClients} historicalTasks={historicalTasks} />
                      <div className="space-y-2 mt-3">
                      {todos.slice().sort((a,b) => (a.completed ? 1: -1) - (b.completed ? 1 : -1) || new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).map(todo => (
                          <TodoItem key={todo.id} todo={todo} onToggle={handleToggleTodo} onDelete={handleDeleteTodo} onUpdate={handleUpdateTodo} />
                      ))}
                      {todos.length === 0 && <p className="text-sm text-content/70 text-center py-4">Nessun task nella lista.</p>}
                      </div>
                  </div>
                  </div>
              )}
              
              {widgetVisibility.fileManager && (
                  <div key="fileManager" className="relative bg-card p-0 flex flex-col overflow-hidden border border-content/10">
                  {isLayoutEditMode && <DragHandle title={widgetTitles.fileManager} widgetId="fileManager" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.fileManager}/>}
                  <FileManager projectFolders={projectFiles} onFileUpload={handleFileUpload} onFileDelete={handleFileDelete} onFileDownload={handleFileDownload} />
                  </div>
              )}
              
              {widgetVisibility.calendar && (
                  <div key="calendar" className="relative bg-card p-0 flex flex-col overflow-hidden border border-content/10">
                  {isLayoutEditMode && <DragHandle title={widgetTitles.calendar} widgetId="calendar" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.calendar}/>}
                  <CalendarWidget 
                      events={eventsData} 
                      onAddEvent={() => openEventModal()} 
                      onEditEvent={(eventId: string, eventData: Partial<Event>) => {
                          const eventToEdit = eventsData.find(e => e.id === eventId);
                          if(eventToEdit) openEventModal(eventToEdit);
                      }}
                      onDeleteEvent={handleEventDelete}
                      currentSelectedDate={calendarSelectedDate}
                      onDateSelect={setCalendarSelectedDate}
                      currentMonth={calendarCurrentMonth}
                      onSetCurrentMonth={setCalendarCurrentMonth}
                  />
                  </div>
              )}
              {IS_GOOGLE_DRIVE_ENABLED && widgetVisibility.googleDriveViewer && (
                  <div key="googleDriveViewer" className="relative bg-card p-0 flex flex-col overflow-hidden border border-content/10">
                      {isLayoutEditMode && <DragHandle title={widgetTitles.googleDriveViewer} widgetId="googleDriveViewer" onToggleVisibility={handleToggleWidgetVisibility} isVisible={widgetVisibility.googleDriveViewer}/>}
                      <GoogleDriveFilesViewer 
                          addActivityLogEntry={addActivityLogEntry} 
                          backendUrl={effectiveBackendUrl}
                          isGoogleLoggedIn={isGoogleLoggedIn}
                          googleDriveUser={googleDriveUser}
                          googleAuthError={googleAuthError}
                          onTriggerAuthCheck={checkGoogleAuthStatus}
                      />
                  </div>
              )}

              </ReactGridLayout>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-primary text-content">
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        navItems={sidebarNavItems} 
        activeView={activeView} 
        onNavItemClick={handleViewChange}
        isMobileView={isMobileView}
      />
      <main className={clsx(
          "flex flex-col flex-grow p-4 sm:p-5 md:p-7 lg:p-9 transition-all duration-300 ease-in-out relative min-w-0 bg-primary", 
           mainContentMarginClass
        )}>
        <UtilityBar 
          notificationCount={3} 
          BellIcon={BellIcon} 
          EnvelopeIcon={EnvelopeIcon} 
          CogIcon={CogIcon} 
          Bars3Icon={Bars3Icon}
          onToggleLayoutEdit={toggleLayoutEditMode}
          isLayoutEditMode={isLayoutEditMode}
          isMobileView={isMobileView}
          onToggleMobileMenu={() => setIsSidebarOpen(!isSidebarOpen)}
          addActivityLogEntry={addActivityLogEntry} // Pass addActivityLogEntry
        />
        <div className={clsx(
          "mt-4 flex-grow w-full h-full flex flex-col", 
          isMobileView && isSidebarOpen && activeView === 'dashboard' && "pt-12" 
        )}>
          {renderView()}
        </div>
      </main>
      {isEventModalOpen && (
        <EventModal 
            isOpen={isEventModalOpen} 
            onClose={closeEventModal} 
            onSave={handleSaveEventFromModal}
            event={editingEventForModal}
            selectedDate={calendarSelectedDate ? calendarSelectedDate.toISOString().split('T')[0] : undefined}
        />
      )}
    </div>
  );
};

export default App;
