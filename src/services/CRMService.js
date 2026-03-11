import { MarketModel, IndividualModel, OrganizationModel, DepartmentModel, EventModel } from '../models/CRMModels.js';
import { db } from '../config/firebase.js';
import { collection, doc, setDoc, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

class CRMService {
    constructor() {
        this.markets = [];
        this.individuals = [];
        this.organizations = [];
        this.departments = [];
        this.courses = [];
        this.topics = [];
        this.contents = [];
        this.events = [];
    }

    async loadInitialData() {
        console.log("DEBUG: CRMService.loadInitialData started...");
        
        try {
            const fetchCollection = async (name) => {
                console.log(`DEBUG: Fetching collection: ${name}`);
                const snap = await getDocs(collection(db, name));
                console.log(`DEBUG: Received ${snap.docs.length} docs from ${name}`);
                return snap.docs.map(doc => doc.data());
            };

            const [orgs, depts, inds, courses, topics, content, events] = await Promise.all([
                fetchCollection("organizations"),
                fetchCollection("departments"),
                fetchCollection("individuals"),
                fetchCollection("courses"),
                fetchCollection("topics"),
                fetchCollection("content"),
                fetchCollection("events")
            ]);

            this.organizations = orgs;
            this.departments = depts;
            this.individuals = inds;
            this.courses = courses;
            this.topics = topics;
            this.contents = content;
            this.events = events;

            this.generateEventsFromSyllabi();
            console.log("DEBUG: Intelligence Graph synced successfully.");
            
            this.markets = this.organizations.map(org => MarketModel({
                id: org.id,
                name: org.name,
                type: 'university',
                location: org.location
            }));

        } catch (e) {
            console.error("DEBUG: CRITICAL Firestore access issue:", e.code, e.message, e);
        }
    }

    generateEventsFromSyllabi() {
        console.log(`DEBUG: generateEventsFromSyllabi - Processing ${this.courses.length} courses.`);
        this.courses.forEach(course => {
            if (!course.startDate) {
                console.warn(`DEBUG: Course ${course.code} missing startDate.`);
                return;
            }
            
            const startDate = new Date(course.startDate);
            
            course.syllabus.forEach(item => {
                // Calculate date: StartDate + (Week - 1) * 7 days
                const eventDate = new Date(startDate);
                eventDate.setDate(startDate.getDate() + (item.week - 1) * 7);
                
                const topic = this.topics.find(t => t.id === item.topicId);
                
                const event = EventModel({
                    orgId: course.orgId,
                    courseId: course.id,
                    topicId: item.topicId,
                    title: `${course.code}: ${topic?.name || item.topicId}`,
                    type: item.topicId.includes('exam') ? 'exam' : 'class',
                    date: eventDate.toISOString().split('T')[0],
                    description: `Course: ${course.name}`
                });
                
                this.events.push(event);
            });
        });
        console.log(`DEBUG: Total events in CRMService: ${this.events.length}`);
    }

    getAnalyticsData() {
        return {
            organizations: this.organizations,
            courses: this.courses,
            topics: this.topics,
            content: this.contents,
            events: this.events
        };
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