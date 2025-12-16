import React, { useState } from 'react';
import { X, Plus, Funnel } from 'phosphor-react';
import * as Popover from '@radix-ui/react-popover';

export function FilterBar({ filters, setFilters, availableTags }) {
    // availableTags = [{ id: 'status', label: 'Status', options: ['Em Andamento', 'Crítico'] }]

    const removeFilter = (key) => {
        const newFilters = { ...filters };
        delete newFilters[key];
        setFilters(newFilters);
    };

    const addFilter = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm font-medium text-slate-500 mr-2 flex items-center gap-2">
                <Funnel size={16} />
                Filtros:
            </span>

            {Object.entries(filters).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-100 animate-in fade-in zoom-in-95">
                    <span className="text-blue-400 uppercase text-[10px] tracking-wide font-bold">{key}:</span>
                    {value}
                    <button
                        onClick={() => removeFilter(key)}
                        className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition"
                    >
                        <X size={12} weight="bold" />
                    </button>
                </div>
            ))}

            <Popover.Root>
                <Popover.Trigger asChild>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-dashed border-slate-300 text-slate-500 text-sm rounded-full hover:border-slate-400 hover:text-slate-700 transition">
                        <Plus size={14} />
                        Adicionar Filtro
                    </button>
                </Popover.Trigger>
                <Popover.Portal>
                    <Popover.Content className="bg-white p-2 rounded-lg shadow-xl border border-slate-200 w-48 z-50 animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2" sideOffset={5}>
                        <div className="text-xs font-semibold text-slate-400 px-2 py-1 uppercase">Opções</div>
                        {availableTags.map(tag => (
                            <Popover.Root key={tag.id}>
                                <Popover.Trigger className="w-full text-left px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50 rounded flex justify-between items-center group">
                                    {tag.label}
                                    <Plus size={12} className="opacity-0 group-hover:opacity-100" />
                                </Popover.Trigger>
                                <Popover.Content className="bg-white p-1 rounded-lg shadow-xl border border-slate-200 w-40 ml-2 animate-in fade-in zoom-in-95" side="right" align="start">
                                    {tag.options.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => addFilter(tag.id, opt)}
                                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-blue-50 hover:text-blue-600 rounded transition"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </Popover.Content>
                            </Popover.Root>
                        ))}
                        <Popover.Arrow className="fill-white" />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
