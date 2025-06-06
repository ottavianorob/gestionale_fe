
import React from 'react';
import {
  CurrencyEuroIcon, UserIcon, FolderIcon,
  HomeIcon, DocumentTextIcon, CogIcon, TagIcon,
} from '../components/icons';
import type { CustomLayoutItem, Metric, SidebarNavItem, ActiveView } from '../types';

// Map icon names to components for easy rendering
export const metricIconMap: Record<string, React.FC<any>> = {
  CurrencyEuroIcon,
  UserIcon,
  FolderIcon,
};

// Original layout definition, kept for reference or potential revert
export const legacyInitialLayouts: Record<string, CustomLayoutItem[]> = {
  lg: [
    { i: "calendar", x: 0, y: 0, w: 12, h: 14, defaultVisible: true }, 
    { i: "metric-entrateLorde",    x: 0, y: 14, w: 3, h: 4, minH: 3, minW: 2, defaultVisible: true },
    { i: "metric-speseVariabili",  x: 3, y: 14, w: 3, h: 4, minH: 3, minW: 2, defaultVisible: true },
    { i: "metric-clientiAttivi",   x: 6, y: 14, w: 3, h: 4, minH: 3, minW: 2, defaultVisible: true },
    { i: "metric-progettiInCorso", x: 9, y: 14, w: 3, h: 4, minH: 3, minW: 2, defaultVisible: true },

    { i: "chartFilters", x: 0, y: 18, w: 12, h: 3, minH: 2, minW: 6, defaultVisible: true },
    { i: "monthlyRevenue",    x: 0, y: 21, w: 3, h: 8, minH: 4, minW: 3, defaultVisible: true }, 
    { i: "revenueCategory",   x: 3, y: 21, w: 3, h: 8, minH: 4, minW: 3, defaultVisible: true },
    { i: "expensesVsRevenue", x: 6, y: 21, w: 3, h: 8, minH: 4, minW: 3, defaultVisible: true },
    { i: "netProfitVsFixed",  x: 9, y: 21, w: 3, h: 8, minH: 4, minW: 3, defaultVisible: true },
    
    { i: "fiscalSim",            x: 0, y: 29, w: 4, h: 10, minH: 7, minW: 4, defaultVisible: true}, 
    { i: "googleDriveViewer",    x: 4, y: 29, w: 4, h: 10, minH: 8, minW: 3, defaultVisible: true }, 
    { i: "todoAndActivity",      x: 8, y: 29, w: 4, h: 10, minH: 8, minW: 3, defaultVisible: true}, 
    
    { i: "fileManager",          x: 0, y: 39, w: 12, h: 8, minH:5, minW: 4, defaultVisible: false}, 
  ],
   md: [
    { i: "calendar", x: 0, y: 0, w: 10, h: 14, defaultVisible: true }, 
    { i: "metric-entrateLorde",    x: 0, y: 14, w: 5, h: 4, defaultVisible: true }, 
    { i: "metric-speseVariabili",  x: 5, y: 14, w: 5, h: 4, defaultVisible: true },
    { i: "metric-clientiAttivi",   x: 0, y: 18, w: 5, h: 4, defaultVisible: true },
    { i: "metric-progettiInCorso", x: 5, y: 18, w: 5, h: 4, defaultVisible: true },
    
    { i: "chartFilters", x: 0, y: 22, w: 10, h: 3, defaultVisible: true },
    { i: "monthlyRevenue", x: 0, y: 25, w: 5, h: 8, defaultVisible: true },
    { i: "revenueCategory", x: 5, y: 25, w: 5, h: 8, defaultVisible: true },
    { i: "expensesVsRevenue", x: 0, y: 33, w: 5, h: 8, defaultVisible: true },
    { i: "netProfitVsFixed", x: 5, y: 33, w: 5, h: 8, defaultVisible: true },
    
    { i: "fiscalSim", x: 0, y: 41, w: 5, h: 10, defaultVisible: true },
    { i: "googleDriveViewer", x: 5, y: 41, w: 5, h: 10, defaultVisible: true },
    { i: "todoAndActivity", x:0, y: 51, w: 10, h: 10, defaultVisible: true }, 
    { i: "fileManager", x:0, y: 61, w: 10, h: 8, defaultVisible: false }, 
  ],
   sm: [
    { i: "calendar", x: 0, y: 0, w: 6, h: 16, defaultVisible: true }, 
    { i: "metric-entrateLorde",    x: 0, y: 16, w: 3, h: 4, defaultVisible: true },
    { i: "metric-speseVariabili",  x: 3, y: 16, w: 3, h: 4, defaultVisible: true },
    { i: "metric-clientiAttivi",   x: 0, y: 20, w: 3, h: 4, defaultVisible: true },
    { i: "metric-progettiInCorso", x: 3, y: 20, w: 3, h: 4, defaultVisible: true },

    { i: "chartFilters", x: 0, y: 24, w: 6, h: 3, defaultVisible: true },
    { i: "monthlyRevenue", x: 0, y: 27, w: 6, h: 8, defaultVisible: true },
    { i: "revenueCategory", x: 0, y: 35, w: 6, h: 8, defaultVisible: true },
    { i: "expensesVsRevenue", x: 0, y: 43, w: 6, h: 8, defaultVisible: true },
    { i: "netProfitVsFixed", x: 0, y: 51, w: 6, h: 8, defaultVisible: true },
    
    { i: "fiscalSim", x: 0, y: 59, w: 6, h: 10, defaultVisible: true },
    { i: "googleDriveViewer", x: 0, y: 69, w: 6, h: 10, defaultVisible: true },
    { i: "todoAndActivity", x:0, y: 79, w: 6, h: 10, defaultVisible: true },
    { i: "fileManager", x:0, y: 89, w: 6, h: 8, defaultVisible: false },
  ]
};

