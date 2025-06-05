
import { Settings } from './settings.js';

chrome.action.onClicked.addListener((tab) => {
    if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

async function closeOldTabs() {
    let settings = await Settings.loadFromStorage();
    console.trace(`closeOldTabs (expirationTime: ${settings.tabExpirationMs / (60 * 1000)} min)`);
    chrome.tabs.query({}, tabs => {
        const now = Date.now();
        // --- Debug print
        console.debug(new Map(tabs.map(tab => {
            const timeToExpiration = tab.lastAccessed + settings.tabExpirationMs - now;
            return [
                tab.title,
                Object.assign({}, tab, {
                    isExpired: timeToExpiration <= 0,
                    expirationTimeMin: Math.ceil(timeToExpiration / (60 * 1000)),
                }),
            ]
        })));
        // --- Iterate through all tabs to find the expired ones
        tabs.forEach(tab => {
            // Don't close pinned tabs or the active tab in any window
            if (tab.pinned || tab.active) {
                return;
            }
            const timeSinceLastAccessed = now - tab.lastAccessed;
            if (timeSinceLastAccessed > settings.tabExpirationMs) {
                const timeSinceLastAccessedMin = Math.ceil(timeSinceLastAccessed / (60 * 1000));
                console.info(`Closing tab:`, tab, `(last accessed ${timeSinceLastAccessedMin} min ago)`);
                chrome.tabs.remove(tab.id);
            }
        });
    });
}

chrome.alarms.create('closeOldTabs', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'closeOldTabs') {
        closeOldTabs();
    }
});
