
import { AppState } from '../services/state.js';

export const Calendar = {
    initialized: false,
    calendarInstance: null,

    render() {
        const container = document.getElementById('calendar-container');
        if (!container) return;

        if (this.initialized) {
            this.calendarInstance.refetchEvents();
            return;
        }

        // Transform Projects to Events
        const events = AppState.projects.map(p => ({
            title: p.name,
            start: p.startDate,
            backgroundColor: p.status === 'Em Risco' ? '#EF4444' : '#3B82F6',
            borderColor: 'transparent'
        }));

        this.calendarInstance = new FullCalendar.Calendar(container, {
            initialView: 'dayGridMonth',
            locale: 'pt-br',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
            },
            events: events,
            height: 'auto',
            editable: true, // Allow drag on calendar
            eventDrop: (info) => {
                // Handle Date Change
                console.log(info.event.title + " moved to " + info.event.start.toISOString());
            }
        });

        this.calendarInstance.render();
        this.initialized = true;
    }
};
