import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Calendar, CheckCircle, Circle } from 'phosphor-react';
import * as Dialog from '@radix-ui/react-dialog';
import { supabase } from '../../services/supabase';

export function EditTimelineModal({ isOpen, onClose, project, onUpdate }) {
    const [milestones, setMilestones] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', date: '', status: 'pending' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && project?.id) {
            fetchMilestones();
        }
    }, [isOpen, project]);

    const fetchMilestones = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('project_milestones')
            .select('*')
            .eq('project_id', project.id)
            .order('date', { ascending: true });

        if (data) setMilestones(data);
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.date) return;

        const { error } = await supabase.from('project_milestones').insert([{
            project_id: project.id,
            name: newItem.name,
            date: newItem.date,
            status: newItem.status
        }]);

        if (!error) {
            setNewItem({ name: '', date: '', status: 'pending' });
            fetchMilestones();
            onUpdate(); // Refresh parent
        }
    };

    const handleDelete = async (id) => {
        await supabase.from('project_milestones').delete().eq('id', id);
        fetchMilestones();
        onUpdate();
    };

    const handleUpdateStatus = async (id, currentStatus) => {
        const nextStatus = currentStatus === 'pending' ? 'active' : (currentStatus === 'active' ? 'done' : 'pending');
        await supabase.from('project_milestones').update({ status: nextStatus }).eq('id', id);
        fetchMilestones();
        onUpdate();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95">
                    <div className="flex justify-between items-center mb-6">
                        <Dialog.Title className="text-xl font-bold text-slate-900">
                            Editar Linha do Tempo
                        </Dialog.Title>
                        <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={20} /></Dialog.Close>
                    </div>

                    <p className="text-sm text-slate-500 mb-4">
                        Adicione marcos manuais para sobrescrever a geração automática.
                    </p>

                    {/* List */}
                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                        {milestones.length === 0 && <p className="text-sm italic text-slate-400">Nenhum marco manual definido.</p>}
                        {milestones.map(m => (
                            <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <button
                                    onClick={() => handleUpdateStatus(m.id, m.status)}
                                    title={`Status: ${m.status}`}
                                >
                                    {m.status === 'done' ? <CheckCircle className="text-blue-500" weight="fill" size={20} /> :
                                        m.status === 'active' ? <Circle className="text-blue-500" weight="duotone" size={20} /> :
                                            <Circle className="text-slate-300" size={20} />
                                    }
                                </button>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700">{m.name}</p>
                                    <p className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                                <button onClick={() => handleDelete(m.id)} className="text-slate-400 hover:text-red-500 p-2">
                                    <Trash size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add New */}
                    <form onSubmit={handleAdd} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Novo Marco</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                                type="text" placeholder="Nome do Marco"
                                className="col-span-2 p-2 rounded border border-slate-200 text-sm"
                                value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                required
                            />
                            <input
                                type="date"
                                className="p-2 rounded border border-slate-200 text-sm"
                                value={newItem.date} onChange={e => setNewItem({ ...newItem, date: e.target.value })}
                                required
                            />
                            <select
                                className="p-2 rounded border border-slate-200 text-sm"
                                value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value })}
                            >
                                <option value="pending">Pendente</option>
                                <option value="active">Em Andamento</option>
                                <option value="done">Concluído</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm">
                            <Plus size={16} /> Adicionar
                        </button>
                    </form>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
