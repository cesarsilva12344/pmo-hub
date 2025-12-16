import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import {
    House, Kanban, Tray, Warning as WarningIcon, CurrencyDollar,
    Users, Gear, CaretLeft, CaretRight, Plus, Target
} from 'phosphor-react';
import { useAuth } from '../../contexts/AuthContext';
import { CreateModal } from './CreateModal';

export function SidebarV5() {
    const { isSidebarCollapsed, toggleSidebar, favorites } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const menuItems = [
        { path: '/', label: 'Visão Geral', icon: House },
        { path: '/projects', label: 'Projetos', icon: Kanban },
        { path: '/inbox', label: 'GTD & Organização', icon: Target },
        { path: '/financial', label: 'Financeiro', icon: CurrencyDollar },
        { path: '/resources', label: 'Recursos', icon: Users },
        { path: '/settings', label: 'Configurações', icon: Gear },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <aside
            className={`
                h-screen bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800
                ${isSidebarCollapsed ? 'w-20' : 'w-[260px]'}
                flex-shrink-0 relative z-40
            `}
        >
            {/* Header */}
            <div className="h-16 flex items-center px-4 border-b border-slate-800 flex-shrink-0">
                {!isSidebarCollapsed && (
                    <div className="font-bold text-white text-lg tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">P</div>
                        PMO Hub
                    </div>
                )}
                {isSidebarCollapsed && (
                    <div className="w-full flex justify-center">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                    </div>
                )}
            </div>

            {/* Global "New" Button */}
            <div className="p-4 flex-shrink-0">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`
                    w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-all
                    ${isSidebarCollapsed ? 'h-12 w-12 mx-auto p-0 rounded-xl' : 'py-2.5 px-4 gap-2 font-medium'}
                `}>
                    <Plus size={20} weight="bold" />
                    {!isSidebarCollapsed && <span>Novo...</span>}
                </button>
            </div>

            <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            {/* Main Menu */}
            <nav className="flex-1 px-3 space-y-1 py-4 overflow-y-auto scrollbar-hide">
                {menuItems.map(item => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
                            ${isActive(item.path) ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                            ${isSidebarCollapsed ? 'justify-center px-0' : ''}
                        `}
                        title={isSidebarCollapsed ? item.label : ''}
                    >
                        <item.icon size={isSidebarCollapsed ? 24 : 20} weight={isActive(item.path) ? 'fill' : 'regular'} />
                        {!isSidebarCollapsed && <span>{item.label}</span>}
                    </button>
                ))}

                {!isSidebarCollapsed && favorites?.length > 0 && (
                    <div className="mt-8 pt-4 border-t border-slate-800">
                        <h4 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Favoritos</h4>
                        {favorites.map(fav => (
                            <button
                                key={fav.id}
                                onClick={() => navigate(fav.path)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left truncate"
                            >
                                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                {fav.label}
                            </button>
                        ))}
                    </div>
                )}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex-shrink-0">
                <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        {isSidebarCollapsed ? <CaretRight size={20} /> : <CaretLeft size={20} />}
                    </button>

                    {!isSidebarCollapsed && (
                        <div
                            className="flex items-center gap-3 overflow-hidden cursor-pointer hover:bg-white/5 rounded-lg p-1 -ml-1 transition-colors"
                            onClick={() => navigate('/profile')}
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white relative">
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                            </div>
                            <div className="flex-1 truncate">
                                <p className="text-sm font-medium text-white truncate">{user?.user_metadata?.full_name || 'Usuário'}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
