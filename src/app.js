import { crmService } from './services/CRMService.js';

class App {
    constructor() {
        this.currentView = 'map';
        this.init();
    }

    async init() {
        await crmService.loadInitialData();
        this.setupNavigation();
        this.render();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
    }

    switchView(view) {
        this.currentView = view;
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        this.render();
    }

    render() {
        const sidebar = document.getElementById('sidebar-content');
        if (this.currentView === 'map') {
            sidebar.innerHTML = this.renderMarketList();
        } else {
            sidebar.innerHTML = `<div class="p-4">View ${this.currentView} coming soon...</div>`;
        }
    }

    renderMarketList() {
        const markets = crmService.getMarkets();
        return `
            <div class="market-list">
                <h3 class="text-xs uppercase text-secondary mb-4">Active Markets</h3>
                ${markets.map(m => `
                    <div class="market-card" data-id="${m.id}">
                        <h4>${m.name}</h4>
                        <p class="text-xs text-secondary">${m.type}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});