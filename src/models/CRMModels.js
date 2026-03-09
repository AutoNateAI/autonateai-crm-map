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
 * @property {number} [engagementScore]
 */

/**
 * @typedef {Object} Signal
 * @property {string} id
 * @property {string} individualId
 * @property {string} type - e.g., 'comment', 'message', 'like'
 * @property {string} timestamp
 * @property {string} content
 */

export const MarketModel = (data) => ({
    id: data.id || crypto.randomUUID(),
    name: data.name || '',
    type: data.type || 'community',
    location: {
        lat: data.location?.lat || 0,
        lng: data.location?.lng || 0
    },
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
    engagementScore: data.engagementScore || 0
});