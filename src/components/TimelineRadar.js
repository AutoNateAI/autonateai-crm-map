export class TimelineRadar {
    static render(container, data) {
        if (!container) return;
        this.container = container;
        this.data = data;
        const { courses, topics, organizations } = data;

        // Group data by Week -> Topics
        const weeklyData = this.aggregateWeeklyData(courses, topics, organizations);

        this.container.innerHTML = `
            <div class="radar-control-panel flex h-full min-h-[800px] bg-black/40 rounded-[40px] border border-white/5 overflow-hidden relative">
                
                <!-- THE CLOCK: Vertical Timeline -->
                <div class="timeline-column w-full lg:w-2/3 flex flex-col overflow-y-auto p-10 border-r border-white/5 relative" id="radar-timeline">
                    <div class="absolute top-0 bottom-0 left-[70px] w-[1px] bg-white/10 z-0"></div> <!-- Timeline Line -->
                    
                    ${Array.from({ length: 14 }, (_, i) => i + 1).map(week => {
                        const weekNodes = weeklyData[week] || [];
                        const isMidterm = week === 7 || week === 8;
                        const isFinal = week === 14;
                        
                        return `
                            <div class="timeline-row flex items-center min-h-[100px] relative z-10 group">
                                <!-- Week Label -->
                                <div class="week-label w-[100px] flex-shrink-0 flex flex-col items-center justify-center">
                                    <div class="w-6 h-6 rounded-full ${weekNodes.length > 0 ? 'bg-accent' : 'bg-white/10'} flex items-center justify-center border-[4px] border-[#0a0a0c] relative z-20 transition-all duration-500 group-hover:scale-125 group-hover:shadow-[0_0_15px_var(--accent-glow)]"></div>
                                    <span class="text-xs font-black mt-2 ${weekNodes.length > 0 ? 'text-white' : 'text-white/40'}">W${week}</span>
                                    ${isMidterm ? `<span class="text-[8px] uppercase tracking-widest text-hot font-black mt-1">Midterms</span>` : ''}
                                    ${isFinal ? `<span class="text-[8px] uppercase tracking-widest text-error font-black mt-1">Finals</span>` : ''}
                                </div>
                                
                                <!-- Friction Nodes -->
                                <div class="friction-nodes flex-1 pl-8 flex flex-wrap gap-6 items-center py-4">
                                    ${weekNodes.length === 0 ? `<div class="h-[1px] w-full bg-white/5 border-dashed"></div>` : ''}
                                    ${weekNodes.map(node => this.renderFrictionNode(node, week)).join('')}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <!-- INTELLIGENCE PANEL: Slide-in details -->
                <div class="intelligence-sidebar w-1/3 bg-black/60 backdrop-blur-2xl p-8 transform translate-x-full transition-transform duration-500 absolute right-0 top-0 bottom-0 z-50 border-l border-white/10" id="radar-sidebar">
                    <div class="text-center text-secondary/40 mt-32">Select a friction node to load intelligence payload.</div>
                </div>

            </div>
        `;

        this.bindEvents();
    }

    static aggregateWeeklyData(courses, topics, organizations) {
        const weeklyData = {};
        
        courses.forEach(course => {
            const org = organizations.find(o => o.id === course.orgId);
            const enrollment = org ? org.enrollment : 500;

            course.syllabus.forEach(item => {
                const topic = topics.find(t => t.id === item.topicId);
                if (!topic) return;

                if (!weeklyData[item.week]) weeklyData[item.week] = [];
                
                // Check if topic already exists this week
                let existingNode = weeklyData[item.week].find(n => n.topic.id === topic.id);
                
                if (existingNode) {
                    existingNode.universities.push(course.orgId);
                    existingNode.totalEnrollment += enrollment;
                    existingNode.courses.push(course.code);
                } else {
                    weeklyData[item.week].push({
                        topic: topic,
                        universities: [course.orgId],
                        courses: [course.code],
                        totalEnrollment: enrollment,
                        difficulty: topic.difficultyScore,
                        searchVolume: topic.searchVolume
                    });
                }
            });
        });

        return weeklyData;
    }

    static renderFrictionNode(node, week) {
        // Size = Logarithmic scaling based on enrollment
        const baseSize = 40;
        const sizeIncrement = Math.log10(node.totalEnrollment) * 5;
        const size = Math.min(baseSize + sizeIncrement, 80);

        // Color = Based on Difficulty (0-100)
        let colorClass = 'bg-accent shadow-[0_0_15px_rgba(0,255,204,0.3)]';
        let glowClass = 'shadow-[0_0_20px_var(--accent-glow)]';
        
        if (node.difficulty > 85) {
            colorClass = 'bg-hot shadow-[0_0_20px_rgba(255,102,0,0.4)]';
            glowClass = 'shadow-[0_0_30px_rgba(255,102,0,0.6)]';
        } else if (node.difficulty > 70) {
            colorClass = 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]';
            glowClass = 'shadow-[0_0_20px_rgba(250,204,21,0.4)]';
        }

        const isTrending = node.searchVolume > 15000;
        const pulseAnim = isTrending ? 'animate-pulse' : '';

        return `
            <div class="friction-node-container relative cursor-pointer group/node" 
                 data-topic-id="${node.topic.id}" 
                 data-week="${week}"
                 onclick="window.radarSelectNode('${node.topic.id}', ${week})">
                 
                <!-- The Physical Node -->
                <div class="flex items-center gap-3 bg-white/5 pr-4 rounded-full border border-white/10 transition-all duration-300 group-hover/node:bg-white/10 group-hover/node:border-white/20 hover:scale-105">
                    <div class="flex items-center justify-center rounded-full text-black font-black text-[10px] ${colorClass} ${pulseAnim} transition-all duration-300 group-hover/node:${glowClass}" 
                         style="width: ${size}px; height: ${size}px;">
                         ${node.universities.length}U
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-white whitespace-nowrap">${node.topic.name}</span>
                        <div class="flex items-center gap-2 mt-0.5">
                            <span class="w-1.5 h-1.5 rounded-full ${node.difficulty > 85 ? 'bg-hot' : 'bg-accent'}"></span>
                            <span class="text-[9px] text-secondary tracking-widest uppercase">Diff: ${node.difficulty}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static bindEvents() {
        // Global function to handle node clicks from inline HTML
        window.radarSelectNode = (topicId, week) => {
            console.log(`DEBUG: Selected Topic ${topicId} for Week ${week}`);
            const sidebar = document.getElementById('radar-sidebar');
            const timeline = document.getElementById('radar-timeline');
            
            // Slide in sidebar and shrink timeline slightly
            sidebar.classList.remove('translate-x-full');
            timeline.classList.add('lg:w-2/3');
            timeline.classList.remove('w-full');

            this.renderIntelligencePayload(topicId, week);
        };
    }

    static renderIntelligencePayload(topicId, week) {
        const sidebar = document.getElementById('radar-sidebar');
        const { courses, topics, organizations } = this.data;
        const topic = topics.find(t => t.id === topicId);
        
        if (!topic) return;

        // Find all courses teaching this topic this week
        const activeCourses = courses.filter(c => c.syllabus.some(s => s.week === week && s.topicId === topicId));
        const activeOrgs = Array.from(new Set(activeCourses.map(c => organizations.find(o => o.id === c.orgId))));

        const textbooks = Array.from(new Set(activeCourses.map(c => c.textbook).filter(Boolean)));
        
        sidebar.innerHTML = `
            <div class="h-full flex flex-col relative fade-in">
                <!-- Close Button -->
                <button onclick="document.getElementById('radar-sidebar').classList.add('translate-x-full'); document.getElementById('radar-timeline').classList.add('w-full');" class="absolute -left-4 -top-4 w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 border border-white/10">✕</button>

                <div class="mb-8">
                    <span class="node-label mb-2 inline-block">Week ${week} Payload</span>
                    <h3 class="text-3xl font-black text-white leading-tight mb-2">${topic.name}</h3>
                    <div class="flex items-center gap-2">
                        <span class="px-2 py-1 rounded bg-hot/20 text-hot text-[10px] font-black uppercase tracking-widest border border-hot/30">Difficulty: ${topic.difficultyScore}/100</span>
                        <span class="px-2 py-1 rounded bg-accent/20 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/30">Search Vol: ${topic.searchVolume.toLocaleString()}</span>
                    </div>
                </div>

                <div class="flex-1 overflow-y-auto space-y-8 pr-2">
                    
                    <!-- Execution Trigger -->
                    <div class="bg-gradient-to-r from-accent/20 to-transparent p-5 rounded-2xl border border-accent/30 relative overflow-hidden group cursor-pointer">
                        <div class="relative z-10 flex justify-between items-center">
                            <div>
                                <h4 class="text-xs font-black text-accent uppercase tracking-widest mb-1">Trigger Remotion Factory</h4>
                                <p class="text-[10px] text-white/80">Generate 5 explainer videos for this topic</p>
                            </div>
                            <span class="text-2xl group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>

                    <!-- Universities -->
                    <div>
                        <h4 class="text-[10px] uppercase text-secondary tracking-[0.2em] font-black mb-4 border-b border-white/10 pb-2">Active University Nodes</h4>
                        <div class="space-y-3">
                            ${activeOrgs.map(org => `
                                <div class="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center font-black text-xs text-accent">${org.name.substring(0,2).toUpperCase()}</div>
                                        <span class="text-sm font-bold text-white">${org.name}</span>
                                    </div>
                                    <span class="text-[10px] text-secondary uppercase">${activeCourses.find(c=>c.orgId===org.id)?.code}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Textbooks & Materials -->
                    <div>
                        <h4 class="text-[10px] uppercase text-secondary tracking-[0.2em] font-black mb-4 border-b border-white/10 pb-2">Reference Material</h4>
                        <div class="flex flex-wrap gap-2">
                            ${textbooks.map(tb => `<span class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/80 font-medium">${tb}</span>`).join('')}
                            ${textbooks.length === 0 ? `<span class="text-xs text-secondary italic">No textbooks mapped.</span>` : ''}
                        </div>
                    </div>

                    <!-- Predictable Friction -->
                    <div>
                        <h4 class="text-[10px] uppercase text-secondary tracking-[0.2em] font-black mb-4 border-b border-white/10 pb-2">Cognitive Load Signals</h4>
                        <div class="p-4 rounded-xl bg-hot/10 border border-hot/20">
                            <p class="text-xs text-hot/90 leading-relaxed font-medium">
                                "Students universally struggle with the state-space formulation. High probability of search engine panic queries starting Wednesday night."
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        `;
    }
}
