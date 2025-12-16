import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { ArrowLeft, CheckSquare, Clock, CurrencyDollar, Users, Sparkle, ChartLine, Warning, PencilSimple } from 'phosphor-react';
import { KanbanBoard } from '../components/project-modules/KanbanBoard';
import { GanttChart } from '../components/project-modules/GanttChart';
import { ProjectOverview } from '../components/project-modules/ProjectOverview';
import { CalendarView } from '../components/project-modules/CalendarView';
import { TimesheetView } from '../components/project-modules/TimesheetView';
import { ProjectTeam } from '../components/project-modules/ProjectTeam';
import { ProjectFinancials } from '../components/project-modules/ProjectFinancials';
import { ProjectRisksIssues } from '../components/project-modules/ProjectRisksIssues';
import { ContextChat } from '../components/v5/ContextChat';
import { CreateModal } from '../components/v5/CreateModal';
import { EditProjectModal } from '../components/v5/EditProjectModal';
import { OnePageReport } from '../components/project-modules/OnePageReport';
import { FilePdf } from 'phosphor-react';

export default function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isReportOpen, setIsReportOpen] = useState(false);

    useEffect(() => {
        if (id) fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProject(data);
        } catch (err) {
            console.error('Error fetching project:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-slate-500">Carregando...</div>;
    if (!project) return <div className="p-8 text-slate-500">Projeto não encontrado.</div>;

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: ChartLine },
        { id: 'timesheet', label: 'Timesheet', icon: Clock },
        { id: 'kanban', label: 'Kanban V5', icon: CheckSquare },
        { id: 'gantt', label: 'Cronograma', icon: Clock },
        { id: 'calendar', label: 'Calendário', icon: Clock },
        { id: 'financial', label: 'Financeiro', icon: CurrencyDollar },
        { id: 'team', label: 'Equipe', icon: Users },
        { id: 'risks', label: 'Riscos & Issues', icon: Warning },
    ];

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white animate-in fade-in">
            {/* Header V5 */}
            <div className="px-8 py-6 border-b border-slate-200 bg-white flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
                        <button className="hover:text-slate-600 flex items-center gap-1" onClick={() => navigate('/projects')}>
                            <ArrowLeft /> Voltar
                        </button>
                        <span>/</span>
                        {project.client_name && (
                            <>
                                <span className="font-medium text-slate-600">{project.client_name}</span>
                                <span>/</span>
                            </>
                        )}
                        <span>{project.pep_code || 'SEM-PEP'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        {project.name}
                        <span className={`px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium border border-blue-200`}>{project.status}</span>
                    </h1>
                </div>

                <div className="flex gap-3">
                    <button
                        className="flex items-center gap-2 text-slate-600 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition border border-slate-200"
                        onClick={() => setIsEditOpen(true)}
                    >
                        <PencilSimple /> Editar
                    </button>
                    <button
                        onClick={() => setIsChatOpen(true)}
                        className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition border border-indigo-100"
                    >
                        <Sparkle weight="fill" />
                        AI Insights
                    </button>
                    <button
                        onClick={() => setIsReportOpen(true)}
                        className="flex items-center gap-2 text-slate-600 bg-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-slate-50 transition border border-slate-200"
                        title="Exportar Status Report"
                    >
                        <FilePdf size={18} /> OnePage
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-8 border-b border-slate-200 flex gap-6 bg-slate-50/50 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                            ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }
                        `}
                    >
                        <tab.icon size={16} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto bg-slate-50/30 p-8">
                {activeTab === 'kanban' && <KanbanBoard />}
                {activeTab === 'calendar' && <CalendarView />}
                {activeTab === 'gantt' && <GanttChart />}
                {activeTab === 'timesheet' && <TimesheetView project={project} />}

                {activeTab === 'overview' && <ProjectOverview project={project} />}
                {activeTab === 'financial' && <ProjectFinancials project={project} />}

                {activeTab === 'team' && <ProjectTeam />}
                {activeTab === 'risks' && <ProjectRisksIssues />}
            </div>


            {/* AI Assistant Drawer */}
            <ContextChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

            {/* Edit Modal */}
            {isEditOpen && (
                <EditProjectModal
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    project={project}
                    onUpdate={fetchProjectDetails}
                />
            )}

            {/* OnePage Report Modal */}
            <OnePageReport
                isOpen={isReportOpen}
                onClose={() => setIsReportOpen(false)}
                project={project}
            />
        </div>
    );
}