// New dashboard layout definition (rowHeight: 30)
export const updatedInitialLayouts: Record<string, CustomLayoutItem[]> = {
  lg: [ // 12 columns
    // Top Row: Metrics (h:4 = 120px)
    { i: "metric-entrateLorde",    x: 0, y: 0, w: 3, h: 4, defaultVisible: true },
    { i: "metric-speseVariabili",  x: 3, y: 0, w: 3, h: 4, defaultVisible: true },
    { i: "metric-clientiAttivi",   x: 6, y: 0, w: 3, h: 4, defaultVisible: true },
    { i: "metric-progettiInCorso", x: 9, y: 0, w: 3, h: 4, defaultVisible: true },

    // Main Area: Column 1 (w:7)
    { i: "calendar",          x: 0, y: 4, w: 7, h: 16, minH: 12, defaultVisible: true }, // h:16 = 480px
    { i: "todoAndActivity",   x: 0, y: 20,w: 7, h: 13, minH: 10, defaultVisible: true}, // h:13 = 390px
    
    // Main Area: Column 2 (w:5)
    { i: "chartFilters",      x: 7, y: 4, w: 5, h: 3, minH:3, defaultVisible: true }, // h:3 = 90px
    { i: "monthlyRevenue",    x: 7, y: 7, w: 5, h: 8, minH:6, defaultVisible: true },  // h:8 = 240px
    { i: "revenueCategory",   x: 7, y: 15,w: 5, h: 8, minH:6, defaultVisible: true }, // h:8 = 240px
    { i: "expensesVsRevenue", x: 7, y: 23,w: 5, h: 8, minH:6, defaultVisible: true }, // h:8 = 240px
    { i: "netProfitVsFixed",  x: 7, y: 31,w: 5, h: 8, minH:6, defaultVisible: true }, // h:8 = 240px
    
    // Bottom Row
    { i: "fiscalSim",         x: 0, y: 39, w: 4, h: 10, minH: 8, defaultVisible: true}, // h:10 = 300px
    { i: "googleDriveViewer", x: 4, y: 39, w: 4, h: 10, minH: 8, defaultVisible: true }, // h:10 = 300px
    { i: "fileManager",       x: 8, y: 39, w: 4, h: 10, minH: 8, defaultVisible: false}, // h:10 = 300px
  ],
  md: [ // 10 columns
    // Metrics (2x2 grid, h:4 = 120px)
    { i: "metric-entrateLorde",    x: 0, y: 0, w: 5, h: 4, defaultVisible: true },
    { i: "metric-speseVariabili",  x: 5, y: 0, w: 5, h: 4, defaultVisible: true },
    { i: "metric-clientiAttivi",   x: 0, y: 4, w: 5, h: 4, defaultVisible: true },
    { i: "metric-progettiInCorso", x: 5, y: 4, w: 5, h: 4, defaultVisible: true },
    
    // Column 1 (w:6)
    { i: "calendar",          x: 0, y: 8, w: 6, h: 16, defaultVisible: true },
    { i: "todoAndActivity",   x: 0, y: 24,w: 6, h: 13, defaultVisible: true },

    // Column 2 (w:4)
    { i: "chartFilters",      x: 6, y: 8, w: 4, h: 3, defaultVisible: true },
    { i: "monthlyRevenue",    x: 6, y: 11,w: 4, h: 8, defaultVisible: true },
    { i: "revenueCategory",   x: 6, y: 19,w: 4, h: 8, defaultVisible: true },
    { i: "expensesVsRevenue", x: 6, y: 27,w: 4, h: 8, defaultVisible: true },
    { i: "netProfitVsFixed",  x: 6, y: 35,w: 4, h: 8, defaultVisible: true },

    // Bottom 
    { i: "fiscalSim",         x: 0, y: 43, w: 5, h: 10, defaultVisible: true},
    { i: "googleDriveViewer", x: 5, y: 43, w: 5, h: 10, defaultVisible: true },
    { i: "fileManager",       x: 0, y: 53, w:10, h: 10, defaultVisible: false},
  ],
  sm: [ // 6 columns (Single Column Layout)
    // Metrics (2x2 grid, h:4 = 120px)
    { i: "metric-entrateLorde",    x: 0, y: 0, w: 3, h: 4, defaultVisible: true },
    { i: "metric-speseVariabili",  x: 3, y: 0, w: 3, h: 4, defaultVisible: true },
    { i: "metric-clientiAttivi",   x: 0, y: 4, w: 3, h: 4, defaultVisible: true },
    { i: "metric-progettiInCorso", x: 3, y: 4, w: 3, h: 4, defaultVisible: true },

    // Content Stacked (w:6)
    { i: "calendar",          x: 0, y: 8, w: 6, h: 16, defaultVisible: true },
    { i: "todoAndActivity",   x: 0, y: 24,w: 6, h: 13, defaultVisible: true },
    
    { i: "chartFilters",      x: 0, y: 37,w: 6, h: 3, defaultVisible: true },
    { i: "monthlyRevenue",    x: 0, y: 40,w: 6, h: 8, defaultVisible: true },
    { i: "revenueCategory",   x: 0, y: 48,w: 6, h: 8, defaultVisible: true },
    { i: "expensesVsRevenue", x: 0, y: 56,w: 6, h: 8, defaultVisible: true },
    { i: "netProfitVsFixed",  x: 0, y: 64,w: 6, h: 8, defaultVisible: true },
    
    { i: "fiscalSim",         x: 0, y: 72,w: 6, h: 10, defaultVisible: true },
    { i: "googleDriveViewer", x: 0, y: 82,w: 6, h: 10, defaultVisible: true },
    { i: "fileManager",       x: 0, y: 92,w: 6, h: 10, defaultVisible: false },
  ]
};

