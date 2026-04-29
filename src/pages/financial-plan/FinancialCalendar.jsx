import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financialPlanService } from '../../services';
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar, 
    Clock, 
    MoreHorizontal 
} from 'lucide-react';
import '../../App.css';

const FinancialCalendar = () => {
    const { data: events = [], isLoading } = useQuery({
        queryKey: ['financial-calendar'],
        queryFn: async () => {
            const data = await financialPlanService.getCalendar();
            return data.map(e => ({
                id: e.id,
                date: new Date(e.date).getDate(),
                monthName: new Date(e.date).toLocaleString('default', { month: 'short' }),
                title: e.title,
                amount: parseFloat(e.amount),
                type: e.type,
                color: e.color || (e.type === 'Income' ? 'green' : e.type === 'Investment' ? 'blue' : 'red')
            }));
        }
    });

    const [currentMonth] = useState('February 2026');
    const days = Array.from({ length: 28 }, (_, i) => i + 1);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '400px' }}>
                <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid #E3F2FD', borderTopColor: '#2563EB', borderRadius: '50%' }} />
            </div>
        );
    }

    return (
        <div className="page-fade-in">
            <div className="dashboard-header">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Financial Calendar</h1>
                    <p className="text-muted text-sm mt-1">Timeline of your financial activities</p>
                </div>
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-[var(--border-color)]">
                    <button className="text-muted hover:text-[var(--text-main)]"><ChevronLeft size={20} /></button>
                    <div className="flex items-center gap-2 font-semibold">
                        <Calendar size={18} className="text-[var(--primary)]" />
                        <span>{currentMonth}</span>
                    </div>
                    <button className="text-muted hover:text-[var(--text-main)]"><ChevronRight size={20} /></button>
                </div>
            </div>

            <div className="content-wrapper">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[var(--border-color)] shadow-sm">
                        <div className="grid grid-cols-7 gap-4 mb-4 text-center text-sm font-medium text-muted uppercase tracking-wider">
                            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                        </div>
                        <div className="grid grid-cols-7 gap-4">
                            {[null, null, null].map((_, i) => <div key={`empty-${i}`}></div>)}
                            {days.map(day => {
                                const dayEvents = events.filter(e => e.date === day);
                                return (
                                    <div key={day} className={`min-h-[100px] border border-gray-100 rounded-lg p-2 relative hover:border-[var(--primary)] transition-colors ${dayEvents.length > 0 ? 'bg-gray-50' : ''}`}>
                                        <span className={`text-sm font-medium ${dayEvents.length > 0 ? 'text-[var(--text-main)]' : 'text-muted'}`}>{day}</span>
                                        <div className="mt-2 space-y-1">
                                            {dayEvents.map(event => (
                                                <div key={event.id} className={`text-[10px] truncate px-1.5 py-0.5 rounded font-medium ${event.color === 'green' ? 'bg-green-100 text-green-700' :
                                                    event.color === 'red' ? 'bg-red-100 text-red-700' :
                                                        event.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                                            event.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {event.title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-[var(--border-color)] shadow-sm h-full">
                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-[var(--primary)]" />
                                Upcoming This Month
                            </h3>
                            <div className="space-y-4">
                                {events.length === 0 ? (
                                    <p className="text-center py-8 text-muted">No events scheduled.</p>
                                ) : events.map(event => (
                                    <div key={event.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-bold ${event.color === 'green' ? 'bg-green-50 border-green-100 text-green-700' :
                                            event.color === 'red' ? 'bg-red-50 border-red-100 text-red-700' :
                                                event.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                                    event.color === 'purple' ? 'bg-purple-50 border-purple-100 text-purple-700' :
                                                        'bg-orange-50 border-orange-100 text-orange-700'
                                            }`}>
                                            <span className="text-xs uppercase opacity-70">{event.monthName || 'Feb'}</span>
                                            <span className="text-lg leading-none">{event.date}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-[var(--text-main)]">{event.title}</h4>
                                            <p className="text-xs text-muted">{event.type}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${event.type === 'Income' ? 'text-green-600' : 'text-[var(--text-main)]'}`}>
                                                {event.type === 'Income' ? '+' : '-'}${event.amount.toLocaleString()}
                                            </div>
                                            <MoreHorizontal size={16} className="text-gray-300 ml-auto mt-1 opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinancialCalendar;

