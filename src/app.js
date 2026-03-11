import { auth } from './config/firebase.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { crmService } from './services/CRMService.js';
import { DataTransformationService } from './services/DataTransformationService.js';
import { intelPanel } from './components/IntelligencePanel.js';
import { analyticsPanel } from './components/AnalyticsPanel.js';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.js';
import { UniversityDetail } from './components/UniversityDetail.js';
import { TimelineRadar } from './components/TimelineRadar.js';
import { calendarPanel } from './components/CalendarPanel.js';

// Try to import mapboxConfig, but don't crash if it's missing (e.g. in local dev)
let mapboxConfig = { token: '' };
try {
    const config = await import('./config/mapbox.js');
    if (config && config.mapboxConfig) {
        mapboxConfig = config.mapboxConfig;
        console.log("App: Local Mapbox config loaded.");
    }
} catch (e) {
    console.warn("App: Local Mapbox config not found. Attempting to fetch from Remote Intelligence...");
}

class App {
    constructor() {
        this.currentView = 'timeline'; // SET TIMELINE AS LANDING DASHBOARD
        this.isRegisterMode = false;
        this.map = null;
        console.log("DEBUG: App Constructor - Starting Initialization...");
        this.init();
        this.bindPortalEvents();
    }

    bindPortalEvents() {
        window.addEventListener('portal-nav', (e) => {
            console.log("DEBUG: Portal Navigation Triggered ->", e.detail);
            this.currentView = e.detail;
            
            // Sync navigation active state
            document.querySelectorAll('.nav-item').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === this.currentView);
            });

