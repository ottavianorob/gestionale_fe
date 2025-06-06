
import React, { useRef, useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { RevenueCategoryData } from '../../types';
import { ACCENT_ORANGE, PURE_WHITE, CHART_GRID_COLOR, CHART_TEXT_COLOR } from '../../constants';

interface RevenueCategoryChartProps {
  data: RevenueCategoryData[];
}

const COLORS = [ACCENT_ORANGE, '#F0A500', '#FFC107', '#FFD54F', '#FFEB3B']; // Shades of orange/yellow

const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-primary/80 backdrop-blur-sm p-3 border border-content/20"> {/* Removed rounded-md */}
        <p className="label text-content/80 font-normal">{`${payload[0].name}`}</p>
        <p className="intro" style={{color: payload[0].payload.fill}}>{`Valore: € ${payload[0].value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
        <p className="text-content/60 text-xs">{`(${(payload[0].percent * 100).toFixed(1)}%)`}</p>
      </div>
    );
  }
  return null;
};

const LEGEND_BREAKPOINT_HEIGHT = 150; // px

export const RevenueCategoryChart: React.FC<RevenueCategoryChartProps> = ({ data }) => {
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

  // Adjust Pie cx if legend is vertical to make space (simplified adjustment)
  const pieCx = isCompactLegend ? "45%" : "50%"; 
  const pieOuterRadius = isCompactLegend ? "75%" : "80%";

  return (
    <div ref={chartWrapperRef} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={isCompactLegend ? { right: 60 } : {}}>
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,144,0,0.1)'}}/>
          <Legend 
              {...legendProps}
              payload={data.map((entry, index) => ({
                  value: entry.name,
                  type: 'square', // Sharp legend items
                  color: COLORS[index % COLORS.length]
              }))}
          />
          <Pie
            data={data}
            cx={pieCx}
            cy="50%"
            innerRadius="50%"
            outerRadius={pieOuterRadius}
            fill={ACCENT_ORANGE}
            paddingAngle={0} // Remove paddingAngle for sharper look
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
              const RADIAN = Math.PI / 180;
              // Use dynamic radius for label positioning based on potentially smaller pie
              const currentOuterRadius = parseFloat(pieOuterRadius.replace('%','')) / 100 * Math.min(chartWrapperRef.current?.clientWidth || 300, chartWrapperRef.current?.clientHeight || 300) / 2;
              const currentInnerRadius = parseFloat("50%") / 100 * Math.min(chartWrapperRef.current?.clientWidth || 300, chartWrapperRef.current?.clientHeight || 300) / 2;

              const radius = currentInnerRadius + (currentOuterRadius - currentInnerRadius) * 0.5;
              const x = parseFloat(pieCx.replace('%',''))/100 * (chartWrapperRef.current?.clientWidth || 300) + (radius + 15) * Math.cos(-midAngle * RADIAN);
              const y = parseFloat("50%")/100 * (chartWrapperRef.current?.clientHeight || 300) + (radius + 15) * Math.sin(-midAngle * RADIAN);
              
              if (percent * 100 < 5) return null; // Hide small labels
              return (
                <text x={x} y={y} fill={PURE_WHITE /* Using constant directly for inline style */} textAnchor={x > parseFloat(pieCx.replace('%',''))/100 * (chartWrapperRef.current?.clientWidth || 300) ? 'start' : 'end'} dominantBaseline="central" className="font-extralight text-xs">
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={CHART_GRID_COLOR} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
