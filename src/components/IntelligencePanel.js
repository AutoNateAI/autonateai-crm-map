export class IntelligencePanel {
    /**
     * Renders the intelligence dashboard with Org and Dept data
     * @param {HTMLElement} container 
     * @param {Object} data - { organizations: [], departments: [] }
     */
    static render(container, data) {
        console.log("DEBUG: IntelligencePanel.render called with data:", data);
        if (!container) return;
        
        const { organizations, departments } = data;
        
        if (!organizations || organizations.length === 0) {
            console.warn("DEBUG: No organizations to render.");
            container.innerHTML = `<p class="text-secondary">No organization intelligence found. Run the Gemini CLI Researcher to populate data.</p>`;
            return;
        }

        console.log(`DEBUG: Rendering ${organizations.length} organizations...`);

        container.innerHTML = organizations.map(org => {
            const orgDepts = departments.filter(d => d.orgId === org.id);
            return `
                <div class="intel-card mb-8">
                    <header class="intel-header">
                        <div class="flex-col">
                            <span class="badge uppercase mb-2">Organization Node</span>
                            <h3 class="text-xl text-accent">${org.name}</h3>
                            <a href="${org.websiteUrl}" target="_blank" class="text-xs text-secondary underline">${org.websiteUrl}</a>
                        </div>
                    </header>
                    
                    <div class="intel-body grid-2-col gap-8 p-6">
                        <section class="psycho-section">
                            <h4 class="text-sm uppercase text-secondary mb-3">Institutional Vibe</h4>
                            <div class="vibe-box p-4 bg-dark border-r-4">
                                <p class="text-sm italic">"${org.missionVibe}"</p>
                            </div>
                            <div class="signals-list mt-4">
                                <h5 class="text-xs uppercase text-secondary mb-2">Cultural Signals</h5>
                                <div class="flex-wrap gap-2">
                                    ${org.culturalSignals.map(s => `<span class="tag">${s}</span>`).join('')}
                                </div>
                            </div>
                        </section>

                        <section class="dept-section">
                            <h4 class="text-sm uppercase text-secondary mb-3">Department Nodes</h4>
                            ${orgDepts.map(dept => `
                                <div class="dept-card p-4 bg-dark border mb-4">
                                    <h5 class="text-md text-primary mb-2">${dept.name}</h5>
                                    
                                    <div class="mb-3">
                                        <span class="text-xs text-secondary uppercase block mb-1">Curriculum Focus</span>
                                        <div class="flex-wrap gap-1">
                                            ${dept.curriculumMap.map(c => `<span class="tag-xs">${c}</span>`).join('')}
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <span class="text-xs text-secondary uppercase block mb-1">Active Events</span>
                                        <ul class="event-list">
                                            ${dept.events.map(e => `
                                                <li class="text-xs text-primary">• ${e.title} (${e.date})</li>
                                            `).join('')}
                                        </ul>
                                    </div>
                                </div>
                            `).join('')}
                        </section>
                    </div>
                </div>
            `;
        }).join('');
    }
}
