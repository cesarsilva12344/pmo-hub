import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Gear, User, Bell, Lock, CheckCircle, ToggleLeft, ToggleRight, List, Plus, Trash, Tag } from 'phosphor-react';
import { supabase } from '../services/supabase';

export default function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    // Config States
    const [configs, setConfigs] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [activeConfigType, setActiveConfigType] = useState('client'); // client, sector, category

    // Users Management State
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ full_name: '', email: '', role: 'user', hourly_rate: 0 });

    // Profile State
    const [profile, setProfile] = useState({ full_name: user?.user_metadata?.full_name || '', email: user?.email || '' });
    const [notifications, setNotifications] = useState({ email: true, push: false });

    useEffect(() => {
        if (activeTab === 'configurations') fetchConfigs();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        const { data } = await supabase.from('users').select('*').order('full_name');
        setUsers(data || []);
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            // Check if user exists
            const { data: existing } = await supabase.from('users').select('id').eq('email', newUser.email).single();
            if (existing) return alert('Email já cadastrado.');

            // Insert into public.users
            const { error } = await supabase.from('users').insert([{
                email: newUser.email,
                full_name: newUser.full_name,
                role: newUser.role,
                is_active: true
            }]);

            if (error) throw error;

            // Also add to resources for rate
            await supabase.from('resources').insert([{
                email: newUser.email,
                name: newUser.full_name,
                role: newUser.role,
                hourly_rate: newUser.hourly_rate
            }]);

            setNewUser({ full_name: '', email: '', role: 'user', hourly_rate: 0 });
            alert('Usuário pré-cadastrado! Ele deve se inscrever (Sign Up) com este email para acessar.');
            fetchUsers();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar usuário.');
        }
    };

    const handleToggleUserStatus = async (user) => {
        const newStatus = !user.is_active;
        await supabase.from('users').update({ is_active: newStatus }).eq('id', user.id);
        fetchUsers();
    };

    const handleDeleteUser = async (id) => {
        if (!confirm('Excluir usuário permanentemente?')) return;
        await supabase.from('users').delete().eq('id', id);
        fetchUsers();
    };

    const fetchConfigs = async () => {
        const { data } = await supabase.from('app_configurations').select('*').order('value');
        setConfigs(data || []);
    };

    const handleAddConfig = async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        const { error } = await supabase.from('app_configurations').insert([
            { type: activeConfigType, value: newItem.trim() }
        ]);

        if (error) {
            console.error(error);
            alert('Erro ao adicionar item. Verifique se ele já existe.');
        } else {
            setNewItem('');
            fetchConfigs();
        }
    };

    const handleDeleteConfig = async (id) => {
        if (!confirm('Tem certeza que deseja excluir este item?')) return;
        const { error } = await supabase.from('app_configurations').delete().eq('id', id);
        if (!error) fetchConfigs();
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.updateUser({ data: { full_name: profile.full_name } });
        if (!error) {
            setMsg('Salvo com sucesso!');
            setTimeout(() => setMsg(''), 3000);
        }
        setLoading(false);
    };

    const tabs = [
        { id: 'profile', label: 'Meu Perfil', icon: User },
        { id: 'users', label: 'Gestão de Acessos', icon: User, adminOnly: true },
        { id: 'notifications', label: 'Notificações', icon: Bell },
        { id: 'configurations', label: 'Listas e Categorias', icon: List },
        { id: 'security', label: 'Segurança & Senha', icon: Lock },
    ];

    const configTypes = [
        { id: 'client', label: 'Clientes' },
        { id: 'category', label: 'Categorias' },
        { id: 'sector', label: 'Setores' },
    ];

    return (
        <div className="max-w-6xl mx-auto pt-12 px-8 h-full flex flex-col animate-in fade-in">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Configurações</h1>
                <p className="text-slate-500 mt-1">Gerencie preferências da conta e opções do sistema.</p>
            </header>

            <div className="flex flex-col md:flex-row gap-12">
                <nav className="w-full md:w-64 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <tab.icon size={18} weight={activeTab === tab.id ? 'fill' : 'regular'} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="flex-1">
                    {activeTab === 'profile' && (
                        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Informações Pessoais</h3>

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400">
                                        {profile.full_name?.[0]}
                                    </div>
                                    <button className="text-sm font-bold text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition">Alterar Foto</button>
                                </div>

                                <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Nome Completo</label>
                                        <input
                                            value={profile.full_name}
                                            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-slate-900 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Email Corporativo</label>
                                        <input value={profile.email} disabled className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-400 select-none" />
                                    </div>

                                    <div className="pt-4 flex items-center gap-4">
                                        <button disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-black transition flex items-center gap-2 disabled:opacity-50">
                                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                                        </button>
                                        {msg && <span className="text-green-600 text-sm font-medium flex items-center gap-1 animate-in fade-in"><CheckCircle weight="fill" /> {msg}</span>}
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-right-4 duration-500">
                            <h3 className="text-lg font-bold text-slate-800 mb-6">Preferências de Notificação</h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800">Resumo Semanal</p>
                                        <p className="text-xs text-slate-500">Receba um email com s status do portfólio toda segunda.</p>
                                    </div>
                                    <button onClick={() => setNotifications({ ...notifications, email: !notifications.email })}>
                                        {notifications.email ? <ToggleRight size={40} weight="fill" className="text-green-500" /> : <ToggleLeft size={40} className="text-slate-300" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'configurations' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-right-4 duration-500">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <List /> Gerenciar Listas
                            </h3>

                            {/* Type Selector */}
                            <div className="flex gap-2 mb-6">
                                {configTypes.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setActiveConfigType(type.id)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeConfigType === type.id
                                            ? 'bg-slate-100 text-slate-900 border border-slate-300'
                                            : 'text-slate-400 hover:bg-slate-50'
                                            }`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>

                            {/* Add Form */}
                            <form onSubmit={handleAddConfig} className="flex gap-3 mb-8">
                                <input
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder={`Adicionar novo ${configTypes.find(t => t.id === activeConfigType).label.slice(0, -1)}...`}
                                    value={newItem}
                                    onChange={e => setNewItem(e.target.value)}
                                />
                                <button type="submit" className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2">
                                    <Plus weight="bold" /> Adicionar
                                </button>
                            </form>

                            {/* List */}
                            <div className="space-y-2">
                                {configs.filter(c => c.type === activeConfigType).length === 0 && (
                                    <p className="text-center py-8 text-slate-400 italic">Nenhum item cadastrado nesta lista.</p>
                                )}
                                {configs.filter(c => c.type === activeConfigType).map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg group hover:border-slate-300 transition">
                                        <div className="flex items-center gap-3">
                                            <Tag size={16} className="text-slate-400" />
                                            <span className="font-medium text-slate-700">{item.value}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteConfig(item.id)}
                                            className="text-slate-400 hover:text-red-500 p-2 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                                        >
                                            <Trash weight="bold" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {activeTab === 'users' && (
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Usuários e Acessos</h3>
                                    <p className="text-sm text-slate-500">Gerencie quem tem acesso ao PMO Hub.</p>
                                </div>
                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{users.length} Ativos</span>
                            </div>

                            {/* Add User Form */}
                            <form onSubmit={handleAddUser} className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                                    <input required className="w-full p-2 rounded border border-slate-200 text-sm"
                                        value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                                    <input required type="email" className="w-full p-2 rounded border border-slate-200 text-sm"
                                        value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Função / Rate (R$/h)</label>
                                    <div className="flex gap-2">
                                        <select className="w-2/3 p-2 rounded border border-slate-200 text-sm"
                                            value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                            <option value="user">Usuário</option>
                                            <option value="admin">Admin</option>
                                            <option value="manager">Gerente</option>
                                        </select>
                                        <input type="number" className="w-1/3 p-2 rounded border border-slate-200 text-sm" placeholder="R$"
                                            value={newUser.hourly_rate} onChange={e => setNewUser({ ...newUser, hourly_rate: e.target.value })} />
                                    </div>
                                </div>
                                <button type="submit" className="bg-slate-900 text-white font-bold py-2 rounded shadow-lg hover:bg-black transition">
                                    Adicionar
                                </button>
                            </form>

                            {/* List */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 text-xs font-bold text-slate-400 uppercase border-b border-slate-100 pb-2 px-4">
                                    <div className="col-span-4">Usuário</div>
                                    <div className="col-span-4">Email</div>
                                    <div className="col-span-2 text-center">Status</div>
                                    <div className="col-span-2 text-right">Ações</div>
                                </div>
                                {users.map(u => (
                                    <div key={u.id} className="grid grid-cols-12 items-center p-4 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition">
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {u.full_name ? u.full_name[0] : (u.email ? u.email[0].toUpperCase() : '?')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{u.full_name || 'Sem nome'}</p>
                                                <span className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded uppercase">{u.role || 'user'}</span>
                                            </div>
                                        </div>
                                        <div className="col-span-4 text-sm text-slate-500 truncate" title={u.email}>{u.email}</div>
                                        <div className="col-span-2 flex justify-center">
                                            <button onClick={() => handleToggleUserStatus(u)} className={`text-xs px-2 py-1 rounded-full font-bold transition flex items-center gap-1 ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {u.is_active !== false ? <ToggleRight size={16} weight="fill" /> : <ToggleLeft size={16} />}
                                                {u.is_active !== false ? 'Ativo' : 'Inativo'}
                                            </button>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-2">
                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                                <Trash size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
