import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarV5 } from './v5/SidebarV5';
import { CommandPalette } from './v5/CommandPalette';
import { useAppStore } from '../store/useAppStore';

export default function LayoutV5() {
    const { isFocusMode } = useAppStore();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <CommandPalette />
            <SidebarV5 />

            <main className={`flex-1 overflow-auto relative flex flex-col transition-all ${isFocusMode ? 'bg-white' : ''}`}>
                {isFocusMode && (
                    <div className="absolute top-4 right-4 z-50">
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            MODO FOCO ATIVO
                        </div>
                    </div>
                )}
                <Outlet />
            </main>
        </div>
    );
}
