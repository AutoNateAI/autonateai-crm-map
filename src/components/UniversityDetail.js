export class UniversityDetail {
    static render(container, org, departments) {
        if (!container || !org) return;

        const orgDepts = departments.filter(d => d.orgId === org.id);

        container.innerHTML = `
            <div class="report-container max-w-6xl mx-auto">
                <!-- HERO SECTION: Institutional Identity -->
                <header class="report-hero border-b border-white/10 pb-12 mb-12">
                    <div class="flex justify-between items-start mb-8">
                        <div>
                            <span class="node-label">Institutional Core Node</span>
                            <h1 class="text-5xl font-black tracking-tighter text-white mt-4 mb-2">${org.name}</h1>
                            <div class="flex items-center gap-4 text-secondary">
                                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-accent"></span> Verified Analytics Node</span>
                                <span class="opacity-40">|</span>
                                <a href="${org.websiteUrl}" target="_blank" class="hover:text-accent transition-colors">${org.websiteUrl} ↗</a>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">Establishment Date</div>
                            <div class="text-xl font-mono font-bold">EST. 2026.03.11</div>
                        </div>
                    </div>

                    <div class="psychoanalytic-summary bg-white/[0.02] p-8 rounded-3xl border border-white/5 relative overflow-hidden">
                        <div class="absolute top-0 right-0 p-4 opacity-10">
                            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                        </div>
                        <h3 class="text-xs uppercase tracking-widest text-accent mb-4 font-black">Mission-Vibe Synthesis</h3>
                        <p class="text-2xl font-light leading-relaxed text-white/90 italic">
                            "${org.missionVibe}"
                        </p>
                        <div class="flex-wrap gap-2 mt-8">
                            ${org.culturalSignals.map(s => `<span class="vibe-tag bg-accent/10 border-accent/20 text-accent font-bold">${s}</span>`).join('')}
                        </div>
                    </div>
                </header>

                <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <!-- LEFT COLUMN: Intelligence Assets -->
                    <aside class="lg:col-span-4 space-y-8">
                        <section class="asset-vault p-8 rounded-3xl bg-black/40 border border-white/5">
                            <h3 class="text-xs uppercase tracking-widest text-secondary mb-8 font-black flex items-center gap-2">
                                <span class="w-1.5 h-1.5 rounded-full bg-accent"></span> Intelligence Assets
                            </h3>
                            <div class="space-y-4">
                                ${this.renderAssetLink("Curriculum Catalog", "Exploration of available degree paths and prerequisites.", "↗")}
                                ${this.renderAssetLink("Research Graph", "Mapping faculty research areas to student personas.", "PDF")}
                                ${this.renderAssetLink("Vibe Forecast", "Predicted cognitive load for the upcoming semester.", "LIVE")}
                            </div>
                        </section>

                        <section class="geo-node p-8 rounded-3xl bg-black/40 border border-white/5">
                            <h3 class="text-xs uppercase tracking-widest text-secondary mb-6 font-black">Geospatial Intelligence</h3>
                            <div class="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                <span class="text-xs text-secondary">Coordinates</span>
                                <span class="font-mono text-sm">${org.location.lat.toFixed(4)}, ${org.location.lng.toFixed(4)}</span>
                            </div>
                        </section>
                    </aside>

                    <!-- RIGHT COLUMN: Departmental Psychoanalytics -->
                    <main class="lg:col-span-8 space-y-12">
                        <h3 class="text-xs uppercase tracking-widest text-accent font-black flex items-center gap-2 mb-4">
                            <span class="w-1.5 h-1.5 rounded-full bg-accent"></span> Active Departmental Layers
                        </h3>
                        
                        ${orgDepts.map(dept => `
                            <article class="dept-layer p-10 rounded-[40px] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 shadow-2xl">
                                <div class="flex justify-between items-start mb-10">
                                    <h4 class="text-3xl font-black text-white">${dept.name}</h4>
                                    <span class="badge py-1.5 px-4 rounded-full bg-accent text-black font-black text-[10px]">MESO NODE</span>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div>
                                        <h5 class="text-[10px] uppercase text-secondary mb-6 tracking-[0.2em] font-black border-b border-white/5 pb-2">Curriculum Cognitive Map</h5>
                                        <div class="flex flex-col gap-3">
                                            ${dept.curriculumMap.map(c => `
                                                <div class="flex items-center gap-3 group">
                                                    <span class="w-1 h-1 rounded-full bg-accent group-hover:scale-150 transition-transform"></span>
                                                    <span class="text-sm font-medium text-white/80">${c}</span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>

                                    <div>
                                        <h5 class="text-[10px] uppercase text-secondary mb-6 tracking-[0.2em] font-black border-b border-white/5 pb-2">Predictable Pressure Events</h5>
                                        <div class="space-y-4">
                                            ${dept.events.map(e => `
                                                <div class="event-report-item bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-accent/30 transition-all">
                                                    <div class="flex justify-between items-start mb-2">
                                                        <span class="text-xs font-bold text-white">${e.title}</span>
                                                        <span class="text-[10px] font-black text-accent">${e.date}</span>
                                                    </div>
                                                    <div class="text-[9px] uppercase tracking-widest text-secondary opacity-60">${e.type}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        `).join('')}
                    </main>
                </div>
            </div>
        `;
    }

    static renderAssetLink(title, desc, icon) {
        return `
            <a href="#" class="asset-link-card group block">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-black text-white/90 group-hover:text-accent transition-colors">${title}</span>
                    <span class="text-xs text-accent font-black">${icon}</span>
                </div>
                <p class="text-[11px] text-secondary leading-normal opacity-60">${desc}</p>
            </a>
        `;
    }
}
