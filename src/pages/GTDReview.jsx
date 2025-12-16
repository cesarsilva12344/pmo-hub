import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import {
    CheckSquare, Calendar, Sun, Moon, Target, ListChecks,
    CaretRight, CaretDown, CheckCircle, Warning, Tray
} from 'phosphor-react';

export default function GTDReview() {
    const [activeTab, setActiveTab] = useState('daily'); // daily, weekly, monthly
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [inboxCount, setInboxCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Checklist States (Local Storage persistent could be added later)
    const [dailyChecklist, setDailyChecklist] = useState({
        inbox: false, calendar: false, priorities: false, projects: false, waiting: false, plan: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Tasks (Calendar Items basically)
        const { data: tasksData } = await supabase.from('tasks').select('*, project:projects(name)').neq('status', 'done');
        // Fetch Projects
        const { data: projectsData } = await supabase.from('projects').select('*').eq('status', 'In Progress');
        // Fetch Inbox Count
        const { count } = await supabase.from('inbox_items').select('*', { count: 'exact', head: true }).eq('status', 'inbox');

        setTasks(tasksData || []);
        setProjects(projectsData || []);
        setInboxCount(count || 0);
        setLoading(false);
    };

    const toggleCheck = (list, setList, key) => {
        setList({ ...list, [key]: !list[key] });
    };

    // Calculate MITs (Most Important Tasks - High Priority)
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' || t.priority === 'critical');

    return (
        <div className="max-w-7xl mx-auto pt-8 px-6 pb-12 h-full flex flex-col animate-in fade-in">
            <header className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Painel de Revisão GTD</h1>
                    <p className="text-slate-500 mt-1">Mantenha o foco, revise seus compromissos e planeje o futuro.</p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    {[
                        { id: 'daily', label: 'Diário', icon: Sun },
                        { id: 'weekly', label: 'Semanal', icon: ListChecks },
                        { id: 'monthly', label: 'Mensal', icon: Calendar },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon weight={activeTab === tab.id ? 'fill' : 'bold'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Checklist & Metrics */}
                <div className="space-y-6">
                    {/* Checklist Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <CheckSquare weight="fill" className="text-blue-500" />
                            {activeTab === 'daily' ? 'Checklist Diário' : activeTab === 'weekly' ? 'Revisão Semanal' : 'Revisão Mensal'}
                        </h3>

                        <div className="space-y-3">
                            {activeTab === 'daily' && (
                                <>
                                    <CheckItem checked={dailyChecklist.inbox} onClick={() => toggleCheck(dailyChecklist, setDailyChecklist, 'inbox')} label="Processar Inbox (Zero Inbox)" sublabel={`${inboxCount} itens pendentes`} />
                                    <CheckItem checked={dailyChecklist.calendar} onClick={() => toggleCheck(dailyChecklist, setDailyChecklist, 'calendar')} label="Revisar Calendário (Hoje/Amanhã)" />
                                    <CheckItem checked={dailyChecklist.priorities} onClick={() => toggleCheck(dailyChecklist, setDailyChecklist, 'priorities')} label="Definir Top 3 Tarefas (MITs)" />
                                    <CheckItem checked={dailyChecklist.projects} onClick={() => toggleCheck(dailyChecklist, setDailyChecklist, 'projects')} label="Avançar 1 Projeto Ativo" />
                                    <CheckItem checked={dailyChecklist.waiting} onClick={() => toggleCheck(dailyChecklist, setDailyChecklist, 'waiting')} label="Checar 'Aguardando Resposta'" />
                                    <CheckItem checked={dailyChecklist.plan} onClick={() => toggleCheck(dailyChecklist, setDailyChecklist, 'plan')} label="Planejar o dia de amanhã" />
                                </>
                            )}
                            {activeTab === 'weekly' && (
                                <>
                                    <CheckItem label="Esvaziar todas as Caixas de Entrada" sublabel="Físicas e Digitais" />
                                    <CheckItem label="Revisar Calendário (Semana Passada/Futura)" />
                                    <CheckItem label="Atualizar Listas de Projetos" />
                                    <CheckItem label="Revisar 'Algum Dia/Talvez'" />
                                    <CheckItem label="Definir Objetivos da próxima semana" />
                                </>
                            )}
                            {activeTab === 'monthly' && (
                                <>
                                    <CheckItem label="Revisar Metas de Longo Prazo" />
                                    <CheckItem label="Analisar Métricas do Mês Passado" />
                                    <CheckItem label="Planejar Projetos Prioritários" />
                                    <CheckItem label="Limpar arquivos digitais" />
                                    <CheckItem label="Celebrar Conquistas!" />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Inbox Status */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Caixa de Entrada</p>
                                <h2 className="text-4xl font-bold">{inboxCount}</h2>
                                <p className="text-slate-400 text-sm mt-1">itens para processar</p>
                            </div>
                            <div className="bg-white/10 p-4 rounded-xl">
                                <Tray size={32} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Center & Right: Content Views */}
                <div className="lg:col-span-2 space-y-6">

                    {/* TOP 3 / High Priority */}
                    {activeTab === 'daily' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Target weight="fill" className="text-red-500" />
                                    Foco do Dia (Top Prioridades)
                                </h3>
                                <span className="text-xs font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg">Alta Energia</span>
                            </div>

                            <div className="space-y-3">
                                {highPriorityTasks.length === 0 && <p className="text-slate-400 text-sm italic">Nenhuma tarefa crítica hoje. Aproveite para adiantar projetos!</p>}
                                {highPriorityTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 border border-red-100 bg-red-50/30 rounded-xl">
                                        <div className="w-5 h-5 rounded-full border-2 border-red-400 bg-white" />
                                        <div className="flex-1">
                                            <p className="font-bold text-slate-800">{task.name}</p>
                                            <p className="text-xs text-slate-500">{task.project?.name || 'Sem Projeto'}</p>
                                        </div>
                                        <span className="text-xs font-bold text-red-600 bg-white px-2 py-1 rounded border border-red-100">CRÍTICO</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Calendar View (Simplified List) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Calendar weight="fill" className="text-purple-500" />
                            Agenda {activeTab === 'daily' ? 'do Dia' : activeTab === 'weekly' ? 'da Semana' : 'do Mês'}
                        </h3>

                        {/* Timeline */}
                        <div className="space-y-4">
                            {tasks.length === 0 && <p className="text-slate-400">Nenhum agendamento encontrado.</p>}
                            {tasks.slice(0, activeTab === 'daily' ? 5 : 10).map((task, idx) => (
                                <div key={task.id} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors" />
                                        {idx !== tasks.length - 1 && <div className="w-0.5 bg-slate-100 flex-1 my-1" />}
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-700">{task.name}</h4>
                                            <span className="text-xs text-slate-400 font-mono">
                                                {task.start_date ? new Date(task.start_date).toLocaleDateString('pt-BR') : 'Sem data'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">{task.project?.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Projects Review (Weekly/Monthly) */}
                    {activeTab !== 'daily' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <ListChecks weight="fill" className="text-green-500" />
                                Revisão de Projetos Ativos
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {projects.map(p => (
                                    <div key={p.id} className="p-4 border border-slate-100 rounded-xl hover:shadow-md transition bg-slate-50/50">
                                        <h4 className="font-bold text-slate-800">{p.name}</h4>
                                        <div className="mt-2 flex justify-between items-center">
                                            <span className="text-xs text-slate-500">Progresso</span>
                                            <span className="text-xs font-bold text-green-600">{p.progress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-1 rounded hover:bg-slate-50">
                                                Ver Próxima Ação
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function CheckItem({ label, sublabel, checked, onClick }) {
    const [isChecked, setIsChecked] = useState(checked || false);

    const handleClick = () => {
        setIsChecked(!isChecked);
        if (onClick) onClick();
    };

    return (
        <div
            onClick={handleClick}
            className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition select-none ${isChecked ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100'}`}
        >
            <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}>
                {isChecked && <CheckCircle size={14} weight="bold" />}
            </div>
            <div>
                <p className={`text-sm font-medium transition-colors ${isChecked ? 'text-green-800 line-through' : 'text-slate-700'}`}>{label}</p>
                {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
            </div>
        </div>
    )
}
