import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, TrendUp, Warning, CheckSquare, CaretDown } from 'phosphor-react';
import { supabase } from '../../services/supabase';

export function CreateModal({ isOpen, onClose }) {
    const [activeType, setActiveType] = useState('project'); // project, task, risk
    const [data, setData] = useState({
        name: '', description: '', project_id: '', probability: 3, impact: 3,
        client_name: '', pep_code: '',
        category: '', sector: '',
        health_scope: 'green', health_time: 'green', health_cost: 'green',
        costing_model: 'Fixed',
        dt_start_est: '', dt_golive_est: '', dt_end_est: '',
        lei_do_bem: false
    });
    const [projects, setProjects] = useState([]);
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
            fetchConfigs();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        const { data } = await supabase.from('projects').select('id, name');
        setProjects(data || []);
    };

    const fetchConfigs = async () => {
        const { data } = await supabase.from('app_configurations').select('*');
        setConfigs(data || []);
    };

    const getOptions = (type) => configs.filter(c => c.type === type).map(c => c.value);

    const handleQuickAdd = async (type, label) => {
        const val = prompt(`Adicionar novo ${label}:`);
        if (val) {
            const { error } = await supabase.from('app_configurations').insert([{ type, value: val }]);
            if (!error) {
                fetchConfigs();
                // Autoselect?
                if (type === 'client') setData(d => ({ ...d, client_name: val }));
                if (type === 'category') setData(d => ({ ...d, category: val }));
                if (type === 'sector') setData(d => ({ ...d, sector: val }));
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (activeType === 'project') {
                await supabase.from('projects').insert([{
                    name: data.name,
                    description: data.description,
                    status: 'Em Planejamento',
                    client_name: data.client_name,
                    pep_code: data.pep_code,
                    category: data.category,
                    sector: data.sector,
                    health_scope: data.health_scope,
                    health_time: data.health_time,
                    health_cost: data.health_cost,
                    costing_model: data.costing_model,
                    dt_start_est: data.dt_start_est || null,
                    dt_golive_est: data.dt_golive_est || null,
                    dt_end_est: data.dt_end_est || null,
                    lei_do_bem: data.lei_do_bem
                }]);
            } else if (activeType === 'task') {
                if (!data.project_id) return alert('Selecione um projeto');
                await supabase.from('tasks').insert([{
                    name: data.name,
                    project_id: data.project_id,
                    status: 'todo'
                }]);
            } else if (activeType === 'risk') {
                if (!data.project_id) return alert('Selecione um projeto');
                await supabase.from('project_risks').insert([{
                    title: data.name,
                    project_id: data.project_id,
                    probability: parseInt(data.probability),
                    impact: parseInt(data.impact)
                }]);
            }

            // Reset
            setData({
                name: '', description: '', project_id: '', probability: 3, impact: 3,
                client_name: '', pep_code: '', category: '', sector: '',
                health_scope: 'green', health_time: 'green', health_cost: 'green',
                costing_model: 'Fixed', dt_start_est: '', dt_golive_est: '', dt_end_est: '', lei_do_bem: false
            });
            onClose();
            // trigger refresh or alert
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Erro ao criar item.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95 duration-200 outline-none max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-900">Criar Novo...</Dialog.Title>
                        <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={20} /></Dialog.Close>
                    </div>

                    {/* Type Selector */}
                    <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
                        <button type="button" onClick={() => setActiveType('project')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeType === 'project' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                            <TrendUp weight="bold" /> Projeto
                        </button>
                        <button type="button" onClick={() => setActiveType('task')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeType === 'task' ? 'bg-white shadow text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}>
                            <CheckSquare weight="bold" /> Tarefa
                        </button>
                        <button type="button" onClick={() => setActiveType('risk')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeType === 'risk' ? 'bg-white shadow text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Warning weight="bold" /> Risco
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                                {activeType === 'risk' ? 'Título do Risco' : 'Nome'}
                            </label>
                            <input
                                autoFocus
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                placeholder={`Ex: ${activeType === 'project' ? 'Novo Site Institucional' : (activeType === 'task' ? 'Desenvolver Header' : 'Falta de Orçamento')}`}
                                value={data.name}
                                onChange={e => setData({ ...data, name: e.target.value })}
                                required
                            />
                        </div>

                        {/* Project Selection for Task/Risk */}
                        {activeType !== 'project' && (
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Projeto Relacionado</label>
                                <div className="relative">
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900 appearance-none"
                                        value={data.project_id}
                                        onChange={e => setData({ ...data, project_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione um projeto...</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    <CaretDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Project Fields */}
                        {activeType === 'project' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900 h-20 resize-none"
                                        placeholder="Objetivos e escopo..."
                                        value={data.description}
                                        onChange={e => setData({ ...data, description: e.target.value })}
                                    />
                                </div>

                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex justify-between">
                                        Cliente
                                        <button type="button" className="text-blue-500 hover:underline text-[10px]" onClick={() => handleQuickAdd('client', 'Cliente')}>+ Novo</button>
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900 appearance-none"
                                        value={data.client_name}
                                        onChange={e => setData({ ...data, client_name: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {getOptions('client').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex justify-between">
                                        Categoria
                                        <button type="button" className="text-blue-500 hover:underline text-[10px]" onClick={() => handleQuickAdd('category', 'Categoria')}>+ Nova</button>
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900 appearance-none"
                                        value={data.category}
                                        onChange={e => setData({ ...data, category: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {getOptions('category').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                <div className="relative">
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block flex justify-between">
                                        Setor
                                        <button type="button" className="text-blue-500 hover:underline text-[10px]" onClick={() => handleQuickAdd('sector', 'Setor')}>+ Novo</button>
                                    </label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900 appearance-none"
                                        value={data.sector}
                                        onChange={e => setData({ ...data, sector: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {getOptions('sector').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">PEP / Código</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                        placeholder="Ex: PEP-001"
                                        value={data.pep_code}
                                        onChange={e => setData({ ...data, pep_code: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Início Estimado</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                        value={data.dt_start_est}
                                        onChange={e => setData({ ...data, dt_start_est: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Go-Live Est.</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                        value={data.dt_golive_est}
                                        onChange={e => setData({ ...data, dt_golive_est: e.target.value })}
                                    />
                                </div>
                                {/* END Date and Costing Model from previous code remain... simplified here for diff */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Término Estimado</label>
                                    <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.dt_end_est} onChange={e => setData({ ...data, dt_end_est: e.target.value })} />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Modelo de Custeio</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.costing_model} onChange={e => setData({ ...data, costing_model: e.target.value })}>
                                        <option value="Fixed">Fixo</option>
                                        <option value="Hourly">Por Hora</option>
                                        <option value="Hybrid">Híbrido</option>
                                    </select>
                                </div>

                                <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <HealthSelect label="Saúde Escopo" value={data.health_scope} onChange={v => setData({ ...data, health_scope: v })} />
                                    <HealthSelect label="Saúde Prazo" value={data.health_time} onChange={v => setData({ ...data, health_time: v })} />
                                    <HealthSelect label="Saúde Custo" value={data.health_cost} onChange={v => setData({ ...data, health_cost: v })} />
                                </div>

                                <div className="flex items-center pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={data.lei_do_bem}
                                            onChange={e => setData({ ...data, lei_do_bem: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-slate-700">Lei do Bem?</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeType === 'risk' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Probabilidade (1-5)</label>
                                    <input
                                        type="number" min="1" max="5"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                        value={data.probability}
                                        onChange={e => setData({ ...data, probability: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Impacto (1-5)</label>
                                    <input
                                        type="number" min="1" max="5"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900"
                                        value={data.impact}
                                        onChange={e => setData({ ...data, impact: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-black transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                {loading ? 'Salvando...' : 'Criar Item'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

function HealthSelect({ label, value, onChange }) {
    const colors = {
        green: 'bg-green-100 text-green-700 border-green-200',
        yellow: 'bg-amber-100 text-amber-700 border-amber-200',
        red: 'bg-red-100 text-red-700 border-red-200',
        blue: 'bg-blue-100 text-blue-700 border-blue-200',
        grey: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{label}</label>
            <select
                className={`w-full text-xs font-bold uppercase p-2 rounded border outline-none appearance-none ${colors[value] || colors.grey}`}
                value={value}
                onChange={e => onChange(e.target.value)}
            >
                <option value="green">Saudável</option>
                <option value="yellow">Atenção</option>
                <option value="red">Crítico</option>
                <option value="blue">Concluído/Hypercare</option>
                <option value="grey">Não Iniciado</option>
            </select>
        </div>
    );
}
