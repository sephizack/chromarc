
'use strict';

import { Settings } from './settings.js';

chrome.action.onClicked.addListener((tab) => {
    if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

chrome.commands.onCommand.addListener((command, tab) => {
    console.log(`Command received: ${command}`);
    if (command === 'toggle-side-panel') {
        actionToggleSidePanel(tab);
    }
    else if (command === 'toggle-last-active-tabs') {
        actionToggleLastActiveTabs(tab);
    }
});

async function actionToggleSidePanel(tab) {
    if (chrome.sidePanel) {
        chrome.sidePanel.setOptions({
            enabled: true,
        });
        chrome.sidePanel.open({ windowId: tab.windowId });
        chrome.runtime.sendMessage('closeSidePanel',  (response) => {
            if (response == 'CLOSED') {
                console.log('Side panel closed properly');
            } else {
                console.log('Response from side panel:', response);
            }
        });
    } else {
        console.warn('Side panel API is not available in this browser.');
    }
}

async function actionToggleLastActiveTabs(tab) {
    console.log('Toggling last active tabs');
    chrome.tabs.query({}, tabs => {
        const lastActiveTab = tabs.reduce((mostRecent, tab) => {
            if (tab.active) {
                return mostRecent; // Skip the active tab
            }
            if (!mostRecent || !mostRecent.lastAccessed) {
                return tab; // If no most recent found, return current tab
            }
            if (tab.lastAccessed > mostRecent.lastAccessed) {
                return tab;
            }
            return mostRecent;
        }, null);

        if (lastActiveTab) {
            console.log(`Last active tab: ${lastActiveTab.title} (ID: ${lastActiveTab.id})`);
            // Focus the last active tab
            chrome.tabs.update(lastActiveTab.id, { active: true }, () => {
                console.log(`Focused tab: ${lastActiveTab.title}`);
            });
        } else {
            console.warn('No last active tab found');
        }
    });
}

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
