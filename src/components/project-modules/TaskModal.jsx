import React, { useState, useEffect } from 'react';
import { X } from 'phosphor-react';
import { supabase } from '../../services/supabase';

export function TaskModal({ project, task, onClose, onSave, tasks = [], users = [] }) {
    const [formData, setFormData] = useState({
        name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        duration_days: 1,
        progress: 0,
        status: 'todo',
        is_milestone: false,
        assignee_id: '',
        parent_id: '',
        predecessor_id: '', // Simple single predecessor for now, can be an array if UI supports it
        dependency_type: 'FS'
    });

    useEffect(() => {
        if (task) {
            setFormData({
                ...task,
                start_date: task.start_date ? task.start_date.split('T')[0] : '',
                end_date: task.end_date ? task.end_date.split('T')[0] : '',
                assignee_id: task.assignee_id || '',
                parent_id: task.parent_id || '',
                predecessor_id: task.predecessor_id || '',
                is_milestone: task.is_milestone || task.duration_days === 0 || false
            });
        }
    }, [task]);

    const handleChange = (field, value) => {
        let newData = { ...formData, [field]: value };

        // Logic for Milestone
        if (field === 'is_milestone') {
            if (value === true) {
                newData.duration_days = 0;
                newData.end_date = newData.start_date;
            } else {
                if (newData.duration_days === 0) newData.duration_days = 1;
            }
        }

        // Logic for Dates/Duration
        if (field === 'start_date' || field === 'end_date') {
            if (newData.start_date && newData.end_date && !newData.is_milestone) {
                const start = new Date(newData.start_date);
                const end = new Date(newData.end_date);
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                newData.duration_days = diffDays || 1;
            }
        }

        setFormData(newData);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 text-lg">
                        {task ? 'Editar Atividade' : 'Nova Atividade'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Atividade</label>
                            <input
                                required
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => handleChange('name', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_milestone"
                                checked={formData.is_milestone}
                                onChange={e => handleChange('is_milestone', e.target.checked)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="is_milestone" className="text-sm font-medium text-slate-700 select-none">
                                É um Marco (Milestone)?
                            </label>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                            <input
                                type="date"
                                required
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={formData.start_date}
                                onChange={e => handleChange('start_date', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                            <input
                                type="date"
                                required
                                disabled={formData.is_milestone}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
                                value={formData.end_date}
                                onChange={e => handleChange('end_date', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duração (Dias)</label>
                            <input
                                type="number"
                                min="0"
                                required
                                disabled={formData.is_milestone}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm disabled:opacity-50"
                                value={formData.duration_days}
                                onChange={e => handleChange('duration_days', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Progress & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={formData.status}
                                onChange={e => handleChange('status', e.target.value)}
                            >
                                <option value="todo">A Fazer</option>
                                <option value="in_progress">Em Progresso</option>
                                <option value="review">Revisão</option>
                                <option value="done">Concluído</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">% Conclusão</label>
                            <input
                                type="number"
                                min="0" max="100"
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={formData.progress}
                                onChange={e => handleChange('progress', Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Relations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Recurso (Responsável)</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={formData.assignee_id}
                                onChange={e => handleChange('assignee_id', e.target.value)}
                            >
                                <option value="">Sem responsável</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tarefa Pai (Hierarquia)</label>
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={formData.parent_id}
                                onChange={e => handleChange('parent_id', e.target.value)}
                            >
                                <option value="">Nenhuma (Raíz)</option>
                                {tasks.filter(t => t.id !== (task?.id)).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Predecessors (Simplified) */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Predecessora (Dependência)</label>
                        <div className="flex gap-2">
                            <select
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={formData.predecessor_id}
                                onChange={e => handleChange('predecessor_id', e.target.value)}
                            >
                                <option value="">Nenhuma</option>
                                {tasks.filter(t => t.id !== (task?.id)).map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <select
                                className="w-32 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={formData.dependency_type}
                                onChange={e => handleChange('dependency_type', e.target.value)}
                            >
                                <option value="FS">Fim-Início</option>
                                <option value="SS">Início-Início</option>
                                <option value="FF">Fim-Fim</option>
                                <option value="SF">Início-Fim</option>
                            </select>
                        </div>
                    </div>

                </form>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">Cancelar</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20">
                        Salvar Atividade
                    </button>
                </div>
            </div>
        </div>
    );
}
