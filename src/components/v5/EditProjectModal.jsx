import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FloppyDisk } from 'phosphor-react';
import { supabase } from '../../services/supabase';

export function EditProjectModal({ isOpen, onClose, project, onUpdate }) {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (project) {
            setData({
                name: project.name || '',
                description: project.description || '',
                status: project.status || 'Em Planejamento',
                client_name: project.client_name || '',
                pep_code: project.pep_code || '',
                category: project.category || '',
                sector: project.sector || '',
                lei_do_bem: project.lei_do_bem || false,
                costing_model: project.costing_model || 'Fixed',
                health_scope: project.health_scope || 'green',
                health_time: project.health_time || 'green',
                health_cost: project.health_cost || 'green',
                dt_start_est: project.dt_start_est || '',
                dt_golive_est: project.dt_golive_est || '',
                dt_end_est: project.dt_end_est || '',
                budget_total: project.budget_total || 0,
                cost_actual: project.cost_actual || 0
            });
        }
    }, [project]);

    const handleChange = (field, value) => setData(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase
                .from('projects')
                .update(data)
                .eq('id', project.id);

            if (error) throw error;
            onUpdate(); // Refresh parent
            onClose();
            alert('Projeto atualizado com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao atualizar projeto.');
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = ['Em Planejamento', 'Execução', 'Monitoramento', 'Entregue', 'Cancelado'];

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6 z-50 animate-in zoom-in-95 outline-none max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FloppyDisk /> Editar Projeto
                        </Dialog.Title>
                        <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={20} /></Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome do Projeto</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.name} onChange={e => handleChange('name', e.target.value)} />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                                <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 h-20 resize-none" value={data.description} onChange={e => handleChange('description', e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cliente</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.client_name} onChange={e => handleChange('client_name', e.target.value)} placeholder="Nome do Cliente" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Setor</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.sector} onChange={e => handleChange('sector', e.target.value)} placeholder="Ex: Financeiro" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Status</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.status} onChange={e => handleChange('status', e.target.value)}>
                                    {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">PEP Code</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.pep_code} onChange={e => handleChange('pep_code', e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoria</label>
                                <input className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.category} onChange={e => handleChange('category', e.target.value)} placeholder="Ex: Inovação" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Modelo de Custeio</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3" value={data.costing_model} onChange={e => handleChange('costing_model', e.target.value)}>
                                    <option value="Fixed">Preço Fixo</option>
                                    <option value="Hourly">Horas (Time & Material)</option>
                                    <option value="Hybrid">Híbrido</option>
                                </select>
                            </div>

                            <div className="col-span-2 flex items-center gap-2 py-2">
                                <input type="checkbox" id="lei_do_bem" className="w-4 h-4 text-blue-600 rounded" checked={data.lei_do_bem} onChange={e => handleChange('lei_do_bem', e.target.checked)} />
                                <label htmlFor="lei_do_bem" className="text-sm font-medium text-slate-700">Projeto elegível para Lei do Bem</label>
                            </div>
                        </div>

                        {/* Financials & Dates Container */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Orçamento (BAC)</label>
                                <input type="number" step="0.01" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono" value={data.budget_total} onChange={e => handleChange('budget_total', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Custo Atual (AC)</label>
                                <input type="number" step="0.01" className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono" value={data.cost_actual} onChange={e => handleChange('cost_actual', e.target.value)} />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Início Estimado</label>
                                <input type="date" className="w-full bg-white border border-slate-200 rounded-lg p-2.5" value={data.dt_start_est} onChange={e => handleChange('dt_start_est', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Término Estimado</label>
                                <input type="date" className="w-full bg-white border border-slate-200 rounded-lg p-2.5" value={data.dt_end_est} onChange={e => handleChange('dt_end_est', e.target.value)} />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <HealthSelect label="Saúde Escopo" value={data.health_scope} onChange={v => handleChange('health_scope', v)} />
                            <HealthSelect label="Saúde Prazo" value={data.health_time} onChange={v => handleChange('health_time', v)} />
                            <HealthSelect label="Saúde Custo" value={data.health_cost} onChange={v => handleChange('health_cost', v)} />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-black transition flex items-center gap-2">
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
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
                <option value="blue">Concluído</option>
            </select>
        </div>
    );
}
