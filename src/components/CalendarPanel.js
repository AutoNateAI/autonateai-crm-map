export class CalendarPanel {
    constructor() {
        this.currentDate = new Date();
        this.view = 'month'; // 'month', 'week', 'day'
        this.data = { events: [], topics: [] };
    }

    render(container, data) {
        this.container = container;
        this.data = data;
        
        this.container.innerHTML = '';
        this.container.className = 'calendar-root flex flex-col h-full bg-black/20 rounded-[40px] border border-white/5 overflow-hidden';

        if (this.view === 'month') this.renderMonth();
        else if (this.view === 'week') this.renderTimeGrid('week');
        else if (this.view === 'day') this.renderTimeGrid('day');
    }

    renderMonth() {
        const month = this.currentDate.getMonth();
        const year = this.currentDate.getFullYear();
        const monthName = this.currentDate.toLocaleString('default', { month: 'long' });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        
        this.container.innerHTML = `
            <div class="calendar-nav p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 class="text-xl font-black text-white">${monthName} ${year}</h3>
                <div class="flex gap-2">
                    <button class="cal-nav-btn p-2 rounded-lg hover:bg-white/10" id="prev-btn">←</button>
                    <button class="cal-nav-btn p-2 rounded-lg hover:bg-white/10" id="next-btn">→</button>
                </div>
            </div>
            <div class="calendar-body flex-1 flex flex-col overflow-hidden">
                <div class="grid grid-cols-7 border-b border-white/5 flex-shrink-0">
                    ${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => `
                        <div class="text-center text-[10px] uppercase font-black text-secondary/40 py-4 border-r border-white/5 last:border-0">${d}</div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-7 grid-rows-6 flex-1 overflow-y-auto">
                    ${this.generateMonthGrid(year, month, firstDay, daysInMonth, prevMonthDays)}
                </div>
            </div>
        `;
        this.bindNav();
    }

    generateMonthGrid(year, month, firstDay, daysInMonth, prevMonthDays) {
        let cells = '';
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            cells += `<div class="p-4 border-r border-b border-white/5 opacity-10 flex flex-col items-start min-h-[100px]">
                <span class="text-xs font-black">${prevMonthDays - i}</span>
            </div>`;
        }

        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEvents = this.data.events.filter(e => e.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            cells += `
                <div class="p-4 border-r border-b border-white/5 min-h-[100px] hover:bg-white/[0.02] transition-all group ${isToday ? 'bg-accent/5' : ''}">
                    <div class="flex justify-between items-start mb-2">
                        <span class="text-xs font-black ${isToday ? 'text-accent' : 'text-white/40 group-hover:text-white/80'}">${i}</span>
                        ${dayEvents.length > 0 ? `<span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>` : ''}
                    </div>
                    <div class="event-stack space-y-1">
                        ${dayEvents.slice(0, 3).map(e => `
                            <div class="text-[9px] px-2 py-1 rounded-md bg-accent/10 border-l-2 border-accent text-white truncate font-bold uppercase tracking-tight">
                                ${e.title.split(':')[1] || e.title}
                            </div>
                        `).join('')}
                        ${dayEvents.length > 3 ? `<div class="text-[8px] text-secondary font-black pl-1">+ ${dayEvents.length - 3} MORE</div>` : ''}
                    </div>
                </div>
            `;
        }

        // Next month fillers to complete the 6x7 grid
        const totalCellsSoFar = firstDay + daysInMonth;
        const remainingCells = 42 - totalCellsSoFar;
        for (let i = 1; i <= remainingCells; i++) {
            cells += `<div class="p-4 border-r border-b border-white/5 opacity-10 flex flex-col items-start min-h-[100px]">
                <span class="text-xs font-black">${i}</span>
            </div>`;
        }

        return cells;
    }

    renderTimeGrid(mode) {
        const daysCount = mode === 'week' ? 7 : 1;
        const hours = Array.from({ length: 24 }, (_, i) => i);
        
        this.container.innerHTML = `
            <div class="calendar-nav p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 class="text-xl font-black text-white">${mode.toUpperCase()} VIEW</h3>
                <div class="text-xs text-secondary font-mono">${this.currentDate.toDateString()}</div>
            </div>
            <div class="time-grid-container flex flex-1 overflow-hidden">
                <div class="hour-labels w-20 flex-shrink-0 border-r border-white/5 overflow-y-auto">
                    ${hours.map(h => `<div class="h-20 text-[9px] text-secondary/40 text-center py-2 font-black border-b border-white/5">${h}:00</div>`).join('')}
                </div>
                <div class="grid-content flex-1 overflow-y-auto relative">
                    <div class="flex h-full min-w-[800px]">
                        ${Array.from({ length: daysCount }).map((_, i) => `
                            <div class="day-column flex-1 border-r border-white/5 last:border-0 relative min-h-[1600px]">
                                ${hours.map(h => `<div class="h-20 border-b border-white/5"></div>`).join('')}
                                ${this.renderTimeGridEvents(i, mode)}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderTimeGridEvents(dayIndex, mode) {
        const events = this.data.events.slice(0, 5);
        return events.map((e, idx) => {
            const top = (idx * 150) + 100;
            return `
                <div class="absolute left-2 right-2 p-3 rounded-xl bg-accent/20 border border-accent/40 backdrop-blur-md shadow-lg" style="top: ${top}px">
                    <div class="text-[10px] font-black text-accent uppercase mb-1">COGNITIVE NODE</div>
                    <div class="text-xs font-bold text-white">${e.title}</div>
                </div>
            `;
        }).join('');
    }

    bindNav() {
        const prev = document.getElementById('prev-btn');
        const next = document.getElementById('next-btn');
        if (prev) prev.onclick = () => { 
            this.currentDate.setMonth(this.currentDate.getMonth() - 1); 
            this.renderMonth(); 
        };
        if (next) next.onclick = () => { 
            this.currentDate.setMonth(this.currentDate.getMonth() + 1); 
            this.renderMonth(); 
        };
    }
}

export const calendarPanel = new CalendarPanel();
