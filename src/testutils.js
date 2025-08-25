
let nextTabId = 1;

export default {

    /**
     * Resets the test utilities to initial state.
     */
    reset: () => {
        nextTabId = 1;
    },

    /**
     * Creates a new mock tab object for testing.
     * @param {number} index - The index of the tab.
     * @param {string} title - The title of the tab.
     * @param {boolean} [active] - Whether the tab is active.
     * @param {string} [status] - The loading status of the tab.
     * @returns {object} A mock tab object.
     */
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

    /**
     * Asynchronously calls all listeners for an event.
     * @param {object} event - The event object with listeners.
     * @param {...any} args - Arguments to pass to the listeners.
     */
    asyncCallListeners: async (event, ...args) => {
        for (const listener of event.getListeners()) {
            await listener(...args);
        }
    }

};