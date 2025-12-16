import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Warning, Plus, Smiley, SmileySad, SmileyMeh } from 'phosphor-react';
import { motion } from 'framer-motion';

export default function Risks() {
    const [risks, setRisks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newRisk, setNewRisk] = useState({ title: '', project_id: '', probability: 3, impact: 3 });

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        const { data: riskData } = await supabase.from('project_risks').select(`*, projects(name)`).order('score', { ascending: false });
        const { data: projData } = await supabase.from('projects').select('id, name');
        setRisks(riskData || []);
        setProjects(projData || []);
        setLoading(false);
    };

    const handleAddRisk = async (e) => {
        e.preventDefault();
        const { data } = await supabase.from('project_risks').insert([newRisk]).select(`*, projects(name)`);
        if (data) {
            setRisks([...risks, data[0]]);
            setShowForm(false);
        }
    };

    const renderMatrixCell = (prob, impact) => {
        const cellRisks = risks.filter(r => r.probability === prob && r.impact === impact);
        const score = prob * impact;
        // Zones
        let bg = 'bg-slate-50';
        if (score >= 15) bg = 'bg-red-50 border-red-100';
        else if (score >= 8) bg = 'bg-amber-50 border-amber-100';
        else bg = 'bg-green-50 border-green-100';

        return (
            <div className={`aspect-square ${bg} border rounded-xl p-2 relative group hover:shadow-md transition-all flex flex-wrap content-start gap-1`}>
                {cellRisks.map(r => (
                    <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        key={r.id}
                        className={`w-3 h-3 rounded-full shadow-sm cursor-pointer border border-white ${score >= 15 ? 'bg-red-500' : (score >= 8 ? 'bg-amber-500' : 'bg-green-500')}`}
                        title={`${r.title} - ${r.projects?.name}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col space-y-8 animate-in fade-in">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Matriz de Riscos</h1>
                    <p className="text-slate-500 mt-1">Mapa de calor de ameaças do portfólio.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-black transition flex items-center gap-2">
                    <Plus size={18} /> Novo Risco
                </button>
            </header>

            {showForm && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <form onSubmit={handleAddRisk} className="grid grid-cols-2 gap-4">
                        <input className="col-span-2 border p-2 rounded-lg" placeholder="Título do Risco" value={newRisk.title} onChange={e => setNewRisk({ ...newRisk, title: e.target.value })} />
                        <select className="border p-2 rounded-lg" value={newRisk.project_id} onChange={e => setNewRisk({ ...newRisk, project_id: e.target.value })}>
                            <option value="">Selecione Projeto...</option>
                            {projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
                        </select>
                        <div className="flex gap-4 col-span-2">
                            <label className="flex-1 text-sm bg-slate-50 p-2 rounded-lg">Impacto: <input type="range" min="1" max="5" value={newRisk.impact} onChange={e => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) })} className="w-full accent-slate-900" /></label>
                            <label className="flex-1 text-sm bg-slate-50 p-2 rounded-lg">Probabilidade: <input type="range" min="1" max="5" value={newRisk.probability} onChange={e => setNewRisk({ ...newRisk, probability: parseInt(e.target.value) })} className="w-full accent-slate-900" /></label>
                        </div>
                        <button className="col-span-2 bg-blue-600 text-white p-2 rounded-lg font-bold">Salvar</button>
                    </form>
                </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Matrix V5 */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative">
                    <div className="absolute left-4 top-1/2 -rotate-90 text-xs font-bold text-slate-300 tracking-[0.2em]">PROBABILIDADE</div>
                    <div className="absolute bottom-4 left-1/2 text-xs font-bold text-slate-300 tracking-[0.2em]">IMPACTO</div>

                    <div className="grid grid-cols-5 gap-2 w-full max-w-md aspect-square">
                        {[5, 4, 3, 2, 1].map(prob => (
                            <React.Fragment key={prob}>
                                {[1, 2, 3, 4, 5].map(imp => <React.Fragment key={`${prob}-${imp}`}>{renderMatrixCell(prob, imp)}</React.Fragment>)}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Top Risks Feed */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-700 bg-slate-50/50">Top Ameaças</div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {risks.slice(0, 5).map(r => (
                            <div key={r.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                                <div className={`px-2 py-1 rounded text-xs font-bold ${r.score >= 15 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                    Score {r.score}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800">{r.title}</h4>
                                    <p className="text-xs text-slate-400">{r.projects?.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
