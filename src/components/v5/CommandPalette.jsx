import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass, Kanban, TrendUp, FileText, CheckSquare, House, Warning, EyeClosed } from 'phosphor-react';
import { useAppStore } from '../../store/useAppStore';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const { toggleFocusMode } = useAppStore();

    // Toggle with Ctrl+K
    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = (command) => {
        setOpen(false);
        command();
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={setOpen}
            label="Command Menu"
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[9999] animate-in fade-in zoom-in-95 duration-100"
            overlayClassName="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998]"
        >
            <div className="flex items-center border-b border-slate-100 px-3 pb-2 pt-1">
                <MagnifyingGlass size={20} className="text-slate-400 mr-2" />
                <Command.Input
                    placeholder="Busque projetos, tarefas ou comande >..."
                    className="w-full outline-none text-lg text-slate-700 placeholder:text-slate-400 font-medium"
                />
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto py-2 px-1">
                <Command.Empty className="py-6 text-center text-sm text-slate-500">
                    Nenhum resultado encontrado.
                </Command.Empty>

                <Command.Group heading="Navegação Geral" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                    <CmdItem onSelect={() => runCommand(() => navigate('/'))} icon={House}>Dashboard</CmdItem>
                    <CmdItem onSelect={() => runCommand(() => navigate('/projects'))} icon={Kanban}>Todos os Projetos</CmdItem>
                    <CmdItem onSelect={() => runCommand(() => navigate('/inbox'))} icon={CheckSquare}>Caixa de Entrada</CmdItem>
                    <CmdItem onSelect={() => runCommand(() => navigate('/risks'))} icon={Warning}>Matriz de Riscos</CmdItem>
                </Command.Group>

                <Command.Group heading="Ações Rápidas" className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-4">
                    <CmdItem onSelect={() => runCommand(() => alert('Novo Projeto'))} icon={TrendUp}>Criar Novo Projeto</CmdItem>
                    <CmdItem onSelect={() => runCommand(() => alert('Nova Tarefa'))} icon={FileText}>Adicionar Tarefa</CmdItem>
                    <CmdItem onSelect={() => runCommand(() => toggleFocusMode())} icon={EyeClosed}>Alternar Modo Foco (Zen)</CmdItem>
                </Command.Group>
            </Command.List>

            <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-400 flex justify-between">
                <span>Use as setas para navegar</span>
                <span className="flex items-center gap-1"><kbd className="bg-slate-100 px-1 rounded">ESC</kbd> para fechar</span>
            </div>
        </Command.Dialog>
    );
}

function CmdItem({ children, onSelect, icon: Icon }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-700 text-sm font-medium cursor-pointer hover:bg-slate-100 aria-selected:bg-blue-50 aria-selected:text-blue-700 transition-colors"
        >
            {Icon && <Icon size={18} className="text-slate-400 aria-selected:text-blue-500" />}
            {children}
        </Command.Item>
    );
}

