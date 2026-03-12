export class TimelineRadar {
    static render(container, data) {
        if (!container) return;

        this.container = container;
        this.data = data;
        const { courses, topics, organizations } = data;

        const weeklyData = this.aggregateWeeklyData(courses, topics, organizations);
        const weeks = this.getSemesterWeeks(courses);

        this.container.innerHTML = `
            <div class="timeline-mission-control">
                <div class="timeline-grid-panel">
                    <header class="timeline-panel-header">
                        <p class="timeline-kicker">Mission Control</p>
                        <h3>Educational Weather Radar</h3>
                        <p>Rows map to topics. Columns map to universities. Dot intensity tracks difficulty while size + glow reveal scale and demand spikes.</p>
                    </header>

                    <div class="timeline-main-layout">
                        <aside class="timeline-week-rail">
                            <h4>Semester Clock</h4>
                            ${weeks.map((week) => `
                                <div class="week-rail-item ${week === 7 ? 'spike' : ''}">
                                    <span>Week ${week}</span>
                                    ${week === 7 ? '<em>midterm pressure spike</em>' : ''}
                                </div>
                            `).join('')}
                        </aside>

                        <section class="timeline-stream" id="timeline-stream">
                            ${weeks.map((week) => this.renderWeekRow(week, weeklyData[week] || [], organizations)).join('')}
                        </section>
                    </div>
                </div>

                <aside class="timeline-intel-panel" id="timeline-intel-panel">
                    <p class="timeline-kicker">Intelligence Payload</p>
                    <h3>Select a node</h3>
                    <p>Click a dot to inspect what students are facing in that exact week.</p>
                </aside>
            </div>
        `;

        this.bindEvents();
    }

    static getSemesterWeeks(courses) {
        const weeks = courses.flatMap((course) => (course.syllabus || []).map((item) => item.week));
        const maxWeek = Math.max(9, ...weeks, 0);
        return Array.from({ length: maxWeek }, (_, index) => index + 1);
    }

    static aggregateWeeklyData(courses, topics, organizations) {
        const weeklyData = {};

        courses.forEach((course) => {
            const org = organizations.find((item) => item.id === course.orgId);
            const enrollment = org?.enrollment || 500;

            (course.syllabus || []).forEach((item) => {
                const topic = topics.find((entry) => entry.id === item.topicId);
                if (!topic) return;

                if (!weeklyData[item.week]) {
                    weeklyData[item.week] = [];
                }

                let existing = weeklyData[item.week].find((node) => node.topic.id === topic.id);

                if (!existing) {
                    existing = {
                        week: item.week,
                        topic,
                        universities: [],
                        courses: [],
                        textbooks: [],
                        totalEnrollment: 0,
                        difficulty: topic.difficultyScore,
                        searchVolume: topic.searchVolume
                    };
                    weeklyData[item.week].push(existing);
                }

                existing.universities.push(org);
                existing.courses.push(course);
                if (course.textbook) existing.textbooks.push(course.textbook);
                existing.totalEnrollment += enrollment;
            });
        });

        Object.values(weeklyData).forEach((nodes) => {
            nodes.forEach((node) => {
                node.universities = node.universities.filter(Boolean).filter((org, idx, arr) => arr.findIndex((entry) => entry.id === org.id) === idx);
                node.textbooks = [...new Set(node.textbooks)];
            });
        });

        return weeklyData;
    }

    static renderWeekRow(week, nodes, organizations) {
        if (!nodes.length) {
            return `
                <article class="timeline-week-row">
                    <div class="timeline-week-label">Week ${week}</div>
                    <div class="timeline-week-empty">No major concentration signals mapped this week.</div>
                </article>
            `;
        }

        return `
            <article class="timeline-week-row">
                <div class="timeline-week-label">Week ${week}</div>
                <div class="topic-lane">
                    ${nodes.map((node) => `
                        <div class="topic-node-card">
                            <div class="topic-node-header">
                                <h4>${node.topic.name}</h4>
                                <span>${node.universities.length} universities</span>
                            </div>
                            <div class="dot-row">
                                ${node.universities.map((org) => {
                                    const intensity = this.getIntensityClass(node.difficulty);
                                    const glow = node.searchVolume > 12000 ? 'trending' : '';
                                    const size = this.getNodeSize(node.totalEnrollment);
                                    return `
                                        <button
                                            class="intel-dot ${intensity} ${glow}"
                                            style="--dot-size:${size}px"
                                            data-topic-id="${node.topic.id}"
                                            data-week="${week}"
                                            aria-label="${node.topic.name} at ${org.name} in week ${week}"
                                        ></button>
                                    `;
                                }).join('')}
                            </div>
                            <div class="mini-heatmap">
                                ${organizations.map((org) => {
                                    const taught = node.universities.some((activeOrg) => activeOrg.id === org.id);
                                    return `<span class="mini-cell ${taught ? this.getIntensityClass(node.difficulty) : 'off'}" title="${org.name}"></span>`;
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </article>
        `;
    }

    static getNodeSize(totalEnrollment) {
        return Math.max(14, Math.min(24, Math.round(Math.log10(totalEnrollment + 10) * 8)));
    }

    static getIntensityClass(difficulty) {
        if (difficulty >= 85) return 'high';
        if (difficulty >= 70) return 'medium';
        return 'low';
    }

    static bindEvents() {
        this.container.querySelectorAll('.intel-dot').forEach((dot) => {
            dot.addEventListener('click', () => {
                this.container.querySelectorAll('.intel-dot').forEach((item) => item.classList.remove('selected'));
                dot.classList.add('selected');

                const topicId = dot.dataset.topicId;
                const week = Number(dot.dataset.week);
                this.renderIntelligencePayload(topicId, week);
            });
        });
    }

    static renderIntelligencePayload(topicId, week) {
        const panel = this.container.querySelector('#timeline-intel-panel');
        if (!panel) return;

        const { courses, topics, organizations } = this.data;
        const topic = topics.find((entry) => entry.id === topicId);
        if (!topic) return;

        const activeCourses = courses.filter((course) =>
            (course.syllabus || []).some((item) => item.week === week && item.topicId === topicId)
        );

        const activeUniversities = [...new Set(activeCourses.map((course) => course.orgId))]
            .map((orgId) => organizations.find((org) => org.id === orgId))
            .filter(Boolean);

        const textbooks = [...new Set(activeCourses.map((course) => course.textbook).filter(Boolean))];
        const trendChange = Math.max(0, Math.round(((topic.searchVolume - 5000) / 5000) * 100));
        const assignments = activeCourses.map((course) => `${course.code} problem set due Thursday`);

        panel.innerHTML = `
            <p class="timeline-kicker">Week ${week} Snapshot</p>
            <h3>${topic.name}</h3>

            <div class="intel-block">
                <h4>Universities teaching this week</h4>
                <ul>${activeUniversities.map((org) => `<li>${org.name}</li>`).join('') || '<li>No universities detected.</li>'}</ul>
            </div>

            <div class="intel-block">
                <h4>Textbooks referenced</h4>
                <ul>${textbooks.map((book) => `<li>${book}</li>`).join('') || '<li>No textbook references.</li>'}</ul>
            </div>

            <div class="intel-block">
                <h4>Assignments approaching</h4>
                <ul>${assignments.map((item) => `<li>${item}</li>`).join('') || '<li>No assignment activity found.</li>'}</ul>
            </div>

            <div class="intel-metrics">
                <div>
                    <span>Search demand trend</span>
                    <strong>${trendChange}% increase</strong>
                </div>
                <div>
                    <span>Difficulty signal</span>
                    <strong>${(topic.difficultyScore / 20).toFixed(1)} / 5</strong>
                </div>
            </div>
        `;
    }
}
