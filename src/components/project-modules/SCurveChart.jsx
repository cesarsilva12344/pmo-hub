import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function SCurveChart() {
    const data = [
        { month: 'Jan', planned: 10, actual: 12, earned: 10 },
        { month: 'Fev', planned: 25, actual: 22, earned: 24 },
        { month: 'Mar', planned: 45, actual: 40, earned: 42 },
        { month: 'Abr', planned: 60, actual: 55, earned: 58 },
        { month: 'Mai', planned: 80, actual: 75, earned: 72 },
        { month: 'Jun', planned: 100, actual: null, earned: null },
    ];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full" />
                Curva S (EVM)
            </h3>
            <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748b', marginBottom: '8px' }}
                    />
                    <Area type="monotone" dataKey="planned" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorPlanned)" name="Planejado (PV)" />
                    <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" name="Realizado (AC)" />
                    <Area type="monotone" dataKey="earned" stroke="#8b5cf6" strokeWidth={3} strokeDasharray="5 5" fill="none" name="Agregado (EV)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
