import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { X, Printer, Warning, Target, TrendUp, Circle, CheckCircle } from 'phosphor-react';
import * as Dialog from '@radix-ui/react-dialog';

export function OnePageReport({ isOpen, onClose, project }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        completedLastWeek: [],
        upcomingTasks: [],
        allTasks: [], // For Gantt
        risks: [],
        financials: { actual: 0, budget: 0 },
        teamCount: 0
    });

    useEffect(() => {
        if (isOpen && project?.id) {
            fetchReportData();
        }
    }, [isOpen, project]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const today = new Date();
            const lastWeek = new Date();
            lastWeek.setDate(today.getDate() - 7);

            // 1. Tasks
            const { data: allTasks } = await supabase.from('tasks')
                .select('*')
                .eq('project_id', project.id)
                .order('start_date', { ascending: true }); // Order by start for gantt

            // Done Last Week (Assuming 'updated_at' is set when done, or close enough)
            // Ideally we'd have 'completed_at', but updated_at works for now if status changed recently
            const completedLastWeek = allTasks?.filter(t =>
                t.status === 'done' &&
                new Date(t.updated_at || t.created_at) > lastWeek
            ) || [];

            // Next Steps (Todo/InProgress)
            const upcomingTasks = allTasks?.filter(t =>
                t.status !== 'done' && t.status !== 'archived'
            ).slice(0, 5) || [];

            // 2. Risks
            const { data: risks } = await supabase.from('project_risks')
                .select('*')
                .eq('project_id', project.id)
                .in('priority', ['high', 'critical'])
                .neq('status', 'Resolved')
                .limit(5);

            // 3. Financials
            const { data: timeLogs } = await supabase.from('time_logs')
                .select('duration_hours, resource:resources(hourly_rate)')
                .eq('project_id', project.id);

            let actualCost = 0;
            if (timeLogs) {
                actualCost = timeLogs.reduce((acc, log) => acc + (log.duration_hours * (log.resource?.hourly_rate || 0)), 0);
            }

            // 4. Team
            const { count: teamCount } = await supabase.from('allocations').select('*', { count: 'exact', head: true }).eq('project_id', project.id);

            setData({
                completedLastWeek,
                upcomingTasks,
                allTasks: allTasks || [],
                risks: risks || [],
                financials: { actual: actualCost, budget: project.budget || 0 },
                teamCount: teamCount || 0
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 print:hidden animate-in fade-in" />
                <Dialog.Content className="fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl z-50 overflow-y-auto print:inset-0 print:rounded-none print:shadow-none print:overflow-visible animate-in zoom-in-95">
                    {/* Controls */}
                    <div className="fixed top-6 right-6 flex gap-3 print:hidden z-50">
                        <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-black transition flex items-center gap-2">
                            <Printer size={20} />
                            Imprimir / PDF
                        </button>
                        <button onClick={onClose} className="bg-white text-slate-500 p-2 rounded-lg shadow-lg border border-slate-200 hover:bg-slate-50 transition">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Report Content */}
                    <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] p-12 print:p-0">
                        {/* Header */}
                        <header className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                            <div>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Status Report</p>
                                <h1 className="text-4xl font-extrabold text-slate-900">{project.name}</h1>
                                <p className="text-slate-500 font-medium mt-1">{project.client_name || 'Cliente Interno'} • {new Date().toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold uppercase ${project.status === 'In Progress' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                                    {project.status}
                                </span>
                            </div>
                        </header>

                        {/* Metrics */}
                        <div className="grid grid-cols-4 gap-6 mb-8">
                            <MetricCard label="Progresso" value={`${project.progress || 0}%`} bg="bg-blue-50" text="text-blue-700" icon={TrendUp} />
                            <MetricCard label="Custo Real" value={`R$ ${Math.round(data.financials.actual)}`} bg="bg-green-50" text="text-green-700" icon={Target} />
                            <MetricCard label="Riscos" value={data.risks.length} bg="bg-red-50" text="text-red-700" icon={Warning} />
                            <MetricCard label="Equipe" value={data.teamCount} bg="bg-purple-50" text="text-purple-700" icon={Circle} />
                        </div>

                        <div className="grid grid-cols-2 gap-12 mb-10">
                            {/* Done Last Week */}
                            <section>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <CheckCircle weight="fill" className="text-green-500" /> Realizado na Semana
                                </h2>
                                <ul className="space-y-3">
                                    {data.completedLastWeek.length === 0 && <li className="text-slate-400 italic text-sm">Nenhuma entrega registrada nos últimos 7 dias.</li>}
                                    {data.completedLastWeek.slice(0, 8).map(t => (
                                        <li key={t.id} className="flex items-start gap-2 text-sm text-slate-700">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                            <span className="leading-snug">{t.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>

                            {/* Upcoming */}
                            <section>
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Target weight="fill" className="text-blue-500" /> Próximos Passos
                                </h2>
                                <ul className="space-y-3">
                                    {data.upcomingTasks.length === 0 && <li className="text-slate-400 italic text-sm">Nenhuma tarefa planejada.</li>}
                                    {data.upcomingTasks.map(t => (
                                        <li key={t.id} className="flex items-start gap-2 text-sm text-slate-700">
                                            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                            <span className="leading-snug">{t.name}</span>
                                            {t.start_date && <span className="text-xs text-slate-400">({new Date(t.start_date).toLocaleDateString('pt-BR').slice(0, 5)})</span>}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        </div>

                        {/* Gantt / Timeline Visual */}
                        <section className="mb-8 break-inside-avoid">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Cronograma do Projeto (Gantt)</h2>
                            <SimpleGantt tasks={data.allTasks} startDate={project.dt_start_est} endDate={project.dt_end_est} />
                        </section>

                        {/* Footer */}
                        <footer className="mt-12 pt-6 border-t border-slate-200 flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                            <span>Gerado por PMO Hub</span>
                            <span>Documento Confidencial</span>
                        </footer>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function MetricCard({ label, value, bg, text, icon: Icon }) {
    return (
        <div className={`p-4 rounded-xl border border-slate-100 ${bg}`}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase opacity-60">{label}</span>
                {Icon && <Icon weight="fill" className={text} />}
            </div>
            <div className={`text-2xl font-bold ${text}`}>{value}</div>
        </div>
    )
}

function SimpleGantt({ tasks, startDate, endDate }) {
    if (!tasks || tasks.length === 0) return <div className="text-slate-400 text-sm italic">Sem dados de cronograma.</div>;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + (30 * 24 * 60 * 60 * 1000)); // default +30d
    const totalDuration = end.getTime() - start.getTime();

    // Show top 10 long tasks + milestones logic? Just show first 12 tasks to fit A4
    const formatTasks = tasks.slice(0, 12);

    return (
        <div className="border border-slate-200 rounded-lg bg-slate-50 p-4">
            <div className="flex justify-between text-[10px] text-slate-400 mb-2 border-b border-slate-200 pb-1">
                <span>{start.toLocaleDateString('pt-BR')}</span>
                <span>{end.toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="space-y-3">
                {formatTasks.map(t => {
                    const tStart = t.start_date ? new Date(t.start_date) : new Date(t.created_at);
                    const tDurationDays = t.duration_days || 1;
                    const tEnd = new Date(tStart.getTime() + (tDurationDays * 24 * 60 * 60 * 1000));

                    let leftPct = ((tStart.getTime() - start.getTime()) / totalDuration) * 100;
                    let widthPct = ((tEnd.getTime() - tStart.getTime()) / totalDuration) * 100;

                    // Clamp
                    if (leftPct < 0) { widthPct += leftPct; leftPct = 0; }
                    widthPct = Math.max(1, Math.min(100 - leftPct, widthPct));

                    return (
                        <div key={t.id} className="relative h-6 flex items-center group">
                            <div className="w-1/4 pr-2 truncate text-[10px] font-medium text-slate-600 text-right">
                                {t.name}
                            </div>
                            <div className="w-3/4 h-full bg-white rounded border border-slate-200 relative overflow-hidden">
                                <div
                                    className={`absolute top-1 bottom-1 rounded ${t.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                >
                                    {widthPct > 5 && <span className="text-[8px] text-white pl-1 leading-4 opacity-0 group-hover:opacity-100 transition-opacity absolute">{t.progress || 0}%</span>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
