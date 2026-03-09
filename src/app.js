import { auth } from './config/firebase.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { crmService } from './services/CRMService.js';
import { DataTransformationService } from './services/DataTransformationService.js';

class App {
    constructor() {
        this.currentView = 'geo-map';
        this.isRegisterMode = false;
        this.init();
    }

    async init() {
        this.bindAuthEvents();
        this.bindNavigation();
        this.bindIngestionZone();
        this.monitorAuthState();
    }

    monitorAuthState() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("Auth Status: Authenticated as", user.email);
                this.onLoginSuccess(user);
            } else {
                console.log("Auth Status: Unauthenticated");
                this.onLogoutSuccess();
            }
        });
    }

    bindAuthEvents() {
        const primaryBtn = document.getElementById('auth-primary-btn');
        const toggleBtn = document.getElementById('auth-toggle-btn');
        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        const errorDiv = document.getElementById('auth-error');

        primaryBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passInput.value;
            errorDiv.classList.add('hidden');

            try {
                if (this.isRegisterMode) {
                    await createUserWithEmailAndPassword(auth, email, password);
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                }
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
            }
        });

        toggleBtn.addEventListener('click', () => {
            this.isRegisterMode = !this.isRegisterMode;
            document.getElementById('auth-title').textContent = this.isRegisterMode ? "Create Account" : "Command Center Access";
            document.getElementById('auth-subtitle').textContent = this.isRegisterMode ? "Register new operator" : "Authentication Required";
            primaryBtn.textContent = this.isRegisterMode ? "Register" : "Initialize Session";
            toggleBtn.textContent = this.isRegisterMode ? "Already have an account? Login" : "Need an account? Register";
        });

        document.getElementById('auth-logout-btn').addEventListener('click', () => {
            signOut(auth);
        });
    }

    async onLoginSuccess(user) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('user-display').textContent = `Operator: ${user.email}`;
        
        await crmService.loadInitialData();
        this.renderView();
    }

    onLogoutSuccess() {
        document.getElementById('app').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('user-display').textContent = "";
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
        if (this.currentView === 'ingestion' || this.currentView === 'crm' || this.currentView === 'geo-map' || this.currentView === 'cognitive-map') {
            const leads = crmService.getTopLeads();
            sidebar.innerHTML = `
                <div class="lead-list">
                    <h3 class="text-xs uppercase text-secondary mb-4">Top Targets (Hotness)</h3>
                    ${leads.length === 0 ? '<p class="text-xs text-secondary">No data ingested yet.</p>' : ''}
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
        }
    }

    bindIngestionZone() {
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-upload');
        if(!dropZone) return;

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
        if(!log) return;
        const entry = document.createElement('div');
        entry.textContent = `> ${message}`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});