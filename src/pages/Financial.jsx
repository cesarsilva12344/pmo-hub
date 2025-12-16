import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { CurrencyDollar, TrendUp, Warning, Wallet } from 'phosphor-react';

export default function Financial() {
    const [financials, setFinancials] = useState([]);
    const [stats, setStats] = useState({ budget: 0, actual: 0, balance: 0 });

    useEffect(() => {
        const fetch = async () => {
            const { data } = await supabase.from('projects').select('*');
            if (data) {
                setFinancials(data);
                const budget = data.reduce((acc, curr) => acc + (curr.budget_total || 0), 0);
                const actual = data.reduce((acc, curr) => acc + (curr.cost_actual || 0), 0);
                setStats({ budget, actual, balance: budget - actual });
            }
        };
        fetch();
    }, []);

    const format = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão Financeira</h1>
                <p className="text-slate-500 mt-1">Controle orçamentário e custos operacionais.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 opacity-10"><Wallet size={120} weight="fill" /></div>
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Orçamento Total</p>
                    <h3 className="text-3xl font-bold">{format(stats.budget)}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Executado</p>
                    <h3 className="text-3xl font-bold text-slate-800">{format(stats.actual)}</h3>
                    <div className="w-full bg-slate-100 h-1.5 mt-4 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.actual / stats.budget) * 100}%` }}></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-wider mb-2">Disponível</p>
                    <h3 className={`text-3xl font-bold ${stats.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>{format(stats.balance)}</h3>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="p-5">Projeto</th>
                            <th className="p-5 text-right">Budget</th>
                            <th className="p-5 text-right">Realizado</th>
                            <th className="p-5 text-right">Saldo</th>
                            <th className="p-5 text-center">Burn</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {financials.map(p => {
                            const burn = (p.cost_actual / p.budget_total) * 100 || 0;
                            return (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-5 font-medium text-slate-700">{p.name}</td>
                                    <td className="p-5 text-right font-mono text-slate-600">{format(p.budget_total)}</td>
                                    <td className="p-5 text-right font-mono text-slate-600">{format(p.cost_actual)}</td>
                                    <td className={`p-5 text-right font-mono font-bold ${p.budget_total - p.cost_actual < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                        {format(p.budget_total - p.cost_actual)}
                                    </td>
                                    <td className="p-5 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${burn > 100 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {burn.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
