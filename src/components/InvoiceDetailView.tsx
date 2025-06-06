
import React, { useState, useEffect } from 'react';
import type { InvoiceDetailViewProps, InvoiceDisplayItem, Client, Invoice, ActivityLogType } from '../types';
import { SectionTitle } from './SectionTitle';
import { ArrowLeftIcon, EditIcon, SaveIcon, CheckCircleIcon } from './icons';
import clsx from 'clsx';

const formatDateSafe = (date: Date | null): string => {
  if (!date) return '-';
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};

const formatCurrency = (amount: number) => {
  return "€ " + amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper to parse DD/MM/YY or DD/MM/YYYY to Date object (UTC)
const parseDisplayDateString = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000; 
    else if (year > 9999 || year < 1000) { 
        if (parts[2].length === 1 || parts[2].length === 3) {
            console.warn(`Ambiguous year format in date string for detail parsing: ${dateStr}. Assuming it's invalid.`);
            return null;
        }
    }

    if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year >=1000 && year <=9999) {
      const date = new Date(Date.UTC(year, month, day));
      if (date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day) {
        return date;
      }
    }
  }
  console.warn(`Invalid date string for detail parsing: ${dateStr}`);
  return null;
};


// Helper to format Date object to DD/MM/YY string
const dateToDisplayString = (date: Date | null): string => {
  if (!date) return '';
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = String(date.getUTCFullYear()).slice(-2); // YY format
  return `${day}/${month}/${year}`;
};

// Helper to format Date object to YYYY-MM-DD string for date input
const dateToInputString = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const StatusBadgeDetail: React.FC<{ status: InvoiceDisplayItem['status'] }> = ({ status }) => {
  let bgColor = 'bg-content/20';
  let textColor = 'text-content/80';
  switch (status) {
    case 'Pagata': bgColor = 'bg-success/80'; textColor = 'text-content'; break;
    case 'In Scadenza': bgColor = 'bg-warning/80'; textColor = 'text-content'; break;
    case 'Scaduta': bgColor = 'bg-danger/80'; textColor = 'text-content'; break;
    case 'Da Incassare': bgColor = 'bg-blue-500/80'; textColor = 'text-content'; break;
    case 'Nota di Credito': bgColor = 'bg-purple-500/80'; textColor = 'text-content'; break;
  }
  return <span className={`px-3 py-1 text-xs font-semibold ${bgColor} ${textColor} whitespace-nowrap`}>{status}</span>;
};


export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  invoice,
  clientsData,
  onGoBack,
  onEditInvoice,
  addActivityLogEntry
}) => {
  const [isEditingPaymentDate, setIsEditingPaymentDate] = useState(false);
  const [paymentDateInput, setPaymentDateInput] = useState<string>(dateToInputString(parseDisplayDateString(invoice.dataIncassoAttesa)));

  const client = clientsData.find(c => c.id === invoice.idCliente);

  const handleSavePaymentDate = () => {
    const newPaymentDateForStorage = paymentDateInput ? dateToDisplayString(new Date(paymentDateInput + "T00:00:00Z")) : "";

    onEditInvoice(invoice.id, { dataIncassoAttesa: newPaymentDateForStorage });
    addActivityLogEntry('INVOICE_EDIT', `Data incasso attesa per fattura ${invoice.numeroFattura} aggiornata a: ${newPaymentDateForStorage || 'Nessuna'}`, { invoiceId: invoice.id, newDate: newPaymentDateForStorage });
    setIsEditingPaymentDate(false);
  };

  const DetailItem: React.FC<{ label: string; value: string | React.ReactNode; className?: string; valueClassName?: string; title?: string }> = ({ label, value, className, valueClassName, title }) => (
    <div className={clsx("py-2", className)}>
      <span className="text-xs text-content/70 block">{label}</span>
      <span className={clsx("text-sm text-content/90 block", valueClassName)} title={title}>{value}</span>
    </div>
  );

  return (
    <div className="h-full flex flex-col text-content">
      {/* Header */}
      <div className="flex items-center mb-6 pb-4 border-b border-content/20">
        <button
          onClick={onGoBack}
          className="p-2 mr-4 text-content/80 hover:text-accent transition-colors hover:bg-card flex-shrink-0 btn-icon"
          aria-label="Torna alla lista fatture"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <SectionTitle className="!mb-0 !text-xl sm:!text-2xl flex-grow">{`Dettaglio Fattura: ${invoice.numeroFattura}`}</SectionTitle>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-accent) var(--color-primary-light)' }}>

        <div className="bg-card p-4 sm:p-6 border border-content/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <DetailItem label="Numero Fattura" value={invoice.numeroFattura} valueClassName="font-semibold text-accent" />
                <DetailItem label="Data Emissione" value={formatDateSafe(parseDisplayDateString(invoice.dataFattura))} />
                <DetailItem label="Stato" value={<StatusBadgeDetail status={invoice.status} />} />
                <DetailItem label="Cliente" value={client ? client.denominazione : 'Sconosciuto'} valueClassName="truncate" title={client?.denominazione}/>
                <DetailItem label="P.IVA Cliente" value={client ? client.partitaIva : 'N/D'} />
                 <DetailItem label="Scadenza (gg)" value={invoice.scadenzaGiorni.toString()} />
                {invoice.calculatedDueDate && (
                    <DetailItem label="Data Scadenza Calcolata" value={formatDateSafe(invoice.calculatedDueDate)} />
                )}
                <DetailItem label="Natura Fattura" value={invoice.naturaFattura} />
                <DetailItem label="IVA %" value={invoice.ivaPercentuale} />
            </div>
        </div>

        <div className="bg-card p-4 sm:p-6 border border-content/10">
            <h4 className="text-md font-semibold text-content/90 mb-3 border-b border-content/10 pb-2">Dettagli Economici</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Importo Fattura" value={formatCurrency(invoice.importoFattura)} valueClassName="text-2xl font-bold text-accent" />

                <div>
                    <label htmlFor="paymentDate" className="text-xs text-content/70 block mb-0.5">Data Incasso Attesa/Effettiva</label>
                    {isEditingPaymentDate ? (
                    <div className="flex items-center space-x-2">
                        <input
                            type="date"
                            id="paymentDate"
                            value={paymentDateInput}
                            onChange={(e) => setPaymentDateInput(e.target.value)}
                            className="flex-grow" 
                        />
                        <button onClick={handleSavePaymentDate} className="btn-primary !p-2" title="Salva Data Incasso">
                            <SaveIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setIsEditingPaymentDate(false)} className="btn-secondary !p-2" title="Annulla Modifica">
                            <ArrowLeftIcon className="w-4 h-4" />
                        </button>
                    </div>
                    ) : (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-content/90">
                        {invoice.displayPaymentDate}
                        </span>
                        {invoice.status !== 'Nota di Credito' && (
                             <button onClick={() => setIsEditingPaymentDate(true)} className="btn-icon !p-1" title="Modifica Data Incasso">
                                <EditIcon className="w-4 h-4 text-content/60 hover:text-accent" />
                            </button>
                        )}
                    </div>
                    )}
                </div>
            </div>
        </div>

        <div className="bg-card p-4 sm:p-6 border border-content/10">
            <h4 className="text-md font-semibold text-content/90 mb-2">Descrizione Fattura</h4>
            <p className="text-sm text-content/80 whitespace-pre-wrap">{invoice.descrizioneFattura}</p>
        </div>

      </div>
    </div>
  );
};
