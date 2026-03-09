import { MarketModel, IndividualModel } from '../models/CRMModels.js';
import { db } from '../config/firebase.js';
import { collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

class CRMService {
    constructor() {
        this.markets = [];
        this.individuals = [];
    }

    async loadInitialData() {
        // Load default markets
        this.markets = [
            MarketModel({
                id: 'gvsu-cs',
                name: 'Grand Valley State University (CS)',
                type: 'university',
                location: { lat: 42.9699, lng: -85.8885 },
                courseFocus: ['Data Structures', 'OS', 'ML']
            })
        ];

        // Fetch individuals from Firestore
        try {
            const querySnapshot = await getDocs(collection(db, "individuals"));
            this.individuals = querySnapshot.docs.map(doc => doc.data());
            console.log(`CRM Service: Loaded ${this.individuals.length} individuals from Firestore.`);
        } catch (e) {
            console.warn("CRM Service: Failed to fetch from Firestore. Check permissions/auth.");
        }
    }

    async persistIndividuals(individuals) {
        for (const ind of individuals) {
            try {
                await setDoc(doc(db, "individuals", ind.id), ind);
            } catch (e) {
                console.error("Error persisting individual: ", e);
            }
        }
        this.individuals = [...this.individuals, ...individuals];
    }

    getMarkets() { return this.markets; }
    getTopLeads(limit = 10) {
        return [...this.individuals]
            .sort((a, b) => b.hotnessScore - a.hotnessScore)
            .slice(0, limit);
    }
}

export const crmService = new CRMService();