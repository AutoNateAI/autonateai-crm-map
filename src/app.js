import { auth } from './config/firebase.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { crmService } from './services/CRMService.js';
import { DataTransformationService } from './services/DataTransformationService.js';

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
        this.currentView = 'geo-map';
        this.isRegisterMode = false;
        this.map = null;
        console.log("DEBUG: App Constructor - Starting Initialization...");
        this.init();
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
                navItems.forEach(btn => btn.classList.toggle('active', btn.dataset.view === this.currentView));
                this.renderView();
            });
        });
    }

    renderView() {
        console.log("App: Rendering view", this.currentView);
        document.querySelectorAll('.view-container').forEach(view => {
            view.classList.remove('active');
            view.classList.add('hidden');
        });

        const activeView = document.getElementById(`view-${this.currentView}`);
        if (activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('active');
        }

        if (this.currentView === 'geo-map') this.initMap();
        if (this.currentView === 'cognitive-map') this.initCognitiveGraph();
        
        this.updateSidebarContent();
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
        console.log("App: Initializing Cognitive Graph...");
        const container = document.getElementById('d3-container');
        if (!container) return;
        container.innerHTML = '';
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        const individuals = crmService.getIndividuals();
        
        const nodes = individuals.map(ind => ({ id: ind.id, name: ind.name, hotness: ind.hotnessScore }));
        const links = [];
        
        const svg = d3.select("#d3-container").append("svg")
            .attr("width", width)
            .attr("height", height);

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-200))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const node = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", d => 5 + (d.hotness / 10))
            .attr("fill", d => d.hotness > 80 ? "#ff6600" : "#00ffcc")
            .call(d3.drag()
                .on("start", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on("end", (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                }));

        node.append("title").text(d => d.name);

        simulation.on("tick", () => {
            node.attr("cx", d => d.x).attr("cy", d => d.y);
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
        console.log("DEBUG: DOMContentLoaded fired.");
        startApp();
    });
} else {
    console.log("DEBUG: DOM already ready. Starting App immediately.");
    startApp();
}

console.log("DEBUG: app.js Script Execution Complete.");