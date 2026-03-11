import { MarketModel, IndividualModel, OrganizationModel, DepartmentModel } from '../models/CRMModels.js';
import { db } from '../config/firebase.js';
import { collection, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

class CRMService {
    constructor() {
        this.markets = [];
        this.individuals = [];
        this.organizations = [];
        this.departments = [];
    }

    async loadInitialData() {
        console.log("DEBUG: CRMService.loadInitialData started...");
        
        try {
            console.log("DEBUG: Fetching Organizations, Departments, and Individuals...");
            
            const [orgSnap, deptSnap, indSnap] = await Promise.all([
                getDocs(collection(db, "organizations")),
                getDocs(collection(db, "departments")),
                getDocs(collection(db, "individuals"))
            ]);

            this.organizations = orgSnap.docs.map(doc => doc.data());
            this.departments = deptSnap.docs.map(doc => doc.data());
            this.individuals = indSnap.docs.map(doc => doc.data());

            console.log(`DEBUG: Loaded ${this.organizations.length} Orgs, ${this.departments.length} Depts, ${this.individuals.length} Individuals.`);
            
            // Default Market for Map (Legacy compatibility or Base Node)
            this.markets = this.organizations.map(org => MarketModel({
                id: org.id,
                name: org.name,
                type: 'university',
                location: org.location
            }));

        } catch (e) {
            console.warn("DEBUG: WARNING Firestore access issue in loadInitialData:", e);
        }
    }

    async persistOrganization(org) {
        try {
            await setDoc(doc(db, "organizations", org.id), org);
            this.organizations.push(org);
            console.log(`DEBUG: Persisted Organization: ${org.name}`);
        } catch (e) { console.error("Error persisting organization:", e); }
    }

    async persistDepartment(dept) {
        try {
            await setDoc(doc(db, "departments", dept.id), dept);
            this.departments.push(dept);
            console.log(`DEBUG: Persisted Department: ${dept.name}`);
        } catch (e) { console.error("Error persisting department:", e); }
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