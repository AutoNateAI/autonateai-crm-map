export class AnalyticsDashboard {
    static render(container, data) {
        if (!container) return;
        const { organizations, courses, topics, content } = data;

        container.innerHTML = `
            ${this.renderOpportunityWidget(topics, content)}
            ${this.renderDifficultyHeatmap(organizations, topics, courses)}
            ${this.renderEnrollmentChart(organizations)}
        `;
    }

    static renderOpportunityWidget(topics, content) {
        const sortedTopics = [...topics].map(t => {
            const coverage = content.filter(c => c.topicId === t.id).length;
            // Content Opportunity Score = (SearchVolume * Difficulty) / (Coverage + 1)
            const score = Math.round((t.searchVolume * t.difficultyScore) / (coverage + 1) / 100);
            return { ...t, coverage, score };
        }).sort((a, b) => b.score - a.score);

        return `
            <div class="intel-card p-6">
                <h3 class="text-md uppercase tracking-widest text-accent mb-6">High-Leverage Content Gaps</h3>
                <div class="space-y-4">
                    ${sortedTopics.slice(0, 5).map(t => `
                        <div class="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                            <div>
                                <div class="font-bold text-primary">${t.name}</div>
                                <div class="text-xs text-secondary">Volume: ${t.searchVolume.toLocaleString()} | Difficulty: ${t.difficultyScore}</div>
                            </div>
                            <div class="text-right">
                                <div class="text-xs uppercase text-accent font-bold">Opportunity Score</div>
                                <div class="text-2xl font-black text-white">${t.score}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    static renderDifficultyHeatmap(orgs, topics, courses) {
        return `
            <div class="intel-card p-6">
                <h3 class="text-md uppercase tracking-widest text-accent mb-6">Topic Difficulty Heatmap</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th class="p-3 text-xs uppercase text-secondary border-b border-white/10">Topic</th>
                                ${orgs.map(org => `<th class="p-3 text-[10px] uppercase text-secondary border-b border-white/10">${org.name.split(' ')[0]}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${topics.slice(0, 8).map(topic => `
                                <tr>
                                    <td class="p-3 text-xs font-bold text-primary border-b border-white/10">${topic.name}</td>
                                    ${orgs.map(org => {
                                        const isTaught = courses.some(c => c.orgId === org.id && c.syllabus.some(s => s.topicId === topic.id));
                                        const intensity = isTaught ? (topic.difficultyScore / 100) : 0;
                                        return `<td class="p-3 border-b border-white/10">
                                            <div class="w-6 h-6 rounded-sm" style="background: rgba(0, 255, 204, ${intensity}); border: 1px solid rgba(255,255,255,0.1)"></div>
                                        </td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    static renderEnrollmentChart(orgs) {
        return `
            <div class="intel-card p-6">
                <h3 class="text-md uppercase tracking-widest text-accent mb-6">Market Node Size (CS Enrollment)</h3>
                <div class="space-y-4">
                    ${orgs.sort((a,b) => b.enrollment - a.enrollment).map(org => {
                        const percent = (org.enrollment / 4000) * 100;
                        return `
                            <div>
                                <div class="flex justify-between text-xs mb-1">
                                    <span class="text-primary font-bold">${org.name}</span>
                                    <span class="text-secondary">${org.enrollment} Students</span>
                                </div>
                                <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div class="h-full bg-accent" style="width: ${percent}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}
