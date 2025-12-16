import React, { useState, useEffect } from 'react';
import { CurrencyDollar, TrendUp, TrendDown, Wallet, Clock } from 'phosphor-react';
import { SCurveChart } from './SCurveChart';
import { supabase } from '../../services/supabase';
import { timesheetService } from '../../services/timesheetService';

export function ProjectFinancials({ project }) {
    const [laborCost, setLaborCost] = useState(0);
    const [totalHours, setTotalHours] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (project?.id) calculateCost();
    }, [project?.id]);

    async function calculateCost() {
        try {
            // 1. Fetch Resources (for rates)
            const { data: resources } = await supabase.from('resources').select('email, hourly_rate');
            const rateMap = {};
            resources?.forEach(r => rateMap[r.email] = Number(r.hourly_rate || 0));

            // 2. Fetch Timesheets
            const entries = await timesheetService.getProjectEntries(project.id);

            // 3. Calculate Total
            let total = 0;
            let totalH = 0;
            entries.forEach(entry => {
                const email = entry.user?.email;
                const rate = rateMap[email] || 0;
                total += Number(entry.hours) * rate;
                totalH += Number(entry.hours);
            });

            setLaborCost(total);
            setTotalHours(totalH);
        } catch (error) {
            console.error('Error calculating financials:', error);
        } finally {
            setLoading(false);
        }
    }

    // Financial Data
    const budget = project?.budget_total || 0;
    const actual = laborCost; // Fully automatic based on Time x Rate
    const commited = 0; // Placeholder
    const balance = budget - actual - commited;

    // Percentage
    const executionPerc = budget > 0 ? (actual / budget) * 100 : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Wallet size={24} weight="fill" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Orçamento (BAC)</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">R$ {budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-xs text-slate-400 mt-1">Total Aprovado</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <TrendUp size={24} weight="fill" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Realizado (AC)</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">R$ {actual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(executionPerc, 100)}%` }}></div>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{loading ? 'Calculando...' : 'Baseado em Timesheet'}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <TrendDown size={24} weight="fill" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Comprometido</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-800">R$ {commited.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-xs text-slate-400 mt-1">Pedidos de Compra</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                    <div className={`absolute right-0 top-0 bottom-0 w-2 ${balance < 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${balance < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            <CurrencyDollar size={24} weight="fill" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saldo Final</span>
                    </div>
                    <div>
                        <h3 className={`text-2xl font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                        <p className="text-xs text-slate-400 mt-1">Estimativa no Término (EAC)</p>
                    </div>
                </div>
            </div>


            {/* Hours Control (New Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Clock size={24} weight="fill" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Horas Totais</p>
                        <div className="flex justify-between items-end">
                            <h3 className="text-2xl font-bold text-slate-800">{totalHours.toFixed(1)}h <span className="text-sm font-normal text-slate-400">/ {Number(project?.hours_estimated || 0)}h</span></h3>
                            <span className={`text-xs font-bold ${totalHours > Number(project?.hours_estimated || 0) ? 'text-red-500' : 'text-green-500'}`}>
                                {Number(project?.hours_estimated) > 0 ? ((totalHours / Number(project?.hours_estimated)) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${totalHours > Number(project?.hours_estimated || 0) ? 'bg-red-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min((totalHours / (Number(project?.hours_estimated) || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
                {/* Placeholders for future metrics or leave empty if 1 col is enough. 
                     For now, let's keep it clean or maybe add Rate Average? 
                 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                        <CurrencyDollar size={24} weight="fill" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa Média Efetiva</p>
                        <h3 className="text-2xl font-bold text-slate-800">R$ {totalHours > 0 ? (laborCost / totalHours).toFixed(2) : '0,00'} <span className="text-sm font-normal text-slate-400">/h</span></h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SCurveChart />
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h4 className="font-bold text-slate-800 mb-4">Detalhamento de Custos</h4>
                    <ul className="space-y-4">
                        <li className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-amber-600 font-bold">1</div>
                                <div>
                                    <p className="font-medium text-slate-700">Mão de Obra (Timesheet)</p>
                                    <p className="text-xs text-slate-400">Equipe Interna/Externa</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-800">R$ {laborCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </li>
                        <li className="flex justify-between items-center text-sm opacity-50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold">2</div>
                                <div>
                                    <p className="font-medium text-slate-700">Licenças de Software</p>
                                    <p className="text-xs text-slate-400">Anual (Planejado)</p>
                                </div>
                            </div>
                            <span className="font-bold text-slate-800">R$ 0,00</span>
                        </li>
                    </ul>

                    <div className="mt-6 p-4 bg-slate-50 rounded-lg text-xs text-slate-500">
                        Os custos são calculados multiplicando as horas lançadas no Timesheet pelo valor hora (Rate) cadastrado para cada recurso na aba "Time".
                    </div>
                </div>
            </div>
        </div >
    );
}
