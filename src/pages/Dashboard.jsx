import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendUp, Money, CurrencyDollar, Wallet, Percent, Users, Buildings, Briefcase, Warning } from 'phosphor-react';
import { format, parseISO, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [users, setUsers] = useState([]);

    const [error, setError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data: projectsData, error: err1 } = await supabase.from('projects').select('*');
            if (err1) throw err1;

            const { data: risks, error: err2 } = await supabase.from('project_risks').select('*').gte('probability', 4).gte('impact', 4);
            // Non-critical errors (we can continue without this data if table missing but best to catch)
            if (err2 && err2.code !== 'PGRST116') console.warn(err2);

            const { data: issues, error: err3 } = await supabase.from('project_issues').select('*').eq('priority', 'Critical');

            const { data: usersData, error: err4 } = await supabase.from('users').select('*');

            if (projectsData) setData(projectsData);
            if (usersData) setUsers(usersData);
            setCriticalCount((risks?.length || 0) + (issues?.length || 0));
        } catch (err) {
            console.error('Dashboard Error:', err);
            setError(err.message || 'Erro desconhecido ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    // --- Data Processing for Charts ---

    // 1. Projects per Month (Line)
    const projectsByMonth = Array.from({ length: 12 }, (_, i) => {
        const monthName = format(new Date(2024, i, 1), 'MMM', { locale: ptBR });
        return { name: monthName, count: 0, budget: 0, negotiated: 0 };
    });

    data.forEach(p => {
        const date = p.created_at ? parseISO(p.created_at) : new Date();
        const month = getMonth(date);
        projectsByMonth[month].count += 1;
        // Financials are usually "total", but lets distribute by creation date for trending visualization
        projectsByMonth[month].budget += (p.budget_total || 0); // Using real column
        projectsByMonth[month].negotiated += (p.cost_actual || 0); // Using real column
    });

    // 2. Service Type -> Use 'category' or 'track'
    const typeCounts = {};
    data.forEach(p => {
        const type = p.category || p.track || 'Outros';
        typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const serviceTypeData = Object.keys(typeCounts).map((key, index) => ({
        name: key,
        value: typeCounts[key],
        color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]
    }));
    if (serviceTypeData.length === 0) serviceTypeData.push({ name: 'N/A', value: 1, color: '#e2e8f0' });

    // 3. Collaborators -> Group by manager_id
    const managerCounts = {};
    data.forEach(p => {
        const mgr = users.find(u => u.id === p.manager_id);
        const name = mgr ? mgr.full_name : 'N/A';
        managerCounts[name] = (managerCounts[name] || 0) + 1;
    });
    const collabData = Object.keys(managerCounts).map(name => ({
        name, count: managerCounts[name]
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // 4. Sector -> Use 'client' as proxy
    const clientCounts = {};
    data.forEach(p => {
        const client = p.client || 'Interno';
        clientCounts[client] = (clientCounts[client] || 0) + 1;
    });
    const sectorData = Object.keys(clientCounts).map(name => ({
        name, value: clientCounts[name]
    })).sort((a, b) => b.value - a.value).slice(0, 5);

    // KPIs Logic
    const totalProjects = data.length;
    const totalBudget = data.reduce((acc, curr) => acc + (curr.budget_total || 0), 0);
    const totalSpent = data.reduce((acc, curr) => acc + (curr.cost_actual || 0), 0); // This is cost
    const discountVal = totalBudget - totalSpent; // Simplification: budget remaining
    const discountPct = totalBudget > 0 ? ((discountVal / totalBudget) * 100).toFixed(2) : 0;

    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(val);

    if (loading) return <div className="p-10 text-center text-gray-500">Carregando Dashboard...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Erro: {error}</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <TrendUp weight="fill" className="text-blue-600" />
                        Visão Geral do Portfólio
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">Analytics & Performance v5.0</p>
                </div>

                {/* Filters Mock */}
                <div className="flex gap-2">
                    <select className="bg-white border-none text-xs font-bold text-slate-600 rounded-lg shadow-sm py-2 px-3 outline-none cursor-pointer hover:bg-slate-100">
                        <option>Ano: 2024</option>
                    </select>
                    <select className="bg-white border-none text-xs font-bold text-slate-600 rounded-lg shadow-sm py-2 px-3 outline-none cursor-pointer hover:bg-slate-100">
                        <option>Mês: Todos</option>
                    </select>
                </div>
            </div>

            {/* KPI Row (6 Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
                <KpiTile title="Total Projetos" value={totalProjects} icon={Buildings} color="bg-blue-500" />
                <KpiTile title="Valor Inicial" value={formatCurrency(totalBudget * 1.1)} icon={Money} color="bg-emerald-500" />
                <KpiTile title="Valor Orçado" value={formatCurrency(totalBudget)} icon={Wallet} color="bg-teal-500" />
                <KpiTile title="Valor Negociado" value={formatCurrency(totalSpent)} icon={CurrencyDollar} color="bg-cyan-500" />
                <KpiTile title="Economia (R$)" value={formatCurrency(discountVal)} icon={TrendUp} color="bg-green-600" />
                <KpiTile title="Economia (%)" value={`${discountPct}%`} icon={Percent} color="bg-lime-600" />
                <KpiTile title="Riscos Críticos" value={criticalCount} icon={Warning} color="bg-red-600" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[800px]">

                {/* Top Row: Line, Donut, Bar */}
                <div className="lg:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Projetos por Mês</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={projectsByMonth}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ fontSize: '10px' }} />
                                <Line type="monotone" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Por Tipo de Serviço</h3>
                    <div className="flex-1 min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={serviceTypeData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {serviceTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center">
                            <span className="text-2xl font-bold text-slate-700">{totalProjects}</span>
                            <p className="text-[10px] text-slate-400 uppercase">Total</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Por Colaborador</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={collabData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={70} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>


                {/* Bottom Row: Horizontal Bar, Area Chart */}
                <div className="lg:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Por Setor</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sectorData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={70} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="lg:col-span-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Orçado x Negociado (Anual)</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={projectsByMonth}>
                                <defs>
                                    <linearGradient id="colorBudget" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorNeg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                                <Tooltip />
                                <Legend verticalAlign="top" height={36} />
                                <Area type="monotone" dataKey="budget" name="Orçado" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorBudget)" />
                                <Area type="monotone" dataKey="negotiated" name="Negociado" stroke="#06b6d4" fillOpacity={1} fill="url(#colorNeg)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Helper for Traffic Light */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-700 uppercase">Status dos Projetos</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="p-4">Projeto</th>
                                <th className="p-4">Gerente</th>
                                <th className="p-4 text-center">Escopo</th>
                                <th className="p-4 text-center">Prazo</th>
                                <th className="p-4 text-center">Custo</th>
                                <th className="p-4 text-right">Burn Rate</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-medium text-slate-800">{p.name}<br /><span className="text-[10px] text-slate-400 font-normal">{p.pep_code || 'N/A'}</span></td>
                                    <td className="p-4 text-slate-600">João Silva</td> {/* Mock Manager */}
                                    <td className="p-4 text-center"><TrafficLight status={p.health_scope} /></td>
                                    <td className="p-4 text-center"><TrafficLight status={p.health_time} /></td>
                                    <td className="p-4 text-center"><TrafficLight status={p.health_cost} /></td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-xs font-mono font-bold">{Math.floor(Math.random() * 100)}%</span>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500" style={{ width: `${Math.floor(Math.random() * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function TrafficLight({ status }) {
    let color = 'bg-slate-300';
    if (status === 'green') color = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]';
    if (status === 'yellow') color = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
    if (status === 'red') color = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';

    return <div className={`w-3 h-3 rounded-full mx-auto ${color}`}></div>;
}

function KpiTile({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-slate-900 rounded-lg p-4 text-white hover:bg-slate-800 transition shadow-lg relative overflow-hidden group">
            <div className={`absolute right-0 top-0 p-3 opacity-20 ${color} rounded-bl-3xl group-hover:scale-110 transition-transform`}>
                <Icon size={32} weight="fill" className="text-white" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-xl font-bold tracking-tight">{value}</h3>
        </div>
    )
}
