
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { ServicesPageProps, ServiceItem, TaskItem } from '../types';
import { SectionTitle } from './SectionTitle';
import clsx from 'clsx';

const formatCurrency = (amount: number | null | undefined, showDecimals = true): string => {
  if (amount === null || typeof amount === 'undefined') return 'N/D';
  return "€ " + amount.toLocaleString('it-IT', { 
    minimumFractionDigits: showDecimals ? 2 : 0, 
    maximumFractionDigits: showDecimals ? 2 : 0 
  });
};

// Utility to parse DD/MM/AA to Date object
const parseServiceTaskDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr || dateStr.trim() === '') return null;
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
    console.warn(`Invalid date string for service task parsing: ${dateStr}`);
    return null;
};


interface ServiceCalculatedStats {
  avgPrice: number | null;
  minPrice: number | null; 
  maxPrice: number | null;
  pricedTaskCount: number; 
}

const EXCLUDED_CATEGORY_FOR_STATS = "PREPARAZIONE MATERIALE";

interface ServiceWithStats extends ServiceItem {
  stats: ServiceCalculatedStats;
  pricedTasksForChart: TaskItem[];
}

interface CategoryWithServices {
  categoryName: string;
  services: ServiceWithStats[];
}

const ServicePriceTrendChart: React.FC<{ tasks: TaskItem[] }> = ({ tasks }) => {
  const validPricedTasks = useMemo(() => 
    tasks
      .filter(task => task.importoTask > 0 && parseServiceTaskDate(task.dataTask) !== null)
      .sort((a, b) => (parseServiceTaskDate(a.dataTask) as Date).getTime() - (parseServiceTaskDate(b.dataTask) as Date).getTime()),
    [tasks]
  );

  if (validPricedTasks.length < 2) {
    return null; // Not enough data to draw a line
  }

  const prices = validPricedTasks.map(task => task.importoTask);
  const dates = validPricedTasks.map(task => (parseServiceTaskDate(task.dataTask) as Date).getTime());

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);

  const chartWidth = 50;
  const chartHeight = 15;

  const normalizePrice = (price: number) => {
    if (maxPrice === minPrice) return chartHeight / 2; // If all prices are same, draw a flat line in middle
    return chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * chartHeight * 0.8 + chartHeight * 0.1; // Scale with some padding
  };

  const normalizeDate = (date: number) => {
    if (maxDate === minDate) return chartWidth / 2; // Center if only one date effective
    return ((date - minDate) / (maxDate - minDate)) * chartWidth;
  };

  const pathData = validPricedTasks
    .map((task, index) => {
      const x = normalizeDate((parseServiceTaskDate(task.dataTask) as Date).getTime());
      const y = normalizePrice(task.importoTask);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      className="w-20 h-6 text-accent flex-shrink-0" 
      fill="none"
      stroke="currentColor"
      strokeWidth="1" 
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={pathData} />
    </svg>
  );
};


