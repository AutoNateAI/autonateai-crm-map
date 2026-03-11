console.log("DEBUG: IntelligencePanel component script loading...");

export class IntelligencePanel {
    constructor() {
        this.currentIndex = 0;
        this.startX = 0;
        this.isDragging = false;
        this.wasMoved = false;
        this.data = { organizations: [], departments: [] };
        this.onSelect = null;
    }

    render(track, data) {
        console.log("DEBUG: IntelligencePanel.render firing...");
        this.track = track;
        this.data = data;
        const { organizations, departments } = data;
        
        if (!organizations || organizations.length === 0) {
            track.innerHTML = `<div class="text-secondary p-8">No nodes found in this sector.</div>`;
            return;
        }

        track.innerHTML = organizations.map((org, index) => {
            const orgDepts = departments.filter(d => d.orgId === org.id);
            return `
                <div class="intel-card ${index === this.currentIndex ? 'active' : ''}" 
                     data-index="${index}" 
                     data-id="${org.id}" 
                     style="cursor: pointer;">
                    <header class="intel-header p-8">
                        <span class="node-label">Organization Node</span>
                        <h3 class="text-2xl text-accent mb-1">${org.name}</h3>
                        <p class="text-xs text-secondary opacity-60">${org.websiteUrl}</p>
                    </header>
                    
                    <div class="intel-body flex-1 overflow-y-auto p-8 pt-0">
                        <section class="mb-8">
                            <h4 class="text-xs uppercase tracking-widest text-secondary mb-4 opacity-50">Institutional Psychographic</h4>
                            <div class="vibe-box p-6 rounded-2xl bg-white/5 border-l-4 border-accent">
                                <p class="text-lg font-light leading-relaxed">"${org.missionVibe}"</p>
                            </div>
                            <div class="flex-wrap gap-2 mt-4">
                                ${org.culturalSignals.map(s => `<span class="vibe-tag">${s}</span>`).join('')}
                            </div>
                        </section>

                        <section>
                            <h4 class="text-xs uppercase tracking-widest text-secondary mb-4 opacity-50">Active Department Layers</h4>
                            <div class="dept-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                                ${orgDepts.map(dept => `
                                    <div class="dept-card p-5 rounded-xl border border-white/10 bg-white/5">
                                        <h5 class="text-md font-bold text-primary mb-3">${dept.name}</h5>
                                        <div class="flex-wrap gap-1 mb-4">
                                            ${dept.curriculumMap.map(c => `<span class="tag">${c}</span>`).join('')}
                                        </div>
                                        <div class="event-mini-list space-y-2">
                                            ${dept.events.map(e => `
                                                <div class="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                                                    <span class="text-[10px] text-primary truncate mr-2">${e.title}</span>
                                                    <span class="text-[9px] text-accent font-bold">${e.date}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </section>
                    </div>
                </div>
            `;
        }).join('');

        this.initGestures();
        this.bindClicks();
        this.updateCarousel();
    }

    bindClicks() {
        const cards = this.track.querySelectorAll('.intel-card');
        console.log(`DEBUG: IntelligencePanel.bindClicks binding ${cards.length} cards.`);
        cards.forEach(card => {
            // Using pointerup to be safer across devices
            card.onpointerup = (e) => {
                console.log(`DEBUG: Card pointerup. wasMoved: ${this.wasMoved}`);
                if (this.wasMoved) return;
                
                const id = card.dataset.id;
                const org = this.data.organizations.find(o => o.id === id);
                console.log(`DEBUG: Selected Org ID: ${id} -> ${org?.name}`);
                if (this.onSelect && org) this.onSelect(org);
            };
        });
    }

    initGestures() {
        const container = document.getElementById('intelligence-carousel');
        if (!container) return;

        // Ensure we are using pointer events for broader support
        container.onpointerdown = (e) => {
            this.isDragging = true;
            this.wasMoved = false;
            this.startX = e.clientX;
            console.log("DEBUG: Gesture Start");
        };

        container.onpointermove = (e) => {
            if (!this.isDragging) return;
            const currentX = e.clientX;
            const diff = currentX - this.startX;
            
            // If mouse moved more than 5px, it's a drag
            if (Math.abs(diff) > 5) {
                this.wasMoved = true;
            }

            if (Math.abs(diff) > 60) {
                if (diff > 0) this.prev(); else this.next();
                this.isDragging = false;
            }
        };

        container.onpointerup = container.onpointerleave = container.onpointercancel = () => {
            this.isDragging = false;
            console.log("DEBUG: Gesture End");
        };

        window.onkeydown = (e) => {
            if (document.activeElement.tagName === 'INPUT') return;
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        };

        window.addEventListener('resize', () => this.updateCarousel());
    }

    next() {
        if (this.currentIndex < this.data.organizations.length - 1) {
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
        const container = document.getElementById('intelligence-carousel');
        if (!container) return;
        const track = container.querySelector('.intel-carousel-track');
        const cards = track.querySelectorAll('.intel-card');
        if (cards.length === 0) return;

        cards.forEach((card, idx) => {
            card.classList.toggle('active', idx === this.currentIndex);
        });

        const containerWidth = container.offsetWidth;
        const activeCard = cards[this.currentIndex];
        const cardRelativeCenter = activeCard.offsetLeft + (activeCard.offsetWidth / 2);
        const finalTranslate = (containerWidth / 2) - cardRelativeCenter;

        anime({
            targets: track,
            translateX: finalTranslate,
            duration: 800,
            easing: 'spring(1, 80, 15, 0)'
        });
    }

    filter(query) {
        const filteredOrgs = this.data.organizations.filter(org => 
            org.name.toLowerCase().includes(query.toLowerCase()) ||
            org.missionVibe.toLowerCase().includes(query.toLowerCase())
        );
        this.currentIndex = 0;
        this.render(this.track, { ...this.data, organizations: filteredOrgs });
    }
}

export const intelPanel = new IntelligencePanel();
