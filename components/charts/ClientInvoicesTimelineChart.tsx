
import React, { useRef, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'; // Removed Legend
import type { ClientInvoiceTimelineChartProps, InvoiceTimelineDataPoint } from '../../types';
import { CHART_ACCENT_COLOR_1, CHART_TEXT_COLOR, CHART_GRID_COLOR, PURE_WHITE, DEEP_BLUE } from '../../constants';

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as InvoiceTimelineDataPoint;
    return (
      <div className="bg-primary/90 backdrop-blur-sm p-2 border border-content/20 text-xs"> {/* Changed deepBlue to primary, pureWhite to content, removed shadow */}
        <p className="label text-content/80 font-normal">Fatt.: {dataPoint.invoiceNumber}</p>
        <p className="label text-content/80 font-normal">Data: {dataPoint.date.toLocaleDateString('it-IT')}</p>
        <p className="intro text-accent font-semibold">Importo: € {dataPoint.amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p> {/* Changed accentOrange to accent */}
      </div>
    );
  }
  return null;
};

export const ClientInvoicesTimelineChart: React.FC<ClientInvoiceTimelineChartProps> = ({ data }) => {
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  
  const chartMargins = { top: 5, right: 5, left: -25, bottom: 0 }; 

  const formatDateTick = (date: Date) => {
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: '2-digit' }).replace('.', '');
  };
  
  // Determine tick interval to prevent clutter
  const tickInterval = data.length > 10 ? Math.floor(data.length / 5) : 0;


  return (
    <div ref={chartWrapperRef} style={{ width: '100%', height: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={chartMargins}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDateTick} 
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 10, fontWeight: 200 }} 
            interval={tickInterval} 
          />
          <YAxis 
            tickFormatter={(value) => `€${(value / 1000).toLocaleString('it-IT', { maximumFractionDigits:0 })}k`} 
            tick={{ fill: CHART_TEXT_COLOR, fontSize: 10, fontWeight: 200 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,144,0,0.1)'}}/>
          <Line 
            type="monotone" 
            dataKey="amount" 
            stroke={CHART_ACCENT_COLOR_1} 
            strokeWidth={2} 
            dot={{ r: 3, fill: CHART_ACCENT_COLOR_1 }} 
            activeDot={{ r: 6, stroke: CHART_TEXT_COLOR, strokeWidth: 1 }} 
            name="Importo Fattura" 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};