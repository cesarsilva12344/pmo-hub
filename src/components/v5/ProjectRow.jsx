import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';
import { Heartbeat, Warning, CheckCircle, DotsThreeVertical, Pencil, Trash, Archive } from 'phosphor-react';
import { supabase } from '../../services/supabase';

export function ProjectRow({ project, onDelete }) {
    const navigate = useNavigate();
    const [actionOpen, setActionOpen] = useState(false);

    // RAG Status Logic
    const getHealthIcon = () => {
        if (project.health_scope === 'red' || project.health_time === 'red') return <Warning size={20} className="text-red-500" weight="fill" />;
        if (project.health_scope === 'yellow') return <Heartbeat size={20} className="text-amber-500" weight="fill" />;
        return <CheckCircle size={20} className="text-green-500" weight="fill" />;
    };

    const physicalProgress = project.progress || 0;
    const financialProgress = project.budget_consumed_pct || 0;
    const isOverBudget = financialProgress > physicalProgress;

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
            try {
                await supabase.from('projects').delete().eq('id', project.id);
                if (onDelete) onDelete(project.id);
            } catch (err) {
                alert('Erro ao excluir');
            }
        }
        setActionOpen(false);
    };

    return (
        <tr
            onClick={() => navigate(`/projects/${project.id}`)}
            className="group hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
        >
            <td className="p-4 py-3">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="font-semibold text-slate-800">{project.name}</div>
                        <div className="text-xs text-slate-400">{project.pep_code || 'SEM-PEP'}</div>
                    </div>

                    {/* Quick Actions Menu */}
                    <div onClick={e => e.stopPropagation()}>
                        <Popover.Root open={actionOpen} onOpenChange={setActionOpen}>
                            <Popover.Trigger asChild>
                                <button className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-all">
                                    <DotsThreeVertical size={20} weight="bold" />
                                </button>
                            </Popover.Trigger>
                            <Popover.Portal>
                                <Popover.Content
                                    className="bg-white p-1 rounded-xl shadow-xl border border-slate-200 min-w-[160px] z-50 animate-in fade-in zoom-in-95"
                                    side="bottom"
                                    align="end"
                                    sideOffset={5}
                                >
                                    <div className="flex flex-col gap-1">
                                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-left">
                                            <Pencil size={16} /> Editar
                                        </button>
                                        <button className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg text-left">
                                            <Archive size={16} /> Arquivar
                                        </button>
                                        <div className="h-px bg-slate-100 my-1"></div>
                                        <button
                                            onClick={handleDelete}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg text-left group-delete"
                                        >
                                            <Trash size={16} /> Excluir
                                        </button>
                                    </div>
                                    <Popover.Arrow className="fill-white" />
                                </Popover.Content>
                            </Popover.Portal>
                        </Popover.Root>
                    </div>
                </div>
            </td>

            <td className="p-4 py-3">
                <div className="flex items-center gap-2">
                    <Tooltip.Provider>
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <div className="cursor-help hover:scale-110 transition-transform">{getHealthIcon()}</div>
                            </Tooltip.Trigger>
                            <Tooltip.Content className="bg-slate-900 text-white text-xs p-2 rounded max-w-xs z-50 shadow-xl" sideOffset={5}>
                                <p className="font-bold mb-1">Status de Saúde</p>
                                <p>Escopo: {project.health_scope}</p>
                                <p>Prazo: {project.health_time}</p>
                                <p>Custo: {project.health_cost}</p>
                                <Tooltip.Arrow className="fill-slate-900" />
                            </Tooltip.Content>
                        </Tooltip.Root>
                    </Tooltip.Provider>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border ${project.status === 'Entregue' ? 'bg-green-50 text-green-700 border-green-100' :
                            project.status === 'Cancelado' ? 'bg-red-50 text-red-700 border-red-100' :
                                'bg-blue-50 text-blue-700 border-blue-100'
                        }`}>
                        {project.status}
                    </span>
                </div>
            </td>

            <td className="p-4 py-3 w-1/3">
                <div className="space-y-1.5">
                    <div className={`relative h-2 bg-slate-100 rounded-full overflow-hidden ${isOverBudget ? 'ring-1 ring-red-200' : ''}`}>
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-500 z-10 rounded-full"
                            style={{ width: `${physicalProgress}%` }}
                        />
                        <div
                            className={`absolute top-0 left-0 h-full z-0 rounded-full opacity-50 ${isOverBudget ? 'bg-red-500' : 'bg-green-500'}`}
                            style={{ width: `${financialProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                        <span>Físico: {physicalProgress}%</span>
                        <span className={isOverBudget ? 'text-red-500' : 'text-slate-400'}>
                            $ Consu.: {financialProgress}%
                        </span>
                    </div>
                </div>
            </td>

            <td className="p-4 py-3 text-right text-sm text-slate-500">
                <div className="flex items-center justify-end gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                        {project.manager_id ? 'JS' : 'U'}
                    </div>
                    <span className="hidden sm:inline">João Silva</span>
                </div>
            </td>
        </tr>
    );
}
