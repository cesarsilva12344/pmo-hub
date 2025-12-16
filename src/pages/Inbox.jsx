import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { DndContext, DragOverlay, useDraggable, useDroppable, closestCorners } from '@dnd-kit/core';
import { Plus, Trash, ArchiveBox, ArrowRight, Hourglass, Tray, CheckCircle, User, Briefcase, Target } from 'phosphor-react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'phosphor-react';
import GTDReview from './GTDReview';

const COLUMNS = [
    { id: 'inbox', title: 'Entrada', color: 'bg-slate-50', border: 'border-slate-200', icon: Tray },
    { id: 'action', title: 'Próximas Ações', color: 'bg-blue-50', border: 'border-blue-100', icon: ArrowRight },
    { id: 'waiting', title: 'Aguardando', color: 'bg-amber-50', border: 'border-amber-100', icon: Hourglass },
    { id: 'someday', title: 'Algum Dia/Talvez', color: 'bg-purple-50', border: 'border-purple-100', icon: ArchiveBox },
    { id: 'reference', title: 'Referência', color: 'bg-indigo-50', border: 'border-indigo-100', icon: CheckCircle }, 
    { id: 'done', title: 'Concluído', color: 'bg-green-50', border: 'border-green-100', icon: CheckCircle },
];

export default function Inbox() {
    const [items, setItems] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('board'); // 'board' | 'review'

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ content: '', project_id: '', assignee_id: '', status: 'inbox' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: inboxData } = await supabase.from('inbox_items').select('*').order('created_at', { ascending: false });
        const { data: projectsData } = await supabase.from('projects').select('id, name');
        const { data: usersData } = await supabase.from('users').select('id, full_name, email, avatar_url');

        setItems(inboxData || []);
        setProjects(projectsData || []);
        setUsers(usersData || []);
        setLoading(false);
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeItem = items.find(t => t.id === active.id);
        const overContainer = over.id;

        if (activeItem && COLUMNS.map(c => c.id).includes(overContainer) && activeItem.status !== overContainer) {
            // Optimistic Update
            const updatedItems = items.map(t =>
                t.id === active.id ? { ...t, status: overContainer, type: overContainer } : t 
            );
            setItems(updatedItems);
            
            // DB Update
            await supabase.from('inbox_items').update({
                status: overContainer,
                type: overContainer 
            }).eq('id', active.id);
        }
    };

    const handleOpenModal = (item = null, status = 'inbox') => {
        setEditingItem(item);
        if (item) {
            setFormData({
                content: item.content,
                project_id: item.project_id || '',
                assignee_id: item.assignee_id || '',
                status: item.status || 'inbox'
            });
        } else {
            setFormData({ content: '', project_id: '', assignee_id: '', status });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                content: formData.content,
                project_id: formData.project_id || null,
                assignee_id: formData.assignee_id || null,
                status: formData.status,
                type: formData.status
            };

            if (editingItem) {
                await supabase.from('inbox_items').update(payload).eq('id', editingItem.id);
            } else {
                await supabase.from('inbox_items').insert([payload]);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar item.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir item?')) return;
        setItems(items.filter(i => i.id !== id));
        await supabase.from('inbox_items').delete().eq('id', id);
    };

    const handleConvertToTask = async () => {
        if (!formData.project_id) {
            alert('Selecione um projeto para converter em tarefa.');
            return;
        }
        
        try {
            const { error: taskError } = await supabase.from('tasks').insert([{
                project_id: formData.project_id,
                name: formData.content,
                status: 'todo',
                priority: 'medium',
                start_date: new Date().toISOString().split('T')[0],
                duration_days: 1
            }]);

            if (taskError) throw taskError;

            await supabase.from('inbox_items').update({ status: 'done', type: 'done' }).eq('id', editingItem.id);
            
            alert('Tarefa criada no projeto e item concluído na entrada!');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Erro ao converter para tarefa.');
        }
    };

    return (
        <div className="h-full flex flex-col pt-6 px-6">
            <header className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-in fade-in">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Organização Pessoal (GTD)</h1>
                    <p className="text-slate-400 text-sm">Capture, organize e revise seu fluxo de trabalho.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('board')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === 'board' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Tray weight={viewMode === 'board' ? 'fill' : 'regular'} /> Quadro de Tarefas
                    </button>
                    <button 
                        onClick={() => setViewMode('review')}
                        className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition ${viewMode === 'review' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                         <Target weight={viewMode === 'review' ? 'fill' : 'regular'} /> Painel de Revisão
                    </button>
                </div>
            </header>

            {viewMode === 'review' ? <GTDReview /> : (
            <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start h-full">
                    {COLUMNS.map(col => (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            items={items.filter(i => (i.status || 'inbox') === col.id)}
                            onAdd={() => handleOpenModal(null, col.id)}
                            onEdit={handleOpenModal}
                            onDelete={handleDelete}
                            users={users}
                            projects={projects}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <ItemCard 
                            item={items.find(i => i.id === activeId)} 
                            isOverlay 
                            users={users} 
                            projects={projects} 
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>
            )}

            {/* Modal */}
            <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 z-50 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <Dialog.Title className="text-xl font-bold text-slate-900">
                                {editingItem ? 'Editar Item' : 'Novo Item'}
                            </Dialog.Title>
                            <Dialog.Close className="text-slate-400 hover:text-slate-600"><X size={20} /></Dialog.Close>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">O que precisa ser feito?</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 h-24 resize-none"
                                    value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    required autoFocus
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3"
                                        value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Projeto Relacionado</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm"
                                        value={formData.project_id} onChange={e => setFormData({ ...formData, project_id: e.target.value })}>
                                        <option value="">(Nenhum)</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Responsável</label>
                                    <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm"
                                        value={formData.assignee_id} onChange={e => setFormData({ ...formData, assignee_id: e.target.value })}>
                                        <option value="">(Ninguém)</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-black transition">
                                    Salvar
                                </button>
                                {editingItem && formData.project_id && (
                                    <button 
                                        type="button" 
                                        onClick={handleConvertToTask}
                                        className="bg-blue-100 text-blue-700 font-bold px-4 rounded-xl hover:bg-blue-200 transition text-sm flex items-center gap-2"
                                        title="Criar tarefa no projeto selecionado e concluir aqui"
                                    >
                                        <Briefcase size={18} />
                                        Mover p/ Projeto
                                    </button>
                                )}
                            </div>
                        </form>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}

function KanbanColumn({ column, items, onAdd, onEdit, onDelete, users, projects }) {
    const { setNodeRef } = useDroppable({ id: column.id });
    const Icon = column.icon;

    return (
        <div ref={setNodeRef} className={`flex-1 min-w-[300px] max-w-[400px] flex flex-col rounded-xl border ${column.border} bg-white h-full max-h-full`}>
            <div className={`p-4 flex items-center justify-between border-b ${column.border} ${column.color} rounded-t-xl`}>
                <div className="flex items-center gap-2">
                    <Icon weight="bold" className="text-slate-600" />
                    <h4 className="font-bold text-slate-700">{column.title}</h4>
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-slate-500">{items.length}</span>
                </div>
                <button onClick={onAdd} className="p-1 hover:bg-black/5 rounded text-slate-500"><Plus weight="bold" /></button>
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar bg-slate-50/50">
                {items.map(item => (
                    <DraggableItem
                        key={item.id}
                        item={item}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        users={users}
                        projects={projects}
                    />
                ))}
                {items.length === 0 && (
                    <button onClick={onAdd} className="w-full py-8 border-2 border-dashed border-slate-300/50 rounded-lg text-slate-400 text-sm hover:border-slate-300 hover:text-slate-500 transition flex flex-col items-center gap-2">
                        <Plus size={20} />
                        Adicionar
                    </button>
                )}
            </div>
        </div>
    );
}

function DraggableItem({ item, onEdit, onDelete, users, projects }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`touch-none ${isDragging ? 'opacity-50' : ''}`}>
            <ItemCard item={item} onEdit={onEdit} onDelete={onDelete} users={users} projects={projects} />
        </div>
    );
}

function ItemCard({ item, isOverlay, onEdit, onDelete, users, projects }) {
    if (!item) return null;
    const project = projects.find(p => p.id === item.project_id);
    const user = users.find(u => u.id === item.assignee_id);

    return (
        <div 
            onClick={() => !isOverlay && onEdit(item)}
            className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 hover:shadow-md transition-all ${isOverlay ? 'shadow-xl rotate-2 scale-105 cursor-grabbing' : 'cursor-grab'}`}
        >
            <div className="flex justify-between items-start mb-2">
                {project ? (
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md max-w-[120px] truncate">
                        {project.name}
                    </span>
                ) : (
                    <span className="text-[10px] font-bold bg-slate-50 text-slate-400 px-2 py-1 rounded-md">Inbox</span>
                )}
                
                {!isOverlay && onDelete && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition"
                    >
                        <Trash weight="bold" size={14} />
                    </button>
                )}
            </div>

            <p className="text-sm font-medium text-slate-800 leading-snug mb-3 line-clamp-3">
                {item.content}
            </p>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    {user ? (
                        <div className="flex items-center gap-1.5 bg-slate-50 pr-2 rounded-full">
                             <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-bold text-blue-700">
                                {user.full_name ? user.full_name[0] : user.email[0].toUpperCase()}
                             </div>
                             <span className="text-[10px] text-slate-500 max-w-[80px] truncate">{user.full_name || user.email}</span>
                        </div>
                    ) : (
                         <div className="flex items-center gap-1 text-slate-300 text-[10px]">
                            <User /> <span className="italic">Sem resp.</span>
                         </div>
                    )}
                </div>
                <div className="text-[10px] text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()}
                </div>
            </div>
        </div>
    );
}
