import { MarketModel, IndividualModel } from '../models/CRMModels.js';
import { db } from '../config/firebase.js';
import { collection, doc, setDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

class CRMService {
    constructor() {
        this.markets = [];
        this.individuals = [];
    }

    async loadInitialData() {
        // Default GVSU Market
        const gvsu = MarketModel({
            id: 'gvsu-cs',
            name: 'Grand Valley State University (CS)',
            type: 'university',
            location: { lat: 42.9699, lng: -85.8885 },
            courseFocus: ['Data Structures', 'OS', 'ML']
        });
        
        this.markets = [gvsu];

        try {
            const querySnapshot = await getDocs(collection(db, "individuals"));
            this.individuals = querySnapshot.docs.map(doc => doc.data());
            
            // Add dummy data for visualization testing if empty
            if (this.individuals.length === 0) {
                this.individuals = [
                    IndividualModel({
                        id: 'dummy-1',
                        name: 'Erick Anangwe',
                        marketId: 'gvsu-cs',
                        title: 'MS AI Student at GVSU',
                        hotnessScore: 92,
                        psychologicalDistance: 30,
                        tags: ['ai', 'student']
                    }),
                    IndividualModel({
                        id: 'dummy-2',
                        name: 'Malek Abida',
                        marketId: 'gvsu-cs',
                        title: 'AI Engineer | GVSU AI Graduate',
                        hotnessScore: 88,
                        psychologicalDistance: 45,
                        tags: ['ai', 'swe']
                    })
                ];
            }
            console.log(`CRM Service: Loaded ${this.individuals.length} individuals.`);
        } catch (e) {
            console.warn("CRM Service: Firestore access issue.", e);
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
    getIndividuals() { return this.individuals; }
    getTopLeads(limit = 10) {
        return [...this.individuals]
            .sort((a, b) => b.hotnessScore - a.hotnessScore)
            .slice(0, limit);
    }
}

export const crmService = new CRMService();