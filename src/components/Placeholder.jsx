import React from 'react';
import { Wrench } from 'phosphor-react';

export default function Placeholder({ title }) {
    return (
        <div className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-400">
                <Wrench size={48} weight="duotone" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
            <p className="text-slate-500 max-w-md">
                Esta funcionalidade está no roadmap de migração e estará disponível em breve.
            </p>
        </div>
    );
}
