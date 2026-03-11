export class IntelligencePanel {
    constructor() {
        this.currentIndex = 0;
        this.startX = 0;
        this.isDragging = false;
        this.data = { organizations: [], departments: [] };
    }

    /**
     * Renders the intelligence carousel with swipe and search support
     * @param {HTMLElement} track 
     * @param {Object} data 
     */
    render(track, data) {
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
                <div class="intel-card ${index === this.currentIndex ? 'active' : ''}" data-index="${index}">
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
        this.updateCarousel();
    }

    initGestures() {
        const container = document.getElementById('intelligence-carousel');
        if (!container) return;

        // Clear existing to avoid double binding
        container.onmousedown = container.ontouchstart = (e) => this.handleStart(e);
        container.onmousemove = container.ontouchmove = (e) => this.handleMove(e);
        container.onmouseup = container.onmouseleave = container.ontouchend = () => this.handleEnd();

        // Keyboard/Trackpad Support
        window.onkeydown = (e) => {
            if (document.activeElement.tagName === 'INPUT') return; // Don't swipe while searching
            if (e.key === 'ArrowRight') this.next();
            if (e.key === 'ArrowLeft') this.prev();
        };
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

    handleEnd() {
        this.isDragging = false;
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
        const cards = this.track.querySelectorAll('.intel-card');
        if (cards.length === 0) return;

        cards.forEach((card, idx) => {
            card.classList.toggle('active', idx === this.currentIndex);
        });

        // PERFECT FLEX CENTERING:
        const container = document.getElementById('intelligence-carousel');
        const containerWidth = container.offsetWidth;
        const activeCard = cards[this.currentIndex];
        
        // Offset is (Container Center) - (Active Card Relative Center)
        // OffsetParent of the card is the track.
        const cardRelativeLeft = activeCard.offsetLeft;
        const cardWidth = activeCard.offsetWidth;
        const cardRelativeCenter = cardRelativeLeft + (cardWidth / 2);
        
        const finalTranslate = (containerWidth / 2) - cardRelativeCenter;

        console.log(`DEBUG: Carousel [i=${this.currentIndex}] Centering: Container ${containerWidth}, CardMid ${cardRelativeCenter} -> Translate ${finalTranslate}px`);

        anime({
            targets: this.track,
            translateX: finalTranslate,
            duration: 800,
            easing: 'spring(1, 80, 15, 0)'
        });
    }

    /**
     * Filters the intelligence view based on search query
     * @param {string} query 
     */
    filter(query) {
        const filteredOrgs = this.data.organizations.filter(org => 
            org.name.toLowerCase().includes(query.toLowerCase()) ||
            org.missionVibe.toLowerCase().includes(query.toLowerCase())
        );
        
        // Temporarily override data for filtered render
        const originalData = this.data;
        this.currentIndex = 0;
        this.render(this.track, { ...this.data, organizations: filteredOrgs });
        this.data = originalData; // Restore original for next filter
    }
}

export const intelPanel = new IntelligencePanel();
