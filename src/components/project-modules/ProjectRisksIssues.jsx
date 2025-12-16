import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useParams } from 'react-router-dom';
import { Warning, TrafficSign, Plus, Trash, PencilSimple, Calendar, Archive, XCircle, CheckCircle, Clock } from 'phosphor-react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'phosphor-react';

export function ProjectRisksIssues() {
    const { id: projectId } = useParams();
    const [risks, setRisks] = useState([]);
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('risks');

    // Sub-Filter State: Active (Open/InProgress), Resolved, Canceled, Archived
    const [filterStatus, setFilterStatus] = useState('Active');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('risk');
    const [editingItem, setEditingItem] = useState(null);

    // Expanded State
    const [formData, setFormData] = useState({
        title: '', description: '', probability: 3, impact: 3, priority: 'Medium', status: 'Open',
        category: 'Escopo', cause: '', mitigation_plan: '', contingency_plan: '',
        planned_date: '', actual_date: '', cancellation_reason: ''
    });

    const categories = ['Escopo', 'Prazo', 'Custo', 'Recursos', 'Qualidade', 'Comunicação', 'Stakeholders'];

    useEffect(() => {
        if (projectId) fetchAll();
    }, [projectId]);

    const fetchAll = async () => {
        setLoading(true);
        const { data: risksData } = await supabase.from('project_risks').select('*').eq('project_id', projectId);
        const { data: issuesData } = await supabase.from('project_issues').select('*').eq('project_id', projectId);
        setRisks(risksData || []);
        setIssues(issuesData || []);
        setLoading(false);
    };

    const handleOpenModal = (type, item = null) => {
        setModalType(type);
        setEditingItem(item);
        if (item) {
            setFormData({
                title: item.title,
                description: item.description || '',
                probability: item.probability || 3,
                impact: item.impact || 3,
                priority: item.priority || 'Medium',
                status: item.status || 'Open',
                category: item.category || 'Escopo',
                cause: item.cause || '',
                mitigation_plan: item.mitigation_plan || '',
                contingency_plan: item.contingency_plan || '',
                planned_date: item.planned_date || '',
                actual_date: item.actual_date || '',
                cancellation_reason: item.cancellation_reason || ''
            });
        } else {
            setFormData({
                title: '', description: '', probability: 3, impact: 3, priority: 'Medium', status: 'Open',
                category: 'Escopo', cause: '', mitigation_plan: '', contingency_plan: '',
                planned_date: '', actual_date: '', cancellation_reason: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const commonData = {
                title: formData.title,
                description: formData.description,
                project_id: projectId,
                status: formData.status,
                planned_date: formData.planned_date || null,
                actual_date: formData.actual_date || null,
                cancellation_reason: formData.cancellation_reason
            };

            if (modalType === 'risk') {
                const riskData = {
                    ...commonData,
                    probability: formData.probability,
                    impact: formData.impact,
                    category: formData.category,
                    cause: formData.cause,
                    mitigation_plan: formData.mitigation_plan,
                    contingency_plan: formData.contingency_plan
                };
                if (editingItem) {
                    await supabase.from('project_risks').update(riskData).eq('id', editingItem.id);
                } else {
                    await supabase.from('project_risks').insert([riskData]);
                }
            } else {
                const issueData = { ...commonData, priority: formData.priority };
                if (editingItem) {
                    await supabase.from('project_issues').update(issueData).eq('id', editingItem.id);
                } else {
                    await supabase.from('project_issues').insert([issueData]);
                }
            }
            setIsModalOpen(false);
            fetchAll();
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar item.');
        }
    };

    const handleDelete = async (id, type) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            const table = type === 'risk' ? 'project_risks' : 'project_issues';
            await supabase.from(table).delete().eq('id', id);
            fetchAll();
        } catch (err) {
            console.error(err);
        }
    };

    // Filter Logic
    const getFilteredList = () => {
        const list = activeTab === 'risks' ? risks : issues;
        return list.filter(item => {
            const s = item.status || 'Open';
            if (filterStatus === 'Active') return ['Open', 'In Progress'].includes(s);
            if (filterStatus === 'Resolved') return s === 'Resolved';
            if (filterStatus === 'Canceled') return s === 'Canceled';
            if (filterStatus === 'Archived') return s === 'Archived';
            return true;
        });
    };

    const filteredList = getFilteredList();

    if (loading) return <div className="p-8 text-slate-500">Carregando Riscos e Issues...</div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Main Tabs */}
            <div className="flex gap-4 border-b border-slate-200 pb-2">
                <button
                    onClick={() => setActiveTab('risks')}
                    className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'risks' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}
                >
                    <Warning weight="bold" /> Riscos
                </button>
                <button
                    onClick={() => setActiveTab('issues')}
                    className={`pb-2 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'issues' ? 'border-red-500 text-red-600' : 'border-transparent text-slate-400'}`}
                >
                    <TrafficSign weight="bold" /> Issues
                </button>
            </div>

            {/* Sub-Filters & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['Active', 'Resolved', 'Canceled', 'Archived'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${filterStatus === status
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {status === 'Active' && <span>Em Aberto</span>}
                            {status === 'Resolved' && <span className="flex items-center gap-1"><CheckCircle weight="fill" className="text-green-500" /> Concluídos</span>}
                            {status === 'Canceled' && <span className="flex items-center gap-1"><XCircle weight="fill" className="text-red-500" /> Cancelados</span>}
                            {status === 'Archived' && <span className="flex items-center gap-1"><Archive weight="fill" className="text-slate-400" /> Arquivados</span>}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => handleOpenModal(activeTab === 'risks' ? 'risk' : 'issue')}
                    className={`px-4 py-2 rounded-lg text-white font-bold text-sm flex items-center gap-2 transition ${activeTab === 'risks' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-500 hover:bg-red-600'}`}
                >
                    <Plus weight="bold" /> Adicionar {activeTab === 'risks' ? 'Risco' : 'Issue'}
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredList.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                        <p className="text-slate-400">Nenhum item encontrado nesta categoria.</p>
                    </div>
                )}

                {filteredList.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between group">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold 
                                    ${item.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                                        item.status === 'Canceled' ? 'bg-slate-100 text-slate-500 line-through' :
                                            (item.priority === 'Critical' || (item.probability * item.impact) > 15) ? 'bg-red-100 text-red-700' :
                                                'bg-blue-50 text-blue-600'}`}>
                                    {item.status === 'Open' ? 'Aberto' : item.status === 'In Progress' ? 'Em Andamento' :
                                        item.status === 'Resolved' ? 'Concluído' : item.status === 'Canceled' ? 'Cancelado' : item.status}
                                </span>
                            </div>

                            <p className="text-sm text-slate-500 line-clamp-2">{item.description || 'Sem descrição.'}</p>

                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-400 items-center">
                                {activeTab === 'risks' && (
                                    <>
                                        <span className="font-mono bg-slate-50 px-2 py-1 rounded">Grau: {item.probability * item.impact}</span>
                                        <span className="font-medium text-slate-600">{item.category}</span>
                                    </>
                                )}
                                {item.planned_date && (
                                    <span className="flex items-center gap-1 text-slate-500">
                                        <Calendar weight="fill" /> Prev: {new Date(item.planned_date).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                                {item.actual_date && (
                                    <span className="flex items-center gap-1 text-green-600 font-bold">
                                        <CheckCircle weight="fill" /> Real: {new Date(item.actual_date).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>

                            {item.status === 'Canceled' && item.cancellation_reason && (
                                <div className="mt-2 text-xs bg-red-50 text-red-600 p-2 rounded border border-red-100">
                                    <strong>Motivo do Cancelamento:</strong> {item.cancellation_reason}
                                </div>
                            )}

                            {/* Matriz details preview */}
                            {activeTab === 'risks' && (item.cause || item.mitigation_plan) && (
                                <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
                                    {item.mitigation_plan && <span>Mitigação: Definido</span>}
                                    {item.contingency_plan && <span>Contingência: Definido</span>}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition pl-4">
                            <button onClick={() => handleOpenModal(activeTab === 'risks' ? 'risk' : 'issue', item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar">
                                <PencilSimple size={18} weight="bold" />
                            </button>
                            <button onClick={() => handleDelete(item.id, activeTab === 'risks' ? 'risk' : 'issue')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Excluir">
                                <Trash size={18} weight="bold" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-xl font-bold text-slate-900">
                                {editingItem ? 'Editar' : 'Novo'} {modalType === 'risk' ? 'Risco' : 'Issue'}
                            </Dialog.Title>
                            <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={20} /></Dialog.Close>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                        value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="Open">Aberto</option>
                                        <option value="In Progress">Em Andamento</option>
                                        <option value="Resolved">Concluído</option>
                                        <option value="Canceled">Cancelado</option>
                                        <option value="Archived">Arquivado</option>
                                    </select>
                                </div>
                                {modalType === 'issue' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridade</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                            value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                                            <option value="Low">Baixa</option>
                                            <option value="Medium">Média</option>
                                            <option value="High">Alta</option>
                                            <option value="Critical">Crítica</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {formData.status === 'Canceled' && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                    <label className="block text-xs font-bold text-red-500 uppercase mb-1">Justificativa do Cancelamento</label>
                                    <textarea
                                        className="w-full bg-white border border-red-200 rounded-lg p-3 h-20 resize-none text-red-900"
                                        value={formData.cancellation_reason} onChange={e => setFormData({ ...formData, cancellation_reason: e.target.value })} required
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Prevista</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                        value={formData.planned_date} onChange={e => setFormData({ ...formData, planned_date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Realizada</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                        value={formData.actual_date} onChange={e => setFormData({ ...formData, actual_date: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 h-24 resize-none"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            {modalType === 'risk' && (
                                <div className="space-y-4 pt-2 border-t border-slate-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                            <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                                value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Probabilidade (1-5)</label>
                                            <input type="number" min="1" max="5" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                                value={formData.probability} onChange={e => setFormData({ ...formData, probability: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Impacto (1-5)</label>
                                            <input type="number" min="1" max="5" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                                value={formData.impact} onChange={e => setFormData({ ...formData, impact: e.target.value })} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Causa Raiz</label>
                                        <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 h-20 resize-none"
                                            value={formData.cause} onChange={e => setFormData({ ...formData, cause: e.target.value })} placeholder="Qual a origem do risco?" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ação de Mitigação</label>
                                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 h-24 resize-none"
                                                value={formData.mitigation_plan} onChange={e => setFormData({ ...formData, mitigation_plan: e.target.value })} placeholder="Como evitar?" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Plano de Contingência</label>
                                            <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 h-24 resize-none"
                                                value={formData.contingency_plan} onChange={e => setFormData({ ...formData, contingency_plan: e.target.value })} placeholder="O que fazer se acontecer?" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition">
                                Salvar
                            </button>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
