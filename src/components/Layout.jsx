import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    SquaresFour,
    RocketLaunch,
    WarningCircle,
    CurrencyDollar,
    Users,
    Gear,
    SignOut,
    Tray
} from 'phosphor-react';

export default function Layout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { path: '/', icon: SquaresFour, label: 'Visão Geral' },
        { path: '/inbox', icon: Tray, label: 'Caixa de Entrada' },
        { path: '/projects', icon: RocketLaunch, label: 'Projetos' },
        { path: '/risks', icon: WarningCircle, label: 'Riscos' },
        { path: '/financial', icon: CurrencyDollar, label: 'Financeiro' },
        { path: '/resources', icon: Users, label: 'Recursos' },
    ];

    return (
        <div className="flex h-screen bg-slate-100 font-inter overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20">
                <div className="p-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                        PMO Hub
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Enterprise v2.0</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <item.icon size={20} weight={item.path === location.pathname ? "fill" : "regular"} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}

                    <div className="pt-4 border-t border-slate-700 mt-4">
                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? 'bg-slate-800 text-white shadow-sm'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <Gear size={20} />
                            <span className="font-medium">Configurações</span>
                        </NavLink>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                            {user?.email?.[0].toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user?.email}</p>
                            <p className="text-xs text-slate-400">Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full px-2"
                    >
                        <SignOut size={18} />
                        Encerrar Sessão
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative">
                <Outlet />
            </main>
        </div>
    );
}
