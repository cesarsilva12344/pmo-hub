import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { useParams } from 'react-router-dom';
import { DndContext, DragOverlay, useDraggable, useDroppable, closestCorners } from '@dnd-kit/core';
import { Plus, DotsThreeVertical, Trash, ArchiveBox } from 'phosphor-react';
import * as Popover from '@radix-ui/react-popover';

const COLUMNS = [
    { id: 'todo', title: 'A Fazer', color: 'bg-slate-100', border: 'border-slate-200' },
    { id: 'in_progress', title: 'Em Andamento', color: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'review', title: 'Revisão', color: 'bg-purple-50', border: 'border-purple-100' },
    { id: 'done', title: 'Concluído', color: 'bg-green-50', border: 'border-green-100' },
];

export function KanbanBoard() {
    const { id: projectId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId) fetchTasks();
    }, [projectId]);

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .neq('status', 'archived'); // Don't show archived
        if (!error) setTasks(data || []);
        setLoading(false);
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        const overContainer = over.id;

        if (activeTask && COLUMNS.map(c => c.id).includes(overContainer) && activeTask.status !== overContainer) {
            const updatedTasks = tasks.map(t =>
                t.id === active.id ? { ...t, status: overContainer } : t
            );
            setTasks(updatedTasks);
            await supabase.from('tasks').update({ status: overContainer }).eq('id', active.id);
        }
    };

    const createTask = async (status) => {
        const name = prompt('Nome da tarefa:');
        if (!name) return;

        const newTask = {
            project_id: projectId,
            name,
            status,
            priority: 'medium',
            start_date: new Date().toISOString().split('T')[0], // Default to today
            duration_days: 1
        };

        const { data, error } = await supabase.from('tasks').insert([newTask]).select();
        if (error) {
            console.error(error);
            alert('Erro ao criar tarefa');
        } else if (data) {
            setTasks([...tasks, data[0]]);
        }
    };

    const deleteTask = async (taskId) => {
        if (!confirm('Excluir esta tarefa?')) return;
        setTasks(tasks.filter(t => t.id !== taskId));
        await supabase.from('tasks').delete().eq('id', taskId);
    };

    const archiveTask = async (taskId) => {
        const updated = tasks.map(t => t.id === taskId ? { ...t, status: 'archived' } : t);
        setTasks(updated.filter(t => t.status !== 'archived'));
        await supabase.from('tasks').update({ status: 'archived' }).eq('id', taskId);
    };

    return (
        <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full min-w-[1000px] pb-4">
                {COLUMNS.map(col => (
                    <KanbanColumn
                        key={col.id}
                        column={col}
                        tasks={tasks.filter(t => t.status === col.id)}
                        onAddTask={() => createTask(col.id)}
                        onDelete={deleteTask}
                        onArchive={archiveTask}
                    />
                ))}
            </div>
            <DragOverlay>
                {activeId ? <TaskCard task={tasks.find(t => t.id === activeId)} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    );
}

function KanbanColumn({ column, tasks, onAddTask, onDelete, onArchive }) {
    const { setNodeRef } = useDroppable({ id: column.id });

    return (
        <div ref={setNodeRef} className={`flex-1 min-w-[280px] flex flex-col rounded-xl border ${column.border} bg-opacity-50 ${column.color}`}>
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-700 text-sm">{column.title}</h4>
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-slate-500">{tasks.length}</span>
                </div>
                <button onClick={onAddTask} className="p-1 hover:bg-black/5 rounded text-slate-500"><Plus weight="bold" /></button>
            </div>

            <div className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
                {tasks.map(task => (
                    <DraggableTask
                        key={task.id}
                        task={task}
                        onDelete={onDelete}
                        onArchive={onArchive}
                    />
                ))}

                {tasks.length === 0 && (
                    <button onClick={onAddTask} className="w-full py-8 border-2 border-dashed border-slate-300/50 rounded-lg text-slate-400 text-sm hover:border-slate-300 hover:text-slate-500 transition flex flex-col items-center gap-2">
                        <Plus size={20} />
                        Adicionar
                    </button>
                )}
            </div>
        </div>
    );
}

function DraggableTask({ task, onDelete, onArchive }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`touch-none ${isDragging ? 'opacity-50' : ''}`}>
            <TaskCard task={task} onDelete={onDelete} onArchive={onArchive} />
        </div>
    );
}

function TaskCard({ task, isOverlay, onDelete, onArchive }) {
    if (!task) return null;

    return (
        <div className={`bg-white p-3 rounded-lg border border-slate-200 shadow-sm group hover:ring-2 hover:ring-blue-400/50 transition-all ${isOverlay ? 'shadow-xl rotate-2 scale-105 cursor-grabbing' : 'cursor-grab'}`}>
            <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-slate-500 bg-slate-100`}>
                    TASK-{task.id?.substring(0, 4)}
                </span>

                {!isOverlay && (
                    <ProjectTaskMenu onDelete={() => onDelete(task.id)} onArchive={() => onArchive(task.id)} />
                )}
            </div>
            <p className="text-sm font-medium text-slate-800 leading-snug mb-3">{task.name}</p>

            <div className="flex items-center justify-between mt-auto">
                <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full bg-blue-100 border border-white flex items-center justify-center text-[8px] font-bold text-blue-600">JS</div>
                </div>
                {task.priority === 'high' && <div className="w-2 h-2 rounded-full bg-red-500" title="Alta Prioridade" />}
                {task.end_date && <span className="text-[10px] text-slate-400">{new Date(task.end_date).toLocaleDateString()}</span>}
            </div>
        </div>
    );
}

function ProjectTaskMenu({ onDelete, onArchive }) {
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button className="p-1 hover:bg-slate-100 rounded text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={e => e.stopPropagation()}>
                    <DotsThreeVertical weight="bold" />
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content className="bg-white rounded-lg shadow-xl border border-slate-100 p-1 w-32 z-50 animate-in fade-in zoom-in-95" side="bottom" align="end">
                    <button onClick={(e) => { e.stopPropagation(); onArchive(); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded text-left">
                        <ArchiveBox size={14} /> Arquivar
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded text-left">
                        <Trash size={14} /> Excluir
                    </button>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    )
}
