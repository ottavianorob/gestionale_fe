
import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ProjectTimelineSliderProps, TimelinePeriodData } from '../types';
import clsx from 'clsx';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export const ProjectTimelineSlider: React.FC<ProjectTimelineSliderProps> = ({
  timelinePeriods,
  selectedPeriod,
  onSelectPeriod,
  isTimelineFilterActive, 
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const monthItemRefs = useRef<(HTMLDivElement | null)[]>([]); 
  
  useEffect(() => {
    monthItemRefs.current = monthItemRefs.current.slice(0, timelinePeriods.length);
  }, [timelinePeriods.length]);

  const { scrollX } = useScroll({ container: scrollContainerRef });

  const handleTimelineScroll = useCallback(() => {
    if (!scrollContainerRef.current || !monthItemRefs.current || timelinePeriods.length === 0) return;

    const container = scrollContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const viewportCenterLine = containerRect.left + containerRect.width / 2;

    let centeredMonthData: TimelinePeriodData | null = null;
    let smallestDistance = Infinity;

    for (let i = 0; i < timelinePeriods.length; i++) {
      const monthElement = monthItemRefs.current[i];
      if (monthElement) {
        const monthRect = monthElement.getBoundingClientRect();
        const monthCenter = monthRect.left + monthRect.width / 2;
        const distanceToCenter = Math.abs(viewportCenterLine - monthCenter);

        if (distanceToCenter < smallestDistance) {
          smallestDistance = distanceToCenter;
          if (monthRect.left <= viewportCenterLine && monthRect.right >= viewportCenterLine) {
            centeredMonthData = timelinePeriods[i];
          } else if (distanceToCenter < monthRect.width / 2) { 
            centeredMonthData = timelinePeriods[i];
          }
        }
      }
    }
    
    if (!centeredMonthData && smallestDistance !== Infinity) {
        for (let i = 0; i < timelinePeriods.length; i++) {
            const monthElement = monthItemRefs.current[i];
            if (monthElement) {
                const monthRect = monthElement.getBoundingClientRect();
                const monthCenter = monthRect.left + monthRect.width / 2;
                 if (Math.abs(viewportCenterLine - monthCenter) === smallestDistance) {
                    centeredMonthData = timelinePeriods[i];
                    break;
                }
            }
        }
    }

    if (centeredMonthData) {
      if (!selectedPeriod || selectedPeriod.getTime() !== centeredMonthData.monthDate.getTime()) {
        onSelectPeriod(centeredMonthData.monthDate);
      }
    }
  }, [timelinePeriods, onSelectPeriod, selectedPeriod]);
  
  useMotionValueEvent(scrollX, "change", (latest) => {
    handleTimelineScroll();
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    let timeoutId: number;
    const scrollHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        handleTimelineScroll();
      }, 50); 
    };

    container.addEventListener('scroll', scrollHandler, { passive: true });
    return () => container.removeEventListener('scroll', scrollHandler);
  }, [handleTimelineScroll]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || timelinePeriods.length === 0) return;
    
    const initialScrollTarget = selectedPeriod || timelinePeriods[0]?.monthDate;
    if (initialScrollTarget) {
      const targetIndex = timelinePeriods.findIndex(p => p.monthDate.getTime() === initialScrollTarget.getTime());
      if (targetIndex !== -1 && monthItemRefs.current[targetIndex]) {
        const targetElement = monthItemRefs.current[targetIndex];
        if(targetElement) {
            const containerWidth = container.offsetWidth;
            const targetOffsetLeft = targetElement.offsetLeft;
            const targetWidth = targetElement.offsetWidth;
            container.scrollLeft = targetOffsetLeft - (containerWidth / 2) + (targetWidth / 2);
            handleTimelineScroll(); 
        }
      }
    } else {
       handleTimelineScroll(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelinePeriods]); 
  

  if (!timelinePeriods || timelinePeriods.length === 0) {
    return <div className="h-20"></div>; 
  }

  const maxProjectCount = Math.max(1, ...timelinePeriods.map(p => p.projectCount));
  const barMaxHeight = 20; // px

  const getLoadBarColor = (projectCount: number): string => {
    const lowThreshold = maxProjectCount * 0.33;
    const mediumThreshold = maxProjectCount * 0.66;
    if (projectCount === 0) return 'bg-content/20'; 
    if (projectCount <= lowThreshold) return 'bg-green-500';
    if (projectCount <= mediumThreshold) return 'bg-yellow-500';
    return 'bg-accent'; 
  };

  return (
    <div className="w-full bg-primary py-2 px-1 select-none relative" aria-label="Timeline dei progetti per mese">
      <div 
        className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-accent z-10 transform -translate-x-1/2 pointer-events-none"
        aria-hidden="true"
      ></div>

      <motion.div 
        ref={scrollContainerRef} 
        className="flex space-x-1 overflow-x-auto pb-2 cursor-grab"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary)' }}
        drag="x"
        dragConstraints={{ left: -(timelinePeriods.length * 50), right: 0 }} 
        dragElastic={0.1}
        whileDrag={{ cursor: "grabbing" }}
        onDragEnd={() => handleTimelineScroll()} 
        role="region"
        aria-label="Timeline dei periodi, scorri orizzontalmente"
      >
        <div className="flex-shrink-0" style={{width: 'calc(50% - 25px)'}} aria-hidden="true"></div>

        {timelinePeriods.map((period, index) => {
          const isCenteredUnderCursor = selectedPeriod?.getTime() === period.monthDate.getTime();
          const barHeightValue = (period.projectCount / maxProjectCount) * barMaxHeight;
          const loadBarColorClass = getLoadBarColor(period.projectCount);
          
          const showHighlight = isTimelineFilterActive && isCenteredUnderCursor;

          return (
            <div
              key={period.monthDate.toISOString()}
              ref={el => { if (el) monthItemRefs.current[index] = el; }}
              className={clsx(
                'flex flex-col items-center justify-end p-2 min-w-[50px] h-[60px] transition-colors duration-100 ease-in-out border bg-primary',
                showHighlight
                  ? 'border-content/50' 
                  : 'border-transparent', 
              )}
              aria-label={`Mese: ${period.label}, Progetti: ${period.projectCount}${showHighlight ? ', Selezionato per filtro' : ''}`}
            >
              <div 
                className={clsx(
                  "w-4 transition-all duration-150 ease-in-out mb-0.5", 
                  loadBarColorClass
                )}
                style={{ height: `${Math.max(2, barHeightValue)}px` }} 
                aria-hidden="true"
              ></div>
              <span className={clsx(
                "text-[10px] font-medium whitespace-nowrap",
                 showHighlight ? "text-content" : "text-content/70" 
               )}
              >
                {period.label}
              </span>
            </div>
          );
        })}
        <div className="flex-shrink-0" style={{width: 'calc(50% - 25px)'}} aria-hidden="true"></div>
      </motion.div>
    </div>
  );
};
