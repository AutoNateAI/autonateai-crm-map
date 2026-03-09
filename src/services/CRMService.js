import { MarketModel, IndividualModel } from '../models/CRMModels.js';

class CRMService {
    constructor() {
        this.markets = [];
        this.individuals = [];
        this.signals = [];
    }

    async loadInitialData() {
        // Placeholder for future fetch from data/ or API
        console.log('CRM Service: Loading initial market data...');
        this.markets = [
            MarketModel({
                id: 'gvsu-cs',
                name: 'Grand Valley State University (CS)',
                type: 'university',
                location: { lat: 42.9699, lng: -85.8885 },
                courseFocus: ['Data Structures', 'OS', 'ML']
            }),
            MarketModel({
                id: 'uofm-cs',
                name: 'University of Michigan (CS)',
                type: 'university',
                location: { lat: 42.2780, lng: -83.7382 },
                courseFocus: ['Algorithms', 'AI', 'Distributed Systems']
            })
        ];
    }

    getMarkets() {
        return this.markets;
    }

    getIndividualsByMarket(marketId) {
        return this.individuals.filter(ind => ind.marketId === marketId);
    }

    addIndividual(data) {
        const individual = IndividualModel(data);
        this.individuals.push(individual);
        return individual;
    }
}

export const crmService = new CRMService();