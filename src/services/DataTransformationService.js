import { IndividualModel } from '../models/CRMModels.js';

export class DataTransformationService {
    /**
     * Transforms raw Apify LinkedIn JSON into ANAI Individual models
     * @param {Array} rawData 
     * @returns {Array} Transformed individuals
     */
    static transformApifyLinkedIn(rawData) {
        return rawData.map(item => {
            const headline = item.headline || '';
            const location = item.location || '';
            const mutualsMatch = item.additionalInfo?.match(/(\d+)\s+mutual/);
            const mutualCount = mutualsMatch ? parseInt(mutualsMatch[1]) : 0;

            // Calculate Hotness Score (0-100)
            let hotness = 40; // Base score
            
            // Context Resonance: Is it GVSU?
            if (headline.includes('GVSU') || headline.includes('Grand Valley')) hotness += 25;
            
            // Topic Resonance: AI/ML Focus
            if (/(AI|ML|LLM|Data|Machine Learning|Intelligence)/i.test(headline)) hotness += 20;
            
            // Urgency: Job hunting
            if (/(Open for|Looking for|Seeking)/i.test(headline)) hotness += 10;
            
            // Social proof: Mutual connections
            hotness += (mutualCount * 0.5);

            // Cap at 100
            hotness = Math.min(Math.round(hotness), 100);

            // Calculate Psychological Distance
            // 2nd degree = closer, 3rd degree = further
            let psychDistance = item.distance === '2nd' ? 50 : 80;
            psychDistance -= (mutualCount * 2); // More mutuals = less distance
            psychDistance = Math.max(psychDistance, 10);

            return IndividualModel({
                id: item.id,
                name: item.fullName,
                marketId: headline.includes('GVSU') ? 'gvsu-cs' : 'unknown',
                linkedinUrl: item.profileUrl,
                title: headline,
                hotnessScore: hotness,
                psychologicalDistance: psychDistance,
                tags: this.extractTags(headline)
            });
        });
    }

    static extractTags(headline) {
        const tags = [];
        if (headline.includes('Data')) tags.push('data');
        if (headline.includes('AI') || headline.includes('Intelligence')) tags.push('ai');
        if (headline.includes('Software') || headline.includes('Engineer')) tags.push('swe');
        if (headline.includes('Student')) tags.push('student');
        return tags;
    }
}