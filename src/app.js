// Import placeholder. Will connect actual Firebase Auth later once config is provided.
// import { auth } from './config/firebase.js';

class App {
    constructor() {
        this.currentView = 'geo-map';
        this.isAuthenticated = false; // Set to true temporarily for dev if needed
        this.init();
    }

    async init() {
        this.bindAuthEvents();
        this.bindNavigation();
        this.bindIngestionZone();
        
        // For local development without Firebase config, you can bypass auth by calling this.login() directly
        // this.login();
    }

    bindAuthEvents() {
        document.getElementById('auth-login-btn').addEventListener('click', () => {
            // Placeholder auth logic
            const email = document.getElementById('auth-email').value;
            const pass = document.getElementById('auth-password').value;
            if(email && pass) {
                this.login();
            } else {
                const err = document.getElementById('auth-error');
                err.textContent = "Credentials required.";
                err.classList.remove('hidden');
            }
        });

        document.getElementById('auth-logout-btn').addEventListener('click', () => {
            this.logout();
        });
    }

    login() {
        this.isAuthenticated = true;
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
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
                
                // Update active state on buttons
                navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.view === this.currentView));
                
                this.renderView();
            });
        });
    }

    renderView() {
        // Hide all views
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        // Show current view
        const activeView = document.getElementById(`view-${this.currentView}`);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('active');
        }

        this.updateSidebarContent();
    }

    updateSidebarContent() {
        const sidebar = document.getElementById('sidebar-content');
        if (this.currentView === 'geo-map') {
            sidebar.innerHTML = `<div class="p-4 text-secondary text-xs">Geo Map Controls</div>`;
        } else if (this.currentView === 'cognitive-map') {
            sidebar.innerHTML = `<div class="p-4 text-secondary text-xs">Graph Filters (Psychological Distance, Hotness)</div>`;
        } else {
            sidebar.innerHTML = '';
        }
    }

    bindIngestionZone() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-upload');

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                this.handleFileUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }

    handleFileUpload(file) {
        this.logToConsole(`Parsing file: ${file.name}...`);
        
        if (file.name.endsWith('.csv')) {
            Papa.parse(file, {
                header: true,
                complete: (results) => {
                    this.logToConsole(`Successfully parsed ${results.data.length} records.`);
                    this.logToConsole(`Ready to transform via CRMService.`);
                    console.log(results.data);
                },
                error: (err) => {
                    this.logToConsole(`Error parsing CSV: ${err.message}`);
                }
            });
        } else if (file.name.endsWith('.json')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.logToConsole(`Successfully parsed JSON array with ${data.length} records.`);
                } catch (err) {
                    this.logToConsole(`Error parsing JSON: Invalid format.`);
                }
            };
            reader.readAsText(file);
        } else {
            this.logToConsole(`Unsupported file type. Please use .csv or .json`);
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