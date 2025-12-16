import React, { useState, useEffect } from 'react';
import { timesheetService } from '../../services/timesheetService';
import { xmlExporter } from '../../utils/xmlExporter';
import { Clock, Plus, Trash, User, DownloadSimple } from 'phosphor-react';
import { useAuth } from '../../contexts/AuthContext';

export function TimesheetView({ project }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [entries, setEntries] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [stats, setStats] = useState({ total: 0, myTotal: 0 });

    // Initial data
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        hours: '1',
        type: 'Transferência S2D',
        observation: ''
    });

    const activityTypes = [
        'Transferência S2D', 'Material de Kick-off', 'Atualização do cronograma',
        'Controle financeiro', 'Daily', 'Atas de Reunião', 'Status Report',
        'Reuniões com gerência', 'Reuniões com clientes', 'Reuniões internas',
        'PDD', 'Acompanhamento GMUD', 'Hypercare', 'Alinhamento KT',
        'Changes Requests', 'Riscos', 'Issue'
    ];

    useEffect(() => {
        if (project?.id) {
            fetchTimesheet();
        }
    }, [project?.id]);

    const fetchTimesheet = async () => {
        try {
            setLoading(true);
            const data = await timesheetService.getProjectEntries(project.id);
            setEntries(data || []);

            // Calculate stats
            const total = data.reduce((acc, curr) => acc + Number(curr.hours || 0), 0);
            const myTotal = data
                .filter(item => item.user_id === user?.id)
                .reduce((acc, curr) => acc + Number(curr.hours || 0), 0);

            setStats({ total, myTotal });
        } catch (error) {
            console.error('Error loading timesheet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await timesheetService.logHours({
                project_id: project.id,
                ...formData
            });
            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                hours: '1',
                type: 'Transferência S2D',
                observation: ''
            });
            fetchTimesheet();
        } catch (error) {
            console.error('Error logging hours:', error);
            alert('Erro ao salvar apontamento');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;

        try {
            await timesheetService.deleteEntry(id);
            fetchTimesheet();
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Erro ao excluir');
        }
    };
    const handleExport = async () => {
        try {
            const xml = await xmlExporter.generateProjectXML(project);
            xmlExporter.downloadXML(`${project.name.replace(/\s+/g, '_')}_timesheet.xml`, xml);
        } catch (error) {
            console.error('Export error:', error);
            alert('Erro ao exportar XML.');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <Clock size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total do Projeto</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.total.toFixed(1)}h</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                        <User size={32} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Meu Apontamento</p>
                        <h3 className="text-2xl font-bold text-slate-900">{stats.myTotal.toFixed(1)}h</h3>
                    </div>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={handleExport}
                        className="w-full h-full min-h-[80px] border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all font-bold"
                    >
                        <DownloadSimple size={24} />
                        Exportar XML
                    </button>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="w-full h-full min-h-[80px] border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 transition-all font-bold"
                    >
                        <Plus size={24} />
                        Novo Apontamento
                    </button>
                </div>
            </div>

            {/* Entry Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-slate-900 mb-4">Registrar Horas</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data</label>
                            <input
                                type="date"
                                required
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Horas</label>
                            <input
                                type="number" step="0.5" min="0.5" required
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg"
                                value={formData.hours}
                                onChange={e => setFormData({ ...formData, hours: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                            <select
                                className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Observação</label>
                                <input
                                    type="text"
                                    placeholder="O que foi feito?"
                                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg"
                                    value={formData.observation}
                                    onChange={e => setFormData({ ...formData, observation: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="bg-blue-600 text-white font-bold px-6 rounded-lg hover:bg-blue-700 h-[42px] self-end">
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold text-xs uppercase border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4">Data</th>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Observação</th>
                            <th className="px-6 py-4 text-right">Horas</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {entries.map(entry => (
                            <tr key={entry.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-3 text-sm text-slate-700">
                                    {new Date(entry.date).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-3 text-sm font-medium text-slate-900 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                        {entry.user?.email?.[0].toUpperCase()}
                                    </div>
                                    {entry.user?.raw_user_meta_data?.full_name || entry.user?.email?.split('@')[0]}
                                </td>
                                <td className="px-6 py-3 text-sm">
                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase truncate max-w-[120px] inline-block ${['Issue', 'Correction'].includes(entry.type) ? 'bg-red-100 text-red-700' :
                                        ['Daily', 'Atas de Reunião', 'Reuniões com gerência', 'Reuniões com clientes', 'Reuniões internas', 'Alinhamento KT'].includes(entry.type) ? 'bg-purple-100 text-purple-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                        {entry.type}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-slate-500 max-w-md truncate" title={entry.observation}>
                                    {entry.observation || '-'}
                                </td>
                                <td className="px-6 py-3 text-sm font-bold text-slate-900 text-right">
                                    {entry.hours}h
                                </td>
                                <td className="px-4 text-right">
                                    {entry.user_id === user.id && (
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && !loading && (
                            <tr>
                                <td colSpan="6" className="px-6 py-8 text-center text-slate-400 text-sm">
                                    Nenhum apontamento registrado ainda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
