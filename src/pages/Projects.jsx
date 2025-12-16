import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { Plus } from 'phosphor-react';
import { FilterBar } from '../components/v5/FilterBar';
import { ProjectRow } from '../components/v5/ProjectRow';
import { CreateModal } from '../components/v5/CreateModal';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({});
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const availableTags = [
        { id: 'status', label: 'Status', options: ['Em Planejamento', 'Execução', 'Monitoramento', 'Entregue', 'Cancelado'] },
        { id: 'manager', label: 'Gerente', options: ['João Silva', 'Maria Souza'] }, // Mocked
    ];

    useEffect(() => {
        fetchProjects();
        const savedFilters = localStorage.getItem('pmo_v5_saved_view');
        if (savedFilters) {
            try {
                setFilters(JSON.parse(savedFilters));
            } catch (e) {
                console.error('Failed to parse saved filters', e);
            }
        }
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data);
        } catch (err) {
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering logic
    const filteredProjects = projects.filter(p => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            if (key === 'status') return p.status === value;
            if (key === 'manager') return (p.manager_id ? 'João Silva' : 'Não atribuído') === value; // Mock Check
            return true;
        });
    });

    const handleProjectDelete = (id) => {
        setProjects(projects.filter(p => p.id !== id));
    };

    const saveView = () => {
        localStorage.setItem('pmo_v5_saved_view', JSON.stringify(filters));
        alert('Visualização salva! Seus filtros serão aplicados automaticamente ao retornar.');
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
            <header className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Projetos</h1>
                    <p className="text-slate-500 mt-1">Visão integrada do portfólio.</p>
                </div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                >
                    <Plus size={18} weight="bold" />
                    Novo Projeto
                </button>
                <button
                    onClick={saveView}
                    className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2"
                >
                    Salvar Filtros
                </button>
            </header>

            <FilterBar filters={filters} setFilters={setFilters} availableTags={availableTags} />

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider font-semibold text-slate-500">
                            <th className="p-4 py-3">Projeto / PEP</th>
                            <th className="p-4 py-3">Status RAG</th>
                            <th className="p-4 py-3 w-1/3">Progresso (Físico vs Fin.)</th>
                            <th className="p-4 py-3 text-right">Gerente</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="4" className="p-8 text-center text-slate-400">Carregando...</td></tr>}
                        {!loading && filteredProjects.length === 0 && (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-400">Nenhum projeto encontrado.</td></tr>
                        )}
                        {filteredProjects.map(project => (
                            <ProjectRow key={project.id} project={project} onDelete={handleProjectDelete} />
                        ))}
                    </tbody>
                </table>
            </div>
            
            <CreateModal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); fetchProjects(); }} />
        </div>
    );
}
