import React from 'react';

export function SidebarDebug() {
    return (
        <div className="w-64 h-screen bg-red-500 text-white p-4 z-[9999]" style={{ minWidth: '250px', border: '5px solid yellow' }}>
            <h1>DEBUG SIDEBAR</h1>
            <p>If you see this, the layout works.</p>
        </div>
    );
}
