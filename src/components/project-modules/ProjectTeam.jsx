import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useParams } from 'react-router-dom';
import { Plus, Trash, UserCircle, Briefcase } from 'phosphor-react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'phosphor-react';

export function ProjectTeam() {
    const { id: projectId } = useParams();
    const [members, setMembers] = useState([]);
    const [allResources, setAllResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Add Member State
    const [selectedResource, setSelectedResource] = useState('');
    const [role, setRole] = useState('');
    const [hours, setHours] = useState(0);

    useEffect(() => {
        if (projectId) {
            fetchTeam();
        }
    }, [projectId]);

    const fetchTeam = async () => {
        try {
            // Fetch allocations with resource details
            const { data, error } = await supabase
                .from('allocations')
                .select(`
                    *,
                    resource:resources(*)
                `)
                .eq('project_id', projectId);

            if (error) throw error;
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching team:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        const { data } = await supabase.from('resources').select('*');
        setAllResources(data || []);
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedResource) return;

        try {
            const { error } = await supabase.from('allocations').insert([{
                project_id: projectId,
                resource_id: selectedResource,
                role: role,
                hours: hours
            }]);

            if (error) throw error;

            setIsAddOpen(false);
            fetchTeam();
            // Reset form
            setSelectedResource('');
            setRole('');
            setHours(0);
        } catch (err) {
            console.error(err);
            alert('Erro ao adicionar membro ou membro já alocado.');
        }
    };

    const removeMember = async (allocationId) => {
        if (!confirm('Remover membro da equipe?')) return;

        try {
            await supabase.from('allocations').delete().eq('id', allocationId);
            setMembers(members.filter(m => m.id !== allocationId));
        } catch (err) {
            console.error(err);
        }
    };

    const openAddModal = () => {
        fetchResources();
        setIsAddOpen(true);
    };

    if (loading) return <div className="p-8 text-slate-500">Carregando equipe...</div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">Equipe do Projeto</h3>
                    <p className="text-sm text-slate-500">Gerencie a alocação de recursos neste projeto.</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition"
                >
                    <Plus weight="bold" /> Adicionar Membro
                </button>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map(member => (
                    <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center relative group">
                        <button
                            onClick={() => removeMember(member.id)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                            <Trash weight="bold" />
                        </button>

                        <div className="w-20 h-20 rounded-full bg-slate-100 mb-4 overflow-hidden flex items-center justify-center text-2xl font-bold text-slate-400">
                            {member.resource?.avatar_url ? (
                                <img src={member.resource.avatar_url} alt={member.resource.name} className="w-full h-full object-cover" />
                            ) : (
                                member.resource?.name?.[0]
                            )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-lg">{member.resource?.name}</h4>
                        <p className="text-sm text-slate-500 font-medium mb-4 flex items-center gap-1">
                            <Briefcase size={14} /> {member.role || member.resource?.role || 'Membro'}
                        </p>

                        <div className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-500 uppercase text-xs">Alocação</span>
                            <span className="font-mono font-bold text-slate-900">{member.hours}h</span>
                        </div>
                    </div>
                ))}
            </div>

            {members.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
                    <p className="text-slate-400 font-medium">Nenhum membro alocado ainda.</p>
                </div>
            )}

            {/* Add Modal */}
            <Dialog.Root open={isAddOpen} onOpenChange={setIsAddOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-xl font-bold text-slate-900">Alocar Recurso</Dialog.Title>
                            <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={20} /></Dialog.Close>
                        </div>

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Recurso</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    value={selectedResource}
                                    onChange={e => setSelectedResource(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {allResources.map(r => (
                                        <option key={r.id} value={r.id}>{r.name} ({r.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Papel no Projeto</label>
                                <input
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    placeholder="Ex: Tech Lead"
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Horas Planejadas</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                    value={hours}
                                    onChange={e => setHours(e.target.value)}
                                />
                            </div>
                            <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition">
                                Confirmar Alocação
                            </button>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
