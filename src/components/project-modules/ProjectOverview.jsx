import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flag, Robot, ClockCounterClockwise, CalendarCheck, Clock, Warning, PencilSimple } from 'phosphor-react';
import { timesheetService } from '../../services/timesheetService';
import { supabase } from '../../services/supabase';
import { EditTimelineModal } from '../v5/EditTimelineModal';

export function ProjectOverview({ project }) {
    const [timeTravel, setTimeTravel] = useState(100);
    const [actualHours, setActualHours] = useState(0);
    const [milestones, setMilestones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTimelineEditOpen, setIsTimelineEditOpen] = useState(false);

    useEffect(() => {
        if (project?.id) {
            fetchData();
        }
    }, [project?.id]);

    const fetchData = async () => {
        setLoading(true);
        // 1. Hours
        timesheetService.getProjectTotalHours(project.id).then(setActualHours);

        // 2. Timeline Logic
        // Try fetching Manual Milestones first
        const { data: manualMilestones } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('project_id', project.id)
            .order('date', { ascending: true });

        const { data: tasks } = await supabase.from('tasks')
            .select('*')
            .eq('project_id', project.id)
            .order('start_date', { ascending: true });

        // Calculate Project Boundaries
        const today = new Date().getTime();
        const pStart = project.dt_start_est ? new Date(project.dt_start_est).getTime() : today;
        const pEnd = project.dt_end_est ? new Date(project.dt_end_est).getTime() : (today + 30 * 24 * 60 * 60 * 1000);
        const totalDuration = Math.max(pEnd - pStart, 1);

        let activeItems = [];
        let isManual = false;

        if (manualMilestones && manualMilestones.length > 0) {
            // Use Manual
            activeItems = manualMilestones.map(m => ({
                ...m,
                start_date: m.date,
                // Manual status is stored directly 
            }));
            isManual = true;
        } else if (tasks && tasks.length > 0) {
            // Auto-Generate Fallback
            let foundMilestones = tasks.filter(t => t.is_milestone === true || t.duration_days === 0);
            if (foundMilestones.length < 3) {
                const otherTasks = tasks.filter(t => !t.is_milestone && t.duration_days > 0);
                const longTasks = [...otherTasks]
                    .sort((a, b) => (b.duration_days || 0) - (a.duration_days || 0))
                    .slice(0, 4 - foundMilestones.length);
                foundMilestones = [...foundMilestones, ...longTasks];
            }
            if (foundMilestones.length === 0) {
                foundMilestones = [tasks[0], tasks[Math.floor(tasks.length / 2)], tasks[tasks.length - 1]];
            }
            // Filter uniques/nulls
            activeItems = foundMilestones.filter((t, i, s) => s.indexOf(t) === i && t);
        }

        // Map to Visuals
        let markers = activeItems.map(m => {
            const date = m.start_date ? new Date(m.start_date).getTime() : new Date(m.created_at).getTime();
            let pos = ((date - pStart) / totalDuration) * 100;
            pos = Math.max(0, Math.min(100, pos)); // Clamp

            // Status handling: Manual vs Task
            let status = 'pending';
            if (isManual) {
                status = m.status; // 'pending' | 'active' | 'done'
            } else {
                status = m.status === 'done' ? 'done' : (m.status === 'in_progress' ? 'active' : 'pending');
            }

            return {
                id: m.id,
                label: m.name,
                date: m.start_date,
                status,
                pos
            };
        }).sort((a, b) => a.pos - b.pos);

        // If still no markers (no tasks, no manual), add Start/End
        if (markers.length === 0) {
            markers = [
                { id: 'start', label: 'Início', date: project.dt_start_est, status: 'done', pos: 0 },
                { id: 'end', label: 'Fim Previsto', date: project.dt_end_est, status: 'pending', pos: 100 }
            ];
        }

        setMilestones(markers);
        setLoading(false);
    };

    const hoursEst = Number(project.hours_estimated) || 0;
    const hoursDone = Number(actualHours) || 0;
    const hoursPct = hoursEst > 0 ? (hoursDone / hoursEst) * 100 : 0;
    const progress = project.progress || 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Visual Timeline */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <CalendarCheck className="text-blue-500" /> Linha do Tempo Macro
                            </h3>
                            <button
                                onClick={() => setIsTimelineEditOpen(true)}
                                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                            >
                                <PencilSimple size={14} weight="bold" /> Editar Timeline
                            </button>
                        </div>

                        <div className="relative h-40 flex items-center mx-4 select-none mt-4">
                            {/* Base Line */}
                            <div className="absolute left-0 right-0 h-1 bg-slate-100 rounded-full"></div>

                            {/* Progress Line (Based on Project Progress %) */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="absolute left-0 h-1 bg-blue-500 rounded-full"
                            />

                            {/* Milestones */}
                            {milestones.map((m, i) => (
                                <div
                                    key={m.id}
                                    className="absolute transform -translate-x-1/2 flex flex-col items-center group cursor-pointer"
                                    style={{ left: `${m.pos}%`, top: i % 2 === 0 ? '10%' : '50%' }}
                                >
                                    {/* Marker Line for Alternating Items */}
                                    <div className={`h-8 w-px bg-slate-200 absolute ${i % 2 === 0 ? 'top-8' : '-top-8'}`} />

                                    <div className={`
                                        w-8 h-8 rounded-full border-4 border-white shadow-md flex items-center justify-center relative z-10 transition-all group-hover:scale-110
                                        ${m.status === 'done' ? 'bg-blue-500 text-white' : (m.status === 'active' ? 'bg-white border-blue-500 text-blue-500' : 'bg-slate-200 text-slate-400')}
                                    `}>
                                        <Flag weight="fill" size={12} />
                                    </div>

                                    <div className={`
                                        absolute text-center transition-opacity min-w-[120px]
                                        ${i % 2 === 0 ? '-top-10' : 'top-10'}
                                    `}>
                                        <p className="text-[10px] font-bold text-slate-700 truncate px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded shadow-sm border border-slate-100 mx-auto max-w-full">
                                            {m.label}
                                        </p>
                                        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                                            {m.date ? new Date(m.date).toLocaleDateString('pt-BR').slice(0, 5) : ''}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <p className="text-[10px] text-slate-400 text-center mt-6 italic">
                            * Marcos gerados automaticamente com base nas tarefas e duração do projeto.
                        </p>
                    </div>

                    {/* Executive Summary */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Resumo Executivo</h3>
                        </div>
                        <div className="prose prose-slate max-w-none text-sm">
                            <p className="text-slate-600 leading-relaxed">
                                O projeto <strong>{project.name}</strong> encontra-se atualmente com <strong>{progress}%</strong> de progresso reportado.
                                {hoursPct > 100 ?
                                    ` Atenção: O consumo de horas (${hoursPct.toFixed(0)}%) excedeu o planejado.` :
                                    ` O consumo de horas está em ${hoursPct.toFixed(0)}%, dentro do esperado.`
                                }
                                {milestones.some(m => m.status === 'active') && (
                                    <span> O foco atual sugerido é: <strong>{milestones.find(m => m.status === 'active')?.label}</strong>.</span>
                                )}
                            </p>
                            {project.description && (
                                <p className="mt-2 text-slate-500 italic border-l-2 border-slate-100 pl-3">
                                    "{project.description}"
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Hours */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Clock size={20} weight="fill" />
                            </div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Controle de Horas</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-500 mb-0.5">Realizadas</p>
                                    <p className="text-2xl font-bold text-slate-900">{hoursDone.toFixed(1)}h</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 mb-0.5">Estimadas</p>
                                    <p className="text-sm font-bold text-slate-600">{hoursEst.toFixed(1)}h</p>
                                </div>
                            </div>
                            <div className="relative pt-2">
                                <div className="flex justify-between text-xs font-semibold mb-1">
                                    <span className={`${hoursPct > 100 ? 'text-red-500' : 'text-blue-600'}`}>
                                        {hoursPct.toFixed(0)}% Executado
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${hoursPct > 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                                        style={{ width: `${Math.min(hoursPct, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Health */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Saúde do Projeto</h4>
                        <div className="space-y-4">
                            <HealthRow label="Escopo" status={project.health_scope || 'grey'} />
                            <HealthRow label="Prazo" status={project.health_time || 'grey'} />
                            <HealthRow label="Custo" status={project.health_cost || 'grey'} />
                        </div>
                    </div>

                    {/* Details */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Detalhes</h4>
                        <div className="space-y-3 text-sm">
                            <DetailRow label="Cliente" value={project.client_name} />
                            <DetailRow label="PEP" value={project.pep_code} />
                            <DetailRow label="Custeio" value={project.costing_model === 'Hourly' ? 'Por Hora' : (project.costing_model === 'Hybrid' ? 'Híbrido' : 'Fixo')} />
                            <DetailRow label="Início" value={formatDate(project.dt_start_est)} />
                            <DetailRow label="Fim" value={formatDate(project.dt_end_est)} />
                        </div>
                    </div>
                </div>
            </div>

            <EditTimelineModal
                isOpen={isTimelineEditOpen}
                onClose={() => setIsTimelineEditOpen(false)}
                project={project}
                onUpdate={fetchData}
            />
        </div>
    );
}

function HealthRow({ label, status }) {
    const colors = {
        green: 'bg-green-500',
        yellow: 'bg-amber-500',
        red: 'bg-red-500',
        blue: 'bg-blue-500',
        grey: 'bg-slate-300'
    };
    const labels = {
        green: 'Saudável',
        yellow: 'Atenção',
        red: 'Crítico',
        blue: 'Hypercare',
        grey: 'N/A'
    };

    return (
        <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700 text-sm">{label}</span>
            <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${colors[status] || colors.grey}`} />
                <span className="text-xs font-bold text-slate-500 uppercase">{labels[status] || labels.grey}</span>
            </div>
        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div className="flex justify-between">
            <span className="text-slate-500">{label}</span>
            <span className="font-medium text-slate-900 truncate max-w-[120px]" title={value}>{value || '-'}</span>
        </div>
    );
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}
