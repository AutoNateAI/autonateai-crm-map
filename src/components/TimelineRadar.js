export class TimelineRadar {
    static render(container, data) {
        console.log("DEBUG: TimelineRadar.render starting. Courses:", data?.courses?.length);
        if (!container) return;
        const { courses, topics } = data;

        if (!courses || courses.length === 0) {
            container.innerHTML = `<div class="p-5 text-secondary text-center">No intelligence data found. Seed the graph.</div>`;
            return;
        }

        const weeks = Array.from({ length: 14 }, (_, i) => i + 1);
        const path = this.generateWavePath(courses, topics);
        
        container.innerHTML = `
            <div class="dashboard-layout fade-in">
                <!-- 1. THE DEMAND WAVEFORM (The Weather Radar) -->
                <section class="waveform-portal mb-12 relative overflow-hidden rounded-[50px] bg-black/40 border border-white/5 p-12">
                    <div class="portal-header mb-8 flex justify-between items-center">
                        <div>
                            <span class="node-label">Demand Waveform</span>
                            <h2 class="text-4xl font-black text-white mt-2">Aggregate Learning Friction</h2>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] uppercase tracking-widest text-secondary">Global Sync Status</div>
                            <div class="flex items-center gap-2 text-accent font-bold">
                                <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                                OPTIMAL PRODUCTION WINDOW
                            </div>
                        </div>
                    </div>

                    <!-- SVG Waveform Container -->
                    <div class="waveform-container h-[300px] w-full relative">
                        <svg id="demand-wave" class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1400 300">
                            <!-- Background Grid -->
                            <g stroke="rgba(255,255,255,0.03)" stroke-width="1">
                                ${weeks.map(w => `<line x1="${w * 100}" y1="0" x2="${w * 100}" y2="300" />`).join('')}
                            </g>
                            
                            <!-- The Main Wave (Demand Volume) -->
                            <path id="wave-path" d="${path}" fill="url(#wave-gradient)" stroke="var(--accent)" stroke-width="3" opacity="0.8" />
                            
                            <!-- Gradients -->
                            <defs>
                                <linearGradient id="wave-gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.3" />
                                    <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
                                </linearGradient>
                            </defs>

                            <!-- Cognitive Spike Nodes -->
                            ${this.renderSpikeNodes(courses, topics)}
                        </svg>
                    </div>

                    <!-- Week Timeline Footer -->
                    <div class="flex justify-between mt-8 px-4 border-t border-white/5 pt-6">
                        ${weeks.map(w => `
                            <div class="text-center w-full">
                                <span class="text-[10px] font-black ${w === 7 || w === 8 || w === 14 ? 'text-accent' : 'text-secondary/40'}">W${w}</span>
                            </div>
                        `).join('')}
                    </div>
                </section>

                <!-- 2. PORTAL HUB (Access to other zones) -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${this.renderPortalCard('geo-map', 'Geospatial Radar', 'Mapbox Intelligence Hub', 'Explore University Nodes')}
                    ${this.renderPortalCard('intelligence', 'Universities', 'Meso-Node Analysis', 'Deep-dive into departments')}
                    ${this.renderPortalCard('analytics', 'Metrics Lab', 'Heuristic Insights', 'Calculate content leverage')}
                </div>
            </div>
        `;

        this.animate();
        this.bindPortalClicks();
    }

    static generateWavePath(courses, topics) {
        const points = Array.from({ length: 15 }, (_, w) => {
            let friction = 0;
            courses.forEach(c => {
                const weekTopic = c.syllabus.find(s => s.week === w);
                if (weekTopic) {
                    const topic = topics.find(t => t.id === weekTopic.topicId);
                    if (topic) friction += (topic.difficultyScore * (topic.searchVolume / 10000));
                }
            });
            const y = 280 - Math.min(friction * 2, 250);
            return `${w * 100},${y}`;
        });

        return `M 0,300 L ${points.join(' L ')} L 1400,300 Z`;
    }

    static renderSpikeNodes(courses, topics) {
        let nodes = '';
        const weeks = Array.from({ length: 15 }, (_, i) => i);
        
        weeks.forEach(w => {
            let topTopic = null;
            let maxDiff = 0;
            courses.forEach(c => {
                const wt = c.syllabus.find(s => s.week === w);
                if (wt) {
                    const topic = topics.find(t => t.id === wt.topicId);
                    if (topic && topic.difficultyScore > maxDiff) {
                        maxDiff = topic.difficultyScore;
                        topTopic = topic;
                    }
                }
            });

            if (topTopic && maxDiff > 70) {
                const y = 280 - Math.min(maxDiff * 2, 250);
                nodes += `
                    <circle cx="${w * 100}" cy="${y}" r="6" fill="var(--accent)" class="spike-node">
                        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                    </circle>
                `;
            }
        });
        return nodes;
    }

    static renderPortalCard(view, title, subtitle, desc) {
        return `
            <div class="asset-link-card portal-trigger cursor-pointer group" data-target="${view}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="text-[10px] uppercase font-black text-accent tracking-widest mb-1">${subtitle}</div>
                        <h3 class="text-xl font-bold text-white group-hover:text-accent transition-colors">${title}</h3>
                    </div>
                    <span class="text-xl opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all">→</span>
                </div>
                <p class="text-xs text-secondary leading-relaxed opacity-60">${desc}</p>
            </div>
        `;
    }

    static animate() {
        anime({
            targets: '#wave-path',
            strokeDashoffset: [anime.setDashoffset, 0],
            easing: 'easeInOutSine',
            duration: 2000,
            delay: 500
        });

        anime({
            targets: '.portal-trigger',
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(150),
            easing: 'easeOutExpo'
        });
    }

    static bindPortalClicks() {
        document.querySelectorAll('.portal-trigger').forEach(card => {
            card.onclick = () => {
                const target = card.dataset.target;
                window.dispatchEvent(new CustomEvent('portal-nav', { detail: target }));
            };
        });
    }
}
