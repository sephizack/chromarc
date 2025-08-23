
let nextTabId = 1;

export default {

    reset: () => {
        nextTabId = 1;
    },

    newTab: (index, title, active=false, status="complete") => {
        return {
            "active": active,
            "favIconUrl": "https://github.githubassets.com/favicons/favicon-failure-dark.svg",
            "id": nextTabId++,
            "index": index,
            "lastAccessed": 1755605616133.428,
            "status": status,
            "title": title,
            "url": `https://example.com/${title.toLowerCase().replace(/\s+/g, '-')}`,
        };
    },

    asyncCallListeners: async (event, ...args) => {
        for (const listener of event.getListeners()) {
            await listener(...args);
        }
    }

};