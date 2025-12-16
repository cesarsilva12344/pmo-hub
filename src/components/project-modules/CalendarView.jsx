import React, { useEffect, useState } from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export function CalendarView() {
    const { id: projectId } = useParams();
    const [today, setToday] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const start = startOfWeek(startOfMonth(today));
    const end = endOfWeek(endOfMonth(today));
    const days = eachDayOfInterval({ start, end });

    useEffect(() => {
        if (projectId) fetchEvents();
    }, [projectId, today]); // Refetch if month changes (could optimize to fetch range)

    const fetchEvents = async () => {
        setLoading(true);
        try {
            // Fetch Tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('project_id', projectId);

            // Fetch Risks (just as an example of mixed content)
            const { data: risks } = await supabase
                .from('project_risks')
                .select('*')
                .eq('project_id', projectId)
                .gte('probability', 4); // Only high prob risks

            const mappedEvents = [];

            (tasks || []).forEach(t => {
                if (t.end_date) {
                    mappedEvents.push({
                        id: `task-${t.id}`,
                        title: t.name,
                        date: parseISO(t.end_date),
                        color: t.status === 'done' ? 'bg-green-500' : 'bg-blue-500',
                        type: 'task'
                    });
                }
            });

            (risks || []).forEach(r => {
                // Risks don't strictly have dates in this schema, using created_at for demo or we'd need a 'target_date'
                mappedEvents.push({
                    id: `risk-${r.id}`,
                    title: `Risco: ${r.title}`,
                    date: r.created_at ? parseISO(r.created_at) : new Date(),
                    color: 'bg-red-500',
                    type: 'risk'
                });
            });

            setEvents(mappedEvents);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => setToday(addDays(today, 30));
    const prevMonth = () => setToday(addDays(today, -30));

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-[600px] flex flex-col animate-in fade-in">
            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg capitalize text-slate-800">
                        {format(today, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <div className="flex gap-1">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">&lt;</button>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500">&gt;</button>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setToday(new Date())} className="px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">Hoje</button>
                </div>
            </header>

            <div className="grid grid-cols-7 text-center py-2 border-b border-slate-200 bg-slate-50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</div>
                ))}
            </div>

            <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-auto">
                {days.map((day, dayIdx) => {
                    const dayEvents = events.filter(e => isSameDay(e.date, day));
                    return (
                        <div
                            key={day.toString()}
                            className={`
                                relative border-b border-r border-slate-100 p-1 min-h-[100px] hover:bg-slate-50 transition group
                                ${!isSameMonth(day, today) ? 'bg-slate-50/50' : ''}
                            `}
                        >
                            <span className={`
                                text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ml-1
                                ${isSameDay(day, new Date()) ? 'bg-red-500 text-white shadow-md' : 'text-slate-700'}
                                ${!isSameMonth(day, today) ? 'text-slate-300' : ''}
                            `}>
                                {format(day, 'd')}
                            </span>

                            <div className="space-y-1">
                                {dayEvents.map(event => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={event.id}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${event.color} shadow-sm truncate cursor-pointer hover:brightness-110`}
                                        title={event.title}
                                    >
                                        {event.title}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
