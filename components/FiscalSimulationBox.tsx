

import React, { useState, useEffect, useCallback } from 'react';
import type { FiscalInput, FiscalResult } from '../types';
import { SectionTitle } from './SectionTitle';
import { 
  FISCAL_REGIME_COEFFICIENT_DEFAULT, 
  FISCAL_REGIME_TAX_RATE_DEFAULT,
  FISCAL_REGIME_TAX_RATE_STARTUP,
  INPS_GESTIONE_SEPARATA_RATE_DEFAULT
} from '../constants';

interface FiscalSimulationBoxProps {
  initialRevenue?: number;
  onSimulationRun?: (input: FiscalInput, result: FiscalResult) => void;
}

const formatCurrency = (value: number) => {
  return "€ " + value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const FiscalSimulationBox: React.FC<FiscalSimulationBoxProps> = ({ initialRevenue = 25000, onSimulationRun }) => {
  const [inputs, setInputs] = useState<FiscalInput>({
    revenue: initialRevenue,
    coeffRedditivita: FISCAL_REGIME_COEFFICIENT_DEFAULT,
    aliquotaInps: INPS_GESTIONE_SEPARATA_RATE_DEFAULT,
    aliquotaImposta: FISCAL_REGIME_TAX_RATE_DEFAULT,
    isStartupRate: false,
    deductInpsForTax: true, // Default: INPS is deductible
  });
  const [results, setResults] = useState<FiscalResult | null>(null);

  const calculateFiscalDetails = useCallback(() => {
    const { revenue, coeffRedditivita, aliquotaInps, isStartupRate, deductInpsForTax } = inputs;
    const aliquotaImposta = isStartupRate ? FISCAL_REGIME_TAX_RATE_STARTUP : FISCAL_REGIME_TAX_RATE_DEFAULT;

    const redditoImponibileLordo = revenue * coeffRedditivita;
    const contributiInps = redditoImponibileLordo * aliquotaInps;
    
    let taxableIncomeForImposta = redditoImponibileLordo;
    if (deductInpsForTax) {
        taxableIncomeForImposta = redditoImponibileLordo - contributiInps;
        if (taxableIncomeForImposta < 0) taxableIncomeForImposta = 0; // Cannot be negative
    }
    
    const impostaDovuta = taxableIncomeForImposta * aliquotaImposta;
    const nettoDisponibile = revenue - contributiInps - impostaDovuta;

    const currentResults = {
      redditoImponibileLordo,
      contributiInps,
      taxableIncomeForImposta,
      impostaDovuta,
      nettoDisponibile,
    };
    setResults(currentResults);
    if (onSimulationRun) {
      onSimulationRun(inputs, currentResults);
    }
  }, [inputs, onSimulationRun]);

  useEffect(() => {
    calculateFiscalDetails();
  }, [calculateFiscalDetails]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | boolean = value;
    if (type === 'number') {
      processedValue = parseFloat(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    }

    setInputs(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleRateTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const isStartup = e.target.value === 'startup';
    setInputs(prev => ({ 
        ...prev, 
        isStartupRate: isStartup,
        aliquotaImposta: isStartup ? FISCAL_REGIME_TAX_RATE_STARTUP : FISCAL_REGIME_TAX_RATE_DEFAULT
    }));
  };


  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <SectionTitle>Simulazione Fiscale (Forfettario)</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-grow">
        {/* Inputs Column */}
        <div className="space-y-3">
          <div>
            <label htmlFor="revenue" className="block text-sm font-normal text-content/80 mb-1">Ricavi Annuali Lordi (€)</label>
            <input type="number" name="revenue" id="revenue" value={inputs.revenue} onChange={handleInputChange} className="w-full" />
          </div>
          <div>
            <label htmlFor="coeffRedditivita" className="block text-sm font-normal text-content/80 mb-1">Coefficiente Redditività (%)</label>
            <input type="number" name="coeffRedditivita" id="coeffRedditivita" value={inputs.coeffRedditivita * 100} onChange={(e) => setInputs(prev => ({...prev, coeffRedditivita: parseFloat(e.target.value)/100}))} step="1" className="w-full" />
          </div>
          <div>
            <label htmlFor="aliquotaInps" className="block text-sm font-normal text-content/80 mb-1">Aliquota INPS Gest. Separata (%)</label>
            <input type="number" name="aliquotaInps" id="aliquotaInps" value={inputs.aliquotaInps * 100} onChange={(e) => setInputs(prev => ({...prev, aliquotaInps: parseFloat(e.target.value)/100}))} step="0.01" className="w-full" />
          </div>
          <div>
            <label htmlFor="taxRateType" className="block text-sm font-normal text-content/80 mb-1">Tipo Aliquota Imposta</label>
            <select name="taxRateType" id="taxRateType" value={inputs.isStartupRate ? 'startup' : 'standard'} onChange={handleRateTypeChange} className="w-full">
              <option value="standard">Standard (15%)</option>
              <option value="startup">Startup (5%)</option>
            </select>
          </div>
           <div className="flex items-center mt-2">
              <input type="checkbox" name="deductInpsForTax" id="deductInpsForTax" checked={inputs.deductInpsForTax} onChange={handleInputChange} className="h-4 w-4 text-accent bg-primary border-content/30 focus:ring-accent" />
              <label htmlFor="deductInpsForTax" className="ml-2 text-sm font-normal text-content/80">Deduci contributi INPS per calcolo imposta</label>
            </div>
        </div>

        {/* Results Column */}
        {results && (
          <div className="space-y-2 text-content/90">
            <p className="text-sm font-light text-content/70">Reddito Imponibile Lordo (RAL): <span className="font-normal text-content float-right">{formatCurrency(results.redditoImponibileLordo)}</span></p>
            <p className="text-sm font-light text-content/70">Contributi INPS Dovuti: <span className="font-normal text-content float-right">{formatCurrency(results.contributiInps)}</span></p>
            <p className="text-sm font-light text-content/70">Reddito Imponibile Fiscale: <span className="font-normal text-content float-right">{formatCurrency(results.taxableIncomeForImposta)}</span></p>
            <p className="text-sm font-light text-accent">Imposta Sostitutiva Dovuta ({inputs.aliquotaImposta * 100}%): <span className="font-normal text-accent float-right">{formatCurrency(results.impostaDovuta)}</span></p>
            <hr className="border-content/20 my-3"/>
            <p className="text-lg font-normal text-content">Netto Disponibile Stimato: <span className="text-xl text-accent float-right">{formatCurrency(results.nettoDisponibile)}</span></p>
          </div>
        )}
      </div>
       <p className="text-xs text-content/50 mt-4 text-center font-light flex-shrink-0">Disclaimer: Questa è una simulazione e non sostituisce la consulenza di un commercialista.</p>
    </div>
  );
};