            this.renderView();
        });
    }

    async init() {
        try {
            console.log("DEBUG: App.init() - Binding Events...");
            this.bindAuthEvents();
            this.bindNavigation();
            this.bindIngestionZone();
            
            console.log("DEBUG: App.init() - Monitoring Auth State...");
            this.monitorAuthState();
            console.log("DEBUG: App.init() - Done.");
        } catch (error) {
            console.error("DEBUG: CRITICAL ERROR during App.init():", error);
        }
    }

    async fetchRemoteConfig() {
        if (mapboxConfig.token) {
            console.log("DEBUG: Mapbox token already present.");
            return;
        }
        
        try {
            console.log("DEBUG: Fetching 'mapbox_token' from Firestore...");
            const remoteToken = await crmService.getRemoteConfig('mapbox_token');
            if (remoteToken) {
                mapboxConfig.token = remoteToken;
                console.log("DEBUG: Remote Mapbox config loaded successfully.");
                if (this.currentView === 'geo-map') this.initMap();
            } else {
                console.warn("DEBUG: Remote Mapbox token returned null.");
            }
        } catch (e) {
            console.error("DEBUG: Failed to fetch remote config:", e);
        }
    }

    monitorAuthState() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("DEBUG: Auth State - User LOGGED IN:", user.email);
                await this.fetchRemoteConfig();
                this.onLoginSuccess(user);
            } else {
                console.log("DEBUG: Auth State - User LOGGED OUT");
                this.onLogoutSuccess();
            }
        });
    }

    bindAuthEvents() {
        console.log("DEBUG: Binding Auth Events...");
        const primaryBtn = document.getElementById('auth-primary-btn');
        const toggleBtn = document.getElementById('auth-toggle-btn');
        const emailInput = document.getElementById('auth-email');
        const passInput = document.getElementById('auth-password');
        const errorDiv = document.getElementById('auth-error');
        const logoutBtn = document.getElementById('auth-logout-btn');

        if (!primaryBtn || !toggleBtn || !logoutBtn) {
            throw new Error("Required Auth DOM elements missing!");
        }

        primaryBtn.addEventListener('click', async () => {
            const email = emailInput.value;
            const password = passInput.value;
            console.log("DEBUG: Auth Primary Btn clicked for:", email);
            
            errorDiv.classList.add('hidden');
            primaryBtn.textContent = "Processing...";
            primaryBtn.disabled = true;

            try {
                if (this.isRegisterMode) {
                    console.log("DEBUG: Attempting Firebase Registration...");
                    await createUserWithEmailAndPassword(auth, email, password);
                } else {
                    console.log("DEBUG: Attempting Firebase Login...");
                    await signInWithEmailAndPassword(auth, email, password);
                }
            } catch (error) {
                console.error("DEBUG: Firebase Auth Error:", error.code, error.message);
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
                primaryBtn.textContent = this.isRegisterMode ? "Register" : "Initialize Session";
                primaryBtn.disabled = false;
            }
        });

        toggleBtn.addEventListener('click', () => {
            this.isRegisterMode = !this.isRegisterMode;
            document.getElementById('auth-title').textContent = this.isRegisterMode ? "Create Account" : "Command Center Access";
            primaryBtn.textContent = this.isRegisterMode ? "Register" : "Initialize Session";
            toggleBtn.textContent = this.isRegisterMode ? "Already have an account? Login" : "Need an account? Register";
        });

        logoutBtn.addEventListener('click', () => {
            console.log("DEBUG: Logout requested.");
            signOut(auth);
        });
    }

    async onLoginSuccess(user) {
        console.log("DEBUG: onLoginSuccess called for:", user.email);
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('user-display').textContent = `Operator: ${user.email}`;
        
        try {
            console.log("DEBUG: Calling crmService.loadInitialData()...");
            await crmService.loadInitialData();
            console.log("DEBUG: Data load complete. Rendering view...");
            this.renderView();
        } catch (e) {
            console.error("DEBUG: ERROR in onLoginSuccess data sequence:", e);
        }
    }

    onLogoutSuccess() {
        document.getElementById('app').classList.add('hidden');
        document.getElementById('auth-screen').classList.remove('hidden');
        document.getElementById('auth-primary-btn').disabled = false;
        document.getElementById('auth-primary-btn').textContent = "Initialize Session";
    }

    bindNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.currentView = e.target.dataset.view;
                console.log("DEBUG: Navigation Click ->", this.currentView);
                navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.view === this.currentView));
                this.renderView();
            });
        });
    }

    renderView() {
        console.log("DEBUG: App.renderView switching to:", this.currentView);
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        const activeView = document.getElementById(`view-${this.currentView}`);
        if (activeView) {
            console.log("DEBUG: Activating container:", `view-${this.currentView}`);
            activeView.classList.remove('hidden');
            activeView.classList.add('active');
        } else {
            console.error("DEBUG: Container not found for view:", this.currentView);
        }

        if (this.currentView === 'geo-map') this.initMap();
        if (this.currentView === 'cognitive-map') this.initCognitiveGraph();
        if (this.currentView === 'intelligence') this.initIntelligenceView();
        if (this.currentView === 'analytics') this.initAnalyticsView();
        if (this.currentView === 'timeline') this.initTimelineView();
        if (this.currentView === 'university-detail') this.initUniversityDetail();
        
        this.updateSidebarContent();
    }

    initTimelineView() {
        console.log("DEBUG: Initializing Educational Weather Radar...");
        const container = document.getElementById('timeline-radar-container');
        if (!container) return;

        const data = crmService.getAnalyticsData();
        TimelineRadar.render(container, data);
    }

    initAnalyticsView() {
        console.log("DEBUG: Initializing Analytics Carousel View...");
        const track = document.getElementById('analytics-track');
        const searchInput = document.getElementById('analytics-search');
        if (!track) return;

        const data = crmService.getAnalyticsData();
        analyticsPanel.render(track, data);

        // Bind Search
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // For now, filtering specific topics within the cards
                console.log("DEBUG: Analytics Search:", e.target.value);
            });
        }
    }

    initIntelligenceView() {
        console.log("DEBUG: Initializing Intelligence Carousel View...");
        const track = document.getElementById('intelligence-track');
        const searchInput = document.getElementById('intel-search');
        if (!track) return;

        const data = {
            organizations: crmService.organizations,
            departments: crmService.departments
        };
        
        intelPanel.render(track, data);

        // Handle Card Selection
        intelPanel.onSelect = (org) => {
            console.log("DEBUG: Navigating to detail for", org.name);
            this.selectedOrg = org;
            this.currentView = 'university-detail';
            this.renderView();
        };

        // Bind Search
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                intelPanel.filter(e.target.value);
            });
        }
    }

    initUniversityDetail() {
        const container = document.getElementById('university-detail-content');
        const backBtn = document.getElementById('back-to-universities');
        
        if (!container || !this.selectedOrg) return;

        UniversityDetail.render(container, this.selectedOrg, crmService.departments);

        backBtn.onclick = () => {
            this.currentView = 'intelligence';
            this.renderView();
        };
    }

    initMap() {
        if (this.map || !mapboxConfig.token) {
            if (!mapboxConfig.token) console.warn("App: Mapbox token missing.");
            return;
        }
        
        console.log("App: Initializing Mapbox...");
        mapboxgl.accessToken = mapboxConfig.token;
        this.map = new mapboxgl.Map({
            container: 'mapbox-container',
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [-85.8885, 42.9699],
            zoom: 10
        });

        this.map.on('load', () => {
            console.log("App: Mapbox loaded.");
            this.renderMapMarkers();
        });
    }

    renderMapMarkers() {
        const markets = crmService.getMarkets();
        markets.forEach(m => {
            const el = document.createElement('div');
            el.className = 'market-marker';
            el.innerHTML = `<div class="marker-pulse"></div>`;

            new mapboxgl.Marker(el)
                .setLngLat([m.location.lng, m.location.lat])
                .setPopup(new mapboxgl.Popup().setHTML(`<h3>${m.name}</h3><p>${m.type}</p>`))
                .addTo(this.map);
        });
    }

    initCognitiveGraph() {
        console.log("DEBUG: Initializing Cytoscape Cognitive Graph...");
        const container = document.getElementById('d3-container');
        if (!container) return;
        
        const orgs = crmService.organizations;
        const depts = crmService.departments;
        const individuals = crmService.getIndividuals();

        const elements = [];

        // Add Organizations as Parent Nodes
        orgs.forEach(org => {
            elements.push({ data: { id: org.id, name: org.name, type: 'org' }, classes: 'org-node' });
        });

        // Add Departments as Compound Nodes (inside Orgs)
        depts.forEach(dept => {
            elements.push({ data: { id: dept.id, parent: dept.orgId, name: dept.name, type: 'dept' }, classes: 'dept-node' });
        });

        // Add Individuals inside Departments
        individuals.forEach(ind => {
            elements.push({ 
                data: { 
                    id: ind.id, 
                    parent: ind.departmentId || 'gvsu-cs', // Fallback for dummy data
                    name: ind.name, 
                    type: 'individual',
                    hotness: ind.hotnessScore 
                }, 
                classes: ind.hotnessScore > 80 ? 'hot-individual' : 'individual-node' 
            });
        });

        if (this.cy) this.cy.destroy();

        this.cy = cytoscape({
            container: container,
            elements: elements,
            style: [
                {
                    selector: 'node[name]', // ONLY NODES WITH NAMES GET LABELS
                    style: {
                        'label': 'data(name)',
                        'color': '#f0f0f5',
                        'font-size': '10px',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'background-color': '#24242e',
                        'border-width': 1,
                        'border-color': '#00ffcc',
                        'width': 40,
                        'height': 40
                    }
                },
                {
                    selector: 'node[type="individual"][hotness]', // ONLY INDIVIDUALS WITH HOTNESS GET SCALED
                    style: {
                        'width': 'mapData(hotness, 0, 100, 20, 60)',
                        'height': 'mapData(hotness, 0, 100, 20, 60)'
                    }
                },
                {
                    selector: ':parent',
                    style: {
                        'background-opacity': 0.05,
                        'background-color': '#00ffcc',
                        'border-color': '#00ffcc',
                        'border-style': 'dashed',
                        'text-valign': 'top',
                        'text-halign': 'center',
                        'padding': '20px'
                    }
                },
                {
                    selector: '.hot-individual',
                    style: {
                        'background-color': '#ff6600',
                        'border-color': '#fff',
                        'border-width': 2
                    }
                }
            ],
            layout: {
                name: 'cose',
                padding: 50,
                animate: true,
                componentSpacing: 100,
                nodeRepulsion: 4000
            }
        });

        // Anime.js interaction animation
        this.cy.on('tap', 'node', (evt) => {
            const node = evt.target;
            console.log("DEBUG: Tapped node", node.data('name'));
            
            anime({
                targets: node.position(),
                x: node.position().x + (Math.random() - 0.5) * 20,
                y: node.position().y + (Math.random() - 0.5) * 20,
                duration: 500,
                easing: 'spring(1, 80, 10, 0)'
            });
        });
    }

    updateSidebarContent() {
        const sidebar = document.getElementById('sidebar-content');
        const leads = crmService.getTopLeads();
        sidebar.innerHTML = `
            <div class="lead-list">
                <h3 class="text-xs uppercase text-secondary mb-4">Priority Intelligence</h3>
                ${leads.map(l => `
                    <div class="lead-card ${l.hotnessScore > 80 ? 'hot' : ''}">
                        <div class="lead-header">
                            <strong>${l.name}</strong>
                            <span class="badge">${l.hotnessScore}%</span>
                        </div>
                        <p class="text-xs text-secondary">${l.title}</p>
                    </div>
                `).join('')}
            </div>
        `;
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
                    const transformed = DataTransformationService.transformApifyLinkedIn(rawData);
                    await crmService.persistIndividuals(transformed);
                    this.logToConsole(`Success! ${transformed.length} leads persisted.`);
                    this.updateSidebarContent();
                } catch (err) { this.logToConsole(`Error: ${err.message}`); }
            };
            reader.readAsText(file);
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

const startApp = () => {
    console.log("DEBUG: Initializing App Instance...");
    new App();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.crmService = crmService;
        console.log("DEBUG: DOMContentLoaded fired.");
        startApp();
    });

} else {
    window.crmService = crmService;
    console.log("DEBUG: DOM already ready. Starting App immediately.");
    startApp();
}

console.log("DEBUG: app.js Script Execution Complete.");