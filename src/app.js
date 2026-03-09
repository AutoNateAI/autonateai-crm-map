import { crmService } from './services/CRMService.js';
import { DataTransformationService } from './services/DataTransformationService.js';

class App {
    constructor() {
        this.currentView = 'geo-map';
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        this.bindAuthEvents();
        this.bindNavigation();
        this.bindIngestionZone();
    }

    bindAuthEvents() {
        document.getElementById('auth-login-btn').addEventListener('click', () => {
            // Simplified for now - will wire to Firebase Auth properly
            this.login();
        });

        document.getElementById('auth-logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    async login() {
        this.isAuthenticated = true;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        // Load data after login
        await crmService.loadInitialData();
        this.renderView();
    }

    logout() {
        this.isAuthenticated = false;
        document.getElementById('app').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
    }

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.currentView = e.target.dataset.view;
                navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.view === this.currentView));
                this.renderView();
            });
        });
    }

    renderView() {
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        const activeView = document.getElementById(`view-${this.currentView}`);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('active');
        }

        this.updateSidebarContent();
    }

    updateSidebarContent() {
        const sidebar = document.getElementById('sidebar-content');
        if (this.currentView === 'ingestion' || this.currentView === 'crm') {
            const leads = crmService.getTopLeads();
            sidebar.innerHTML = `
                <div class="lead-list">
                    <h3 class="text-xs uppercase text-secondary mb-4">Top Targets (Hotness)</h3>
                    ${leads.map(l => `
                        <div class="lead-card ${l.hotnessScore > 80 ? 'hot' : ''}">
                            <div class="lead-header">
                                <strong>${l.name}</strong>
                                <span class="badge">${l.hotnessScore}%</span>
                            </div>
                            <p class="text-xs text-secondary">${l.title}</p>
                            <div class="lead-tags">
                                ${l.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            sidebar.innerHTML = `<div class="p-4 text-secondary text-xs">Ready for Command.</div>`;
        }
    }

    bindIngestionZone() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-upload');
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) this.handleFileUpload(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.handleFileUpload(e.target.files[0]);
        });
    }

    async handleFileUpload(file) {
        this.logToConsole(`Parsing file: ${file.name}...`);
        
        if (file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const rawData = JSON.parse(e.target.result);
                    this.logToConsole(`Parsed ${rawData.length} records. Running ANAI Transformation...`);
                    
                    const transformed = DataTransformationService.transformApifyLinkedIn(rawData);
                    this.logToConsole(`Transformation complete. Persisting to Cloud Firestore...`);
                    
                    await crmService.persistIndividuals(transformed);
                    this.logToConsole(`Success! ${transformed.length} leads prioritized and saved.`);
                    this.updateSidebarContent();
                } catch (err) {
                    this.logToConsole(`Error processing data: ${err.message}`);
                    console.error(err);
                }
            };
            reader.readAsText(file);
        } else {
            this.logToConsole(`Unsupported file type. Please use .json for Apify data.`);
        }
    }

    logToConsole(message) {
        const log = document.getElementById('ingestion-log');
        const entry = document.createElement('div');
        entry.textContent = `> ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});