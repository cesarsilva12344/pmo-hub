import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Spinner, ArrowRight, LockKey } from 'phosphor-react';

export default function Login() {
    const { signIn, user } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signIn(email, password);
        } catch (err) {
            setError(err.message || 'Falha no login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
            {/* Brand Section */}
            <div className="hidden lg:flex relative bg-slate-900 items-center justify-center p-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642427749670-f20e2e76ed8c?q=80&w=2080&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
                <div className="relative z-10 max-w-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">P</div>
                        <span className="text-2xl font-bold text-white tracking-tight">PMO Hub Enterprise</span>
                    </div>
                    <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                        Governança Inteligente para Projetos Complexos.
                    </h1>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Centralize seu portfólio, monitore riscos em tempo real e tome decisões baseadas em dados com o poder da IA.
                    </p>
                </div>
            </div>

            {/* Login Section */}
            <div className="flex items-center justify-center p-8 lg:p-24">
                <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="text-center mb-10">
                        <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-900 border border-slate-100">
                            <LockKey size={24} weight="fill" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
                        <p className="text-slate-500 mt-2">Insira suas credenciais corporativas</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl font-medium flex items-center justify-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="usuario@empresa.com"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Senha</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20"
                        >
                            {loading ? <Spinner className="animate-spin" size={20} /> : <>Entrar <ArrowRight weight="bold" /></>}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <a href="#" className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition">Esqueceu sua senha?</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
