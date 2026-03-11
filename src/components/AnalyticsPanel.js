export class AnalyticsPanel {
    constructor() {
        this.currentIndex = 0;
        this.startX = 0;
        this.isDragging = false;
        this.data = { organizations: [], courses: [], topics: [], content: [] };
    }

    render(track, data) {
        this.track = track;
        this.data = data;
        const { organizations, courses, topics, content } = data;

        // Define the specific cards we want in the carousel
        const cards = [
            { id: 'content-gaps', title: 'High-Leverage Content Gaps', type: 'gaps' },
            { id: 'difficulty-heatmap', title: 'Topic Difficulty Heatmap', type: 'heatmap' },
            { id: 'market-nodes', title: 'Market Node Size (Enrollment)', type: 'enrollment' }
        ];

        track.innerHTML = cards.map((card, index) => {
            return `
                <div class="intel-card ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
                    <header class="intel-header p-8">
                        <span class="node-label">Analytics Dimension</span>
                        <h3 class="text-2xl text-accent mb-1">${card.title}</h3>
                        <p class="text-xs text-secondary opacity-60">Strategic data-driven insights</p>
                    </header>
                    
                    <div class="intel-body flex-1 overflow-y-auto p-8 pt-0">
                        ${this.renderCardContent(card.type, data)}
                    </div>
                </div>
            `;
        }).join('');

        this.initGestures();
        this.updateCarousel();
    }

    renderCardContent(type, data) {
        if (type === 'gaps') return this.renderGaps(data.topics, data.content);
        if (type === 'heatmap') return this.renderHeatmap(data.organizations, data.topics, data.courses);
        if (type === 'enrollment') return this.renderEnrollment(data.organizations);
        return '';
    }

    renderGaps(topics, content) {
        const sortedTopics = [...topics].map(t => {
            const coverage = content.filter(c => c.topicId === t.id).length;
            const score = Math.round((t.searchVolume * t.difficultyScore) / (coverage + 1) / 100);
            return { ...t, coverage, score };
        }).sort((a, b) => b.score - a.score);

        return `
            <div class="space-y-4">
                ${sortedTopics.map(t => `
                    <div class="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/10">
                        <div>
                            <div class="font-bold text-lg text-primary">${t.name}</div>
                            <div class="text-xs text-secondary mt-1">Volume: ${t.searchVolume.toLocaleString()} | Difficulty: ${t.difficultyScore}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] uppercase text-accent font-black tracking-widest">Opportunity</div>
                            <div class="text-2xl font-black text-white">${t.score}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderHeatmap(orgs, topics, courses) {
        return `
            <div class="overflow-x-auto bg-black/20 rounded-2xl border border-white/5">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th class="p-4 text-xs uppercase text-secondary border-b border-white/10">Topic</th>
                            ${orgs.map(org => `<th class="p-4 text-[10px] uppercase text-secondary border-b border-white/10 text-center">${org.name.split(' ')[0]}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${topics.map(topic => `
                            <tr>
                                <td class="p-4 text-xs font-bold text-primary border-b border-white/10">${topic.name}</td>
                                ${orgs.map(org => {
                                    const isTaught = courses.some(c => c.orgId === org.id && c.syllabus.some(s => s.topicId === topic.id));
                                    const intensity = isTaught ? (topic.difficultyScore / 100) : 0;
                                    return `<td class="p-4 border-b border-white/10 text-center">
                                        <div class="w-8 h-8 rounded-lg mx-auto" style="background: rgba(0, 255, 204, ${intensity}); border: 1px solid rgba(0, 255, 204, ${intensity + 0.1}); box-shadow: 0 0 15px rgba(0, 255, 204, ${intensity / 2})"></div>
                                    </td>`;
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderEnrollment(orgs) {
        return `
            <div class="space-y-6">
                ${orgs.sort((a,b) => b.enrollment - a.enrollment).map(org => {
                    const percent = (org.enrollment / 4000) * 100;
                    return `
                        <div class="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <div class="flex justify-between items-end mb-3">
                                <div>
                                    <div class="text-lg font-bold text-primary">${org.name}</div>
                                    <div class="text-xs text-secondary">Primary University Node</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xl font-black text-accent">${org.enrollment}</div>
                                    <div class="text-[10px] uppercase text-secondary">CS Students</div>
                                </div>
                            </div>
                            <div class="w-full h-3 bg-black/40 rounded-full overflow-hidden p-[2px]">
                                <div class="h-full bg-gradient-to-r from-accent to-[#00d4aa] rounded-full" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    initGestures() {
        const container = document.getElementById('analytics-carousel');
        if (!container) return;

        container.onmousedown = container.ontouchstart = (e) => this.handleStart(e);
        container.onmousemove = container.ontouchmove = (e) => this.handleMove(e);
        container.onmouseup = container.onmouseleave = container.ontouchend = () => this.handleEnd();

        window.addEventListener('resize', () => this.updateCarousel());
    }

    handleStart(e) {
        this.isDragging = true;
        this.startX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    }

    handleMove(e) {
        if (!this.isDragging) return;
        const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const diff = currentX - this.startX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) this.prev(); else this.next();
            this.isDragging = false;
        }
    }

    handleEnd() { this.isDragging = false; }

    next() {
        const max = 3; // Number of analytics dimensions
        if (this.currentIndex < max - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }

    updateCarousel() {
        const container = document.getElementById('analytics-carousel');
        if (!container) return;
        const track = container.querySelector('.intel-carousel-track');
        const cards = track.querySelectorAll('.intel-card');
        if (cards.length === 0) return;

        cards.forEach((card, idx) => {
            card.classList.toggle('active', idx === this.currentIndex);
        });

        const containerWidth = container.offsetWidth;
        const activeCard = cards[this.currentIndex];
        const cardRelativeLeft = activeCard.offsetLeft;
        const cardWidth = activeCard.offsetWidth;
        const cardRelativeCenter = cardRelativeLeft + (cardWidth / 2);
        
        const finalTranslate = (containerWidth / 2) - cardRelativeCenter;

        anime({
            targets: track,
            translateX: finalTranslate,
            duration: 800,
            easing: 'spring(1, 80, 15, 0)'
        });
    }
}

export const analyticsPanel = new AnalyticsPanel();
