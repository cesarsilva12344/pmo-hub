import React, { useState, useEffect, useRef } from 'react';
import { X, PaperPlaneRight, Sparkle, Spinner } from 'phosphor-react';
import { useParams } from 'react-router-dom';
import { aiService } from '../../services/aiService';

export function ContextChat({ isOpen, onClose }) {
    const { id: projectId } = useParams();
    const [messages, setMessages] = useState([
        { role: 'assistant', text: 'Olá! Sou sua IA de PMO. Analiso os dados reais do seu projeto. Como posso ajudar?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [context, setContext] = useState('');
    const scrollRef = useRef(null);

    // Load context when opening or changing project
    useEffect(() => {
        if (isOpen && projectId) {
            loadContext();
        }
    }, [isOpen, projectId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadContext = async () => {
        const ctx = await aiService.buildProjectContext(projectId);
        setContext(ctx);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        // Call Real AI
        const response = await aiService.sendMessage(userMsg, context);

        setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-slate-200 z-[100] flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white">
                <div className="flex items-center gap-2 font-bold">
                    <Sparkle weight="fill" className="text-yellow-300" />
                    PMO AI Assistant
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'
                                }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex items-center gap-2 text-sm text-slate-500">
                            <Spinner className="animate-spin" />
                            Analisando dados do projeto...
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white">
                <div className="relative">
                    <input
                        autoFocus
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Pergunte sobre riscos, status..."
                        className="w-full bg-slate-100 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
                    >
                        <PaperPlaneRight weight="fill" />
                    </button>
                </div>
                <div className="text-[10px] text-center text-slate-400 mt-2">
                    Potencializado por Google Gemini Pro • Dados em Tempo Real
                </div>
            </form>
        </div>
    );
}
