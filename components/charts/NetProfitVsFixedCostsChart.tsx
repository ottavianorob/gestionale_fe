
import React, { useRef, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { NetProfitData } from '../../types';
import { CHART_ACCENT_COLOR_2, CHART_FIXED_COST_COLOR, PURE_WHITE, CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../../constants';

interface NetProfitVsFixedCostsChartProps {
  data: NetProfitData[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary/80 backdrop-blur-sm p-3 border border-content/20"> {/* Removed rounded-md */}
        <p className="label text-content/80 font-normal">{`${label}`}</p>
        {payload.map((entry: any) => (
          <p key={entry.dataKey} style={{ color: entry.color }} className="font-semibold">
            {`${entry.name}: € ${entry.value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const LEGEND_BREAKPOINT_HEIGHT = 150; // px

export const NetProfitVsFixedCostsChart: React.FC<NetProfitVsFixedCostsChartProps> = ({ data }) => {
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
    { top: 5, right: 130, left: -20, bottom: 5 } : 
    { top: 5, right: 20, left: -20, bottom: 5 };  

  return (
    <div ref={chartWrapperRef} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={chartMargins} barGap={4} barCategoryGap="20%"> {/* Adjust gaps */}
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
          <XAxis dataKey="month" tick={{ fill: CHART_TEXT_COLOR, fontSize: 12, fontWeight: 200 }} />
          <YAxis tickFormatter={(value) => `€ ${(value / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })}k`} tick={{ fill: CHART_TEXT_COLOR, fontSize: 12, fontWeight: 200 }} />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,144,0,0.1)'}}/>
          <Legend {...legendProps} iconType="square"/> {/* Sharp legend items */}
          <Bar dataKey="netProfit" fill={CHART_ACCENT_COLOR_2} name="Utile Netto Stimato" radius={[0, 0, 0, 0]} /> {/* Ensure no radius on bars */}
          <Bar dataKey="fixedExpenses" fill={CHART_FIXED_COST_COLOR} name="Spese Fisse" radius={[0, 0, 0, 0]} /> {/* Ensure no radius on bars */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
