/**
 * @typedef {Object} Organization
 * @property {string} id
 * @property {string} name
 * @property {string} websiteUrl
 * @property {string} missionVibe - LLM distilled core mission/values
 * @property {string[]} culturalSignals - Key institutional markers
 * @property {Object} location
 * @property {number} location.lat
 * @property {number} location.lng
 */

/**
 * @typedef {Object} Department
 * @property {string} id
 * @property {string} orgId
 * @property {string} name
 * @property {string[]} curriculumMap - Active course topics (Data Structures, OS, ML)
 * @property {string[]} techStackFocus - Tools and technologies emphasized
 * @property {Object[]} events - Upcoming academic/career events
 */

/**
 * @typedef {Object} PsychographicProfile
 * @property {string} personaType - e.g., 'The LeetCode Grinder', 'Startup Hacker'
 * @property {number} cognitiveLoadEstimate - Scale 0-100 based on current events
 * @property {number} contextWindowSize - Mental capacity/focus area estimate
 * @property {string[]} activeInterests - Currently engaged technical topics
 */

/**
 * @typedef {Object} Individual
 * @property {string} id
 * @property {string} name
 * @property {string} marketId
 * @property {string} departmentId
 * @property {string} linkedinUrl
 * @property {string} [title]
 * @property {string[]} tags
 * @property {number} hotnessScore - Probability of purchasing (0-100)
 * @property {number} psychologicalDistance - Relational weight (0-100)
 * @property {PsychographicProfile} [psychographic]
 */

export const MarketModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    type: data.type || 'university',
    location: { lat: data.location?.lat || 0, lng: data.location?.lng || 0 },
    description: data.description || '',
    courseFocus: data.courseFocus || []
});

export const OrganizationModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    websiteUrl: data.websiteUrl || '',
    missionVibe: data.missionVibe || '',
    culturalSignals: data.culturalSignals || [],
    location: { lat: data.location?.lat || 0, lng: data.location?.lng || 0 }
});

export const DepartmentModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    orgId: data.orgId || '',
    name: data.name || '',
    curriculumMap: data.curriculumMap || [],
    techStackFocus: data.techStackFocus || [],
    events: data.events || []
});

export const IndividualModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    marketId: data.marketId || '',
    departmentId: data.departmentId || '',
    linkedinUrl: data.linkedinUrl || '',
    title: data.title || '',
    tags: data.tags || [],
    hotnessScore: data.hotnessScore || 0,
    psychologicalDistance: data.psychologicalDistance || 100,
    psychographic: data.psychographic || {
        personaType: 'unknown',
        cognitiveLoadEstimate: 50,
        contextWindowSize: 50,
        activeInterests: []
    }
});

export const EventModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    marketId: data.marketId || '',
    title: data.title || '',
    type: data.type || 'class',
    startTime: data.startTime || new Date().toISOString(),
    endTime: data.endTime || new Date().toISOString(),
    description: data.description || ''
});

export const StrategyModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    targetMarketId: data.targetMarketId || '',
    title: data.title || '',
    description: data.description || '',
    bridgeNodeIds: data.bridgeNodeIds || [],
    executionTimeline: data.executionTimeline || {},
    status: data.status || 'draft'
});