/**
 * @typedef {Object} Market
 * @property {string} id
 * @property {string} name
 * @property {'university' | 'company' | 'community'} type
 * @property {Object} location
 * @property {number} location.lat
 * @property {number} location.lng
 * @property {string} [description]
 * @property {string[]} [courseFocus]
 */

/**
 * @typedef {Object} Individual
 * @property {string} id
 * @property {string} name
 * @property {string} marketId
 * @property {string} linkedinUrl
 * @property {string} [title]
 * @property {string[]} tags
 * @property {number} hotnessScore - Probability of purchasing the workshop (0-100)
 * @property {number} psychologicalDistance - Graph weight representing relational closeness
 * @property {Object} schedule - Known availability/class times
 * @property {string} [lastInteraction]
 */

/**
 * @typedef {Object} Signal
 * @property {string} id
 * @property {string} individualId
 * @property {string} type - e.g., 'comment', 'message', 'like', 'post_analyzed'
 * @property {string} timestamp
 * @property {string} content
 * @property {Object} extractedData - NLP parsed entities, pain points
 */

/**
 * @typedef {Object} Event
 * @property {string} id
 * @property {string} marketId
 * @property {string} title
 * @property {'class' | 'exam' | 'club_meeting' | 'university_wide'} type
 * @property {string} startTime
 * @property {string} endTime
 * @property {string} [description]
 */

/**
 * @typedef {Object} Strategy
 * @property {string} id
 * @property {string} targetMarketId
 * @property {string} title
 * @property {string} description
 * @property {string[]} bridgeNodeIds - Individuals used to enter the new market
 * @property {Object} executionTimeline
 * @property {'draft' | 'active' | 'completed'} status
 */

export const MarketModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    type: data.type || 'community',
    location: { lat: data.location?.lat || 0, lng: data.location?.lng || 0 },
    description: data.description || '',
    courseFocus: data.courseFocus || []
});

export const IndividualModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    marketId: data.marketId || '',
    linkedinUrl: data.linkedinUrl || '',
    title: data.title || '',
    tags: data.tags || [],
    hotnessScore: data.hotnessScore || 0,
    psychologicalDistance: data.psychologicalDistance || 100, // 100 = completely cold, 0 = highly trusted
    schedule: data.schedule || {},
    lastInteraction: data.lastInteraction || null
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