// Use this for the App component
export const initialLayoutsDefinition = updatedInitialLayouts;


export const widgetTitles: Record<string, string> = {
  "calendar": "Calendario Eventi",
  "metric-entrateLorde": "Entrate Lorde",
  "metric-speseVariabili": "Spese Variabili",
  "metric-clientiAttivi": "Clienti Attivi",
  "metric-progettiInCorso": "Progetti in Corso",
  "chartFilters": "Filtri Grafici",
  "monthlyRevenue": "Entrate Mensili",
  "revenueCategory": "Entrate per Categoria",
  "expensesVsRevenue": "Spese vs Entrate",
  "netProfitVsFixed": "Utile vs Spese Fisse",
  "fiscalSim": "Simulazione Fiscale",
  "todoAndActivity": "To-Do & Input Rapido", 
  "fileManager": "Gestione Documenti Locali",
  "googleDriveViewer": "Google Drive", 
};

export const sidebarNavItems: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }), href: '#', viewId: 'dashboard' },
  { id: 'progetti', label: 'Progetti', icon: React.createElement(FolderIcon, { className: "w-5 h-5" }), href: '#', viewId: 'progetti' },
  { id: 'clienti', label: 'Clienti', icon: React.createElement(UserIcon, { className: "w-5 h-5" }), href: '#', viewId: 'clienti' }, 
  { id: 'fatture', label: 'Fatture', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }), href: '#', viewId: 'fatture' },
  { id: 'servizi', label: 'Servizi', icon: React.createElement(TagIcon, { className: "w-5 h-5" }), href: '#', viewId: 'servizi'},
  { id: 'impostazioni', label: 'Impostazioni', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), href: '#', viewId: 'impostazioni' },
];

export const initialMetrics: Metric[] = [
  { 
    id: 'entrateLorde', 
    title: 'Entrate Lorde (Anno Corr.)', 
    value: 12345, // Changed from string '€12,345'
    percentageChange: 5.2, 
    iconName: 'CurrencyEuroIcon'
  },
  { 
    id: 'speseVariabili', 
    title: 'Spese Variabili (Anno Corr.)', 
    value: 3456, // Changed from string '€3,456'
    percentageChange: -2.1, 
    iconName: 'CurrencyEuroIcon' 
  },
  { 
    id: 'clientiAttivi', 
    title: 'Clienti Attivi', 
    value: 23, // Already a number, but ensure consistency if imported as string
    percentageChange: 10, 
    iconName: 'UserIcon' 
  }, 
  { 
    id: 'progettiInCorso', 
    title: 'Progetti in Corso', 
    value: 7, // Already a number
    percentageChange: 0, 
    iconName: 'FolderIcon' 
  },
];


export const availableYearsForFilter: (number | string)[] = [2023, 2024];