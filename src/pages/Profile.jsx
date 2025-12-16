import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Envelope, Shield, Buildings, IdentificationCard, User } from 'phosphor-react';

export default function Profile() {
    const { user } = useAuth();

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Meu Perfil</h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end gap-6">
                            <div className="w-24 h-24 rounded-xl bg-white p-1 shadow-md">
                                <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-3xl font-bold text-blue-600 border border-slate-200">
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="mb-1">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {user?.user_metadata?.full_name || 'Usuário'}
                                </h2>
                                <p className="text-slate-500 font-medium">Gerente de Projetos</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200 uppercase tracking-wide">
                            Ativo
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                Informações Pessoais
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Envelope size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Email</p>
                                        <p className="font-medium">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <IdentificationCard size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">ID de Usuário</p>
                                        <p className="font-medium font-mono text-sm text-slate-600">{user?.id}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                                Organização
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Buildings size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Departamento</p>
                                        <p className="font-medium">PMO Corporativo</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-slate-700">
                                    <Shield size={20} className="text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Nível de Acesso</p>
                                        <p className="font-medium">Administrador</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
