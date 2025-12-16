import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Users, Briefcase, Plus, Trash, User } from 'phosphor-react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'phosphor-react';

export default function Resources() {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Add Resource State
    const [newResource, setNewResource] = useState({ name: '', role: '', hourly_rate: 0, status: 'Active' });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const { data } = await supabase.from('resources').select('*');
            setResources(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('resources').insert([newResource]);
            if (error) throw error;
            fetchResources();
            setIsAddOpen(false);
            setNewResource({ name: '', role: '', hourly_rate: 0, status: 'Active' });
        } catch (error) {
            alert('Erro ao adicionar recurso.');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir este recurso permanentemente?')) return;
        try {
            const { error } = await supabase.from('resources').delete().eq('id', id);
            if (error) throw error;
            setResources(resources.filter(r => r.id !== id));
        } catch (error) {
            alert('Erro ao excluir. Verifique se há alocações ativas.');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Equipe & Recursos</h1>
                    <p className="text-slate-500 mt-1">Visão 360º da disponibilidade do time.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition flex items-center gap-2"
                >
                    <Plus weight="bold" /> Novo Recurso
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {resources.map(res => {
                    const statusColor = res.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';

                    return (
                        <div key={res.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 group hover:shadow-lg transition-all hover:-translate-y-1 relative overflow-hidden">
                            <button
                                onClick={() => handleDelete(res.id)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition z-10"
                            >
                                <Trash weight="bold" size={18} />
                            </button>

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
                                    <User size={32} weight="duotone" />
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${statusColor}`}>
                                    {res.status === 'Active' ? 'Disponível' : 'Arquivado'}
                                </span>
                            </div>

                            <h3 className="font-bold text-slate-800 text-lg truncate">{res.name}</h3>
                            <div className="flex items-center gap-1 text-slate-400 text-xs mb-4">
                                <Briefcase size={14} />
                                {res.role || 'Sem Cargo'}
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-slate-50 p-2 rounded-lg text-center">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Taxa/hr</p>
                                        <p className="font-mono text-sm font-semibold text-slate-700">R$ {res.hourly_rate || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Modal */}
            <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-xl font-bold text-slate-900">Novo Recurso</Dialog.Title>
                            <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={20} /></Dialog.Close>
                        </div>

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome Completo</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    value={newResource.name}
                                    onChange={e => setNewResource({ ...newResource, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cargo / Função</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    value={newResource.role}
                                    onChange={e => setNewResource({ ...newResource, role: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Taxa Horária (R$)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    value={newResource.hourly_rate}
                                    onChange={e => setNewResource({ ...newResource, hourly_rate: e.target.value })}
                                />
                            </div>
                            <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition">
                                Cadastrar
                            </button>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
