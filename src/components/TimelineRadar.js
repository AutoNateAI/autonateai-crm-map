export class TimelineRadar {
    static render(container, data) {
        console.log("DEBUG: TimelineRadar.render called with data:", data);
        if (!container) return;
        const { courses, topics } = data;

        if (!courses || courses.length === 0) {
            console.warn("DEBUG: No courses found for timeline.");
            container.innerHTML = `<p class="text-secondary p-8">No curriculum data found. Run the Analytics Seed script.</p>`;
            return;
        }

        const weeks = Array.from({ length: 14 }, (_, i) => i + 1);
        console.log(`DEBUG: Rendering timeline for ${courses.length} courses...`);

        container.innerHTML = `
            <div class="timeline-radar-container bg-black/20 rounded-[40px] border border-white/5 p-10 overflow-x-auto">
                <div class="timeline-grid min-w-[1200px]">
                    <!-- HEADER: Weeks -->
                    <div class="timeline-row header-row flex mb-8">
                        <div class="course-label-space w-[250px] flex-shrink-0"></div>
                        <div class="weeks-container flex flex-1 justify-between">
                            ${weeks.map(w => `
                                <div class="week-node text-center w-full">
                                    <div class="text-[10px] uppercase tracking-widest text-secondary mb-2">Week</div>
                                    <div class="text-lg font-black ${w === 7 || w === 8 || w === 14 ? 'text-accent' : 'text-white/40'}">${w}</div>
                                    ${w === 7 || w === 8 ? '<div class="text-[8px] text-accent font-black mt-1">MIDTERMS</div>' : ''}
                                    ${w === 14 ? '<div class="text-[8px] text-accent font-black mt-1">FINALS</div>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- ROWS: Courses -->
                    <div class="course-rows space-y-6">
                        ${courses.map(course => `
                            <div class="timeline-row flex items-center group">
                                <div class="course-info-box w-[250px] flex-shrink-0 pr-8">
                                    <div class="text-xs text-accent font-black mb-1">${course.code}</div>
                                    <div class="text-sm font-bold text-white truncate">${course.name}</div>
                                    <div class="text-[10px] text-secondary opacity-40 uppercase tracking-tighter">University Node ${course.orgId}</div>
                                </div>
                                <div class="course-track flex flex-1 justify-between relative py-4 bg-white/[0.02] rounded-2xl border border-white/5 group-hover:bg-white/[0.04] transition-all">
                                    ${weeks.map(w => {
                                        const weekTopic = course.syllabus.find(s => s.week === w);
                                        const topic = weekTopic ? topics.find(t => t.id === weekTopic.topicId) : null;
                                        
                                        return `
                                            <div class="week-slot w-full flex justify-center items-center relative h-12">
                                                ${topic ? `
                                                    <div class="topic-dot group/topic relative cursor-help">
                                                        <div class="w-3 h-3 rounded-full bg-accent shadow-[0_0_15px_rgba(0,255,204,0.5)] transition-transform group-hover/topic:scale-150"></div>
                                                        <div class="topic-tooltip absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-white/10 backdrop-blur-xl p-3 rounded-xl border border-white/10 opacity-0 invisible group-hover/topic:opacity-100 group-hover/topic:visible transition-all z-50">
                                                            <div class="text-[10px] uppercase text-accent font-black mb-1">${topic.name}</div>
                                                            <div class="text-[9px] text-white/80 leading-tight">High Friction Node. Difficulty: ${topic.difficultyScore}%</div>
                                                        </div>
                                                    </div>
                                                ` : '<div class="w-1 h-1 rounded-full bg-white/10"></div>'}
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- ANALYTICAL OVERLAY: The Demand Waveform -->
            <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="intel-card p-8">
                    <h3 class="text-xs uppercase tracking-widest text-accent mb-4 font-black">Upcoming Spikes</h3>
                    <p class="text-sm text-secondary leading-relaxed">
                        Significant cognitive earthquakes detected in <span class="text-white font-bold">Week 7 (Dynamic Programming)</span> across 12 target university nodes.
                    </p>
                </div>
                <div class="intel-card p-8">
                    <h3 class="text-xs uppercase tracking-widest text-secondary mb-4 font-black">Content Sync Window</h3>
                    <p class="text-sm text-secondary leading-relaxed">
                        Optimal Remotion production window: <span class="text-white font-bold">Week 5-6</span>. LinkedIn teaser drops scheduled for Monday AM.
                    </p>
                </div>
                <div class="intel-card p-8 border-accent/20">
                    <h3 class="text-xs uppercase tracking-widest text-accent mb-4 font-black">Live Pulse</h3>
                    <div class="flex items-center gap-3">
                        <span class="w-3 h-3 rounded-full bg-accent animate-pulse"></span>
                        <span class="text-sm font-bold">System Synchronized to Academic Clock</span>
                    </div>
                </div>
            </div>
        `;
    }
}
