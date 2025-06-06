
import React, { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ExpenseRevenueData } from '../../types';
import { ACCENT_ORANGE, PURE_WHITE, CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../../constants';

interface ExpensesVsRevenueChartProps {
  data: ExpenseRevenueData[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary/80 backdrop-blur-sm p-3 border border-content/20"> {/* Removed rounded-md */}
        <p className="label text-content/80 font-normal">{`${label}`}</p>
        <p className="intro text-accent font-semibold">{`Entrate: € ${payload[0].value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
        <p className="intro text-content/90 font-semibold">{`Spese: € ${payload[1].value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
      </div>
    );
  }
  return null;
};

// Using a tint of PURE_WHITE (content color) for expenses bar
const CONTENT_COLOR_TINT = 'rgba(255, 255, 255, 0.6)'; // PURE_WHITE is #ffffff
const LEGEND_BREAKPOINT_HEIGHT = 150; // px

export const ExpensesVsRevenueChart: React.FC<ExpensesVsRevenueChartProps> = ({ data }) => {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries && entries.length > 0) {
        const entry = entries[0];
        setContainerHeight(entry.contentRect.height);
      }
    });

    if (chartWrapperRef.current) {
      observer.observe(chartWrapperRef.current);
      setContainerHeight(chartWrapperRef.current.clientHeight); // Initial height
    }

    return () => {
      if (chartWrapperRef.current) {
        observer.unobserve(chartWrapperRef.current);
      }
      observer.disconnect();
    };
  }, []);

  const isCompactLegend = containerHeight > 0 && containerHeight < LEGEND_BREAKPOINT_HEIGHT;

  const legendProps = isCompactLegend ? {
    layout: "vertical" as const,
    align: "right" as const,
    verticalAlign: "middle" as const,
    wrapperStyle: { color: CHART_TEXT_COLOR, fontWeight: 200, fontSize: 12, paddingLeft: '10px', lineHeight: '20px' }
  } : {
    layout: "horizontal" as const,
    align: "center" as const,
    verticalAlign: "bottom" as const,
    wrapperStyle: { color: CHART_TEXT_COLOR, fontWeight: 200, fontSize: 12, paddingTop: '10px', width: '100%' }
  };
  
  const chartMargins = isCompactLegend ? 
    { top: 5, right: 90, left: -20, bottom: 5 } : 
    { top: 5, right: 20, left: -20, bottom: 5 };

  return (
    <div ref={chartWrapperRef} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargins} barGap={4} barCategoryGap="20%"> {/* Adjust gaps for aesthetics */}
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
          <XAxis dataKey="month" tick={{ fill: CHART_TEXT_COLOR, fontSize: 12, fontWeight: 200 }} />
          <YAxis tickFormatter={(value) => `€ ${(value / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}k`} tick={{ fill: CHART_TEXT_COLOR, fontSize: 12, fontWeight: 200 }} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,144,0,0.1)'}}/>
          <Legend {...legendProps} iconType="square" /> {/* Sharp legend items */}
          <Bar dataKey="revenue" fill={ACCENT_ORANGE} name="Entrate" radius={[0, 0, 0, 0]} /> {/* Ensure no radius on bars */}
          <Bar dataKey="expenses" fill={CONTENT_COLOR_TINT} name="Spese" radius={[0, 0, 0, 0]} /> {/* Ensure no radius on bars */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