export const ServicesPage: React.FC<ServicesPageProps> = ({ services, tasks }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = React.useRef<Record<string, HTMLElement | null>>({});

  const servicesWithStats = useMemo<ServiceWithStats[]>(() => {
    return services.map(service => {
      const relatedTasks = tasks.filter(task => task.idServizio === service.id);
      const pricedTasks = relatedTasks.filter(task => task.importoTask > 0);
      
      let minPrice: number | null = null;
      let maxPrice: number | null = null;
      let sumPrice = 0;

      if (pricedTasks.length > 0 && service.categoriaServizio !== EXCLUDED_CATEGORY_FOR_STATS) {
        minPrice = Math.min(...pricedTasks.map(t => t.importoTask));
        maxPrice = Math.max(...pricedTasks.map(t => t.importoTask));
        sumPrice = pricedTasks.reduce((sum, t) => sum + t.importoTask, 0);
      }
      
      return {
        ...service,
        stats: {
          minPrice,
          maxPrice,
          avgPrice: pricedTasks.length > 0 && service.categoriaServizio !== EXCLUDED_CATEGORY_FOR_STATS ? sumPrice / pricedTasks.length : null,
          pricedTaskCount: pricedTasks.length,
        },
        pricedTasksForChart: pricedTasks,
      };
    });
  }, [services, tasks]);

  const categorizedServices = useMemo<CategoryWithServices[]>(() => {
    const categories: Record<string, ServiceWithStats[]> = {};
    servicesWithStats.forEach(service => {
      if (!categories[service.categoriaServizio]) {
        categories[service.categoriaServizio] = [];
      }
      categories[service.categoriaServizio].push(service);
    });
    return Object.entries(categories)
      .sort(([catA], [catB]) => catA.localeCompare(catB)) 
      .map(([categoryName, srvs]) => ({
        categoryName,
        services: srvs.sort((a,b) => a.descrizioneServizio.localeCompare(b.descrizioneServizio)) 
      }));
  }, [servicesWithStats]);
  
  useEffect(() => {
    if (categorizedServices.length > 0 && !activeCategory) {
      setActiveCategory(categorizedServices[0].categoryName);
    }
  }, [categorizedServices, activeCategory]);

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    if (categoryRefs.current[categoryName]) {
        categoryRefs.current[categoryName]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-full flex flex-col text-content">
      <div className="sticky top-0 z-10 bg-primary py-3 border-b border-content/10">
        <SectionTitle className="!mb-2 sm:!mb-3">Catalogo e Analisi Servizi</SectionTitle>
        {categorizedServices.length > 0 && (
            <div className="overflow-x-auto whitespace-nowrap pb-2 -mb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary-light)' }}>
                <div className="flex space-x-3 sm:space-x-4">
                {categorizedServices.map(cat => (
                    <button
                    key={cat.categoryName}
                    onClick={() => handleCategoryClick(cat.categoryName)}
                    className={clsx(
                        "px-1.5 py-1 text-xs sm:text-sm transition-colors duration-150 whitespace-nowrap focus:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-primary",
                        activeCategory === cat.categoryName 
                        ? "text-accent font-semibold border-b-2 border-accent" 
                        : "text-content/70 hover:text-accent border-b-2 border-transparent"
                    )}
                    >
                    {cat.categoryName}
                    </button>
                ))}
                </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow flex flex-col pt-4 min-h-0">
        <main className="flex-grow overflow-y-auto pr-2 -mr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary-light)' }}>
          {categorizedServices.map(({ categoryName, services: servicesInCategory }) => (
            <section 
                key={categoryName} 
                id={`category-${categoryName.replace(/\s+/g, '-')}`} 
                ref={(el) => { if (el) categoryRefs.current[categoryName] = el; }}
                className="mb-6 scroll-mt-20"
            >
              <h3 className="text-lg font-semibold text-accent/90 mb-3 pb-1 border-b border-content/10">
                {categoryName}
              </h3>
              <div className="space-y-2">
                {servicesInCategory.map(service => (
                  <div key={service.id} className="bg-card p-3 border border-content/10 flex items-center justify-between gap-x-4">
                    <div className="flex-grow">
                      <h4 className="text-sm font-medium text-content/95">{service.descrizioneServizio}</h4>
                      {service.categoriaServizio !== EXCLUDED_CATEGORY_FOR_STATS && service.stats.pricedTaskCount > 0 && service.stats.avgPrice !== null && (
                        <>
                          <p className="text-lg font-semibold text-accent mt-0.5">{formatCurrency(service.stats.avgPrice)}</p>
                          {service.stats.minPrice !== null && service.stats.maxPrice !== null && (
                             <p className="text-xs text-content/80 mt-0.5">
                                {formatCurrency(service.stats.minPrice, true)} / {formatCurrency(service.stats.maxPrice, true)}
                             </p>
                          )}
                        </>
                      )}
                       {service.categoriaServizio !== EXCLUDED_CATEGORY_FOR_STATS && service.stats.pricedTaskCount === 0 && (
                        <p className="text-xs text-content/60 italic mt-1">Nessun task prezzato per questo servizio.</p>
                      )}
                      {service.categoriaServizio === EXCLUDED_CATEGORY_FOR_STATS && (
                        <p className="text-xs text-content/60 italic mt-1">Statistiche di prezzo non applicabili.</p>
                      )}
                    </div>
                    {service.categoriaServizio !== EXCLUDED_CATEGORY_FOR_STATS && service.stats.pricedTaskCount > 0 && (
                      <ServicePriceTrendChart tasks={service.pricedTasksForChart} />
                    )}
                  </div>
                ))}
                 {servicesInCategory.length === 0 && (
                    <p className="text-sm text-content/70 italic">Nessun servizio in questa categoria.</p>
                )}
              </div>
            </section>
          ))}
           {categorizedServices.length === 0 && (
             <p className="text-content/70 text-center py-10">Nessun servizio o categoria da visualizzare.</p>
           )}
        </main>
      </div>
    </div>
  );
};
